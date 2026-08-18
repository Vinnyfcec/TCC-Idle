async function loadInventory() {
  try {
    await Inventory.loadFromLocalStorage(inventarioInicial);
    Inventory.getPlayerMaxHp();
    if (typeof InventoryUI !== 'undefined') InventoryUI.render();
  } catch (error) {
    console.error('Erro ao carregar inventário:', error);
  }
}

async function addItemToInventory(item) {
  try {
    if (!Inventory.addItem(item)) throw new Error('Item inválido ou inventário cheio.');
    if (typeof InventoryUI !== 'undefined') InventoryUI.render();
    return true;
  } catch (error) {
    console.error('Erro ao adicionar item:', error);
    return false;
  }
}

async function removeItemFromInventory(itemId, quantity = 1) {
  try {
    const item = Inventory.getItemById(itemId);
    if (!item || !Number.isSafeInteger(quantity) || quantity <= 0) return false;

    if (item.quantity > quantity) {
      item.quantity -= quantity;
      Inventory.persist();
    } else {
      const index = Inventory.getAllItems().findIndex(current => current.id === itemId);
      Inventory.removeItemByIndex(index);
    }

    if (typeof InventoryUI !== 'undefined') InventoryUI.render();
    return true;
  } catch (error) {
    console.error('Erro ao remover item:', error);
    return false;
  }
}

async function useItem(itemId) {
  try {
    const used = Inventory.useItem(itemId);
    if (used && typeof InventoryUI !== 'undefined') InventoryUI.render();
    return used;
  } catch (error) {
    console.error('Erro ao usar item:', error);
    return false;
  }
}

async function getInventoryData() {
  try {
    return Inventory.getAllItems();
  } catch (error) {
    console.error('Erro ao obter inventário:', error);
    return [];
  }
}

function getCurrentPage() {
  return document.body?.dataset.page || '';
}

document.addEventListener('DOMContentLoaded', async () => {
  const page = getCurrentPage();
  const isHome = page === 'home';
  const isCombat = page === 'combat';
  const isInventory = page === 'inventory';
  const isShop = page === 'shop';

  if (isHome || isInventory) {
    InventoryUI.init();
  }

  if (isHome || isCombat) {
    CombatUI.init();
  }

  if (isHome || isShop) {
    Shop.loadFromLocalStorage();
    ShopUI.render();
  }

  UI.loadGold();
  UI.updateGold();
  await loadInventory();

  if ((isHome || isCombat) && typeof CombatEvents !== 'undefined') {
    CombatEvents.on('restStart', data => CombatUI.showRestTimer(data.timeLeft));
    CombatEvents.on('combatStart', () => CombatUI.showCombat());
    CombatEvents.on('enemyUpdate', enemy => CombatUI.updateEnemy(enemy));
    CombatEvents.on('playerHpUpdate', () => CombatUI.updatePlayerHp());
    CombatEvents.on('missionComplete', () => CombatUI.showMissionComplete());
    CombatEvents.on('gameOver', () => CombatUI.showGameOver());
    CombatEvents.on('enemy_appear', enemy => CombatUI.updateEnemy(enemy));
    CombatEvents.on('boss_intro', enemy => CombatUI.updateEnemy(enemy));
    CombatEvents.on('inventoryUnlocked', () => InventoryUI.render());
  }
});
