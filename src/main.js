import { HEIGHT, WIDTH, NeonDrift } from "./game.js";

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
const keys = new Set();
let best = Number(localStorage.getItem("neon-drift-best") || 0);
let previous = performance.now();
let paused = false;

bestEl.textContent = String(best).padStart(4, "0");

function showOverlay(title, copy, action) {
  overlayTitle.textContent = title;
  overlayCopy.textContent = copy;
  startButton.textContent = action;
  overlay.hidden = false;
}

function startGame() {
  if (game.over) game.reset();
  game.start();
  paused = false;
  pauseButton.textContent = "暂停";
  pauseButton.setAttribute("aria-label", "暂停游戏");
  overlay.hidden = true;
  previous = performance.now();
}

function togglePause() {
  if (game.over || (!game.running && !paused)) return;
  paused = !paused;
  game.running = !paused;
  pauseButton.textContent = paused ? "继续" : "暂停";
  pauseButton.setAttribute("aria-label", paused ? "继续游戏" : "暂停游戏");
  if (paused) showOverlay("信号暂停", "深呼吸。准备好后继续穿越裂隙。", "继续游戏");
  else overlay.hidden = true;
  previous = performance.now();
}

function inputDirection() {
  const left = keys.has("ArrowLeft") || keys.has("KeyA");
  const right = keys.has("ArrowRight") || keys.has("KeyD");
  return Number(right) - Number(left);
}

function drawGrid(time) {
  ctx.fillStyle = "#070a14";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = "rgba(73,234,255,.11)";
  ctx.lineWidth = 1;
  const offset = (time * 0.09) % 60;
  for (let y = -60 + offset; y < HEIGHT; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
  }
  for (let x = 0; x <= WIDTH; x += 72) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
  }
}

function drawPlayer() {
  const { x, y, w, h } = game.player;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
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
  const cooldown = Math.max(0, 1 - game.dashCooldown / 1.8);
  ctx.fillStyle = "rgba(255,255,255,.13)"; ctx.fillRect(24, HEIGHT - 25, WIDTH - 48, 5);
  ctx.fillStyle = "#49eaff"; ctx.fillRect(24, HEIGHT - 25, (WIDTH - 48) * cooldown, 5);
}

function frame(now) {
  const dt = (now - previous) / 1000;
  previous = now;
  game.update(dt, inputDirection());
  const score = Math.floor(game.score);
  scoreEl.textContent = String(score).padStart(4, "0");
  if (game.over) {
    if (score > best) {
      best = score;
      localStorage.setItem("neon-drift-best", String(best));
      bestEl.textContent = String(best).padStart(4, "0");
    }
    if (overlay.hidden) showOverlay("漂移终止", `本轮信号强度 ${score}。再来一次，打破你的纪录。`, "重新启动");
  }
  render(now);
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if (event.code === "Space" && !event.repeat) game.dash(inputDirection() || 1);
  if (event.code === "KeyP" && !event.repeat) togglePause();
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", () => { keys.clear(); if (game.running) togglePause(); });
startButton.addEventListener("click", () => paused ? togglePause() : startGame());
pauseButton.addEventListener("click", togglePause);

for (const button of document.querySelectorAll("[data-action]")) {
  const action = button.dataset.action;
  const code = action === "left" ? "ArrowLeft" : "ArrowRight";
  const release = () => keys.delete(code);
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (action === "dash") game.dash(inputDirection() || 1);
    else keys.add(code);
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
}

render(0);
requestAnimationFrame(frame);

