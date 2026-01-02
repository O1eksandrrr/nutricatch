const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// DPI fix (щоб координати не їхали на мобільних/ретіні)
const dpr = window.devicePixelRatio || 1;
const cssW = canvas.width;
const cssH = canvas.height;
canvas.style.width = cssW + "px";
canvas.style.height = cssH + "px";
canvas.width = Math.floor(cssW * dpr);
canvas.height = Math.floor(cssH * dpr);
ctx.scale(dpr, dpr);

let basket = { x: 140, y: 540, w: 90, h: 26 };

let items = [];
let score = 0;
let lives = 3;
let time = 120;
let isGameOver = false;

let goodCaught = 0;
let badCaught = 0;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function spawnItem() {
  if (isGameOver) return;

  // Баланс: 70% good, 30% bad
  const isGood = Math.random() < 0.7;

  items.push({
    x: Math.random() * (cssW - 40) + 20,
    y: -20,
    r: 16,
    v: 2 + Math.random() * 1.5,
    type: isGood ? "good" : "bad",
    label: isGood ? "GOOD" : "BAD"
  });
}

function endGame() {
  if (isGameOver) return;
  isGameOver = true;

  clearInterval(loopInterval);
  clearInterval(timerInterval);
  clearInterval(spawnInterval);

  document.getElementById("finalScore").innerText = score;
  document.getElementById("end").classList.remove("hidden");
}

function updateHud() {
  document.getElementById("score").innerText = score;
  document.getElementById("lives").innerText = lives;
  document.getElementById("time").innerText = time;

  // Діагностика (можеш прибрати потім)
  // Якщо в тебе нема цих полів — додай в HUD (я нижче дам рядок для HTML)
  const gc = document.getElementById("goodCaught");
  const bc = document.getElementById("badCaught");
  if (gc) gc.innerText = goodCaught;
  if (bc) bc.innerText = badCaught;
}

function circleRectHit(cx, cy, r, rx, ry, rw, rh) {
  // найближча точка прямокутника до центру круга
  const nx = clamp(cx, rx, rx + rw);
  const ny = clamp(cy, ry, ry + rh);
  const dx = cx - nx;
  const dy = cy - ny;
  return (dx * dx + dy * dy) <= r * r;
}

function draw() {
  ctx.clearRect(0, 0, cssW, cssH);

  // basket
  ctx.fillStyle = "#111";
  ctx.fillRect(basket.x, basket.y, basket.w, basket.h);

  // items
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    it.y += it.v;

    // впало вниз — видаляємо
    if (it.y - it.r > cssH + 30) {
      items.splice(i, 1);
      continue;
    }

    // draw circle (зелений/червоний)
    ctx.beginPath();
    ctx.fillStyle = it.type === "good" ? "#2ecc71" : "#e74c3c";
    ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
    ctx.fill();

    // label
    ctx.fillStyle = "#fff";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(it.type === "good" ? "✓" : "✕", it.x, it.y);

    // collision
    const hit = circleRectHit(it.x, it.y, it.r, basket.x, basket.y, basket.w, basket.h);
    if (hit) {
      if (it.type === "good") {
        score += 1;
        goodCaught += 1;
      } else {
        lives -= 1;
        badCaught += 1;
      }
      items.splice(i, 1);

      if (lives <= 0) {
        lives = 0;
        updateHud();
        endGame();
        return;
      }
    }
  }

  updateHud();
}

function setBasketByClientX(clientX) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left); // у CSS-пікселях
  basket.x = clamp(x - basket.w / 2, 0, cssW - basket.w);
}

// mouse
canvas.addEventListener("mousemove", e => setBasketByClientX(e.clientX));

// touch
canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  setBasketByClientX(e.touches[0].clientX);
}, { passive: false });

const loopInterval = setInterval(draw, 20);
const spawnInterval = setInterval(spawnItem, 650);

const timerInterval = setInterval(() => {
  if (isGameOver) return;
  time -= 1;
  if (time <= 0) {
    time = 0;
    updateHud();
    endGame();
  } else {
    updateHud();
  }
}, 1000);

updateHud();
