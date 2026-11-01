// Both columns use the same date mapping and expand together when text wraps.
(() => {
    const plot = document.querySelector('.career-plot');
    if (!plot) return;
    const chart = plot.closest('.career-chart');
    const entries = [...plot.querySelectorAll('.career-entry')];
    const axis = plot.querySelector('.career-axis');
    const monthIndex = date => {
        const [year, month] = date.split('-').map(Number);
        return year * 12 + month - 1;
    };
    const now = new Date();
    const present = now.getFullYear() * 12 + now.getMonth() + 1;
    const isIndustry = entry => entry.classList.contains('career-industry');
    const endMonth = entry => {
        if (!entry.dataset.end) return present;
        const end = monthIndex(entry.dataset.end);
        // Consecutive roles meet at their shared month; other end months are inclusive.
        const continues = entries.some(next => next !== entry &&
            isIndustry(next) === isIndustry(entry) && monthIndex(next.dataset.start) === end);
        return end + (continues ? 0 : 1);
    };
    const oldest = Math.min(...entries.map(entry => monthIndex(entry.dataset.start)));
    const latest = Math.max(present, ...entries.map(endMonth));
    const boundary = monthIndex('2023-01');
    const recentBoundary = monthIndex('2026-07');
    const baseDistance = month => {
        if (month <= boundary) return (month - oldest) * 0.7;
        const early = (boundary - oldest) * 0.7;
        if (month <= recentBoundary) return early + (month - boundary) * 2.6;
        return early + (recentBoundary - boundary) * 2.6 + (month - recentBoundary) * 14;
    };
    const dates = [...new Set([
        oldest, latest, boundary, recentBoundary, monthIndex('2020-01'),
        ...entries.flatMap(entry => [monthIndex(entry.dataset.start), endMonth(entry)]),
        ...Array.from({ length: Math.floor(latest / 12) - 2023 }, (_, i) => (2024 + i) * 12)
    ])].filter(month => month >= oldest && month <= latest).sort((a, b) => a - b);

    let lastWidth = 0;
    const layout = () => {
        lastWidth = chart.getBoundingClientRect().width;
        // Let the two duration tracks spread toward their columns on wider charts.
        const gutter = Math.min(200, Math.max(64, lastWidth * 0.22));
        const column = (lastWidth - gutter) / 2;
        const labelWidth = Math.min(280, column);
        const inset = (column - labelWidth) / 2;
        const connectorWidth = inset - 0.5;
        chart.style.setProperty('--career-gutter', gutter + 'px');
        chart.style.setProperty('--career-column-width', column + 'px');
        chart.style.setProperty('--career-label-width', labelWidth + 'px');
        chart.style.setProperty('--career-label-inset', inset + 'px');
        chart.style.setProperty('--career-connector-width', Math.max(0, connectorWidth) + 'px');
        chart.classList.toggle('has-connectors', connectorWidth >= 8);
        chart.classList.add('is-enhanced');
        chart.classList.toggle('is-narrow', lastWidth < 420);
        plot.classList.add('is-ready');
        const measurements = new Map(entries.map(entry => {
            const label = entry.querySelector('.career-label');
            const date = entry.querySelector('.career-date');
            return [entry, {
                height: label.getBoundingClientRect().height,
                dateCenter: parseFloat(getComputedStyle(date).lineHeight) / 2
            }];
        }));
        const segments = dates.slice(1).map((end, i) => ({
            start: dates[i], end, height: baseDistance(end) - baseDistance(dates[i])
        }));
        // Expand the shared date intervals, keeping every date on its own node.
        for (const industry of [false, true]) {
            const track = entries.filter(entry => isIndustry(entry) === industry)
                .sort((a, b) => endMonth(b) - endMonth(a));
            for (let i = 1; i < track.length; i++) {
                const previous = track[i - 1];
                const next = track[i];
                const covered = segments.filter(segment =>
                    segment.start >= endMonth(next) && segment.end <= endMonth(previous));
                const available = covered.reduce((sum, segment) => sum + segment.height, 0);
                const before = measurements.get(previous);
                const after = measurements.get(next);
                const required = before.height - before.dateCenter + after.dateCenter + 28;
                if (available > 0 && available < required) {
                    const ratio = required / available;
                    covered.forEach(segment => { segment.height *= ratio; });
                }
            }
        }
        const positions = new Map([[latest, 0]]);
        let totalHeight = 0;
        for (const segment of [...segments].reverse()) {
            totalHeight += segment.height;
            positions.set(segment.start, totalHeight);
        }
        const y = month => positions.get(month);
        const axisTop = Math.max(...entries.map(entry => measurements.get(entry).dateCenter)) + 2;
        plot.style.setProperty('--axis-top', axisTop + 'px');
        plot.style.setProperty('--axis-height', totalHeight + 'px');
        let bottom = axisTop + totalHeight + 12;
        for (const entry of entries) {
            const top = axisTop + y(endMonth(entry));
            const size = measurements.get(entry);
            entry.style.setProperty('--range-top', top + 'px');
            entry.style.setProperty('--range-height', (y(monthIndex(entry.dataset.start)) - y(endMonth(entry))) + 'px');
            entry.style.setProperty('--label-offset', -size.dateCenter + 'px');
            bottom = Math.max(bottom, top - size.dateCenter + size.height);
        }
        plot.style.setProperty('--timeline-height', Math.ceil(bottom + 8) + 'px');
        axis.replaceChildren();
        const occupied = [0, totalHeight];
        const tick = (label, month, required = false) => {
            const position = y(month);
            if (position === undefined || (!required && occupied.some(other => Math.abs(other - position) < 22))) return;
            const span = document.createElement('span');
            span.className = 'career-tick';
            span.textContent = label;
            span.style.setProperty('--tick-position', position + 'px');
            axis.append(span);
            occupied.push(position);
        };
        tick('Present', latest, true);
        tick('2016', oldest, true);
        for (let year = Math.floor(latest / 12); year >= 2024; year--) {
            if (year % 2 === 0 && latest - year * 12 >= 3) tick(String(year), year * 12);
        }
        tick('2020', monthIndex('2020-01'));
        const scaleBreak = document.createElement('span');
        scaleBreak.className = 'career-axis-break';
        scaleBreak.style.setProperty('--break-position', y(boundary) + 'px');
        axis.append(scaleBreak);
    };
    layout();
    window.addEventListener('resize', layout);
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(records => {
            if (Math.abs(records[0].contentRect.width - lastWidth) > 0.5) layout();
        }).observe(chart);
    }
    if (document.fonts) document.fonts.ready.then(layout);
})();
