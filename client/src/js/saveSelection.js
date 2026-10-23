class SaveSelection {
  static selectedSlot = null;

  static init() {
    SaveManager.initialize();
    const params = new URLSearchParams(window.location.search);
    const creating = params.get('mode') === 'new';
    const list = document.getElementById('save-slot-list');
    const action = document.getElementById('save-action-btn');
    const status = document.getElementById('save-selection-status');
    if (!list || !action || !status) return;

    document.getElementById('save-selection-heading').textContent = creating
      ? 'Escolha um save vazio'
      : 'Escolha um save para continuar';
    action.textContent = creating ? 'Criar novo jogo' : 'Continuar jogo';
    action.disabled = true;

    SaveManager.getSlots().forEach(({ id, save, occupied }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'save-slot-card';
      button.dataset.slotId = String(id);
      button.disabled = creating ? occupied : !occupied;
      button.setAttribute('aria-pressed', 'false');

      const title = document.createElement('strong');
      title.textContent = `Save ${id}`;
      const detail = document.createElement('span');
      detail.className = 'save-slot-detail';
      if (occupied) {
        let gameState = {};
        try {
          gameState = JSON.parse(save.data?.['game_demo_state'] || '{}');
        } catch (error) {
          console.warn(`Estado inválido no save ${id}:`, error);
        }
        const day = Number.isSafeInteger(gameState.day) ? gameState.day : 1;
        const gold = Number(save.data?.game_gold ?? 200);
        detail.textContent = `Dia ${day} · ${gold} ouro`;
      } else {
        detail.textContent = 'Vazio';
      }
      const updated = document.createElement('span');
      updated.className = 'save-slot-updated';
      updated.textContent = occupied && save.updatedAt
        ? `Salvo em ${new Date(save.updatedAt).toLocaleDateString('pt-BR')}`
        : creating && !occupied
          ? 'Disponível para um novo jogo'
          : 'Sem jogo salvo';

      button.append(title, detail, updated);
      button.addEventListener('click', () => {
        SaveSelection.selectedSlot = id;
        list.querySelectorAll('.save-slot-card').forEach(card => {
          const selected = card === button;
          card.classList.toggle('is-selected', selected);
          card.setAttribute('aria-pressed', String(selected));
        });
        action.disabled = false;
        status.textContent = `Save ${id} selecionado.`;
      });
      list.appendChild(button);
    });

    action.addEventListener('click', () => {
      const slotId = SaveSelection.selectedSlot;
      if (!slotId) return;
      const succeeded = creating
        ? SaveManager.createNewGame(slotId)
        : SaveManager.activateSlot(slotId);
      if (succeeded) TitleScreen.openGame();
      else status.textContent = 'Não foi possível acessar esse save.';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => SaveSelection.init());
