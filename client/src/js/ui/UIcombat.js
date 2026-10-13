const gameScreen = document.getElementById('game-screen');
const enemyBox = document.getElementById('enemy-box');
const playerBox = document.getElementById('player-box');
const startBtn = document.getElementById('start-mission-btn');
const returnVillageBtn = document.getElementById('return-village-btn');

function healthPercent(current, max) {
  if (!Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

function createHealthView(name, currentHp, maxHp, className) {
  const wrapper = document.createElement('div');
  wrapper.className = className;

  const title = document.createElement('div');
  title.className = `${className}-name`;
  title.textContent = name;

  const bar = document.createElement('div');
  bar.className = 'hp-bar';
  const fill = document.createElement('div');
  fill.className = 'hp-fill';
  fill.style.width = `${healthPercent(currentHp, maxHp)}%`;
  bar.appendChild(fill);

  const text = document.createElement('div');
  text.className = 'hp-text';
  text.textContent = `${Math.max(0, currentHp)}/${maxHp}`;

  wrapper.append(title, bar, text);
  return wrapper;
}

class CombatUI {
  static init() {
  if (!startBtn) return;

  if (returnVillageBtn) {
    returnVillageBtn.onclick = () => {
      window.location.href = '../../dev/lobbydev.html';
    };
  }

  if (document.body.dataset.page === 'home') {
    startBtn.onclick = () => {
      window.location.href = 'combat.html?start=1';
    };
    return;
  }


  if (playerBox) playerBox.style.display = 'none';
  if (enemyBox) enemyBox.style.display = 'none';

  startBtn.onclick = () => {
    if (missionRunning) return;

    const started = startGameLoop();

    if (started) {
      if (returnVillageBtn) returnVillageBtn.hidden = true;

      CombatUI.updateStartButton('Em combate...');

      if (playerBox) playerBox.style.display = 'block';
      if (enemyBox) enemyBox.style.display = 'block';

      CombatUI.updatePlayerHp();
    }
  };

  const params = new URLSearchParams(window.location.search);

  if (params.get('start') === '1') {
    startBtn.click();
  }
}

  static updateStartButton(text) {
    if (!startBtn) return;
    startBtn.textContent = text;
    startBtn.disabled = missionRunning;
  }

  static updatePlayerHp() {
    if (!playerBox) return;

    const currentHp = Inventory.getPlayerHp();
    const maxHp = Inventory.getPlayerMaxHp();

    playerBox.replaceChildren(
      createHealthView('Jogador', currentHp, maxHp, 'player')
    );
  }

  static updateEnemy(enemy) {
    if (!enemyBox || !enemy) return;

    const maxHp = Math.max(
      1,
      Number(enemy.maxHp) || Number(enemy.hp) || 1
    );

    const label = enemy.isBoss
      ? `${enemy.name} (CHEFE)`
      : enemy.name;

    enemyBox.replaceChildren(
      createHealthView(label, enemy.hp, maxHp, 'enemy')
    );
  }

  static showRestTimer(timeLeft) {
    if (gameScreen) {
      gameScreen.textContent = `Descansando... ${timeLeft}s`;
    }
  }

  static showCombat() {
    if (gameScreen) {
      gameScreen.textContent = 'Em combate!';
    }
  }

  static showMissionComplete() {
    if (!gameScreen) return;

    gameScreen.textContent = 'Missão concluída!';
    if (returnVillageBtn) returnVillageBtn.hidden = false;

    setTimeout(() => {
      gameScreen.textContent = '';
      CombatUI.updateStartButton('Iniciar missão');
    }, 3000);
  }

  static showGameOver() {
    if (!gameScreen) return;

    gameScreen.textContent = 'Derrota. Prepare-se e tente novamente.';

    setTimeout(() => {
      gameScreen.textContent = '';
      CombatUI.updateStartButton('Iniciar missão');
    }, 3000);
  }
}
