const SAVE_SLOTS_STORAGE_KEY = 'game_save_slots_v1';
const SAVE_SLOT_KEYS = [
  'game_demo_state',
  'game_day_snapshot',
  'game_inventory',
  'game_gold',
  'game_shop',
  'game_shop_rotation',
  'game_resources'
];

class SaveManager {
  static slotCount = 3;
  static metadata = null;

  static createMetadata() {
    return {
      version: 1,
      slots: {},
      activeSlot: null,
      lastPlayedSlot: null
    };
  }

  static initialize() {
    if (SaveManager.metadata) return SaveManager.metadata;

    try {
      const raw = localStorage.getItem(SAVE_SLOTS_STORAGE_KEY);
      if (raw !== null) {
        const saved = JSON.parse(raw);
        if (
          saved?.version === 1 &&
          saved.slots &&
          typeof saved.slots === 'object' &&
          !Array.isArray(saved.slots)
        ) {
          SaveManager.metadata = {
            ...SaveManager.createMetadata(),
            ...saved,
            slots: saved.slots
          };
          return SaveManager.metadata;
        }
        console.warn('Dados dos saves inválidos; criando uma lista vazia.');
      }
    } catch (error) {
      console.warn('Erro ao carregar os saves:', error);
    }

    SaveManager.metadata = SaveManager.createMetadata();
    SaveManager.migrateLegacySave();
    SaveManager.persistMetadata();
    return SaveManager.metadata;
  }

  static migrateLegacySave() {
    const data = Object.fromEntries(
      SAVE_SLOT_KEYS.map(key => [key, localStorage.getItem(key)])
    );
    if (!data['game_demo_state']) return;

    const now = Date.now();
    SaveManager.metadata.slots[1] = {
      createdAt: now,
      updatedAt: now,
      data
    };
    SaveManager.metadata.activeSlot = 1;
    SaveManager.metadata.lastPlayedSlot = 1;
  }

  static persistMetadata() {
    try {
      localStorage.setItem(
        SAVE_SLOTS_STORAGE_KEY,
        JSON.stringify(SaveManager.metadata)
      );
      return true;
    } catch (error) {
      console.error('Falha ao salvar a lista de saves:', error);
      return false;
    }
  }

  static getSlot(slotId) {
    SaveManager.initialize();
    return SaveManager.metadata.slots[String(slotId)] || null;
  }

  static isOccupied(slotId) {
    const slot = SaveManager.getSlot(slotId);
    return Boolean(slot && (
      Number.isFinite(slot.createdAt) ||
      Object.values(slot.data || {}).some(value => value !== null)
    ));
  }

  static getSlots() {
    SaveManager.initialize();
    return Array.from({ length: SaveManager.slotCount }, (_, index) => {
      const id = index + 1;
      return { id, save: SaveManager.getSlot(id), occupied: SaveManager.isOccupied(id) };
    });
  }

  static syncActiveSlot() {
    SaveManager.initialize();
    const slotId = SaveManager.metadata.activeSlot;
    if (!slotId || !SaveManager.isOccupied(slotId)) return false;

    const slot = SaveManager.metadata.slots[String(slotId)];
    slot.data = Object.fromEntries(
      SAVE_SLOT_KEYS.map(key => [key, localStorage.getItem(key)])
    );
    slot.updatedAt = Date.now();
    return SaveManager.persistMetadata();
  }

  static restoreSlot(slotId) {
    const slot = SaveManager.getSlot(slotId);
    if (!slot || !SaveManager.isOccupied(slotId)) return false;

    const data = slot.data || {};
    SAVE_SLOT_KEYS.forEach(key => {
      const value = data[key];
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    });
    return true;
  }

  static activateSlot(slotId) {
    SaveManager.initialize();
    if (!SaveManager.isOccupied(slotId)) return false;
    SaveManager.syncActiveSlot();
    SaveManager.metadata.activeSlot = slotId;
    SaveManager.metadata.lastPlayedSlot = slotId;
    if (!SaveManager.persistMetadata()) return false;
    return SaveManager.restoreSlot(slotId);
  }

  static createNewGame(slotId) {
    SaveManager.initialize();
    if (SaveManager.isOccupied(slotId)) return false;
    SaveManager.syncActiveSlot();

    const now = Date.now();
    SaveManager.metadata.slots[String(slotId)] = {
      createdAt: now,
      updatedAt: now,
      data: {}
    };
    SaveManager.metadata.activeSlot = slotId;
    SaveManager.metadata.lastPlayedSlot = slotId;
    if (!SaveManager.persistMetadata()) return false;
    SAVE_SLOT_KEYS.forEach(key => localStorage.removeItem(key));
    return true;
  }

  static continueLastPlayed() {
    SaveManager.initialize();
    const slotId = SaveManager.metadata.lastPlayedSlot;
    return slotId && SaveManager.activateSlot(slotId);
  }

  static loadForGameplay() {
    SaveManager.initialize();
    const activeSlot = SaveManager.metadata.activeSlot;
    if (activeSlot && SaveManager.activateSlot(activeSlot)) return true;

    const lastPlayed = SaveManager.metadata.lastPlayedSlot;
    if (lastPlayed && SaveManager.activateSlot(lastPlayed)) return true;

    const mostRecent = SaveManager.getSlots()
      .filter(slot => slot.occupied)
      .sort((a, b) => (b.save.updatedAt || 0) - (a.save.updatedAt || 0))[0];
    if (mostRecent) return SaveManager.activateSlot(mostRecent.id);

    const firstEmpty = SaveManager.getSlots().find(slot => !slot.occupied);
    return firstEmpty ? SaveManager.createNewGame(firstEmpty.id) : false;
  }

  static deleteCurrentGame() {
    SaveManager.initialize();
    SaveManager.syncActiveSlot();
    const slotId = SaveManager.metadata.activeSlot ||
      SaveManager.metadata.lastPlayedSlot;
    if (!slotId) return false;

    delete SaveManager.metadata.slots[String(slotId)];
    const nextSlot = SaveManager.getSlots()
      .filter(slot => slot.occupied)
      .sort((a, b) => (b.save.updatedAt || 0) - (a.save.updatedAt || 0))[0];
    SaveManager.metadata.activeSlot = nextSlot?.id || null;
    SaveManager.metadata.lastPlayedSlot = nextSlot?.id || null;
    if (!SaveManager.persistMetadata()) return false;

    if (nextSlot) {
      SaveManager.restoreSlot(nextSlot.id);
    } else {
      SAVE_SLOT_KEYS.forEach(key => localStorage.removeItem(key));
    }
    return true;
  }

  static resetActiveGame() {
    SaveManager.initialize();
    const slotId = SaveManager.metadata.activeSlot;
    if (!slotId) return;
    const now = Date.now();
    SaveManager.metadata.slots[String(slotId)] = {
      createdAt: now,
      updatedAt: now,
      data: {}
    };
    SaveManager.persistMetadata();
  }
}
