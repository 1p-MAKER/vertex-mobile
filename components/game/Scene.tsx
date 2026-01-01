'use client';

import React, { Suspense, useMemo } from 'react';
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

export const GameScene = () => {
    const { phase, setPhase, resetGame, score, blastPoints, clearedBlocks, totalBlocks } = useGameState();
    const { t } = useTranslation();

    const clearanceRate = totalBlocks > 0 ? (clearedBlocks / totalBlocks) * 100 : 0;

    return (
        <div className="fixed inset-0 flex flex-col items-stretch overflow-hidden bg-black">
            {/* Background 3D View */}
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

            {/* UI Top Overlay */}
            <div className="relative z-10 flex flex-col pointer-events-none"
                style={{ paddingTop: 'env(safe-area-inset-top, 20px)' }}>
                <header className="flex justify-between items-start px-5 py-2">
                    <div className="pointer-events-auto">
                        <h1 className="text-lg font-black tracking-tighter text-white uppercase italic drop-shadow-md">
                            BUILD & BLAST <span className="text-red-500">DIY</span>
                        </h1>
                        <div className="mt-1 flex items-center gap-1.5 opacity-60">
                            <div className="h-1 w-6 rounded-full bg-red-500" />
                            <span className="text-[8px] font-bold tracking-widest text-white uppercase">
                                LVL 01
                            </span>
                        </div>
                    </div>

                    <div className="pointer-events-auto rounded-xl bg-black/50 border border-white/10 px-4 py-2 backdrop-blur-md flex flex-col items-center shadow-lg">
                        <span className="text-[7px] font-black text-white/40 uppercase tracking-widest mb-0.5">{t('score')}</span>
                        <span className="text-base font-black text-white leading-none">{score}</span>
                    </div>
                </header>
            </div>

            {/* Middle Message / Clearance Rate */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center pointer-events-none">
                {(phase === 'DEMOLITION' || phase === 'BUILD') && (
                    <div className="w-full max-w-[200px] flex flex-col gap-1.5">
                        <div className="flex justify-between items-end">
                            <span className="text-[7px] font-black text-white/50 uppercase tracking-widest">Clearance</span>
                            <span className="text-xs font-black text-white italic">{Math.floor(clearanceRate)}%</span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${clearanceRate}%` }} />
                        </div>
                    </div>
                )}

                {phase === 'BLAST_PREP' && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-full px-4 py-1.5 backdrop-blur-md text-white text-[9px] font-bold tracking-widest uppercase animate-pulse">
                        Set Explosives: {blastPoints.length}
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="relative z-10 flex flex-col items-center pb-[env(safe-area-inset-bottom,20px)] pointer-events-none">
                <div className="pointer-events-auto flex flex-col items-center gap-4 mb-8">
                    {phase === 'SCAN' && (
                        <button
                            onClick={() => setPhase('BLAST_PREP')}
                            className="bg-white text-black text-sm font-black px-8 py-3.5 rounded-full flex items-center gap-2 shadow-xl active:scale-90 transition-transform"
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
                            className="bg-red-600 text-white text-sm font-black px-8 py-3.5 rounded-full flex items-center gap-2 shadow-xl active:scale-90 transition-transform disabled:opacity-30"
                        >
                            <Bomb className="h-5 w-5" />
                            {t('btn_blast')}
                        </button>
                    )}

                    {phase === 'DEMOLITION' && (
                        <button
                            onClick={() => setPhase('BUILD')}
                            className="bg-white/10 border border-white/20 text-white text-xs font-black px-8 py-3 rounded-full flex items-center gap-2 backdrop-blur-md active:scale-90 transition-transform"
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            {t('btn_next')}
                        </button>
                    )}

                    {phase === 'BUILD' && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex gap-2">
                                <button className="bg-white/10 border border-white/10 px-5 py-2.5 rounded-xl text-[10px] font-bold text-white flex items-center gap-2">
                                    <PlusCircle className="h-3 w-3" /> HOUSE
                                </button>
                                <button className="bg-white/10 border border-white/10 px-5 py-2.5 rounded-xl text-[10px] font-bold text-white flex items-center gap-2">
                                    <PlusCircle className="h-3 w-3" /> TREE
                                </button>
                            </div>
                            <button onClick={resetGame} className="text-[10px] font-bold text-white/40 flex items-center gap-1.5">
                                <RefreshCcw className="h-3 w-3" /> RESTART
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
