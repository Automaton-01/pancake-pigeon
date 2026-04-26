const KEY = 'pancake-pigeon-progress-v1';

export function loadProgress() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) ?? {};
    } catch {
        return {};
    }
}

export function saveProgress(levelId, stars) {
    const p = loadProgress();
    const prev = p[levelId] ?? 0;
    p[levelId] = Math.max(prev, stars);
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export function clearProgress() {
    try { localStorage.removeItem(KEY); } catch {}
}
