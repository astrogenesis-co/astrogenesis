import * as THREE from "three";

const menu = document.querySelector<HTMLDialogElement>("#explore-menu")!;
const openButton = document.querySelector<HTMLButtonElement>("#open-menu")!;
const frame = document.querySelector<HTMLIFrameElement>("#catalog-frame")!;
const motionButton = document.querySelector<HTMLButtonElement>("#motion")!;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let paused = reducedMotion.matches;

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
    :root { --bg: transparent; --panel: #171c2999; --line: #8b8c9c33; }
    body { background: transparent !important; }
    .topbar,.explore-footer { display:none !important; }
    .catalog-shell { max-width: none; margin:0; }
    :root { --ink: #d7efeb; --muted: #97b1b5; --accent: #aee5db; --serif: Space, system-ui, sans-serif; --mono: Mono, monospace; }
    .celestial-seal { display:none; }
    .sidebar { background: #0c1a2080; }
    .page-heading h1 { font: 400 clamp(23px,3vw,36px)/1.2 Space, sans-serif; letter-spacing: -.02em; }
    .page-heading { min-height:0; padding-bottom:24px; }
    .catalog-main { padding-top:28px; }
    .eyebrow, .section-heading { color: #a4d4cd; }
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
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
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
  // Deterministic, truly spatial background: nearby stars shift more than distant ones.
  let seed = 93;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const positions: number[] = [],
    colors: number[] = [];
  for (let i = 0; i < 2200; i++) {
    const azimuth = random() * Math.PI * 2,
      z = random() * 2 - 1,
      radius = 35 + random() * 65;
    const ring = Math.sqrt(1 - z * z);
    positions.push(
      radius * ring * Math.cos(azimuth),
      radius * z,
      radius * ring * Math.sin(azimuth),
    );
    const brightness = 0.25 + random() * 0.65;
    colors.push(
      brightness,
      brightness * (0.88 + random() * 0.12),
      brightness * (0.8 + random() * 0.2),
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
        size: 0.11,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
      }),
    ),
  );
  let elapsed = 0,
    last = performance.now();
  function resize() {
    const w = innerWidth,
      h = innerHeight;
    renderer.setSize(w, h);
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
    if (!paused) elapsed += delta;
    const orbit = elapsed * 0.014;
    const distance = innerWidth < 700 ? 14 : 10;
    camera.position.set(
      Math.sin(orbit) * distance,
      Math.sin(orbit * 0.5) * 0.45,
      Math.cos(orbit) * distance,
    );
    camera.lookAt(0, 0, 0);
    star.rotation.y = elapsed * 0.018;

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
