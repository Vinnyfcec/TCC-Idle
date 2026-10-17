const STORAGE_KEY_SHOP = 'game_shop';
const STORAGE_KEY_SHOP_ROTATION = 'game_shop_rotation';

function notifyShop(message) {
  if (typeof alert === 'function') alert(message);
  else console.warn(message);
}

class Shop {
  static rotationState = null;

  static getItems() {
    return estoque;
  }

  static normalizeItem(item) {
    if (typeof Inventory !== 'undefined' && typeof Inventory.normalizeItem === 'function') {
      return Inventory.normalizeItem(item);
    }
    return null;
  }

  static persistRotation() {
    try {
      localStorage.setItem(
        STORAGE_KEY_SHOP_ROTATION,
        JSON.stringify(Shop.rotationState)
      );
      return true;
    } catch (error) {
      console.error('Falha ao salvar a rotação diária da loja:', error);
      return false;
    }
  }

  static chooseDailyWeapons(count, previousIds = []) {
    let available = [...rotatingWeaponIds].filter(id => !previousIds.includes(id));
    if (available.length < count) available = [...rotatingWeaponIds];

    for (let index = available.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [available[index], available[swapIndex]] =
        [available[swapIndex], available[index]];
    }
    return available.slice(0, count);
  }

  static nextInventoryItemId() {
    const catalogMax = Math.max(...Object.keys(itemDatabase).map(Number));
    return Inventory.getAllItems().reduce(
      (maxId, item) => Math.max(maxId, item.id),
      catalogMax
    ) + 1;
  }

  static initializeDailyStock(day) {
    if (!Number.isSafeInteger(day) || day < 1) {
      throw new Error('Dia inválido para atualizar o estoque da loja.');
    }

    let savedRotation = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SHOP_ROTATION);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed?.version === 1 &&
          Number.isSafeInteger(parsed.day) &&
          parsed.day > 0 &&
          Array.isArray(parsed.weaponIds) &&
          Array.isArray(parsed.purchasedWeaponIds)
        ) {
          savedRotation = parsed;
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar a rotação diária da loja:', error);
    }

    const acquiredAxe = Inventory.getAllItems().some(
      item => Number(item.catalogId ?? item.id) === 4
    );
    if (!savedRotation || savedRotation.day !== day) {
      const axePurchased = Boolean(savedRotation?.axePurchased || acquiredAxe);
      const previousIds = savedRotation?.weaponIds || [];
      Shop.rotationState = {
        version: 1,
        day,
        axePurchased,
        weaponIds: Shop.chooseDailyWeapons(axePurchased ? 2 : 1, previousIds),
        purchasedWeaponIds: []
      };
    } else {
      Shop.rotationState = {
        ...savedRotation,
        axePurchased: Boolean(savedRotation.axePurchased || acquiredAxe),
        weaponIds: savedRotation.weaponIds.filter(
          id => rotatingWeaponIds.includes(id)
        ),
        purchasedWeaponIds: savedRotation.purchasedWeaponIds.filter(
          id => rotatingWeaponIds.includes(id)
        )
      };
    }

    const nonWeaponItems = estoque.filter(item => item.class !== 'weapon');
    estoque.length = 0;
    nonWeaponItems.forEach(item => estoque.push(item));

    if (!Shop.rotationState.axePurchased) {
      estoque.push(createCatalogItem(4));
    }

    Shop.rotationState.weaponIds
      .filter(id => !Shop.rotationState.purchasedWeaponIds.includes(id))
      .forEach(id => estoque.push(createCatalogItem(id)));

    Shop.persist();
    Shop.persistRotation();
    if (typeof ShopUI !== 'undefined') ShopUI.render();
    return estoque;
  }

  static buyByIndex(index) {
    if (!Number.isInteger(index) || index < 0 || index >= estoque.length) {
      notifyShop('Item inválido!');
      return false;
    }

    const stockItem = estoque[index];
    const unlimitedStock = stockItem?.unlimitedStock === true;
    if (!stockItem || (!unlimitedStock &&
      (!Number.isSafeInteger(stockItem.quantity) || stockItem.quantity <= 0))) {
      notifyShop('Item sem estoque!');
      return false;
    }

    if (!Number.isSafeInteger(stockItem.price) || stockItem.price < 0) {
      notifyShop('Preço inválido!');
      return false;
    }

    const capacity = typeof Inventory.getCapacity === 'function' ? Inventory.getCapacity() : 20;
    const addsSlot = !stockItem.stackable || !Inventory.getItemById(stockItem.id);
    if (addsSlot && Inventory.itemsLength() >= capacity) {
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

    const purchasedItem = {
      ...stockItem,
      id: stockItem.stackable ? stockItem.id : Shop.nextInventoryItemId(),
      catalogId: Number(stockItem.catalogId ?? stockItem.id),
      quantity: 1,
      equipped: false
    };
    if (!Inventory.addItem(purchasedItem)) {
      UI.giveGold(stockItem.price);
      notifyShop('Não foi possível adicionar o item ao inventário!');
      return false;
    }

    if (!unlimitedStock) {
      stockItem.quantity -= 1;
      if (stockItem.quantity <= 0) {
        estoque.splice(index, 1);
      }
    }

    const catalogId = Number(stockItem.catalogId ?? stockItem.id);
    if (catalogId === 4 && Shop.rotationState) {
      Shop.rotationState.axePurchased = true;
      Shop.persistRotation();
    } else if (
      Shop.rotationState?.weaponIds.includes(catalogId) &&
      !Shop.rotationState.purchasedWeaponIds.includes(catalogId)
    ) {
      Shop.rotationState.purchasedWeaponIds.push(catalogId);
      Shop.persistRotation();
    }

    Shop.persist();
    if (typeof ShopUI !== 'undefined' && typeof ShopUI.render === 'function') {
      ShopUI.render();
    }
    return true;
  }

  static getSellValue(item) {
    if (!item || !Number.isSafeInteger(item.price) || item.price < 0) return 0;
    const luck = Math.max(0, Number(Inventory.playerStats().luck) || 0);
    const luckMultiplier = 0.5 + luck * 0.02;
    const total = item.price * item.quantity * luckMultiplier;
    return Number.isSafeInteger(Math.floor(total)) ? Math.floor(total) : 0;
  }

  static sellInventoryItem(index) {
    if (!Number.isInteger(index) || index < 0 || index >= Inventory.itemsLength()) {
      return false;
    }

    const item = Inventory.getAllItems()[index];
    const salePrice = Shop.getSellValue(item);
    if (!Number.isSafeInteger(UI.gold + salePrice)) {
      notifyShop('A venda excede o limite seguro de ouro.');
      return false;
    }
    if (!Inventory.removeItemByIndex(index)) {
      notifyShop('Não foi possível remover o item do inventário.');
      return false;
    }
    if (!UI.giveGold(salePrice)) {
      notifyShop('Não foi possível creditar o valor da venda.');
      return false;
    }

    if (typeof InventoryUI !== 'undefined') InventoryUI.render();
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
          const validItems = parsed
            .map(item => {
              const normalized = Shop.normalizeItem(item);
              const defaultItem = Array.isArray(defaultEstoque)
                ? defaultEstoque.find(candidate => candidate.id === normalized?.id)
                : null;
              if (normalized && defaultItem?.unlimitedStock === true) {
                normalized.unlimitedStock = true;
              }
              return normalized;
            })
            .filter(Boolean);
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
