class Shop {
    static getItems() {
        return estoque;
    }

    static buyByIndex(index) {
        //verificar se o indice é valido
        if (index < 0 || index > estoque.length) {
            alert('Item inválido!');
            return;
        }
        //verificar se tem dinheiro
        if (!UI.checkGold(estoque[index].price)) {
            alert('Dinheiro insuficiente!');
            return;
        }
        //verificar se tem espaço no inventário
        if (estoque[index].quantity + Inventory.itemsLength() > 20) {
            alert('Sem espaço no Inventario');
            return;
        }
        UI.payGold(estoque[index].price);
        const item = estoque[index];
        addItemToInventory(item);
    }

    static addItem(item) {
        estoque.push(item);
        ShopUI.render();
    }
}