import * as THREE from "three";

const menu = document.querySelector<HTMLDialogElement>("#explore-menu")!;
const openButton = document.querySelector<HTMLButtonElement>("#open-menu")!;
const frame = document.querySelector<HTMLIFrameElement>("#catalog-frame")!;
const motionButton = document.querySelector<HTMLButtonElement>("#motion")!;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let paused = reducedMotion.matches;
let concealed =
  window.parent !== window &&
  new URLSearchParams(location.search).has("entrance");
const entranceOrigin = (() => {
  try {
    const referrer = new URL(document.referrer);
    if (
      referrer.origin === "https://astrogenesis.co" ||
      (["localhost", "127.0.0.1"].includes(location.hostname) &&
        referrer.hostname === location.hostname)
    ) {
      return referrer.origin;
    }
  } catch {
    /* Direct visits have no parent. */
  }
  return null;
})();
if (concealed && entranceOrigin) {
  document
    .querySelectorAll<HTMLAnchorElement>(".identity, .orbit-footer a")
    .forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        parent.postMessage({ type: "astrogenesis:surface" }, entranceOrigin);
      });
    });
}
window.addEventListener("message", (event) => {
  if (
    !entranceOrigin ||
    event.origin !== entranceOrigin ||
    event.source !== parent
  )
    return;
  if (event.data?.type === "astrogenesis:reveal") concealed = false;
  if (event.data?.type === "astrogenesis:conceal") concealed = true;
});

function updateMotion() {
  motionButton.setAttribute("aria-pressed", String(paused));
  motionButton.innerHTML = paused
    ? '<span aria-hidden="true">▷</span> Resume orbit'
    : '<span aria-hidden="true">Ⅱ</span> Pause orbit';
}
updateMotion();
motionButton.addEventListener("click", () => {
  paused = !paused;
  updateMotion();
});
reducedMotion.addEventListener("change", () => {
  paused = reducedMotion.matches;
  updateMotion();
});
openButton.addEventListener("click", () => {
  if (!frame.getAttribute("src")) frame.src = frame.dataset.src!;
  menu.showModal();
});
function closeMenu() {
  menu.close();
  openButton.focus();
}
document.querySelector("#close-menu")!.addEventListener("click", closeMenu);
menu.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeMenu();
});
// Reuse the real catalog and players; keeping the frame mounted preserves audio
// and search state when the visitor dismisses and brings back the menu.
frame.addEventListener("load", () => {
  const doc = frame.contentDocument;
  if (!doc) return;
  const style = doc.createElement("style");
  style.textContent = `
    :root { --bg: transparent; --panel: #14233799; --line: #a0d9f126; }
    body { background: transparent !important; }
    .topbar,.explore-footer { display:none !important; }
    .catalog-shell { max-width: none; margin:0; }
    :root { --ink: #d8eef9; --muted: #9bb5c9; --accent: #b6e5ff; --serif: Space, system-ui, sans-serif; --mono: Mono, monospace; }
    .celestial-seal { display:none; }
    .sidebar { background: #0c192880; }
    .page-heading h1 { font: 400 clamp(23px,3vw,36px)/1.2 Space, sans-serif; letter-spacing: -.02em; }
    .page-heading { min-height:0; padding-bottom:24px; }
    .catalog-main { padding-top:28px; }
    .eyebrow, .section-heading { color: #b0d8ef; }
    a[target="_blank"] { text-decoration-color: #e2cda2; }
  `;
  doc.head.append(style);
  doc.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    }
  });
  doc.addEventListener("click", (event) => {
    const anchor = (event.target as Element).closest<HTMLAnchorElement>(
      "a[href]",
    );
    if (!anchor) return;
    const url = new URL(anchor.href);
    if (
      url.origin !== location.origin ||
      !url.pathname.startsWith("/explore/")
    ) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }
  });
});

const host = document.querySelector<HTMLElement>("#universe")!;
try {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  host.replaceChildren(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 180);
  const star = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0xfff4d8, toneMapped: false }),
  );
  scene.add(star);
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 256;
  const ctx = glowCanvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,220,150,.7)");
  gradient.addColorStop(0.22, "rgba(255,173,65,.35)");
  gradient.addColorStop(0.4, "rgba(229,113,32,.10)");
  gradient.addColorStop(1, "rgba(120,45,15,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(glowCanvas),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  glow.scale.set(10, 10, 1);
  scene.add(glow);
  // One shared soft point texture keeps the field from reading as square pixels.
  const pointCanvas = document.createElement("canvas");
  pointCanvas.width = pointCanvas.height = 32;
  const pointContext = pointCanvas.getContext("2d")!;
  const pointGradient = pointContext.createRadialGradient(
    16,
    16,
    0,
    16,
    16,
    16,
  );
  pointGradient.addColorStop(0, "rgba(255,255,255,1)");
  pointGradient.addColorStop(0.25, "rgba(255,255,255,.85)");
  pointGradient.addColorStop(1, "rgba(255,255,255,0)");
  pointContext.fillStyle = pointGradient;
  pointContext.fillRect(0, 0, 32, 32);
  const pointTexture = new THREE.CanvasTexture(pointCanvas);

  // Stable world positions: translation creates parallax, with nearby material
  // moving across the distant stars. No twinkling or independently moving sky.
  let seed = 93;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const layers = [
    {
      count: 1600,
      inner: 80,
      outer: 140,
      size: 0.48,
      opacity: 0.75,
      warm: false,
    },
    {
      count: 600,
      inner: 25,
      outer: 60,
      size: 0.17,
      opacity: 0.85,
      warm: false,
    },
    // Sparse illuminated dust stays inside the visitor's orbit, safely away
    // from the camera; it supplies a depth cue without close fly-bys.
    { count: 260, inner: 3, outer: 7, size: 0.035, opacity: 0.38, warm: true },
  ];
  for (const layer of layers) {
    const positions: number[] = [],
      colors: number[] = [];
    for (let i = 0; i < layer.count; i++) {
      const azimuth = random() * Math.PI * 2;
      const z = random() * 2 - 1;
      const radius = Math.cbrt(
        layer.inner ** 3 + random() * (layer.outer ** 3 - layer.inner ** 3),
      );
      const ring = Math.sqrt(1 - z * z);
      positions.push(
        radius * ring * Math.cos(azimuth),
        radius * z,
        radius * ring * Math.sin(azimuth),
      );
      const brightness = 0.4 + random() * 0.6;
      const warmth = random();
      colors.push(
        brightness * (layer.warm ? 1 : 0.8 + warmth * 0.2),
        brightness * (layer.warm ? 0.78 : 0.88 + warmth * 0.12),
        brightness * (layer.warm ? 0.48 : 1 - warmth * 0.15),
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    scene.add(
      new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          map: pointTexture,
          size: layer.size,
          vertexColors: true,
          transparent: true,
          opacity: layer.opacity,
          depthWrite: false,
          sizeAttenuation: true,
        }),
      ),
    );
  }
  let elapsed = 0,
    last = performance.now();
  let needsRender = true;
  let orbitDistance = 10;
  let orbitSpeed = 0.009;
  function resize() {
    const w = innerWidth,
      h = innerHeight;
    renderer.setSize(w, h);
    orbitDistance = w < 700 ? 14 : 10;
    orbitSpeed = w < 700 ? 0.007 : 0.009;
    needsRender = true;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Position the star beside the copy, and above it on narrow screens.
    camera.setViewOffset(
      w,
      h,
      w * (w < 700 ? -0.04 : -0.07),
      h * (w < 700 ? 0.1 : 0.06),
      w,
      h,
    );
  }
  resize();
  addEventListener("resize", resize);
  renderer.setAnimationLoop((now: number) => {
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (document.hidden) return;
    if ((paused || concealed) && !needsRender) return;
    // Integrate angle so changing viewport never jumps to a different phase.
    // One revolution takes about 12 minutes (15 on phones), with no bob or roll.
    if (!paused && !concealed)
      elapsed = (elapsed + delta * orbitSpeed) % (Math.PI * 2);
    const orbit = elapsed;
    const distance = orbitDistance;
    camera.position.set(
      Math.sin(orbit) * distance,
      0,
      Math.cos(orbit) * distance,
    );
    camera.lookAt(0, 0, 0);
    needsRender = false;

    renderer.render(scene, camera);
  });
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    host.innerHTML = '<div class="fallback-star"></div>';
    motionButton.hidden = true;
  });
} catch (error) {
  console.warn("Orbit scene unavailable; using the still scene.", error);
  host.innerHTML = '<div class="fallback-star"></div>';
  motionButton.hidden = true;
}

// Signal only after the scene (or its still fallback) has had a chance to paint.
if (entranceOrigin) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      parent.postMessage({ type: "astrogenesis:ready" }, entranceOrigin);
    }),
  );
}
