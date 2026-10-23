const RESOURCE_STORAGE_KEY = 'game_resources';

class Resources {
  static woodValueGold = 0.5;
  static cabinWoodCost = 50;
  static collectionCooldownMs = 3000;
  static wood = 0;
  static cabinObtained = false;
  static lastWoodCollectedAt = 0;
  static loaded = false;

  static load() {
    if (Resources.loaded) return;

    try {
      const raw = localStorage.getItem(RESOURCE_STORAGE_KEY);
      if (raw !== null) {
        const saved = JSON.parse(raw);
        if (
          saved &&
          Number.isSafeInteger(saved.wood) &&
          saved.wood >= 0 &&
          typeof saved.cabinObtained === 'boolean' &&
          (saved.lastWoodCollectedAt === undefined ||
            (Number.isSafeInteger(saved.lastWoodCollectedAt) && saved.lastWoodCollectedAt >= 0))
        ) {
          Resources.wood = saved.wood;
          Resources.cabinObtained = saved.cabinObtained;
          Resources.lastWoodCollectedAt = saved.lastWoodCollectedAt || 0;
        } else {
          console.warn('Dados de recursos inválidos; usando valores iniciais.');
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar recursos salvos:', error);
    }

    Resources.loaded = true;
  }

  static persist() {
    try {
      localStorage.setItem(RESOURCE_STORAGE_KEY, JSON.stringify({
        wood: Resources.wood,
        cabinObtained: Resources.cabinObtained,
        lastWoodCollectedAt: Resources.lastWoodCollectedAt
      }));
      if (typeof SaveManager !== 'undefined') SaveManager.syncActiveSlot();
      return true;
    } catch (error) {
      console.error('Falha ao salvar recursos:', error);
      return false;
    }
  }

  static collectWood(amount = 1) {
    Resources.load();
    const now = Date.now();
    if (now - Resources.lastWoodCollectedAt < Resources.collectionCooldownMs) {
      return false;
    }
    if (!Number.isSafeInteger(amount) || amount <= 0 ||
      Resources.wood + amount > Number.MAX_SAFE_INTEGER) {
      console.error('Não é possível armazenar mais madeira.');
      return false;
    }

    const previousCollectionTime = Resources.lastWoodCollectedAt;
    Resources.wood += amount;
    Resources.lastWoodCollectedAt = now;
    if (Resources.persist()) return true;
    Resources.wood -= amount;
    Resources.lastWoodCollectedAt = previousCollectionTime;
    return false;
  }

  static getCollectionCooldownRemaining() {
    Resources.load();
    return Math.max(
      0,
      Resources.collectionCooldownMs - (Date.now() - Resources.lastWoodCollectedAt)
    );
  }

  static rebuildCabinAndCart() {
    Resources.load();
    if (Resources.cabinObtained || Resources.wood < Resources.cabinWoodCost) {
      return false;
    }

    const previousWood = Resources.wood;
    Resources.cabinObtained = true;
    Resources.wood -= Resources.cabinWoodCost;
    if (Resources.persist()) return true;
    Resources.wood = previousWood;
    Resources.cabinObtained = false;
    return false;
  }
}
