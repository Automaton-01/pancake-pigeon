import { Scene } from 'phaser';
import { LEVELS } from '../data/levels';
import { loadProgress } from '../progress';
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

        // Sky decorations
        for (let i = 0; i < 6; i++) {
            const cx = Math.random() * W;
            const cy = 30 + Math.random() * 100;
            const cloud = this.add.container(cx, cy);
            for (const off of [[-22, 0, 22], [0, -10, 28], [22, 0, 22], [10, 6, 18]]) {
                cloud.add(this.add.circle(off[0], off[1], off[2], 0xffffff, 0.85));
            }
        }

        // Ground band
        this.add.rectangle(W/2, H - 50, W, 100, 0x8fbc5c).setStrokeStyle(0);

        this.add.text(W/2, 100, 'CHOOSE A LEVEL', {
            fontFamily: 'Arial Black', fontSize: 56, color: '#5b3a29',
            stroke: '#fff5e1', strokeThickness: 8
        }).setOrigin(0.5);

        const progress = loadProgress();
        const cardW = 260;
        const cardH = 240;
        const gap = 30;
        const totalW = LEVELS.length * cardW + (LEVELS.length - 1) * gap;
        const startX = (W - totalW) / 2 + cardW / 2;
        const cardY = H / 2 + 30;

        LEVELS.forEach((lv, i) => {
            const cx = startX + i * (cardW + gap);
            const stars = progress[lv.id] ?? 0;
            this.makeLevelCard(cx, cardY, cardW, cardH, lv, i, stars);
        });

        const back = this.add.text(60, H - 35, '← BACK', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#5b3a29', strokeThickness: 5
        }).setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });
        back.on('pointerover', () => back.setScale(1.06));
        back.on('pointerout', () => back.setScale(1));
        back.on('pointerdown', () => {
            SFX.click();
            this.scene.start('MainMenu');
        });
    }

    makeLevelCard (cx, cy, w, h, level, index, stars) {
        const bg = this.add.rectangle(cx, cy, w, h, 0xfff5e1).setStrokeStyle(6, 0x5b3a29);
        bg.setInteractive({ useHandCursor: true });

        this.add.text(cx, cy - h/2 + 30, `Level ${level.id}`, {
            fontFamily: 'Arial Black', fontSize: 22, color: '#5b3a29'
        }).setOrigin(0.5);

        this.add.text(cx, cy - h/2 + 65, level.name, {
            fontFamily: 'Arial Black', fontSize: 26, color: '#b35a1f'
        }).setOrigin(0.5);

        // Big preview
        this.add.text(cx, cy + 5, '🐦  →  🥞', { fontSize: 48 }).setOrigin(0.5);

        // Stars
        const starY = cy + h/2 - 50;
        for (let i = 0; i < 3; i++) {
            const filled = i < stars;
            this.add.text(cx - 50 + i * 50, starY, filled ? '★' : '☆', {
                fontSize: 40, color: filled ? '#ffc73c' : '#aaaaaa'
            }).setOrigin(0.5);
        }

        bg.on('pointerover', () => {
            bg.setFillStyle(0xffe9b8);
            bg.setScale(1.04);
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(0xfff5e1);
            bg.setScale(1);
        });
        bg.on('pointerdown', () => {
            SFX.click();
            this.scene.start('Game', { levelIndex: index });
        });
    }
}
