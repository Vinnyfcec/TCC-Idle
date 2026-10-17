const gameScreen = document.getElementById('game-screen');
const enemyBox = document.getElementById('enemy-box');
const playerBox = document.getElementById('player-box');
const startBtn = document.getElementById('start-mission-btn');
const returnVillageBtn = document.getElementById('return-village-btn');
const lootMessage = document.getElementById('loot-message');
const combatStage = document.getElementById('combat-stage');
const combatFooter = document.getElementById('combat-footer');
const inventoryGrid = document.getElementById('inventory-grid');
const inventoryPanel = document.getElementById('combat-inventory');
let showingRestStats = false;

function showCombatFooter(resting = false) {
  if (!combatFooter) return;
  combatFooter.hidden = false;
  combatFooter.classList.toggle('is-resting', resting);
  combatFooter.classList.remove('has-single-panel');
  document.body.style.setProperty(
    '--combat-footer-height',
    resting ? 'var(--combat-rest-height)' : '132px'
  );
}

function hideRestStats() {
  if (!showingRestStats) return;
  showingRestStats = false;
  CombatUI.updatePlayerHp();
}

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

  const params = new URLSearchParams(window.location.search);
  const locationTitle = document.getElementById('combat-location');
  if (locationTitle) {
    const missionId = params.get('mission') || 'swamp-road';
    locationTitle.textContent = params.get('mode') === 'road'
      ? 'Estrada'
      : DemoGame.missions[missionId]?.title || 'Missão';
  }

  if (returnVillageBtn) {
    returnVillageBtn.onclick = () => {
      DemoGame.beginTravel('lobby');
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
      showCombatFooter();
      startBtn.hidden = true;
      if (returnVillageBtn) returnVillageBtn.hidden = true;

      if (playerBox) playerBox.style.display = 'block';
      if (enemyBox) enemyBox.style.display = 'block';

      CombatUI.updatePlayerHp();
    }
  };

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
    playerBox.style.display = 'block';

    const playerView = createHealthView('Jogador', currentHp, maxHp, 'player');
    if (showingRestStats) {
      const stats = Inventory.playerStats();
      const statGrid = document.createElement('div');
      statGrid.className = 'rest-stat-grid';
      const statValues = [
        ['Dano', stats.strength],
        ['Defesa', stats.defense],
        ['Sorte', stats.luck],
        ['Crítico', `${Math.min(100, stats.luck)}%`]
      ];
      statValues.forEach(([label, value]) => {
        const stat = document.createElement('div');
        stat.className = 'rest-stat-item';

        const statLabel = document.createElement('span');
        statLabel.className = 'rest-stat-label';
        statLabel.textContent = label;

        const statValue = document.createElement('strong');
        statValue.className = 'rest-stat-value';
        statValue.textContent = value;

        stat.append(statLabel, statValue);
        statGrid.appendChild(stat);
      });
      playerView.appendChild(statGrid);
    }
    playerBox.replaceChildren(playerView);
  }

  static updateEnemy(enemy) {
    if (!enemyBox || !enemy) return;
    enemyBox.style.display = 'block';

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
    showingRestStats = true;
    showCombatFooter(true);
    CombatUI.updatePlayerHp();
    if (combatStage) {
      combatStage.classList.remove('phase-idle', 'phase-travel', 'phase-combat');
      combatStage.classList.add('phase-rest');
    }
    if (gameScreen) {
      gameScreen.textContent = `Descansando... ${timeLeft}s`;
    }
    if (enemyBox && inventoryGrid && inventoryPanel) {
      enemyBox.classList.add('inventory-board');
      enemyBox.appendChild(inventoryGrid);
      enemyBox.style.display = 'flex';
      inventoryPanel.hidden = true;
    }
  }

  static showCombat(enemy) {
    hideRestStats();
    showCombatFooter();
    if (combatStage) {
      combatStage.classList.remove('enemy-entering', 'enemy-approaching');
      combatStage.classList.remove('phase-idle', 'phase-travel', 'phase-rest');
      combatStage.classList.add('phase-combat');
    }
    if (enemyBox) {
      enemyBox.classList.remove('inventory-board');
      enemyBox.style.display = 'block';
    }
    if (inventoryGrid && inventoryPanel && !inventoryPanel.contains(inventoryGrid)) {
      inventoryPanel.appendChild(inventoryGrid);
    }
    const enemySprite = document.getElementById('enemy-sprite');
    if (enemySprite) enemySprite.dataset.name = enemy?.name || '';
    if (gameScreen) {
      gameScreen.textContent = enemy?.isRoadEncounter
        ? 'Um inimigo bloqueia a estrada!'
        : 'Em combate!';
    }
  }

  static showEnemyApproach(enemy) {
    if (!combatStage) return;
    const enemySprite = document.getElementById('enemy-sprite');
    if (enemySprite) enemySprite.dataset.name = enemy?.name || '';
    combatStage.classList.add('enemy-entering');
  }

  static showTravel() {
    hideRestStats();
    showCombatFooter();
    if (combatFooter) combatFooter.classList.add('has-single-panel');
    if (combatStage) {
      combatStage.classList.remove(
        'phase-idle',
        'phase-combat',
        'phase-rest',
        'enemy-entering'
      );
      combatStage.classList.add('phase-travel');
    }
    if (enemyBox) {
      enemyBox.classList.remove('inventory-board');
      enemyBox.style.display = 'none';
    }
    if (inventoryGrid && inventoryPanel && !inventoryPanel.contains(inventoryGrid)) {
      inventoryPanel.appendChild(inventoryGrid);
    }
    if (gameScreen) gameScreen.textContent = 'Na estrada...';
  }

  static closeRestBoard() {
    hideRestStats();
    showCombatFooter();
    if (enemyBox) enemyBox.classList.remove('inventory-board');
    if (inventoryGrid && inventoryPanel && !inventoryPanel.contains(inventoryGrid)) {
      inventoryPanel.appendChild(inventoryGrid);
    }
    if (inventoryPanel) inventoryPanel.hidden = true;
  }

  static showLoot(message) {
    if (lootMessage) lootMessage.textContent = message;
  }

  static showCritical({ damage }) {
    if (gameScreen) gameScreen.textContent = `Crítico! ${damage} de dano.`;
  }

  static showMissionComplete() {
    if (!gameScreen) return;

    const missionId = new URLSearchParams(window.location.search).get('mission');
    gameScreen.textContent = missionId === 'villain-negotiation'
      ? 'Negociação concluída! O mercador foi resgatado.'
      : missionId === 'orc-extermination'
        ? 'Extermínio concluído! Você recebeu 450 ouro.'
        : 'Missão concluída!';
    if (returnVillageBtn) returnVillageBtn.hidden = false;
  }

  static showMissionUnavailable(missionId) {
    if (!gameScreen) return;
    gameScreen.textContent = missionId === 'villain-negotiation'
      ? `Missão bloqueada. Reconstrua a casa do mercador, conclua um extermínio de orcs e tenha ${DemoGame.merchantRescueCost} ouro.`
      : 'Esta missão não está disponível.';
  }

  static showGameOver() {
    if (!gameScreen) return;

    gameScreen.textContent = 'Derrota. Prepare-se e tente novamente.';
  }
}
