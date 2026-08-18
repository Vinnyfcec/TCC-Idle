const STORAGE_KEY_GOLD = 'game_gold';
const STARTING_GOLD = 1000;

class UI {
  static gold = STARTING_GOLD;

  static checkGold(cost) {
    return Number.isSafeInteger(cost) && cost >= 0 && UI.gold >= cost;
  }

  static payGold(cost) {
    if (!UI.checkGold(cost)) return false;
    UI.gold -= cost;
    UI.updateGold();
    return true;
  }

  static giveGold(amount) {
    if (!Number.isSafeInteger(amount) || amount < 0) return false;
    UI.gold += amount;
    UI.updateGold();
    return true;
  }

  static updateGold() {
    const goldElement = document.getElementById('gold-display');
    if (goldElement) {
      goldElement.textContent = String(UI.gold);
    }
    try {
      localStorage.setItem(STORAGE_KEY_GOLD, String(UI.gold));
    } catch (e) {
      console.warn('Falha ao salvar ouro no localStorage', e);
    }
  }

  static loadGold() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_GOLD);
      if (raw !== null) {
        const value = Number(raw);
        if (Number.isSafeInteger(value) && value >= 0) {
          UI.gold = value;
        }
      }
    } catch (e) {
      console.warn('Falha ao carregar ouro do localStorage', e);
    }
  }
}

class ShopUI {
  static render() {
    const container = document.getElementById('shop-list');
    if (!container || typeof Shop === 'undefined') return;

    container.innerHTML = '';
    Shop.getItems().forEach((item, index) => {
      container.appendChild(ShopUI.createItemElement(item, index));
    });
  }

  static createItemElement(item, index) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'shop-item';
    itemDiv.dataset.itemId = String(item.id);
    itemDiv.dataset.index = String(index);

    const info = document.createElement('div');
    info.className = 'item-info';

    const name = document.createElement('span');
    name.className = 'item-name';
    name.textContent = item.name;

    const quantity = document.createElement('span');
    quantity.className = 'item-quantity';
    quantity.textContent = `x${item.quantity}`;

    const price = document.createElement('span');
    price.className = 'item-price';
    price.textContent = `${item.price} Ouro`;

    info.appendChild(name);
    if (item.stackable) info.appendChild(quantity);
    info.appendChild(price);
    itemDiv.appendChild(info);

    itemDiv.onclick = () => Shop.buyByIndex(index);
    return itemDiv;
  }
}
