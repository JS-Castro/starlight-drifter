export function getWaveForElapsedMs(elapsedMs: number): number {
  return Math.floor(elapsedMs / 15000) + 1;
}

export function getDroneSpawnDelay(wave: number): number {
  return Math.max(460, 1300 - (wave - 1) * 95);
}
