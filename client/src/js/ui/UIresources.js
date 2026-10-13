class ResourcesUI {
  static collectionCooldownTimer = null;

  static init() {
    Resources.load();
    UI.loadGold();
    UI.updateGold();

    const collectButton = document.getElementById('collect-wood-btn');
    if (collectButton) {
      collectButton.addEventListener('click', () => {
        if (Resources.collectWood()) {
          ResourcesUI.render();
          ResourcesUI.scheduleCollectionReady();
        }
      });
    }

    const collectNavigationButton = document.getElementById('collect-wood-nav-btn');
    if (collectNavigationButton) {
      collectNavigationButton.addEventListener('click', () => {
        window.location.href = '../src/views/coleta.html';
      });
    }

    const rebuildButton = document.getElementById('rebuild-btn');
    if (rebuildButton) {
      rebuildButton.addEventListener('click', () => {
        if (Resources.rebuildCabinAndCart()) ResourcesUI.render();
      });
    }

    const backButton = document.getElementById('back-to-lobby-btn');
    if (backButton) {
      backButton.addEventListener('click', () => {
        window.location.href = '../../dev/lobbydev.html';
      });
    }

    const navigation = [
      ['start-mission-btn', '../src/views/combat.html?start=1'],
      ['inventory-btn', '../src/views/inventory.html'],
      ['shop-btn', '../src/views/shop.html']
    ];

    navigation.forEach(([buttonId, url]) => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.addEventListener('click', () => {
          window.location.href = url;
        });
      }
    });

    const clearStorageButton = document.getElementById('clear-storage-btn');
    if (clearStorageButton) {
      clearStorageButton.addEventListener('click', () => {
        if (!window.confirm('Apagar os dados locais?')) return;
        ['game_inventory', 'game_gold', 'game_shop', RESOURCE_STORAGE_KEY]
          .forEach(key => window.localStorage.removeItem(key));
        window.location.reload();
      });
    }

    ResourcesUI.render();
    ResourcesUI.scheduleCollectionReady();
  }

  static scheduleCollectionReady() {
    if (ResourcesUI.collectionCooldownTimer !== null) {
      clearTimeout(ResourcesUI.collectionCooldownTimer);
      ResourcesUI.collectionCooldownTimer = null;
    }

    const remaining = Resources.getCollectionCooldownRemaining();
    if (remaining > 0) {
      ResourcesUI.collectionCooldownTimer = setTimeout(() => {
        ResourcesUI.collectionCooldownTimer = null;
        ResourcesUI.render();
      }, remaining);
    }
  }

  static render() {
    const woodCount = document.getElementById('wood-count');
    if (woodCount) woodCount.textContent = String(Resources.wood);

    const collectButton = document.getElementById('collect-wood-btn');
    if (collectButton) {
      collectButton.disabled = Resources.getCollectionCooldownRemaining() > 0;
    }

    const rebuildButton = document.getElementById('rebuild-btn');
    const rebuildRequirement = document.getElementById('rebuild-requirement');
    const houseObtained = document.getElementById('house-obtained');
    if (rebuildButton && rebuildRequirement && houseObtained) {
      const obtained = Resources.cabinObtained;
      rebuildButton.hidden = obtained;
      rebuildButton.disabled = obtained || Resources.wood < Resources.cabinWoodCost;
      rebuildRequirement.hidden = obtained;
      rebuildRequirement.textContent =
        `Madeira: ${Resources.wood}/${Resources.cabinWoodCost}`;
      houseObtained.hidden = !obtained;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => ResourcesUI.init());
