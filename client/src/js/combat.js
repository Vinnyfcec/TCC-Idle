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

const missionEnemySets = {
  'swamp-road': {
    hasRoadEncounter: true,
    guaranteedBossRewardId: 7,
    enemies: [
      { name: 'Goblin', hp: 30, attack: 11, defense: 2, isBoss: false },
      { name: 'Slime', hp: 25, attack: 9, defense: 1, isBoss: false },
      { name: 'Orc do Pântano', hp: 80, attack: 15, defense: 5, isBoss: true }
    ]
  },
  'orc-extermination': {
    enemies: [
      { name: 'Goblin', hp: 30, attack: 11, defense: 2, isBoss: false },
      { name: 'Orc', hp: 80, attack: 15, defense: 5, isBoss: true },
      { name: 'Orc', hp: 80, attack: 15, defense: 5, isBoss: true }
    ]
  },
  'villain-negotiation': {
    enemies: [
      { name: 'Escudeiro Corrompido', hp: 125, attack: 14, defense: 5, isBoss: true }
    ]
  }
};

const roadEnemies = [
  { name: 'Goblin da estrada', hp: 24, attack: 10, defense: 1, isBoss: false },
  { name: 'Slime errante', hp: 22, attack: 9, defense: 1, isBoss: false },
  { name: 'Bandido', hp: 28, attack: 11, defense: 2, isBoss: false }
];

const accessoryDropIds = [7, 8, 9];
const bossRewardIds = [7, 8, 9, 10];
const bossWeaponDropChance = 0.1;

function performAttack(enemy) {
  const stats = Inventory.playerStats();
  const playerAttack = stats.strength || 0;
  const playerDefense = stats.defense || 0;
  const luck = Math.max(0, Number(stats.luck) || 0);
  const criticalChance = Math.min(1, luck * 0.01);
  const isCritical = criticalChance > 0 && Math.random() < criticalChance;
  const baseDamage = Math.max(1, playerAttack - enemy.defense);
  const damageToEnemy = baseDamage * (isCritical ? 2 : 1);

  enemy.hp = Math.max(0, enemy.hp - damageToEnemy);
  if (isCritical) {
    CombatEvents.emit('criticalHit', { enemy, damage: damageToEnemy });
  }

  if (enemy.hp > 0) {
    const damageToPlayer = Math.max(1, enemy.attack - playerDefense);
    playerHp = Math.max(0, playerHp - damageToPlayer);
    Inventory.setPlayerHp(playerHp);
  }

  CombatEvents.emit('enemyUpdate', enemy);
  CombatEvents.emit('playerHpUpdate');

  if (enemy.hp <= 0) CombatEvents.emit('enemy_dead', enemy);
  if (playerHp <= 0) CombatEvents.emit('player_defeated');
}

function startAutoBattle(enemyData, onEnd) {
  const enemy = {
    ...enemyData,
    maxHp: enemyData.hp
  };
  inventoryLocked = true;
  CombatEvents.emit('inventory_close');
  CombatEvents.emit('combatStart', enemy);
  CombatEvents.emit(enemy.isBoss ? 'boss_intro' : 'enemy_appear', { ...enemy });

  const interval = setInterval(() => {
    if (playerHp <= 0 || enemy.hp <= 0) {
      clearInterval(interval);
      onEnd(playerHp > 0, enemy);
      return;
    }
    performAttack(enemy);
  }, 1000);
}

function travelToEncounter(enemyData, onEnd, travelTime = 1400, approachDelay = 0) {
  CombatEvents.emit('travelStart');
  setTimeout(() => CombatEvents.emit('enemyApproach', enemyData), approachDelay);
  setTimeout(
    () => startAutoBattle(enemyData, onEnd),
    approachDelay + travelTime
  );
}

function startRest(duration, onEnd) {
  inventoryLocked = false;
  CombatEvents.emit('inventory_Open');
  CombatEvents.emit('inventoryUnlocked');

  let timeLeft = Math.max(0, Number(duration) || 0);
  CombatEvents.emit('restStart', { timeLeft });

  if (timeLeft === 0) {
    inventoryLocked = true;
    CombatEvents.emit('inventory_close');
    onEnd();
    return;
  }

  const timer = setInterval(() => {
    timeLeft--;
    CombatEvents.emit('restStart', { timeLeft });

    if (timeLeft <= 0) {
      clearInterval(timer);
      inventoryLocked = true;
      CombatEvents.emit('inventory_close');
      onEnd();
    }
  }, 1000);
}

function awardCatalogItem(catalogId, messagePrefix, sourceName) {
  const itemTemplate = itemDatabase[catalogId];
  if (!itemTemplate) {
    throw new Error(`Item de drop ${catalogId} não existe no catálogo.`);
  }
  const nextItemId = Inventory.getAllItems().reduce(
    (maxId, item) => Math.max(maxId, item.id),
    Math.max(...Object.keys(itemDatabase).map(Number))
  ) + 1;
  const item = {
    ...itemTemplate,
    id: nextItemId,
    catalogId,
    quantity: 1,
    equipped: false,
    bonuses: itemTemplate.bonuses ? { ...itemTemplate.bonuses } : undefined
  };
  if (!Inventory.addItem(item)) {
    const message = `${sourceName}: inventário sem espaço para ${item.name}.`;
    CombatEvents.emit('lootDrop', { message });
    return message;
  }
  const message = `${messagePrefix}: ${item.name}.`;
  CombatEvents.emit('lootDrop', { message });
  return message;
}

function awardEnemyDrop(enemy, guaranteedBossRewardId) {
  const isBoss = enemy.isBoss;
  const luck = Math.max(0, Number(Inventory.playerStats().luck) || 0);
  const dropChance = Math.min(1, 0.35 + luck * 0.003);
  if (!isBoss && Math.random() >= dropChance) {
    const message = `${enemy.name}: nenhum item encontrado.`;
    CombatEvents.emit('lootDrop', { message });
    return message;
  }

  const accessoryId = isBoss
    ? guaranteedBossRewardId || bossRewardIds[Math.floor(Math.random() * bossRewardIds.length)]
    : accessoryDropIds[Math.floor(Math.random() * accessoryDropIds.length)];
  const accessoryMessage = awardCatalogItem(
    accessoryId,
    isBoss ? 'Recompensa de chefe' : 'Encontrado',
    enemy.name
  );
  if (!isBoss || Math.random() >= bossWeaponDropChance) {
    return accessoryMessage;
  }

  const weaponId = rotatingWeaponIds[
    Math.floor(Math.random() * rotatingWeaponIds.length)
  ];
  const weaponMessage = awardCatalogItem(
    weaponId,
    'Arma rara encontrada',
    enemy.name
  );
  return `${accessoryMessage} ${weaponMessage}`;
}

function finishMission(won, onEnd) {
  inventoryLocked = false;
  missionRunning = false;
  CombatEvents.emit(won ? 'missionComplete' : 'gameOver');
  if (onEnd) onEnd(won);
  if (!won && typeof DemoGame !== 'undefined') DemoGame.handleDeath();
}

function startMission(missionId, onEnd) {
  const mission = missionEnemySets[missionId];
  if (!mission) {
    throw new Error(`Configuração de combate ausente para a missão "${missionId}".`);
  }

  let currentEnemyIndex = 0;

  function finishWonMission() {
    finishMission(true, onEnd);
  }

  function fightNext(approachDelay = 0) {
    if (currentEnemyIndex >= mission.enemies.length) {
      finishWonMission();
      return;
    }

    travelToEncounter(mission.enemies[currentEnemyIndex], (won, enemy) => {
      if (!won) {
        finishMission(false, onEnd);
        return;
      }

      awardEnemyDrop(enemy, mission.guaranteedBossRewardId);
      currentEnemyIndex++;
      if (currentEnemyIndex >= mission.enemies.length) {
        finishWonMission();
        return;
      }
      startRest(5, () => fightNext(1000));
    }, 1400, approachDelay);
  }

  if (mission.hasRoadEncounter) {
    const roadEncounter = {
      ...roadEnemies[Math.floor(Math.random() * roadEnemies.length)],
      isRoadEncounter: true
    };
    travelToEncounter(roadEncounter, (won, enemy) => {
      if (!won) {
        finishMission(false, onEnd);
        return;
      }
      awardEnemyDrop(enemy);
      startRest(3, () => fightNext(1000));
    }, 1800);
    return;
  }

  fightNext();
}

function startRoadEncounter(target) {
  if (missionRunning) return false;
  missionRunning = true;
  CombatEvents.emit('travelStart');
  const enemy = {
    ...roadEnemies[Math.floor(Math.random() * roadEnemies.length)],
    isRoadEncounter: true
  };
  travelToEncounter(enemy, (won, defeatedEnemy) => {
    missionRunning = false;
    inventoryLocked = false;
    if (!won) {
      CombatEvents.emit('gameOver');
      if (typeof DemoGame !== 'undefined') DemoGame.handleDeath();
      return;
    }
    const dropMessage = awardEnemyDrop(defeatedEnemy);
    DemoGame.completeTravel(target, dropMessage);
  }, 1800);
  return true;
}

function startGameLoop() {
  if (missionRunning) return false;

  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode') || 'mission';
  if (mode === 'road') {
    const target = params.get('target') || 'lobby';
    return startRoadEncounter(target);
  }

  const missionId = params.get('mission') || 'swamp-road';
  if (!DemoGame.canStartMission(missionId)) {
    CombatEvents.emit('missionUnavailable', missionId);
    return false;
  }

  missionRunning = true;
  CombatEvents.emit('mission_start');
  startMission(missionId, won => {
    if (won) {
      if (missionId === 'villain-negotiation' &&
        !UI.payGold(DemoGame.merchantRescueCost)) {
        CombatEvents.emit('missionUnavailable', missionId);
        return;
      }
      DemoGame.recordMissionVictory(missionId);
      const reward = DemoGame.missions[missionId].reward;
      if (reward > 0) UI.giveGold(reward);
    }
  });
  return true;
}
