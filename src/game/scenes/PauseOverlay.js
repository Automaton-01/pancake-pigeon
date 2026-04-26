import { Scene } from 'phaser';
import { SFX, isMuted, setMuted } from '../audio';

export class PauseOverlay extends Scene
{
    constructor () {
        super('PauseOverlay');
    }

    init (data) {
        this.fromScene = data?.from || 'Game';
    }

    create () {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        // Backdrop
        const dim = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0).setDepth(0);
        this.tweens.add({ targets: dim, fillAlpha: 0.55, duration: 200, ease: 'Sine.easeOut' });

        // Card
        const cardW = 460, cardH = 360;
        const card = this.add.container(W/2, H/2 + 40).setDepth(1).setAlpha(0);
        const bg = this.add.rectangle(0, 0, cardW, cardH, 0xfff5e1).setStrokeStyle(6, 0x5b3a29);
        const title = this.add.text(0, -cardH/2 + 50, 'PAUSED', {
            fontFamily: 'Arial Black', fontSize: 52, color: '#5b3a29',
            stroke: '#ffd166', strokeThickness: 6
        }).setOrigin(0.5);
        card.add([bg, title]);

        this.tweens.add({
            targets: card,
            y: H/2,
            alpha: 1,
            duration: 240,
            ease: 'Back.easeOut'
        });

        const resumeBtn = this.makeBtn(0, -25, 'RESUME', 320, 60, 0x4caf50, () => this.resume());
        const muteBtn = this.makeBtn(0, 60, isMuted() ? 'UNMUTE' : 'MUTE', 320, 50, 0x5b8def, null);
        muteBtn.bg.on('pointerdown', () => {
            setMuted(!isMuted());
            muteBtn.txt.setText(isMuted() ? 'UNMUTE' : 'MUTE');
            SFX.click();
        });
        const quitBtn = this.makeBtn(0, 130, 'QUIT TO LEVELS', 320, 50, 0xff8c42, () => this.quit());
        card.add([resumeBtn, muteBtn, quitBtn]);

        // Keyboard: Esc to resume
        this.input.keyboard.on('keydown-ESC', () => this.resume());
    }

    makeBtn (x, y, label, w, h, color, onClick) {
        const c = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, w, h, color).setStrokeStyle(4, 0x5b3a29);
        const txt = this.add.text(0, 0, label, {
            fontFamily: 'Arial Black',
            fontSize: h > 55 ? 30 : 24,
            color: '#ffffff',
            stroke: '#5b3a29',
            strokeThickness: 4
        }).setOrigin(0.5);
        c.add([bg, txt]);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => { c.setScale(1.04); bg.setStrokeStyle(4, 0xffd166); });
        bg.on('pointerout', () => { c.setScale(1); bg.setStrokeStyle(4, 0x5b3a29); });
        if (onClick) bg.on('pointerdown', () => { SFX.click(); onClick(); });
        c.bg = bg;
        c.txt = txt;
        return c;
    }

    resume () {
        this.scene.resume(this.fromScene);
        // Ask the game scene to refresh its mute icon since we may have toggled
        const target = this.scene.get(this.fromScene);
        if (target && target.refreshMuteIcon) target.refreshMuteIcon();
        this.scene.stop();
    }

    quit () {
        this.scene.stop(this.fromScene);
        this.scene.start('LevelSelect');
        this.scene.stop();
    }
}
