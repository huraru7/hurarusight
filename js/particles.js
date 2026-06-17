/* =============================================================
   particles.js — ファーストビュー背景の粒子アニメ（Three.js）
   水色の粒がいくつかの形（球・波・らせん・環）に集まり、数秒ごとに
   次の形へモーフして巡回する。
   ★ 調整値はすべて data/settings.js の particles から読み込みます。
   ============================================================= */

import * as THREE from "three";
import { settings } from "../data/settings.js";

const P = settings.particles;
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 形（ターゲット座標）ジェネレータ ----------
   (count, scale) を受け取り、長さ count*3 の Float32Array を返す。 */

const SHAPE_GENERATORS = {
  sphere(count, scale) {
    const a = new Float32Array(count * 3);
    const r = scale;
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      a[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      a[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      a[i * 3 + 2] = r * Math.cos(phi);
    }
    return a;
  },
  wave(count, scale) {
    const a = new Float32Array(count * 3);
    const n = Math.ceil(Math.sqrt(count));
    const spread = scale * 2.46;
    const amp = scale * 0.35;
    for (let i = 0; i < count; i++) {
      const gx = (i % n) / (n - 1);
      const gz = Math.floor(i / n) / (n - 1);
      const x = (gx - 0.5) * spread;
      const z = (gz - 0.5) * spread;
      a[i * 3] = x;
      a[i * 3 + 1] = Math.sin(x * 0.9 + z * 0.6) * amp;
      a[i * 3 + 2] = z;
    }
    return a;
  },
  spiral(count, scale) {
    const a = new Float32Array(count * 3);
    const arms = 3;
    const turns = 2.6;
    const rMax = scale * 1.15;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const r = Math.sqrt(t) * rMax;
      const arm = i % arms;
      const ang = r * turns + (arm / arms) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      a[i * 3] = Math.cos(ang) * r;
      a[i * 3 + 1] = Math.sin(ang) * r;
      a[i * 3 + 2] = (Math.random() - 0.5) * scale * 0.15;
    }
    return a;
  },
  ring(count, scale) {
    const a = new Float32Array(count * 3);
    const R = scale;
    const tube = scale * 0.21;
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const u = (i / count) * Math.PI * 2;
      const v = i * golden;
      a[i * 3] = (R + tube * Math.cos(v)) * Math.cos(u);
      a[i * 3 + 1] = (R + tube * Math.cos(v)) * Math.sin(u);
      a[i * 3 + 2] = tube * Math.sin(v);
    }
    return a;
  },

  // ハート（パラメトリック曲線の内側を埋める）
  heart(count, scale) {
    const a = new Float32Array(count * 3);
    const S = scale / 15;
    for (let i = 0; i < count; i++) {
      const t = Math.random() * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y =
        13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 3.5; // 中心化
      const f = Math.sqrt(Math.random()); // 内部を埋める
      a[i * 3] = x * S * f;
      a[i * 3 + 1] = y * S * f;
      a[i * 3 + 2] = (Math.random() - 0.5) * scale * 0.16;
    }
    return a;
  },

  // 5つ星（中心から伸びる5本の腕。根元ほど太く先細り）
  star(count, scale) {
    const a = new Float32Array(count * 3);
    const arms = 5;
    for (let i = 0; i < count; i++) {
      const base = Math.floor(Math.random() * arms) * ((Math.PI * 2) / arms) - Math.PI / 2;
      const rN = Math.pow(Math.random(), 0.6);
      const r = rN * scale * 1.15;
      const off = (Math.random() - 0.5) * 2 * (1 - rN) * scale * 0.34;
      a[i * 3] = Math.cos(base) * r + Math.cos(base + Math.PI / 2) * off;
      a[i * 3 + 1] = Math.sin(base) * r + Math.sin(base + Math.PI / 2) * off;
      a[i * 3 + 2] = (Math.random() - 0.5) * scale * 0.12;
    }
    return a;
  },

  // 二重らせん（縦に伸びる2本の螺旋）
  helix(count, scale) {
    const a = new Float32Array(count * 3);
    const loops = 3;
    const R = scale * 0.55;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const strand = i % 2;
      const ang = t * loops * Math.PI * 2 + strand * Math.PI;
      a[i * 3] = Math.cos(ang) * R;
      a[i * 3 + 1] = (t * 2 - 1) * scale * 1.1;
      a[i * 3 + 2] = Math.sin(ang) * R;
    }
    return a;
  },

  // ∞（無限記号・レムニスケート）
  infinity(count, scale) {
    const a = new Float32Array(count * 3);
    const j = scale * 0.05;
    for (let i = 0; i < count; i++) {
      const t = Math.random() * Math.PI * 2;
      a[i * 3] = Math.cos(t) * scale * 1.45 + (Math.random() - 0.5) * j;
      a[i * 3 + 1] = Math.sin(t) * Math.cos(t) * scale * 1.45 + (Math.random() - 0.5) * j;
      a[i * 3 + 2] = (Math.random() - 0.5) * scale * 0.12;
    }
    return a;
  },

  // 花（バラ曲線・5枚の花びら）
  rose(count, scale) {
    const a = new Float32Array(count * 3);
    const k = 5;
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.cos(k * theta) * scale * Math.sqrt(Math.random());
      a[i * 3] = Math.cos(theta) * r;
      a[i * 3 + 1] = Math.sin(theta) * r;
      a[i * 3 + 2] = (Math.random() - 0.5) * scale * 0.12;
    }
    return a;
  },

  // 立方体（ワイヤーフレームの辺に沿って配置。回転すると立体的）
  cube(count, scale) {
    const a = new Float32Array(count * 3);
    const s = scale * 0.8;
    const c = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    ];
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6],
      [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7],
    ];
    for (let i = 0; i < count; i++) {
      const e = edges[i % edges.length];
      const t = Math.random();
      const p = c[e[0]];
      const q = c[e[1]];
      a[i * 3] = (p[0] + (q[0] - p[0]) * t) * s;
      a[i * 3 + 1] = (p[1] + (q[1] - p[1]) * t) * s;
      a[i * 3 + 2] = (p[2] + (q[2] - p[2]) * t) * s;
    }
    return a;
  },
};

// 設定で指定された形だけを順番に（未知の名前は無視。空なら sphere）
const SHAPES = P.shapes.map((name) => SHAPE_GENERATORS[name]).filter(Boolean);
if (SHAPES.length === 0) SHAPES.push(SHAPE_GENERATORS.sphere);

const makeShape = (i) => SHAPES[i](P.count, P.shapeScale);

export class ParticleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.running = false;
    this.clock = new THREE.Clock();
    this.mouse = { x: 0, y: 0 };

    this.shapeIndex = 0;
    this.state = "hold"; // "hold" | "morph"
    this.stateTime = 0;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, P.maxPixelRatio));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.z = 6;

    this._buildParticles();

    this._onResize = () => this.resize();
    window.addEventListener("resize", this._onResize);

    if (!REDUCED && P.parallax) {
      this._onMove = (e) => {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener("pointermove", this._onMove, { passive: true });
    }

    this.resize();
  }

  _buildParticles() {
    const count = P.count;
    const start = makeShape(0); // 最初の形
    const target = start.slice();
    const phases = new Float32Array(count);
    const delays = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      phases[i] = Math.random() * Math.PI * 2;
      delays[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(start.slice(), 3)); // 形式上必要
    geo.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
    geo.setAttribute("aTarget", new THREE.BufferAttribute(target, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aDelay", new THREE.BufferAttribute(delays, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uSize: { value: P.size },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, P.maxPixelRatio) },
        uTwinkleSpeed: { value: P.twinkleSpeed },
        uColor: { value: new THREE.Color(P.colorEdge) },
        uCore: { value: new THREE.Color(P.colorCore) },
      },
      vertexShader: `
        attribute vec3 aStart;
        attribute vec3 aTarget;
        attribute float aPhase;
        attribute float aDelay;
        uniform float uTime;
        uniform float uProgress;
        uniform float uSize;
        uniform float uPixelRatio;
        uniform float uTwinkleSpeed;
        varying float vTwinkle;
        void main() {
          vTwinkle = 0.55 + 0.45 * sin(uTime * uTwinkleSpeed + aPhase);
          float spread = 0.35;
          float p = clamp((uProgress * (1.0 + spread) - aDelay * spread) / 1.0, 0.0, 1.0);
          p = p * p * (3.0 - 2.0 * p); // smoothstep
          vec3 pos = mix(aStart, aTarget, p);
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = uSize * uPixelRatio * (1.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform vec3 uColor;
        uniform vec3 uCore;
        varying float vTwinkle;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float core = smoothstep(0.16, 0.0, d);
          float halo = smoothstep(0.5, 0.16, d) * 0.5;
          float alpha = max(core, halo) * vTwinkle;
          vec3 col = mix(uColor, uCore, core);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  /** 次の形へモーフを開始 */
  next() {
    if (this.state === "morph" || SHAPES.length < 2) return;
    const geo = this.points.geometry;
    this.shapeIndex = (this.shapeIndex + 1) % SHAPES.length;
    geo.getAttribute("aTarget").array.set(makeShape(this.shapeIndex));
    geo.getAttribute("aTarget").needsUpdate = true;
    const delay = geo.getAttribute("aDelay").array;
    for (let i = 0; i < delay.length; i++) delay[i] = Math.random();
    geo.getAttribute("aDelay").needsUpdate = true;
    this.points.material.uniforms.uProgress.value = 0;
    this.state = "morph";
    this.stateTime = 0;
  }

  /** モーフ完了時: aTarget を aStart に焼き込んで保持状態へ */
  _commit() {
    const geo = this.points.geometry;
    geo.getAttribute("aStart").array.set(geo.getAttribute("aTarget").array);
    geo.getAttribute("aStart").needsUpdate = true;
    this.points.material.uniforms.uProgress.value = 0;
    this.state = "hold";
    this.stateTime = 0;
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (REDUCED) this.renderer.render(this.scene, this.camera);
  }

  start() {
    if (this.running || REDUCED) return;
    this.running = true;
    this._last = performance.now();
    this._loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this._raf);
  }

  _loop = () => {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this._last) / 1000, 0.05);
    this._last = now;
    const t = this.clock.getElapsedTime();

    // モーフの状態遷移
    this.stateTime += dt;
    if (this.state === "hold") {
      if (this.stateTime >= P.hold) this.next();
    } else {
      const p = Math.min(this.stateTime / P.morph, 1);
      this.points.material.uniforms.uProgress.value = p;
      if (p >= 1) this._commit();
    }

    this.points.material.uniforms.uTime.value = t;

    this.points.rotation.y = t * P.rotateSpeed;
    this.points.position.y = Math.sin(t * P.breatheSpeed) * P.breatheAmp;

    if (P.parallax) {
      this.camera.position.x += (this.mouse.x * P.parallax - this.camera.position.x) * 0.03;
      this.camera.position.y += (-this.mouse.y * P.parallax * 0.75 - this.camera.position.y) * 0.03;
      this.camera.lookAt(0, 0, 0);
    }

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
  window.huraruParticles = field; // .next() で次の形へ / .stop() .start()
}
