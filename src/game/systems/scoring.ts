export type PlayerState = {
  score: number;
  health: number;
  multiplier: number;
  gameOver: boolean;
};

export function applyCoreCollection(state: PlayerState): PlayerState {
  return {
    ...state,
    score: state.score + 10 * state.multiplier,
    health: Math.min(state.health + 4, 100),
    multiplier: Math.min(state.multiplier + 1, 6)
  };
}

export function applyDroneHit(state: PlayerState): PlayerState {
  const health = Math.max(state.health - 16, 0);

  return {
    ...state,
    health,
    gameOver: health === 0
  };
}
