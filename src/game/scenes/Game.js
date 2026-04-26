import { Scene } from 'phaser';
import { LEVELS } from '../data/levels';
import { SFX, initAudio, isMuted, setMuted } from '../audio';
import { saveProgress, loadVariant } from '../progress';
import { VARIANTS, HEAD_ORIGIN, headTextureKey, bodyTextureKey } from '../variants';

export class Game extends Scene
{
    constructor () {
        super('Game');
    }

    init (data) {
        this.levelIndex = data?.levelIndex ?? 0;
        this.level = LEVELS[this.levelIndex];
    }

    create () {
        initAudio();
        // "Pigeon game start" voice clip — short delay so it doesn't clip the
        // scene transition fade.
        this.time.delayedCall(120, () => SFX.gameStart());
        // Idle voice clip plays after this many seconds of standing still.
        this.idleTime = 0;
        const lv = this.level;

        // World + camera. On portrait/mobile the canvas is much taller than
        // wide; we reserve the bottom strip for the touch joystick + jump
        // button so they don't sit on top of the gameplay. `viewH` is the
        // height of the actual game view above the control bar.
        const camW = this.cameras.main.width;
        const camH = this.cameras.main.height;
        this.controlBarH = camH > camW ? 240 : 0;
        this.viewH = camH - this.controlBarH;

        // If the view is taller than the world (e.g. mobile portrait on a
        // horizontal level), pad sky above so the world sits at the bottom of
        // the view rather than floating in sky. Bounds height is extended by
        // controlBarH so that when the camera reaches the bottom of a tall
        // world, the world's lowest content lines up with the top of the bar
        // (rather than disappearing behind it).
        this.matter.world.setBounds(0, -200, lv.worldWidth, lv.worldHeight + 600);
        const padTop = Math.max(0, this.viewH - lv.worldHeight);
        this.cameras.main.setBounds(
            0,
            -padTop,
            lv.worldWidth,
            Math.max(this.viewH, lv.worldHeight) + this.controlBarH
        );
        this.cameras.main.setBackgroundColor(0xb8e1f7);

        // Background sky decorations
        this.createSky();

        // Static platforms (grass crown + dirt/soil body + small pebbles)
        this.grassBlades = [];
        const bladeColors = [0x6fa54a, 0x7eb35a, 0x8fbf5c, 0x5d8f3d, 0x9ccc6e];
        for (const p of lv.platforms) {
            this.matter.add.rectangle(p.x, p.y, p.w, p.h, {
                isStatic: true, friction: 0.6, label: 'ground'
            });
            const left = p.x - p.w / 2;
            const top = p.y - p.h / 2;
            const grassH = 14;
            const pg = this.add.graphics().setDepth(-3);
            // Soil body
            pg.fillStyle(0x6b4a2e, 1);
            pg.fillRect(left, top + grassH, p.w, p.h - grassH);
            // Soil shadow underneath grass
            pg.fillStyle(0x8a6840, 0.45);
            pg.fillRect(left, top + grassH, p.w, 4);
            // Random pebbles in the soil
            const pebbleCount = Math.max(3, Math.floor(p.w / 60));
            for (let i = 0; i < pebbleCount; i++) {
                const px = left + 12 + Math.random() * (p.w - 24);
                const py = top + grassH + 12 + Math.random() * (p.h - grassH - 18);
                pg.fillStyle(0x4a3120, 0.55);
                pg.fillCircle(px, py, 1.6 + Math.random() * 1.6);
            }
            // Roots / soil striations
            for (let i = 0; i < Math.max(2, p.w / 110); i++) {
                const rx = left + 18 + Math.random() * (p.w - 36);
                const ry = top + grassH + 4;
                pg.lineStyle(1.5, 0x4a3120, 0.45);
                pg.beginPath();
                pg.moveTo(rx, ry);
                pg.lineTo(rx + (Math.random() - 0.5) * 14, ry + 12 + Math.random() * 16);
                pg.strokePath();
            }
            // Grass crown (dark layer + light highlight)
            pg.fillStyle(0x6fa54a, 1);
            pg.fillRect(left, top, p.w, grassH);
            pg.fillStyle(0x8fbf5c, 1);
            pg.fillRect(left, top, p.w, 6);
            pg.fillStyle(0xb6d97e, 0.7);
            pg.fillRect(left + 4, top, p.w - 8, 2);
            // Subtle scalloped grass edge on top
            pg.fillStyle(0x6fa54a, 1);
            for (let sx = left; sx < left + p.w; sx += 8) {
                pg.fillCircle(sx, top, 3);
            }
            // Soft, varied grass blades on top — swayed by a procedural breeze
            const topY = top;
            let gx = left + 4;
            while (gx < left + p.w - 4) {
                const h = 9 + Math.random() * 14;
                const w = 1.4 + Math.random() * 1.6;
                const color = bladeColors[Math.floor(Math.random() * bladeColors.length)];
                const blade = this.add.rectangle(gx, topY, w, h, color);
                blade.setOrigin(0.5, 1);
                blade.swayPhase = Math.random() * Math.PI * 2;
                blade.swayAmp = 0.06 + Math.random() * 0.14;
                blade.heightFactor = h / 16;
                this.grassBlades.push(blade);
                gx += 4 + Math.random() * 5;
            }
        }
        this.breezeT = 0;

        // Spike hazards
        for (const s of lv.spikes) this.createSpikes(s.x, s.y, s.w);

        // Pancake collectibles
        this.pancakeSprites = [];
        this.totalPancakes = lv.pancakes.length;
        this.collectedPancakes = 0;
        for (const pc of lv.pancakes) {
            const t = this.add.image(pc.x, pc.y, 'pancake').setDisplaySize(56, 56);
            this.matter.add.gameObject(t, {
                shape: { type: 'circle', radius: 18 },
                isStatic: true,
                isSensor: true,
                label: 'pancake'
            });
            const baseScale = t.scaleX;
            const phase = Math.random() * 1000;
            this.tweens.add({
                targets: t,
                y: pc.y - 10,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: phase % 800
            });
            this.tweens.add({
                targets: t,
                rotation: 0.18,
                duration: 1100,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: phase % 1100
            });
            this.tweens.add({
                targets: t,
                scaleX: baseScale * 1.08,
                scaleY: baseScale * 0.94,
                duration: 600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: phase % 600
            });
            // Soft glow halo
            const halo = this.add.circle(pc.x, pc.y, 36, 0xfde6c0, 0.22).setDepth(-1);
            this.tweens.add({
                targets: halo,
                scale: 1.3,
                alpha: 0.1,
                duration: 900,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: phase % 900
            });
            t.halo = halo;
            this.pancakeSprites.push(t);
        }

        // Goal: giant pancake — sitting still on the ground, sparkly and delicious.
        this.goalX = lv.goal.x;
        this.goalY = lv.goal.y;
        this.hasCawed = false;
        const goal = this.add.image(lv.goal.x, lv.goal.y, 'pancake').setDisplaySize(180, 180);
        this.matter.add.gameObject(goal, {
            shape: { type: 'circle', radius: 60 },
            isStatic: true,
            isSensor: true,
            label: 'goal'
        });
        // No bob, no rotate, no scale wiggle — it just sits there, perfect.

        // Soft layered halo behind the goal — warm storybook glow
        const haloFar  = this.add.circle(lv.goal.x, lv.goal.y, 130, 0xfff2b0, 0.20).setDepth(-2);
        const haloMid  = this.add.circle(lv.goal.x, lv.goal.y, 100, 0xfff2b0, 0.24).setDepth(-2);
        const haloNear = this.add.circle(lv.goal.x, lv.goal.y, 78,  0xfde6c0, 0.32).setDepth(-2);
        this.tweens.add({ targets: haloFar,  scale: 1.12, alpha: 0.10, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: haloMid,  scale: 1.08, alpha: 0.16, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 300 });
        this.tweens.add({ targets: haloNear, scale: 1.06, alpha: 0.22, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 600 });

        // Twinkles popping ON the surface of the pancake so it looks delicious
        this.time.addEvent({
            delay: 360,
            loop: true,
            callback: () => {
                if (this.gameOver) return;
                const ang = Math.random() * Math.PI * 2;
                const dist = Math.random() * 56;
                const sx = lv.goal.x + Math.cos(ang) * dist;
                const sy = lv.goal.y - 14 + Math.sin(ang) * dist * 0.35; // squish vertically — flat top
                const tw = this.add.text(sx, sy, '✦', {
                    fontFamily: 'Arial', fontSize: 18, color: '#fff5d3',
                    stroke: '#ffb84a', strokeThickness: 2
                }).setOrigin(0.5).setDepth(20).setScale(0).setAlpha(0);
                this.tweens.add({
                    targets: tw,
                    scale: 1.0,
                    alpha: 1,
                    duration: 220,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                        this.tweens.add({
                            targets: tw,
                            scale: 0.2,
                            alpha: 0,
                            duration: 380,
                            delay: 160,
                            onComplete: () => tw.destroy()
                        });
                    }
                });
            }
        });

        // Hazardous foods (avocado, beet, egg) — deal damage when consumed
        this.hazardSprites = [];
        for (const h of (lv.hazards || [])) this.createHazard(h.x, h.y, h.type);

        // Pigeon player
        this.spawnPos = { x: lv.spawn.x, y: lv.spawn.y };
        this.createPigeon();

        // Stranded baby pigeon (mid-level rescue)
        this.parentHistory = [];
        if (lv.baby) this.createBaby(lv.baby.x, lv.baby.y);

        // Drawing state — no ink limit anymore; planks auto-fade after a few seconds.
        this.drawnGroups = [];
        this.currentGraphics = null;
        this.currentPoints = null;
        this.isDrawing = false;
        this.plankLifetimeMs = 7000;
        this.plankFadeMs = 1500;

        // Combo streak
        this.comboCount = 0;
        this.comboTimerMs = 0;
        this.comboWindowMs = 2400;
        this.comboBest = 0;

        // Stats
        this.deaths = 0;
        this.startTime = this.time.now;

        // Health
        this.maxHealth = 3;
        this.health = this.maxHealth;

        this.setupInput();
        this.setupCollisions();
        this.createUI();

        this.cameras.main.startFollow(this.pigeon, true, 0.12, 0.12);
        this.cameras.main.fadeIn(450, 0, 0, 0);

        this.gameOver = false;
        this.invulnerable = false;
        this.justJumped = false;

        this.showLevelIntro();
        // (Drawing tutorial removed along with the bridge-drawing feature.)
    }

    createSky () {
        const lv = this.level;
        const camW = this.cameras.main.width;
        // Use the visible-view height (above the touch control bar on mobile)
        // so the horizon gradient/haze land at the bottom of the gameplay
        // area, not hidden behind the bar.
        const camH = this.viewH ?? this.cameras.main.height;

        // Sky gradient — cool blue at top fading to warm cream at horizon
        const sky = this.add.graphics();
        sky.fillGradientStyle(0xb8e1f7, 0xb8e1f7, 0xfde6c0, 0xfde6c0, 1);
        sky.fillRect(0, 0, camW, camH);
        sky.setScrollFactor(0).setDepth(-100);

        // Soft horizon haze just above the hills
        const haze = this.add.graphics();
        haze.fillGradientStyle(0xfde6c0, 0xfde6c0, 0xf3d4a0, 0xf3d4a0, 0, 0, 0.55, 0.55);
        haze.fillRect(0, camH - 240, camW, 200);
        haze.setScrollFactor(0).setDepth(-90);

        // Sun: layered glow + warm core + slow rotating rays
        const sunX = 165, sunY = 120;
        this.add.circle(sunX, sunY, 130, 0xfff2b0, 0.12).setScrollFactor(0.15).setDepth(-85);
        this.add.circle(sunX, sunY, 95, 0xfff2b0, 0.18).setScrollFactor(0.15).setDepth(-85);
        this.add.circle(sunX, sunY, 70, 0xfff2b0, 0.25).setScrollFactor(0.15).setDepth(-85);
        const sun = this.add.circle(sunX, sunY, 46, 0xfff5d3).setScrollFactor(0.15).setDepth(-84);
        this.tweens.add({ targets: sun, scale: 1.04, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const rays = this.add.graphics().setScrollFactor(0.15).setDepth(-86);
        rays.lineStyle(3, 0xfff2b0, 0.30);
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            rays.beginPath();
            rays.moveTo(Math.cos(a) * 56, Math.sin(a) * 56);
            rays.lineTo(Math.cos(a) * 78, Math.sin(a) * 78);
            rays.strokePath();
        }
        rays.x = sunX; rays.y = sunY;
        this.tweens.add({ targets: rays, rotation: Math.PI * 2, duration: 50000, repeat: -1, ease: 'Linear' });

        // Parallax clouds — soft, with a hint of warm shadow underneath
        for (let i = 0; i < 12; i++) {
            const cx = Math.random() * lv.worldWidth;
            const cy = 40 + Math.random() * 240;
            const cloud = this.add.container(cx, cy);
            for (const off of [[-22, 0, 22], [0, -10, 28], [22, 0, 22], [10, 6, 18]]) {
                // Warm under-shadow
                cloud.add(this.add.circle(off[0], off[1] + off[2] * 0.45, off[2] * 0.95, 0xfde0bf, 0.45));
                // Bright top
                cloud.add(this.add.circle(off[0], off[1], off[2], 0xffffff, 0.78));
            }
            cloud.setScrollFactor(0.25 + Math.random() * 0.35);
            cloud.setDepth(-70);
        }

        // Distant hills — three depth-cued layers (far → near, getting saturated)
        const hillBaseY = lv.worldHeight - 30;
        const hillLayers = [
            { sf: 0.65, color: 0xa6c98e, alpha: 0.95, yOffset: -28, radius: 170, spacing: 240, depth: -60 },
            { sf: 0.45, color: 0x88b56b, alpha: 1.0,  yOffset: -10, radius: 200, spacing: 280, depth: -55 },
            { sf: 0.25, color: 0x6fa54a, alpha: 1.0,  yOffset:   8, radius: 220, spacing: 300, depth: -50 }
        ];
        for (const L of hillLayers) {
            const g = this.add.graphics();
            g.fillStyle(L.color, L.alpha);
            for (let x = -300; x < lv.worldWidth + 300; x += L.spacing) {
                const wob = (Math.sin(x * 0.013) + Math.cos(x * 0.027)) * 18;
                g.fillCircle(x + (Math.random() - 0.5) * 60, hillBaseY + L.yOffset + wob, L.radius);
            }
            g.setScrollFactor(L.sf, 0.4);
            g.setDepth(L.depth);
        }

        // Distant flying birds (silhouettes slowly drifting across the sky)
        this.time.addEvent({
            delay: 4500,
            loop: true,
            callback: () => this.spawnBackgroundBird()
        });
        for (let i = 0; i < 3; i++) {
            this.time.delayedCall(i * 1200, () => this.spawnBackgroundBird());
        }

        // Atmospheric dust motes / pollen drifting in the upper air
        this.time.addEvent({
            delay: 700,
            loop: true,
            callback: () => this.spawnDustMote()
        });
    }

    spawnDustMote () {
        if (this.gameOver) return;
        const cam = this.cameras.main;
        const x = cam.scrollX + Math.random() * cam.width;
        const y = cam.scrollY + 80 + Math.random() * (cam.height * 0.55);
        const tint = Math.random() < 0.5 ? 0xfff5e1 : 0xfde6c0;
        const mote = this.add.circle(x, y, 1.1 + Math.random() * 1.5, tint, 0.3 + Math.random() * 0.35).setDepth(-1);
        this.tweens.add({
            targets: mote,
            x: x + (Math.random() - 0.5) * 90,
            y: y - 40 - Math.random() * 80,
            alpha: 0,
            duration: 5000 + Math.random() * 4000,
            ease: 'Sine.easeInOut',
            onComplete: () => mote.destroy()
        });
    }

    spawnBackgroundBird () {
        if (this.gameOver) return;
        const cam = this.cameras.main;
        const dir = Math.random() < 0.5 ? 1 : -1;
        const startX = dir > 0 ? -60 : cam.width + 60;
        const endX = dir > 0 ? cam.width + 60 : -60;
        const y = 60 + Math.random() * 200;
        const tone = Math.random() < 0.5 ? 0x4a5a6a : 0x6b7785;

        const bird = this.add.graphics();
        bird.lineStyle(3, tone, 0.85);
        bird.beginPath();
        bird.moveTo(-14, 0);
        bird.lineTo(-7, -8);
        bird.lineTo(0, 0);
        bird.lineTo(7, -8);
        bird.lineTo(14, 0);
        bird.strokePath();
        bird.x = startX;
        bird.y = y;
        bird.setScrollFactor(0.35 + Math.random() * 0.25);
        bird.setDepth(-2);
        if (dir < 0) bird.scaleX = -1;

        // Wing flap (slower, calmer cadence)
        this.tweens.add({
            targets: bird,
            scaleY: 0.5,
            duration: 480 + Math.random() * 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        // Drift across
        this.tweens.add({
            targets: bird,
            x: endX,
            y: y + (Math.random() - 0.5) * 40,
            duration: 22000 + Math.random() * 9000,
            ease: 'Sine.easeInOut',
            onComplete: () => bird.destroy()
        });
    }

    createSpikes (x, y, w) {
        // Pit: warm dark soil (matches platform palette) instead of pure black
        const pit = this.add.graphics().setDepth(-2);
        pit.fillStyle(0x2e1d10, 1);
        pit.fillRect(x - w/2, y, w, 60);
        // Lighter rim shadow under spikes
        pit.fillStyle(0x4a3120, 0.6);
        pit.fillRect(x - w/2, y, w, 6);

        // Spikes: stone with light/dark face shading
        const g = this.add.graphics().setDepth(-1);
        const spikeWidth = 22;
        const count = Math.max(1, Math.floor(w / spikeWidth));
        const startX = x - w/2;
        const usedW = count * spikeWidth;
        const offsetX = startX + (w - usedW) / 2;
        for (let i = 0; i < count; i++) {
            const sx = offsetX + i * spikeWidth;
            const tipX = sx + spikeWidth / 2;
            const tipY = y - 28;
            // Right (shadow) face
            g.fillStyle(0x55626d, 1);
            g.fillTriangle(tipX, tipY, sx + spikeWidth, y, tipX, y);
            // Left (lit) face
            g.fillStyle(0x8b96a0, 1);
            g.fillTriangle(tipX, tipY, sx, y, tipX, y);
            // Spec highlight along the lit edge
            g.lineStyle(1.5, 0xc4ccd2, 0.7);
            g.lineBetween(tipX - 0.5, tipY + 1, sx + 2, y - 1);
            // Outline
            g.lineStyle(1.5, 0x2a323a, 1);
            g.strokeTriangle(sx, y, sx + spikeWidth, y, tipX, tipY);
        }

        // Collision sensor
        this.matter.add.rectangle(x, y - 14, w, 28, {
            isStatic: true,
            isSensor: true,
            label: 'spike'
        });
    }

    createPigeon () {
        // Selected variant — each pigeon has its own body texture (per-variant
        // shape baked in) and head texture (with the accessory baked in).
        // Wings/legs share a base texture and are tinted per variant.
        // Head Y position comes from the shape so taller bodies push the head up.
        const variantId = loadVariant();
        const variant = VARIANTS[variantId] || VARIANTS.classic;
        this.variantId = variant.id;
        this.funnyWalk = !!variant.funnyWalk;
        // Per-variant movement tuning — Ryan walks slower and only mini-jumps.
        this.walkSpeed = variant.walkSpeed ?? 4.5;
        this.jumpVelocity = variant.jumpV ?? -11;
        const headY = variant.shape.headY ?? -115;
        const wingY = variant.shape.wingY ?? -78;
        const wingScale = variant.shape.wingScale ?? 1;

        // Multi-part rig: legs (back) → body → wing → head (front)
        const legL = this.add.image(-15, 24, 'pigeon-leg').setOrigin(0.5, 0.07);
        const legR = this.add.image(11, 24, 'pigeon-leg').setOrigin(0.5, 0.07);
        const body = this.add.image(0, -50, bodyTextureKey(variant.id)).setOrigin(0.5, 0.5);
        const wing = this.add.image(-2, wingY, 'pigeon-wing').setOrigin(124/140, 28/80);
        const head = this.add.image(40, headY, headTextureKey(variant.id)).setOrigin(HEAD_ORIGIN.x, HEAD_ORIGIN.y);

        if (variant.wingTint && variant.wingTint !== 0xffffff) wing.setTint(variant.wingTint);
        if (wingScale !== 1) wing.setScale(wingScale);
        if (variant.legTint && variant.legTint !== 0xffffff) {
            legL.setTint(variant.legTint);
            legR.setTint(variant.legTint);
        }

        const inner = this.add.container(0, 0, [legL, legR, body, wing, head]);
        this.pigeonScale = 0.34;
        inner.setScale(this.pigeonScale);

        this.pigeon = this.add.container(this.spawnPos.x, this.spawnPos.y, [inner]);
        this.matter.add.gameObject(this.pigeon, {
            shape: { type: 'circle', radius: 22 },
            inertia: Infinity,
            friction: 0.05,
            frictionStatic: 0.6,
            restitution: 0.0,
            label: 'pigeon'
        });

        this.pigeonInner = inner;
        this.pigeonBody = body;
        this.pigeonHead = head;
        this.pigeonWing = wing;
        this.pigeonLegL = legL;
        this.pigeonLegR = legR;
        this.pigeonHeadRestY = headY;

        this.facing = 1;
        this.groundContacts = 0;
        this.animT = 0;
        this.squashRemaining = 0;
        this.squashDuration = 1;
        this.squashType = 'squash';
        this.wasOnGroundLast = true;
        // Fall-over state (fat pigeon flops on landing)
    }

    setupInput () {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey('SPACE');
        this.rKey = this.input.keyboard.addKey('R');
        this.escKey = this.input.keyboard.addKey('ESC');

        this.rKey.on('down', () => this.fullRespawn());
        this.escKey.on('down', () => this.openPauseOverlay());

        // Multi-touch: allow holding the joystick AND tapping jump at once.
        this.input.addPointer(2);

        // Touch-control state (OR'd into keyboard input each frame).
        this.touchLeft = false;
        this.touchRight = false;
        this.touchJump = false;
        this.createMobileControls();
    }

    // On-screen joystick + jump button. Always visible; on desktop the buttons
    // are still tappable, on mobile/tablet they're the primary input.
    createMobileControls () {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const barH = this.controlBarH;

        // Control-bar background (only on portrait/mobile where barH > 0).
        // Sits above world content but below the buttons. Same warm-dark
        // palette as the top HUD bar so it reads as part of the UI.
        if (barH > 0) {
            const barY = H - barH / 2;
            this.add.rectangle(W / 2, barY, W, barH, 0x3a2818, 1)
                .setScrollFactor(0).setDepth(90);
            // Thin warm rule along the top edge
            this.add.rectangle(W / 2, this.viewH, W, 2, 0xffd166, 0.45)
                .setScrollFactor(0).setDepth(90);
            // Subtle top inner highlight so the bar feels lifted
            this.add.rectangle(W / 2, this.viewH + 4, W, 6, 0x000000, 0.25)
                .setScrollFactor(0).setDepth(90);
        }

        // Center the controls vertically inside the bar (or fall back to the
        // old offset on landscape, where there is no bar).
        const ctrlY = barH > 0 ? H - barH / 2 : H - 100;

        // ---- Virtual joystick (bottom-left) ----
        const jx = 130, jy = ctrlY;
        const baseR = 70, thumbR = 32;
        const thumbMaxOff = baseR - thumbR;

        const jBase = this.add.circle(jx, jy, baseR, 0x2a1f1a, 0.32)
            .setStrokeStyle(4, 0xfff5e1, 0.7).setScrollFactor(0).setDepth(95);
        const jThumb = this.add.circle(jx, jy, thumbR, 0xfff5e1, 0.78)
            .setStrokeStyle(3, 0x5b3a29, 0.85).setScrollFactor(0).setDepth(96);
        jBase.setInteractive();
        // Hint arrows on the base ring
        const arrowStyle = {
            fontFamily: 'Arial Black', fontSize: 22, color: '#fff5e1',
            stroke: '#5b3a29', strokeThickness: 3
        };
        this.add.text(jx - baseR + 14, jy, '◀', arrowStyle)
            .setOrigin(0.5).setScrollFactor(0).setDepth(96).setAlpha(0.85);
        this.add.text(jx + baseR - 14, jy, '▶', arrowStyle)
            .setOrigin(0.5).setScrollFactor(0).setDepth(96).setAlpha(0.85);

        let joyId = null;
        const updateJoy = (pointer) => {
            const dx = pointer.x - jx;
            const dy = pointer.y - jy;
            const dist = Math.min(thumbMaxOff, Math.hypot(dx, dy));
            const a = Math.atan2(dy, dx);
            jThumb.x = jx + Math.cos(a) * dist;
            jThumb.y = jy + Math.sin(a) * dist;
            const dead = baseR * 0.25;
            this.touchLeft = dx < -dead;
            this.touchRight = dx > dead;
        };
        const releaseJoy = () => {
            joyId = null;
            jThumb.x = jx; jThumb.y = jy;
            this.touchLeft = false;
            this.touchRight = false;
        };
        jBase.on('pointerdown', (pointer) => {
            joyId = pointer.id;
            updateJoy(pointer);
        });
        this.input.on('pointermove', (pointer) => {
            if (pointer.id === joyId) updateJoy(pointer);
        });
        this.input.on('pointerup', (pointer) => {
            if (pointer.id === joyId) releaseJoy();
        });

        // ---- Jump button (bottom-right) ----
        const bx = W - 130, by = ctrlY;
        const bR = 56;
        const jumpBg = this.add.circle(bx, by, bR, 0xff8c42, 0.82)
            .setStrokeStyle(4, 0x5b3a29, 0.95).setScrollFactor(0).setDepth(95);
        const jumpLabel = this.add.text(bx, by - 4, '↑', {
            fontFamily: 'Arial Black', fontSize: 56, color: '#fff5e1',
            stroke: '#5b3a29', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(96);
        jumpBg.setInteractive();

        const setJumpPressed = (pressed) => {
            this.touchJump = pressed;
            jumpBg.setFillStyle(pressed ? 0xffa55a : 0xff8c42, pressed ? 0.95 : 0.82);
            const s = pressed ? 0.94 : 1;
            jumpBg.setScale(s);
            jumpLabel.setScale(s);
        };
        jumpBg.on('pointerdown', () => setJumpPressed(true));
        jumpBg.on('pointerup', () => setJumpPressed(false));
        jumpBg.on('pointerout', () => setJumpPressed(false));

        // Save handles in case we want to hide/show later (e.g. on win screen).
        this.mobileControls = { jBase, jThumb, jumpBg, jumpLabel };
    }

    setupCollisions () {
        this.matter.world.on('collisionstart', (event) => {
            for (const pair of event.pairs) this.onCollisionPair(pair, true);
        });
        this.matter.world.on('collisionend', (event) => {
            for (const pair of event.pairs) this.onCollisionPair(pair, false);
        });
    }

    onCollisionPair (pair, started) {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        if (!labels.includes('pigeon')) return;

        const aIsPigeon = pair.bodyA.label === 'pigeon';
        const pigeonBody = aIsPigeon ? pair.bodyA : pair.bodyB;
        const otherBody = aIsPigeon ? pair.bodyB : pair.bodyA;
        const otherLabel = otherBody.label;

        if (started) {
            if (otherLabel === 'pancake') {
                this.collectPancake(otherBody);
            } else if (otherLabel === 'goal') {
                this.winLevel();
            } else if (otherLabel === 'spike') {
                this.hurt(this.maxHealth, true);
            } else if (otherLabel === 'hazard') {
                this.consumeHazard(otherBody);
            } else if (otherLabel === 'baby') {
                this.rescueBaby(otherBody);
            } else if (otherLabel === 'ground' || otherLabel === 'drawn') {
                if (otherBody.position.y > pigeonBody.position.y + 8) {
                    this.groundContacts++;
                }
            }
        } else {
            if (otherLabel === 'ground' || otherLabel === 'drawn') {
                if (otherBody.position.y > pigeonBody.position.y + 8) {
                    this.groundContacts = Math.max(0, this.groundContacts - 1);
                }
            }
        }
    }

    collectPancake (body) {
        const sprite = body.gameObject;
        if (!sprite || sprite.collected) return;
        sprite.collected = true;
        this.collectedPancakes++;

        // Combo: each pancake within the window stacks the streak
        if (this.comboTimerMs > 0) this.comboCount++; else this.comboCount = 1;
        this.comboTimerMs = this.comboWindowMs;
        if (this.comboCount > this.comboBest) this.comboBest = this.comboCount;
        SFX.collect();
        this.showCollectPopup(sprite.x, sprite.y, this.comboCount);
        this.updateComboBadge();

        // Burst tween
        this.tweens.add({
            targets: sprite,
            scale: 1.8,
            alpha: 0,
            duration: 280,
            ease: 'Cubic.easeOut',
            onComplete: () => sprite.destroy()
        });
        if (sprite.halo) {
            this.tweens.add({
                targets: sprite.halo,
                scale: 2,
                alpha: 0,
                duration: 280,
                onComplete: () => sprite.halo.destroy()
            });
        }

        // Particle burst
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const dist = 40;
            const p = this.add.circle(sprite.x, sprite.y, 4, 0xffd166);
            this.tweens.add({
                targets: p,
                x: sprite.x + Math.cos(angle) * dist,
                y: sprite.y + Math.sin(angle) * dist,
                alpha: 0,
                scale: 0.2,
                duration: 400,
                onComplete: () => p.destroy()
            });
        }

        this.matter.world.remove(body);
        this.updateUI();
    }

    createHazard (x, y, type) {
        const sprite = this.add.image(x, y, type).setDisplaySize(44, 44);
        this.matter.add.gameObject(sprite, {
            shape: { type: 'circle', radius: 18 },
            isStatic: true,
            isSensor: true,
            label: 'hazard'
        });
        sprite.hazardType = type;
        // Idle bob, slightly different per hazard so they look alive
        const bobOffset = type === 'egg' ? 4 : 6;
        const bobMs = type === 'beet' ? 1400 : (type === 'avocado' ? 1200 : 1000);
        this.tweens.add({
            targets: sprite,
            y: y - bobOffset,
            duration: bobMs,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: Math.random() * 600
        });
        this.tweens.add({
            targets: sprite,
            angle: type === 'egg' ? 6 : -4,
            duration: 1700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: Math.random() * 800
        });
        this.hazardSprites.push(sprite);
    }

    consumeHazard (body) {
        const sprite = body.gameObject;
        if (!sprite || sprite.consumed) return;
        sprite.consumed = true;

        // Visual: chunks fly out as the food is "eaten"
        const colorMap = {
            avocado: [0xd6e58c, 0x4a6b28, 0x6b3a14],
            beet:    [0x6b1a3c, 0x8b2a4c, 0x4a7d2c],
            egg:     [0xf6e8d1, 0xfff5e1, 0x8a7150]
        };
        const colors = colorMap[sprite.hazardType] || [0xb47636];
        for (let i = 0; i < 10; i++) {
            const ang = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 100;
            const chunk = this.add.circle(
                sprite.x, sprite.y,
                2 + Math.random() * 2,
                colors[Math.floor(Math.random() * colors.length)],
                0.95
            ).setDepth(60);
            const dur = 600 + Math.random() * 300;
            const startX = sprite.x, startY = sprite.y;
            const vx = Math.cos(ang) * speed, vy = Math.sin(ang) * speed - 80;
            this.tweens.addCounter({
                from: 0, to: 1, duration: dur, ease: 'Linear',
                onUpdate: (tween) => {
                    if (!chunk.active) return;
                    const p = tween.getValue();
                    const t = p * (dur / 1000);
                    chunk.x = startX + vx * t;
                    chunk.y = startY + vy * t + 280 * t * t;
                    chunk.alpha = Math.max(0, 1 - p * 1.2);
                },
                onComplete: () => chunk.destroy()
            });
        }
        // "yuck" face wisp
        const wisp = this.add.text(sprite.x, sprite.y - 18, 'yuck!', {
            fontFamily: 'Arial Black', fontSize: 16, color: '#5b3a29',
            stroke: '#fff5e1', strokeThickness: 4
        }).setOrigin(0.5).setDepth(62).setAlpha(0).setScale(0.5);
        this.tweens.add({
            targets: wisp, alpha: 1, scale: 1, y: wisp.y - 6, duration: 220, ease: 'Back.easeOut',
            onComplete: () => this.tweens.add({
                targets: wisp, alpha: 0, y: wisp.y - 14, duration: 500, delay: 280,
                onComplete: () => wisp.destroy()
            })
        });

        this.tweens.add({
            targets: sprite,
            scale: '*=1.4',
            alpha: 0,
            duration: 240,
            onComplete: () => sprite.destroy()
        });
        this.matter.world.remove(body);
        // Apply damage AFTER triggering visual, so the screen flash overlays the chunk explosion
        this.hurt(1, false);
    }

    hurt (damage = 1, fatal = false) {
        if (this.gameOver || this.invulnerable) return;
        SFX.hurt();
        this.invulnerable = true;
        this.comboCount = 0;
        this.comboTimerMs = 0;
        if (this.comboBadge) this.tweens.add({ targets: this.comboBadge, alpha: 0, duration: 220 });

        this.health = fatal ? 0 : Math.max(0, this.health - damage);
        this.refreshHealthIcons();

        if (this.health <= 0) {
            // Knocked out — full feather explosion + respawn
            SFX.death();
            this.deaths = (this.deaths || 0) + 1;
            this.cameras.main.shake(260, 0.014);
            this.cameras.main.flash(220, 255, 80, 80);
            this.spawnFeatherExplosion(this.pigeon.x, this.pigeon.y);
            this.time.delayedCall(900, () => this.invulnerable = false);
            this.respawnPigeon();
        } else {
            // Just a hit — small shake, brief flash, no respawn
            this.cameras.main.shake(160, 0.008);
            this.cameras.main.flash(120, 255, 120, 120);
            this.spawnHitFeathers(this.pigeon.x, this.pigeon.y);
            // Brief invulnerability blink on the inner sprite
            const inner = this.pigeonInner;
            if (inner) {
                this.tweens.add({
                    targets: inner,
                    alpha: 0.4,
                    duration: 100,
                    yoyo: true,
                    repeat: 4,
                    onComplete: () => { if (inner) inner.alpha = 1; }
                });
            }
            this.time.delayedCall(700, () => this.invulnerable = false);
        }
    }

    spawnHitFeathers (x, y) {
        const tints = [0x8896a6, 0xc7d1dc, 0xa8b4c2, 0xfff5e1];
        const count = 8;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const speed = 70 + Math.random() * 80;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 40;
            const tint = tints[Math.floor(Math.random() * tints.length)];
            const startRot = Math.random() * Math.PI * 2;
            const angVel = (Math.random() - 0.5) * 8;
            const feather = this.add.image(x, y, 'feather')
                .setTint(tint).setScale(0.6 + Math.random() * 0.5).setRotation(startRot).setDepth(60);
            const dur = 700 + Math.random() * 400;
            this.tweens.addCounter({
                from: 0, to: 1, duration: dur, ease: 'Linear',
                onUpdate: (tween) => {
                    if (!feather.active) return;
                    const p = tween.getValue();
                    const t = p * (dur / 1000);
                    feather.x = x + vx * t;
                    feather.y = y + vy * t + 240 * t * t;
                    feather.rotation = startRot + angVel * t;
                    feather.alpha = Math.max(0, 1 - p * 1.2);
                },
                onComplete: () => feather.destroy()
            });
        }
    }

    spawnFeatherExplosion (x, y) {
        const tints = [0x8896a6, 0xc7d1dc, 0xa8b4c2, 0xfff5e1, 0xb47636, 0x6c7a8a];
        const count = 22;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const speed = 110 + Math.random() * 180;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 60; // upward bias so they puff up
            const tint = tints[Math.floor(Math.random() * tints.length)];
            const startRot = Math.random() * Math.PI * 2;
            const angVel = (Math.random() - 0.5) * 12;

            const feather = this.add.image(x, y, 'feather')
                .setTint(tint)
                .setScale(0.7 + Math.random() * 0.7)
                .setRotation(startRot)
                .setDepth(60);

            const dur = 1200 + Math.random() * 800;
            this.tweens.addCounter({
                from: 0,
                to: 1,
                duration: dur,
                ease: 'Linear',
                onUpdate: (tween) => {
                    if (!feather.active) return;
                    const p = tween.getValue();
                    const t = p * (dur / 1000);
                    feather.x = x + vx * t;
                    feather.y = y + vy * t + 240 * t * t;       // gravity
                    feather.rotation = startRot + angVel * t;
                    feather.alpha = Math.max(0, 1 - p * 1.1);
                },
                onComplete: () => feather.destroy()
            });
        }
        // Brief poof of dust at impact
        for (let i = 0; i < 6; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 6 + Math.random() * 10;
            const puff = this.add.circle(x + Math.cos(a) * r, y + Math.sin(a) * r,
                4 + Math.random() * 3, 0xfff5e1, 0.7).setDepth(58);
            this.tweens.add({
                targets: puff,
                scale: 2.4,
                alpha: 0,
                duration: 320,
                onComplete: () => puff.destroy()
            });
        }
    }

    respawnPigeon () {
        this.pigeon.setPosition(this.spawnPos.x, this.spawnPos.y);
        this.pigeon.setVelocity(0, 0);
        this.groundContacts = 0;
        if (this.pigeonInner) {
            this.pigeonInner.setScale(this.pigeonScale);
            this.pigeonInner.setRotation(0);
        }
        if (this.pigeonHead) this.pigeonHead.y = this.pigeonHeadRestY;
        if (this.pigeonWing) this.pigeonWing.rotation = 0;
        if (this.pigeonLegL) this.pigeonLegL.rotation = 0;
        if (this.pigeonLegR) this.pigeonLegR.rotation = 0;
        if (this.pigeonInner) this.pigeonInner.alpha = 1;
        this.squashRemaining = 0;
        this.wasOnGroundLast = true;
        this.health = this.maxHealth;
        this.refreshHealthIcons();
    }

    fullRespawn () {
        this.respawnPigeon();
        this.clearAllDrawings();
    }

    startDrawing (x, y) {
        this.isDrawing = true;
        this.currentPoints = [{ x, y }];
        this.currentGraphics = this.add.graphics();
    }

    continueDrawing (x, y) {
        const last = this.currentPoints[this.currentPoints.length - 1];
        const dx = x - last.x;
        const dy = y - last.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 8) return;
        this.currentPoints.push({ x, y });
        this.redrawCurrent();
        this.spawnDrawShavings(x, y);
        SFX.draw();
    }

    spawnDrawShavings (x, y) {
        if (Math.random() > 0.55) return;
        const shaving = this.add.circle(
            x + (Math.random() - 0.5) * 6,
            y + 4 + Math.random() * 4,
            1.6 + Math.random() * 1.4,
            0xb47636,
            0.85
        ).setDepth(8);
        this.tweens.add({
            targets: shaving,
            y: shaving.y + 16 + Math.random() * 14,
            alpha: 0,
            scale: 0.3,
            duration: 380 + Math.random() * 200,
            onComplete: () => shaving.destroy()
        });
    }

    redrawCurrent () {
        const g = this.currentGraphics;
        const pts = this.currentPoints;
        if (!g || pts.length < 2) return;
        g.clear();
        const smooth = this.smoothPolyline(pts);
        // Wood plank: dark outline, warm body, lighter highlight on top edge
        g.lineStyle(15, 0x4a2810, 1);
        this.strokePolyline(g, smooth);
        g.lineStyle(11, 0xb47636, 1);
        this.strokePolyline(g, smooth);
        g.lineStyle(7, 0xd49856, 1);
        this.strokePolyline(g, smooth);
        // Top highlight stripe
        g.lineStyle(2, 0xfcd9a0, 0.8);
        this.strokePolyline(g, smooth);
    }

    strokePolyline (g, pts) {
        if (pts.length < 2) return;
        g.beginPath();
        g.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
        g.strokePath();
    }

    // Smooth a polyline using Catmull-Rom interpolation so the strokes
    // look like fluid wood planks instead of jagged segments.
    smoothPolyline (pts) {
        if (pts.length < 3) return pts.slice();
        const out = [pts[0]];
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[Math.max(0, i - 1)];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[Math.min(pts.length - 1, i + 2)];
            const steps = 6;
            for (let s = 1; s <= steps; s++) {
                const t = s / steps;
                const t2 = t * t;
                const t3 = t2 * t;
                const x = 0.5 * ((2 * p1.x) +
                    (-p0.x + p2.x) * t +
                    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
                const y = 0.5 * ((2 * p1.y) +
                    (-p0.y + p2.y) * t +
                    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
                out.push({ x, y });
            }
        }
        return out;
    }

    endDrawing () {
        this.isDrawing = false;
        if (!this.currentPoints || this.currentPoints.length < 2) {
            this.currentGraphics?.destroy();
            this.currentGraphics = null;
            this.currentPoints = null;
            return;
        }
        const bodies = [];
        for (let i = 1; i < this.currentPoints.length; i++) {
            const a = this.currentPoints[i - 1];
            const b = this.currentPoints[i];
            const cx = (a.x + b.x) / 2;
            const cy = (a.y + b.y) / 2;
            const len = Math.hypot(b.x - a.x, b.y - a.y);
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            const body = this.matter.add.rectangle(cx, cy, len + 2, 12, {
                isStatic: true,
                angle: angle,
                friction: 0.7,
                frictionStatic: 0.9,
                label: 'drawn'
            });
            bodies.push(body);
        }
        const group = {
            graphics: this.currentGraphics,
            bodies,
            points: this.currentPoints,
            bornAt: this.time.now,
            fading: false
        };
        this.drawnGroups.push(group);
        // Auto-fade after lifetime — first the visual fades, then bodies are removed
        this.time.delayedCall(this.plankLifetimeMs - this.plankFadeMs, () => {
            if (!group.graphics || group.fading) return;
            group.fading = true;
            this.tweens.add({
                targets: group.graphics,
                alpha: 0,
                duration: this.plankFadeMs,
                ease: 'Cubic.easeIn',
                onComplete: () => this.removeDrawnGroup(group)
            });
            // Remove physics about halfway through the fade so the player can pass through
            this.time.delayedCall(this.plankFadeMs * 0.55, () => {
                for (const b of group.bodies) this.matter.world.remove(b);
                group.bodies.length = 0;
            });
        });

        this.currentGraphics = null;
        this.currentPoints = null;
    }

    removeDrawnGroup (group) {
        if (group.graphics) { group.graphics.destroy(); group.graphics = null; }
        for (const b of group.bodies) this.matter.world.remove(b);
        group.bodies = [];
        const idx = this.drawnGroups.indexOf(group);
        if (idx !== -1) this.drawnGroups.splice(idx, 1);
    }

    clearAllDrawings () {
        for (const g of this.drawnGroups) {
            if (g.graphics) g.graphics.destroy();
            for (const b of g.bodies) this.matter.world.remove(b);
        }
        this.drawnGroups = [];
        if (this.currentGraphics) this.currentGraphics.destroy();
        this.currentGraphics = null;
        this.currentPoints = null;
        this.isDrawing = false;
    }

    createUI () {
        const cam = this.cameras.main;
        const W = cam.width;

        // Top bar (warm dark brown, matches wood/earth palette)
        this.add.rectangle(W/2, 30, W, 60, 0x3a2818, 0.55).setScrollFactor(0).setDepth(100);
        this.add.rectangle(W/2, 60, W, 2, 0x2a1810, 0.30).setScrollFactor(0).setDepth(100);
        // Subtle warm highlight at the bottom of the bar
        this.add.rectangle(W/2, 4, W, 2, 0xffd166, 0.18).setScrollFactor(0).setDepth(100);

        // Level title (left)
        this.add.text(20, 16, this.level.name, {
            fontFamily: 'Arial Black', fontSize: 22, color: '#ffffff',
            stroke: '#000000', strokeThickness: 3
        }).setScrollFactor(0).setDepth(101);

        // Health hearts (bottom-center, in a small warm-brown pill).
        // Sits at the bottom of the visible game view, above the touch
        // control bar (which lives in the canvas's bottom strip on mobile).
        this.healthIcons = [];
        const heartY = (this.viewH ?? cam.height) - 28;
        const pillW = 26 + this.maxHealth * 30;
        this.add.rectangle(W/2, heartY, pillW, 38, 0x3a2818, 0.55)
            .setStrokeStyle(2, 0xffd166, 0.45).setScrollFactor(0).setDepth(100);
        for (let i = 0; i < this.maxHealth; i++) {
            const x = W/2 + (i - (this.maxHealth - 1) / 2) * 30;
            const h = this.add.text(x, heartY, '❤', {
                fontFamily: 'Arial Black', fontSize: 22, color: '#ff4f7a',
                stroke: '#5b3a29', strokeThickness: 4
            }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
            this.healthIcons.push(h);
        }

        // Pancake counter (center) — pancake icon + count
        const counterContainer = this.add.container(W/2, 30).setScrollFactor(0).setDepth(101);
        const cakeIcon = this.add.image(-32, 0, 'pancake').setDisplaySize(36, 36);
        this.pancakeText = this.add.text(8, 0, `0 / ${this.totalPancakes}`, {
            fontFamily: 'Arial Black', fontSize: 26, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0, 0.5);
        counterContainer.add([cakeIcon, this.pancakeText]);

        // Combo badge (appears when streak > 1)
        this.comboBadge = this.add.container(W/2, 64).setScrollFactor(0).setDepth(101).setAlpha(0);
        const comboBg = this.add.rectangle(0, 0, 130, 26, 0xff6b9d, 0.95).setStrokeStyle(2, 0xffffff);
        const comboText = this.add.text(0, 0, 'x2 COMBO!', {
            fontFamily: 'Arial Black', fontSize: 16, color: '#ffffff',
            stroke: '#5b3a29', strokeThickness: 3
        }).setOrigin(0.5);
        this.comboBadge.add([comboBg, comboText]);
        this.comboBadgeBg = comboBg;
        this.comboBadgeText = comboText;

        // Right-side button cluster: Mute + Pause
        this.muteBtn = this.makeIconButton(W - 96, 30, '🔊', () => this.toggleMute());
        this.pauseBtn = this.makeIconButton(W - 36, 30, '⏸', () => this.openPauseOverlay());
        this.refreshMuteIcon();

    }

    makeIconButton (x, y, glyph, onClick) {
        const btn = this.add.container(x, y).setScrollFactor(0).setDepth(101);
        const bg = this.add.rectangle(0, 0, 44, 44, 0x3a2818, 0.5).setStrokeStyle(2, 0xfde6c0, 0.55);
        const txt = this.add.text(0, 0, glyph, {
            fontFamily: 'Arial', fontSize: 22, color: '#fff5e1'
        }).setOrigin(0.5);
        btn.add([bg, txt]);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => { bg.setFillStyle(0xffd166, 0.30); btn.setScale(1.07); });
        bg.on('pointerout', () => { bg.setFillStyle(0x3a2818, 0.5); btn.setScale(1); });
        bg.on('pointerdown', () => { onClick(); });
        btn.bg = bg;
        btn.txt = txt;
        return btn;
    }

    refreshMuteIcon () {
        if (!this.muteBtn) return;
        this.muteBtn.txt.setText(isMuted() ? '🔇' : '🔊');
    }

    toggleMute () {
        setMuted(!isMuted());
        this.refreshMuteIcon();
        SFX.click();
    }

    updateUI () {
        this.pancakeText.setText(`${this.collectedPancakes} / ${this.totalPancakes}`);
    }

    refreshHealthIcons () {
        if (!this.healthIcons) return;
        for (let i = 0; i < this.healthIcons.length; i++) {
            const filled = i < this.health;
            const heart = this.healthIcons[i];
            const wasFilled = heart.text === '❤';
            heart.setText(filled ? '❤' : '♡');
            heart.setColor(filled ? '#ff4f7a' : '#a89882');
            // Pop the heart that just emptied
            if (wasFilled && !filled) {
                this.tweens.killTweensOf(heart);
                heart.setScale(1.6);
                this.tweens.add({
                    targets: heart,
                    scale: 1,
                    duration: 280,
                    ease: 'Back.easeOut'
                });
            }
        }
    }

    showCollectPopup (x, y, combo) {
        const label = combo > 1 ? `+1  x${combo}!` : '+1';
        const color = combo > 1 ? '#ff6b9d' : '#fff5e1';
        const popup = this.add.text(x, y - 24, label, {
            fontFamily: 'Arial Black',
            fontSize: combo > 1 ? 26 : 22,
            color,
            stroke: '#5b3a29',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(60).setScale(0.4).setRotation((Math.random() - 0.5) * 0.3);
        this.tweens.add({
            targets: popup,
            scale: combo > 1 ? 1.15 : 1.0,
            duration: 180,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: popup,
                    y: popup.y - 38,
                    alpha: 0,
                    duration: 600,
                    delay: 200,
                    onComplete: () => popup.destroy()
                });
            }
        });
    }

    updateComboBadge () {
        if (!this.comboBadge) return;
        if (this.comboCount > 1) {
            this.comboBadgeText.setText(`x${this.comboCount}  COMBO!`);
            // Pop animation
            this.tweens.killTweensOf(this.comboBadge);
            this.comboBadge.setScale(1.2).setAlpha(1);
            this.tweens.add({
                targets: this.comboBadge,
                scale: 1.0,
                duration: 220,
                ease: 'Back.easeOut'
            });
        } else {
            this.tweens.add({
                targets: this.comboBadge,
                alpha: 0,
                duration: 180
            });
        }
    }

    tickComboTimer (dt) {
        if (this.comboTimerMs > 0) {
            this.comboTimerMs -= dt * 1000;
            if (this.comboTimerMs <= 0) {
                this.comboTimerMs = 0;
                this.comboCount = 0;
                if (this.comboBadge && this.comboBadge.alpha > 0.01) {
                    this.tweens.add({ targets: this.comboBadge, alpha: 0, duration: 220 });
                }
            }
        }
    }

    showLevelIntro () {
        const cam = this.cameras.main;
        const W = cam.width;
        const card = this.add.container(W/2, 200).setScrollFactor(0).setDepth(120).setAlpha(0);
        const bg = this.add.rectangle(0, 0, 580, 168, 0xfff5e1, 0.95).setStrokeStyle(5, 0x5b3a29);
        const title = this.add.text(0, -52, this.level.name.toUpperCase(), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#b35a1f',
            stroke: '#5b3a29', strokeThickness: 5
        }).setOrigin(0.5);
        const hint = this.add.text(0, -8, this.level.hint, {
            fontFamily: 'Arial', fontSize: 16, color: '#5b3a29'
        }).setOrigin(0.5);
        const sep = this.add.rectangle(0, 22, 480, 1, 0x5b3a29, 0.35);
        const controls = this.add.text(0, 46, '← →  Move      ↑ Space  Jump      Esc  Pause', {
            fontFamily: 'Arial Black', fontSize: 15, color: '#5b3a29'
        }).setOrigin(0.5);
        card.add([bg, title, hint, sep, controls]);

        this.tweens.add({
            targets: card,
            alpha: 1,
            y: 160,
            duration: 380,
            ease: 'Back.easeOut'
        });
        this.tweens.add({
            targets: card,
            alpha: 0,
            y: 140,
            duration: 360,
            delay: 2600,
            ease: 'Cubic.easeIn',
            onComplete: () => card.destroy()
        });
    }

    showFirstTimeTutorial () {
        // A quick animated hint above the first gap teaching the draw mechanic.
        // World-space coordinates: gap on level 1 spans x=600..800 around y=680.
        const startX = 560, endX = 840, y = 660;
        const hint = this.add.container(0, 0).setDepth(35);
        const labelBg = this.add.rectangle((startX + endX) / 2, y - 90, 290, 36, 0x3a2818, 0.85)
            .setStrokeStyle(2, 0xffd166);
        const label = this.add.text((startX + endX) / 2, y - 90,
            'Drag here to draw a bridge', {
                fontFamily: 'Arial Black', fontSize: 16, color: '#fff5e1'
            }).setOrigin(0.5);
        hint.add([labelBg, label]);

        // Animated dashed arc demonstrating the drag motion
        const arc = this.add.graphics().setDepth(35);
        const drawArcAt = (progress) => {
            arc.clear();
            arc.lineStyle(6, 0xffd166, 0.9);
            const p0 = { x: startX, y };
            const p1 = { x: endX, y };
            const peakY = y - 50;
            arc.beginPath();
            arc.moveTo(p0.x, p0.y);
            const steps = 30;
            const upto = Math.floor(progress * steps);
            for (let i = 1; i <= upto; i++) {
                const t = i / steps;
                const x = p0.x + (p1.x - p0.x) * t;
                const yy = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * peakY + t * t * p1.y;
                arc.lineTo(x, yy);
            }
            arc.strokePath();
        };
        const cursor = this.add.image(startX, y, 'particle').setTint(0xffd166).setScale(1.2).setDepth(36);

        this.tweens.add({
            targets: { p: 0 },
            p: 1,
            duration: 1300,
            repeat: 2,
            yoyo: false,
            onUpdate: (tween, target) => {
                drawArcAt(target.p);
                const t = target.p;
                cursor.x = startX + (endX - startX) * t;
                cursor.y = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y - 50) + t * t * y;
            },
            onComplete: () => {
                this.tweens.add({
                    targets: [labelBg, label, arc, cursor],
                    alpha: 0,
                    duration: 360,
                    onComplete: () => {
                        labelBg.destroy(); label.destroy(); arc.destroy(); cursor.destroy();
                    }
                });
            }
        });
    }

    openPauseOverlay () {
        if (this.gameOver) return;
        if (this.scene.isPaused('Game')) return;
        this.scene.launch('PauseOverlay', { from: 'Game' });
        this.scene.pause('Game');
    }

    spawnSpeedTrail () {
        if (Math.random() > 0.5) return;
        const trail = this.add.circle(
            this.pigeon.x - this.facing * 8 + (Math.random() - 0.5) * 6,
            this.pigeon.y + 14 + (Math.random() - 0.5) * 6,
            2.5 + Math.random() * 2,
            0xfff5e1,
            0.7
        ).setDepth(5);
        this.tweens.add({
            targets: trail,
            x: trail.x - this.facing * 18,
            alpha: 0,
            scale: 0.3,
            duration: 360,
            onComplete: () => trail.destroy()
        });
    }

    winLevel () {
        if (this.gameOver) return;
        this.gameOver = true;
        SFX.win();
        SFX.babyRescue();   // recorded "found the pancake" voice over the synth fanfare

        // Big pop on goal + slow zoom for the win moment
        this.cameras.main.flash(400, 255, 240, 200);
        this.cameras.main.shake(220, 0.006);
        this.tweens.add({
            targets: this.cameras.main,
            zoom: 1.10,
            duration: 700,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });

        const stars = this.calcStars();
        saveProgress(this.level.id, stars);
        const elapsedMs = this.time.now - (this.startTime || this.time.now);

        this.cameras.main.fadeOut(700, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameOver', {
                levelIndex: this.levelIndex,
                stars,
                pancakes: this.collectedPancakes,
                totalPancakes: this.totalPancakes,
                comboBest: this.comboBest || 0,
                deaths: this.deaths || 0,
                elapsedMs
            });
        });
    }

    calcStars () {
        if (this.totalPancakes === 0) return 1;
        const ratio = this.collectedPancakes / this.totalPancakes;
        if (ratio >= 1) return 3;
        if (ratio >= 0.5) return 2;
        return 1;
    }

    update () {
        if (this.gameOver) return;

        const body = this.pigeon.body;
        const speed = this.walkSpeed;
        const jumpV = this.jumpVelocity;

        const leftDown = this.cursors.left.isDown || this.touchLeft;
        const rightDown = this.cursors.right.isDown || this.touchRight;
        const wantsJump = this.cursors.up.isDown || this.spaceKey.isDown || this.touchJump;

        // Horizontal movement
        let vx = body.velocity.x;
        if (leftDown) {
            vx = -speed;
            this.facing = -1;
            this.pigeon.setScale(-1, 1);
        } else if (rightDown) {
            vx = speed;
            this.facing = 1;
            this.pigeon.setScale(1, 1);
        } else {
            vx *= 0.72;
            if (Math.abs(vx) < 0.2) vx = 0;
        }
        this.pigeon.setVelocity(vx, body.velocity.y);

        // Jump
        if (wantsJump && this.groundContacts > 0 && !this.justJumped) {
            this.pigeon.setVelocity(vx, jumpV);
            SFX.jump();
            SFX.jumpVoice();   // ~25% chance to layer the funny voice clip
            this.justJumped = true;
            this.spawnJumpParticles();
            this.triggerSquash('stretch', 0.22);
            this.time.delayedCall(220, () => this.justJumped = false);
        }

        // Idle voice — when the player stands still on the ground for ~10s.
        const onGroundIdle = this.groundContacts > 0;
        const stillX = Math.abs(body.velocity.x) < 0.3;
        const noInput = !leftDown && !rightDown && !wantsJump;
        if (onGroundIdle && stillX && noInput && !this.gameOver) {
            this.idleTime += 1 / 60;
            if (this.idleTime >= 10) {
                SFX.idle10s();
                // Reset with a long cooldown so the clip doesn't loop on itself.
                this.idleTime = -8;
            }
        } else {
            this.idleTime = 0;
        }

        // Falling out — instant KO
        if (this.pigeon.y > this.level.worldHeight + 80) {
            this.hurt(this.maxHealth, true);
        }

        this.animatePigeon(body);
        this.updateBreeze();
        this.checkGoalSpotted();
        this.updateBaby();
        this.tickComboTimer(1 / 60);
        if (this.groundContacts > 0 && Math.abs(body.velocity.x) > 3.6) {
            this.spawnSpeedTrail();
        }
    }

    updateBreeze () {
        this.breezeT += 1 / 60;
        const gust = Math.sin(this.breezeT * 0.7) * 0.4 + 0.6; // 0.2 .. 1.0 slow gust
        for (const blade of this.grassBlades) {
            const local = Math.sin(this.breezeT * 1.4 + blade.swayPhase);
            blade.rotation = local * blade.swayAmp * blade.heightFactor * gust;
        }
    }

    checkGoalSpotted () {
        if (this.hasCawed || this.gameOver) return;
        if (this.goalX == null) return;
        const view = this.cameras.main.worldView;
        if (view.contains(this.goalX, this.goalY)) {
            this.hasCawed = true;
            SFX.caw();
            this.showCawBubble();
        }
    }

    showCawBubble () {
        const bubble = this.add.text(this.pigeon.x + this.facing * 12, this.pigeon.y - 56, 'CAW!', {
            fontFamily: 'Arial Black',
            fontSize: 38,
            color: '#fff5e1',
            stroke: '#5b3a29',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(60).setScale(0).setRotation(-0.25);
        this.tweens.add({
            targets: bubble,
            scale: 1,
            rotation: 0.05,
            duration: 220,
            ease: 'Back.easeOut'
        });
        this.tweens.add({
            targets: bubble,
            y: bubble.y - 40,
            alpha: 0,
            duration: 700,
            delay: 700,
            ease: 'Cubic.easeIn',
            onComplete: () => bubble.destroy()
        });

        // Big wing flap burst on the pigeon
        for (let i = 0; i < 8; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 22 + Math.random() * 16;
            const f = this.add.image(this.pigeon.x + Math.cos(a) * r, this.pigeon.y + Math.sin(a) * r, 'particle')
                .setTint(0xc7d1dc).setScale(0.7).setAlpha(0.9);
            this.tweens.add({
                targets: f,
                x: f.x + Math.cos(a) * 30,
                y: f.y + Math.sin(a) * 30 - 12,
                scale: 0.2,
                alpha: 0,
                duration: 600,
                onComplete: () => f.destroy()
            });
        }
    }

    triggerSquash (type, duration) {
        this.squashType = type;
        this.squashDuration = duration;
        this.squashRemaining = duration;
    }

    animatePigeon (body) {
        const inner = this.pigeonInner;
        if (!inner) return;

        const dt = 1 / 60;
        this.animT += dt;
        this.squashRemaining = Math.max(0, this.squashRemaining - dt);

        const onGround = this.groundContacts > 0;
        const wasOnGround = this.wasOnGroundLast;
        const moving = Math.abs(body.velocity.x) > 0.5;
        const inAir = !onGround;
        const base = this.pigeonScale;

        // ===== Whole-body squash/stretch =====
        let sx = base, sy = base;
        if (this.squashRemaining > 0) {
            const k = Math.sin((1 - this.squashRemaining / this.squashDuration) * Math.PI);
            if (this.squashType === 'stretch') {
                sx = base * (1 - 0.16 * k);
                sy = base * (1 + 0.24 * k);
            } else {
                sx = base * (1 + 0.20 * k);
                sy = base * (1 - 0.26 * k);
            }
        } else if (inAir) {
            const v = Math.max(-12, Math.min(12, body.velocity.y));
            sx = base * (1 - v * 0.004);
            sy = base * (1 + v * 0.006);
        } else if (moving) {
            const bob = Math.sin(this.animT * 14);
            sx = base * (1 - bob * 0.03);
            sy = base * (1 + bob * 0.05);
        } else {
            const breathe = Math.sin(this.animT * 2.6);
            sx = base * (1 - breathe * 0.022);
            sy = base * (1 + breathe * 0.035);
        }
        inner.scaleX = sx;
        inner.scaleY = sy;

        // ===== Tilt =====
        let targetTilt = 0;
        if (inAir) {
            const v = Math.max(-12, Math.min(12, body.velocity.y));
            targetTilt = (v * 0.016) * this.facing;
        } else if (moving) {
            targetTilt = 0.14 * this.facing;
        }
        inner.rotation += (targetTilt - inner.rotation) * 0.22;

        // ===== Funny walk (Ryan only) — drunken jiggle =====
        // Visual offset is applied to the INNER container, not the physics
        // body — purely cosmetic, doesn't fight Matter.js. Only wobbles while
        // actively walking on the ground; standing still he holds steady.
        if (this.funnyWalk) {
            if (onGround && moving) {
                inner.rotation += Math.sin(this.animT * 11) * 0.13;
                inner.x = Math.sin(this.animT * 11 * 0.55) * 5;
                inner.y = Math.sin(this.animT * 22) * 1.2;
            } else {
                inner.x = 0;
                inner.y = 0;
            }
        } else if (this._lastFunny) {
            inner.x = 0;
            inner.y = 0;
        }
        this._lastFunny = this.funnyWalk;

        // Per-part transforms reset to default each frame (no fall-over override)
        this.pigeonBody.y = -50;
        this.pigeonBody.scaleX = 1;
        this.pigeonBody.scaleY = 1;
        this.pigeonHead.x = 40;
        this.pigeonHead.rotation = 0;
        this.pigeonWing.y = -78;
        this.pigeonLegL.y = 24;
        this.pigeonLegR.y = 24;

        // ===== Legs: walking pump =====
        if (onGround && moving) {
            const swing = Math.sin(this.animT * 16) * 0.65;
            this.pigeonLegL.rotation = swing;
            this.pigeonLegR.rotation = -swing;
        } else if (inAir) {
            const dangle = Math.sin(this.animT * 6) * 0.15;
            this.pigeonLegL.rotation += (-0.25 + dangle - this.pigeonLegL.rotation) * 0.18;
            this.pigeonLegR.rotation += (0.25 - dangle - this.pigeonLegR.rotation) * 0.18;
        } else {
            this.pigeonLegL.rotation += (0 - this.pigeonLegL.rotation) * 0.2;
            this.pigeonLegR.rotation += (0 - this.pigeonLegR.rotation) * 0.2;
        }

        // ===== Wing: idle ruffle / walk twitch / mid-air struggle flap =====
        let wingTarget = 0;
        if (inAir) {
            wingTarget = Math.sin(this.animT * 26) * 0.55 + 0.85;
        } else if (moving) {
            wingTarget = Math.abs(Math.sin(this.animT * 16)) * 0.22;
        } else {
            wingTarget = Math.abs(Math.sin(this.animT * 2)) * 0.08;
        }
        this.pigeonWing.rotation += (wingTarget - this.pigeonWing.rotation) * 0.4;

        // ===== Head bob =====
        let headTargetY = this.pigeonHeadRestY;
        if (onGround && moving) {
            headTargetY -= Math.abs(Math.sin(this.animT * 16)) * 4;
        } else if (inAir) {
            headTargetY -= 2;
        }
        this.pigeonHead.y += (headTargetY - this.pigeonHead.y) * 0.3;

        // ===== Landing — quick squash + dust, no flop =====
        if (!wasOnGround && onGround) {
            this.triggerSquash('squash', 0.16);
            this.spawnLandParticles();
        }
        this.wasOnGroundLast = onGround;
    }

    createBaby (x, y) {
        this.babySpawn = { x, y };
        this.babyRescued = false;
        // Tiny baby — even smaller than before for cuteness
        this.babyDisplaySize = 30;
        const babyHeight = this.babyDisplaySize * (110 / 96);
        this.baby = this.add.image(x, y, 'baby-pigeon').setDisplaySize(this.babyDisplaySize, babyHeight);
        this.babyScale = Math.abs(this.baby.scaleX);
        // Distance from the baby image's center down to where the feet visually land.
        // Baby texture has feet around texture y=88 in a 110-tall texture; image origin
        // is centered (texture y=55), so feet are 33/110 of the displayed height below center.
        this.babyFootOffset = (33 / 110) * babyHeight;
        this.baby.setDepth(0);

        // Sensor body for collision detection — fixed at spawn, removed on rescue
        this.babySensor = this.matter.add.rectangle(x, y, this.babyDisplaySize, this.babyDisplaySize, {
            isStatic: true,
            isSensor: true,
            label: 'baby'
        });

        this.babyHalo = null;
    }

    rescueBaby (body) {
        if (!this.baby || this.babyRescued) return;
        this.babyRescued = true;
        SFX.collect();

        // Heart particle burst
        for (let i = 0; i < 7; i++) {
            const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
            const r = 18 + Math.random() * 14;
            const heart = this.add.text(
                this.baby.x + Math.cos(ang) * r,
                this.baby.y + Math.sin(ang) * r,
                '♥',
                { fontFamily: 'Arial Black', fontSize: 22, color: '#ff6b9d',
                  stroke: '#5b3a29', strokeThickness: 3 }
            ).setOrigin(0.5).setDepth(55);
            this.tweens.add({
                targets: heart,
                y: heart.y - 36 - Math.random() * 14,
                alpha: 0,
                scale: 0.4,
                duration: 800,
                onComplete: () => heart.destroy()
            });
        }

        // Fade out the halo
        if (this.babyHalo) {
            const h = this.babyHalo;
            this.babyHalo = null;
            this.tweens.add({
                targets: h,
                scale: 2.2,
                alpha: 0,
                duration: 400,
                onComplete: () => h.destroy()
            });
        }

        // Remove the sensor so we don't keep firing collisions
        if (body) this.matter.world.remove(body);
        this.babySensor = null;
    }

    updateBaby () {
        if (!this.baby) return;

        // Always record parent path so following has data when rescue triggers
        this.parentHistory.push({ x: this.pigeon.x, y: this.pigeon.y, facing: this.facing });
        if (this.parentHistory.length > 120) this.parentHistory.shift();

        if (!this.babyRescued) {
            // Stand still and stare at the big pigeon
            const dx = this.pigeon.x - this.baby.x;
            if (Math.abs(dx) > 4) {
                const dir = dx > 0 ? 1 : -1;
                this.baby.scaleX = dir * this.babyScale;
            }
            return;
        }

        // Follow parent's path with a delay
        const lag = 26; // ~0.43s at 60fps
        const idx = Math.max(0, this.parentHistory.length - lag);
        const target = this.parentHistory[idx];
        if (!target) return;

        const offsetX = -target.facing * 26;
        const tx = target.x + offsetX;
        // Align baby's feet to the parent's feet (parent body radius ≈ 22 below center)
        const parentFootY = target.y + 22;
        const ty = parentFootY - this.babyFootOffset;
        this.baby.x += (tx - this.baby.x) * 0.18;
        this.baby.y += (ty - this.baby.y) * 0.18;

        // Face direction of motion
        const dx = tx - this.baby.x;
        if (Math.abs(dx) > 0.4) {
            const dir = dx > 0 ? 1 : -1;
            this.baby.scaleX = dir * this.babyScale;
        }

        // Tiny waddle wobble
        this.baby.rotation = Math.sin(this.animT * 14) * 0.08;
    }

    spawnLandParticles () {
        for (let i = 0; i < 8; i++) {
            const ang = Math.PI + (Math.random() - 0.5) * Math.PI * 0.9;
            const dist = 18 + Math.random() * 20;
            const p = this.add.circle(this.pigeon.x, this.pigeon.y + 22, 3 + Math.random() * 3, 0xd5cdb5, 0.85);
            this.tweens.add({
                targets: p,
                x: this.pigeon.x + Math.cos(ang) * dist,
                y: this.pigeon.y + 22 - Math.sin(ang) * (4 + Math.random() * 6),
                alpha: 0,
                scale: 0.2,
                duration: 380,
                onComplete: () => p.destroy()
            });
        }
    }

    spawnJumpParticles () {
        for (let i = 0; i < 5; i++) {
            const p = this.add.circle(
                this.pigeon.x + (Math.random() - 0.5) * 20,
                this.pigeon.y + 18,
                3 + Math.random() * 3,
                0xffffff,
                0.85
            );
            this.tweens.add({
                targets: p,
                y: p.y + 18 + Math.random() * 12,
                alpha: 0,
                scale: 0.2,
                duration: 350,
                onComplete: () => p.destroy()
            });
        }
    }
}
