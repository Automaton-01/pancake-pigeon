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
        this.comboBest = data?.comboBest ?? 0;
        this.deaths = data?.deaths ?? 0;
        this.elapsedMs = data?.elapsedMs ?? 0;
    }

    create () {
        initAudio();
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        this.cameras.main.setBackgroundColor(0xfff5e1);
        this.cameras.main.fadeIn(450, 255, 245, 225);

        // Confetti rain — varied colors and rotation
        const colors = [0xff8c42, 0xffc73c, 0x6fa54a, 0xff6b9d, 0x5b8def, 0xff4f8b, 0xffd166];
        for (let i = 0; i < 80; i++) {
            const c = colors[Math.floor(Math.random() * colors.length)];
            const r = this.add.rectangle(
                Math.random() * W,
                -20 - Math.random() * 200,
                6 + Math.random() * 8, 12 + Math.random() * 8, c
            );
            r.rotation = Math.random() * Math.PI;
            this.tweens.add({
                targets: r,
                y: H + 40,
                x: r.x + (Math.random() - 0.5) * 80,
                rotation: r.rotation + Math.PI * (3 + Math.random() * 4),
                duration: 3500 + Math.random() * 2500,
                delay: Math.random() * 1500,
                repeat: -1,
                ease: 'Linear'
            });
        }

        const isLast = this.levelIndex >= LEVELS.length - 1;

        // Headline banner
        const headlineText = isLast ? 'ALL PANCAKES SAVED!' : 'LEVEL COMPLETE!';
        const headline = this.add.text(W/2, 100, headlineText, {
            fontFamily: 'Arial Black', fontSize: 56, color: '#b35a1f',
            stroke: '#5b3a29', strokeThickness: 8
        }).setOrigin(0.5).setScale(0).setRotation(-0.05);
        this.tweens.add({
            targets: headline,
            scale: 1,
            rotation: 0,
            duration: 500,
            ease: 'Back.easeOut'
        });
        this.tweens.add({
            targets: headline,
            scale: 1.04,
            duration: 1100,
            yoyo: true,
            repeat: -1,
            delay: 500,
            ease: 'Sine.easeInOut'
        });

        // Trophy emoji decoration if last level
        if (isLast) {
            const trophy = this.add.text(W/2, 60, '🏆', { fontFamily: 'Arial', fontSize: 56 }).setOrigin(0.5);
            this.tweens.add({ targets: trophy, scale: 1.18, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }

        // Stars
        const starY = H/2 - 70;
        for (let i = 0; i < 3; i++) {
            const filled = i < this.stars;
            const star = this.add.text(W/2 - 130 + i * 130, starY, filled ? '★' : '☆', {
                fontFamily: 'Arial Black', fontSize: 110,
                color: filled ? '#ffc73c' : '#bbbbbb',
                stroke: '#5b3a29', strokeThickness: 6
            }).setOrigin(0.5).setScale(0).setRotation(-0.4);
            this.tweens.add({
                targets: star,
                scale: 1,
                rotation: 0,
                duration: 380,
                delay: 350 + i * 280,
                ease: 'Back.easeOut'
            });
            if (filled) {
                this.time.delayedCall(350 + i * 280, () => {
                    SFX.star();
                    // burst around the star
                    for (let k = 0; k < 10; k++) {
                        const ang = Math.random() * Math.PI * 2;
                        const dist = 32 + Math.random() * 16;
                        const sp = this.add.image(star.x, star.y, 'particle')
                            .setTint(0xffd166).setScale(0.7);
                        this.tweens.add({
                            targets: sp,
                            x: star.x + Math.cos(ang) * dist * 2.2,
                            y: star.y + Math.sin(ang) * dist * 2.2,
                            scale: 0.1,
                            alpha: 0,
                            duration: 600,
                            onComplete: () => sp.destroy()
                        });
                    }
                });
                // Continuous gentle shimmer
                this.tweens.add({
                    targets: star,
                    angle: 6,
                    duration: 1100 + Math.random() * 400,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                    delay: 1100
                });
            }
        }

        // Stats card
        const cardY = H/2 + 80;
        const cardBg = this.add.rectangle(W/2, cardY, 540, 130, 0xfff5e1, 0.95)
            .setStrokeStyle(4, 0x5b3a29).setAlpha(0);
        this.tweens.add({ targets: cardBg, alpha: 1, duration: 400, delay: 1100 });

        const stats = [
            { label: 'Pancakes', value: `${this.pancakes} / ${this.totalPancakes}` },
            { label: 'Best combo', value: this.comboBest > 1 ? `x${this.comboBest}` : '—' },
            { label: 'Deaths', value: `${this.deaths}` },
            { label: 'Time', value: this.formatTime(this.elapsedMs) }
        ];
        const statW = 540 / stats.length;
        stats.forEach((s, i) => {
            const x = W/2 - 540/2 + statW/2 + i * statW;
            const labelTxt = this.add.text(x, cardY - 24, s.label, {
                fontFamily: 'Arial', fontSize: 13, color: '#8a7a5a'
            }).setOrigin(0.5).setAlpha(0);
            const valueTxt = this.add.text(x, cardY + 6, s.value, {
                fontFamily: 'Arial Black', fontSize: 24, color: '#5b3a29'
            }).setOrigin(0.5).setAlpha(0);
            this.tweens.add({ targets: [labelTxt, valueTxt], alpha: 1, duration: 350, delay: 1200 + i * 80 });
        });

        // Buttons
        const btnY = H/2 + 200;
        if (!isLast) {
            this.makeButton(W/2 - 170, btnY, 'NEXT LEVEL ➡', 280, 70, 0x4caf50, () => {
                SFX.click();
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () =>
                    this.scene.start('Game', { levelIndex: this.levelIndex + 1 }));
            }, 1500);
        } else {
            this.makeButton(W/2 - 170, btnY, 'PLAY AGAIN', 280, 70, 0x4caf50, () => {
                SFX.click();
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () =>
                    this.scene.start('Game', { levelIndex: 0 }));
            }, 1500);
        }
        this.makeButton(W/2 + 170, btnY, 'LEVELS', 280, 70, 0x5b8def, () => {
            SFX.click();
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('LevelSelect'));
        }, 1500);
        this.makeButton(W/2, btnY + 90, 'RETRY', 200, 50, 0xff8c42, () => {
            SFX.click();
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () =>
                this.scene.start('Game', { levelIndex: this.levelIndex }));
        }, 1500);
    }

    formatTime (ms) {
        if (!ms) return '—';
        const totalS = Math.floor(ms / 1000);
        const m = Math.floor(totalS / 60);
        const s = totalS % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    makeButton (x, y, label, w, h, color, onClick, delay = 0) {
        const c = this.add.container(x, y).setAlpha(0);
        const bg = this.add.rectangle(0, 0, w, h, color).setStrokeStyle(4, 0x5b3a29);
        const txt = this.add.text(0, 0, label, {
            fontFamily: 'Arial Black', fontSize: h > 60 ? 26 : 22, color: '#ffffff',
            stroke: '#5b3a29', strokeThickness: 4
        }).setOrigin(0.5);
        c.add([bg, txt]);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => { c.setScale(1.05); bg.setStrokeStyle(4, 0xffd166); });
        bg.on('pointerout', () => { c.setScale(1); bg.setStrokeStyle(4, 0x5b3a29); });
        bg.on('pointerdown', onClick);
        this.tweens.add({ targets: c, alpha: 1, duration: 360, delay });
    }
}
