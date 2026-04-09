async function loadInventory() {
  try {
    const items = inventarioInicial; //aq vai pegar na vdd no node
    await Inventory.loadItems(items);
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
  InventoryUI.init('inventory-grid');
  await loadInventory();
  ShopUI.render();
});