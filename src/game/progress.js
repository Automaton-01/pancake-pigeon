import { VARIANT_ORDER } from './variants';

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

const VARIANT_KEY = 'pancake-pigeon-variant-v1';

export function loadVariant() {
    try {
        const v = localStorage.getItem(VARIANT_KEY);
        // If a previously selected variant is no longer visible (we trimmed
        // the picker), fall back to the default rather than failing to render.
        return VARIANT_ORDER.includes(v) ? v : 'classic';
    } catch {
        return 'classic';
    }
}

export function saveVariant(id) {
    try { localStorage.setItem(VARIANT_KEY, id); } catch {}
}
