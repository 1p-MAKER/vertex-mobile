import { create } from 'zustand';

export type GamePhase = 'SCAN' | 'BLAST_PREP' | 'DEMOLITION' | 'BUILD' | 'RESULTS';

interface BlastPoint {
    position: [number, number, number];
    id: string;
}

interface GameState {
    phase: GamePhase;
    score: number;
    blastPoints: BlastPoint[];
    totalBlocks: number;
    clearedBlocks: number;
    setPhase: (phase: GamePhase) => void;
    setTotalBlocks: (count: number) => void;
    collectBlock: () => void;
    addBlastPoint: (pos: [number, number, number]) => void;
    removeBlastPoint: (id: string) => void;
    addScore: (points: number) => void;
    resetGame: () => void;
}

export const useGameState = create<GameState>((set) => ({
    phase: 'SCAN',
    score: 0,
    blastPoints: [],
    totalBlocks: 0,
    clearedBlocks: 0,
    setPhase: (phase) => {
        if (phase === 'SCAN') set({ blastPoints: [], clearedBlocks: 0, score: 0 });
        set({ phase });
    },
    setTotalBlocks: (count) => set({ totalBlocks: count }),
    collectBlock: () => set((state) => {
        const newCleared = state.clearedBlocks + 1;
        // Each block gives more points based on how many are already cleared (combo feel)
        const points = 10 + Math.floor(newCleared / 10);
        return {
            clearedBlocks: newCleared,
            score: state.score + points
        };
    }),
    addBlastPoint: (pos) => set((state) => ({
        blastPoints: [...state.blastPoints, { position: pos, id: Math.random().toString(36) }]
    })),
    removeBlastPoint: (id) => set((state) => ({
        blastPoints: state.blastPoints.filter(p => p.id !== id)
    })),
    addScore: (points) => set((state) => ({ score: state.score + points })),
    resetGame: () => set({ phase: 'SCAN', score: 0, blastPoints: [], totalBlocks: 0, clearedBlocks: 0 }),
}));
