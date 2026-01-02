const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let basket = { x: 160, y: 540, w: 60, h: 20 };
let items = [];
let score = 0;
let lives = 3;
let time = 120;

const good = ["🥦","🥑","🍗","🥬","🍎"];
const bad = ["🍔","🍟","🥤","🍩"];

function spawnItem() {
  const isGood = Math.random() > 0.4;
  items.push({
    x: Math.random() * 320,
    y: -20,
    v: 2 + Math.random() * 2,
    type: isGood ? "good" : "bad",
    icon: isGood
      ? good[Math.floor(Math.random()*good.length)]
      : bad[Math.floor(Math.random()*bad.length)]
  });
}

function update() {
  ctx.clearRect(0,0,360,600);

  // basket
  ctx.fillRect(basket.x, basket.y, basket.w, basket.h);

  items.forEach(i => {
    i.y += i.v;
    ctx.font = "24px serif";
    ctx.fillText(i.icon, i.x, i.y);

    if (
      i.y > basket.y &&
      i.x > basket.x &&
      i.x < basket.x + basket.w
    ) {
      if (i.type === "good") score++;
      else lives--;
      items.splice(items.indexOf(i),1);
    }
  });

  document.getElementById("score").innerText = score;
  document.getElementById("lives").innerText = lives;

  if (lives <= 0 || time <= 0) endGame();
}

function endGame() {
  clearInterval(loop);
  clearInterval(timer);
  document.getElementById("finalScore").innerText = score;
  document.getElementById("end").classList.remove("hidden");
}

canvas.addEventListener("mousemove", e => {
  basket.x = e.offsetX - basket.w / 2;
});

canvas.addEventListener("touchmove", e => {
  basket.x = e.touches[0].clientX - basket.w / 2;
});

const loop = setInterval(update, 20);
setInterval(spawnItem, 700);

const timer = setInterval(() => {
  time--;
  document.getElementById("time").innerText = time;
  if (time <= 0) endGame();
}, 1000);
