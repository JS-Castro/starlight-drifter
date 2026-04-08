import Phaser from "phaser";

export type HudSnapshot = {
  score: number;
  health: number;
  multiplier: number;
  wave: number;
  gameOver: boolean;
};

export const gameEvents = new Phaser.Events.EventEmitter();
