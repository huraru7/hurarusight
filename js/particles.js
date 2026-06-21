/* =============================================================
   particles.js — ファーストビュー背景の粒子アニメ（Three.js）
   水色の粒が3つの形（球＋輪・ブラックホール・ローレンツアトラクター）に集まり、
   数秒ごとに次の形へモーフして巡回する。それぞれの形は静止せず、GPU側
   （頂点シェーダー）で専用のアニメーション（輪の周回・降着円盤の渦＋降着・
   カオス軌道の流れ）が常に動き続ける。
   ★ 調整値はすべて data/settings.js の particles から読み込みます。
   ============================================================= */

import * as THREE from "three";
import { settings } from "../data/settings.js";

const P = settings.particles;
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const IS_MOBILE = window.matchMedia("(max-width: 768px)").matches;
// モバイル相当の画面幅では粒子数を半分に減らして軽量化する（設定値そのものは変えない）
const EFFECTIVE_COUNT = IS_MOBILE ? Math.round(P.count * 0.5) : P.count;

/* ---------- ローレンツアトラクターの軌道（1本の長い経路）をあらかじめ
   1回だけ積分して THREE.DataTexture に焼き込む。
   毎フレームCPUで積分し直すのではなく、頂点シェーダー側がこのテクスチャを
   時間でスライドして参照することで「粒子が軌道上を流れる」動きを
   CPU負荷ゼロで実現する。 ---------- */
const LORENZ_SAMPLES = 4096;

function buildLorenzTrajectory(scale) {
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

  const n = LORENZ_SAMPLES;
  const pts = new Float64Array(n * 3);
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < n; i++) {
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
  const s = (scale * 2.0) / ext; // 他の形（外周半径 ≒ scale）と全体の大きさを揃える

  // RGBAのFloatテクスチャとして1次元に並べる（Aは未使用）
  const data = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    data[i * 4] = (pts[i * 3] - cx) * s;
    data[i * 4 + 1] = (pts[i * 3 + 2] - cz) * s; // z（縦に大きく動く軸）を画面の縦に
    data[i * 4 + 2] = (pts[i * 3 + 1] - cy) * s;
    data[i * 4 + 3] = 1;
  }
  return data;
}

const LORENZ_TRAJECTORY = buildLorenzTrajectory(P.shapeScale);
const LORENZ_TEXTURE = new THREE.DataTexture(
  LORENZ_TRAJECTORY,
  LORENZ_SAMPLES,
  1,
  THREE.RGBAFormat,
  THREE.FloatType
);
LORENZ_TEXTURE.magFilter = THREE.LinearFilter;
LORENZ_TEXTURE.minFilter = THREE.LinearFilter;
LORENZ_TEXTURE.wrapS = THREE.RepeatWrapping;
LORENZ_TEXTURE.needsUpdate = true;

/* ---------- 形（ターゲット座標）ジェネレータ ----------
   (count, scale) を受け取り、{ pos, anim, mode } を返す。
     pos:  長さ count*3 の Float32Array（静止形としての位置）
     anim: 長さ count*3 の Float32Array（GPU側アニメーション用の補助データ。
           意味は mode によって変わる。使わない形は全て0）
     mode: uShapeMode に渡す番号（0=アニメーションなし/void, 1=sphere+輪,
           2=blackHole, 3=lorenz） */

const SHAPE_GENERATORS = {
  // 中心の球＋土星の輪のように周回する2〜3本のリング
  sphere(count, scale) {
    const pos = new Float32Array(count * 3);
    const anim = new Float32Array(count * 3);

    const coreCount = Math.floor(count * 0.55);
    const remain = count - coreCount;
    const ringSizes = [Math.floor(remain / 3), Math.floor(remain / 3), 0];
    ringSizes[2] = remain - ringSizes[0] - ringSizes[1];
    // リングごとの傾き（頂点シェーダー側にも同じ値を持たせ、回転中も一致させる）。
    // 外周リング(ring3)の半径が scale と一致するようにしてあり、他の形と外側の大きさが揃う。
    const coreR = scale * 0.45;
    const RINGS = [
      { tiltX: 0.45, tiltZ: 0.08, r: scale * 0.62 },
      { tiltX: -0.32, tiltZ: 0.15, r: scale * 0.8 },
      { tiltX: 0.55, tiltZ: -0.12, r: scale * 1.0 },
    ];

    let i = 0;
    // コア（球面分布）。anim はコアでは使わない（0のまま）
    for (; i < coreCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      pos[i * 3] = coreR * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = coreR * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = coreR * Math.cos(phi);
    }

    // 3本のリング
    for (let ringIdx = 0; ringIdx < 3; ringIdx++) {
      const ring = RINGS[ringIdx];
      const n = ringSizes[ringIdx];
      const sinX = Math.sin(ring.tiltX);
      const cosX = Math.cos(ring.tiltX);
      const sinZ = Math.sin(ring.tiltZ);
      const cosZ = Math.cos(ring.tiltZ);
      for (let k = 0; k < n; k++, i++) {
        const theta0 = Math.random() * Math.PI * 2;
        const r = ring.r + (Math.random() - 0.5) * scale * 0.06; // リングの帯幅
        const x = Math.cos(theta0) * r;
        const z = Math.sin(theta0) * r;
        // 傾き適用（平面上はy=0から、X軸→Z軸の順で回転）
        const y1 = -z * sinX;
        const z1 = z * cosX;
        const x2 = x * cosZ - y1 * sinZ;
        const y2 = x * sinZ + y1 * cosZ;
        pos[i * 3] = x2;
        pos[i * 3 + 1] = y2;
        pos[i * 3 + 2] = z1;
        anim[i * 3] = ringIdx + 1; // リング番号（1〜3。0はコア）
        anim[i * 3 + 1] = theta0;
        anim[i * 3 + 2] = r;
      }
    }
    return { pos, anim, mode: 1 };
  },

  // ローレンツアトラクター（軌道上を粒子が流れ続ける）
  lorenz(count) {
    const pos = new Float32Array(count * 3);
    const anim = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phase = i / count;
      const idx = Math.floor(phase * LORENZ_SAMPLES) % LORENZ_SAMPLES;
      pos[i * 3] = LORENZ_TRAJECTORY[idx * 4];
      pos[i * 3 + 1] = LORENZ_TRAJECTORY[idx * 4 + 1];
      pos[i * 3 + 2] = LORENZ_TRAJECTORY[idx * 4 + 2];
      anim[i * 3] = phase; // 軌道テクスチャ上の位相（0〜1）
    }
    return { pos, anim, mode: 3 };
  },

  // ブラックホールの降着円盤と光子球（差動回転＋ゆっくりした降着で渦を巻きながら落ち込む）
  blackHole(count, scale) {
    const pos = new Float32Array(count * 3);
    const anim = new Float32Array(count * 3);
    const diskCount = Math.floor(count * 0.8);
    // 外周半径（outerR）を scale と一致させ、他の形と全体の大きさを揃える
    const innerR = scale * 0.27;
    const outerR = scale * 1.0;
    const photonR = scale * 0.13;

    let i = 0;
    for (; i < diskCount; i++) {
      const t = Math.pow(Math.random(), 2); // 内側ほど密＝明るい降着円盤らしさ
      const r = innerR + (outerR - innerR) * t;
      const theta = Math.random() * Math.PI * 2;
      const thickness = scale * (0.012 + 0.04 * t); // 外側ほどわずかにフレア
      const y = (Math.random() - 0.5) * thickness;
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(theta) * r;
      anim[i * 3] = 0; // group: 降着円盤
      anim[i * 3 + 1] = theta;
      anim[i * 3 + 2] = r;
    }
    for (; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const ang = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = photonR + (Math.random() - 0.5) * scale * 0.02; // 薄い球殻
      pos[i * 3] = r * Math.sin(phi) * Math.cos(ang);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(ang);
      pos[i * 3 + 2] = r * Math.cos(phi);
      anim[i * 3] = 1; // group: 光子球
      anim[i * 3 + 1] = ang;
      anim[i * 3 + 2] = 0;
    }
    return { pos, anim, mode: 2 };
  },

  // 魔法陣（二重の外周リング＋目盛り＋外側5つの印＋中心の六芒星）。
  // data/settings.js の shapes には載せない隠し図形。アニメーションは付けない（mode: 0）
  void(count, scale) {
    const pos = new Float32Array(count * 3);
    const anim = new Float32Array(count * 3);
    const rOuter = scale * 0.9; // 外周リングの半径
    const rOuter2 = scale * 0.8; // 内側に添える2本目のリング
    const tickOuter = scale * 0.86;
    const tickInner = scale * 0.84; // 二重リングの間を結ぶ目盛り
    const markR = scale * 0.09; // 外側の印（マーク）の大きさ
    const ringR = scale * 0.46; // 六芒星を囲む小さな円
    const starR = scale * 0.38; // 中心の六芒星の半径

    const ringCount = Math.floor(count * 0.26);
    const ring2Count = Math.floor(count * 0.12);
    const tickTotal = Math.floor(count * 0.12);
    const markCount = Math.floor(count * 0.15);
    const innerRingCount = Math.floor(count * 0.08);
    let i = 0;

    // 外周のリング（一番外側）
    for (; i < ringCount; i++) {
      const t = (i / ringCount) * Math.PI * 2;
      pos[i * 3] = Math.cos(t) * rOuter;
      pos[i * 3 + 1] = Math.sin(t) * rOuter;
      pos[i * 3 + 2] = 0;
    }

    // 二重リングの内側の輪
    for (let k = 0; k < ring2Count; k++, i++) {
      const t = (k / ring2Count) * Math.PI * 2;
      pos[i * 3] = Math.cos(t) * rOuter2;
      pos[i * 3 + 1] = Math.sin(t) * rOuter2;
      pos[i * 3 + 2] = 0;
    }

    // 二重リングの間を結ぶ目盛り（時計の目盛りのような短い線）
    const tickN = 24;
    const perTick = Math.floor(tickTotal / tickN);
    for (let m = 0; m < tickN; m++) {
      const angle = (m / tickN) * Math.PI * 2;
      const x1 = Math.cos(angle) * tickOuter;
      const y1 = Math.sin(angle) * tickOuter;
      const x2 = Math.cos(angle) * tickInner;
      const y2 = Math.sin(angle) * tickInner;
      for (let k = 0; k < perTick; k++, i++) {
        const t = Math.random();
        pos[i * 3] = x1 + (x2 - x1) * t;
        pos[i * 3 + 1] = y1 + (y2 - y1) * t;
        pos[i * 3 + 2] = 0;
      }
    }

    // 外周上に均等配置した5つの印（小さな円塊）
    const perMark = Math.floor(markCount / 5);
    for (let m = 0; m < 5; m++) {
      const angle = (m / 5) * Math.PI * 2 - Math.PI / 2;
      const cx = Math.cos(angle) * rOuter;
      const cy = Math.sin(angle) * rOuter;
      for (let k = 0; k < perMark; k++, i++) {
        const rt = Math.random() * Math.PI * 2;
        const rr = Math.sqrt(Math.random()) * markR;
        pos[i * 3] = cx + Math.cos(rt) * rr;
        pos[i * 3 + 1] = cy + Math.sin(rt) * rr;
        pos[i * 3 + 2] = 0;
      }
    }

    // 六芒星を囲む小さな円
    for (let k = 0; k < innerRingCount; k++, i++) {
      const t = (k / innerRingCount) * Math.PI * 2;
      pos[i * 3] = Math.cos(t) * ringR;
      pos[i * 3 + 1] = Math.sin(t) * ringR;
      pos[i * 3 + 2] = 0;
    }

    // 中心の文様（二つの三角形を重ねた六芒星）
    const hexPoints = [];
    for (let p = 0; p < 6; p++) {
      const angle = (p / 6) * Math.PI * 2 - Math.PI / 2;
      hexPoints.push([Math.cos(angle) * starR, Math.sin(angle) * starR]);
    }
    const triA = [hexPoints[0], hexPoints[2], hexPoints[4], hexPoints[0]];
    const triB = [hexPoints[1], hexPoints[3], hexPoints[5], hexPoints[1]];
    const starEdges = [];
    for (const tri of [triA, triB]) {
      for (let e = 0; e < tri.length - 1; e++) starEdges.push([tri[e], tri[e + 1]]);
    }

    for (; i < count; i++) {
      const e = starEdges[i % starEdges.length];
      const t = Math.random();
      pos[i * 3] = e[0][0] + (e[1][0] - e[0][0]) * t;
      pos[i * 3 + 1] = e[0][1] + (e[1][1] - e[0][1]) * t;
      pos[i * 3 + 2] = 0;
    }
    return { pos, anim, mode: 0 };
  },
};

// 設定で指定された形だけを順番に（未知の名前は無視。空なら sphere）
const SHAPES = P.shapes.map((name) => SHAPE_GENERATORS[name]).filter(Boolean);
if (SHAPES.length === 0) SHAPES.push(SHAPE_GENERATORS.sphere);

const makeShape = (i) => SHAPES[i](EFFECTIVE_COUNT, P.shapeScale);

/* ---------- 頂点シェーダー（位置の計算）----------
   通常の明るいコア用の点と、背景が明るくても粒子の輪郭がわかるように
   重ねる暗い縁取り用の点の、両方の THREE.Points で共有して使う。
   形のモーフ・GPU側アニメーションの計算式は完全に同じにする必要があるため。 */
const VERTEX_SHADER_SRC = `
  attribute vec3 aStart;
  attribute vec3 aTarget;
  attribute float aPhase;
  attribute float aDelay;
  attribute float aColorMix;
  attribute vec3 aAnim;
  uniform float uTime;
  uniform float uProgress;
  uniform float uAnimP;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uTwinkleSpeed;
  uniform float uShapeMode;
  uniform sampler2D uTrajectory;
  uniform float uDiskInner;
  uniform float uDiskOuter;
  uniform float uOrbitSpeed;
  uniform float uInfallSpeed;
  uniform float uFlowSpeed;
  varying float vTwinkle;
  varying float vColorMix;
  varying float vRingId;
  varying float vPhase;
  void main() {
    vTwinkle = 0.55 + 0.45 * sin(uTime * uTwinkleSpeed + aPhase);
    vColorMix = aColorMix;
    vRingId = aAnim.x;
    vPhase = aPhase;

    float spread = 0.35;
    float p = clamp((uProgress * (1.0 + spread) - aDelay * spread) / 1.0, 0.0, 1.0);
    p = p * p * (3.0 - 2.0 * p); // smoothstep
    vec3 pos = mix(aStart, aTarget, p);

    // 形ごとの専用アニメーション（GPU側で毎フレーム計算。CPU負荷なし）。
    // uAnimP はモーフ中だけ0→1で立ち上がり、保持中は1のまま維持される
    // （uProgressのようにcommit時に0へ戻さない）ので、止まって見えることはない。
    vec3 animated = pos;
    if (uShapeMode > 0.5 && uShapeMode < 1.5) {
      // sphere + 輪: リング番号>0の粒子だけ、傾いた円軌道上を周回させる
      float ringId = aAnim.x;
      if (ringId > 0.5) {
        float r = aAnim.z;
        float theta0 = aAnim.y;
        float speed;
        float tiltX;
        float tiltZ;
        if (ringId < 1.5) { speed = 0.18; tiltX = 0.45; tiltZ = 0.08; }
        else if (ringId < 2.5) { speed = -0.13; tiltX = -0.32; tiltZ = 0.15; }
        else { speed = 0.10; tiltX = 0.55; tiltZ = -0.12; }
        float theta = theta0 + uTime * speed;
        float x = cos(theta) * r;
        float z = sin(theta) * r;
        float sinX = sin(tiltX);
        float cosX = cos(tiltX);
        float y1 = -z * sinX;
        float z1 = z * cosX;
        float sinZ = sin(tiltZ);
        float cosZ = cos(tiltZ);
        float x2 = x * cosZ - y1 * sinZ;
        float y2 = x * sinZ + y1 * cosZ;
        animated = vec3(x2, y2, z1);
      }
    } else if (uShapeMode > 1.5 && uShapeMode < 2.5) {
      // blackHole: 降着円盤は半径に応じた差動回転＋ゆっくりした降着（内側へ落ち込みループ）
      float group = aAnim.x;
      float theta0 = aAnim.y;
      float r0 = aAnim.z;
      if (group < 0.5) {
        float rNorm = clamp((r0 - uDiskInner) / max(uDiskOuter - uDiskInner, 0.0001), 0.0, 1.0);
        float fall = fract(rNorm - uTime * uInfallSpeed);
        float r = uDiskInner + fall * (uDiskOuter - uDiskInner);
        // 角速度は粒子固有の初期半径r0から決める（一定の値）。
        // 降着で変化するrから毎フレーム計算すると、その時々の速さを
        // 経過時間の総量にそのまま掛けてしまい、uTimeが大きくなるほど
        // 角度が暴れて見かけの速度が増していくバグになるため。
        float angSpeed = uOrbitSpeed / sqrt(max(r0, uDiskInner * 0.3));
        float theta = theta0 + uTime * angSpeed;
        animated = vec3(cos(theta) * r, pos.y, sin(theta) * r);
      } else {
        float pulse = 1.0 + 0.05 * sin(uTime * 1.4 + theta0);
        animated = pos * pulse;
      }
    } else if (uShapeMode > 2.5) {
      // lorenz: あらかじめ焼き込んだ軌道テクスチャを時間でスライドして参照する
      float u = fract(aAnim.x + uTime * uFlowSpeed);
      animated = texture2D(uTrajectory, vec2(u, 0.5)).rgb;
    }
    pos = mix(pos, animated, uAnimP);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * uPixelRatio * (1.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

/** 角度を (-π, π] に正規化する（経過時間で蓄積した大きな値のまま使うと
    イージング時に何周も回ってしまうため） */
function normalizeAngle(a) {
  a = a % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

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
    this.camera.position.z = P.cameraZ;

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

    this._dragOffsetY = 0;
    this._dragOffsetX = 0;
    if (P.dragRotate) this._bindDrag();

    this.resize();
  }

  /** ポインタードラッグでパーティクル全体を直接回せるようにする。
      自動回転（t * rotateSpeed）の上に一定のオフセットとして乗せるだけなので、
      ドラッグを離した瞬間に角度が飛ぶことはない（自動回転はずっと裏で進み続けている）。 */
  _bindDrag() {
    const hero = this.canvas.parentElement;
    if (!hero) return;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onMove = (e) => {
      if (!dragging) return;
      this._dragOffsetY += (e.clientX - lastX) * P.dragRotate;
      this._dragOffsetX += (e.clientY - lastY) * P.dragRotate;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => {
      dragging = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    hero.addEventListener("pointerdown", (e) => {
      if (this._frozen) return; // 神威空間ゲート演出中は操作させない
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    });
  }

  _buildParticles() {
    const count = EFFECTIVE_COUNT;
    const initial = makeShape(this.shapeIndex); // 最初の形（ランダムに決定済み）
    const start = initial.pos;
    const target = start.slice();
    const phases = new Float32Array(count);
    const delays = new Float32Array(count);
    const colorMix = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      phases[i] = Math.random() * Math.PI * 2;
      delays[i] = Math.random();
      colorMix[i] = Math.random(); // 粒子ごとの色の個体差（形が変わっても同じ個体差を保つ）
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(start.slice(), 3)); // 形式上必要
    geo.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
    geo.setAttribute("aTarget", new THREE.BufferAttribute(target, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aDelay", new THREE.BufferAttribute(delays, 1));
    geo.setAttribute("aColorMix", new THREE.BufferAttribute(colorMix, 1));
    geo.setAttribute("aAnim", new THREE.BufferAttribute(initial.anim.slice(), 3));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending, // 粒子が重なる部分が発光して見える
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uAnimP: { value: 1 }, // 最初の形は最初から「保持中」なのでフル稼働で始める
        uSize: { value: P.size },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, P.maxPixelRatio) },
        uTwinkleSpeed: { value: P.twinkleSpeed },
        uColor: { value: new THREE.Color(P.colorEdge) },
        uCore: { value: new THREE.Color(P.colorCore) },
        uCoreGlow: { value: new THREE.Color(P.colorGlow) },
        uShapeMode: { value: initial.mode },
        uTrajectory: { value: LORENZ_TEXTURE },
        uDiskInner: { value: P.shapeScale * 0.27 },
        uDiskOuter: { value: P.shapeScale * 1.0 },
        uOrbitSpeed: { value: P.blackHoleOrbitSpeed },
        uInfallSpeed: { value: P.blackHoleInfallSpeed },
        uFlowSpeed: { value: P.lorenzFlowSpeed },
      },
      vertexShader: VERTEX_SHADER_SRC,
      fragmentShader: `
        precision highp float;
        uniform vec3 uColor;
        uniform vec3 uCore;
        uniform vec3 uCoreGlow;
        uniform float uShapeMode;
        uniform float uTime;
        varying float vTwinkle;
        varying float vColorMix;
        varying float vRingId;
        varying float vPhase;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float core = smoothstep(0.16, 0.0, d);
          float halo = smoothstep(0.5, 0.16, d) * 0.4;
          float alpha = max(core, halo) * vTwinkle;
          vec3 base = mix(uColor, uCore, vColorMix); // 粒子ごとの個体色
          vec3 col = mix(base, vec3(1.0), core * 0.4); // 中心ほど明るく（白飛びを抑えめに）
          // sphereのコア（輪ではない部分）だけ、色がゆっくり脈動する
          if (uShapeMode > 0.5 && uShapeMode < 1.5 && vRingId < 0.5) {
            float shift = 0.5 + 0.5 * sin(uTime * 0.6 + vPhase);
            col = mix(col, uCoreGlow, shift * 0.35);
          }
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.scene.add(this.points);

    // 縁取り（影）レイヤー: 同じ位置計算を使い、コアより大きく・暗い色で先に描く。
    // 通常合成（NormalBlending）なので明るい背景の上では暗く沈み、輪郭が一目でわかる。
    // 暗い背景の上ではほぼ馴染んで見えず、コア側の発光（加算合成）が主役になる。
    if (P.haloAlpha > 0) {
      const haloMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        uniforms: {
          uTime: mat.uniforms.uTime,
          uProgress: mat.uniforms.uProgress,
          uAnimP: mat.uniforms.uAnimP,
          uPixelRatio: mat.uniforms.uPixelRatio,
          uTwinkleSpeed: mat.uniforms.uTwinkleSpeed,
          uShapeMode: mat.uniforms.uShapeMode,
          uTrajectory: mat.uniforms.uTrajectory,
          uDiskInner: mat.uniforms.uDiskInner,
          uDiskOuter: mat.uniforms.uDiskOuter,
          uOrbitSpeed: mat.uniforms.uOrbitSpeed,
          uInfallSpeed: mat.uniforms.uInfallSpeed,
          uFlowSpeed: mat.uniforms.uFlowSpeed,
          uSize: { value: P.size * P.haloSizeMult },
          uHaloColor: { value: new THREE.Color(P.haloColor) },
          uHaloAlpha: { value: P.haloAlpha },
        },
        vertexShader: VERTEX_SHADER_SRC,
        fragmentShader: `
          precision highp float;
          uniform vec3 uHaloColor;
          uniform float uHaloAlpha;
          varying float vTwinkle;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            float falloff = smoothstep(0.5, 0.05, d);
            float alpha = falloff * uHaloAlpha * vTwinkle;
            gl_FragColor = vec4(uHaloColor, alpha);
          }
        `,
      });
      this.haloPoints = new THREE.Points(geo, haloMat);
      this.haloPoints.frustumCulled = false;
      this.haloPoints.renderOrder = -1; // コア（加算合成）より先に描く
      // sceneに直接addすると回転・呼吸（_loopでthis.pointsに適用）が連動しないので、
      // pointsの子にして変形を自動的に継承させる
      this.points.add(this.haloPoints);
    }
  }

  /** 次の形へモーフを開始 */
  next() {
    if (this.state === "morph" || SHAPES.length < 2) return;
    const geo = this.points.geometry;
    this.shapeIndex = pickShapeIndex(this.shapeIndex, SHAPES.length, P.randomOrder);
    const result = makeShape(this.shapeIndex);
    geo.getAttribute("aTarget").array.set(result.pos);
    geo.getAttribute("aTarget").needsUpdate = true;
    geo.getAttribute("aAnim").array.set(result.anim);
    geo.getAttribute("aAnim").needsUpdate = true;
    this.points.material.uniforms.uShapeMode.value = result.mode;
    const delay = geo.getAttribute("aDelay").array;
    for (let i = 0; i < delay.length; i++) delay[i] = Math.random();
    geo.getAttribute("aDelay").needsUpdate = true;
    this.points.material.uniforms.uProgress.value = 0;
    this.points.material.uniforms.uAnimP.value = 0; // 新しい形のアニメーションを0からフェードインさせる
    this.state = "morph";
    this.stateTime = 0;
  }

  /** モーフ完了時: aTarget を aStart に焼き込んで保持状態へ */
  _commit() {
    const geo = this.points.geometry;
    geo.getAttribute("aStart").array.set(geo.getAttribute("aTarget").array);
    geo.getAttribute("aStart").needsUpdate = true;
    this.points.material.uniforms.uProgress.value = 0;
    this.points.material.uniforms.uAnimP.value = 1; // 保持中はアニメーションを常にフル稼働させる
    this.state = "hold";
    this.stateTime = 0;
    this._onSettle?.();
    this._onSettle = null;
  }

  /** 名前を指定して直接その形へモーフする（サイクル位置は変えない）。
      存在しない名前なら null、存在すれば「形が定まったら解決する Promise」を返す。 */
  goToShape(name) {
    const fn = SHAPE_GENERATORS[name];
    if (!fn) return null;
    const geo = this.points.geometry;
    const result = fn(EFFECTIVE_COUNT, P.shapeScale);
    geo.getAttribute("aTarget").array.set(result.pos);
    geo.getAttribute("aTarget").needsUpdate = true;
    geo.getAttribute("aAnim").array.set(result.anim);
    geo.getAttribute("aAnim").needsUpdate = true;
    this.points.material.uniforms.uShapeMode.value = result.mode;
    const delay = geo.getAttribute("aDelay").array;
    for (let i = 0; i < delay.length; i++) delay[i] = Math.random();
    geo.getAttribute("aDelay").needsUpdate = true;
    this.points.material.uniforms.uProgress.value = 0;
    this.points.material.uniforms.uAnimP.value = 0; // 新しい形のアニメーションを0からフェードインさせる
    this.state = "morph";
    this.stateTime = 0;

    // 回転の正面揃え（freeze中のみ使う）は形のモーフとは別の時間軸で進める。
    // 角度をそのまま使うと蓄積した大きな値になりがちなので (-π, π] に正規化したうえで、
    // 最大角速度を決めて「どれだけ回転が残っていても、その速さ以上では回さない」ようにする。
    this._rotStartY = normalizeAngle(this.points.rotation.y);
    this._rotStartX = normalizeAngle(this.points.rotation.x);
    this._rotTime = 0;
    const maxAngle = Math.max(Math.abs(this._rotStartY), Math.abs(this._rotStartX));
    const maxRotSpeed = 0.5; // rad/s（通常の巡回回転より速いが、回っているとわかる程度に留める）
    this._rotDuration = Math.max(P.morph, maxAngle / maxRotSpeed);

    return new Promise((resolve) => {
      this._onSettle = resolve;
    });
  }

  /** hold時間が来ても自動で次の形へ進まないようにする / 元に戻す */
  freeze() {
    this._frozen = true;
  }
  unfreeze() {
    this._frozen = false;
  }

  /** 粒子全体を duration 秒で縮小する。完了時に解決する Promise を返す */
  shrink(duration = 0.8) {
    this._shrinking = true; // 通常ループの呼吸スケールと競合しないように止める
    return new Promise((resolve) => {
      const start = this.points.scale.x;
      const t0 = performance.now();
      const step = () => {
        const t = Math.min((performance.now() - t0) / 1000 / duration, 1);
        this.points.scale.setScalar(Math.max(start * (1 - t), 0));
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      step();
    });
  }
  /** shrink() で縮小したスケールを通常表示に戻す */
  resetScale() {
    this._shrinking = false;
    this.points.scale.setScalar(1);
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

    // モーフの状態遷移（位置のブレンドのみ。回転は別の時間軸で扱う）
    this.stateTime += dt;
    if (this.state === "hold") {
      if (!this._frozen && this.stateTime >= P.hold) this.next();
    } else {
      const p = Math.min(this.stateTime / P.morph, 1);
      this.points.material.uniforms.uProgress.value = p;
      this.points.material.uniforms.uAnimP.value = p; // 形ごとのアニメーションもモーフと一緒に立ち上げる
      if (p >= 1) this._commit();
    }

    // uTimeはGPU側では32bit floatなので、無制限に増やすと（タブを長く開いているほど）
    // fract()やcos/sinの精度が落ちてアニメーションがガタつく（速くなったように見える）。
    // 十分大きいが精度が落ちない範囲で折り返す（JS側のtはfloat64なので回転・呼吸には影響しない）。
    this.points.material.uniforms.uTime.value = t % 10000;

    if (this._frozen) {
      // 正面への回転収束（goToShape() で設定した、速度上限つきの専用タイマーで進める）
      if (this._rotDuration != null) {
        this._rotTime += dt;
        const rp = Math.min(this._rotTime / this._rotDuration, 1);
        const ease = rp * rp * (3 - 2 * rp); // smoothstep
        this.points.rotation.y = this._rotStartY * (1 - ease);
        this.points.rotation.x = this._rotStartX * (1 - ease);
        if (rp >= 1) this._rotDuration = null; // 完了。以後は0のまま動かさない
      }
    } else {
      this.points.rotation.y = t * P.rotateSpeed + this._dragOffsetY;
      this.points.rotation.x = t * P.rotateSpeed * 0.7 + this._dragOffsetX;
    }
    this.points.position.y = Math.sin(t * P.breatheSpeed) * P.breatheAmp;
    if (!this._shrinking) {
      const breathe = 1 + Math.sin(t * P.breatheSpeed * 0.8) * (P.breatheScaleAmp || 0);
      this.points.scale.setScalar(breathe);
    }

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
    this.haloPoints?.material.dispose();
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
    // 神威空間（隠しページ）表示中は、タブ切り替え等で再始動しないようにする
    if (heroVisible && !document.hidden && !field._voidActive) field.start();
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
