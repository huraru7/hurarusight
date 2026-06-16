/* =============================================================
   particles.js — ファーストビュー背景の粒子アニメ（Three.js）
   柔らかな点が広がり、ゆっくり漂う静かな背景。
   ============================================================= */

import * as THREE from "three";

const COUNT = 900; // 粒子の数（軽め）
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export class ParticleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.running = false;
    this.clock = new THREE.Clock();
    this.mouse = { x: 0, y: 0 };

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.z = 6;

    this._buildParticles();

    this._onResize = () => this.resize();
    window.addEventListener("resize", this._onResize);

    if (!REDUCED) {
      this._onMove = (e) => {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener("pointermove", this._onMove, { passive: true });
    }

    this.resize();
  }

  _buildParticles() {
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6; // z（奥行き）
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x7a7890, // 白背景で見える柔らかな墨色
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });

    this.points = new THREE.Points(geo, mat);
    this.scene.add(this.points);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (REDUCED) this.renderer.render(this.scene, this.camera); // 静的に1枚だけ
  }

  start() {
    if (this.running || REDUCED) return; // reduced-motion では動かさない
    this.running = true;
    this._loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this._raf);
  }

  _loop = () => {
    if (!this.running) return;
    const t = this.clock.getElapsedTime();

    // 全体をゆっくり回し、わずかに上下に呼吸させる
    this.points.rotation.y = t * 0.03;
    this.points.position.y = Math.sin(t * 0.25) * 0.15;

    // マウスにほんの少しだけ視点を寄せる（奥行き感）
    this.camera.position.x += (this.mouse.x * 0.4 - this.camera.position.x) * 0.03;
    this.camera.position.y += (-this.mouse.y * 0.3 - this.camera.position.y) * 0.03;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
    this._raf = requestAnimationFrame(this._loop);
  };

  dispose() {
    this.stop();
    window.removeEventListener("resize", this._onResize);
    if (this._onMove) window.removeEventListener("pointermove", this._onMove);
    this.points.geometry.dispose();
    this.points.material.dispose();
    this.renderer.dispose();
  }
}

/* ---- 起動: ファーストビューの背景として動かす ---- */
const canvas = document.getElementById("particle-canvas");
if (canvas) {
  const field = new ParticleField(canvas);
  field.start();
  window.huraruParticles = field; // 後から調整できるように公開
}
