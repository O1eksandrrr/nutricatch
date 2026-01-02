const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tipEl = document.getElementById("tip");

// Overlay UI
const overlay = document.getElementById("overlay");
const resultBadge = document.getElementById("resultBadge");
const resultTitle = document.getElementById("resultTitle");
const resultScore = document.getElementById("resultScore");
const resultStats = document.getElementById("resultStats");
const btnReplay = document.getElementById("btnReplay");
const btnExit = document.getElementById("btnExit");

// DPI fix
const dpr = window.devicePixelRatio || 1;
const cssW = canvas.width;
const cssH = canvas.height;
canvas.style.width = cssW + "px";
canvas.style.height = cssH + "px";
canvas.width = Math.floor(cssW * dpr);
canvas.height = Math.floor(cssH * dpr);
ctx.scale(dpr, dpr);

let basket = { x: 120, y: cssH - 52, w: 120, h: 26 };

let items = [];
let score = 0;
let lives = 3;
let time = 120;
let isGameOver = false;

let goodCaught = 0;
let badCaught = 0;

const GOOD = [
  { icon: "🥦", name: "Broccoli", tag: "Fiber" },
  { icon: "🥑", name: "Avocado", tag: "Healthy fats" },
  { icon: "🍗", name: "Chicken", tag: "Protein" },
  { icon: "🥬", name: "Greens", tag: "Micros" },
  { icon: "🍎", name: "Apple", tag: "Fiber" },
  { icon: "🫐", name: "Berries", tag: "Antioxidants" },
  { icon: "🥣", name: "Oats", tag: "Slow carbs" },
  { icon: "🐟", name: "Fish", tag: "Omega-3" },
];

const BAD = [
  { icon: "🍔", name: "Burger", tag: "Ultra-processed" },
  { icon: "🍟", name: "Fries", tag: "Fried" },
  { icon: "🥤", name: "Soda", tag: "Sugar" },
  { icon: "🍩", name: "Donut", tag: "Sugar" },
  { icon: "🍿", name: "Snacks", tag: "Salt+fat" },
];

const TIPS = [
  "Порада: білок + клітковина = ситість надовше ✅",
  "Порада: вода допомагає контролювати апетит 💧",
  "Порада: овочі = обʼєм + мікронутрієнти 🥬",
  "Порада: сон впливає на тягу до солодкого 😴",
  "Порада: 80/20 — нормально. Ідеальність не потрібна 🙂"
];

// Ввімкни true, якщо хочеш бачити кола зіткнень під час тесту
const DEBUG_HITBOX = false;

// intervals (let — щоб можна було перезапускати)
let loopInterval = null;
let spawnInterval = null;
let timerInterval = null;

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function roundRect(x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

function circleRectHit(cx, cy, r, rx, ry, rw, rh) {
  const nx = clamp(cx, rx, rx + rw);
  const ny = clamp(cy, ry, ry + rh);
  const dx = cx - nx;
  const dy = cy - ny;
  return (dx*dx + dy*dy) <= r*r;
}

function setTipRandom(){
  tipEl.textContent = TIPS[Math.floor(Math.random()*TIPS.length)];
}

function updateHud(){
  document.getElementById("score").innerText = score;
  document.getElementById("lives").innerText = lives;
  document.getElementById("time").innerText = time;
}

function showOverlay(type){
  // type: "win" | "lose"
  overlay.classList.remove("hidden");

  const isWin = type === "win";

  resultBadge.textContent = isWin ? "🏆" : "😅";
  resultBadge.style.background = isWin ? "rgba(34,197,94,.14)" : "rgba(239,68,68,.12)";
  resultBadge.style.color = isWin ? "#15803d" : "#b91c1c";

  resultTitle.textContent = isWin
    ? "Вітаю! Ти протримався 2 хв ✅"
    : "Поразка… але ти можеш краще 💪";

  resultScore.textContent = score;

  resultStats.textContent = `Корисного: ${goodCaught}. Шкідливого: ${badCaught}.`;
}

function stopIntervals(){
  if (loopInterval) clearInterval(loopInterval);
  if (spawnInterval) clearInterval(spawnInterval);
  if (timerInterval) clearInterval(timerInterval);
  loopInterval = spawnInterval = timerInterval = null;
}

function endGame(type){
  if (isGameOver) return;
  isGameOver = true;
  stopIntervals();
  showOverlay(type);
}

function restartGame(){
  stopIntervals();

  // reset state
  items = [];
  score = 0;
  lives = 3;
  time = 120;
  isGameOver = false;
  goodCaught = 0;
  badCaught = 0;

  // reset UI
  overlay.classList.add("hidden");
  setTipRandom();
  updateHud();

  // restart intervals
  loopInterval = setInterval(update, 20);
  spawnInterval = setInterval(spawnItem, 650);
  timerInterval = setInterval(() => {
    if (isGameOver) return;
    time -= 1;
    if (time <= 0){
      time = 0;
      updateHud();
      endGame("win");
    } else {
      updateHud();
    }
  }, 1000);
}

function exitGame(){
  // Telegram WebApp close
  if (window.Telegram && window.Telegram.WebApp && typeof window.Telegram.WebApp.close === "function") {
    window.Telegram.WebApp.close();
    return;
  }

  // Browser fallback
  try { window.close(); } catch(e) {}
  try { history.back(); } catch(e) {}
}

function drawBackground(){
  for(let i=0;i<10;i++){
    const x = (i*37 + (time*3)%cssW);
    const y = (i*53 + (time*2)%cssH);
    ctx.beginPath();
    ctx.fillStyle = "rgba(34,197,94,0.05)";
    ctx.arc(x%cssW, y%cssH, 10 + (i%3)*6, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawBasket(){
  ctx.fillStyle = "#0f172a";
  roundRect(basket.x, basket.y, basket.w, basket.h, 12);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PLATE", basket.x + basket.w/2, basket.y + basket.h/2);
}

function spawnItem(){
  if (isGameOver) return;

  // 72% good, 28% bad
  const isGood = Math.random() < 0.72;
  const pick = isGood
    ? GOOD[Math.floor(Math.random()*GOOD.length)]
    : BAD[Math.floor(Math.random()*BAD.length)];

  const r = 18; // hitbox radius

  items.push({
    x: Math.random() * (cssW - 40) + 20,
    y: -30,
    r,
    v: 2.0 + Math.random()*1.6,
    type: isGood ? "good" : "bad",
    icon: pick.icon
  });
}

function drawEmojiItem(it){
  const isGood = it.type === "good";

  // shadow
  ctx.fillStyle = "rgba(15,23,42,0.06)";
  roundRect(it.x - 24, it.y - 22, 48, 44, 14);
  ctx.fill();

  // outline
  ctx.strokeStyle = isGood ? "rgba(22,163,74,0.55)" : "rgba(239,68,68,0.55)";
  ctx.lineWidth = 2;
  roundRect(it.x - 24, it.y - 22, 48, 44, 14);
  ctx.stroke();

  // emoji center
  ctx.font = "28px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#0f172a";
  ctx.fillText(it.icon, it.x, it.y);

  // debug hitbox
  if (DEBUG_HITBOX) {
    ctx.beginPath();
    ctx.strokeStyle = "rgba(15,23,42,0.35)";
    ctx.lineWidth = 1;
    ctx.arc(it.x, it.y, it.r, 0, Math.PI*2);
    ctx.stroke();
  }
}

function update(){
  if (isGameOver) return;

  ctx.clearRect(0,0,cssW,cssH);
  drawBackground();
  drawBasket();

  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    it.y += it.v;

    if (it.y - it.r > cssH + 40) {
      items.splice(i, 1);
      continue;
    }

    drawEmojiItem(it);

    const hit = circleRectHit(it.x, it.y, it.r, basket.x, basket.y, basket.w, basket.h);
    if (hit) {
      if (it.type === "good") {
        score += 1;
        goodCaught += 1;
        if (goodCaught % 5 === 0) setTipRandom();
      } else {
        lives -= 1;
        badCaught += 1;
        setTipRandom();
      }

      items.splice(i, 1);

      if (lives <= 0) {
        lives = 0;
        updateHud();
        endGame("lose");
        return;
      }
    }
  }

  updateHud();
}

function setBasketByClientX(clientX){
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  basket.x = clamp(x - basket.w/2, 0, cssW - basket.w);
}

canvas.addEventListener("mousemove", e => setBasketByClientX(e.clientX));
canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  setBasketByClientX(e.touches[0].clientX);
}, { passive:false });

// Buttons
btnReplay.addEventListener("click", restartGame);
btnExit.addEventListener("click", exitGame);

// Start
restartGame();
