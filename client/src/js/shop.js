const STORAGE_KEY_SHOP = 'game_shop';

function notifyShop(message) {
  if (typeof alert === 'function') alert(message);
  else console.warn(message);
}

class Shop {
  static getItems() {
    return estoque;
  }

  static normalizeItem(item) {
    if (typeof Inventory !== 'undefined' && typeof Inventory.normalizeItem === 'function') {
      return Inventory.normalizeItem(item);
    }
    return null;
  }

  static buyByIndex(index) {
    if (!Number.isInteger(index) || index < 0 || index >= estoque.length) {
      notifyShop('Item inválido!');
      return false;
    }

    const stockItem = estoque[index];
    if (!stockItem || !Number.isSafeInteger(stockItem.quantity) || stockItem.quantity <= 0) {
      notifyShop('Item sem estoque!');
      return false;
    }

    if (!Number.isSafeInteger(stockItem.price) || stockItem.price < 0) {
      notifyShop('Preço inválido!');
      return false;
    }

    const capacity = typeof Inventory.getCapacity === 'function' ? Inventory.getCapacity() : 20;
    if (Inventory.itemsLength() + 1 > capacity) {
      notifyShop('Sem espaço no inventário!');
      return false;
    }

    if (!UI.checkGold(stockItem.price)) {
      notifyShop('Dinheiro insuficiente!');
      return false;
    }

    if (!UI.payGold(stockItem.price)) {
      notifyShop('Não foi possível concluir a compra!');
      return false;
    }

    const purchasedItem = { ...stockItem, quantity: 1 };
    if (!Inventory.addItem(purchasedItem)) {
      UI.giveGold(stockItem.price);
      notifyShop('Não foi possível adicionar o item ao inventário!');
      return false;
    }

    stockItem.quantity -= 1;
    if (stockItem.quantity <= 0) {
      estoque.splice(index, 1);
    }

    Shop.persist();
    if (typeof ShopUI !== 'undefined' && typeof ShopUI.render === 'function') {
      ShopUI.render();
    }
    return true;
  }

  static addItem(item) {
    const normalizedItem = Shop.normalizeItem(item);
    if (!normalizedItem) return false;
    estoque.push(normalizedItem);
    Shop.persist();
    if (typeof ShopUI !== 'undefined' && typeof ShopUI.render === 'function') {
      ShopUI.render();
    }
    return true;
  }

  static persist() {
    try {
      localStorage.setItem(STORAGE_KEY_SHOP, JSON.stringify(estoque));
    } catch (e) {
      console.warn('Falha ao salvar estoque da loja no localStorage', e);
    }
  }

  static loadFromLocalStorage(defaultEstoque) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SHOP);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const validItems = parsed.map(Shop.normalizeItem).filter(Boolean);
          estoque.length = 0;
          validItems.forEach(item => estoque.push(item));
          return estoque;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar estoque da loja do localStorage', e);
    }

    if (Array.isArray(defaultEstoque)) {
      const validItems = defaultEstoque.map(Shop.normalizeItem).filter(Boolean);
      estoque.length = 0;
      validItems.forEach(item => estoque.push(item));
      Shop.persist();
    }
    return estoque;
  }
}
