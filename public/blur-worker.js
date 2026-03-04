// public/blur-worker.js

let blurAmount = 100; // Start at max blur (100)
let canvas;
let gl;
let program;
let positionBuffer;
let texCoordBuffer;
let texture;

// Vertex shader source
const vsSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = a_texCoord;
    }
`;

// Fragment shader source (Box Blur)
const fsSource = `
    precision mediump float;
    uniform sampler2D u_image;
    uniform vec2 u_resolution; // The size of the texture
    uniform float u_blur;     // Blur amount (radius)
    varying vec2 v_texCoord;

    void main() {
        vec4 color = vec4(0.0);
        float total = 0.0;
        
        // Define kernel size based on blur amount
        // Limit kernel loop to avoid performance hit on very high blur
        // Box blur is cheaper than Gaussian
        float radius = u_blur;

        // Optimization: If blur is 0, just sample safely
        if (radius <= 0.5) {
            gl_FragColor = texture2D(u_image, v_texCoord);
            return;
        }

        // Apply Box Blur (simplified 2-pass effect in 1 pass for now, or just small kernel)
        // For larger blur, we might need to skip pixels to keep loop small
        for (float x = -4.0; x <= 4.0; x++) {
            for (float y = -4.0; y <= 4.0; y++) {
                // Scale offset by radius
                vec2 offset = vec2(x, y) * (radius / 4.0);
                color += texture2D(u_image, v_texCoord + offset / u_resolution);
                total += 1.0;
            }
        }

        gl_FragColor = color / total;
    }
`;

function initWebGL() {
    canvas = new OffscreenCanvas(640, 480); // Initial size, updates on frame
    gl = canvas.getContext('webgl', {
        preserveDrawingBuffer: false,
        alpha: false,
        desynchronized: true
    });

    if (!gl) {
        console.error("WebGL not supported in worker");
        return false;
    }

    // Create shader program
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return false;

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        return false;
    }

    gl.useProgram(program);

    // Look up locations
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

    // Create buffers
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1,
    ]), gl.STATIC_DRAW);

    texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 1,
        1, 1,
        0, 0,
        0, 0,
        1, 1,
        1, 0,
    ]), gl.STATIC_DRAW);

    // Setup attributes
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(texCoordLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Create texture
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return true;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function processFrame(frame, controller) {
    if (!gl) {
        frame.close(); // Drop frame if WebGL failed
        return;
    }

    const width = frame.displayWidth;
    const height = frame.displayHeight;

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
    }

    if (blurAmount <= 0) {
        // Just draw the frame directly (or could use simple 2D if needed, but staying in GL is better)
        // With blur 0, the shader samples directly.
    }

    // Upload video frame to texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame);

    // Set uniforms
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const blurLocation = gl.getUniformLocation(program, "u_blur");
    const imageLocation = gl.getUniformLocation(program, "u_image");

    // Map 0-100 input to a reasonable shader radius (e.g., 0-40)
    // 100 -> ~40px radius (very blurry)
    // 0 -> 0px (clear)
    const effectiveBlur = (blurAmount / 100) * 40;

    gl.uniform2f(resolutionLocation, width, height);
    gl.uniform1f(blurLocation, effectiveBlur);
    gl.uniform1i(imageLocation, 0);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Create new frame from canvas
    // We must clone or create new VideoFrame because the canvas will be reused
    const newFrame = new VideoFrame(canvas, { timestamp: frame.timestamp });

    frame.close();
    controller.enqueue(newFrame);
}

const transformer = new TransformStream({
    start() {
        initWebGL();
    },
    transform(frame, controller) {
        processFrame(frame, controller);
    }
});

self.onmessage = (event) => {
    if (event.data.type === 'STREAM') {
        const { readable, writable } = event.data;
        readable.pipeThrough(transformer).pipeTo(writable);
    }
    else if (event.data.type === 'SET_BLUR') {
        blurAmount = event.data.value;
    }
};
