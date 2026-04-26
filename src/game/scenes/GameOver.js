import { Scene } from 'phaser';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    init (data)
    {
        this.score = data?.score ?? 0;
    }

    create ()
    {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        this.cameras.main.setBackgroundColor(0xfff5e1);

        this.add.text(W / 2, H / 2 - 160, '🥞  YUM!  🐦', {
            fontSize: 96
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 30, 'You rescued the giant pancake!', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#5b3a29',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 + 40, `Pancakes collected: ${this.score}`, {
            fontFamily: 'Arial', fontSize: 28, color: '#5b3a29'
        }).setOrigin(0.5);

        const again = this.add.text(W / 2, H / 2 + 180, 'Click to play again', {
            fontFamily: 'Arial Black', fontSize: 32, color: '#5b3a29'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: again,
            scale: 1.08,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.input.once('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }
}
