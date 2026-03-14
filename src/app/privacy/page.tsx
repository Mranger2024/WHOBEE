import React from 'react';
import LegalLayout from '@/components/ui/LegalLayout';

export default function PrivacyPolicy() {
    return (
        <LegalLayout
            title="Privacy Policy"
            lastUpdated="March 14, 2026"
            icon="shield"
        >
            <p>
                At WHOBEE, your privacy is our top priority. We built this platform from the ground up to ensure that you can connect with people globally without sacrificing your personal information.
            </p>

            <h2>1. Information We Collect</h2>
            <p>
                <strong>We do not require you to create an account.</strong> Therefore, we do not collect your name, email address, phone number, or social media profiles.
            </p>
            <p>
                When you use WHOBEE, we temporarily collect and process:
            </p>
            <ul>
                <li><strong>Connection Data:</strong> IP addresses and basic browser metadata to establish WebRTC P2P connections and protect against DDoS attacks.</li>
                <li><strong>Preferences:</strong> Your selected matching preferences (e.g., region, gender preference) strictly to facilitate the matchmaking process.</li>
            </ul>

            <h2>2. WebRTC and Video Streams</h2>
            <p>
                WHOBEE utilizes <strong>WebRTC (Web Real-Time Communication)</strong> to establish direct Peer-to-Peer (P2P) connections between users.
            </p>
            <ul>
                <li>Your video and audio streams are sent <strong>directly</strong> to the person you are chatting with.</li>
                <li><strong>We do not route your media through our servers</strong>, nor do we record, monitor, or store your video or audio communications.</li>
            </ul>

            <h2>3. End-to-End Encrypted Text Chat</h2>
            <p>
                Our text chat feature utilizes modern Web Crypto APIs (ECDH + AES-GCM) to establish a secure, ephemeral session key between you and your partner.
            </p>
            <ul>
                <li>Text messages are encrypted on your device and can only be decrypted by your partner's device.</li>
                <li>Our signaling servers only transmit encrypted ciphertexts and <strong>cannot read</strong> your messages.</li>
            </ul>

            <h2>4. Data Retention</h2>
            <p>
                Since we do not require accounts, there is no persistent user data to retain. Connection logs and rate-limiting data are automatically purged. Session metadata exists only for the duration of your active connection.
            </p>

            <h2>5. Contact Us</h2>
            <p>
                If you have any questions or concerns regarding our privacy practices, please reach out to us via our <a href="/contact">Contact Page</a>.
            </p>
        </LegalLayout>
    );
}
