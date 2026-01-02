const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let basket = { x: 150, y: 540, w: 80, h: 22 };
let items = [];
let score = 0;
let lives = 3;
let time = 120;
let isGameOver = false;

const good = ["🥦","🥑","🍗","🥬","🍎"];
const bad  = ["🍔","🍟","🥤","🍩"];

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function spawnItem() {
  if (isGameOver) return;

  // трошки легше: 70% good, 30% bad
  const isGood = Math.random() < 0.7;

  items.push({
    x: Math.random() * (canvas.width - 30) + 5,
    y: -20,
    v: 1.8 + Math.random() * 1.6,
    type: isGood ? "good" : "bad",
    icon: isGood
      ? good[Math.floor(Math.random() * good.length)]
      : bad[Math.floor(Math.random() * bad.length)]
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
}

function update() {
  if (isGameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // basket
  ctx.fillRect(basket.x, basket.y, basket.w, basket.h);

  // items (йдемо з кінця, щоб splice був безпечний)
  for (let idx = items.length - 1; idx >= 0; idx--) {
    const i = items[idx];
    i.y += i.v;

    // draw
    ctx.font = "26px serif";
    ctx.fillText(i.icon, i.x, i.y);

    // якщо впало вниз — видаляємо
    if (i.y > canvas.height + 30) {
      items.splice(idx, 1);
      continue;
    }

    // collision (перевіряємо "область" предмета)
    const itemW = 24;
    const itemH = 24;

    const hit =
      i.x + itemW > basket.x &&
      i.x < basket.x + basket.w &&
      i.y + itemH > basket.y &&
      i.y < basket.y + basket.h;

    if (hit) {
      if (i.type === "good") score += 1;
      else lives -= 1;

      items.splice(idx, 1);

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

function setBasketX(clientX) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  basket.x = clamp(x - basket.w / 2, 0, canvas.width - basket.w);
}

// mouse
canvas.addEventListener("mousemove", e => setBasketX(e.clientX));

// touch
canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  setBasketX(e.touches[0].clientX);
}, { passive: false });

// intervals
const loopInterval = setInterval(update, 20);

const spawnInterval = setInterval(spawnItem, 650);

const timerInterval = setInterval(() => {
  if (isGameOver) return;
  time--;
  if (time <= 0) {
    time = 0;
    updateHud();
    endGame();
  } else {
    updateHud();
  }
}, 1000);

// стартовий HUD
updateHud();
