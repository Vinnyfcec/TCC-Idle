let containerInventory = null;

class InventoryUI {
  static init() {
    containerInventory = document.getElementById('inventory-grid');
    globalThis.inventoryLocked = false;
  }

  static render() {
    const items = Inventory.getAllItems();
    containerInventory.innerHTML = '';

    items.forEach((item, index) => {
      const itemElement = InventoryUI.createItemElement(item, index);
      containerInventory.appendChild(itemElement);
    });

    const slotCountElement = document.getElementById('slot-count');
    if (slotCountElement) {
      slotCountElement.textContent = `${Inventory.itemsLength()}/${Inventory.getCapacity()}`;
    }
  }

  static createItemElement(item, index) {
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

    const removeBtn = document.createElement('button');
    removeBtn.className = 'item-remove-btn';
    removeBtn.textContent = 'X';
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      InventoryUI.removeItem(index);
    };

    itemDiv.appendChild(info);
    itemDiv.appendChild(removeBtn);

    if (item.wearable) {
      const equipBtn = document.createElement('button');
      equipBtn.className = 'item-equip-btn';
      equipBtn.textContent = item.equipped ? 'Desequipar' : 'Equipar';
      equipBtn.disabled = !Inventory.canEquipItem(item) && !item.equipped || inventoryLocked;
      equipBtn.onclick = (e) => {
        e.stopPropagation();
        if (inventoryLocked) return;
        Inventory.toggleEquip(item.id);
        InventoryUI.render();
      };
      itemDiv.appendChild(equipBtn);

      if (item.equipped) {
        const equippedLabel = document.createElement('span');
        equippedLabel.className = 'item-equipped-label';
        equippedLabel.textContent = 'Equipado';
        info.appendChild(equippedLabel);
      }
    }

    if (item.class === 'consumable') {
      const useBtn = document.createElement('button');
      useBtn.className = 'item-use-btn';
      useBtn.textContent = 'Usar';
      useBtn.disabled = inventoryLocked;
      useBtn.onclick = (e) => {
        e.stopPropagation();
        if (inventoryLocked) return;
        useItem(item.id);
        CombatUI.updatePlayerHp();
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