const STORAGE_KEY_GOLD = 'game_gold';

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
        try {
            localStorage.setItem(STORAGE_KEY_GOLD, String(UI.gold));
        } catch (e) {
            console.warn('Falha ao salvar gold no localStorage', e);
        }
    }

    static loadGold() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_GOLD);
            if (raw !== null) {
                const valor = Number(raw);
                if (!Number.isNaN(valor)) UI.gold = valor;
            }
        } catch (e) {
            console.warn('Falha ao carregar gold do localStorage', e);
        }
    }
}