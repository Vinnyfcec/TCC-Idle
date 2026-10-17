const itemDatabase = {
  1: {
    id: 1,
    name: 'Espada de Ferro',
    quantity: 1,
    price: 100,
    stackable: false,
    wearable: true,
    class: 'weapon',
    type: 'slash',
    attribute: 'strength',
    att_value: 10
  },
  2: {
    id: 2,
    name: 'Poção de Saúde',
    quantity: 1,
    price: 20,
    stackable: true,
    wearable: false,
    class: 'consumable',
    type: 'heal',
    attribute: 'hp',
    att_value: 50
  },
  3: {
    id: 3,
    name: 'Escudo de Madeira',
    quantity: 1,
    price: 85,
    stackable: false,
    wearable: true,
    class: 'shield',
    type: 'protection',
    attribute: 'defense',
    att_value: 10
  },
  4: {
    id: 4,
    name: 'Machado de Lenhador',
    quantity: 1,
    price: 150,
    stackable: false,
    wearable: true,
    class: 'weapon',
    type: 'mining',
    attribute: 'strength',
    att_value: 10
  },
  5: {
    id: 5,
    name: 'Picareta',
    quantity: 1,
    price: 60,
    stackable: false,
    wearable: true,
    class: 'weapon',
    type: 'mining',
    attribute: 'strength',
    att_value: 7
  },
  6: {
    id: 6,
    name: 'Martelo de Guerra',
    quantity: 1,
    price: 90,
    stackable: false,
    wearable: true,
    class: 'weapon',
    type: 'blunt',
    attribute: 'strength',
    att_value: 13,
    bonuses: { strength: 13, defense: -2 }
  },
  7: {
    id: 7,
    name: 'Anel da Fortuna · Sorte +1',
    quantity: 1,
    price: 15,
    stackable: false,
    wearable: true,
    class: 'accessory',
    type: 'ring',
    attribute: 'luck',
    att_value: 1
  },
  8: {
    id: 8,
    name: 'Pingente da Sorte · Sorte +2',
    quantity: 1,
    price: 30,
    stackable: false,
    wearable: true,
    class: 'accessory',
    type: 'pendant',
    attribute: 'luck',
    att_value: 2
  },
  9: {
    id: 9,
    name: 'Amuleto da Fortuna · Sorte +3',
    quantity: 1,
    price: 45,
    stackable: false,
    wearable: true,
    class: 'accessory',
    type: 'amulet',
    attribute: 'luck',
    att_value: 3
  },
  10: {
    id: 10,
    name: 'Relíquia do Pântano · Sorte +5',
    quantity: 1,
    price: 75,
    stackable: false,
    wearable: true,
    class: 'accessory',
    type: 'relic',
    attribute: 'luck',
    att_value: 5
  },
  11: {
    id: 11,
    name: 'Lança',
    quantity: 1,
    price: 90,
    stackable: false,
    wearable: true,
    class: 'weapon',
    type: 'pierce',
    attribute: 'strength',
    att_value: 8,
    bonuses: { strength: 8, defense: 2 }
  },
  12: {
    id: 12,
    name: 'Arco',
    quantity: 1,
    price: 85,
    stackable: false,
    wearable: true,
    class: 'weapon',
    type: 'ranged',
    attribute: 'strength',
    att_value: 7,
    bonuses: { strength: 7, defense: 4 }
  },
  13: {
    id: 13,
    name: 'Foice',
    quantity: 1,
    price: 80,
    stackable: false,
    wearable: true,
    class: 'weapon',
    type: 'slash',
    attribute: 'strength',
    att_value: 10,
    bonuses: { strength: 10, luck: 1 }
  }
};

const rotatingWeaponIds = [5, 6, 11, 12, 13];

function createCatalogItem(itemId, overrides = {}) {
  const item = itemDatabase[itemId];
  if (!item) throw new Error(`Item ${itemId} não existe no catálogo.`);
  return { ...item, ...overrides, bonuses: item.bonuses ? { ...item.bonuses } : undefined };
}

const estoque = [
  createCatalogItem(2, { unlimitedStock: true }),
  createCatalogItem(4)
];

const inventarioInicial = [
  createCatalogItem(1),
  createCatalogItem(2, { quantity: 2 }),
  createCatalogItem(3)
];
