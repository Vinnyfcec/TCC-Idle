const gameScreen = document.getElementById("game-screen");
const enemyBox = document.getElementById("enemy-box");
const playerBox = document.getElementById("player-box");
const startBtn = document.getElementById("start-mission-btn");

class CombatUI {
  static init() {
    startBtn.onclick = () => {
      if (!missionRunning) {
        startGameLoop();
        CombatUI.updateStartButton("Em Combate...");
      }
    };
    CombatUI.updatePlayerHp();
  }

  static updateStartButton(text) {
    startBtn.textContent = text;
    startBtn.disabled = missionRunning;
  }

  static updatePlayerHp() {
    const currentHp = Inventory.getPlayerHp();
    const maxHp = Inventory.getPlayerMaxHp();
    playerBox.innerHTML = `
      <div class="player-name">Jogador</div>
      <div class="hp-bar">
        <div class="hp-fill" style="width: ${(currentHp / maxHp) * 100}%"></div>
      </div>
      <div class="hp-text">${currentHp}/${maxHp}</div>
    `;
  }

  static updateEnemy(enemy) {
    const maxHp = enemy.maxHp;
    enemyBox.innerHTML = `
      <div class="enemy-name">${enemy.name} ${enemy.isBoss ? '(CHEFE)' : ''}</div>
      <div class="hp-bar">
        <div class="hp-fill" style="width: ${(enemy.hp / maxHp) * 100}%"></div>
      </div>
      <div class="hp-text">${enemy.hp}/${maxHp}</div>
    `;
  }

  static showRestTimer(timeLeft) {
    gameScreen.innerHTML = `<div class="rest-timer">Descansando... ${timeLeft}s</div>`;
  }

  static showCombat() {
    gameScreen.innerHTML = '<div class="combat-status">Em combate!</div>';
  }

  static showMissionComplete() {
    gameScreen.innerHTML = '<div class="mission-complete">MISSÃO COMPLETA!</div>';
    setTimeout(() => {
      gameScreen.innerHTML = '';
      CombatUI.updateStartButton("Iniciar Missão");
    }, 3000);
  }

  static showGameOver() {
    gameScreen.innerHTML = '<div class="game-over">SE FODEU!</div>';
    setTimeout(() => {
      gameScreen.innerHTML = '';
      CombatUI.updateStartButton("Iniciar Missão");
    }, 3000);
  }
}