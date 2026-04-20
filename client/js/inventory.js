let items = [];

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
      stackable: item.stackable !== false
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
      stackable: item.stackable !== false
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
}