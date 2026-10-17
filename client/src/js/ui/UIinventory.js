let containerInventory = null;

class InventoryUI {
  static isSellMode() {
    return document.body.dataset.page === 'inventory' &&
      new URLSearchParams(window.location.search).get('mode') === 'sell';
  }

  static init() {
    containerInventory = document.getElementById('inventory-grid');
    globalThis.inventoryLocked = false;
  }

  static render() {
    const sellMode = InventoryUI.isSellMode();
    if (sellMode) {
      document.title = 'Vender itens — Mochileiro';
      const pageTitle = document.querySelector('.game-title');
      const inventoryTitle = document.querySelector('.inventory-title');
      if (pageTitle) pageTitle.textContent = 'Vender itens';
      if (inventoryTitle) inventoryTitle.textContent = 'Vender itens';
    }

    const items = Inventory.getAllItems();
    if (!containerInventory) {
      containerInventory = document.getElementById('inventory-grid');
    }
    if (!containerInventory) return;
    containerInventory.innerHTML = '';

    for (let slotIndex = 0; slotIndex < Inventory.getCapacity(); slotIndex++) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.setAttribute('aria-label', `Espaço ${slotIndex + 1}`);

      const item = items[slotIndex];
      if (item) {
        slot.classList.add('is-occupied');
        if (item.equipped) slot.classList.add('is-equipped');
        slot.appendChild(InventoryUI.createItemElement(item, slotIndex, sellMode));
      }
      containerInventory.appendChild(slot);
    }

    const slotCountElement = document.getElementById('slot-count');
    if (slotCountElement) {
      slotCountElement.textContent = `${items.length}/${Inventory.getCapacity()}`;
    }
  }

  static createItemElement(item, index, sellMode = false) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'inventory-item';
    itemDiv.dataset.itemId = item.id;
    itemDiv.dataset.index = index;

    const info = document.createElement('div');
    info.className = 'item-info';

    const name = document.createElement('span');
    name.className = 'item-name';
    name.textContent = item.name;

    const quantity = document.createElement('span');
    quantity.className = 'item-quantity';
    quantity.textContent = `x${item.quantity}`;

    info.appendChild(name);
    if (item.stackable) {
      info.appendChild(quantity);
    }
    const sellValue = sellMode ? Shop.getSellValue(item) : 0;
    if (sellMode) {
      const saleValue = document.createElement('span');
      saleValue.className = 'item-sale-value';
      saleValue.textContent = `Venda: ${sellValue} ouro`;
      info.appendChild(saleValue);
    }

    itemDiv.appendChild(info);

    if (sellMode) {
      const sellBtn = document.createElement('button');
      sellBtn.className = 'item-sell-btn';
      sellBtn.textContent = 'Vender';
      sellBtn.setAttribute('aria-label', `Vender ${item.name} por ${sellValue} ouro`);
      sellBtn.title = `Vender ${item.quantity} por ${sellValue} ouro`;
      sellBtn.onclick = event => {
        event.stopPropagation();
        Shop.sellInventoryItem(index);
      };
      itemDiv.appendChild(sellBtn);
      return itemDiv;
    }

    const removeBtn = document.createElement('button');
    removeBtn.className = 'item-remove-btn';
    removeBtn.textContent = 'X';
    removeBtn.setAttribute('aria-label', `Remover ${item.name}`);
    removeBtn.title = `Remover ${item.name}`;
    removeBtn.onclick = event => {
      event.stopPropagation();
      InventoryUI.removeItem(index);
    };
    itemDiv.appendChild(removeBtn);

    if (item.wearable) {
      const equipBtn = document.createElement('button');
      equipBtn.className = 'item-equip-btn';
      equipBtn.textContent = item.equipped ? 'Tirar' : 'Equipar';
      equipBtn.setAttribute(
        'aria-label',
        `${item.equipped ? 'Desequipar' : 'Equipar'} ${item.name}`
      );
      equipBtn.title = `${item.equipped ? 'Desequipar' : 'Equipar'} ${item.name}`;
      equipBtn.disabled = !Inventory.canEquipItem(item) && !item.equipped || inventoryLocked;
      equipBtn.onclick = (e) => {
        e.stopPropagation();
        if (inventoryLocked) return;
        Inventory.toggleEquip(item.id);
        InventoryUI.render();
      };
      itemDiv.appendChild(equipBtn);

    }

    if (item.class === 'consumable') {
      const useBtn = document.createElement('button');
      useBtn.className = 'item-use-btn';
      useBtn.textContent = 'Usar';
      useBtn.setAttribute('aria-label', `Usar ${item.name}`);
      useBtn.title = `Usar ${item.name}`;
      useBtn.disabled = inventoryLocked;
      useBtn.onclick = (e) => {
        e.stopPropagation();
        if (inventoryLocked) return;
        useItem(item.id);
        if (typeof CombatUI !== 'undefined') CombatUI.updatePlayerHp();
      };
      itemDiv.appendChild(useBtn);
    }

    return itemDiv;
  }

  static async removeItem(index) {
    Inventory.removeItemByIndex(index);
    InventoryUI.render();
  }
}