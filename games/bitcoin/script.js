// --- Game State ---
let game = {
  btc: 0,
  btcPerClick: 1,
  upgrades: [
    { name: "Faster Mouse", desc: "Increase BTC/click by 1", cost: 10, owned: 0, type: "click", value: 1, costScale: 1.6 },
    { name: "GPU Miner", desc: "+0.2 BTC/sec", cost: 50, owned: 0, type: "auto", value: 0.2, costScale: 1.7 },
    { name: "ASIC Miner", desc: "+1 BTC/sec", cost: 200, owned: 0, type: "auto", value: 1, costScale: 1.75 },
    { name: "Mining Pool", desc: "+5 BTC/sec", cost: 1000, owned: 0, type: "auto", value: 5, costScale: 1.8 },
    { name: "Data Center", desc: "+25 BTC/sec", cost: 5000, owned: 0, type: "auto", value: 25, costScale: 1.85 },
    { name: "Quantum Chip", desc: "+100 BTC/sec", cost: 20000, owned: 0, type: "auto", value: 100, costScale: 1.9 },
    { name: "Elon Tweet", desc: "Doubles all production", cost: 100000, owned: 0, type: "mult", value: 2, costScale: 2.1 },
    { name: "AI Botnet", desc: "+500 BTC/sec", cost: 500000, owned: 0, type: "auto", value: 500, costScale: 2.2 },
    { name: "Dark Web Contracts", desc: "+2,000 BTC/sec", cost: 2000000, owned: 0, type: "auto", value: 2000, costScale: 2.3 },
    { name: "Moon Operation", desc: "x3 to all income", cost: 1e7, owned: 0, type: "mult", value: 3, costScale: 2.5 }
  ],
  multipliers: 1,
  btcPerSec: 0
};

// --- DOM Elements ---
const btcAmount = document.getElementById("btc-amount");
const clickBtn = document.getElementById("click-btn");
const btcPerSecElem = document.getElementById("btc-per-sec");
const shopElem = document.getElementById("shop");
const saveBtn = document.getElementById("save-btn");
const loadBtn = document.getElementById("load-btn");
const resetBtn = document.getElementById("reset-btn");

// --- Functions ---
function updateShop() {
  shopElem.innerHTML = "";
  game.upgrades.forEach((upg, i) => {
    const div = document.createElement("div");
    div.className = "upgrade";
    div.innerHTML = `
      <div>
        <div class="upgrade-name">${upg.name} (x${upg.owned})</div>
        <div class="upgrade-desc">${upg.desc}</div>
      </div>
      <div>
        <span class="upgrade-cost">${upg.type === "auto" ? "+" : ""}${upg.value}${upg.type === "auto" ? " BTC/sec" : upg.type === "click" ? " BTC/click" : "x"}</span><br/>
        <button class="upgrade-btn" ${game.btc < upg.cost ? "disabled" : ""} data-upg="${i}">
          Buy (${Math.floor(upg.cost)} BTC)
        </button>
      </div>
    `;
    shopElem.appendChild(div);
  });
  document.querySelectorAll(".upgrade-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const idx = parseInt(btn.getAttribute("data-upg"));
      buyUpgrade(idx);
    });
  });
}

function updateDisplay() {
  btcAmount.textContent = game.btc.toFixed(2);
  btcPerSecElem.textContent = getBtcPerSec().toFixed(2);
  updateShop();
}

function getBtcPerSec() {
  let perSec = 0;
  let multiplier = 1;
  game.upgrades.forEach(upg => {
    if (upg.type === "auto") perSec += upg.owned * upg.value;
  });
  game.upgrades.forEach(upg => {
    if (upg.type === "mult" && upg.owned > 0) multiplier *= Math.pow(upg.value, upg.owned);
  });
  game.multipliers = multiplier;
  return perSec * multiplier;
}

function getBtcPerClick() {
  let pcs = game.btcPerClick;
  let multiplier = 1;
  game.upgrades.forEach(upg => {
    if (upg.type === "click") pcs += upg.owned * upg.value;
    if (upg.type === "mult" && upg.owned > 0) multiplier *= Math.pow(upg.value, upg.owned);
  });
  return pcs * multiplier;
}

/*function buyUpgrade(idx) {
  const upg = game.upgrades[idx];
  if (game.btc >= upg.cost) {
    game.btc -= upg.cost;
    upg.owned++;
    // scale cost
    upg.cost *= upg.costScale;
    updateDisplay();
  }
} */

/*function mineBitcoin() {
  game.btc += getBtcPerClick();
  updateDisplay();
}*/

function autoMine() {
  game.btc += getBtcPerSec() / 10; // 100ms interval
  updateDisplay();
}
// ...existing code...

function saveGame() {
  localStorage.setItem("btcClickerSave", JSON.stringify(game));
}

// --- AUTOSAVE: Save every 5 seconds ---
setInterval(saveGame, 500);

// Optional: Save after key actions
function mineBitcoin() {
  game.btc += getBtcPerClick();
  updateDisplay();
  saveGame(); // Save after clicking
}

function buyUpgrade(idx) {
  const upg = game.upgrades[idx];
  if (game.btc >= upg.cost) {
    game.btc -= upg.cost;
    upg.owned++;
    // scale cost
    upg.cost *= upg.costScale;
    updateDisplay();
    saveGame(); // Save after buying upgrade
  }
}

// ...existing code...

// The rest of your code remains unchanged, including window.onload = function() { loadGame(); }
//function saveGame() {
 // localStorage.setItem("btcClickerSave", JSON.stringify(game));
//}

function loadGame() {
  const data = localStorage.getItem("btcClickerSave");
  if (data) {
    const parsed = JSON.parse(data);
    // Handle upgrades schema migration
    parsed.upgrades.forEach((upg, i) => {
      if (game.upgrades[i]) {
        game.upgrades[i].owned = upg.owned;
        game.upgrades[i].cost = upg.cost;
      }
    });
    game.btc = parsed.btc;
    game.btcPerClick = parsed.btcPerClick;
    updateDisplay();
  }
}

function resetGame() {
  if (confirm("Reset all progress?")) {
    localStorage.removeItem("btcClickerSave");
    location.reload();
  }
}
setInterval(autoMine, 100);
// --- Event Listeners ---
clickBtn.addEventListener("click", mineBitcoin);
saveBtn.addEventListener("click", () => {
  saveGame();
  alert("Game saved!");
});
loadBtn.addEventListener("click", () => {
  loadGame();
  alert("Game loaded!");
});
resetBtn.addEventListener("click", resetGame);

window.addEventListener("beforeunload", saveGame);

// --- Game Loop ---
updateDisplay();
setInterval(autoMine, 100); // 0.1s per tick

// --- Load Save if exists ---
window.onload = function() {
  loadGame();
};
