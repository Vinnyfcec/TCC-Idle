let items = [];

let playerHp = 100;
let playerMaxHp = 100;

const STORAGE_KEY_INVENTORY = 'game_inventory';
const INVENTORY_CAPACITY = 20;

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

function normalizeItem(item) {
  if (!item || !Number.isSafeInteger(Number(item.id)) || Number(item.id) <= 0) {
    return null;
  }

  const name = typeof item.name === 'string' ? item.name.trim() : '';
  const quantity = Number(item.quantity ?? 1);
  const price = Number(item.price ?? 0);
  const attValue = Number(item.att_value ?? 0);

  if (!name || !Number.isSafeInteger(quantity) || quantity <= 0) return null;
  if (!Number.isSafeInteger(price) || price < 0) return null;
  if (!Number.isFinite(attValue)) return null;

  return {
    id: Number(item.id),
    name,
    quantity,
    price,
    stackable: item.stackable !== false,
    wearable: item.wearable === true,
    class: item.class ?? item.item_class ?? null,
    type: item.type ?? null,
    attribute: item.attribute ?? null,
    att_value: attValue,
    equipped: item.equipped === true
  };
}

class Inventory {
  static normalizeItem(item) {
    return normalizeItem(item);
  }

  static addItem(item) {
    const normalizedItem = normalizeItem(item);
    if (!normalizedItem) return false;

    const existingItem = items.find(i => i.id === normalizedItem.id);

    if (existingItem && normalizedItem.stackable) {
      const nextQuantity = existingItem.quantity + normalizedItem.quantity;
      if (!Number.isSafeInteger(nextQuantity)) return false;
      existingItem.quantity = nextQuantity;
      Inventory.persist();
      return true;
    }

    items.push(normalizedItem);
    Inventory.persist();
    return true;
  }

  static removeItemByIndex(index) {
    if (Number.isInteger(index) && index >= 0 && index < items.length) {
      items.splice(index, 1);
      Inventory.persist();
      return true;
    }
    return false;
  }

  static getAllItems() {
    return items;
  }

  static async loadItems(itemsArray) {
    if (!Array.isArray(itemsArray)) {
      items = [];
      return items;
    }

    items = itemsArray.map(normalizeItem).filter(Boolean);
    return items;
  }

  static persist() {
    try {
      const data = { items, playerHp };
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(data));
    } catch (e) {
      console.warn('Falha ao salvar inventário no localStorage', e);
    }
  }

  static loadFromLocalStorage(defaultItems) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_INVENTORY);
      if (raw) {
        const parsed = safeParse(raw);
        if (parsed && Array.isArray(parsed.items)) {
          items = parsed.items.map(normalizeItem).filter(Boolean);
          if (typeof parsed.playerHp === 'number' && Number.isFinite(parsed.playerHp)) {
            playerHp = Math.max(0, parsed.playerHp);
          }
          return items;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar inventário do localStorage', e);
    }

    if (defaultItems) {
      Inventory.loadItems(defaultItems);
    }
    Inventory.persist();
    return items;
  }

  static getItemById(itemId) {
    return items.find(i => i.id === itemId);
  }

  static itemsLength() {
    return items.reduce((length, item) => length + item.quantity, 0);
  }

  static getCapacity() {
    return INVENTORY_CAPACITY;
  }

  static getEquippedItems() {
    return items.filter(item => item.equipped === true && item.wearable === true);
  }

  static equipmentSlots() {
    return {
      weapon: 1,
      shield: 1,
      helmet: 1,
      chestplate: 1,
      pants: 1,
      boots: 1,
      accessory: 4
    };
  }

  static getEquippedCountByClass(itemClass) {
    return Inventory.getEquippedItems().filter(item => item.class === itemClass).length;
  }

  static canEquipItem(item) {
    if (!item || item.wearable !== true) return false;
    const slots = Inventory.equipmentSlots();
    const maxSlots = slots[item.class];
    if (maxSlots === undefined) return false;
    if (item.equipped) return true;
    return Inventory.getEquippedCountByClass(item.class) < maxSlots;
  }

  static equipItem(itemId) {
    const item = Inventory.getItemById(itemId);
    if (!item || item.wearable !== true) return false;

    const slots = Inventory.equipmentSlots();
    if (slots[item.class] === undefined) return false;
    if (item.equipped) return true;
    if (Inventory.getEquippedCountByClass(item.class) >= slots[item.class]) return false;

    item.equipped = true;
    Inventory.persist();
    return true;
  }

  static unequipItem(itemId) {
    const item = Inventory.getItemById(itemId);
    if (!item || item.equipped !== true) return false;
    item.equipped = false;
    Inventory.persist();
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
      if (item.attribute && typeof item.att_value === 'number' && stats[item.attribute] !== undefined) {
        stats[item.attribute] += item.att_value;
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

  static setPlayerHp(value) {
    if (!Number.isFinite(value)) return false;
    playerHp = Math.max(0, Math.min(value, Inventory.getPlayerMaxHp()));
    Inventory.persist();
    return true;
  }

  static restorePlayerHp() {
    playerMaxHp = Inventory.getStats().hp;
    playerHp = playerMaxHp;
    Inventory.persist();
    return playerHp;
  }

  static getPlayerMaxHp() {
    playerMaxHp = Inventory.getStats().hp;
    playerHp = Math.max(0, Math.min(playerHp, playerMaxHp));
    return playerMaxHp;
  }

  static useItem(itemId) {
    const item = Inventory.getItemById(itemId);
    if (!item || item.quantity <= 0) return false;

    if (item.class === 'consumable') {
      if (item.attribute === 'hp') {
        playerMaxHp = Inventory.getStats().hp;
        playerHp = Math.min(playerMaxHp, playerHp + item.att_value);
        console.log(`+${item.att_value} HP (HP atual: ${playerHp}/${playerMaxHp})`);
      }

      item.quantity--;

      if (item.quantity <= 0) {
        items = items.filter(i => i.id !== itemId);
      }

      Inventory.persist();
      return true;
    }

    return false;
  }
}
