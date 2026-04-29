import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { FieldScene } from './scenes/FieldScene.js';
import { DungeonScene } from './scenes/DungeonScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { GAME } from './utils/constants.js';

const config = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    gamepad: true,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [BootScene, TitleScene, FieldScene, DungeonScene, GameOverScene],
};

new Phaser.Game(config);
