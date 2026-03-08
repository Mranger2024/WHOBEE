/**
 * Web Crypto API utilities for End-to-End Encryption (E2E)
 * Uses ECDH over P-256 for key exchange and AES-256-GCM for message encryption.
 * Everything runs entirely in the browser. Keys never leave the client.
 */

// 1. Generate an ephemeral ECDH key pair for a chat session
export async function generateE2EKeyPair(): Promise<CryptoKeyPair> {
    return await window.crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true, // keys are extractable
        ['deriveKey'] // used to derive the shared AES secret
    );
}

// 2. Export the public key to JSON Web Key (JWK) format to send to the partner
export async function exportPublicKey(key: CryptoKey): Promise<JsonWebKey> {
    return await window.crypto.subtle.exportKey('jwk', key);
}

// 3. Import the partner's public key (JWK) back into a CryptoKey
export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return await window.crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        [] // Public keys aren't used for crypto operations directly in ECDH
    );
}

// 4. Combine my private key + partner's public key to derive the exact same shared AES secret
export async function deriveSharedSecret(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
    return await window.crypto.subtle.deriveKey(
        { name: 'ECDH', public: publicKey },
        privateKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

// Helper to convert Uint8Array or ArrayBuffer to base64 safely
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Helper to convert base64 to Uint8Array safely
function base64ToBuffer(base64: string): Uint8Array {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

export interface EncryptedPayload {
    iv: string; // Base64 Initialization Vector
    data: string; // Base64 Encrypted ciphertext
}

// 5. Encrypt a text message with the shared AES secret
export async function encryptMessage(sharedSecret: CryptoKey, text: string): Promise<EncryptedPayload> {
    const encoded = new TextEncoder().encode(text);
    // AES-GCM requires a unique 12-byte IV for every single encryption operation
    const ivArray = window.crypto.getRandomValues(new Uint8Array(12));
    const iv = new Uint8Array(ivArray.buffer) as Uint8Array;

    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as any },
        sharedSecret,
        encoded as any
    );

    return {
        iv: bufferToBase64(iv),
        data: bufferToBase64(encryptedBuffer)
    };
}

// 6. Decrypt a message from the partner using the shared AES secret
export async function decryptMessage(sharedSecret: CryptoKey, payload: EncryptedPayload): Promise<string> {
    const iv = base64ToBuffer(payload.iv);
    const encryptedData = base64ToBuffer(payload.data);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as any },
        sharedSecret,
        encryptedData as any
    );

    return new TextDecoder().decode(decryptedBuffer);
}
