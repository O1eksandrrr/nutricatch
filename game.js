const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tipEl = document.getElementById("tip");

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
  { name: "Asparagus", tag:"Fiber" },
  { name: "Avocado", tag:"Healthy fats" },
  { name: "Chicken", tag:"Protein" },
  { name: "Cabbage", tag:"Vitamins" },
  { name: "Oats", tag:"Slow carbs" },
  { name: "Greek yogurt", tag:"Protein" },
  { name: "Salmon", tag:"Omega-3" },
  { name: "Berries", tag:"Antioxidants" },
];

const BAD = [
  { name: "Burger", tag:"Ultra-processed" },
  { name: "Fries", tag:"Fried" },
  { name: "Soda", tag:"Sugar" },
  { name: "Donut", tag:"Sugar" },
  { name: "Chips", tag:"Salt+fat" },
];

const TIPS = [
  "Порада: білок + клітковина = ситість надовше ✅",
  "Порада: вода допомагає контролювати апетит 💧",
  "Порада: овочі = обʼєм + мікронутрієнти 🥬",
  "Порада: сон впливає на тягу до солодкого 😴",
  "Порада: 80/20 — нормально. Ідеальність не потрібна 🙂"
];

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

function spawnItem(){
  if (isGameOver) return;

  // 72% good, 28% bad — щоб це було приємно
  const isGood = Math.random() < 0.72;
  const pick = isGood
    ? GOOD[Math.floor(Math.random()*GOOD.length)]
    : BAD[Math.floor(Math.random()*BAD.length)];

  const w = 132;
  const h = 44;

  items.push({
    x: Math.random() * (cssW - w - 16) + 8,
    y: -h,
    w, h,
    v: 1.9 + Math.random()*1.6,
    type: isGood ? "good" : "bad",
    name: pick.name,
    tag: pick.tag
  });
}

function rectHit(ax, ay, aw, ah, bx, by, bw, bh){
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function setTipRandom(){
  tipEl.textContent = TIPS[Math.floor(Math.random()*TIPS.length)];
}

function updateHud(){
  document.getElementById("score").innerText = score;
  document.getElementById("lives").innerText = lives;
  document.getElementById("time").innerText = time;
}

function endGame(){
  if (isGameOver) return;
  isGameOver = true;

  clearInterval(loopInterval);
  clearInterval(timerInterval);
  clearInterval(spawnInterval);

  document.getElementById("finalScore").innerText = score;

  const summary = document.getElementById("summary");
  summary.textContent = `Ти зловив корисного: ${goodCaught}. Пропустив/зловив шкідливого: ${badCaught}.`;

  document.getElementById("end").classList.remove("hidden");
}

function drawBackground(){
  // легкі “бульбашки” як мікро-вайб здоровʼя
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
  // “тарілка” (мінімалістично)
  ctx.fillStyle = "#0f172a";
  roundRect(basket.x, basket.y, basket.w, basket.h, 12);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PLATE", basket.x + basket.w/2, basket.y + basket.h/2);
}

function drawItem(it){
  // тінь
  ctx.fillStyle = "rgba(15,23,42,0.08)";
  roundRect(it.x+2, it.y+3, it.w, it.h, 12);
  ctx.fill();

  // картка
  const isGood = it.type === "good";
  ctx.fillStyle = isGood ? "rgba(22,163,74,0.12)" : "rgba(239,68,68,0.12)";
  ctx.strokeStyle = isGood ? "rgba(22,163,74,0.35)" : "rgba(239,68,68,0.35)";
  ctx.lineWidth = 1;

  roundRect(it.x, it.y, it.w, it.h, 12);
  ctx.fill();
  ctx.stroke();

  // маркер
  ctx.fillStyle = isGood ? "#16a34a" : "#ef4444";
  ctx.beginPath();
  ctx.arc(it.x+16, it.y+it.h/2, 6, 0, Math.PI*2);
  ctx.fill();

  // текст
  ctx.fillStyle = "#0f172a";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(it.name, it.x+30, it.y+20);

  ctx.fillStyle = "rgba(100,116,139,1)";
  ctx.font = "10px sans-serif";
  ctx.fillText(it.tag, it.x+30, it.y+35);
}

function update(){
  if (isGameOver) return;

  ctx.clearRect(0,0,cssW,cssH);
  drawBackground();
  drawBasket();

  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    it.y += it.v;

    // нижче екрану — прибираємо
    if (it.y > cssH + 60) {
      items.splice(i, 1);
      continue;
    }

    drawItem(it);

    // collision
    if (rectHit(it.x, it.y, it.w, it.h, basket.x, basket.y, basket.w, basket.h)) {
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
        endGame();
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

// mouse/touch
canvas.addEventListener("mousemove", e => setBasketByClientX(e.clientX));
canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  setBasketByClientX(e.touches[0].clientX);
}, { passive:false });

// intervals
const loopInterval = setInterval(update, 20);
const spawnInterval = setInterval(spawnItem, 650);

const timerInterval = setInterval(() => {
  if (isGameOver) return;
  time -= 1;
  if (time <= 0){
    time = 0;
    updateHud();
    endGame();
  } else {
    updateHud();
  }
}, 1000);

updateHud();
setTipRandom();
