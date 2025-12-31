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
    demolitionPercent: number;
    setPhase: (phase: GamePhase) => void;
    addBlastPoint: (pos: [number, number, number]) => void;
    removeBlastPoint: (id: string) => void;
    setDemolitionPercent: (percent: number) => void;
    addScore: (points: number) => void;
    resetGame: () => void;
}

export const useGameState = create<GameState>((set) => ({
    phase: 'SCAN',
    score: 0,
    blastPoints: [],
    demolitionPercent: 0,
    setPhase: (phase) => {
        if (phase === 'SCAN') set({ blastPoints: [], demolitionPercent: 0, score: 0 });
        set({ phase });
    },
    addBlastPoint: (pos) => set((state) => ({
        blastPoints: [...state.blastPoints, { position: pos, id: Math.random().toString(36) }]
    })),
    removeBlastPoint: (id) => set((state) => ({
        blastPoints: state.blastPoints.filter(p => p.id !== id)
    })),
    setDemolitionPercent: (percent) => set({ demolitionPercent: percent, score: Math.floor(percent * 100) }),
    addScore: (points) => set((state) => ({ score: state.score + points })),
    resetGame: () => set({ phase: 'SCAN', score: 0, blastPoints: [], demolitionPercent: 0 }),
}));
