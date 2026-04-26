import { Scene } from 'phaser';
import { SFX, initAudio } from '../audio';

export class MainMenu extends Scene
{
    constructor () {
        super('MainMenu');
    }

    create () {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        this.cameras.main.setBackgroundColor(0x9bd6f5);

        // Sun
        this.add.circle(W - 130, 130, 75, 0xfff2b0, 0.4);
        this.add.circle(W - 130, 130, 55, 0xfff2b0);

        // Animated clouds
        for (let i = 0; i < 5; i++) {
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

        // Ground band
        this.add.rectangle(W/2, H - 60, W, 120, 0x8fbc5c);

        // Title
        const title = this.add.text(W/2, H/2 - 150, 'PANCAKE PIGEON', {
            fontFamily: 'Arial Black', fontSize: 76, color: '#5b3a29',
            stroke: '#fff5e1', strokeThickness: 12
        }).setOrigin(0.5);
        this.tweens.add({
            targets: title,
            scale: 1.04,
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Mascot row
        const pigeon = this.add.text(W/2 - 140, H/2 - 20, '🐦', { fontSize: 110 }).setOrigin(0.5);
        const arrow = this.add.text(W/2, H/2 - 20, '➡️', { fontSize: 70 }).setOrigin(0.5);
        const pancake = this.add.text(W/2 + 140, H/2 - 20, '🥞', { fontSize: 110 }).setOrigin(0.5);
        this.tweens.add({ targets: [pigeon, pancake], y: '-=14', duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: arrow, scale: 1.18, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        this.add.text(W/2, H/2 + 60, 'A Heroic Rescue', {
            fontFamily: 'Arial', fontSize: 28, color: '#5b3a29'
        }).setOrigin(0.5);

        // Play button
        this.makeButton(W/2, H/2 + 160, 'PLAY', 280, 70, () => {
            initAudio();
            SFX.click();
            this.scene.start('LevelSelect');
        });

        this.add.text(W/2, H - 24, 'made for a sister, with love · 🐦', {
            fontFamily: 'Arial', fontSize: 16, color: '#5b3a29'
        }).setOrigin(0.5);
    }

    makeButton (x, y, label, w, h, onClick) {
        const bg = this.add.rectangle(x, y, w, h, 0xff8c42).setStrokeStyle(5, 0x5b3a29);
        const txt = this.add.text(x, y, label, {
            fontFamily: 'Arial Black', fontSize: 36, color: '#ffffff',
            stroke: '#5b3a29', strokeThickness: 5
        }).setOrigin(0.5);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => { bg.setFillStyle(0xffa566); bg.setScale(1.06); txt.setScale(1.06); });
        bg.on('pointerout', () => { bg.setFillStyle(0xff8c42); bg.setScale(1); txt.setScale(1); });
        bg.on('pointerdown', onClick);
        return bg;
    }
}
