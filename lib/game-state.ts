import { create } from 'zustand';

export type GamePhase = 'SCAN' | 'BLAST_PREP' | 'DEMOLITION' | 'BUILD';

interface BlastPoint {
    position: [number, number, number];
    id: string;
}

interface DIYItem {
    type: 'HOUSE' | 'TREE';
    position: [number, number, number];
    id: string;
}

interface GameState {
    phase: GamePhase;
    level: number;
    score: number;
    blastPoints: BlastPoint[];
    totalBlocks: number;
    clearedBlocks: number;
    builtItems: DIYItem[];
    setPhase: (phase: GamePhase) => void;
    setTotalBlocks: (count: number) => void;
    collectBlock: () => void;
    addBlastPoint: (pos: [number, number, number]) => void;
    removeBlastPoint: (id: string) => void;
    addScore: (points: number) => void;
    addBuiltItem: (type: 'HOUSE' | 'TREE', pos: [number, number, number]) => void;
    nextLevel: () => void;
    resetGame: () => void;
}

export const useGameState = create<GameState>((set) => ({
    phase: 'SCAN',
    level: 1,
    score: 0,
    blastPoints: [],
    totalBlocks: 0,
    clearedBlocks: 0,
    builtItems: [],
    setPhase: (phase) => {
        set({ phase });
    },
    setTotalBlocks: (count) => set({ totalBlocks: count }),
    collectBlock: () => set((state) => {
        const newCleared = state.clearedBlocks + 1;
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
    addBuiltItem: (type, pos) => set((state) => ({
        builtItems: [...state.builtItems, { type, position: pos, id: Math.random().toString(36) }]
    })),
    nextLevel: () => set((state) => ({
        level: state.level + 1,
        phase: 'SCAN',
        blastPoints: [],
        clearedBlocks: 0,
        // Keep score and builtItems persistent
    })),
    resetGame: () => set({
        phase: 'SCAN',
        level: 1,
        score: 0,
        blastPoints: [],
        totalBlocks: 0,
        clearedBlocks: 0,
        builtItems: []
    }),
}));
