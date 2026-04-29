async function loadInventory() {
  try {
    const items = inventarioInicial; //aq vai pegar na vdd no node
    await Inventory.loadItems(items);
    // Inicializa HP baseado nos stats
    Inventory.getPlayerMaxHp();
    InventoryUI.render();
  } catch (error) {
    console.error('Erro:', error);
  }
}

async function addItemToInventory(item) {
  try {
    if (Inventory.addItem(item)) {
      InventoryUI.render();
      return true;
    } else {
      throw new Error('Erro');
    }
  } catch (error) {
    console.error('Erro:', error);
    return false;
  }
}

async function removeItemFromInventory(itemId, quantity = 1) {
  try {
    if (Inventory.removeItem(itemId, quantity)) {
      InventoryUI.render();
      return true;
    }
  } catch (error) {
    console.error('Erro:', error);
    return false;
  }
}

async function updateItemQuantity(itemId, newQuantity) {
  try {
    const item = Inventory.getItemById(itemId);
    if (item) {
      item.quantity = newQuantity;
      if (newQuantity <= 0) {
        Inventory.removeItem(itemId);
      }
      InventoryUI.render();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro:', error);
    return false;
  }
}

async function useItem(itemId) {
  try {
    if (Inventory.useItem(itemId)) {
      InventoryUI.render();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao usar item:', error);
    return false;
  }
}

function atribuirNovoId() {
  let id = 1;
  while (Inventory.getItemById(id)) {
    id++;
  }
  while (Shop.getItems().find(item => item.id === id)) {
    id++;
  }
  return id;
}

async function getInventoryData() {
  try {
    return Inventory.getAllItems();
  } catch (error) {
    console.error('Erro:', error);
    return [];
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  UI.updateGold();
  InventoryUI.init();
  CombatUI.init();
  await loadInventory();
  ShopUI.render();

  // Conectar eventos de combate à UI
  CombatEvents.on('restStart', (data) => CombatUI.showRestTimer(data.timeLeft));
  CombatEvents.on('combatStart', () => CombatUI.showCombat());
  CombatEvents.on('enemyUpdate', (enemy) => CombatUI.updateEnemy(enemy));
  CombatEvents.on('playerHpUpdate', () => CombatUI.updatePlayerHp());
  CombatEvents.on('missionComplete', () => CombatUI.showMissionComplete());
  CombatEvents.on('gameOver', () => CombatUI.showGameOver());
  CombatEvents.on('enemy_appear', (enemy) => CombatUI.updateEnemy({...enemy, maxHp: enemy.hp}));
  CombatEvents.on('boss_intro', (enemy) => CombatUI.updateEnemy({...enemy, maxHp: enemy.hp}));
  CombatEvents.on('inventoryUnlocked', () => InventoryUI.render());
});