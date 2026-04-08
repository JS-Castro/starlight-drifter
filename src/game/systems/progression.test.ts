import {
  getDroneSpawnDelay,
  getWaveForElapsedMs
} from "./progression";

describe("progression", () => {
  it("starts at wave one", () => {
    expect(getWaveForElapsedMs(0)).toBe(1);
  });

  it("advances a wave every fifteen seconds", () => {
    expect(getWaveForElapsedMs(14999)).toBe(1);
    expect(getWaveForElapsedMs(15000)).toBe(2);
    expect(getWaveForElapsedMs(45000)).toBe(4);
  });

  it("reduces drone spawn delay with a floor", () => {
    expect(getDroneSpawnDelay(1)).toBe(1300);
    expect(getDroneSpawnDelay(4)).toBe(1015);
    expect(getDroneSpawnDelay(20)).toBe(460);
  });
});
