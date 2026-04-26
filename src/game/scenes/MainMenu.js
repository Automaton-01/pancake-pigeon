import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        this.cameras.main.setBackgroundColor(0x87ceeb);

        this.add.text(W / 2, H / 2 - 160, 'PANCAKE PIGEON', {
            fontFamily: 'Arial Black', fontSize: 72, color: '#5b3a29',
            stroke: '#fff5e1', strokeThickness: 10,
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 40, '🐦  ➡️  🥞', {
            fontSize: 96
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 + 60, 'A Heroic Rescue', {
            fontFamily: 'Arial', fontSize: 28, color: '#5b3a29'
        }).setOrigin(0.5);

        const start = this.add.text(W / 2, H / 2 + 200, 'Click to start', {
            fontFamily: 'Arial Black', fontSize: 36, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        this.tweens.add({
            targets: start,
            scale: 1.08,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.input.once('pointerdown', () => {
            this.scene.start('Game');
        });
    }
}
