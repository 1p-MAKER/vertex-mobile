import { create } from 'zustand';

export type GamePhase = 'SCAN' | 'BLAST_PREP' | 'DEMOLITION' | 'BUILD' | 'RESULTS';

interface GameState {
    phase: GamePhase;
    score: number;
    setPhase: (phase: GamePhase) => void;
    addScore: (points: number) => void;
    resetGame: () => void;
}

export const useGameState = create<GameState>((set) => ({
    phase: 'SCAN',
    score: 0,
    setPhase: (phase) => set({ phase }),
    addScore: (points) => set((state) => ({ score: state.score + points })),
    resetGame: () => set({ phase: 'SCAN', score: 0 }),
}));
