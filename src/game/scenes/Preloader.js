import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor () {
        super('Preloader');
    }

    create () {
        // Generate a small white circle texture for any future particle use
        const g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillCircle(8, 8, 8);
        g.generateTexture('particle', 16, 16);
        g.destroy();

        this.scene.start('MainMenu');
    }
}
