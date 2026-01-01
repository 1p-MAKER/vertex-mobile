'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Float } from '@react-three/drei';
import { Structure } from './Structure';
import { useGameState } from '@/lib/game-state';
import { useTranslation } from 'react-i18next';
import { Bomb, RefreshCcw, Layout, PlusCircle, Trash2 } from 'lucide-react';
import { audioManager } from '@/lib/audio-manager';

const BlastPointsRenderer = () => {
    const { blastPoints, removeBlastPoint } = useGameState();
    return (
        <>
            {blastPoints.map((bp) => (
                <Float key={bp.id} speed={5} rotationIntensity={2} floatIntensity={0.5}>
                    <mesh position={bp.position} onClick={(e) => { e.stopPropagation(); removeBlastPoint(bp.id); }}>
                        <cylinderGeometry args={[0.08, 0.08, 0.3, 8]} />
                        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} />
                    </mesh>
                </Float>
            ))}
        </>
    );
};

const InteractiveFloor = () => {
    const { phase, addBlastPoint } = useGameState();
    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            onClick={(e) => {
                if (phase === 'BLAST_PREP') {
                    addBlastPoint([e.point.x, e.point.y + 0.1, e.point.z]);
                }
            }}
        >
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#111" roughness={1} metalness={0} opacity={0.5} transparent />
        </mesh>
    );
};

// Main Scene Component using Absolute Positioning for Layout Safety
export const GameScene = () => {
    const { phase, setPhase, resetGame, score, blastPoints, clearedBlocks, totalBlocks } = useGameState();
    const { t } = useTranslation();

    const clearanceRate = totalBlocks > 0 ? (clearedBlocks / totalBlocks) * 100 : 0;

    return (
        <div className="fixed inset-0 w-full h-full bg-black">

            {/* 1. Background Layer: 3D Scene */}
            <div className="absolute inset-0 z-0">
                <Canvas shadows dpr={[1, 2]}>
                    <PerspectiveCamera makeDefault position={[12, 10, 15]} fov={35} />
                    <OrbitControls
                        makeDefault
                        enablePan={false}
                        minPolarAngle={Math.PI / 6}
                        maxPolarAngle={Math.PI / 2.1}
                        autoRotate={phase === 'SCAN'}
                        autoRotateSpeed={0.5}
                    />
                    <ambientLight intensity={0.7} />
                    <spotLight position={[15, 25, 10]} angle={0.25} penumbra={1} intensity={2} castShadow />
                    <Environment preset="city" />

                    <Suspense fallback={null}>
                        <Physics gravity={[0, -9.81, 0]}>
                            <Structure />
                            <BlastPointsRenderer />
                            <InteractiveFloor />
                            <ContactShadows position={[0, 0.01, 0]} scale={15} blur={3} opacity={0.6} color="#000" />
                        </Physics>
                    </Suspense>
                </Canvas>
            </div>

            {/* 2. UI Layer: Absolute Positioning to prevent flex collapse */}

            {/* Header: Anchored Top */}
            <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-[calc(env(safe-area-inset-top)+10px)] pointer-events-none flex justify-between items-start">
                <div className="pointer-events-auto">
                    <h1 className="text-xl font-black tracking-tighter text-white uppercase italic drop-shadow-md">
                        BUILD & BLAST <span className="text-red-500">DIY</span>
                    </h1>
                    <div className="flex items-center gap-1.5 opacity-80 mt-1">
                        <div className="h-1 w-6 rounded-full bg-red-500" />
                        <span className="text-[10px] font-bold tracking-widest text-white uppercase">
                            LVL 01
                        </span>
                    </div>
                </div>

                <div className="pointer-events-auto rounded-lg bg-black/40 border border-white/10 px-3 py-1.5 backdrop-blur-md flex flex-col items-center shadow-lg">
                    <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">{t('score')}</span>
                    <span className="text-sm font-black text-white leading-none">{score}</span>
                </div>
            </div>

            {/* Middle: Clearance Rate / Messages */}
            <div className="absolute top-1/2 left-0 right-0 z-40 transform -translate-y-1/2 flex flex-col items-center pointer-events-none">
                {(phase === 'DEMOLITION' || phase === 'BUILD') && (
                    <div className="flex flex-col gap-1 w-32 mb-32 opacity-80">
                        <div className="flex justify-between items-end">
                            <span className="text-[8px] font-black text-white/60">CLEARANCE</span>
                            <span className="text-[10px] font-black text-white">{Math.floor(clearanceRate)}%</span>
                        </div>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${clearanceRate}%` }} />
                        </div>
                    </div>
                )}

                {phase === 'BLAST_PREP' && (
                    <div className="mb-32 bg-red-600/20 border border-red-500/30 px-4 py-1.5 rounded-full text-white text-[10px] font-bold tracking-widest uppercase animate-pulse backdrop-blur-md">
                        Explosives: {blastPoints.length}
                    </div>
                )}
            </div>

            {/* Footer: Anchored Bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-50 p-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pointer-events-none flex justify-center items-end">
                <div className="pointer-events-auto flex flex-col items-center gap-4">
                    {phase === 'SCAN' && (
                        <button
                            onClick={() => setPhase('BLAST_PREP')}
                            className="bg-white text-black text-sm font-black px-8 py-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 transition-transform flex items-center gap-2"
                        >
                            <Layout className="h-4 w-4" />
                            {t('phase_scan')}
                        </button>
                    )}

                    {phase === 'BLAST_PREP' && (
                        <button
                            onClick={() => {
                                setPhase('DEMOLITION');
                                audioManager?.playSynthExplosion();
                            }}
                            disabled={blastPoints.length === 0}
                            className="bg-red-600 text-white text-sm font-black px-8 py-4 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] active:scale-95 transition-transform disabled:opacity-50 disabled:grayscale flex items-center gap-2"
                        >
                            <Bomb className="h-4 w-4" />
                            {t('btn_blast')}
                        </button>
                    )}

                    {phase === 'DEMOLITION' && (
                        <button
                            onClick={() => setPhase('BUILD')}
                            className="bg-white/10 border border-white/20 text-white text-xs font-black px-8 py-3 rounded-full backdrop-blur-md active:scale-95 transition-transform flex items-center gap-2"
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            {t('btn_next')}
                        </button>
                    )}

                    {phase === 'BUILD' && (
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex gap-2">
                                <button className="bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-[10px] font-bold text-white">
                                    <PlusCircle className="h-3 w-3 inline mr-1" /> HOUSE
                                </button>
                                <button className="bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-[10px] font-bold text-white">
                                    <PlusCircle className="h-3 w-3 inline mr-1" /> TREE
                                </button>
                            </div>
                            <button onClick={resetGame} className="text-[9px] font-bold text-white/50 flex items-center gap-1">
                                <RefreshCcw className="h-3 w-3" /> RESTART
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
