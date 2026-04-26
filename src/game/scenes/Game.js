import { Scene } from 'phaser';
import { LEVELS } from '../data/levels';
import { SFX, initAudio } from '../audio';
import { saveProgress } from '../progress';

export class Game extends Scene
{
    constructor () {
        super('Game');
    }

    init (data) {
        this.levelIndex = data?.levelIndex ?? 0;
        this.level = LEVELS[this.levelIndex];
    }

    create () {
        initAudio();
        const lv = this.level;

        // World + camera
        this.matter.world.setBounds(0, -200, lv.worldWidth, lv.worldHeight + 600);
        this.cameras.main.setBounds(0, 0, lv.worldWidth, lv.worldHeight);
        this.cameras.main.setBackgroundColor(0x9bd6f5);

        // Background sky decorations
        this.createSky();

        // Static platforms
        for (const p of lv.platforms) {
            const r = this.add.rectangle(p.x, p.y, p.w, p.h, 0x6fa54a).setStrokeStyle(3, 0x4a7d2c);
            this.matter.add.gameObject(r, { isStatic: true, friction: 0.6, label: 'ground' });
            // Grass tufts on top
            for (let gx = p.x - p.w/2 + 18; gx < p.x + p.w/2 - 12; gx += 26) {
                this.add.rectangle(gx, p.y - p.h/2 - 4, 3, 9, 0x6fa54a);
            }
            // Subtle highlight on top edge
            this.add.rectangle(p.x, p.y - p.h/2 + 2, p.w - 6, 4, 0xa3d27a);
        }

        // Spike hazards
        for (const s of lv.spikes) this.createSpikes(s.x, s.y, s.w);

        // Pancake collectibles
        this.pancakeSprites = [];
        this.totalPancakes = lv.pancakes.length;
        this.collectedPancakes = 0;
        for (const pc of lv.pancakes) {
            const t = this.add.text(pc.x, pc.y, '🥞', { fontSize: 36 }).setOrigin(0.5);
            this.matter.add.gameObject(t, {
                shape: { type: 'circle', radius: 18 },
                isStatic: true,
                isSensor: true,
                label: 'pancake'
            });
            this.tweens.add({
                targets: t,
                y: pc.y - 8,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            this.pancakeSprites.push(t);
        }

        // Goal: giant pancake
        const goal = this.add.text(lv.goal.x, lv.goal.y, '🥞', { fontSize: 140 }).setOrigin(0.5);
        this.matter.add.gameObject(goal, {
            shape: { type: 'circle', radius: 60 },
            isStatic: true,
            isSensor: true,
            label: 'goal'
        });
        this.tweens.add({
            targets: goal,
            scale: 1.08,
            duration: 1100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        // Sparkle behind goal
        const sparkle = this.add.circle(lv.goal.x, lv.goal.y, 90, 0xfff2b0, 0.4);
        sparkle.setDepth(-1);
        this.tweens.add({ targets: sparkle, scale: 1.4, alpha: 0.15, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        // Pigeon player
        this.spawnPos = { x: lv.spawn.x, y: lv.spawn.y };
        this.createPigeon();

        // Drawing state
        this.drawnGroups = [];
        this.currentGraphics = null;
        this.currentPoints = null;
        this.inkUsed = 0;
        this.inkBudget = lv.inkBudget;
        this.isDrawing = false;

        this.setupInput();
        this.setupCollisions();
        this.createUI();

        this.cameras.main.startFollow(this.pigeon, true, 0.12, 0.12);
        this.cameras.main.fadeIn(300);

        this.gameOver = false;
        this.invulnerable = false;
        this.justJumped = false;
    }

    createSky () {
        const lv = this.level;
        // Sun (parallax)
        const sun = this.add.circle(160, 110, 50, 0xfff2b0).setScrollFactor(0.15);
        this.add.circle(160, 110, 70, 0xfff2b0, 0.3).setScrollFactor(0.15);
        this.tweens.add({ targets: sun, scale: 1.05, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        // Parallax clouds
        for (let i = 0; i < 10; i++) {
            const cx = Math.random() * lv.worldWidth;
            const cy = 40 + Math.random() * 220;
            const cloud = this.add.container(cx, cy);
            for (const off of [[-22, 0, 22], [0, -10, 28], [22, 0, 22], [10, 6, 18]]) {
                cloud.add(this.add.circle(off[0], off[1], off[2], 0xffffff, 0.85));
            }
            cloud.setScrollFactor(0.25 + Math.random() * 0.35);
        }

        // Distant hills
        const hillG = this.add.graphics();
        hillG.fillStyle(0x7fb55a, 0.55);
        for (let x = -200; x < lv.worldWidth + 200; x += 280) {
            hillG.fillCircle(x, lv.worldHeight - 40, 200);
        }
        hillG.setScrollFactor(0.5);
    }

    createSpikes (x, y, w) {
        const g = this.add.graphics();
        g.fillStyle(0x666666);
        g.lineStyle(2, 0x333333);
        const spikeWidth = 22;
        const count = Math.max(1, Math.floor(w / spikeWidth));
        const startX = x - w/2;
        const usedW = count * spikeWidth;
        const offsetX = startX + (w - usedW) / 2;
        for (let i = 0; i < count; i++) {
            const sx = offsetX + i * spikeWidth;
            g.fillTriangle(sx, y, sx + spikeWidth, y, sx + spikeWidth/2, y - 28);
            g.strokeTriangle(sx, y, sx + spikeWidth, y, sx + spikeWidth/2, y - 28);
        }
        // Pit floor below the spikes
        this.add.rectangle(x, y + 20, w, 40, 0x3a2818);
        // Collision sensor
        this.matter.add.rectangle(x, y - 14, w, 28, {
            isStatic: true,
            isSensor: true,
            label: 'spike'
        });
    }

    createPigeon () {
        this.pigeon = this.add.text(this.spawnPos.x, this.spawnPos.y, '🐦', {
            fontSize: 48
        }).setOrigin(0.5);
        this.matter.add.gameObject(this.pigeon, {
            shape: { type: 'circle', radius: 22 },
            inertia: Infinity,
            friction: 0.05,
            frictionStatic: 0.6,
            restitution: 0.0,
            label: 'pigeon'
        });
        this.facing = 1;
        this.groundContacts = 0;
    }

    setupInput () {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey('SPACE');
        this.cKey = this.input.keyboard.addKey('C');
        this.rKey = this.input.keyboard.addKey('R');
        this.escKey = this.input.keyboard.addKey('ESC');

        this.cKey.on('down', () => this.clearAllDrawings());
        this.rKey.on('down', () => this.fullRespawn());
        this.escKey.on('down', () => this.scene.start('LevelSelect'));

        // Drawing
        this.input.on('pointerdown', (pointer) => {
            if (this.gameOver) return;
            if (pointer.y < 80) return; // ignore UI strip
            this.startDrawing(pointer.worldX, pointer.worldY);
        });
        this.input.on('pointermove', (pointer) => {
            if (this.isDrawing) this.continueDrawing(pointer.worldX, pointer.worldY);
        });
        this.input.on('pointerup', () => {
            if (this.isDrawing) this.endDrawing();
        });
    }

    setupCollisions () {
        this.matter.world.on('collisionstart', (event) => {
            for (const pair of event.pairs) this.onCollisionPair(pair, true);
        });
        this.matter.world.on('collisionend', (event) => {
            for (const pair of event.pairs) this.onCollisionPair(pair, false);
        });
    }

    onCollisionPair (pair, started) {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        if (!labels.includes('pigeon')) return;

        const aIsPigeon = pair.bodyA.label === 'pigeon';
        const pigeonBody = aIsPigeon ? pair.bodyA : pair.bodyB;
        const otherBody = aIsPigeon ? pair.bodyB : pair.bodyA;
        const otherLabel = otherBody.label;

        if (started) {
            if (otherLabel === 'pancake') {
                this.collectPancake(otherBody);
            } else if (otherLabel === 'goal') {
                this.winLevel();
            } else if (otherLabel === 'spike') {
                this.hurt();
            } else if (otherLabel === 'ground' || otherLabel === 'drawn') {
                if (otherBody.position.y > pigeonBody.position.y + 8) {
                    this.groundContacts++;
                }
            }
        } else {
            if (otherLabel === 'ground' || otherLabel === 'drawn') {
                if (otherBody.position.y > pigeonBody.position.y + 8) {
                    this.groundContacts = Math.max(0, this.groundContacts - 1);
                }
            }
        }
    }

    collectPancake (body) {
        const sprite = body.gameObject;
        if (!sprite || sprite.collected) return;
        sprite.collected = true;
        this.collectedPancakes++;
        SFX.collect();

        // Burst tween
        this.tweens.add({
            targets: sprite,
            scale: 1.8,
            alpha: 0,
            duration: 280,
            ease: 'Cubic.easeOut',
            onComplete: () => sprite.destroy()
        });

        // Particle burst
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const dist = 40;
            const p = this.add.circle(sprite.x, sprite.y, 4, 0xffd166);
            this.tweens.add({
                targets: p,
                x: sprite.x + Math.cos(angle) * dist,
                y: sprite.y + Math.sin(angle) * dist,
                alpha: 0,
                scale: 0.2,
                duration: 400,
                onComplete: () => p.destroy()
            });
        }

        this.matter.world.remove(body);
        this.updateUI();
    }

    hurt () {
        if (this.gameOver || this.invulnerable) return;
        SFX.hurt();
        this.cameras.main.shake(220, 0.012);
        this.cameras.main.flash(180, 255, 80, 80);
        this.invulnerable = true;
        this.time.delayedCall(800, () => this.invulnerable = false);
        this.respawnPigeon();
    }

    respawnPigeon () {
        this.pigeon.setPosition(this.spawnPos.x, this.spawnPos.y);
        this.pigeon.setVelocity(0, 0);
        this.groundContacts = 0;
    }

    fullRespawn () {
        this.respawnPigeon();
        this.clearAllDrawings();
    }

    startDrawing (x, y) {
        this.isDrawing = true;
        this.currentPoints = [{ x, y }];
        this.currentGraphics = this.add.graphics();
    }

    continueDrawing (x, y) {
        const last = this.currentPoints[this.currentPoints.length - 1];
        const dx = x - last.x;
        const dy = y - last.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 8) return;
        if (this.inkUsed + dist > this.inkBudget) {
            this.endDrawing();
            return;
        }
        this.currentPoints.push({ x, y });
        this.inkUsed += dist;
        this.redrawCurrent();
        SFX.draw();
        this.updateUI();
    }

    redrawCurrent () {
        const g = this.currentGraphics;
        const pts = this.currentPoints;
        g.clear();
        // Outline (dark)
        g.lineStyle(14, 0x6b3a14, 1);
        g.beginPath();
        g.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
        g.strokePath();
        // Inner color
        g.lineStyle(10, 0xff8c42, 1);
        g.beginPath();
        g.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
        g.strokePath();
    }

    endDrawing () {
        this.isDrawing = false;
        if (!this.currentPoints || this.currentPoints.length < 2) {
            this.currentGraphics?.destroy();
            this.currentGraphics = null;
            this.currentPoints = null;
            return;
        }
        const bodies = [];
        for (let i = 1; i < this.currentPoints.length; i++) {
            const a = this.currentPoints[i - 1];
            const b = this.currentPoints[i];
            const cx = (a.x + b.x) / 2;
            const cy = (a.y + b.y) / 2;
            const len = Math.hypot(b.x - a.x, b.y - a.y);
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            const body = this.matter.add.rectangle(cx, cy, len + 2, 12, {
                isStatic: true,
                angle: angle,
                friction: 0.7,
                frictionStatic: 0.9,
                label: 'drawn'
            });
            bodies.push(body);
        }
        this.drawnGroups.push({
            graphics: this.currentGraphics,
            bodies,
            points: this.currentPoints
        });
        this.currentGraphics = null;
        this.currentPoints = null;
    }

    clearAllDrawings () {
        for (const g of this.drawnGroups) {
            g.graphics.destroy();
            for (const b of g.bodies) this.matter.world.remove(b);
        }
        this.drawnGroups = [];
        if (this.currentGraphics) this.currentGraphics.destroy();
        this.currentGraphics = null;
        this.currentPoints = null;
        this.isDrawing = false;
        this.inkUsed = 0;
        this.updateUI();
    }

    createUI () {
        const cam = this.cameras.main;
        const W = cam.width;

        // Top bar
        this.add.rectangle(W/2, 38, W, 76, 0x2a2a2a, 0.78).setScrollFactor(0).setDepth(100);

        // Level name + hint
        this.add.text(20, 14, this.level.name, {
            fontFamily: 'Arial Black', fontSize: 22, color: '#ffffff'
        }).setScrollFactor(0).setDepth(101);
        this.add.text(20, 42, this.level.hint, {
            fontFamily: 'Arial', fontSize: 14, color: '#fff5e1'
        }).setScrollFactor(0).setDepth(101);

        // Pancake counter
        this.pancakeText = this.add.text(W/2, 26, `🥞 0 / ${this.totalPancakes}`, {
            fontFamily: 'Arial Black', fontSize: 26, color: '#ffffff'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);

        // Ink bar
        const inkX = W - 250;
        this.add.text(inkX - 8, 24, 'Ink', {
            fontFamily: 'Arial Black', fontSize: 18, color: '#ffffff'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);
        this.add.rectangle(inkX, 30, 230, 22, 0x000000, 0.5)
            .setOrigin(0, 0).setStrokeStyle(2, 0xffffff).setScrollFactor(0).setDepth(101);
        this.inkBarFill = this.add.rectangle(inkX + 2, 32, 226, 18, 0xff8c42)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(102);

        // Bottom hint
        this.add.text(W/2, cam.height - 8,
            '← →  move    ↑/Space  jump    Drag  draw    C  clear    R  reset    Esc  levels',
            {
                fontFamily: 'Arial', fontSize: 14, color: '#ffffff',
                stroke: '#000000', strokeThickness: 3
            }
        ).setOrigin(0.5, 1).setScrollFactor(0).setDepth(101);
    }

    updateUI () {
        const remaining = Math.max(0, 1 - this.inkUsed / this.inkBudget);
        this.inkBarFill.width = 226 * remaining;
        this.inkBarFill.fillColor = remaining < 0.2 ? 0xff4444 : (remaining < 0.5 ? 0xffc73c : 0xff8c42);
        this.pancakeText.setText(`🥞 ${this.collectedPancakes} / ${this.totalPancakes}`);
    }

    winLevel () {
        if (this.gameOver) return;
        this.gameOver = true;
        SFX.win();

        // Big pop on goal
        this.cameras.main.flash(400, 255, 240, 200);
        this.cameras.main.shake(220, 0.006);

        const stars = this.calcStars();
        saveProgress(this.level.id, stars);

        this.time.delayedCall(900, () => {
            this.scene.start('GameOver', {
                levelIndex: this.levelIndex,
                stars,
                pancakes: this.collectedPancakes,
                totalPancakes: this.totalPancakes
            });
        });
    }

    calcStars () {
        if (this.totalPancakes === 0) return 1;
        const ratio = this.collectedPancakes / this.totalPancakes;
        if (ratio >= 1) return 3;
        if (ratio >= 0.5) return 2;
        return 1;
    }

    update () {
        if (this.gameOver) return;

        const body = this.pigeon.body;
        const speed = 4.5;
        const jumpV = -11;

        // Horizontal movement
        let vx = body.velocity.x;
        if (this.cursors.left.isDown) {
            vx = -speed;
            this.facing = -1;
            this.pigeon.setScale(-1, 1);
        } else if (this.cursors.right.isDown) {
            vx = speed;
            this.facing = 1;
            this.pigeon.setScale(1, 1);
        } else {
            vx *= 0.72;
            if (Math.abs(vx) < 0.2) vx = 0;
        }
        this.pigeon.setVelocity(vx, body.velocity.y);

        // Jump
        const wantsJump = this.cursors.up.isDown || this.spaceKey.isDown;
        if (wantsJump && this.groundContacts > 0 && !this.justJumped) {
            this.pigeon.setVelocity(vx, jumpV);
            SFX.jump();
            this.justJumped = true;
            this.spawnJumpParticles();
            this.time.delayedCall(220, () => this.justJumped = false);
        }

        // Falling out
        if (this.pigeon.y > this.level.worldHeight + 80) {
            this.hurt();
        }
    }

    spawnJumpParticles () {
        for (let i = 0; i < 5; i++) {
            const p = this.add.circle(
                this.pigeon.x + (Math.random() - 0.5) * 20,
                this.pigeon.y + 18,
                3 + Math.random() * 3,
                0xffffff,
                0.85
            );
            this.tweens.add({
                targets: p,
                y: p.y + 18 + Math.random() * 12,
                alpha: 0,
                scale: 0.2,
                duration: 350,
                onComplete: () => p.destroy()
            });
        }
    }
}
