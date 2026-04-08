import Phaser from "phaser";
import { gameEvents, type HudSnapshot } from "../systems/events";

export class HudScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private multiplierText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Container;

  constructor() {
    super("hud");
  }

  create(): void {
    const panel = this.add.rectangle(170, 80, 280, 112, 0x06111e, 0.58);
    panel.setStrokeStyle(1, 0x7bc4ff, 0.25);

    this.add.text(44, 34, "STARLIGHT DRIFTER", {
      fontFamily: "Space Grotesk",
      fontSize: "20px",
      fontStyle: "700",
      color: "#eff5ff"
    });

    this.add.text(44, 58, "Harvest cores. Break the swarm.", {
      fontFamily: "Space Grotesk",
      fontSize: "12px",
      color: "#89a6c6"
    });

    this.scoreText = this.add.text(44, 96, "", {
      fontFamily: "Space Grotesk",
      fontSize: "26px",
      fontStyle: "700",
      color: "#ffffff"
    });

    this.healthText = this.add.text(760, 36, "", {
      fontFamily: "Space Grotesk",
      fontSize: "18px",
      color: "#b9d4f0"
    });

    this.multiplierText = this.add.text(760, 64, "", {
      fontFamily: "Space Grotesk",
      fontSize: "18px",
      color: "#ffd98d"
    });

    this.waveText = this.add.text(760, 92, "", {
      fontFamily: "Space Grotesk",
      fontSize: "18px",
      color: "#8fe4ff"
    });

    this.overlay = this.add.container(480, 320);
    const backdrop = this.add.rectangle(0, 0, 420, 240, 0x02060d, 0.82);
    backdrop.setStrokeStyle(1, 0xffd38c, 0.28);
    const overline = this.add.text(0, -72, "SIGNAL LOST", {
      fontFamily: "Space Grotesk",
      fontSize: "16px",
      color: "#ffb18d"
    }).setOrigin(0.5);
    const headline = this.add.text(0, -26, "Courier destroyed", {
      fontFamily: "Space Grotesk",
      fontSize: "40px",
      fontStyle: "700",
      color: "#ffffff"
    }).setOrigin(0.5);
    const hint = this.add.text(0, 34, "Press SPACE to relaunch", {
      fontFamily: "Space Grotesk",
      fontSize: "20px",
      color: "#a9c2de"
    }).setOrigin(0.5);
    const controls = this.add.text(0, 88, "Move with WASD or arrow keys", {
      fontFamily: "Space Grotesk",
      fontSize: "16px",
      color: "#6f87a0"
    }).setOrigin(0.5);

    this.overlay.add([backdrop, overline, headline, hint, controls]);
    this.overlay.setVisible(false);

    gameEvents.on("hud:update", this.handleHudUpdate, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameEvents.off("hud:update", this.handleHudUpdate, this);
    });
  }

  private handleHudUpdate(snapshot: HudSnapshot): void {
    this.scoreText.setText(`Score ${snapshot.score}`);
    this.healthText.setText(`Hull ${snapshot.health}%`);
    this.multiplierText.setText(`Chain x${snapshot.multiplier}`);
    this.waveText.setText(`Wave ${snapshot.wave}`);
    this.overlay.setVisible(snapshot.gameOver);
  }
}
