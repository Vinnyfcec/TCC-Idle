class TitleScreen {
  static init() {
    SaveManager.initialize();

    const continueButton = document.getElementById('continue-game-btn');
    if (continueButton) {
      const lastSlot = SaveManager.metadata.lastPlayedSlot;
      continueButton.disabled = !lastSlot || !SaveManager.isOccupied(lastSlot);
      continueButton.addEventListener('click', () => {
        if (SaveManager.continueLastPlayed()) TitleScreen.openGame();
      });
    }

    document.getElementById('new-game-btn')?.addEventListener('click', () => {
      window.location.href = 'saves.html?mode=new';
    });
    document.getElementById('view-saves-btn')?.addEventListener('click', () => {
      window.location.href = 'saves.html';
    });

    const deleteButton = document.getElementById('delete-game-btn');
    if (deleteButton) {
      const currentSlot = SaveManager.metadata.activeSlot ||
        SaveManager.metadata.lastPlayedSlot;
      deleteButton.disabled = !currentSlot || !SaveManager.isOccupied(currentSlot);
      deleteButton.addEventListener('click', () => {
        if (!window.confirm('Deletar o jogo atual? Essa ação não pode ser desfeita.')) {
          return;
        }
        if (SaveManager.deleteCurrentGame()) {
          window.location.reload();
        }
      });
    }
  }

  static openGame() {
    window.location.href = '../../dev/lobbydev.html';
  }
}

document.addEventListener('DOMContentLoaded', () => TitleScreen.init());
