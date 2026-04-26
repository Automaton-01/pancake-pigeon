import { Scene } from 'phaser';
import { LEVELS } from '../data/levels';
import { loadProgress, loadVariant } from '../progress';
import { staticTextureKey } from '../variants';
import { SFX, initAudio } from '../audio';

export class LevelSelect extends Scene
{
    constructor () {
        super('LevelSelect');
    }

    create () {
        initAudio();
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        this.cameras.main.setBackgroundColor(0x9bd6f5);
        this.cameras.main.fadeIn(400, 0, 0, 0);

        // Sky gradient
        const grad = this.add.graphics();
        grad.fillGradientStyle(0xb8e1f7, 0xb8e1f7, 0xfde6c0, 0xfde6c0, 1);
        grad.fillRect(0, 0, W, H - 80);

        // Sky decorations
        for (let i = 0; i < 8; i++) {
            const cx = Math.random() * W;
            const cy = 30 + Math.random() * 120;
            const cloud = this.add.container(cx, cy);
            for (const off of [[-22, 0, 22], [0, -10, 28], [22, 0, 22], [10, 6, 18]]) {
                cloud.add(this.add.circle(off[0], off[1], off[2], 0xffffff, 0.85));
            }
            this.tweens.add({
                targets: cloud,
                x: cx + (Math.random() < 0.5 ? -120 : 120),
                duration: 8000 + Math.random() * 4000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Distant hills
        const hills = this.add.graphics();
        hills.fillStyle(0x7fb55a, 0.55);
        for (let x = -200; x < W + 200; x += 280) hills.fillCircle(x, H - 80, 200);

        // Ground band with grass
        this.add.rectangle(W/2, H - 50, W, 100, 0x8fbc5c).setStrokeStyle(0);
        for (let gx = 0; gx < W; gx += 6 + Math.random() * 6) {
            const h = 9 + Math.random() * 12;
            const w = 1.4 + Math.random() * 1.4;
            const blade = this.add.rectangle(gx, H - 100, w, h,
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

        const title = this.add.text(W/2, 86, 'CHOOSE A LEVEL', {
            fontFamily: 'Arial Black', fontSize: 56, color: '#5b3a29',
            stroke: '#fff5e1', strokeThickness: 8
        }).setOrigin(0.5).setScale(0);
        this.tweens.add({ targets: title, scale: 1, duration: 400, ease: 'Back.easeOut' });

        const progress = loadProgress();
        const totalStars = Object.values(progress).reduce((a, b) => a + b, 0);
        const maxStars = LEVELS.length * 3;
        // Total-star summary
        const summary = this.add.text(W/2, 144, `★ ${totalStars} / ${maxStars} stars`, {
            fontFamily: 'Arial Black', fontSize: 22, color: '#b35a1f',
            stroke: '#fff5e1', strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: summary, alpha: 1, duration: 400, delay: 200 });

        const cardW = 260;
        const cardH = 240;
        const gap = 30;
        const totalW = LEVELS.length * cardW + (LEVELS.length - 1) * gap;
        const startX = (W - totalW) / 2 + cardW / 2;
        const cardY = H / 2 + 50;

        LEVELS.forEach((lv, i) => {
            const cx = startX + i * (cardW + gap);
            const stars = progress[lv.id] ?? 0;
            // Locked if previous level not completed (≥1 star) and not first level
            const prevStars = i === 0 ? 1 : (progress[LEVELS[i - 1].id] ?? 0);
            const locked = i > 0 && prevStars < 1;
            this.makeLevelCard(cx, cardY, cardW, cardH, lv, i, stars, locked);
        });

        // Back button
        const back = this.add.container(72, H - 35);
        const backTxt = this.add.text(0, 0, '← BACK', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#5b3a29', strokeThickness: 5
        }).setOrigin(0.5);
        back.add(backTxt);
        backTxt.setInteractive({ useHandCursor: true });
        backTxt.on('pointerover', () => back.setScale(1.08));
        backTxt.on('pointerout', () => back.setScale(1));
        backTxt.on('pointerdown', () => {
            SFX.click();
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenu'));
        });
    }

    makeLevelCard (cx, cy, w, h, level, index, stars, locked) {
        const card = this.add.container(cx, cy).setScale(0);
        const bgColor = locked ? 0xddd8c5 : 0xfff5e1;
        const bg = this.add.rectangle(0, 0, w, h, bgColor).setStrokeStyle(6, 0x5b3a29);
        const accent = this.add.rectangle(0, -h/2 + 12, w - 22, 8, locked ? 0xb0a48a : 0xffd166);
        card.add([bg, accent]);

        const numText = this.add.text(0, -h/2 + 38, `Level ${level.id}`, {
            fontFamily: 'Arial Black', fontSize: 22, color: '#5b3a29'
        }).setOrigin(0.5);
        const nameText = this.add.text(0, -h/2 + 70, level.name, {
            fontFamily: 'Arial Black', fontSize: 26, color: locked ? '#8a7a5a' : '#b35a1f'
        }).setOrigin(0.5);
        card.add([numText, nameText]);

        // Preview
        const pigeonImg = this.add.image(-60, 5, staticTextureKey(loadVariant())).setDisplaySize(64, 64);
        const arrow = this.add.text(0, 5, '→', { fontSize: 40, color: '#5b3a29', fontFamily: 'Arial Black' }).setOrigin(0.5);
        const pancakeImg = this.add.image(60, 5, 'pancake').setDisplaySize(64, 64);
        if (locked) { pigeonImg.setTint(0x888888); pancakeImg.setTint(0x888888); arrow.setColor('#888888'); }
        card.add([pigeonImg, arrow, pancakeImg]);
        // Subtle bob on preview
        this.tweens.add({ targets: pigeonImg, y: 0, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: pancakeImg, y: 0, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 200 });

        // Stars
        const starY = h/2 - 50;
        for (let i = 0; i < 3; i++) {
            const filled = i < stars;
            const star = this.add.text(-50 + i * 50, starY, filled ? '★' : '☆', {
                fontFamily: 'Arial Black',
                fontSize: 40,
                color: filled ? '#ffc73c' : '#aaaaaa',
                stroke: '#5b3a29',
                strokeThickness: filled ? 4 : 2
            }).setOrigin(0.5);
            card.add(star);
            if (filled) {
                this.tweens.add({
                    targets: star,
                    angle: 8,
                    duration: 1100 + Math.random() * 400,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        }

        // Lock overlay
        if (locked) {
            const lockBg = this.add.rectangle(0, 0, w, h, 0x2a2a2a, 0.45);
            const lockIcon = this.add.text(0, 0, '🔒', { fontFamily: 'Arial', fontSize: 60 }).setOrigin(0.5);
            card.add([lockBg, lockIcon]);
        }

        bg.setInteractive({ useHandCursor: !locked });
        if (!locked) {
            bg.on('pointerover', () => {
                bg.setFillStyle(0xffe9b8);
                card.setScale(1.06);
                this.tweens.add({ targets: pigeonImg, x: -45, duration: 280, ease: 'Sine.easeInOut' });
                this.tweens.add({ targets: pancakeImg, x: 45, duration: 280, ease: 'Sine.easeInOut' });
            });
            bg.on('pointerout', () => {
                bg.setFillStyle(bgColor);
                card.setScale(1);
                this.tweens.add({ targets: pigeonImg, x: -60, duration: 280, ease: 'Sine.easeInOut' });
                this.tweens.add({ targets: pancakeImg, x: 60, duration: 280, ease: 'Sine.easeInOut' });
            });
            bg.on('pointerdown', () => {
                SFX.click();
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('Game', { levelIndex: index });
                });
            });
        }

        // Pop-in animation, staggered
        this.tweens.add({
            targets: card,
            scale: 1,
            duration: 400,
            ease: 'Back.easeOut',
            delay: 200 + index * 80
        });
    }
}
