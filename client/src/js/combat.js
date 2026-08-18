let inventoryLocked = false;
let missionRunning = false;

const CombatEvents = {
  listeners: {},

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  },

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
};

const missionEnemies = [
  { name: 'Goblin', hp: 30, attack: 6, defense: 2, isBoss: false },
  { name: 'Slime', hp: 25, attack: 4, defense: 1, isBoss: false },
  { name: 'Orc do Pântano', hp: 80, attack: 12, defense: 5, isBoss: true }
];

function performAttack(enemy) {
  const stats = Inventory.playerStats();
  const playerAttack = stats.strength || 0;
  const playerDefense = stats.defense || 0;
  const damageToEnemy = Math.max(1, playerAttack - enemy.defense);
  const damageToPlayer = Math.max(1, enemy.attack - playerDefense);

  enemy.hp = Math.max(0, enemy.hp - damageToEnemy);
  playerHp = Math.max(0, playerHp - damageToPlayer);
  Inventory.setPlayerHp(playerHp);

  console.log(`Você deu ${damageToEnemy} de dano em ${enemy.name}`);
  console.log(`${enemy.name} deu ${damageToPlayer} de dano`);
  console.log(`HP: ${playerHp}/${Inventory.getPlayerMaxHp()}`);
  CombatEvents.emit('enemyUpdate', enemy);
  CombatEvents.emit('playerHpUpdate');

  if (enemy.hp <= 0) CombatEvents.emit('enemy_dead', enemy);
  if (playerHp <= 0) CombatEvents.emit('player_defeated');
}

function startAutoBattle(enemy, onEnd) {
  inventoryLocked = true;
  CombatEvents.emit('combatStart');

  const interval = setInterval(() => {
    if (playerHp <= 0 || enemy.hp <= 0) {
      clearInterval(interval);
      onEnd(playerHp > 0);
      return;
    }
    performAttack(enemy);
  }, 1000);
}

function startRest(duration, onEnd) {
  inventoryLocked = false;
  CombatEvents.emit('inventory_Open');
  CombatEvents.emit('inventoryUnlocked');

  let timeLeft = Math.max(0, Number(duration) || 0);
  CombatEvents.emit('restStart', { timeLeft });

  if (timeLeft === 0) {
    inventoryLocked = true;
    onEnd();
    return;
  }

  const timer = setInterval(() => {
    timeLeft--;
    CombatEvents.emit('restStart', { timeLeft });

    if (timeLeft <= 0) {
      clearInterval(timer);
      inventoryLocked = true;
      onEnd();
    }
  }, 1000);
  CombatEvents.emit('inventory_close');
}

function startMission(onEnd) {
  let currentEnemyIndex = 0;
  CombatEvents.emit('mission_end');

  function finishMission(won) {
    inventoryLocked = false;
    missionRunning = false;
    CombatEvents.emit(won ? 'missionComplete' : 'gameOver');
    if (onEnd) onEnd(won);
  }

  function fightNext() {
    if (currentEnemyIndex >= missionEnemies.length) {
      finishMission(true);
      return;
    }

    const data = missionEnemies[currentEnemyIndex];
    const enemy = {
      name: data.name,
      hp: data.hp,
      maxHp: data.hp,
      attack: data.attack,
      defense: data.defense,
      isBoss: data.isBoss
    };

    CombatEvents.emit(enemy.isBoss ? 'boss_intro' : 'enemy_appear', { ...enemy });

    startAutoBattle(enemy, won => {
      if (!won) {
        finishMission(false);
        return;
      }

      currentEnemyIndex++;
      startRest(5, fightNext);
    });
  }

  fightNext();
}

function startGameLoop() {
  if (missionRunning) return false;

  missionRunning = true;
  CombatEvents.emit('mission_start');

  startRest(1, () => {
    startMission(won => {
      if (won && typeof UI !== 'undefined') UI.giveGold(200);
    });
  });
  return true;
}
