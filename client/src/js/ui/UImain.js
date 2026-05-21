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