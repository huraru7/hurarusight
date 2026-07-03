/* =============================================================
   background.js — Three.jsによる固定背景（漂う粒子 + 接続線のみ）
   CDN(esm.sh)からimportmap経由で読み込む（ビルドステップなし）。
   色はダークテーマのアクセントカラー（--acc-primary #94c4ff / --acc-secondary #beb7fd）に合わせている。
   ============================================================= */

import * as THREE from "three";

export function initBackground(canvas) {
  const W = window.innerWidth;
  const H = window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 100);
  camera.position.z = 10;

  /* ── 粒子システム ── */
  const isMobile = window.innerWidth < 640;
  const PCOUNT = isMobile ? 120 : 280;
  const positions = new Float32Array(PCOUNT * 3);
  const velocities = new Float32Array(PCOUNT * 2);
  const colors = new Float32Array(PCOUNT * 3);
  const sizes = new Float32Array(PCOUNT);
  const wobbles = new Float32Array(PCOUNT * 3);
  const opacities = new Float32Array(PCOUNT);
  const glows = new Float32Array(PCOUNT);

  for (let i = 0; i < PCOUNT; i++) {
    const isSecondary = Math.random() < 0.25;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.4 + 0.08;

    positions[i * 3 + 0] = (Math.random() - 0.5) * W;
    positions[i * 3 + 1] = (Math.random() - 0.5) * H;
    positions[i * 3 + 2] = 0;

    velocities[i * 2 + 0] = Math.cos(angle) * speed;
    velocities[i * 2 + 1] = Math.sin(angle) * speed;

    if (isSecondary) {
      colors[i * 3 + 0] = 0.745;
      colors[i * 3 + 1] = 0.718;
      colors[i * 3 + 2] = 0.992;
    } else {
      colors[i * 3 + 0] = 0.580;
      colors[i * 3 + 1] = 0.769;
      colors[i * 3 + 2] = 1.0;
    }

    sizes[i] = Math.random() * 2.5 + 0.8;
    wobbles[i * 3 + 0] = Math.random() * Math.PI * 2;
    wobbles[i * 3 + 1] = Math.random() * 0.012 + 0.003;
    wobbles[i * 3 + 2] = Math.random() * 0.5 + 0.1;
    opacities[i] = Math.random() * 0.35 + 0.12;
    glows[i] = Math.random() > 0.85 ? 1.0 : 0.0;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute("aOpacity", new THREE.BufferAttribute(opacities, 1));
  geo.setAttribute("aGlow", new THREE.BufferAttribute(glows, 1));

  const particleMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(-9999, -9999) } },
    vertexShader: `
      attribute vec3  aColor;
      attribute float aSize;
      attribute float aOpacity;
      attribute float aGlow;
      uniform   float uTime;
      uniform   vec2  uMouse;
      varying   vec3  vColor;
      varying   float vOpacity;
      varying   float vGlow;

      void main() {
        vec3 pos = position;

        float wobblePhase = aSize * 1.37;
        float wobbleSpd   = aOpacity * 0.8;
        pos.x += sin(uTime * wobbleSpd + wobblePhase) * aGlow * 8.0 + sin(uTime * 0.3 + wobblePhase) * 3.0;
        pos.y += cos(uTime * wobbleSpd + wobblePhase * 1.3) * 3.0;

        vec2 diff = uMouse - pos.xy;
        float d   = length(diff);
        if (d < 180.0) {
          pos.xy += normalize(diff) * (1.0 - d / 180.0) * 1.2;
        }

        vec4 mvPos    = modelViewMatrix * vec4(pos, 1.0);
        gl_Position   = projectionMatrix * mvPos;
        /* OrthographicCameraでは距離が一定のため、遠近減衰(/-mvPos.z)は使わず
           固定倍率でピクセルサイズを決める */
        gl_PointSize  = aSize * 2.0;

        vColor   = aColor;
        vOpacity = aOpacity;
        vGlow    = aGlow;
      }
    `,
    fragmentShader: `
      varying vec3  vColor;
      varying float vOpacity;
      varying float vGlow;

      void main() {
        vec2  coord = gl_PointCoord - 0.5;
        float dist  = length(coord);

        float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

        float glow = (1.0 - smoothstep(0.0, 0.5, dist)) * vGlow * 0.5;
        vec3  col  = vColor + glow * 0.4;

        gl_FragColor = vec4(col, alpha * vOpacity);
      }
    `,
  });

  const points = new THREE.Points(geo, particleMat);
  scene.add(points);

  /* ── 接続線 ── */
  const MAX_LINES = PCOUNT * 4;
  const linePos = new Float32Array(MAX_LINES * 6);
  const lineGeo = new THREE.BufferGeometry();
  const linePosAttr = new THREE.BufferAttribute(linePos, 3);
  linePosAttr.setUsage(THREE.DynamicDrawUsage);
  lineGeo.setAttribute("position", linePosAttr);

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x94c4ff,
    transparent: true,
    opacity: 0.09,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lineSegments);

  /* ── マウス ── */
  const mouse3D = new THREE.Vector2(-9999, -9999);
  window.addEventListener("mousemove", (e) => {
    mouse3D.x = e.clientX - W / 2;
    mouse3D.y = -(e.clientY - H / 2);
  });

  /* ── リサイズ ── */
  window.addEventListener("resize", () => {
    const nW = window.innerWidth;
    const nH = window.innerHeight;
    renderer.setSize(nW, nH);
    camera.left = -nW / 2;
    camera.right = nW / 2;
    camera.top = nH / 2;
    camera.bottom = -nH / 2;
    camera.updateProjectionMatrix();
  });

  /* ── アニメーションループ ── */
  const clock = new THREE.Clock();
  const CONNECT_DIST = isMobile ? 0 : 85;

  function animate() {
    if (document.hidden) {
      requestAnimationFrame(animate);
      return;
    }

    const t = clock.getElapsedTime();
    particleMat.uniforms.uTime.value = t;
    particleMat.uniforms.uMouse.value = mouse3D;

    const pos = geo.attributes.position.array;
    for (let i = 0; i < PCOUNT; i++) {
      pos[i * 3 + 0] += velocities[i * 2 + 0];
      pos[i * 3 + 1] += velocities[i * 2 + 1];

      if (pos[i * 3 + 0] > W / 2 + 20) pos[i * 3 + 0] = -W / 2 - 20;
      if (pos[i * 3 + 0] < -W / 2 - 20) pos[i * 3 + 0] = W / 2 + 20;
      if (pos[i * 3 + 1] > H / 2 + 20) pos[i * 3 + 1] = -H / 2 - 20;
      if (pos[i * 3 + 1] < -H / 2 - 20) pos[i * 3 + 1] = H / 2 + 20;
    }
    geo.attributes.position.needsUpdate = true;

    if (CONNECT_DIST > 0) {
      let lineIdx = 0;
      for (let i = 0; i < PCOUNT && lineIdx < MAX_LINES - 1; i++) {
        for (let j = i + 1; j < PCOUNT && lineIdx < MAX_LINES - 1; j++) {
          const dx = pos[i * 3] - pos[j * 3];
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT_DIST) {
            linePos[lineIdx * 6 + 0] = pos[i * 3 + 0];
            linePos[lineIdx * 6 + 1] = pos[i * 3 + 1];
            linePos[lineIdx * 6 + 2] = 0;
            linePos[lineIdx * 6 + 3] = pos[j * 3 + 0];
            linePos[lineIdx * 6 + 4] = pos[j * 3 + 1];
            linePos[lineIdx * 6 + 5] = 0;
            lineIdx++;
          }
        }
      }
      lineGeo.setDrawRange(0, lineIdx * 2);
      lineGeo.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}
