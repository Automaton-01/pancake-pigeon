import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { LevelSelect } from './scenes/LevelSelect';
import { MainMenu } from './scenes/MainMenu';
import { PauseOverlay } from './scenes/PauseOverlay';
import { Preloader } from './scenes/Preloader';
import { AUTO, Game, Scale } from 'phaser';

// Portrait / landscape pick. On phones held in portrait the default 4:3
// canvas leaves huge black bars above and below; we match the actual viewport
// aspect ratio so the canvas fills the visible screen height. The bottom
// slice of the canvas is reserved as a control bar (joystick + jump) by the
// Game scene, so the gameplay view sits above the touch controls instead of
// being covered by them. Levels with a short worldHeight pad the sky above
// (handled in Game scene's setBounds).
const vw = window.innerWidth;
const vh = window.innerHeight;
const portrait = vw < vh;
// Cap the portrait height so pathologically tall viewports don't warp layouts.
const portraitHeight = Math.min(2400, Math.max(1280, Math.round(1024 * vh / vw)));
const config = {
    type: AUTO,
    width: 1024,
    height: portrait ? portraitHeight : 768,
    parent: 'game-container',
    backgroundColor: '#9bd6f5',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: false,
            enableSleeping: false
        }
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        LevelSelect,
        MainGame,
        GameOver,
        PauseOverlay
    ]
};

const StartGame = (parent) => new Game({ ...config, parent });

export default StartGame;
