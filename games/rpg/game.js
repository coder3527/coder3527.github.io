// Zelda-like Minish Cap - Mini jeu HTML5 Canvas, mobile-friendly
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const TILE = 32;
const PLAYER_SIZE = 28;
const ENEMY_SIZE = 28;
const BOSS_SIZE = 48;

let keys = {left: false, right: false, up: false, down: false, action: false};

// Mobile controls
document.getElementById('left-btn').ontouchstart = () => keys.left = true;
document.getElementById('left-btn').ontouchend = () => keys.left = false;
document.getElementById('right-btn').ontouchstart = () => keys.right = true;
document.getElementById('right-btn').ontouchend = () => keys.right = false;
document.getElementById('up-btn').ontouchstart = () => keys.up = true;
document.getElementById('up-btn').ontouchend = () => keys.up = false;
document.getElementById('down-btn').ontouchstart = () => keys.down = true;
document.getElementById('down-btn').ontouchend = () => keys.down = false;
document.getElementById('action-btn').ontouchstart = () => keys.action = true;
document.getElementById('action-btn').ontouchend = () => keys.action = false;

// Desktop controls (pour debug)
window.addEventListener('keydown', e => {
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
  if (e.key === "ArrowUp") keys.up = true;
  if (e.key === "ArrowDown") keys.down = true;
  if (e.key === " " || e.key === "z") keys.action = true;
});
window.addEventListener('keyup', e => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
  if (e.key === "ArrowUp") keys.up = false;
  if (e.key === "ArrowDown") keys.down = false;
  if (e.key === " " || e.key === "z") keys.action = false;
});

// -- Game state
let state = "menu"; // menu | play | gameover | win
let currentLevel = 0;

// --- Levels definition (simple)
const levels = [
  // Level 1 : plaine
  {
    name: "Plaine Verte",
    map: [
      "....................",
      "....................",
      "....####............",
      "...#....#...........",
      "...#..E.#.......E...",
      "...#....#...........",
      "....####............",
      "....................",
      "..........P.........",
      "...................."
    ],
    enemies: [{x: 6, y: 4, type:"slime"}, {x: 15, y: 4, type:"slime"}],
    boss: null,
    next: 1
  },
  // Donjon 1
  {
    name: "Donjon de la Forêt",
    map: [
      "....................",
      ".####...............",
      ".#..#..E.....E......",
      ".#..#...............",
      ".#..#...............",
      ".####...............",
      "....................",
      "...#######..........",
      "...#.....#....B.....",
      "...#######.........."
    ],
    enemies: [{x:7, y:2, type:"bat"}, {x:12, y:2, type:"bat"}],
    boss: {x:15, y:8, type:"boss"},
    next: null // last level
  }
];

function tileAt(level, x, y) {
  if (y < 0 || x < 0 || y >= level.map.length || x >= level.map[0].length)
    return "#";
  return level.map[y][x];
}

// ---- Player object
const player = {
  x: 10, y: 8, px: 0, py: 0, hp: 3, invuln: 0, atkTimer: 0,
  reset(level) {
    for (let y = 0; y < level.map.length; y++)
      for (let x = 0; x < level.map[0].length; x++)
        if (level.map[y][x] === "P") {
          this.x = x; this.y = y;
        }
    this.px = this.x * TILE + (TILE-PLAYER_SIZE)/2;
    this.py = this.y * TILE + (TILE-PLAYER_SIZE)/2;
    this.hp = 3;
    this.invuln = 0;
    this.atkTimer = 0;
  }
};

function startLevel(n) {
  currentLevel = n;
  player.reset(levels[n]);
  enemies = levels[n].enemies.map(e => ({
    x: e.x, y: e.y, type: e.type, hp: 1, dir: 1, alive: true
  }));
  boss = levels[n].boss ? {x: levels[n].boss.x, y: levels[n].boss.y, hp: 5, atk: 0, alive: true} : null;
}

let enemies = [], boss = null;

// -- Draw functions
function drawMap(level) {
  for (let y = 0; y < level.map.length; y++)
    for (let x = 0; x < level.map[0].length; x++) {
      let c = level.map[y][x];
      if (c === "#") {
        ctx.fillStyle = "#484";
        ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
      } else {
        ctx.fillStyle = "#222";
        ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
      }
    }
}

function drawPlayer() {
  ctx.save();
  ctx.globalAlpha = player.invuln > 0 ? 0.5 : 1;
  ctx.fillStyle = "#3cf";
  ctx.fillRect(player.px, player.py, PLAYER_SIZE, PLAYER_SIZE);
  ctx.fillStyle = "#fff";
  ctx.fillRect(player.px+8, player.py+8, 12, 12); // face
  ctx.restore();
  // Attaque
  if (player.atkTimer > 0) {
    ctx.fillStyle = "#fc3";
    ctx.fillRect(player.px+PLAYER_SIZE/2-4, player.py-12, 8, 20);
  }
}

function drawEnemies() {
  for (let e of enemies)
    if (e.alive) {
      ctx.fillStyle = (e.type === "slime") ? "#5c5" : "#c5c";
      ctx.fillRect(e.x*TILE+(TILE-ENEMY_SIZE)/2, e.y*TILE+(TILE-ENEMY_SIZE)/2, ENEMY_SIZE, ENEMY_SIZE);
    }
}

function drawBoss() {
  if (boss && boss.alive) {
    ctx.fillStyle = "#c33";
    ctx.fillRect(boss.x*TILE+(TILE-BOSS_SIZE)/2, boss.y*TILE+(TILE-BOSS_SIZE)/2, BOSS_SIZE, BOSS_SIZE);
    ctx.fillStyle = "#fff";
    ctx.fillText("Boss", boss.x*TILE+5, boss.y*TILE+BOSS_SIZE/2);
  }
}

// -- Game loop
function update() {
  if (state === "menu" || state === "gameover" || state === "win") return;
  // Player movement
  let vx = (keys.right?1:0)-(keys.left?1:0);
  let vy = (keys.down?1:0)-(keys.up?1:0);

  if (vx !== 0 || vy !== 0) {
    let nx = player.px + vx*3;
    let ny = player.py + vy*3;
    let tx = Math.floor((nx+PLAYER_SIZE/2)/TILE);
    let ty = Math.floor((ny+PLAYER_SIZE/2)/TILE);
    if (tileAt(levels[currentLevel], tx, ty) !== "#") {
      player.px = nx;
      player.py = ny;
      player.x = Math.floor((player.px+PLAYER_SIZE/2)/TILE);
      player.y = Math.floor((player.py+PLAYER_SIZE/2)/TILE);
    }
  }

  // Attack
  if (keys.action && player.atkTimer <= 0) {
    player.atkTimer = 10;
  }
  if (player.atkTimer > 0) player.atkTimer--;

  // Enemy AI
  for (let e of enemies)
    if (e.alive) {
      let dx = player.x - e.x, dy = player.y - e.y;
      if (Math.abs(dx)+Math.abs(dy) < 5) {
        if (Math.abs(dx) > Math.abs(dy)) e.x += Math.sign(dx)*0.05;
        else e.y += Math.sign(dy)*0.05;
      }
      // Hit player
      if (Math.abs(e.x - player.x) < 0.7 && Math.abs(e.y - player.y) < 0.7 && player.invuln <= 0) {
        player.hp--;
        player.invuln = 30;
        if (player.hp <= 0) state = "gameover";
      }
      // Hit by attack
      if (player.atkTimer > 0 &&
          Math.abs(e.x - player.x) < 1 &&
          Math.abs(e.y - player.y-1) < 1) {
        e.alive = false;
      }
    }
  // Boss AI
  if (boss && boss.alive) {
    boss.atk = (boss.atk+1)%90;
    if (boss.atk % 30 === 0) {
      // Lancer une attaque si proche
      if (Math.abs(player.x-boss.x)<2 && Math.abs(player.y-boss.y)<2 && player.invuln<=0) {
        player.hp--;
        player.invuln = 30;
        if (player.hp <= 0) state = "gameover";
      }
    }
    // Bouger
    if (boss.atk % 50 === 0) {
      boss.x += Math.sign(player.x-boss.x);
      boss.y += Math.sign(player.y-boss.y);
    }
    // Hit by attack
    if (player.atkTimer > 0 && Math.abs(player.x-boss.x)<2 && Math.abs(player.y-boss.y-1)<2) {
      boss.hp--;
      if (boss.hp <= 0) boss.alive = false;
    }
  }
  // Next level
  if (!enemies.some(e => e.alive) && (!boss || !boss.alive)) {
    if (levels[currentLevel].next !== null) {
      startLevel(levels[currentLevel].next);
    } else {
      state = "win";
    }
  }
  // Invulnerability
  if (player.invuln > 0) player.invuln--;
}

function draw() {
  ctx.clearRect(0,0,W,H);
  if (state === "menu") {
    ctx.fillStyle = "#fff";
    ctx.font = "24px Arial";
    ctx.fillText("Zelda-like Mini", 120, 120);
    ctx.font = "16px Arial";
    ctx.fillText("Appuie sur A pour jouer", 120, 150);
  } else if (state === "play") {
    drawMap(levels[currentLevel]);
    drawPlayer();
    drawEnemies();
    drawBoss();
    // UI
    ctx.fillStyle = "#fff";
    ctx.font = "16px Arial";
    ctx.fillText("Vie: " + player.hp, 10, 20);
    ctx.fillText(levels[currentLevel].name, 150, 20);
  } else if (state === "gameover") {
    ctx.fillStyle = "#f44";
    ctx.font = "32px Arial";
    ctx.fillText("Game Over", 120, 120);
    ctx.font = "16px Arial";
    ctx.fillText("Appuie sur A pour recommencer", 120, 160);
  } else if (state === "win") {
    ctx.fillStyle = "#3f3";
    ctx.font = "32px Arial";
    ctx.fillText("Victoire!", 150, 120);
    ctx.font = "16px Arial";
    ctx.fillText("Bravo, tu as vaincu le boss!", 120, 160);
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Game start
gameLoop();
setInterval(() => {
  if (state === "menu" && keys.action) {
    state = "play";
    startLevel(0);
  }
  if ((state === "gameover" || state === "win") && keys.action) {
    state = "menu";
  }
}, 100);
