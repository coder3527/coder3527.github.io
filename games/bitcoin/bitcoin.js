document.addEventListener('DOMContentLoaded', function() {
    const mineButton = document.getElementById('mineButton');
    const bitcoinCountSpan = document.getElementById('bitcoinCount');
    const buyMinerButton = document.getElementById('buyMiner');
    const minerCostSpan = document.getElementById('minerCost');
    const bpsSpan = document.getElementById('bps');

    let bitcoinCount = 0;
    let minerCost = 10;
    let bitcoinsPerSecond = 0;

    mineButton.addEventListener('click', function() {
        bitcoinCount++;
        bitcoinCountSpan.textContent = bitcoinCount;
    });

    buyMinerButton.addEventListener('click', function() {
        if (bitcoinCount >= minerCost) {
            bitcoinCount -= minerCost;
            bitcoinsPerSecond++;
            minerCost = Math.floor(minerCost * 1.1); // Increase cost
            bitcoinCountSpan.textContent = bitcoinCount;
            minerCostSpan.textContent = minerCost;
            bpsSpan.textContent = bitcoinsPerSecond;
        } else {
            alert('Not enough Bitcoins!');
        }
    });

    // Bitcoin per second update
    setInterval(function() {
        bitcoinCount += bitcoinsPerSecond;
        bitcoinCountSpan.textContent = bitcoinCount;
    }, 1000);
});
