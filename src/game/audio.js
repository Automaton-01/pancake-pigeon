let audioCtx = null;
let muted = false;
let lastDrawTone = 0;

export function initAudio() {
    if (!audioCtx) {
        try {
            const Ctor = window.AudioContext || window.webkitAudioContext;
            if (Ctor) audioCtx = new Ctor();
        } catch (e) {
            audioCtx = null;
        }
    }
    if (audioCtx?.state === 'suspended') audioCtx.resume();
}

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function tone(freq, dur = 0.1, type = 'sine', vol = 0.18) {
    if (!audioCtx || muted) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur);
}

function slide(f1, f2, dur = 0.1, type = 'sine', vol = 0.18) {
    if (!audioCtx || muted) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur);
}

export const SFX = {
    jump: () => slide(420, 800, 0.1, 'square', 0.1),
    collect: () => {
        tone(880, 0.06, 'triangle', 0.16);
        setTimeout(() => tone(1320, 0.1, 'triangle', 0.16), 50);
    },
    win: () => {
        const notes = [523, 659, 784, 1046];
        notes.forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.18), i * 130));
    },
    hurt: () => slide(300, 80, 0.25, 'sawtooth', 0.15),
    draw: () => {
        const now = performance.now();
        if (now - lastDrawTone < 60) return;
        lastDrawTone = now;
        tone(260 + Math.random() * 80, 0.04, 'triangle', 0.04);
    },
    click: () => tone(700, 0.05, 'square', 0.1),
    star: () => tone(1200, 0.12, 'triangle', 0.18)
};
