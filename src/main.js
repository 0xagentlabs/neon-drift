import { HEIGHT, WIDTH, NeonDrift } from "./game.js";
import { NeonAudio } from "./audio.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const game = new NeonDrift();
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlay-title");
const overlayCopy = document.querySelector("#overlay-copy");
const startButton = document.querySelector("#start");
const pauseButton = document.querySelector("#pause");
const exitFullscreenButton = document.querySelector("#exit-fullscreen");
const gameCard = document.querySelector(".game-card");
const runState = document.querySelector("#run-state");
const soundButton = document.querySelector("#sound");
const shieldEl = document.querySelector("#shield");
const joystick = document.querySelector(".joystick-zone");
const joystickKnob = document.querySelector(".joystick-knob");
const keys = new Set();
const audio = new NeonAudio();
let best = Number(localStorage.getItem("neon-drift-best") || 0);
let previous = performance.now();
let paused = false;
let wasOver = false;
let previousScore = 0;
let previousLives = game.lives;
let joystickDirection = 0;
let immersiveFallback = false;

function vibrate(pattern) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement;
}

async function enterFullscreen() {
  if (fullscreenElement()) return;
  const request = gameCard.requestFullscreen || gameCard.webkitRequestFullscreen;
  if (!request) {
    immersiveFallback = true;
    syncFullscreenState();
    return;
  }
  try {
    await request.call(gameCard);
  } catch {
    immersiveFallback = true;
    syncFullscreenState();
  }
}

async function exitFullscreen() {
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (!fullscreenElement() || !exit) {
    immersiveFallback = false;
    syncFullscreenState();
    return;
  }
  try {
    await exit.call(document);
  } catch {
    // The browser may already be leaving fullscreen.
  }
}

function syncFullscreenState() {
  const active = Boolean(fullscreenElement()) || immersiveFallback;
  gameCard.classList.toggle("is-fullscreen", active);
  gameCard.classList.toggle("is-immersive", immersiveFallback);
  document.body.classList.toggle("immersive", active);
}

bestEl.textContent = String(best).padStart(4, "0");

function updateSoundButton() {
  soundButton.textContent = audio.enabled ? "声音：开" : "声音：关";
  soundButton.setAttribute("aria-label", audio.enabled ? "关闭游戏声音" : "开启游戏声音");
  soundButton.setAttribute("aria-pressed", String(audio.enabled));
}

updateSoundButton();

function showOverlay(title, copy, action) {
  overlayTitle.textContent = title;
  overlayCopy.textContent = copy;
  startButton.textContent = action;
  overlay.hidden = false;
}

async function startGame() {
  await enterFullscreen();
  if (game.over) game.reset();
  game.start();
  paused = false;
  pauseButton.textContent = "暂停";
  pauseButton.setAttribute("aria-label", "暂停游戏");
  runState.textContent = "航行中";
  overlay.hidden = true;
  previous = performance.now();
  previousScore = game.score;
  previousLives = game.lives;
  wasOver = false;
  vibrate(15);
  audio.play("start");
  audio.startMusic();
}

function togglePause() {
  if (game.over || (!game.running && !paused)) return;
  paused = !paused;
  game.running = !paused;
  pauseButton.textContent = paused ? "继续" : "暂停";
  pauseButton.setAttribute("aria-label", paused ? "继续游戏" : "暂停游戏");
  runState.textContent = paused ? "已暂停" : "航行中";
  if (paused) showOverlay("信号暂停", "深呼吸。准备好后继续穿越裂隙。", "继续游戏");
  else overlay.hidden = true;
  if (paused) audio.stopMusic();
  else audio.startMusic();
  previous = performance.now();
}

function inputDirection() {
  const left = keys.has("ArrowLeft") || keys.has("KeyA");
  const right = keys.has("ArrowRight") || keys.has("KeyD");
  return joystickDirection || Number(right) - Number(left);
}

function drawGrid(time) {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#080a1b"); sky.addColorStop(.55, "#0b1023"); sky.addColorStop(1, "#060812");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "rgba(118,87,255,.28)";
  ctx.beginPath(); ctx.arc(WIDTH * .72, HEIGHT * .2, 125, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(73,234,255,.1)";
  ctx.lineWidth = 1;
  const offset = (time * 0.09) % 60;
  for (let y = -60 + offset; y < HEIGHT; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
  }
  for (let x = 0; x <= WIDTH; x += 72) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
  }
  for (let i = 0; i < 24; i += 1) {
    const x = (i * 137) % WIDTH; const y = (i * 83 + time * (.012 + (i % 3) * .004)) % HEIGHT;
    ctx.fillStyle = i % 4 ? "rgba(255,255,255,.32)" : "rgba(73,234,255,.55)";
    ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }
  const beam = (Math.sin(time * .00055) + 1) / 2;
  const glow = ctx.createRadialGradient(WIDTH * beam, HEIGHT * .62, 0, WIDTH * beam, HEIGHT * .62, 260);
  glow.addColorStop(0, "rgba(73,234,255,.13)"); glow.addColorStop(1, "rgba(73,234,255,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.save(); ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 9; i += 1) {
    const y = (time * (.19 + i * .012) + i * 127) % (HEIGHT + 100) - 50;
    ctx.fillStyle = i % 3 ? "rgba(73,234,255,.22)" : "rgba(184,255,53,.3)";
    ctx.fillRect((i * 89 + time * .025) % WIDTH, y, 2, 20 + (i % 4) * 9);
  }
  ctx.restore();
}

function drawPlayer() {
  const { x, y, w, h } = game.player;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.fillStyle = "rgba(73,234,255,.16)";
  ctx.beginPath(); ctx.moveTo(-w * .26, h * .2); ctx.lineTo(0, h * 1.35); ctx.lineTo(w * .26, h * .2); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 24; ctx.shadowColor = "#b8ff35";
  if (game.invulnerable > 0) {
    ctx.shadowBlur = 38; ctx.shadowColor = "#49eaff"; ctx.globalAlpha = .72;
  }
  ctx.fillStyle = "#b8ff35";
  ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(0, h / 3); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#070a14";
  ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(9, 14); ctx.lineTo(-9, 14); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawEntities() {
  for (const item of game.entities) {
    ctx.save();
    ctx.translate(item.x + item.w / 2, item.y + item.h / 2);
    ctx.rotate(item.spin);
    if (item.type === "core") {
      ctx.strokeStyle = "#b8ff35"; ctx.lineWidth = 7; ctx.shadowBlur = 25; ctx.shadowColor = "#b8ff35";
      ctx.beginPath(); ctx.arc(0, 0, item.w / 2.5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#f8f7ff"; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = "#ff3157"; ctx.shadowBlur = 20; ctx.shadowColor = "#ff3157";
      ctx.beginPath(); ctx.moveTo(0, -item.h / 2); ctx.lineTo(item.w / 2, item.h / 3); ctx.lineTo(-item.w / 3, item.h / 2); ctx.lineTo(-item.w / 2, -item.h / 4); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
}

function render(time) {
  drawGrid(time);
  drawEntities();
  drawPlayer();
  shieldEl.textContent = "◆".repeat(game.lives) + "◇".repeat(3 - game.lives);
  shieldEl.setAttribute("aria-label", `剩余 ${game.lives} 格护盾`);
}

function frame(now) {
  const dt = (now - previous) / 1000;
  previous = now;
  game.update(dt, inputDirection());
  for (const effect of game.drainEvents()) audio.play(effect);
  const score = Math.floor(game.score);
  if (game.score - previousScore > 50) vibrate([18, 28, 18]);
  if (game.lives < previousLives) vibrate([45, 35, 70]);
  previousScore = game.score;
  previousLives = game.lives;
  scoreEl.textContent = String(score).padStart(4, "0");
  if (game.over) {
    audio.stopMusic();
    runState.textContent = "已坠毁";
    if (score > best) {
      best = score;
      localStorage.setItem("neon-drift-best", String(best));
      bestEl.textContent = String(best).padStart(4, "0");
    }
    if (overlay.hidden) showOverlay("漂移终止", `本轮信号强度 ${score}。再来一次，打破你的纪录。`, "重新启动");
    if (!wasOver) vibrate([80, 45, 120]);
  }
  wasOver = game.over;
  render(now);
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if (event.code === "KeyP" && !event.repeat) togglePause();
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", () => { keys.clear(); if (game.running) togglePause(); });
startButton.addEventListener("click", () => paused ? togglePause() : startGame());
pauseButton.addEventListener("click", togglePause);
exitFullscreenButton.addEventListener("click", exitFullscreen);
document.addEventListener("fullscreenchange", syncFullscreenState);
document.addEventListener("webkitfullscreenchange", syncFullscreenState);
document.addEventListener("keydown", (event) => {
  if (event.code === "Escape" && immersiveFallback) void exitFullscreen();
});
soundButton.addEventListener("click", () => {
  const enabled = audio.toggle();
  updateSoundButton();
  if (enabled) {
    audio.play("start");
    if (game.running) audio.startMusic();
  }
});

for (const button of document.querySelectorAll("[data-action]")) {
  const action = button.dataset.action;
  const code = action === "left" ? "ArrowLeft" : "ArrowRight";
  const release = (event) => {
    event?.preventDefault();
    keys.delete(code);
    button.classList.remove("is-pressed");
    if (event?.pointerId !== undefined && button.hasPointerCapture(event.pointerId)) {
      button.releasePointerCapture(event.pointerId);
    }
  };
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    keys.add(code);
    button.classList.add("is-pressed");
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
  button.addEventListener("contextmenu", (event) => event.preventDefault());
}

function resetJoystick() {
  joystickDirection = 0;
  joystickKnob.style.transform = "translate3d(0, 0, 0)";
  joystick.classList.remove("is-active");
}

joystick.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  joystick.setPointerCapture(event.pointerId);
  joystick.classList.add("is-active");
});
joystick.addEventListener("pointermove", (event) => {
  if (!joystick.hasPointerCapture(event.pointerId)) return;
  event.preventDefault();
  const rect = joystick.querySelector(".joystick-base").getBoundingClientRect();
  const radius = rect.width * .34;
  const x = Math.max(-radius, Math.min(radius, event.clientX - (rect.left + rect.width / 2)));
  const y = Math.max(-radius, Math.min(radius, event.clientY - (rect.top + rect.height / 2)));
  joystickDirection = Math.abs(x) < radius * .16 ? 0 : x / radius;
  joystickKnob.style.transform = `translate3d(${x}px, ${y}px, 0)`;
});
joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);
joystick.addEventListener("lostpointercapture", resetJoystick);

render(0);
requestAnimationFrame(frame);
