class UI {
    static gold = 1000;

    static checkGold(custo) {
        return UI.gold >= custo;
    }

    static payGold(custo) {
        UI.gold -= custo;
        UI.updateGold();
    }

    static giveGold(quantidade) {
        UI.gold += quantidade;
        UI.updateGold();
    }

    static updateGold() {
        const goldElement = document.getElementById('gold-display');
        if (goldElement) {
            goldElement.textContent = UI.gold;
        }
    }
}

//---
let containerInventory = null;

class InventoryUI {
  static init() {
    containerInventory = document.getElementById('inventory-grid');
  }

  static render() {
    const items = Inventory.getAllItens();
    containerInventory.innerHTML = '';

    items.forEach((item, index) => {
      const itemElement = InventoryUI.createItemElement(item, index);
      containerInventory.appendChild(itemElement);
    });
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

    return itemDiv;
  }

  static async removeItem(index) {
    Inventory.removeItemByIndex(index);
    InventoryUI.render();
  }
}

//---
class ShopUI {
    static render() {
        const itens = Shop.getItems();
        const container = document.getElementById('shop-list');
        container.innerHTML = '';

        itens.forEach((item, index) => {
            const itemElement = ShopUI.createItemElement(item, index);
            container.appendChild(itemElement);
        });
  }

    static createItemElement(item, index) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item';
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
        
        const price = document.createElement('span');
        price.className = 'item-price';
        price.textContent = `${item.price} Gold`;

        info.appendChild(name);
        if (item.stackable) {
        info.appendChild(quantity);
        }
        info.appendChild(price);

        itemDiv.appendChild(info);
        itemDiv.onclick = () => {
            Shop.comprar(index + 1);
        };
        return itemDiv;
    }
    
    static addItem(item) {
        Shop.itens.push(item);
        console.log(Shop.itens);
        ShopUI.render();
    }
}

document.getElementById('addItem').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('item-name').value;
    const quantity = parseInt(document.getElementById('item-quantity').value);
    const price = parseInt(document.getElementById('item-price').value);
    const stackable = document.getElementById('item-stackable').checked;
    const novoItem = {
        id: Shop.itens.length + 1,
        name,
        quantity,
        price,
        stackable
    };

    Shop.addItem(novoItem);
});