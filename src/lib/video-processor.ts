export class VideoProcessor {
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    private program: WebGLProgram | null = null;
    private video: HTMLVideoElement;
    private stream: MediaStream | null = null;
    private animationFrameId: number | null = null;
    private videoFrameCallbackId: number | null = null;
    private blurAmount: number = 20; // Default blur
    private width: number;
    private height: number;
    private texture: WebGLTexture | null = null;
    private isRunning: boolean = false;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;

        // Attempt to get WebGL context with preservedDrawingBuffer to prevent flickering
        const gl = this.canvas.getContext("webgl", {
            preserveDrawingBuffer: true,
            alpha: false, // We don't need alpha for video
            depth: false, // We don't need depth buffer
            antialias: false // We don't need antialiasing for blur
        });

        if (!gl) {
            throw new Error("WebGL not supported");
        }
        this.gl = gl;

        this.video = document.createElement("video");
        this.video.muted = true;
        this.video.playsInline = true;
        this.video.width = width;
        this.video.height = height;

        this.initGL();
    }

    private initGL() {
        const gl = this.gl;

        // Vertex shader
        const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = a_texCoord;
      }
    `;

        // Fragment shader (Simple Box Blur for efficiency)
        const fsSource = `
      precision mediump float;
      uniform sampler2D u_image;
      uniform vec2 u_resolution;
      uniform float u_blur;
      varying vec2 v_texCoord;

      void main() {
        vec4 color = vec4(0.0);
        float total = 0.0;
        float radius = u_blur; 
        
        if (radius <= 0.0) {
            gl_FragColor = texture2D(u_image, v_texCoord);
            return;
        }

        // Reduced kernel size for performance while maintaining blur look
        // 5x5 kernel is usually enough for this effect
        for (float x = -2.0; x <= 2.0; x++) {
          for (float y = -2.0; y <= 2.0; y++) {
            vec2 offset = vec2(x, y) * radius / u_resolution;
            color += texture2D(u_image, v_texCoord + offset);
            total += 1.0;
          }
        }
        
        gl_FragColor = color / total;
      }
    `;

        const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);

        if (!vertexShader || !fragmentShader) return;

        this.program = this.createProgram(gl, vertexShader, fragmentShader);
        gl.useProgram(this.program);

        // Look up locations
        const positionLocation = gl.getAttribLocation(this.program!, "a_position");
        const texCoordLocation = gl.getAttribLocation(this.program!, "a_texCoord");

        // Provide texture coordinates for the rectangle.
        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                0.0, 0.0,
                1.0, 0.0,
                0.0, 1.0,
                0.0, 1.0,
                1.0, 0.0,
                1.0, 1.0,
            ]),
            gl.STATIC_DRAW
        );
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        // Create a buffer for the position of the rectangle corners.
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1.0, -1.0,
                1.0, -1.0,
                -1.0, 1.0,
                -1.0, 1.0,
                1.0, -1.0,
                1.0, 1.0,
            ]),
            gl.STATIC_DRAW
        );
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Create a texture.
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    private createShader(gl: WebGLRenderingContext, type: number, source: string) {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    private createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
        const program = gl.createProgram();
        if (!program) return null;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    public async start(stream: MediaStream) {
        if (this.isRunning) return; // Prevent double start
        this.isRunning = true;
        this.stream = stream;
        this.video.srcObject = stream;

        try {
            await this.video.play();
            this.runLoop();
        } catch (e) {
            console.error("VideoProcessor: failed to play video", e);
        }
    }

    private runLoop() {
        if (!this.isRunning) return;

        if ('requestVideoFrameCallback' in this.video) {
            this.videoFrameCallbackId = (this.video as any).requestVideoFrameCallback(this.renderCallback);
        } else {
            this.render(); // Fallback to rAF
        }
    }

    public setBlur(amount: number) {
        this.blurAmount = amount;
    }

    public getStream(fps: number = 30): MediaStream {
        return this.canvas.captureStream(fps);
    }

    public stop() {
        this.isRunning = false;

        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        if (this.videoFrameCallbackId !== null && 'cancelVideoFrameCallback' in this.video) {
            (this.video as any).cancelVideoFrameCallback(this.videoFrameCallbackId);
            this.videoFrameCallbackId = null;
        }

        this.video.pause();
        this.video.srcObject = null;
    }

    private renderCallback = (now: DOMHighResTimeStamp, metadata: any) => {
        if (!this.isRunning) return;
        this.draw();
        this.videoFrameCallbackId = (this.video as any).requestVideoFrameCallback(this.renderCallback);
    }

    private render = () => {
        if (!this.isRunning) return;

        // Fallback loop check
        if (this.video.paused || this.video.ended) {
            // If video paused unexpectedly, try to keep loop alive or just return?
            // If paused, we can't get new frames.
            this.animationFrameId = requestAnimationFrame(this.render);
            return;
        }

        this.draw();
        this.animationFrameId = requestAnimationFrame(this.render);
    }

    private draw() {
        if (!this.gl || !this.program || !this.video) return;

        const gl = this.gl;
        const width = this.width;
        const height = this.height;

        // Update texture
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);

        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);

        // Set uniforms
        const resolutionLocation = gl.getUniformLocation(this.program, "u_resolution");
        const blurLocation = gl.getUniformLocation(this.program, "u_blur");

        gl.uniform2f(resolutionLocation, width, height);
        gl.uniform1f(blurLocation, this.blurAmount);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}
