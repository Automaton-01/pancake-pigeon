import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        this.cameras.main.setBackgroundColor(0x87ceeb);

        // Sun
        this.add.circle(W - 120, 110, 50, 0xfff2b0).setAlpha(0.9);

        // Ground
        const groundY = H - 50;
        const ground = this.add.rectangle(W / 2, groundY, W, 100, 0x8fbc5c);
        this.physics.add.existing(ground, true);

        // A few decorative bushes
        for (const x of [180, 540, 880]) {
            this.add.circle(x, groundY - 50, 22, 0x6fa54a);
            this.add.circle(x + 18, groundY - 60, 18, 0x6fa54a);
            this.add.circle(x - 18, groundY - 58, 18, 0x6fa54a);
        }

        // Pigeon
        this.pigeon = this.add.text(80, groundY - 80, '🐦', {
            fontSize: 64
        }).setOrigin(0.5);
        this.physics.add.existing(this.pigeon);
        this.pigeon.body.setSize(48, 48);
        this.pigeon.body.setOffset(-24, -24);
        this.pigeon.body.setCollideWorldBounds(true);
        this.physics.add.collider(this.pigeon, ground);

        // Pancake collectibles
        this.score = 0;
        const pancakeXs = [280, 420, 560, 700];
        for (const x of pancakeXs) {
            const p = this.add.text(x, groundY - 100, '🥞', {
                fontSize: 44
            }).setOrigin(0.5);
            this.physics.add.existing(p);
            p.body.allowGravity = false;
            p.body.setSize(32, 32);
            p.body.setOffset(-16, -16);

            this.tweens.add({
                targets: p,
                y: p.y - 10,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.physics.add.overlap(this.pigeon, p, () => {
                p.destroy();
                this.score += 1;
                this.scoreText.setText(`Pancakes: ${this.score}`);
            });
        }

        // Goal: giant pancake
        this.goal = this.add.text(W - 90, groundY - 110, '🥞', {
            fontSize: 160
        }).setOrigin(0.5);
        this.physics.add.existing(this.goal);
        this.goal.body.allowGravity = false;
        this.goal.body.setSize(130, 130);
        this.goal.body.setOffset(-65, -65);

        this.tweens.add({
            targets: this.goal,
            scale: 1.05,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.physics.add.overlap(this.pigeon, this.goal, () => {
            this.scene.start('GameOver', { score: this.score });
        });

        // UI
        this.scoreText = this.add.text(20, 20, 'Pancakes: 0', {
            fontFamily: 'Arial Black', fontSize: 28, color: '#ffffff',
            stroke: '#000000', strokeThickness: 5
        });

        this.add.text(W / 2, 30, 'Reach the GIANT pancake!', {
            fontFamily: 'Arial Black', fontSize: 26, color: '#ffffff',
            stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5, 0);

        this.add.text(W / 2, H - 18, '← →  to move    ↑ / SPACE  to jump', {
            fontFamily: 'Arial', fontSize: 18, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5, 1);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey('SPACE');
    }

    update ()
    {
        const speed = 220;
        const jump = -480;
        const body = this.pigeon.body;

        if (this.cursors.left.isDown) {
            body.setVelocityX(-speed);
            this.pigeon.setScale(-1, 1);
        } else if (this.cursors.right.isDown) {
            body.setVelocityX(speed);
            this.pigeon.setScale(1, 1);
        } else {
            body.setVelocityX(0);
        }

        const onGround = body.blocked.down || body.touching.down;
        const wantsJump = this.cursors.up.isDown || this.spaceKey.isDown;
        if (wantsJump && onGround) {
            body.setVelocityY(jump);
        }
    }
}
