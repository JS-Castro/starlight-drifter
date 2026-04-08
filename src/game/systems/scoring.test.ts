import {
  applyCoreCollection,
  applyDroneHit
} from "./scoring";

describe("scoring", () => {
  it("awards score, heals, and increments multiplier when collecting a core", () => {
    expect(
      applyCoreCollection({
        score: 30,
        health: 92,
        multiplier: 2,
        gameOver: false
      })
    ).toEqual({
      score: 50,
      health: 96,
      multiplier: 3,
      gameOver: false
    });
  });

  it("caps health and multiplier when collecting a core", () => {
    expect(
      applyCoreCollection({
        score: 0,
        health: 99,
        multiplier: 6,
        gameOver: false
      })
    ).toEqual({
      score: 60,
      health: 100,
      multiplier: 6,
      gameOver: false
    });
  });

  it("marks the player as game over when health reaches zero", () => {
    expect(
      applyDroneHit({
        score: 70,
        health: 12,
        multiplier: 4,
        gameOver: false
      })
    ).toEqual({
      score: 70,
      health: 0,
      multiplier: 4,
      gameOver: true
    });
  });
});
