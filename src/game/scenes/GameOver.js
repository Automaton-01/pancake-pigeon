import { Scene } from 'phaser';
import { LEVELS } from '../data/levels';
import { SFX, initAudio } from '../audio';

export class GameOver extends Scene
{
    constructor () {
        super('GameOver');
    }

    init (data) {
        this.levelIndex = data?.levelIndex ?? 0;
        this.stars = data?.stars ?? 1;
        this.pancakes = data?.pancakes ?? 0;
        this.totalPancakes = data?.totalPancakes ?? 0;
    }

    create () {
        initAudio();
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        this.cameras.main.setBackgroundColor(0xfff5e1);

        // Confetti background
        for (let i = 0; i < 50; i++) {
            const colors = [0xff8c42, 0xffc73c, 0x6fa54a, 0xff6b9d, 0x5b8def];
            const c = colors[Math.floor(Math.random() * colors.length)];
            const r = this.add.rectangle(
                Math.random() * W,
                -20 - Math.random() * 200,
                8, 14, c
            );
            r.rotation = Math.random() * Math.PI;
            this.tweens.add({
                targets: r,
                y: H + 40,
                rotation: r.rotation + Math.PI * 4,
                duration: 3000 + Math.random() * 2000,
                delay: Math.random() * 1500,
                repeat: -1,
                ease: 'Linear'
            });
        }

        const isLast = this.levelIndex >= LEVELS.length - 1;

        this.add.text(W/2, 90, isLast ? '🏆  ALL PANCAKES SAVED  🏆' : '🥞  LEVEL COMPLETE  🥞', {
            fontFamily: 'Arial Black', fontSize: 50, color: '#b35a1f',
            stroke: '#5b3a29', strokeThickness: 8
        }).setOrigin(0.5);

        // Stars
        const starY = H/2 - 40;
        for (let i = 0; i < 3; i++) {
            const filled = i < this.stars;
            const star = this.add.text(W/2 - 130 + i * 130, starY, filled ? '★' : '☆', {
                fontSize: 110, color: filled ? '#ffc73c' : '#bbbbbb',
                stroke: '#5b3a29', strokeThickness: 6
            }).setOrigin(0.5).setScale(0).setRotation(-0.4);
            this.tweens.add({
                targets: star,
                scale: 1,
                rotation: 0,
                duration: 380,
                delay: 250 + i * 280,
                ease: 'Back.easeOut'
            });
            if (filled) {
                this.time.delayedCall(250 + i * 280, () => SFX.star());
            }
        }

        this.add.text(W/2, H/2 + 70, `🥞  ${this.pancakes} / ${this.totalPancakes}  pancakes collected`, {
            fontFamily: 'Arial Black', fontSize: 28, color: '#5b3a29'
        }).setOrigin(0.5);

        // Buttons
        if (!isLast) {
            this.makeButton(W/2 - 170, H/2 + 180, 'NEXT LEVEL ➡️', 280, 70, 0x4caf50, () => {
                SFX.click();
                this.scene.start('Game', { levelIndex: this.levelIndex + 1 });
            });
        } else {
            this.makeButton(W/2 - 170, H/2 + 180, 'PLAY AGAIN', 280, 70, 0x4caf50, () => {
                SFX.click();
                this.scene.start('Game', { levelIndex: 0 });
            });
        }
        this.makeButton(W/2 + 170, H/2 + 180, 'LEVELS', 280, 70, 0x5b8def, () => {
            SFX.click();
            this.scene.start('LevelSelect');
        });
        this.makeButton(W/2, H/2 + 270, 'RETRY', 200, 50, 0xff8c42, () => {
            SFX.click();
            this.scene.start('Game', { levelIndex: this.levelIndex });
        });
    }

    makeButton (x, y, label, w, h, color, onClick) {
        const bg = this.add.rectangle(x, y, w, h, color).setStrokeStyle(4, 0x5b3a29);
        const txt = this.add.text(x, y, label, {
            fontFamily: 'Arial Black', fontSize: h > 60 ? 26 : 22, color: '#ffffff',
            stroke: '#5b3a29', strokeThickness: 4
        }).setOrigin(0.5);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => { bg.setScale(1.05); txt.setScale(1.05); });
        bg.on('pointerout', () => { bg.setScale(1); txt.setScale(1); });
        bg.on('pointerdown', onClick);
    }
}
