// Keep one chronological news list while adapting placement and visible count.
(() => {
    const news = document.querySelector('#news');
    const intro = document.querySelector('#intro');
    if (!news || !intro) return;
    const sidebar = news.parentElement;
    const recent = news.querySelector(':scope > .news-list');
    const archive = news.querySelector('.news-archive .news-list');
    const summary = news.querySelector('summary');
    const items = [...recent.children, ...archive.children];
    const narrow = window.matchMedia('(max-width: 740px)');
    const layout = () => {
        const count = narrow.matches ? 3 : 5;
        if (narrow.matches) intro.after(news);
        else sidebar.append(news);
        recent.replaceChildren(...items.slice(0, count));
        archive.replaceChildren(...items.slice(count));
        summary.textContent = `Earlier news (${items.length - count})`;
    };
    layout();
    narrow.addEventListener('change', layout);
})();
