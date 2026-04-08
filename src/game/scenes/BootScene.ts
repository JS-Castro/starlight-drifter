import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    this.createTextures();
    this.scene.start("game");
    this.scene.start("hud");
  }

  private createTextures(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    graphics.clear();
    graphics.fillStyle(0x7ae3ff, 1);
    graphics.fillTriangle(32, 4, 56, 60, 32, 48);
    graphics.fillTriangle(32, 4, 8, 60, 32, 48);
    graphics.fillStyle(0xffc857, 1);
    graphics.fillTriangle(18, 58, 32, 48, 28, 64);
    graphics.fillTriangle(46, 58, 32, 48, 36, 64);
    graphics.generateTexture("player", 64, 64);

    graphics.clear();
    graphics.fillStyle(0xff6b6b, 1);
    graphics.fillCircle(18, 18, 18);
    graphics.fillStyle(0x1a2238, 1);
    graphics.fillCircle(18, 18, 7);
    graphics.lineStyle(3, 0xff9b9b, 1);
    graphics.strokeCircle(18, 18, 18);
    graphics.generateTexture("drone", 36, 36);

    graphics.clear();
    graphics.fillStyle(0xffd166, 1);
    graphics.fillCircle(14, 14, 10);
    graphics.lineStyle(2, 0xfff1a8, 1);
    graphics.strokeCircle(14, 14, 12);
    graphics.generateTexture("core", 28, 28);

    graphics.clear();
    graphics.fillStyle(0x8ad7ff, 1);
    graphics.fillCircle(3, 3, 3);
    graphics.generateTexture("star", 6, 6);

    graphics.clear();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 6, 2);
    graphics.generateTexture("trail", 6, 2);

    graphics.destroy();
  }
}
