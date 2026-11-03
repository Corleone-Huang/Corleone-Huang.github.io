// Keep one chronological news list while adapting placement and visible count.
(() => {
    const news = document.querySelector('#news');
    const intro = document.querySelector('#intro');
    if (!news || !intro) return;
    const sidebar = news.parentElement;
    const recent = news.querySelector(':scope > .news-list');
    const archive = news.querySelector('.news-archive .news-list');
    const summary = news.querySelector('summary');
    const details = news.querySelector('.news-archive');
    const items = [...recent.children, ...archive.children];
    const narrow = window.matchMedia('(max-width: 740px)');
    // Cap the pane at its collapsed height, independently of archive content.
    const sizePane = () => {
        const height = summary.getBoundingClientRect().bottom
            - news.getBoundingClientRect().top + news.scrollTop;
        const value = `${height}px`;
        if (news.style.getPropertyValue('--news-viewport-height') !== value) {
            news.style.setProperty('--news-viewport-height', value);
        }
    };
    const layout = () => {
        const count = narrow.matches ? 3 : 5;
        if (narrow.matches) intro.after(news);
        else sidebar.append(news);
        recent.replaceChildren(...items.slice(0, count));
        archive.replaceChildren(...items.slice(count));
        summary.textContent = `Earlier news (${items.length - count})`;
        sizePane();
    };
    layout();
    narrow.addEventListener('change', layout);
    details.addEventListener('toggle', () => {
        sizePane();
        // Bring the newly revealed archive into view inside the pane only.
        news.scrollTop = details.open ? summary.getBoundingClientRect().top
            - news.getBoundingClientRect().top + news.scrollTop
            - news.querySelector('h2').getBoundingClientRect().height - 16 : 0;
    });
    const observer = new ResizeObserver(sizePane);
    observer.observe(recent);
    observer.observe(summary);
    document.fonts.ready.then(sizePane);
})();
