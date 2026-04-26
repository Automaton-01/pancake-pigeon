import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { LevelSelect } from './scenes/LevelSelect';
import { MainMenu } from './scenes/MainMenu';
import { PauseOverlay } from './scenes/PauseOverlay';
import { Preloader } from './scenes/Preloader';
import { AUTO, Game, Scale } from 'phaser';

// Portrait / landscape pick. On phones held in portrait the default 4:3
// canvas leaves huge black bars above and below; we use a much taller canvas
// so the game fills more of the screen. The bottom slice of the canvas is
// reserved as a control bar (joystick + jump) by the Game scene, so the
// gameplay view sits above the touch controls instead of being covered by
// them. Levels with a short worldHeight pad the sky above (handled in Game
// scene's setBounds).
const portrait = window.innerWidth < window.innerHeight;
const config = {
    type: AUTO,
    width: 1024,
    height: portrait ? 1620 : 768,
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
