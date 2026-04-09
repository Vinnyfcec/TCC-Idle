class Shop {
    static getItems() {
        return estoque;
    }

    static buyByIndex(index) {
        //verificar se o indice é valido
        if (index < 1 || index > Shop.itens.length) {
            alert('Item inválido!');
            return;
        }
        //verificar se tem dinheiro
        if (!UI.checkGold(Shop.itens[index-1].price)) {
            alert('Dinheiro insuficiente!');
            return;
        }
        UI.payGold(Shop.itens[index-1].price);
        const item = Shop.itens[index-1];
        addItemToInventory(item);
    }
}