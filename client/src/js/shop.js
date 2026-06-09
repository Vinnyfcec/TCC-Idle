const STORAGE_KEY_SHOP = 'game_shop';

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
        Shop.persist();
        ShopUI.render();
    }

    static persist() {
        try {
            localStorage.setItem(STORAGE_KEY_SHOP, JSON.stringify(estoque));
        } catch (e) {
            console.warn('Falha ao salvar estoque da loja no localStorage', e);
        }
    }

    static loadFromLocalStorage(defaultEstoque) {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_SHOP);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    // sobrescreve o estoque
                    estoque.length = 0;
                    parsed.forEach(i => estoque.push(i));
                    return;
                }
            }
        } catch (e) {
            console.warn('Erro ao carregar estoque da loja do localStorage', e);
        }
        if (defaultEstoque) {
            estoque.length = 0;
            defaultEstoque.forEach(i => estoque.push(i));
            Shop._persist();
        }
    }
}