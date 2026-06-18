/* =============================================================
   particles.js — ファーストビュー背景の粒子アニメ（Three.js）
   水色の粒がいくつかの形（球・波・らせん・複雑な構造）に集まり、数秒ごとに
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

  // ローレンツアトラクター（カオス力学系の軌道をオイラー法で積分してサンプリング）
  lorenz(count, scale) {
    const a = new Float32Array(count * 3);
    const sigma = 10;
    const rho = 28;
    const beta = 8 / 3;
    const dt = 0.005;
    let x = 0.1;
    let y = 0;
    let z = 0;

    const warmup = 500; // 過渡応答を捨て、軌道をアトラクター上に乗せる
    for (let i = 0; i < warmup; i++) {
      const dx = sigma * (y - x);
      const dy = x * (rho - z) - y;
      const dz = x * y - beta * z;
      x += dx * dt;
      y += dy * dt;
      z += dz * dt;
    }

    const pts = new Float64Array(count * 3);
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < count; i++) {
      const dx = sigma * (y - x);
      const dy = x * (rho - z) - y;
      const dz = x * y - beta * z;
      x += dx * dt;
      y += dy * dt;
      z += dz * dt;
      pts[i * 3] = x;
      pts[i * 3 + 1] = y;
      pts[i * 3 + 2] = z;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;
    const ext = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
    const s = (scale * 1.8) / ext;

    for (let i = 0; i < count; i++) {
      a[i * 3] = (pts[i * 3] - cx) * s;
      a[i * 3 + 1] = (pts[i * 3 + 2] - cz) * s; // z（縦に大きく動く軸）を画面の縦に
      a[i * 3 + 2] = (pts[i * 3 + 1] - cy) * s;
    }
    return a;
  },

  // クラインの壺（"figure-8 immersion" パラメトリック式）
  kleinBottle(count, scale) {
    const a = new Float32Array(count * 3);
    const A = 1.6;
    const S = scale * 0.42;
    for (let i = 0; i < count; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const r = A + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v);
      const x = r * Math.cos(u);
      const y = r * Math.sin(u);
      const z = Math.sin(u / 2) * Math.sin(v) + Math.cos(u / 2) * Math.sin(2 * v);
      a[i * 3] = x * S;
      a[i * 3 + 1] = z * S; // 「くびれ」の軸を縦に
      a[i * 3 + 2] = y * S;
    }
    return a;
  },

  // トーラス構造（素直なドーナツ面。ring の捩れチューブとは別物）
  torus(count, scale) {
    const a = new Float32Array(count * 3);
    const R = scale * 0.85;
    const r = scale * 0.32;
    for (let i = 0; i < count; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      a[i * 3] = (R + r * Math.cos(v)) * Math.cos(u);
      a[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u);
      a[i * 3 + 2] = r * Math.sin(v);
    }
    return a;
  },

  // 超新星残骸のシェル構造（いびつな塊・フィラメント状の球殻）
  supernovaShell(count, scale) {
    const a = new Float32Array(count * 3);
    const baseR = scale * 0.95;
    const shellThickness = scale * 0.22;

    // 呼び出しごとに周波数・位相をランダム再抽選 → モーフするたびに模様が変わる疑似ノイズ
    const terms = [];
    for (let k = 0; k < 5; k++) {
      terms.push({
        f: 2 + Math.floor(Math.random() * 4),
        g: 2 + Math.floor(Math.random() * 5),
        p: Math.random() * Math.PI * 2,
        q: Math.random() * Math.PI * 2,
        w: 0.18 + Math.random() * 0.12,
      });
    }

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      let bump = 0;
      for (const t of terms) bump += t.w * Math.sin(t.f * theta + t.p) * Math.cos(t.g * phi + t.q);
      const r = baseR * (1 + bump) + (Math.random() - 0.5) * shellThickness;
      a[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      a[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      a[i * 3 + 2] = r * Math.cos(phi);
    }
    return a;
  },

  // 量子泡（無数の小さな泡＝球殻クラスタが空間内に散らばる、ゆらぎのある泡構造）
  quantumFoam(count, scale) {
    const a = new Float32Array(count * 3);
    const bubbleCount = 40;

    // 呼び出しごとに泡の位置・大きさを再抽選 → モーフするたびにゆらぎの模様が変わる
    const bubbles = [];
    for (let b = 0; b < bubbleCount; b++) {
      const cr = Math.sqrt(Math.random()) * scale * 0.9;
      const ctheta = Math.random() * Math.PI * 2;
      const cphi = Math.acos(2 * Math.random() - 1);
      bubbles.push({
        cx: cr * Math.sin(cphi) * Math.cos(ctheta),
        cy: cr * Math.sin(cphi) * Math.sin(ctheta),
        cz: cr * Math.cos(cphi),
        r: scale * (0.03 + Math.random() * 0.12), // 泡ごとに大きさをばらつかせる
      });
    }

    for (let i = 0; i < count; i++) {
      const bub = bubbles[i % bubbleCount];
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = bub.r * (0.85 + Math.random() * 0.3); // 泡の表面にうっすら厚みを持たせる
      a[i * 3] = bub.cx + r * Math.sin(phi) * Math.cos(theta);
      a[i * 3 + 1] = bub.cy + r * Math.sin(phi) * Math.sin(theta);
      a[i * 3 + 2] = bub.cz + r * Math.cos(phi);
    }
    return a;
  },

  // ブラックホールの降着円盤と光子球
  blackHole(count, scale) {
    const a = new Float32Array(count * 3);
    const diskCount = Math.floor(count * 0.8);
    const innerR = scale * 0.32;
    const outerR = scale * 1.25;
    const photonR = scale * 0.16;

    let i = 0;
    for (; i < diskCount; i++) {
      const t = Math.pow(Math.random(), 2); // 内側ほど密＝明るい降着円盤らしさ
      const r = innerR + (outerR - innerR) * t;
      const theta = Math.random() * Math.PI * 2;
      const thickness = scale * (0.015 + 0.05 * t); // 外側ほどわずかにフレア
      const y = (Math.random() - 0.5) * thickness;
      a[i * 3] = Math.cos(theta) * r;
      a[i * 3 + 1] = y;
      a[i * 3 + 2] = Math.sin(theta) * r;
    }
    for (; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const ang = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = photonR + (Math.random() - 0.5) * scale * 0.02; // 薄い球殻
      a[i * 3] = r * Math.sin(phi) * Math.cos(ang);
      a[i * 3 + 1] = r * Math.sin(phi) * Math.sin(ang);
      a[i * 3 + 2] = r * Math.cos(phi);
    }
    return a;
  },
};

// 設定で指定された形だけを順番に（未知の名前は無視。空なら sphere）
const SHAPES = P.shapes.map((name) => SHAPE_GENERATORS[name]).filter(Boolean);
if (SHAPES.length === 0) SHAPES.push(SHAPE_GENERATORS.sphere);

const makeShape = (i) => SHAPES[i](P.count, P.shapeScale);

/** 次に表示する形のインデックスを選ぶ。ランダム時は直前と同じ形を選ばない */
function pickShapeIndex(current, length, random) {
  if (length <= 1) return 0;
  if (!random) return (current + 1) % length;
  let next;
  do {
    next = Math.floor(Math.random() * length);
  } while (next === current);
  return next;
}

export class ParticleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.running = false;
    this.clock = new THREE.Clock();
    this.mouse = { x: 0, y: 0 };

    // 開始時の形は常にランダム（ページ読み込みごとに違う形から始まる）
    this.shapeIndex = Math.floor(Math.random() * SHAPES.length);
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
    const start = makeShape(this.shapeIndex); // 最初の形（ランダムに決定済み）
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
    this.shapeIndex = pickShapeIndex(this.shapeIndex, SHAPES.length, P.randomOrder);
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
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
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
    this.points.rotation.x = t * P.rotateSpeed * 0.7;
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

/* ---- 起動: ファーストビューの背景として動かす ----
   .hero が画面に映っていない（スクロールで隠れた / タブが非アクティブ）間は
   描画ループを止めて軽量化する。 */
const canvas = document.getElementById("particle-canvas");
if (canvas) {
  const field = new ParticleField(canvas);
  window.huraruParticles = field; // .next() で次の形へ / .stop() .start()

  const hero = canvas.parentElement;
  let heroVisible = true;

  const syncRunning = () => {
    if (heroVisible && !document.hidden) field.start();
    else field.stop();
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      heroVisible = entry.isIntersecting;
      syncRunning();
    },
    { threshold: 0 }
  );
  io.observe(hero);

  document.addEventListener("visibilitychange", syncRunning);

  syncRunning();
}
