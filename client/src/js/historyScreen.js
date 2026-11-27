class HistoryScreen {
  static init() {
    const pages = Array.from(document.querySelectorAll('.history-page'));
    const previousButton = document.getElementById('history-previous-btn');
    const nextButton = document.getElementById('history-next-btn');
    const pageIndicator = document.getElementById('history-page-indicator');

    if (!pages.length || !previousButton || !nextButton || !pageIndicator) return;

    let activePage = 0;
    const render = () => {
      pages.forEach((page, index) => {
        page.hidden = index !== activePage;
      });
      previousButton.disabled = activePage === 0;
      nextButton.disabled = activePage === pages.length - 1;
      pageIndicator.textContent = `Página ${activePage + 1} de ${pages.length}`;
    };

    previousButton.addEventListener('click', () => {
      if (activePage === 0) return;
      activePage--;
      render();
    });
    nextButton.addEventListener('click', () => {
      if (activePage === pages.length - 1) return;
      activePage++;
      render();
    });

    render();
  }
}

document.addEventListener('DOMContentLoaded', () => HistoryScreen.init());
