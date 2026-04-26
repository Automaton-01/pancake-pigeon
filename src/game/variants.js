// Pigeon variants — picked from the lobby, persisted across sessions.
// Each variant has a unique body shape (in-game multi-part rig + static avatar),
// per-variant tints, and a head texture with the accessory baked in.
//
// `shape` is the source of truth for the body silhouette. Both the in-game body
// texture (`pigeon-body-{id}`, 220x220) and the static avatar's body section
// derive from these ellipses & tail triangles.
//
// Coordinates are relative to body center (cx, cy). Static avatar scales them
// up by ~1.07x and renders at higher canvas size; the head/wing/leg overlays
// in the avatar are positioned in the avatar's own pixel space.

const DEFAULT_SHAPE = {
    belly:  [215, 150,  0,  18],   // [w, h, ox, oy] — main lower body ellipse
    upper:  [168, 120,  6, -35],   // upper chest ellipse
    hi:     [160, 105, 10,  30],   // belly highlight (lighter)
    hi2:    [105,  48, 12,  50],   // smaller bright highlight
    tail1:  [-100, -15, -50, -35, -55, 25],   // tail triangle A: 3 (x,y) points
    tail2:  [-90,  -5,  -45, -25, -50, 30],   // tail triangle B (lighter)
    neck:   [70, 22, 30, -60],     // green iridescence band
    neck2:  [50, 14, 36, -54],     // purple iridescence band
    showNeck: true,
    // In-game multi-part rig — head position relative to body container origin
    headX: 40, headY: -115,
    wingX: -2, wingY:  -78,
    wingScale: 1,                   // multiplier for the wing sprite (in-game + static)
};

// Each variant only specifies what differs from DEFAULT_SHAPE; merged at access time.
const SHAPES = {
    classic: {
        // Anto's wings are intentionally small — daintier silhouette than the
        // burly default wing texture would suggest.
        wingScale: 0.6,
    },
    pink: {
        belly:  [188, 165, 0, 20],
        upper:  [148, 130, 6, -45],
        hi:     [140, 115, 10, 30],
        hi2:    [85, 50, 12, 52],
        tail1:  [-92, -22, -44, -42, -48, 20],
        tail2:  [-82, -12, -40, -32, -44, 26],
        neck:   [60, 18, 28, -68],
        neck2:  [42, 10, 34, -62],
        showNeck: false,
        headY: -122,   // taller body → head sits higher
    },
    chef: {
        belly:  [228, 178, 0, 8],   // big round dumpling
        upper:  [200, 140, 6, -28],
        hi:     [185, 122, 10, 22],
        hi2:    [125, 58, 12, 44],
        tail1:  [-105, -5, -50, -28, -55, 32],
        tail2:  [-95, 5, -45, -18, -50, 36],
        neck:   [78, 22, 30, -52],
        neck2:  [55, 14, 36, -46],
        headY: -108,
    },
    punk: {
        belly:  [202, 152, 0, 20],
        upper:  [162, 132, 6, -40],
        hi:     [148, 105, 10, 30],
        hi2:    [92, 48, 12, 50],
        // jagged "torn-up" tail
        tail1:  [-115, -22, -48, -42, -45, 30],
        tail2:  [-100, -8, -40, -28, -38, 35],
        showNeck: false,
        headY: -118,
    },
    astro: {
        belly:  [188, 178, 0, 4],   // egg-shape (capsule-like)
        upper:  [172, 144, 6, -38],
        hi:     [152, 122, 10, 18],
        hi2:    [98, 56, 12, 40],
        tail1:  [-92, -8, -42, -30, -48, 28],
        tail2:  [-82, 2, -40, -20, -45, 32],
        showNeck: false,
        headY: -118,
    },
    cowboy: {
        belly:  [188, 144, 0, 28],   // narrower hips
        upper:  [206, 142, 6, -38],  // BROADER chest (sturdy)
        hi:     [152, 100, 10, 34],
        hi2:    [100, 45, 12, 52],
        tail1:  [-95, -18, -45, -38, -50, 22],
        tail2:  [-85, -8, -40, -28, -45, 28],
        neck:   [72, 22, 32, -58],
        neck2:  [52, 14, 36, -52],
        showNeck: false,
        headY: -118,
    },
    wizard: {
        belly:  [162, 178, 0, 18],   // tall + narrow
        upper:  [138, 148, 6, -48],
        hi:     [124, 124, 10, 28],
        hi2:    [78, 55, 12, 48],
        tail1:  [-90, -28, -42, -48, -42, 16],
        tail2:  [-80, -18, -38, -38, -38, 22],
        neck:   [54, 18, 26, -72],
        neck2:  [38, 10, 30, -66],
        showNeck: false,
        headY: -132,    // tall body — head much higher
    },
    ninja: {
        belly:  [228, 128, 0, 30],   // wide + flat (low profile)
        upper:  [180,  98, 6, -28],
        hi:     [168,  88, 10, 38],
        hi2:    [110,  38, 12, 56],
        tail1:  [-108, -2, -50, -22, -55, 34],
        tail2:  [-98, 8, -45, -12, -50, 38],
        showNeck: false,
        headY: -100,    // sleek, head sits closer
    },
    bee: {
        belly:  [196, 196, 0, -2],   // perfect sphere
        upper:  [162, 132, 6, -22],
        hi:     [156, 132, 10, 10],
        hi2:    [100, 50, 12, 30],
        tail1:  [-92, -10, -42, -28, -48, 32],
        tail2:  [-82, 0, -38, -18, -45, 36],
        showNeck: false,
        headY: -110,
    },
    ryan: {
        // ULTRA fat — wider and rounder than even the chef. The body almost
        // touches the canvas edges so Ryan looks like he's about to topple over.
        belly:  [252, 198, 0, 4],
        upper:  [228, 156, 6, -22],
        hi:     [222, 148, 10, 10],
        hi2:    [148, 74, 12, 38],
        tail1:  [-118, -2, -50, -28, -56, 38],
        tail2:  [-108, 8, -45, -18, -52, 42],
        showNeck: false,
        headY: -98,    // huge upper means head sits closer to the body
    },
};

function shapeFor (id) {
    return { ...DEFAULT_SHAPE, ...(SHAPES[id] || {}) };
}

export const VARIANTS = {
    classic: {
        id: 'classic',
        name: 'Anto',
        bodyTint: 0xffffff,
        wingTint: 0xffffff,
        legTint:  0xffffff,
        shape: shapeFor('classic'),
    },
    pink: {
        id: 'pink',
        name: 'Pearl',
        bodyTint: 0xffb6cf,
        wingTint: 0xe890ad,
        legTint:  0xffffff,
        shape: shapeFor('pink'),
    },
    chef: {
        id: 'chef',
        name: 'Biscuit',
        bodyTint: 0xffffff,
        wingTint: 0xffffff,
        legTint:  0xffffff,
        shape: shapeFor('chef'),
    },
    punk: {
        id: 'punk',
        name: 'Riot',
        bodyTint: 0xb5b9c0,
        wingTint: 0x9aa0a8,
        legTint:  0xffffff,
        shape: shapeFor('punk'),
    },
    astro: {
        id: 'astro',
        name: 'Sputnik',
        bodyTint: 0xeaf2ff,
        wingTint: 0xc9d6e8,
        legTint:  0xffffff,
        shape: shapeFor('astro'),
    },
    cowboy: {
        id: 'cowboy',
        name: 'Tex',
        bodyTint: 0xd6a878,
        wingTint: 0xa8794a,
        legTint:  0xffffff,
        shape: shapeFor('cowboy'),
    },
    wizard: {
        id: 'wizard',
        name: 'Merlin',
        bodyTint: 0xa48ad0,
        wingTint: 0x6f4ea0,
        legTint:  0xffffff,
        shape: shapeFor('wizard'),
    },
    ninja: {
        id: 'ninja',
        name: 'Shadow',
        bodyTint: 0x484e58,
        wingTint: 0x2a2e36,
        legTint:  0xffffff,
        shape: shapeFor('ninja'),
    },
    bee: {
        id: 'bee',
        name: 'Bumble',
        bodyTint: 0xffd33a,
        wingTint: 0xc9a428,
        legTint:  0xffffff,
        shape: shapeFor('bee'),
    },
    ryan: {
        id: 'ryan',
        name: 'Ryan (Not true king)',
        bodyTint: 0xffffff,
        wingTint: 0xe9c878,   // warm honey gold — bright enough to match the cream body without going muddy
        legTint:  0xffffff,
        shape: shapeFor('ryan'),
        // Funny wobble in update loop — bigger sway, drunken jiggle when moving.
        funnyWalk: true,
        // Movement overrides — Ryan is too heavy to run or jump properly.
        walkSpeed: 2.6,    // default is 4.5 (~58% of normal)
        jumpV: -7.0,       // default is -11 (mini-jumps only)
    },
};

// Only `classic` (Anto) and `ryan` are visible in the picker for now. Other
// variant code is kept around so we can re-enable them later without
// re-implementing shapes/accessories.
export const VARIANT_ORDER = ['classic', 'ryan'];

// All variant heads share the same uniform layout (140x180, head circle at (60, 110))
// so createPigeon can use one origin regardless of selection.
export const HEAD_ORIGIN = { x: 60 / 140, y: 110 / 180 };

export function headTextureKey(variantId) {
    return `pigeon-head-${variantId}`;
}

export function bodyTextureKey(variantId) {
    return `pigeon-body-${variantId}`;
}

export function staticTextureKey(variantId) {
    return `pigeon-${variantId}`;
}
