import { Scene } from 'phaser';
import { SFX, initAudio, isMuted, setMuted } from '../audio';
import { loadVariant, saveVariant } from '../progress';
import { VARIANTS, VARIANT_ORDER, staticTextureKey } from '../variants';

export class MainMenu extends Scene
{
    constructor () {
        super('MainMenu');
    }

    create () {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        // Portrait/mobile gets larger UI so on-screen text and tap targets are
        // legible after the canvas is scaled down to phone width. The variant
        // picker uses a larger scale so the small coin slots are tappable.
        const isPortrait = H > W;
        this.uiScale = isPortrait ? 1.7 : 1;
        this.pickerScale = isPortrait ? 2.5 : 1;
        this.cameras.main.setBackgroundColor(0x9bd6f5);
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Sky gradient (lighter at top, hint of warmth lower)
        const grad = this.add.graphics();
        grad.fillGradientStyle(0xb8e1f7, 0xb8e1f7, 0xfde6c0, 0xfde6c0, 1);
        grad.fillRect(0, 0, W, H - 100);

        // Sun with rays
        const sunX = W - 130, sunY = 130;
        this.add.circle(sunX, sunY, 90, 0xfff2b0, 0.25);
        const sun = this.add.circle(sunX, sunY, 60, 0xfff2b0);
        this.tweens.add({ targets: sun, scale: 1.06, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        // Rotating rays
        const rays = this.add.graphics();
        rays.lineStyle(4, 0xfff2b0, 0.4);
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            rays.beginPath();
            rays.moveTo(Math.cos(a) * 70, Math.sin(a) * 70);
            rays.lineTo(Math.cos(a) * 110, Math.sin(a) * 110);
            rays.strokePath();
        }
        rays.x = sunX; rays.y = sunY;
        this.tweens.add({ targets: rays, rotation: Math.PI * 2, duration: 30000, repeat: -1, ease: 'Linear' });

        // Animated clouds
        for (let i = 0; i < 6; i++) {
            const cy = 50 + i * 40 + Math.random() * 30;
            const cx = Math.random() * W;
            const cloud = this.add.container(cx, cy);
            for (const off of [[-22, 0, 22], [0, -10, 28], [22, 0, 22], [10, 6, 18]]) {
                cloud.add(this.add.circle(off[0], off[1], off[2], 0xffffff, 0.85));
            }
            this.tweens.add({
                targets: cloud,
                x: cx + (Math.random() < 0.5 ? -180 : 180),
                duration: 9000 + Math.random() * 4000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Distant hills
        const hills = this.add.graphics();
        hills.fillStyle(0x7fb55a, 0.55);
        for (let x = -200; x < W + 200; x += 280) hills.fillCircle(x, H - 100, 200);

        // Ground band with grass
        this.add.rectangle(W/2, H - 60, W, 120, 0x8fbc5c);
        for (let gx = 0; gx < W; gx += 6 + Math.random() * 6) {
            const h = 9 + Math.random() * 14;
            const w = 1.4 + Math.random() * 1.5;
            const blade = this.add.rectangle(gx, H - 120, w, h,
                [0x6fa54a, 0x7eb35a, 0x8fbf5c, 0x5d8f3d][Math.floor(Math.random() * 4)]);
            blade.setOrigin(0.5, 1);
            this.tweens.add({
                targets: blade,
                angle: 8,
                duration: 900 + Math.random() * 600,
                yoyo: true,
                repeat: -1,
                delay: Math.random() * 800,
                ease: 'Sine.easeInOut'
            });
        }

        // Title — uses a smaller scaling factor than the rest of the UI so
        // "PANCAKE PIGEON" doesn't overflow the canvas width on portrait.
        const titleScale = isPortrait ? 1.25 : 1;
        const titleSize = Math.round(78 * titleScale);
        const title = this.add.text(W/2, H/2 - 160 * this.uiScale, 'PANCAKE PIGEON', {
            fontFamily: 'Arial Black', fontSize: titleSize, color: '#5b3a29',
            stroke: '#fff5e1', strokeThickness: 12
        }).setOrigin(0.5).setScale(0).setRotation(-0.05);
        this.tweens.add({
            targets: title,
            scale: 1,
            rotation: 0,
            duration: 600,
            ease: 'Back.easeOut'
        });
        this.tweens.add({
            targets: title,
            scale: 1.04,
            duration: 1400,
            yoyo: true,
            repeat: -1,
            delay: 600,
            ease: 'Sine.easeInOut'
        });

        // Mascot row — uses the currently selected variant
        this.selectedVariant = loadVariant();
        const mascotY = H/2 - 60 * this.uiScale;
        const mascotSize = Math.round(170 * this.uiScale);
        const mascotOff = 140 * this.uiScale;
        const mascotOffEnd = 150 * this.uiScale;
        this.mascotPigeon = this.add.image(W/2 - mascotOff, mascotY, staticTextureKey(this.selectedVariant))
            .setDisplaySize(mascotSize, mascotSize).setAlpha(0);
        const pigeon = this.mascotPigeon;
        const arrow = this.add.text(W/2, mascotY, '➡', {
            fontFamily: 'Arial Black', fontSize: Math.round(60 * this.uiScale), color: '#5b3a29',
            stroke: '#fff5e1', strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);
        const pancake = this.add.image(W/2 + mascotOff, mascotY, 'pancake')
            .setDisplaySize(mascotSize, mascotSize).setAlpha(0);

        this.tweens.add({ targets: pigeon, alpha: 1, x: W/2 - mascotOffEnd, duration: 600, delay: 300, ease: 'Cubic.easeOut' });
        this.tweens.add({ targets: arrow, alpha: 1, duration: 400, delay: 600 });
        this.tweens.add({ targets: pancake, alpha: 1, x: W/2 + mascotOffEnd, duration: 600, delay: 500, ease: 'Cubic.easeOut' });

        this.tweens.add({ targets: pigeon, y: '-=14', duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 900 });
        this.tweens.add({ targets: pigeon, angle: 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 900 });
        this.tweens.add({ targets: pancake, y: '-=10', duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 1100 });
        this.tweens.add({ targets: pancake, angle: -5, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 1100 });
        const pancakeBaseScale = pancake.scaleX;
        this.tweens.add({
            targets: pancake,
            scaleX: pancakeBaseScale * 1.08,
            scaleY: pancakeBaseScale * 0.94,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: 1100
        });
        this.tweens.add({ targets: arrow, scale: 1.2, x: W/2 + 14, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 800 });

        // Tagline
        const tagline = this.add.text(W/2, H/2 + 30 * this.uiScale, 'A Delicious Adventure', {
            fontFamily: 'Arial', fontSize: Math.round(26 * this.uiScale), color: '#5b3a29'
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: tagline, alpha: 1, duration: 500, delay: 700 });

        // Variant picker
        this.buildVariantPicker(W/2, H/2 + 105 * this.uiScale);

        // Play button (animates in last)
        const playBtnY = H/2 + 230 * this.uiScale;
        const playBtnW = Math.round(260 * this.uiScale);
        const playBtnH = Math.round(64 * this.uiScale);
        const playBtn = this.makeButton(W/2, playBtnY, 'PLAY', playBtnW, playBtnH, () => {
            initAudio();
            SFX.click();
            this.cameras.main.fadeOut(350, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('LevelSelect'));
        });
        playBtn.setAlpha(0);
        this.tweens.add({ targets: playBtn, alpha: 1, scale: 1, duration: 400, delay: 1000, ease: 'Back.easeOut' });
        playBtn.setScale(0.6);

        // Mute toggle in corner
        const muteSize = Math.round(44 * this.uiScale);
        const muteBtn = this.add.container(W - muteSize/2 - 12, muteSize/2 + 12);
        const muteBg = this.add.rectangle(0, 0, muteSize, muteSize, 0x000000, 0.35).setStrokeStyle(2, 0xffffff, 0.6);
        const muteTxt = this.add.text(0, 0, isMuted() ? '🔇' : '🔊', { fontFamily: 'Arial', fontSize: Math.round(22 * this.uiScale) }).setOrigin(0.5);
        muteBtn.add([muteBg, muteTxt]);
        muteBg.setInteractive({ useHandCursor: true });
        muteBg.on('pointerover', () => { muteBg.setFillStyle(0xffffff, 0.18); muteBtn.setScale(1.06); });
        muteBg.on('pointerout', () => { muteBg.setFillStyle(0x000000, 0.35); muteBtn.setScale(1); });
        muteBg.on('pointerdown', () => {
            setMuted(!isMuted());
            muteTxt.setText(isMuted() ? '🔇' : '🔊');
            SFX.click();
        });

        // Distant flying birds
        for (let i = 0; i < 4; i++) {
            this.time.delayedCall(i * 800, () => this.spawnFlyingBird());
        }
        this.time.addEvent({
            delay: 2200,
            loop: true,
            callback: () => this.spawnFlyingBird()
        });

        this.add.text(W/2, H - 24, 'made for a sister, with love', {
            fontFamily: 'Arial', fontSize: Math.round(16 * this.uiScale), color: '#5b3a29', fontStyle: 'italic'
        }).setOrigin(0.5);
    }

    buildVariantPicker (cx, cy) {
        const s = this.pickerScale;
        // "Choose your pigeon" label
        this.add.text(cx, cy - 36 * s, 'CHOOSE YOUR PIGEON', {
            fontFamily: 'Arial Black', fontSize: Math.round(14 * s), color: '#5b3a29',
            stroke: '#fff5e1', strokeThickness: 4
        }).setOrigin(0.5);

        const slotW = 70 * s;
        const startX = cx - (VARIANT_ORDER.length - 1) * slotW / 2;
        this.variantSlots = {};
        VARIANT_ORDER.forEach((id, i) => {
            const x = startX + i * slotW;
            const slot = this.makeVariantSlot(x, cy + 6 * s, id);
            this.variantSlots[id] = slot;
        });
        this.refreshVariantSelection();
    }

    makeVariantSlot (x, y, id) {
        const s = this.pickerScale;
        const variant = VARIANTS[id];
        const c = this.add.container(x, y).setAlpha(0);
        // Outer ring (highlights when selected)
        const ring = this.add.circle(0, 0, 30 * s, 0x000000, 0).setStrokeStyle(3, 0x5b3a29, 0.45);
        // Background coin
        const bg = this.add.circle(0, 0, 26 * s, 0xfff5e1, 0.95).setStrokeStyle(2, 0x5b3a29, 0.6);
        // Avatar
        const avatar = this.add.image(0, 2 * s, staticTextureKey(id)).setDisplaySize(50 * s, 50 * s);
        // Label — wrap so longer names ("Ryan (Not true king)") don't bleed into neighbors.
        const label = this.add.text(0, 36 * s, variant.name, {
            fontFamily: 'Arial Black', fontSize: Math.round(11 * s), color: '#5b3a29',
            align: 'center', wordWrap: { width: 64 * s, useAdvancedWrap: true }
        }).setOrigin(0.5, 0);

        c.add([ring, bg, avatar, label]);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => { c.setScale(1.08); });
        bg.on('pointerout', () => { c.setScale(this.selectedVariant === id ? 1.05 : 1); });
        bg.on('pointerdown', () => {
            SFX.click();
            this.selectedVariant = id;
            saveVariant(id);
            this.mascotPigeon.setTexture(staticTextureKey(id));
            this.refreshVariantSelection();
        });

        // Pop-in animation
        this.tweens.add({
            targets: c,
            alpha: 1,
            duration: 300,
            delay: 800 + VARIANT_ORDER.indexOf(id) * 70,
            ease: 'Cubic.easeOut'
        });

        c.ring = ring;
        c.bg = bg;
        return c;
    }

    refreshVariantSelection () {
        for (const id of VARIANT_ORDER) {
            const slot = this.variantSlots[id];
            if (!slot) continue;
            const isSel = this.selectedVariant === id;
            slot.ring.setStrokeStyle(3, isSel ? 0xffd166 : 0x5b3a29, isSel ? 0.95 : 0.45);
            slot.bg.setFillStyle(isSel ? 0xfff7ce : 0xfff5e1, 0.95);
            slot.setScale(isSel ? 1.05 : 1);
        }
    }

    spawnFlyingBird () {
        const W = this.cameras.main.width;
        const dir = Math.random() < 0.5 ? 1 : -1;
        const startX = dir > 0 ? -50 : W + 50;
        const endX = dir > 0 ? W + 50 : -50;
        const y = 50 + Math.random() * 220;
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
        if (dir < 0) bird.scaleX = -1;
        this.tweens.add({
            targets: bird,
            scaleY: 0.45,
            duration: 220 + Math.random() * 80,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        this.tweens.add({
            targets: bird,
            x: endX,
            y: y + (Math.random() - 0.5) * 50,
            duration: 9000 + Math.random() * 5000,
            ease: 'Sine.easeInOut',
            onComplete: () => bird.destroy()
        });
    }

    makeButton (x, y, label, w, h, onClick) {
        const c = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, w, h, 0xff8c42).setStrokeStyle(5, 0x5b3a29);
        const txt = this.add.text(0, 0, label, {
            fontFamily: 'Arial Black', fontSize: Math.round(36 * this.uiScale), color: '#ffffff',
            stroke: '#5b3a29', strokeThickness: 5
        }).setOrigin(0.5);
        c.add([bg, txt]);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => { bg.setFillStyle(0xffa566); c.setScale(1.06); });
        bg.on('pointerout', () => { bg.setFillStyle(0xff8c42); c.setScale(1); });
        bg.on('pointerdown', onClick);
        return c;
    }
}
