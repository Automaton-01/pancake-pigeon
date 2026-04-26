let audioCtx = null;
let muted = false;
let lastDrawTone = 0;

// MP3 samples — loaded once on first initAudio(), then played via Web Audio.
const SAMPLE_URLS = {
    gameStart:  'assets/sfx/pigeon game start.mp3',
    idle10s:    'assets/sfx/idle for 10 seconds.mp3',
    babyRescue: 'assets/sfx/baby rescue and finds final pancake.mp3',
    die1:       'assets/sfx/pigeon dies.mp3',
    die2:       'assets/sfx/pigeon dies 2.mp3',
    jumpRare:   'assets/sfx/sometimes when jumping.mp3',
};
const samples = {};
let samplesLoading = null;

function loadSamples() {
    if (!audioCtx || samplesLoading) return samplesLoading;
    samplesLoading = Promise.all(
        Object.entries(SAMPLE_URLS).map(([key, url]) =>
            fetch(url)
                .then(r => r.arrayBuffer())
                .then(buf => audioCtx.decodeAudioData(buf))
                .then(b => { samples[key] = b; })
                .catch(e => console.warn('SFX load failed:', key, e))
        )
    );
    return samplesLoading;
}

function playSample(key, vol = 0.85) {
    if (!audioCtx || muted) return;
    const buf = samples[key];
    if (!buf) return;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    src.connect(g).connect(audioCtx.destination);
    src.start();
}

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
    loadSamples();
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
    star: () => tone(1200, 0.12, 'triangle', 0.18),
    // ---- Recorded voice samples ----
    gameStart:  () => playSample('gameStart',  0.85),
    idle10s:    () => playSample('idle10s',    0.75),
    babyRescue: () => playSample('babyRescue', 0.90),
    death:      () => playSample(Math.random() < 0.5 ? 'die1' : 'die2', 0.85),
    // Roughly 1 in 4 jumps gets the funny voice clip on top of the synth jump.
    jumpVoice:  () => { if (Math.random() < 0.25) playSample('jumpRare', 0.75); },
    caw: () => {
        if (!audioCtx || muted) return;
        const t0 = audioCtx.currentTime;

        // Two-syllable "CAW-aw": punchy attack, raspy buzz from a fast LFO
        // wobbling the pitch, plus a noise burst on the attack to give the
        // hard "k" consonant sound and grit.
        const playSyllable = (start, baseFreq, endFreq, dur, vol, lfoRate, lfoDepth) => {
            // Carrier with descending pitch envelope
            const carrier = audioCtx.createOscillator();
            const carrierGain = audioCtx.createGain();
            carrier.type = 'sawtooth';
            carrier.frequency.setValueAtTime(baseFreq, start);
            carrier.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
            carrierGain.gain.setValueAtTime(0, start);
            carrierGain.gain.linearRampToValueAtTime(vol, start + 0.012);
            carrierGain.gain.linearRampToValueAtTime(vol * 0.7, start + 0.05);
            carrierGain.gain.exponentialRampToValueAtTime(0.001, start + dur);
            carrier.connect(carrierGain).connect(audioCtx.destination);
            carrier.start(start);
            carrier.stop(start + dur + 0.02);

            // Fast LFO modulating pitch creates the buzzy "rrrr" texture of a real caw
            const lfo = audioCtx.createOscillator();
            const lfoGain = audioCtx.createGain();
            lfo.type = 'square';
            lfo.frequency.setValueAtTime(lfoRate, start);
            lfoGain.gain.setValueAtTime(lfoDepth, start);
            lfo.connect(lfoGain).connect(carrier.frequency);
            lfo.start(start);
            lfo.stop(start + dur + 0.02);

            // Squarewave detuned octave-up adds harshness
            const harsh = audioCtx.createOscillator();
            const harshGain = audioCtx.createGain();
            harsh.type = 'square';
            harsh.frequency.setValueAtTime(baseFreq * 1.5, start);
            harsh.frequency.exponentialRampToValueAtTime(endFreq * 1.5, start + dur);
            harshGain.gain.setValueAtTime(0, start);
            harshGain.gain.linearRampToValueAtTime(vol * 0.25, start + 0.014);
            harshGain.gain.exponentialRampToValueAtTime(0.001, start + dur);
            harsh.connect(harshGain).connect(audioCtx.destination);
            harsh.start(start);
            harsh.stop(start + dur + 0.02);
        };

        // Sharp "K" consonant: short filtered noise burst
        const burstLen = Math.floor(audioCtx.sampleRate * 0.04);
        const burstBuf = audioCtx.createBuffer(1, burstLen, audioCtx.sampleRate);
        const burstData = burstBuf.getChannelData(0);
        for (let i = 0; i < burstLen; i++) {
            burstData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / burstLen, 1.4);
        }
        const burst = audioCtx.createBufferSource();
        burst.buffer = burstBuf;
        const burstFilter = audioCtx.createBiquadFilter();
        burstFilter.type = 'bandpass';
        burstFilter.frequency.value = 1100;
        burstFilter.Q.value = 1.4;
        const burstGain = audioCtx.createGain();
        burstGain.gain.setValueAtTime(0.30, t0);
        burstGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.05);
        burst.connect(burstFilter).connect(burstGain).connect(audioCtx.destination);
        burst.start(t0);
        burst.stop(t0 + 0.05);

        // First syllable: punchy "CAW"
        playSyllable(t0, 540, 240, 0.20, 0.22, 38, 55);
        // Second syllable: shorter "aw" tail at lower pitch
        playSyllable(t0 + 0.21, 380, 180, 0.30, 0.18, 32, 40);
    }
};
