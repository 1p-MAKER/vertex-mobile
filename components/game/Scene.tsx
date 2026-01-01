'use client';

import React, { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Float } from '@react-three/drei';
import { Structure } from './Structure';
import { useGameState } from '@/lib/game-state';
import { useTranslation } from 'react-i18next';
import { Bomb, Play, RefreshCcw, Layout, PlusCircle, Trash2 } from 'lucide-react';
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
        <div className="relative h-[100dvh] w-screen bg-[#050505] overflow-hidden font-sans">
            {/* 3D Canvas Layer */}
            <div className="absolute inset-0 z-0">
                <Canvas shadows dpr={[1, 2]}>
                    <PerspectiveCamera makeDefault position={[10, 8, 12]} fov={35} />
                    <OrbitControls
                        makeDefault
                        enablePan={false}
                        minPolarAngle={Math.PI / 6}
                        maxPolarAngle={Math.PI / 2.1}
                        autoRotate={phase === 'SCAN'}
                        autoRotateSpeed={0.8}
                    />
                    <ambientLight intensity={0.6} />
                    <spotLight position={[15, 25, 10]} angle={0.25} penumbra={1} intensity={2} castShadow />
                    <pointLight position={[-10, 5, -10]} intensity={1.5} color="#4f46e5" />
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

            {/* UI Overlay Layer */}
            <div
                className="pointer-events-none absolute inset-0 z-50 flex flex-col justify-between p-5"
                style={{
                    paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
                    paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)'
                }}
            >
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="pointer-events-auto">
                        <h1 className="text-xl font-black tracking-tighter text-white uppercase italic leading-tight shadow-black drop-shadow-md">
                            BUILD & BLAST <span className="text-red-500 underline decoration-2 underline-offset-4">DIY</span>
                        </h1>
                        <div className="mt-1.5 flex items-center gap-1.5">
                            <div className="h-1 w-8 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[9px] font-bold tracking-[0.2em] text-white/60 uppercase">
                                LVL 01
                            </span>
                        </div>
                    </div>

                    <div className="pointer-events-auto rounded-xl border border-white/5 bg-black/40 p-3 backdrop-blur-xl flex flex-col items-center min-w-[80px] shadow-xl">
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">{t('score')}</span>
                        <span className="text-xl font-black text-white leading-none">{score.toLocaleString()}</span>
                    </div>
                </div>

                {/* Center Message */}
                <div className="flex flex-col items-center justify-center flex-1">
                    {phase === 'DEMOLITION' && (
                        <div className="pointer-events-none w-full max-w-[240px] flex flex-col items-center gap-1.5 mb-12">
                            <div className="flex w-full justify-between items-end">
                                <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Clearance</span>
                                <span className="text-sm font-black text-white italic">{Math.floor(clearanceRate)}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5 border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-red-600 to-orange-400 transition-all duration-500"
                                    style={{ width: `${clearanceRate}%` }}
                                />
                            </div>
                            <p className="text-[8px] font-bold text-blue-400 mt-2 tracking-widest uppercase animate-pulse">
                                Tap debris to collect
                            </p>
                        </div>
                    )}

                    {phase === 'BLAST_PREP' && (
                        <div className="rounded-full bg-red-600/10 border border-red-500/20 px-5 py-2 backdrop-blur-md text-white/90 font-bold text-[9px] tracking-widest uppercase mb-12 shadow-lg transition-opacity duration-300">
                            Place Dynamites ({blastPoints.length})
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="pointer-events-auto flex flex-col items-center gap-5">
                    {phase === 'SCAN' && (
                        <button
                            onClick={() => setPhase('BLAST_PREP')}
                            className="group flex items-center gap-3 rounded-full bg-white px-10 py-4 text-base font-black text-black transition-all active:scale-90 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                        >
                            <Layout className="h-5 w-5" />
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
                            className="group flex items-center gap-3 rounded-full bg-red-600 px-10 py-4 text-base font-black text-white transition-all active:scale-90 shadow-[0_0_30px_rgba(220,38,38,0.4)] disabled:opacity-20"
                        >
                            <Bomb className="h-6 w-6" />
                            {t('btn_blast')}
                        </button>
                    )}

                    {phase === 'DEMOLITION' && (
                        <button
                            onClick={() => setPhase('BUILD')}
                            className="group flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-10 py-4 text-base font-black text-white backdrop-blur-xl transition-all active:scale-90 shadow-xl"
                        >
                            <Trash2 className="h-5 w-5 text-red-500" />
                            {t('btn_next')}
                        </button>
                    )}

                    {phase === 'BUILD' && (
                        <div className="flex flex-col items-center gap-4 w-full">
                            <div className="flex gap-3 justify-center w-full">
                                <button className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-6 py-3 font-bold text-white text-xs">
                                    <PlusCircle className="h-4 w-4" />
                                    HOUSE
                                </button>
                                <button className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-6 py-3 font-bold text-white text-xs">
                                    <PlusCircle className="h-4 w-4" />
                                    TREE
                                </button>
                            </div>
                            <button
                                onClick={resetGame}
                                className="flex items-center gap-2 rounded-full bg-white/10 px-6 py-2 font-bold text-white/50 text-[10px] hover:bg-white/20 transition-all"
                            >
                                <RefreshCcw className="h-3 w-3" />
                                RESET ENGINE
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Subtle VFX Overlay */}
            {phase === 'DEMOLITION' && (
                <div className="pointer-events-none absolute inset-0 bg-red-900/5 animate-pulse" />
            )}
        </div>
    );
};
