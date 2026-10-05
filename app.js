"use strict";

/* ==========================================================
   CONFIGURACIÓN
========================================================== */

const CONFIG = {
  // Desde /argos/inicio/ lleva al juego actual /argos/
  pongUrl: new URL("../", window.location.href).href,

  // Si más adelante tienes un Google Forms / Microsoft Forms,
  // pon aquí su URL. Déjalo vacío para usar la encuesta integrada.
  surveyUrl: "",

  // Duración de la intro antes de abrir el juego.
  introDurationMs: 2800
};

const FACE_FILES = [
  "assets/caras/01_argos_feliz.png",
  "assets/caras/02_argos_escuchando.png",
  "assets/caras/03_argos_neutral.png",
  "assets/caras/04_argos_pensando.png",
  "assets/caras/05_argos_guino.png",
  "assets/caras/06_argos_sorprendida.png"
];

const CORPORATE_FILTERS = [
  "none",
  "brightness(0) saturate(100%) invert(46%) sepia(99%) saturate(2444%) hue-rotate(203deg) brightness(102%) contrast(93%)",
  "brightness(0) saturate(100%) invert(95%) sepia(7%) saturate(992%) hue-rotate(188deg) brightness(104%) contrast(99%)",
  "none"
];

/* ==========================================================
   LOGO REBOTANDO
========================================================== */

const face = document.getElementById("argosFace");
const scene = document.getElementById("scene");
const menuPanel = document.querySelector(".menu-panel");

let x = innerWidth * 0.5;
let y = innerHeight * 0.35;
let vx = 250 / 60;
let vy = 175 / 60;
let lastFrame = performance.now();

let faceIndex = 0;
let spin = 0;
let spinVelocity = 0;
let squashX = 1;
let squashY = 1;

function chooseNewFace() {
  let next = faceIndex;
  while (next === faceIndex && FACE_FILES.length > 1) {
    next = Math.floor(Math.random() * FACE_FILES.length);
  }
  faceIndex = next;
  face.src = FACE_FILES[faceIndex];
}

function collisionReaction(axis) {
  if (Math.random() < 0.78) chooseNewFace();

  if (Math.random() < 0.65) {
    face.style.filter =
      CORPORATE_FILTERS[Math.floor(Math.random() * CORPORATE_FILTERS.length)];
  }

  if (Math.random() < 0.35) {
    spinVelocity += (Math.random() < 0.5 ? -1 : 1) * (13 + Math.random() * 8);
  }

  if (axis === "x") {
    squashX = 0.90;
    squashY = 1.07;
  } else {
    squashX = 1.06;
    squashY = 0.91;
  }
}

function animateMascot(now) {
  const dt = Math.min((now - lastFrame) / 16.6667, 2);
  lastFrame = now;

  const rect = face.getBoundingClientRect();
  const halfW = rect.width / 2;
  const halfH = rect.height / 2;

  // El logo rebota dentro de toda la ventana.
  x += vx * dt;
  y += vy * dt;

  let hitX = false;
  let hitY = false;

  if (x - halfW < 5) {
    x = halfW + 5;
    vx = Math.abs(vx);
    hitX = true;
  } else if (x + halfW > innerWidth - 5) {
    x = innerWidth - halfW - 5;
    vx = -Math.abs(vx);
    hitX = true;
  }

  if (y - halfH < 5) {
    y = halfH + 5;
    vy = Math.abs(vy);
    hitY = true;
  } else if (y + halfH > innerHeight - 5) {
    y = innerHeight - halfH - 5;
    vy = -Math.abs(vy);
    hitY = true;
  }

  if (hitX) collisionReaction("x");
  if (hitY) collisionReaction("y");

  // Amortiguación.
  squashX += (1 - squashX) * 0.16 * dt;
  squashY += (1 - squashY) * 0.16 * dt;

  spin += spinVelocity * dt;
  spinVelocity *= Math.pow(0.925, dt);

  face.style.transform =
    `translate(${x - halfW}px, ${y - halfH}px) ` +
    `rotate(${spin}deg) scale(${squashX}, ${squashY})`;

  requestAnimationFrame(animateMascot);
}

requestAnimationFrame(animateMascot);

window.addEventListener("resize", () => {
  x = Math.min(Math.max(x, 80), innerWidth - 80);
  y = Math.min(Math.max(y, 80), innerHeight - 80);
});

/* ==========================================================
   INTRO ARGOS PONG
   Reproduce la idea de la animación Python con el PNG original.
========================================================== */

const playButton = document.getElementById("playButton");
const pongIntro = document.getElementById("pongIntro");
const pongLogo = document.getElementById("pongLogo");

let introRunning = false;
let introStart = 0;
let pointerX = 0;
let pointerY = 0;
let parallaxX = 0;
let parallaxY = 0;
let pointerRoll = 0;

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function smoothstep(t) {
  t = clamp(t);
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t) {
  t = clamp(t);
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutSine(t) {
  t = clamp(t);
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function easeOutBack(t) {
  t = clamp(t);
  const c1 = 1.10;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function updatePointer(clientX, clientY) {
  pointerX = clamp((clientX / innerWidth) * 2 - 1, -1, 1);
  pointerY = clamp((clientY / innerHeight) * 2 - 1, -1, 1);
}

window.addEventListener("pointermove", (event) => {
  updatePointer(event.clientX, event.clientY);
}, { passive: true });

function renderPongIntro(now) {
  if (!introRunning) return;

  const elapsed = (now - introStart) / 1000;
  const duration = CONFIG.introDurationMs / 1000;

  const follow = 0.12;
  parallaxX += (pointerX * 18 - parallaxX) * follow;
  parallaxY += (pointerY * 10 - parallaxY) * follow;
  pointerRoll += (-pointerX * 0.75 - pointerRoll) * follow;

  let scale = 1;
  let rotation = 0;
  let yExtra = 0;
  let alpha = 1;
  let interactiveX = 0;
  let interactiveY = 0;

  if (elapsed < 0.75) {
    const p = elapsed / 0.75;
    const settle = easeOutBack(p);

    scale = 1.115 - 0.115 * settle;
    rotation = -2.3 * (1 - easeOutCubic(p));
    yExtra = 42 * (1 - easeOutCubic(p));
    alpha = smoothstep(p);

    const amount = smoothstep(p);
    interactiveX = parallaxX * amount * 0.45;
    interactiveY = parallaxY * amount * 0.45;
    rotation += pointerRoll * amount * 0.35;
  } else if (elapsed < 2.05) {
    const p = (elapsed - 0.75) / 1.30;

    const floatY = Math.sin(p * Math.PI * 2 * 1.05) * 5;
    const floatX = Math.sin(p * Math.PI * 2 * 0.55) * 3;
    const breathe = Math.sin(p * Math.PI * 2) * 0.007;

    scale = 1 + breathe;
    rotation = pointerRoll + Math.sin(p * Math.PI * 2 * 0.65) * 0.30;
    yExtra = floatY;
    alpha = 1;
    interactiveX = parallaxX + floatX;
    interactiveY = parallaxY;
  } else {
    const p = clamp((elapsed - 2.05) / Math.max(0.01, duration - 2.05));
    const e = easeInOutSine(p);

    scale = 1 + 0.20 * e;
    rotation = pointerRoll * (1 - p);
    yExtra = -18 * e;
    interactiveX = parallaxX * (1 - p);
    interactiveY = parallaxY * (1 - p);

    if (p < 0.52) {
      alpha = 1;
    } else {
      alpha = 1 - smoothstep((p - 0.52) / 0.48);
    }
  }

  // Pequeño "kick" al asentarse.
  const kickDistance = Math.abs(elapsed - 0.82);
  if (kickDistance < 0.16) {
    const kp = 1 - kickDistance / 0.16;
    scale *= 1 + 0.012 * Math.sin(kp * Math.PI);
  }

  pongLogo.style.opacity = String(alpha);
  pongLogo.style.transform =
    `translate(-50%, -50%) ` +
    `translate(${interactiveX}px, ${interactiveY + yExtra}px) ` +
    `rotate(${rotation}deg) scale(${scale})`;

  if (elapsed >= duration) {
    introRunning = false;
    window.location.href = CONFIG.pongUrl;
    return;
  }

  requestAnimationFrame(renderPongIntro);
}

function startPongIntro() {
  if (introRunning) return;

  introRunning = true;
  introStart = performance.now();
  parallaxX = 0;
  parallaxY = 0;
  pointerRoll = 0;

  pongIntro.classList.add("is-active");
  pongIntro.setAttribute("aria-hidden", "false");
  pongLogo.style.opacity = "0";

  requestAnimationFrame(renderPongIntro);
}

playButton.addEventListener("click", startPongIntro);

/* ==========================================================
   ENCUESTA
========================================================== */

const surveyButton = document.getElementById("surveyButton");
const surveyOverlay = document.getElementById("surveyOverlay");
const closeSurvey = document.getElementById("closeSurvey");
const surveyForm = document.getElementById("surveyForm");
const surveyMessage = document.getElementById("surveyMessage");

document.querySelectorAll(".rating").forEach((container) => {
  const name = container.dataset.name;

  for (let value = 1; value <= 5; value++) {
    const label = document.createElement("label");
    label.innerHTML =
      `<input type="radio" name="${name}" value="${value}" required>` +
      `<span>${value}</span>`;

    container.appendChild(label);
  }
});

function openSurvey() {
  if (CONFIG.surveyUrl) {
    window.location.href = CONFIG.surveyUrl;
    return;
  }

  surveyOverlay.hidden = false;
}

function closeSurveyModal() {
  surveyOverlay.hidden = true;
}

surveyButton.addEventListener("click", openSurvey);
closeSurvey.addEventListener("click", closeSurveyModal);

surveyOverlay.addEventListener("click", (event) => {
  if (event.target === surveyOverlay) {
    closeSurveyModal();
  }
});

surveyForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const form = new FormData(surveyForm);

  const response = {
    fecha: new Date().toISOString(),
    general: form.get("general"),
    facilidad: form.get("facilidad"),
    orientacion: form.get("orientacion")
  };

  // Respaldo local. Para recopilar respuestas de todos los usuarios,
  // configura surveyUrl con Google Forms / Microsoft Forms.
  const existing = JSON.parse(
    localStorage.getItem("argosSurveyResponses") || "[]"
  );

  existing.push(response);
  localStorage.setItem(
    "argosSurveyResponses",
    JSON.stringify(existing)
  );

  surveyMessage.textContent = "¡Gracias por tu opinión!";
  surveyForm.reset();

  setTimeout(() => {
    surveyMessage.textContent = "";
    closeSurveyModal();
  }, 1600);
});

/* ESC */
window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (!surveyOverlay.hidden) {
    closeSurveyModal();
  }
});
