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
    const items = Inventory.getAllItems();
    containerInventory.innerHTML = '';

    items.forEach((item, index) => {
      const itemElement = InventoryUI.createItemElement(item, index);
      containerInventory.appendChild(itemElement);
    });

    const slotCountElement = document.getElementById('slot-count');
    if (slotCountElement) {
      slotCountElement.textContent = `${Inventory.itemsLength()}/20`;
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
        equippedLabel.textContent = 'Equipped';
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
            Shop.buyByIndex(index);
        };
        return itemDiv;
    }
    
    static addItem(item) {
        estoque.push(item);
        console.log(estoque);
        ShopUI.render();
    }
}
const gameScreen = document.getElementById("game-screen");
const enemyBox = document.getElementById("enemy-box");
const playerBox = document.getElementById("player-box");
const startBtn = document.getElementById("start-mission-btn");

//---
class CombatUI {
  static init() {
    startBtn.onclick = () => {
      if (!missionRunning) {
        startGameLoop();
        CombatUI.updateStartButton("Em Combate...");
      }
    };
    CombatUI.updatePlayerHp();
  }

  static updateStartButton(text) {
    startBtn.textContent = text;
    startBtn.disabled = missionRunning;
  }

  static updatePlayerHp() {
    const currentHp = Inventory.getPlayerHp();
    const maxHp = Inventory.getPlayerMaxHp();
    playerBox.innerHTML = `
      <div class="player-name">Jogador</div>
      <div class="hp-bar">
        <div class="hp-fill" style="width: ${(currentHp / maxHp) * 100}%"></div>
      </div>
      <div class="hp-text">${currentHp}/${maxHp}</div>
    `;
  }

  static updateEnemy(enemy) {
    const maxHp = enemy.maxHp;
    enemyBox.innerHTML = `
      <div class="enemy-name">${enemy.name} ${enemy.isBoss ? '(CHEFE)' : ''}</div>
      <div class="hp-bar">
        <div class="hp-fill" style="width: ${(enemy.hp / maxHp) * 100}%"></div>
      </div>
      <div class="hp-text">${enemy.hp}/${maxHp}</div>
    `;
  }

  static showRestTimer(timeLeft) {
    gameScreen.innerHTML = `<div class="rest-timer">Descansando... ${timeLeft}s</div>`;
  }

  static showCombat() {
    gameScreen.innerHTML = '<div class="combat-status">Em combate!</div>';
  }

  static showMissionComplete() {
    gameScreen.innerHTML = '<div class="mission-complete">MISSÃO COMPLETA!</div>';
    setTimeout(() => {
      gameScreen.innerHTML = '';
      CombatUI.updateStartButton("Iniciar Missão");
    }, 3000);
  }

  static showGameOver() {
    gameScreen.innerHTML = '<div class="game-over">SE FODEU!</div>';
    setTimeout(() => {
      gameScreen.innerHTML = '';
      CombatUI.updateStartButton("Iniciar Missão");
    }, 3000);
  }
}
document.getElementById('addItem').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('item-name').value;
    const quantity = parseInt(document.getElementById('item-quantity').value);
    const price = parseInt(document.getElementById('item-price').value);
    const stackable = document.getElementById('item-stackable').checked;
    const idNovoItem = atribuirNovoId();
    const novoItem = {
        id: idNovoItem,
        name,
        quantity,
        price,
        stackable
    };

    Shop.addItem(novoItem);
    
});