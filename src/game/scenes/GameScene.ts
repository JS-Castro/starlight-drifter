import Phaser from "phaser";
import { gameEvents } from "../systems/events";
import {
  getDroneSpawnDelay,
  getWaveForElapsedMs
} from "../systems/progression";
import {
  applyCoreCollection,
  applyDroneHit
} from "../systems/scoring";

type Core = Phaser.Physics.Arcade.Image;
type Drone = Phaser.Physics.Arcade.Image;

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 640;

export class GameScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
  };

  private player!: Phaser.Physics.Arcade.Sprite;
  private stars!: Phaser.GameObjects.Group;
  private drones!: Phaser.Physics.Arcade.Group;
  private cores!: Phaser.Physics.Arcade.Group;
  private trails!: Phaser.GameObjects.Group;

  private score = 0;
  private health = 100;
  private multiplier = 1;
  private wave = 1;
  private gameOver = false;
  private lastDamageAt = 0;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private coreTimer?: Phaser.Time.TimerEvent;
  private multiplierTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super("game");
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.createBackdrop();
    this.createPlayer();
    this.createGroups();
    this.createInput();
    this.createCollisions();
    this.createTimers();
    this.emitHud();
  }

  update(time: number, delta: number): void {
    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
        this.scene.restart();
        this.scene.get("hud").scene.restart();
      }
      return;
    }

    this.handleMovement(delta);
    this.updateDrones();
    this.updateTrails();
    this.rotateStars(delta);
    this.maybeEscalateWave(time);
  }

  private createBackdrop(): void {
    this.add.rectangle(480, 320, WORLD_WIDTH, WORLD_HEIGHT, 0x040916, 1);

    this.add
      .ellipse(480, 320, 820, 520, 0x14304c, 0.18)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    this.add
      .ellipse(610, 220, 400, 220, 0x4fb6ff, 0.12)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    this.stars = this.add.group();
    for (let i = 0; i < 84; i += 1) {
      const star = this.add.image(
        Phaser.Math.Between(0, WORLD_WIDTH),
        Phaser.Math.Between(0, WORLD_HEIGHT),
        "star"
      );
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.95));
      star.setScale(Phaser.Math.FloatBetween(0.5, 1.6));
      this.stars.add(star);
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: star.alpha * 0.3 + 0.2 },
        duration: Phaser.Math.Between(1200, 2800),
        yoyo: true,
        repeat: -1
      });
    }
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(200, 320, "player");
    this.player.setDamping(true);
    this.player.setDrag(0.94);
    this.player.setMaxVelocity(340, 340);
    this.player.setSize(34, 46);
    this.player.setCollideWorldBounds(true);

    const glow = this.add.ellipse(200, 320, 72, 72, 0x67d7ff, 0.1);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    this.events.on("update", () => {
      glow.setPosition(this.player.x, this.player.y);
      glow.rotation -= 0.01;
    });
  }

  private createGroups(): void {
    this.drones = this.physics.add.group();
    this.cores = this.physics.add.group();
    this.trails = this.add.group();
  }

  private createInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE
    }) as GameScene["keys"];
  }

  private createCollisions(): void {
    this.physics.add.overlap(
      this.player,
      this.cores,
      (_player, core) => this.collectCore(core as Core),
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.drones,
      (_player, drone) => this.hitByDrone(drone as Drone),
      undefined,
      this
    );
  }

  private createTimers(): void {
    this.spawnTimer = this.time.addEvent({
      delay: getDroneSpawnDelay(this.wave),
      callback: this.spawnDrone,
      callbackScope: this,
      loop: true
    });

    this.coreTimer = this.time.addEvent({
      delay: 1700,
      callback: this.spawnCore,
      callbackScope: this,
      loop: true
    });

    this.multiplierTimer = this.time.addEvent({
      delay: 5000,
      callback: () => {
        this.multiplier = 1;
        this.emitHud();
      },
      callbackScope: this,
      loop: true
    });
  }

  private handleMovement(delta: number): void {
    const thrust = 16 + Math.min(this.wave * 0.7, 8);
    const direction = new Phaser.Math.Vector2(0, 0);

    if (this.cursors.left.isDown || this.keys.a.isDown) {
      direction.x -= 1;
    }
    if (this.cursors.right.isDown || this.keys.d.isDown) {
      direction.x += 1;
    }
    if (this.cursors.up.isDown || this.keys.w.isDown) {
      direction.y -= 1;
    }
    if (this.cursors.down.isDown || this.keys.s.isDown) {
      direction.y += 1;
    }

    if (direction.lengthSq() > 0) {
      direction.normalize().scale(thrust);
      this.player.body!.velocity.add(direction);
      this.player.rotation = Phaser.Math.Angle.Between(
        0,
        0,
        this.player.body!.velocity.x,
        this.player.body!.velocity.y
      ) + Math.PI / 2;

      if (delta > 0) {
        this.spawnTrail();
      }
    } else {
      this.player.rotation = Phaser.Math.Angle.RotateTo(
        this.player.rotation,
        0,
        0.02
      );
    }
  }

  private spawnTrail(): void {
    if (this.trails.getLength() > 90) {
      const oldest = this.trails.getFirst(true) as Phaser.GameObjects.Image | null;
      oldest?.destroy();
    }

    const trail = this.add.image(this.player.x, this.player.y + 20, "trail");
    trail.setTint(0x8ee7ff);
    trail.setAlpha(0.38);
    trail.setAngle(Phaser.Math.RadToDeg(this.player.rotation - Math.PI / 2));
    this.trails.add(trail);

    this.tweens.add({
      targets: trail,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 350,
      onComplete: () => trail.destroy()
    });
  }

  private updateTrails(): void {
    this.trails.getChildren().forEach((child) => {
      const trail = child as Phaser.GameObjects.Image;
      trail.y += 0.2;
    });
  }

  private rotateStars(delta: number): void {
    const amount = delta * 0.00002;
    this.stars.getChildren().forEach((child, index) => {
      const star = child as Phaser.GameObjects.Image;
      star.x -= 0.03 + (index % 5) * amount * 20;
      if (star.x < -10) {
        star.x = WORLD_WIDTH + 10;
        star.y = Phaser.Math.Between(0, WORLD_HEIGHT);
      }
    });
  }

  private spawnDrone(): void {
    if (this.gameOver) {
      return;
    }

    const edge = Phaser.Math.Between(0, 3);
    let x = 0;
    let y = 0;

    if (edge === 0) {
      x = Phaser.Math.Between(0, WORLD_WIDTH);
      y = -20;
    } else if (edge === 1) {
      x = WORLD_WIDTH + 20;
      y = Phaser.Math.Between(0, WORLD_HEIGHT);
    } else if (edge === 2) {
      x = Phaser.Math.Between(0, WORLD_WIDTH);
      y = WORLD_HEIGHT + 20;
    } else {
      x = -20;
      y = Phaser.Math.Between(0, WORLD_HEIGHT);
    }

    const drone = this.drones.create(x, y, "drone") as Drone;
    drone.setCircle(14);
    drone.setData("speed", Phaser.Math.Between(62, 90) + this.wave * 7);

    this.tweens.add({
      targets: drone,
      scaleX: { from: 0.88, to: 1.1 },
      scaleY: { from: 0.88, to: 1.1 },
      duration: 700,
      yoyo: true,
      repeat: -1
    });
  }

  private updateDrones(): void {
    this.drones.getChildren().forEach((child) => {
      const drone = child as Drone;
      const angle = Phaser.Math.Angle.Between(
        drone.x,
        drone.y,
        this.player.x,
        this.player.y
      );

      const speed = drone.getData("speed") as number;
      this.physics.velocityFromRotation(angle, speed, drone.body!.velocity);
      drone.rotation += 0.05;
    });
  }

  private spawnCore(): void {
    if (this.gameOver || this.cores.getLength() > 6) {
      return;
    }

    const core = this.cores.create(
      Phaser.Math.Between(100, WORLD_WIDTH - 100),
      Phaser.Math.Between(80, WORLD_HEIGHT - 80),
      "core"
    ) as Core;

    core.setCircle(10);
    core.setImmovable(true);

    this.tweens.add({
      targets: core,
      scale: { from: 0.82, to: 1.22 },
      duration: 900,
      yoyo: true,
      repeat: -1
    });
  }

  private collectCore(core: Core): void {
    core.destroy();
    const nextState = applyCoreCollection({
      score: this.score,
      health: this.health,
      multiplier: this.multiplier,
      gameOver: this.gameOver
    });

    this.score = nextState.score;
    this.health = nextState.health;
    this.multiplier = nextState.multiplier;

    this.cameras.main.shake(80, 0.002);
    this.emitHud();
  }

  private hitByDrone(drone: Drone): void {
    const now = this.time.now;
    if (now - this.lastDamageAt < 450) {
      return;
    }

    this.lastDamageAt = now;
    const nextState = applyDroneHit({
      score: this.score,
      health: this.health,
      multiplier: this.multiplier,
      gameOver: this.gameOver
    });

    this.health = nextState.health;
    this.gameOver = nextState.gameOver;
    drone.destroy();
    this.cameras.main.flash(100, 255, 120, 120, false);
    this.cameras.main.shake(140, 0.008);

    if (this.gameOver) {
      this.endGame();
    }

    this.emitHud();
  }

  private maybeEscalateWave(time: number): void {
    const nextWave = getWaveForElapsedMs(time);
    if (nextWave > this.wave) {
      this.wave = nextWave;

      if (this.spawnTimer) {
        this.spawnTimer.remove(false);
        this.spawnTimer = this.time.addEvent({
          delay: getDroneSpawnDelay(this.wave),
          callback: this.spawnDrone,
          callbackScope: this,
          loop: true
        });
      }

      this.score += 25;
      this.emitHud();
    }
  }

  private endGame(): void {
    this.gameOver = true;
    this.player.setTint(0xff8f8f);
    this.player.setVelocity(0, 0);
    this.spawnTimer?.remove(false);
    this.coreTimer?.remove(false);
    this.multiplierTimer?.remove(false);
    this.emitHud();
  }

  private emitHud(): void {
    gameEvents.emit("hud:update", {
      score: this.score,
      health: this.health,
      multiplier: this.multiplier,
      wave: this.wave,
      gameOver: this.gameOver
    });
  }
}
