'use client';

import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Float, Box } from '@react-three/drei';
import { Structure } from './Structure';
import { useGameState } from '@/lib/game-state';
import { useTranslation } from 'react-i18next';
import { Bomb, Play, RefreshCcw, Layout, PlusCircle, Trash2 } from 'lucide-react';
import * as THREE from 'three';
import { audioManager } from '@/lib/audio-manager';

const BlastPointsRenderer = () => {
    const { blastPoints, removeBlastPoint } = useGameState();
    return (
        <>
            {blastPoints.map((bp) => (
                <Float key={bp.id} speed={5} rotationIntensity={2} floatIntensity={0.5}>
                    <mesh position={bp.position} onClick={(e) => { e.stopPropagation(); removeBlastPoint(bp.id); }}>
                        <cylinderGeometry args={[0.1, 0.1, 0.4, 8]} />
                        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
                    </mesh>
                </Float>
            ))}
        </>
    );
};

const InteractiveFloor = () => {
    const { phase, addBlastPoint } = useGameState();
    return (
        <RigidBody type="fixed">
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
                onClick={(e) => {
                    if (phase === 'BLAST_PREP') {
                        addBlastPoint([e.point.x, e.point.y + 0.2, e.point.z]);
                    }
                }}
            >
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#080808" roughness={1} metalness={0} />
            </mesh>
        </RigidBody>
    );
};

const DIYItems = () => {
    return null;
}

export const GameScene = () => {
    const { phase, setPhase, resetGame, score, blastPoints, clearedBlocks, totalBlocks } = useGameState();
    const { t } = useTranslation();

    const clearanceRate = totalBlocks > 0 ? (clearedBlocks / totalBlocks) * 100 : 0;

    return (
        <div className="relative h-screen w-screen bg-[#050505] overflow-hidden">
            {/* 3D Layer */}
            <div className="absolute inset-0 z-0">
                <Canvas shadows dpr={[1, 2]}>
                    <PerspectiveCamera makeDefault position={[12, 12, 15]} fov={40} />
                    <OrbitControls
                        makeDefault
                        enablePan={false}
                        minPolarAngle={Math.PI / 6}
                        maxPolarAngle={Math.PI / 2.2}
                        autoRotate={phase === 'SCAN'}
                        autoRotateSpeed={0.5}
                    />
                    <ambientLight intensity={0.4} />
                    <spotLight position={[20, 30, 10]} angle={0.2} penumbra={1} intensity={3} castShadow />
                    <pointLight position={[-10, 10, -10]} intensity={1} color="#6366f1" />
                    <Environment preset="city" />
                    <Suspense fallback={null}>
                        <Physics gravity={[0, -9.81, 0]}>
                            <Structure />
                            <BlastPointsRenderer />
                            <DIYItems />
                            <InteractiveFloor />
                            <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000" />
                        </Physics>
                    </Suspense>
                </Canvas>
            </div>

            {/* UI Layer - Forced to front with z-50 and safe-area padding */}
            <div
                className="pointer-events-none absolute inset-0 z-50 flex flex-col justify-between p-6"
                style={{
                    paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
                    paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)'
                }}
            >
                {/* Header Section */}
                <div className="flex justify-between items-start pointer-events-none">
                    <div className="pointer-events-auto">
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">
                            BUILD & BLAST <span className="text-red-500 underline decoration-4 underline-offset-4">DIY</span>
                        </h1>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 w-10 rounded-full bg-red-500 animate-pulse" />
                            <p className="text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase">
                                {t(`phase_${phase.toLowerCase()}` as any)}
                            </p>
                        </div>
                    </div>

                    <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-xl flex flex-col items-center min-w-[100px] shadow-2xl">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">{t('score')}</span>
                        <span className="text-2xl font-black text-white leading-none">{score.toLocaleString()}</span>
                    </div>
                </div>

                {/* Progress Bar (Visible in Demolition/Build) */}
                {(phase === 'DEMOLITION' || phase === 'BUILD') && (
                    <div className="pointer-events-none w-full flex flex-col items-center gap-2 mb-auto mt-8">
                        <div className="flex w-full max-w-xs justify-between items-end mb-1">
                            <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">Clearance</span>
                            <span className="text-lg font-black text-white italic">{Math.floor(clearanceRate)}%</span>
                        </div>
                        <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10 border border-white/5 shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 transition-all duration-700 ease-out"
                                style={{ width: `${clearanceRate}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Instruction & Interaction Area */}
                <div className="flex flex-col items-center gap-6">
                    <div className="pointer-events-none mb-4 min-h-[40px]">
                        {phase === 'BLAST_PREP' && (
                            <div className="rounded-full bg-red-600/20 border border-red-500/30 px-6 py-2 backdrop-blur-md text-white font-bold text-xs tracking-widest uppercase animate-bounce shadow-lg">
                                TAP FLOOR TO PLACE DYNAMITES ({blastPoints.length})
                            </div>
                        )}
                        {phase === 'DEMOLITION' && clearedBlocks === 0 && (
                            <div className="rounded-full bg-blue-600/20 border border-blue-500/30 px-6 py-2 backdrop-blur-md text-blue-400 font-bold text-[10px] tracking-[0.2em] uppercase animate-pulse shadow-lg">
                                TAP DEBRIS TO COLLECT RAW MATERIALS
                            </div>
                        )}
                    </div>

                    <div className="pointer-events-auto flex flex-col items-center gap-4">
                        {phase === 'SCAN' && (
                            <button
                                onClick={() => setPhase('BLAST_PREP')}
                                className="group flex items-center gap-3 rounded-full bg-white px-12 py-5 text-xl font-black text-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.3)]"
                            >
                                <Layout className="h-6 w-6" />
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
                                className="group flex items-center gap-3 rounded-full bg-red-600 px-12 py-5 text-xl font-black text-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(220,38,38,0.5)] disabled:opacity-30 disabled:grayscale"
                            >
                                <Bomb className="h-7 w-7 animate-bounce" />
                                {t('btn_blast')}
                            </button>
                        )}

                        {phase === 'DEMOLITION' && (
                            <button
                                onClick={() => setPhase('BUILD')}
                                className="group flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-12 py-5 text-xl font-black text-white backdrop-blur-xl transition-all hover:bg-white/20 shadow-2xl"
                            >
                                <Trash2 className="h-6 w-6" />
                                {t('phase_demolition')}
                            </button>
                        )}

                        {phase === 'BUILD' && (
                            <div className="flex flex-col items-center gap-6">
                                <div className="text-center bg-blue-600/20 border border-blue-500/30 p-8 rounded-[40px] backdrop-blur-2xl shadow-2xl">
                                    <h2 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase italic leading-none">CLEARED!</h2>
                                    <p className="text-blue-300 font-bold uppercase tracking-[0.3em] text-[10px] opacity-80">Construction mode active</p>
                                </div>
                                <div className="flex gap-4">
                                    <button className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-black text-white hover:bg-white/10 transition-all shadow-xl">
                                        <PlusCircle className="h-5 w-5" />
                                        HOUSE
                                    </button>
                                    <button className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-black text-white hover:bg-white/10 transition-all shadow-xl">
                                        <PlusCircle className="h-5 w-5" />
                                        TREE
                                    </button>
                                </div>
                                <button
                                    onClick={resetGame}
                                    className="mt-4 flex items-center gap-2 rounded-full bg-white px-8 py-3 font-black text-black text-xs hover:bg-gray-200 transition-all shadow-lg"
                                >
                                    <RefreshCcw className="h-3 w-3" />
                                    RESTART
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
