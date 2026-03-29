import { useEffect, useRef } from "react";

const VERT = `#version 300 es
precision highp float;
in vec4 position;
void main(){ gl_Position = position; }`;

/** Slow-moving obsidian / dark marble — WebGL2 fragment shader */
const FRAG = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}
void main(){
  vec2 uv = (FC - 0.5 * R) / min(R.x, R.y);
  vec2 p = uv * 2.2 + vec2(T * 0.03, T * 0.02);
  float n = fbm(p + fbm(p + T * 0.05));
  float veins = smoothstep(0.35, 0.95, abs(sin(n * 8.0 + uv.x * 3.0)));
  vec3 ink = vec3(0.055, 0.047, 0.031);
  vec3 deep = vec3(0.12, 0.08, 0.06);
  vec3 gold = vec3(0.79, 0.66, 0.30);
  vec3 col = mix(ink, deep, n);
  col = mix(col, col * 1.15 + gold * 0.08, veins * 0.35);
  col += gold * 0.04 * smoothstep(0.2, 0.9, n);
  float vign = 1.0 - length(uv) * 0.55;
  col *= vign;
  O = vec4(col, 1.0);
}`;

export function MarbleBackground({ className, style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2");
    if (!gl) return;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(s));
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      console.error(gl.getProgramInfoLog(prog));

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]),
      gl.STATIC_DRAW,
    );
    const pos = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "resolution");
    const uTime = gl.getUniformLocation(prog, "time");

    let raf;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const render = (now) => {
      gl.clearColor(0.055, 0.047, 0.031, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, now * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        touchAction: "none",
        ...style,
      }}
    />
  );
}
