let items = [];

let playerHp = 100;
let playerMaxHp = 100;

class Inventory {
  static addItem(item) {
    const existingItem = items.find(i => i.id === item.id);
    
    //verifica se o item é acumulativo e se já existe no inventário pra somar a quantidade
    if (existingItem && item.stackable !== false) {
      existingItem.quantity = (existingItem.quantity || 1) + (item.quantity || 1);
      return true;
    }

    items.push({
      id: item.id,
      name: item.name,
      quantity: item.quantity || 1,
      price: item.price || 0,
      stackable: item.stackable !== false,
      wearable: item.wearable === true,
      class: item.item_class || null,
      type: item.type || null,
      attribute: item.attribute || null,
      att_value: typeof item.att_value === 'number' ? item.att_value : 0,
      equipped: item.equipped === true
    });
    return true;
  }

  static removeItemByIndex(index) {
    if (index >= 0 && index < items.length) {
      items.splice(index, 1);
      return true;
    }
    return false;
  }
  
  static getAllItems() {
    return items;
  }

  static async loadItems(itemsArray) {
    items = itemsArray.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity || 1,
      price: item.price || 0,
      stackable: item.stackable !== false,
      wearable: item.wearable === true,
      class: item.class || null,
      type: item.type || null,
      attribute: item.attribute || null,
      att_value: typeof item.att_value === 'number' ? item.att_value : 0,
      equipped: item.equipped === true
    }));
    return items;
  }

  static getItemById(itemId) {
    return items.find(i => i.id === itemId);
  }

  static itemsLength() {
    let length = 0;
    for (let i = 0; i < items.length; i++) {
      length += items[i].quantity;
    }
    return length;
  }

  static getEquippedItems() {
    return items.filter(item => item.equipped === true && item.wearable === true);
  }

  static equipmentSlots() {
    const slots = {
      weapon: 1,
      shield: 1,
      helmet: 1,
      chestplate: 1,
      pants: 1,
      boots: 1,
      accessory: 4
    };
    return slots;
  }

  static getEquippedCountByClass(itemClass) {
    return Inventory.getEquippedItems().filter(item => item['class'] === itemClass).length;
  }

  static canEquipItem(item) {
    if (!item || item.wearable !== true) return false;
    const slots = Inventory.equipmentSlots();
    const itemClass = item['class'];
    const maxSlots = slots[itemClass];
    if (maxSlots === undefined) return false;
    if (item.equipped) return true;
    return Inventory.getEquippedCountByClass(itemClass) < maxSlots;
  }

  static equipItem(itemId) {
    const item = Inventory.getItemById(itemId);
    if (!item || item.wearable !== true) return false;

    const slots = Inventory.equipmentSlots();
    const itemClass = item['class'];
    if (slots[itemClass] === undefined) return false;
    if (item.equipped) return true;
    if (Inventory.getEquippedCountByClass(itemClass) >= slots[itemClass]) return false;

    item.equipped = true;
    return true;
  }

  static unequipItem(itemId) {
    const item = Inventory.getItemById(itemId);
    if (!item || item.equipped !== true) return false;
    item.equipped = false;
    return true;
  }

  static toggleEquip(itemId) {
    const item = Inventory.getItemById(itemId);
    if (!item || item.wearable !== true) return false;
    return item.equipped ? Inventory.unequipItem(itemId) : Inventory.equipItem(itemId);
  }

  static getStats() {
    const stats = {
      strength: 0,
      hp: 100,
      defense: 0
    };

    Inventory.getEquippedItems().forEach(item => {
      if (item.attribute && typeof item.att_value === 'number') {
        if (stats[item.attribute] !== undefined) {
          stats[item.attribute] += item.att_value;
        }
      }
    });

    return stats;
  }

  static playerStats() {
    const stats = Inventory.getStats();
    return {
      strength: stats.strength,
      hp: stats.hp,
      defense: stats.defense
    };
  }

  static getPlayerHp() {
    return playerHp;
  }

  static getPlayerMaxHp() {
    // Atualiza o máximo baseado nos stats atuais
    playerMaxHp = Inventory.getStats().hp;
    return playerMaxHp;
  }

  static useItem(itemId) {
    const item = Inventory.getItemById(itemId);
    if (!item || item.quantity <= 0) return false;

    if (item.class === 'consumable') {
      if (item.attribute === 'hp') {
        // Atualiza o HP máximo baseado nos stats atuais
        playerMaxHp = Inventory.getStats().hp;
        // Aumenta o HP atual, sem ultrapassar o máximo
        playerHp = Math.min(playerMaxHp, playerHp + item.att_value);
        console.log(`+${item.att_value} HP (HP atual: ${playerHp}/${playerMaxHp})`);
      }

      item.quantity--;

      if (item.quantity <= 0) {
        items = items.filter(i => i.id !== itemId);
      }

      return true;
    }

    return false;
  }
}