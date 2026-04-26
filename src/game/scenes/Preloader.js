import { Scene } from 'phaser';
import { VARIANTS, VARIANT_ORDER } from '../variants';

export class Preloader extends Scene
{
    constructor () {
        super('Preloader');
    }

    create () {
        // Particle texture (small white circle)
        const p = this.add.graphics();
        p.fillStyle(0xffffff, 1);
        p.fillCircle(8, 8, 8);
        p.generateTexture('particle', 16, 16);
        p.destroy();

        this.makePigeonHeadTexture();
        this.makePigeonWingTexture();
        this.makePigeonLegTexture();
        this.makeBabyPigeonTexture();
        this.makeFeatherTexture();
        this.makePancakeTexture();

        // Pigeon variants — body texture (uses per-variant shape), head texture
        // (with accessory baked in), and static avatar (composited rendering).
        for (const id of VARIANT_ORDER) {
            this.makeVariantBody(id);
            this.makeVariantHead(id);
            this.makeVariantStatic(id);
        }

        this.makeAvocadoTexture();
        this.makeBeetTexture();
        this.makeEggTexture();

        this.scene.start('MainMenu');
    }

    // Tiny chibi-style baby pigeon: chubby round body, oversized head, big eye,
    // soft down tuft on top. Faces right; flip with scaleX = -|s|.
    makeBabyPigeonTexture () {
        const g = this.add.graphics();
        const W = 96, H = 110;
        const cx = 48;

        // Drop shadow
        g.fillStyle(0x000000, 0.18);
        g.fillEllipse(cx, 96, 56, 8);

        // Tiny feet
        g.fillStyle(0xff8a3d, 1);
        g.fillEllipse(cx - 9, 88, 12, 5);
        g.fillEllipse(cx + 9, 88, 12, 5);
        g.lineStyle(1.5, 0xb84d18, 1);
        g.strokeEllipse(cx - 9, 88, 12, 5);
        g.strokeEllipse(cx + 9, 88, 12, 5);

        // Body — small + chubby (smaller than head for chibi vibe)
        g.fillStyle(0x8896a6, 1);
        g.fillEllipse(cx, 70, 56, 42);
        // Belly
        g.fillStyle(0xc7d1dc, 1);
        g.fillEllipse(cx, 76, 40, 26);

        // Tail tuft
        g.fillStyle(0x6e7d8e, 1);
        g.fillTriangle(cx - 28, 64, cx - 14, 60, cx - 18, 78);

        // Head — disproportionately big for cuteness
        g.fillStyle(0x8896a6, 1);
        g.fillCircle(cx + 2, 36, 26);
        // Forehead highlight
        g.fillStyle(0xa8b4c2, 0.7);
        g.fillEllipse(cx - 4, 26, 26, 10);

        // Down fluff on top (baby feathers)
        g.fillStyle(0xc7d1dc, 1);
        g.fillCircle(cx - 8, 12, 4);
        g.fillCircle(cx + 1, 9, 4.5);
        g.fillCircle(cx + 10, 13, 4);

        // Tiny beak
        g.fillStyle(0xffb066, 1);
        g.fillTriangle(cx + 22, 32, cx + 36, 36, cx + 22, 40);
        g.lineStyle(1.5, 0x8a4a14, 1);
        g.lineBetween(cx + 22, 36, cx + 36, 36);

        // BIG cute eye
        g.fillStyle(0xffffff, 1);
        g.fillCircle(cx + 9, 34, 9);
        g.fillStyle(0x101418, 1);
        g.fillCircle(cx + 10, 35, 7);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(cx + 13, 32, 3);
        g.fillCircle(cx + 8, 38, 1.5);

        // Cheek blush
        g.fillStyle(0xff9f9f, 0.6);
        g.fillEllipse(cx + 5, 46, 12, 5);

        g.generateTexture('baby-pigeon', W, H);
        g.destroy();
    }

    // Small soft feather for the death-explosion particles. Tinted at runtime.
    makeFeatherTexture () {
        const g = this.add.graphics();
        const W = 16, H = 26;
        const cx = 8;

        // Vane (the soft part)
        g.fillStyle(0xffffff, 1);
        g.fillEllipse(cx, 14, 12, 20);
        // Inner shading
        g.fillStyle(0xcdd5de, 0.7);
        g.fillEllipse(cx + 1, 17, 8, 14);
        // Rachis (spine)
        g.lineStyle(1.5, 0x8a8f96, 0.85);
        g.lineBetween(cx, 3, cx, 23);
        // Tip darker
        g.fillStyle(0x8a8f96, 1);
        g.fillEllipse(cx, 23, 4, 3);

        g.generateTexture('feather', W, H);
        g.destroy();
    }

    // ---- Multi-part rig textures (used in Game scene only) ----

    // Per-variant body — silhouette comes from VARIANTS[id].shape so each pigeon
    // has its own profile (Anto's pear, Biscuit's dumpling, Bumble's sphere…).
    // Colors come from VARIANT_CFG so each body is drawn in its own palette.
    // No runtime tinting needed.
    // 220 x 220, body center at (110, 110).
    makeVariantBody (variantId) {
        const g = this.add.graphics();
        const shape = VARIANTS[variantId].shape;
        const cfg = VARIANT_CFG[variantId];
        // Canvas sized to fit the silhouette — Ryan's belly is wider than the
        // old fixed 220px texture, so compute extents from the shape.
        const xExt = Math.max(
            Math.abs(shape.belly[2]) + shape.belly[0] / 2,
            Math.abs(shape.upper[2]) + shape.upper[0] / 2,
            Math.abs(shape.tail1[0]), Math.abs(shape.tail1[2]), Math.abs(shape.tail1[4]),
            Math.abs(shape.tail2[0]), Math.abs(shape.tail2[2]), Math.abs(shape.tail2[4]),
        );
        const yExt = Math.max(
            Math.abs(shape.belly[3]) + shape.belly[1] / 2,
            Math.abs(shape.upper[3]) + shape.upper[1] / 2,
            Math.abs(shape.tail1[1]), Math.abs(shape.tail1[3]), Math.abs(shape.tail1[5]),
            Math.abs(shape.tail2[1]), Math.abs(shape.tail2[3]), Math.abs(shape.tail2[5]),
        );
        const margin = 12;
        const W = Math.max(220, Math.ceil((xExt + margin) * 2));
        const H = Math.max(220, Math.ceil((yExt + margin) * 2));
        const cx = W / 2, cy = H / 2;
        const body  = cfg.bodyColor || 0x8896a6;
        const belly = cfg.bellyColor || 0xc7d1dc;
        const tail  = cfg.tailColor || 0x5e6b7a;

        // Tail feathers (behind body) — drawn FIRST so body covers them
        const t1 = shape.tail1;
        const t2 = shape.tail2;
        g.fillStyle(tail, 1);
        g.fillTriangle(cx + t1[0], cy + t1[1], cx + t1[2], cy + t1[3], cx + t1[4], cy + t1[5]);
        g.fillStyle(this._lighten(tail, 1.18), 1);
        g.fillTriangle(cx + t2[0], cy + t2[1], cx + t2[2], cy + t2[3], cx + t2[4], cy + t2[5]);

        // Body shape (lower belly + upper chest)
        g.fillStyle(body, 1);
        g.fillEllipse(cx + shape.belly[2], cy + shape.belly[3], shape.belly[0], shape.belly[1]);
        g.fillEllipse(cx + shape.upper[2], cy + shape.upper[3], shape.upper[0], shape.upper[1]);

        // Belly highlight (lighter zone for that pillowy look)
        g.fillStyle(belly, 1);
        g.fillEllipse(cx + shape.hi[2],  cy + shape.hi[3],  shape.hi[0],  shape.hi[1]);
        g.fillStyle(this._lighten(belly, 1.10), 0.8);
        g.fillEllipse(cx + shape.hi2[2], cy + shape.hi2[3], shape.hi2[0], shape.hi2[1]);

        // Bee body stripes — only for the bumblebee variant
        if (cfg.bodyStripes) {
            g.fillStyle(0x3a2e14, 0.92);
            const stripeY = cy + shape.belly[3];
            const stripeH = shape.belly[1] * 0.7;
            for (const sx of [cx - shape.belly[0] * 0.30, cx + 6, cx + shape.belly[0] * 0.32]) {
                g.fillRect(sx - 8, stripeY - stripeH / 2, 16, stripeH);
            }
        }

        // Neck iridescence (only the classic-tone variants)
        if (shape.showNeck && shape.neck) {
            g.fillStyle(0x4f9c6e, 0.85);
            g.fillEllipse(cx + shape.neck[2], cy + shape.neck[3], shape.neck[0], shape.neck[1]);
            if (shape.neck2) {
                g.fillStyle(0x7a4fa0, 0.7);
                g.fillEllipse(cx + shape.neck2[2], cy + shape.neck2[3], shape.neck2[0], shape.neck2[1]);
            }
        }

        g.generateTexture(`pigeon-body-${variantId}`, W, H);
        g.destroy();
    }

    // Head only: face with beak, eye, cheek blush. 130 x 130, head center at (65, 65).
    makePigeonHeadTexture () {
        const g = this.add.graphics();
        const W = 130, H = 130;
        const cx = 55, cy = 65;

        // Head circle
        g.fillStyle(0x8896a6, 1);
        g.fillCircle(cx, cy, 50);

        // Forehead highlight
        g.fillStyle(0xa8b4c2, 0.7);
        g.fillEllipse(cx - 10, cy - 18, 50, 22);

        // Beak
        g.fillStyle(0xffb066, 1);
        g.fillTriangle(cx + 42, cy - 8, cx + 90, cy, cx + 42, cy + 12);
        g.fillStyle(0xe88a3a, 1);
        g.fillTriangle(cx + 42, cy, cx + 90, cy, cx + 42, cy + 12);
        g.lineStyle(2, 0x8a4a14, 1);
        g.lineBetween(cx + 42, cy, cx + 90, cy);

        // Eye
        g.fillStyle(0xffffff, 1);
        g.fillCircle(cx + 18, cy - 14, 11);
        g.fillStyle(0x101418, 1);
        g.fillCircle(cx + 20, cy - 12, 7);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(cx + 23, cy - 14, 2.5);

        // Cheek blush
        g.fillStyle(0xff9f9f, 0.55);
        g.fillEllipse(cx + 12, cy + 14, 24, 10);

        g.generateTexture('pigeon-head', W, H);
        g.destroy();
    }

    // Wing only: a curved feathered shape. The shoulder pivot is at (124, 28),
    // i.e., the right side of the texture. Wing body extends to the LEFT (toward
    // the tail end of the pigeon when at rest). Origin should be (124/140, 28/80).
    makePigeonWingTexture () {
        const g = this.add.graphics();
        const W = 140, H = 80;
        const ax = 124, ay = 28;

        // Main wing shape extending LEFT from anchor
        g.fillStyle(0x6c7a8a, 1);
        g.fillEllipse(ax - 56, ay + 16, 116, 62);

        // Inner shadow
        g.fillStyle(0x576676, 0.6);
        g.fillEllipse(ax - 60, ay + 22, 100, 40);

        const D2R = Math.PI / 180;
        // Feather arcs fanning from shoulder out toward the wing tip
        g.lineStyle(3, 0x3f4d5c, 0.85);
        for (const radius of [50, 38, 26]) {
            g.beginPath();
            g.arc(ax - 6, ay + 4, radius, 110 * D2R, 200 * D2R);
            g.strokePath();
        }
        // Primary feather tips along the back-bottom edge
        g.lineStyle(3, 0x3f4d5c, 0.85);
        g.lineBetween(ax - 60, ay + 40, ax - 75, ay + 50);
        g.lineBetween(ax - 80, ay + 36, ax - 95, ay + 46);
        g.lineBetween(ax - 96, ay + 28, ax - 110, ay + 36);

        // Highlight along upper edge
        g.fillStyle(0x9aa7b6, 0.5);
        g.fillEllipse(ax - 50, ay + 4, 90, 10);

        g.generateTexture('pigeon-wing', W, H);
        g.destroy();
    }

    // Single leg + foot. 24 x 56, hip pivot at (12, 4).
    makePigeonLegTexture () {
        const g = this.add.graphics();
        const W = 24, H = 56;

        // Leg shaft
        g.fillStyle(0xe96b2a, 1);
        g.fillRect(8, 4, 8, 38);
        // shaft outline
        g.lineStyle(2, 0xb84d18, 1);
        g.strokeRect(8, 4, 8, 38);

        // Foot
        g.fillStyle(0xff8a3d, 1);
        g.fillEllipse(12, 46, 22, 10);
        // foot outline + toes
        g.lineStyle(2, 0xb84d18, 1);
        g.strokeEllipse(12, 46, 22, 10);
        g.lineBetween(2, 48, 22, 48);

        g.generateTexture('pigeon-leg', W, H);
        g.destroy();
    }

    // A stack of three pancakes with butter and syrup.
    makePancakeTexture () {
        const g = this.add.graphics();
        const cx = 128;
        const cy = 132;

        // Plate shadow
        g.fillStyle(0x000000, 0.18);
        g.fillEllipse(cx, cy + 94, 210, 22);

        // --- Bottom pancake ---
        g.fillStyle(0xb47636, 1);
        g.fillEllipse(cx, cy + 70, 220, 56);
        g.fillStyle(0xe7b86b, 1);
        g.fillEllipse(cx, cy + 52, 220, 46);
        g.lineStyle(3, 0x8a5320, 1);
        g.strokeEllipse(cx, cy + 70, 220, 56);

        // --- Middle pancake ---
        g.fillStyle(0xb47636, 1);
        g.fillEllipse(cx, cy + 28, 208, 54);
        g.fillStyle(0xeebf75, 1);
        g.fillEllipse(cx, cy + 12, 208, 44);
        g.lineStyle(3, 0x8a5320, 1);
        g.strokeEllipse(cx, cy + 28, 208, 54);

        // --- Top pancake ---
        g.fillStyle(0xb47636, 1);
        g.fillEllipse(cx, cy - 14, 196, 52);
        g.fillStyle(0xf3c87e, 1);
        g.fillEllipse(cx, cy - 30, 196, 42);
        g.lineStyle(3, 0x8a5320, 1);
        g.strokeEllipse(cx, cy - 14, 196, 52);

        g.fillStyle(0xfde2af, 0.7);
        g.fillEllipse(cx - 20, cy - 38, 90, 12);

        // --- Maple syrup pool on top ---
        g.fillStyle(0x6b3a14, 1);
        g.fillEllipse(cx + 4, cy - 30, 150, 32);
        g.fillStyle(0x8b5520, 0.85);
        g.fillEllipse(cx - 14, cy - 36, 70, 10);

        // syrup drips
        g.fillStyle(0x6b3a14, 1);
        g.fillRect(cx - 70, cy - 24, 14, 36);
        g.fillCircle(cx - 63, cy + 14, 9);
        g.fillRect(cx + 54, cy - 22, 12, 30);
        g.fillCircle(cx + 60, cy + 10, 8);
        g.fillRect(cx - 8, cy - 18, 10, 22);
        g.fillCircle(cx - 3, cy + 6, 7);

        // --- Butter pat on top ---
        g.fillStyle(0x6b3a14, 0.4);
        g.fillRect(cx - 26, cy - 36, 52, 8);
        g.fillStyle(0xffe066, 1);
        g.fillRect(cx - 26, cy - 56, 52, 28);
        g.fillStyle(0xfff2a6, 1);
        g.fillRect(cx - 26, cy - 56, 52, 10);
        g.lineStyle(2, 0xc89a14, 1);
        g.strokeRect(cx - 26, cy - 56, 52, 28);
        g.fillStyle(0xfff7c8, 0.8);
        g.fillRect(cx - 22, cy - 54, 18, 5);

        g.generateTexture('pancake', 256, 256);
        g.destroy();
    }

    // ---- Hazardous foods (deal damage when touched) ----

    makeAvocadoTexture () {
        const g = this.add.graphics();
        const W = 64, H = 84;
        const cx = 32, cy = 46;

        // Drop shadow
        g.fillStyle(0x000000, 0.20);
        g.fillEllipse(cx, cy + 30, 46, 8);

        // Outer skin (dark green)
        g.fillStyle(0x4a6b28, 1);
        g.fillEllipse(cx, cy, 46, 60);
        // Skin highlight
        g.fillStyle(0x5e8233, 1);
        g.fillEllipse(cx - 3, cy - 4, 38, 50);

        // Inner flesh (halved view, lighter green)
        g.fillStyle(0xd6e58c, 1);
        g.fillEllipse(cx, cy, 30, 44);
        // Flesh shadow ring
        g.fillStyle(0xb8c87a, 0.7);
        g.fillEllipse(cx, cy, 22, 32);

        // Brown pit
        g.fillStyle(0x6b3a14, 1);
        g.fillCircle(cx, cy + 4, 10);
        g.fillStyle(0x8a5520, 1);
        g.fillCircle(cx - 2, cy + 2, 7);
        // Pit highlight
        g.fillStyle(0xb47636, 0.5);
        g.fillCircle(cx - 4, cy, 3);

        // Stem
        g.fillStyle(0x4a3122, 1);
        g.fillRect(cx - 2, cy - 32, 4, 6);

        g.generateTexture('avocado', W, H);
        g.destroy();
    }

    makeBeetTexture () {
        const g = this.add.graphics();
        const W = 64, H = 92;
        const cx = 32, cy = 56;

        // Drop shadow
        g.fillStyle(0x000000, 0.20);
        g.fillEllipse(cx, cy + 30, 44, 7);

        // Beet body (deep magenta)
        g.fillStyle(0x6b1a3c, 1);
        g.fillEllipse(cx, cy, 42, 42);
        // Highlight
        g.fillStyle(0x8b2a4c, 1);
        g.fillEllipse(cx - 5, cy - 5, 28, 24);
        // Specular dot
        g.fillStyle(0xc9588a, 0.6);
        g.fillEllipse(cx - 8, cy - 9, 8, 5);

        // Tap root pointing down
        g.fillStyle(0x4a0a26, 1);
        g.fillTriangle(cx - 5, cy + 18, cx + 5, cy + 18, cx, cy + 32);

        // Leaves (overlapping triangles, different greens for depth)
        g.fillStyle(0x4a7d2c, 1);
        g.fillTriangle(cx - 16, cy - 18, cx - 4, cy - 32, cx - 4, cy - 14);
        g.fillStyle(0x6fa54a, 1);
        g.fillTriangle(cx + 2, cy - 14, cx + 2, cy - 34, cx + 16, cy - 18);
        g.fillStyle(0x5a8d3c, 1);
        g.fillTriangle(cx - 5, cy - 14, cx - 1, cy - 36, cx + 5, cy - 14);
        // Leaf veins
        g.lineStyle(1.5, 0x3a6020, 0.8);
        g.lineBetween(cx - 9, cy - 22, cx - 4, cy - 14);
        g.lineBetween(cx + 9, cy - 22, cx + 4, cy - 14);

        g.generateTexture('beet', W, H);
        g.destroy();
    }

    makeEggTexture () {
        const g = this.add.graphics();
        const W = 56, H = 72;
        const cx = 28, cy = 38;

        // Drop shadow
        g.fillStyle(0x000000, 0.20);
        g.fillEllipse(cx, cy + 28, 36, 6);

        // Egg shell
        g.fillStyle(0xf6e8d1, 1);
        g.fillEllipse(cx, cy, 38, 52);

        // Highlight
        g.fillStyle(0xffffff, 0.55);
        g.fillEllipse(cx - 7, cy - 10, 14, 22);
        g.fillStyle(0xffffff, 0.8);
        g.fillEllipse(cx - 9, cy - 14, 5, 8);

        // Speckles (deterministic-ish so the texture looks consistent)
        const specks = [
            [cx + 4, cy - 6, 1.4], [cx - 6, cy + 4, 1.0], [cx + 8, cy + 4, 1.1],
            [cx - 2, cy + 12, 0.9], [cx + 2, cy + 16, 1.3], [cx - 4, cy - 14, 0.8],
            [cx + 6, cy + 12, 0.7], [cx + 0, cy - 2, 1.0]
        ];
        g.fillStyle(0x8a7150, 0.7);
        for (const [sx, sy, sr] of specks) g.fillCircle(sx, sy, sr);

        // Outline
        g.lineStyle(1.5, 0xb09c70, 0.7);
        g.strokeEllipse(cx, cy, 38, 52);

        g.generateTexture('egg', W, H);
        g.destroy();
    }

    // ---- Variant head textures (in-game) ----
    // Uniform 140x180 layout, head circle at (60, 110). Accessory area is the
    // top half (y ≈ 0..70). createPigeon uses HEAD_ORIGIN = (60/140, 110/180).
    makeVariantHead (variantId) {
        const g = this.add.graphics();
        const W = 140, H = 180;
        const cx = 60, cy = 110;
        const cfg = VARIANT_CFG[variantId];

        // Head circle
        g.fillStyle(cfg.headColor, 1);
        g.fillCircle(cx, cy, 50);
        // Forehead highlight
        g.fillStyle(cfg.headHighlight, 0.7);
        g.fillEllipse(cx - 10, cy - 18, 50, 22);

        // Beak
        g.fillStyle(cfg.beakColor, 1);
        g.fillTriangle(cx + 42, cy - 8, cx + 90, cy, cx + 42, cy + 12);
        g.fillStyle(cfg.beakDark, 1);
        g.fillTriangle(cx + 42, cy, cx + 90, cy, cx + 42, cy + 12);
        g.lineStyle(2, 0x8a4a14, 1);
        g.lineBetween(cx + 42, cy, cx + 90, cy);

        // Eye
        g.fillStyle(0xffffff, 1);
        g.fillCircle(cx + 18, cy - 14, 11);
        g.fillStyle(0x101418, 1);
        g.fillCircle(cx + 20, cy - 12, 7);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(cx + 23, cy - 14, 2.5);

        // Cheek blush
        g.fillStyle(cfg.cheekColor, 0.55);
        g.fillEllipse(cx + 12, cy + 14, 24, 10);

        // Variant accessory
        cfg.drawAccessory(g, cx, cy);

        g.generateTexture(`pigeon-head-${variantId}`, W, H);
        g.destroy();
    }

    // ---- Variant static avatars (menu / picker / level cards) ----
    // Drives the body silhouette from VARIANTS[id].shape so each pigeon has its
    // own profile in the picker. Head sits just above the upper-body but is
    // floor-clamped so accessories (chef hats, wizard cones) stay on canvas
    // for taller bodies like Merlin's.
    makeVariantStatic (variantId) {
        const g = this.add.graphics();
        const W = 256, H = 256;
        const cx = 128;
        const cy = 170;
        const SH = 0.82;
        const HEAD_FLOOR = 85;
        const shape = VARIANTS[variantId].shape;
        const cfg = VARIANT_CFG[variantId];
        const body = cfg.bodyColor || 0x8896a6;
        const belly = cfg.bellyColor || 0xc7d1dc;
        const tail = cfg.tailColor || 0x5e6b7a;
        const wingDark = cfg.wingColor || 0x6c7a8a;

        // Drop shadow — width tracks belly width
        g.fillStyle(0x000000, 0.18);
        g.fillEllipse(cx, cy + (shape.belly[3] + shape.belly[1] / 2) * SH + 6, shape.belly[0] * 0.9 * SH, 22);

        // Tail feathers (behind body)
        const t1 = shape.tail1, t2 = shape.tail2;
        g.fillStyle(tail, 1);
        g.fillTriangle(cx + t1[0]*SH, cy + t1[1]*SH, cx + t1[2]*SH, cy + t1[3]*SH, cx + t1[4]*SH, cy + t1[5]*SH);
        g.fillStyle(this._lighten(tail, 1.18), 1);
        g.fillTriangle(cx + t2[0]*SH, cy + t2[1]*SH, cx + t2[2]*SH, cy + t2[3]*SH, cx + t2[4]*SH, cy + t2[5]*SH);

        // Feet
        const footY = cy + (shape.belly[3] + shape.belly[1] / 2) * SH - 4;
        g.fillStyle(0xe96b2a, 1);
        g.fillRect(cx - 22, footY, 8, 18);
        g.fillRect(cx + 16, footY, 8, 18);
        g.fillStyle(0xff8a3d, 1);
        g.fillEllipse(cx - 18, footY + 18, 28, 9);
        g.fillEllipse(cx + 22, footY + 18, 28, 9);
        g.lineStyle(2, 0xb84d18, 1);
        g.lineBetween(cx - 28, footY + 18, cx - 8, footY + 18);
        g.lineBetween(cx + 12, footY + 18, cx + 32, footY + 18);

        // Body — driven by shape config
        g.fillStyle(body, 1);
        g.fillEllipse(cx + shape.belly[2]*SH, cy + shape.belly[3]*SH, shape.belly[0]*SH, shape.belly[1]*SH);
        g.fillEllipse(cx + shape.upper[2]*SH, cy + shape.upper[3]*SH, shape.upper[0]*SH, shape.upper[1]*SH);

        // Belly highlight
        g.fillStyle(belly, 1);
        g.fillEllipse(cx + shape.hi[2]*SH, cy + shape.hi[3]*SH, shape.hi[0]*SH, shape.hi[1]*SH);
        g.fillStyle(this._lighten(belly, 1.10), 0.7);
        g.fillEllipse(cx + shape.hi2[2]*SH, cy + shape.hi2[3]*SH, shape.hi2[0]*SH, shape.hi2[1]*SH);

        // Bee body stripes — over body, before wing
        if (cfg.bodyStripes) {
            g.fillStyle(0x3a2e14, 0.92);
            const stripeY = cy + shape.belly[3]*SH;
            const stripeH = shape.belly[1] * SH * 0.7;
            for (const sx of [cx - shape.belly[0]*SH * 0.30, cx + 6, cx + shape.belly[0]*SH * 0.32]) {
                g.fillRect(sx - 8, stripeY - stripeH/2, 16, stripeH);
            }
        }

        // Wing — positioned over the body upper area. shape.wingScale lets a
        // variant (Anto) have noticeably smaller wings than the default rig.
        const wingScale = shape.wingScale ?? 1;
        const wingCx = cx + shape.upper[2]*SH - 18;
        const wingCy = cy + (shape.upper[3] + shape.upper[1] * 0.25) * SH;
        const wingW = shape.upper[0] * 0.85 * SH * wingScale;
        const wingH = shape.upper[1] * 0.75 * SH * wingScale;
        g.fillStyle(wingDark, 1);
        g.fillEllipse(wingCx, wingCy, wingW, wingH);
        const D2R = Math.PI / 180;
        g.lineStyle(3, this._darken(wingDark, 0.7), 0.7);
        for (const r of [wingW * 0.43, wingW * 0.32, wingW * 0.22]) {
            g.beginPath();
            g.arc(wingCx - 24, wingCy - 8, r, -20 * D2R, 60 * D2R);
            g.strokePath();
        }

        // Neck iridescence (only for variants whose shape opts in)
        if (shape.showNeck && cfg.showIridescence !== false) {
            g.fillStyle(0x4f9c6e, 0.85);
            g.fillEllipse(cx + shape.neck[2]*SH, cy + shape.neck[3]*SH, shape.neck[0]*SH, shape.neck[1]*SH);
            if (shape.neck2) {
                g.fillStyle(0x7a4fa0, 0.7);
                g.fillEllipse(cx + shape.neck2[2]*SH, cy + shape.neck2[3]*SH, shape.neck2[0]*SH, shape.neck2[1]*SH);
            }
        }

        // Head — placed just above upper-body top edge, but floor-clamped so
        // even tall variants keep accessories on-canvas.
        const upperTop = shape.upper[3] - shape.upper[1] / 2;   // relative to body center
        const headCx = cx + 48;
        const headCy = Math.max(HEAD_FLOOR, cy + upperTop*SH - 8);
        const headR = 50;
        g.fillStyle(cfg.headColor, 1);
        g.fillCircle(headCx, headCy, headR);
        g.fillStyle(cfg.headHighlight, 0.7);
        g.fillEllipse(headCx - 12, headCy - 18, 48, 22);

        // Beak
        g.fillStyle(cfg.beakColor, 1);
        g.fillTriangle(headCx + 42, headCy - 4, headCx + 88, headCy + 4, headCx + 42, headCy + 14);
        g.fillStyle(cfg.beakDark, 1);
        g.fillTriangle(headCx + 42, headCy + 4, headCx + 88, headCy + 4, headCx + 42, headCy + 14);
        g.lineStyle(2, 0x8a4a14, 1);
        g.lineBetween(headCx + 42, headCy + 4, headCx + 88, headCy + 4);

        // Eye
        g.fillStyle(0xffffff, 1);
        g.fillCircle(headCx + 22, headCy - 10, 11);
        g.fillStyle(0x101418, 1);
        g.fillCircle(headCx + 24, headCy - 8, 7);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(headCx + 27, headCy - 10, 2.5);

        // Cheek blush
        g.fillStyle(cfg.cheekColor, 0.55);
        g.fillEllipse(headCx + 10, headCy + 16, 22, 9);

        // Variant accessory (positioned relative to head circle)
        cfg.drawAccessory(g, headCx, headCy);

        g.generateTexture(`pigeon-${variantId}`, W, H);
        g.destroy();
    }

    _lighten (color, factor) {
        const r = Math.min(255, Math.round(((color >> 16) & 0xff) * factor));
        const gg = Math.min(255, Math.round(((color >> 8) & 0xff) * factor));
        const b = Math.min(255, Math.round((color & 0xff) * factor));
        return (r << 16) | (gg << 8) | b;
    }

    _darken (color, factor) {
        const r = Math.round(((color >> 16) & 0xff) * factor);
        const gg = Math.round(((color >> 8) & 0xff) * factor);
        const b = Math.round((color & 0xff) * factor);
        return (r << 16) | (gg << 8) | b;
    }
}

// Variant configs (colors + accessory drawers)
const VARIANT_CFG = {
    classic: {
        bodyColor: 0x8896a6, bellyColor: 0xc7d1dc, tailColor: 0x5e6b7a, wingColor: 0x6c7a8a,
        headColor: 0x8896a6, headHighlight: 0xa8b4c2,
        beakColor: 0xffb066, beakDark: 0xe88a3a,
        cheekColor: 0xff9f9f,
        drawAccessory: () => {}
    },
    pink: {
        bodyColor: 0xffb6cf, bellyColor: 0xffe0eb, tailColor: 0xd88aa3, wingColor: 0xe890ad,
        headColor: 0xff9fbf, headHighlight: 0xffd6e6,
        beakColor: 0xff8aa8, beakDark: 0xe85e88,
        cheekColor: 0xff5e8e,
        showIridescence: false,
        drawAccessory: (g, cx, cy) => {
            // Tiara — tiny gold band with three pearls
            const ty = cy - 50;
            g.fillStyle(0xffd166, 1);
            g.fillRect(cx - 22, ty + 6, 44, 5);
            g.lineStyle(1.5, 0xb88822, 1);
            g.strokeRect(cx - 22, ty + 6, 44, 5);
            g.fillStyle(0xffe7a8, 1);
            g.fillCircle(cx, ty - 2, 6);
            g.fillCircle(cx - 18, ty + 4, 4);
            g.fillCircle(cx + 18, ty + 4, 4);
            g.fillStyle(0xfff5d3, 0.9);
            g.fillCircle(cx - 1, ty - 4, 2);
        }
    },
    chef: {
        bodyColor: 0x8896a6, bellyColor: 0xe9eff6, tailColor: 0x5e6b7a, wingColor: 0x6c7a8a,
        headColor: 0x8896a6, headHighlight: 0xa8b4c2,
        beakColor: 0xffb066, beakDark: 0xe88a3a,
        cheekColor: 0xff9f9f,
        drawAccessory: (g, cx, cy) => {
            // Chef hat
            const hy = cy - 60;
            g.fillStyle(0xffffff, 1);
            // Band (cylinder)
            g.fillRect(cx - 22, hy + 14, 44, 18);
            // Three puffs on top
            g.fillEllipse(cx, hy - 6, 30, 26);
            g.fillEllipse(cx - 16, hy + 6, 22, 20);
            g.fillEllipse(cx + 16, hy + 6, 22, 20);
            // Soft outline
            g.lineStyle(1.5, 0xb6b6b6, 0.85);
            g.strokeEllipse(cx, hy - 6, 30, 26);
            g.strokeEllipse(cx - 16, hy + 6, 22, 20);
            g.strokeEllipse(cx + 16, hy + 6, 22, 20);
            g.strokeRect(cx - 22, hy + 14, 44, 18);
            // Mustache (curly)
            g.lineStyle(3, 0x4a3122, 1);
            g.beginPath();
            g.moveTo(cx + 4, cy + 8);
            g.lineTo(cx + 12, cy + 4);
            g.lineTo(cx + 20, cy + 9);
            g.lineTo(cx + 26, cy + 4);
            g.strokePath();
        }
    },
    punk: {
        bodyColor: 0x6e7480, bellyColor: 0xa6acb5, tailColor: 0x4a4f59, wingColor: 0x4a4f59,
        headColor: 0x6e7480, headHighlight: 0x8e94a0,
        beakColor: 0xffb066, beakDark: 0xe88a3a,
        cheekColor: 0xff7f7f,
        drawAccessory: (g, cx, cy) => {
            // Mohawk spikes (alternating colors, alternating heights)
            const colors = [0xff3399, 0xffff44, 0x33ff99, 0xff7733, 0xff66cc];
            for (let i = 0; i < 8; i++) {
                const t = i / 7;
                const x = cx - 24 + t * 48;
                const baseY = cy - 50;
                const tipY = baseY - (12 + (i % 2) * 8);
                g.fillStyle(colors[i % colors.length], 1);
                g.fillTriangle(x - 4, baseY, x + 4, baseY, x, tipY);
            }
            // Sunglasses bar over the eye
            g.fillStyle(0x101418, 1);
            g.fillRect(cx + 6, cy - 22, 32, 14);
            g.fillStyle(0x2a2e36, 1);
            g.fillRect(cx + 6, cy - 12, 32, 2);
            // Lens reflection slashes
            g.lineStyle(1.5, 0xffffff, 0.8);
            g.lineBetween(cx + 11, cy - 18, cx + 14, cy - 14);
            g.lineBetween(cx + 26, cy - 18, cx + 29, cy - 14);
            // Tiny earring
            g.fillStyle(0xffd166, 1);
            g.fillCircle(cx - 30, cy + 18, 2.4);
        }
    },
    astro: {
        bodyColor: 0xeaf2ff, bellyColor: 0xfafdff, tailColor: 0xb6c4d8, wingColor: 0xc9d6e8,
        headColor: 0x8896a6, headHighlight: 0xa8b4c2,
        beakColor: 0xffb066, beakDark: 0xe88a3a,
        cheekColor: 0xff9f9f,
        showIridescence: false,
        drawAccessory: (g, cx, cy) => {
            // Helmet bubble (subtle blue tint, big enough to surround head)
            g.fillStyle(0x9ed6ff, 0.20);
            g.fillCircle(cx, cy, 60);
            // Helmet rim
            g.lineStyle(3, 0xc0c8d0, 0.85);
            g.strokeCircle(cx, cy, 60);
            // Specular reflection arc (top-left)
            g.lineStyle(2.5, 0xffffff, 0.75);
            g.beginPath();
            g.arc(cx, cy, 54, -Math.PI * 0.85, -Math.PI * 0.45);
            g.strokePath();
            // Antenna with red light on top
            g.lineStyle(2, 0xc0c8d0, 1);
            g.lineBetween(cx, cy - 60, cx, cy - 76);
            g.fillStyle(0xff4444, 1);
            g.fillCircle(cx, cy - 78, 3);
        }
    },
    cowboy: {
        bodyColor: 0xd6a878, bellyColor: 0xead0a8, tailColor: 0x8a5e2a, wingColor: 0xa8794a,
        headColor: 0xd6a878, headHighlight: 0xe8c298,
        beakColor: 0xffb066, beakDark: 0xe88a3a,
        cheekColor: 0xff9f9f,
        showIridescence: false,
        drawAccessory: (g, cx, cy) => {
            // Cowboy hat — wide curved brim + crown with a band
            const hy = cy - 50;
            // Brim (wide ellipse)
            g.fillStyle(0x6b4422, 1);
            g.fillEllipse(cx, hy + 8, 86, 14);
            g.fillStyle(0x8a5a2e, 1);
            g.fillEllipse(cx, hy + 5, 86, 12);
            // Brim outline
            g.lineStyle(1.5, 0x4a2e14, 1);
            g.strokeEllipse(cx, hy + 8, 86, 14);
            // Crown (slightly pinched at top)
            g.fillStyle(0x6b4422, 1);
            g.fillRoundedRect(cx - 18, hy - 18, 36, 26, 6);
            g.fillStyle(0x8a5a2e, 1);
            g.fillRoundedRect(cx - 16, hy - 16, 32, 22, 5);
            // Crown crease (top dent)
            g.fillStyle(0x4a2e14, 0.5);
            g.fillEllipse(cx, hy - 16, 16, 4);
            // Hat band
            g.fillStyle(0xc8a050, 1);
            g.fillRect(cx - 18, hy + 0, 36, 4);
            g.lineStyle(1, 0x8a6822, 1);
            g.strokeRect(cx - 18, hy + 0, 36, 4);
            // Tiny star buckle on band
            g.fillStyle(0xfff2a8, 1);
            g.fillCircle(cx + 12, hy + 2, 2);
            // Mustache (handlebar)
            g.lineStyle(3, 0x4a2e14, 1);
            g.beginPath();
            g.moveTo(cx + 6, cy + 6);
            g.lineTo(cx + 14, cy + 10);
            g.lineTo(cx + 22, cy + 6);
            g.lineTo(cx + 30, cy + 10);
            g.strokePath();
        }
    },
    wizard: {
        bodyColor: 0xa48ad0, bellyColor: 0xd9c8ee, tailColor: 0x5a3f8a, wingColor: 0x7d5dba,
        headColor: 0xa48ad0, headHighlight: 0xc4b0e2,
        beakColor: 0xffb066, beakDark: 0xe88a3a,
        cheekColor: 0xffa5b8,
        showIridescence: false,
        drawAccessory: (g, cx, cy) => {
            // Pointy starry wizard hat (compact so it stays on canvas in the
            // small static-avatar / picker frames)
            const baseY = cy - 38;
            const tipX = cx - 4;
            const tipY = cy - 76;
            // Hat brim
            g.fillStyle(0x2a1f5a, 1);
            g.fillEllipse(cx, baseY + 4, 64, 10);
            // Cone body
            g.fillStyle(0x3a2e7a, 1);
            g.fillTriangle(cx - 26, baseY, cx + 26, baseY, tipX, tipY);
            // Inner highlight (left edge)
            g.fillStyle(0x5a4ea0, 1);
            g.fillTriangle(cx - 24, baseY - 2, cx - 6, baseY - 2, tipX - 2, tipY + 4);
            // Hat outline
            g.lineStyle(2, 0x1a124a, 1);
            g.beginPath();
            g.moveTo(cx - 26, baseY);
            g.lineTo(tipX, tipY);
            g.lineTo(cx + 26, baseY);
            g.strokePath();
            // Brim outline
            g.lineStyle(1.5, 0x1a124a, 1);
            g.strokeEllipse(cx, baseY + 4, 64, 10);
            // Stars sprinkled on the hat
            const stars = [
                [cx - 8, baseY - 6, 2.5], [cx + 6, baseY - 14, 2],
                [cx - 3, baseY - 22, 2.3], [cx - 10, baseY - 30, 1.8]
            ];
            for (const [sx, sy, sr] of stars) {
                g.fillStyle(0xffe066, 1);
                g.fillCircle(sx, sy, sr);
                g.fillStyle(0xfff5c8, 0.9);
                g.fillCircle(sx - 0.6, sy - 0.6, sr * 0.45);
            }
            // Tiny gold star on tip
            g.fillStyle(0xffd166, 1);
            g.fillCircle(tipX, tipY, 2.6);
            // Little white wizard beard under the beak
            g.fillStyle(0xffffff, 0.95);
            g.fillTriangle(cx + 36, cy + 12, cx + 56, cy + 8, cx + 50, cy + 30);
            g.fillStyle(0xe6e6f0, 0.9);
            g.fillCircle(cx + 44, cy + 16, 6);
            g.fillCircle(cx + 50, cy + 22, 5);
        }
    },
    ninja: {
        bodyColor: 0x484e58, bellyColor: 0x6e7480, tailColor: 0x2a2e36, wingColor: 0x2a2e36,
        headColor: 0x484e58, headHighlight: 0x6a7080,
        beakColor: 0xffb066, beakDark: 0xe88a3a,
        cheekColor: 0xff7a7a,
        showIridescence: false,
        drawAccessory: (g, cx, cy) => {
            // Red ninja headband across the forehead
            const by = cy - 28;
            g.fillStyle(0xc8313a, 1);
            g.fillRect(cx - 32, by, 64, 10);
            // Highlight stripe
            g.fillStyle(0xe85a64, 1);
            g.fillRect(cx - 32, by + 1, 64, 2);
            g.lineStyle(1.5, 0x7a1a22, 1);
            g.strokeRect(cx - 32, by, 64, 10);
            // Knot on left side (away from beak)
            g.fillStyle(0xc8313a, 1);
            g.fillRect(cx - 36, by + 2, 6, 6);
            // Two trailing ribbon ends behind the head
            g.fillStyle(0xc8313a, 1);
            g.fillTriangle(cx - 38, by + 4, cx - 56, by + 12, cx - 50, by + 20);
            g.fillTriangle(cx - 38, by + 6, cx - 60, by + 22, cx - 48, by + 26);
            g.lineStyle(1.5, 0x7a1a22, 0.8);
            g.lineBetween(cx - 38, by + 4, cx - 56, by + 12);
            g.lineBetween(cx - 38, by + 6, cx - 60, by + 22);
            // Tiny gold rising-sun emblem in center
            g.fillStyle(0xffd166, 1);
            g.fillCircle(cx, by + 5, 2.4);
            // Eye mask hint — a thin black band crossing over the eye
            g.fillStyle(0x101418, 0.78);
            g.fillRect(cx + 4, cy - 18, 32, 8);
        }
    },
    bee: {
        bodyColor: 0xffd33a, bellyColor: 0xffeb88, tailColor: 0x6b4e0e, wingColor: 0xc9a428,
        headColor: 0xffd33a, headHighlight: 0xffeb88,
        beakColor: 0xffb066, beakDark: 0xe88a3a,
        cheekColor: 0xff7a9f,
        showIridescence: false,
        bodyStripes: true,
        drawAccessory: (g, cx, cy) => {
            // Antennae — two thin curved stalks with little bobbles
            g.lineStyle(2.5, 0x3a2e14, 1);
            // Left antenna
            g.beginPath();
            g.moveTo(cx - 10, cy - 46);
            g.lineTo(cx - 16, cy - 62);
            g.lineTo(cx - 22, cy - 70);
            g.strokePath();
            // Right antenna
            g.beginPath();
            g.moveTo(cx + 6, cy - 48);
            g.lineTo(cx + 12, cy - 64);
            g.lineTo(cx + 18, cy - 72);
            g.strokePath();
            // Bobbles
            g.fillStyle(0x3a2e14, 1);
            g.fillCircle(cx - 22, cy - 70, 4);
            g.fillCircle(cx + 18, cy - 72, 4);
            // Glossy highlights on bobbles
            g.fillStyle(0xc9a428, 1);
            g.fillCircle(cx - 23, cy - 71, 1.5);
            g.fillCircle(cx + 17, cy - 73, 1.5);
            // Tiny black stripe across forehead (bee-ish marking)
            g.fillStyle(0x3a2e14, 0.85);
            g.fillEllipse(cx - 6, cy - 30, 30, 6);
        }
    },
    ryan: {
        // A regal-but-suspect look. Warm cream body, gold accents, blushy.
        bodyColor: 0xf3d99a, bellyColor: 0xfff0c8, tailColor: 0xa68040, wingColor: 0xc59a40,
        headColor: 0xf3d99a, headHighlight: 0xfff0c8,
        beakColor: 0xffb066, beakDark: 0xe88a3a,
        cheekColor: 0xff7a9f,
        showIridescence: false,
        drawAccessory: (g, cx, cy) => {
            // Lopsided crown — golden band with bent middle spike, mismatched
            // gems, and a "$5 FAKE" price tag dangling off the side.
            const by = cy - 46;          // crown band top
            // Tilt the whole crown slightly clockwise to sell the askew vibe.
            const tilt = 0.10;            // radians (~6°)
            const ca = Math.cos(tilt), sa = Math.sin(tilt);
            const at = (px, py) => [cx + px*ca - py*sa, cy + px*sa + py*ca - 50];
            // Crown band (gold) — a parallelogram via 4 transformed corners
            const c1 = at(-26, 4), c2 = at(26, 4), c3 = at(26, 14), c4 = at(-26, 14);
            g.fillStyle(0xffd166, 1);
            g.fillTriangle(c1[0], c1[1], c2[0], c2[1], c3[0], c3[1]);
            g.fillTriangle(c1[0], c1[1], c3[0], c3[1], c4[0], c4[1]);
            g.lineStyle(2, 0xb88822, 1);
            g.beginPath();
            g.moveTo(c1[0], c1[1]); g.lineTo(c2[0], c2[1]);
            g.lineTo(c3[0], c3[1]); g.lineTo(c4[0], c4[1]);
            g.closePath();
            g.strokePath();
            // Highlight stripe along the top of the band
            g.fillStyle(0xfff0a8, 0.85);
            const h1 = at(-26, 4), h2 = at(26, 4), h3 = at(26, 7), h4 = at(-26, 7);
            g.fillTriangle(h1[0], h1[1], h2[0], h2[1], h3[0], h3[1]);
            g.fillTriangle(h1[0], h1[1], h3[0], h3[1], h4[0], h4[1]);

            // Three spikes — middle one BENT to the side (the "not true king" tell)
            g.fillStyle(0xffd166, 1);
            // Left spike (straight)
            const lL = at(-22, 4), lR = at(-12, 4), lT = at(-17, -14);
            g.fillTriangle(lL[0], lL[1], lR[0], lR[1], lT[0], lT[1]);
            // Middle spike — base is centered, tip is yanked to the right ("FALLING" over)
            const mL = at(-5, 4), mR = at(5, 4), mT = at(14, -12);
            g.fillTriangle(mL[0], mL[1], mR[0], mR[1], mT[0], mT[1]);
            // Right spike (straight)
            const rL = at(13, 4), rR = at(23, 4), rT = at(18, -14);
            g.fillTriangle(rL[0], rL[1], rR[0], rR[1], rT[0], rT[1]);
            // Spike outlines
            g.lineStyle(1.5, 0xb88822, 1);
            g.beginPath();
            g.moveTo(lL[0], lL[1]); g.lineTo(lT[0], lT[1]); g.lineTo(lR[0], lR[1]); g.closePath();
            g.moveTo(mL[0], mL[1]); g.lineTo(mT[0], mT[1]); g.lineTo(mR[0], mR[1]); g.closePath();
            g.moveTo(rL[0], rL[1]); g.lineTo(rT[0], rT[1]); g.lineTo(rR[0], rR[1]); g.closePath();
            g.strokePath();

            // Mismatched "gems" — left one is a real purple gem, right one is
            // an empty socket where a gem fell out (just dark wood underneath).
            const g1 = at(-18, 8);
            g.fillStyle(0x8a4ed8, 1);
            g.fillCircle(g1[0], g1[1], 2.6);
            g.fillStyle(0xc9a4f0, 0.9);
            g.fillCircle(g1[0] - 0.5, g1[1] - 0.5, 1.0);
            // Empty socket (looks like a dark hole)
            const g2 = at(16, 8);
            g.fillStyle(0x4a3122, 1);
            g.fillCircle(g2[0], g2[1], 2.4);

            // Tiny price tag dangling off the right side ("$5 — FAKE!")
            const tagAnchor = at(28, 10);
            const tagBody = at(36, 24);
            g.lineStyle(1.5, 0xff5544, 1);
            g.lineBetween(tagAnchor[0], tagAnchor[1], tagBody[0], tagBody[1]);
            g.fillStyle(0xfff5e1, 1);
            g.fillRect(tagBody[0] - 2, tagBody[1] - 2, 18, 9);
            g.lineStyle(1, 0x8a4a14, 1);
            g.strokeRect(tagBody[0] - 2, tagBody[1] - 2, 18, 9);
            // String hole punch
            g.fillStyle(0x4a3122, 1);
            g.fillCircle(tagBody[0] - 0.5, tagBody[1] + 2.5, 0.7);

            // Tiny "K?" doodle on the forehead (suspicious authenticity mark)
            g.fillStyle(0x8a5a2e, 0.55);
            g.fillCircle(cx - 4, cy - 26, 2);
        }
    }
};
