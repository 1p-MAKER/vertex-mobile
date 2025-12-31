'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import { OrbitControls, PerspectiveCamera, Environment, Text, ContactShadows, Float } from '@react-three/drei';
import { Structure } from './Structure';
import { useGameState } from '@/lib/game-state';
import { useTranslation } from 'react-i18next';
import { Bomb, Play, RefreshCcw, Layout } from 'lucide-react';

export const GameScene = () => {
    const { phase, setPhase, resetGame, score } = useGameState();
    const { t } = useTranslation();

    return (
        <div className="relative h-full w-full bg-[#050505]">
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

                        <RigidBody type="fixed">
                            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                                <planeGeometry args={[200, 200]} />
                                <meshStandardMaterial color="#080808" roughness={1} metalness={0} />
                            </mesh>
                        </RigidBody>
                        <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000" />
                    </Physics>
                </Suspense>

                {/* 3D UI Tags */}
                {phase === 'BLAST_PREP' && (
                    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                        <mesh position={[0, 1, 1.6]}>
                            <sphereGeometry args={[0.2, 16, 16]} />
                            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
                        </mesh>
                    </Float>
                )}
            </Canvas>

            {/* Header UI */}
            <div className="pointer-events-none absolute inset-0 p-8 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                            BUILD & BLAST <span className="text-red-500 underline decoration-4 underline-offset-4">DIY</span>
                        </h1>
                        <div className="mt-1 flex items-center gap-2">
                            <div className="h-1.5 w-12 rounded-full bg-red-500 animate-pulse" />
                            <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">
                                {t(`phase_${phase.toLowerCase()}` as any)}
                            </p>
                        </div>
                    </div>

                    <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl flex flex-col items-center min-w-[120px]">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t('score')}</span>
                        <span className="text-3xl font-black text-white">{score.toLocaleString()}</span>
                    </div>
                </div>

                {/* Action Button */}
                <div className="pointer-events-auto flex flex-col items-center gap-6">
                    {phase === 'SCAN' && (
                        <button
                            onClick={() => setPhase('BLAST_PREP')}
                            className="group flex items-center gap-3 rounded-full bg-white px-10 py-5 text-lg font-black text-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                        >
                            <Layout className="h-5 w-5" />
                            {t('phase_scan')}
                        </button>
                    )}

                    {phase === 'BLAST_PREP' && (
                        <button
                            onClick={() => setPhase('DEMOLITION')}
                            className="group flex items-center gap-3 rounded-full bg-red-600 px-10 py-5 text-lg font-black text-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(220,38,38,0.4)]"
                        >
                            <Bomb className="h-6 w-6 animate-bounce" />
                            {t('btn_blast')}
                        </button>
                    )}

                    {phase === 'DEMOLITION' && (
                        <button
                            onClick={() => setPhase('BUILD')}
                            className="group flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-10 py-5 text-lg font-black text-white backdrop-blur-md transition-all hover:bg-white/10"
                        >
                            <Play className="h-5 w-5" />
                            {t('btn_next')}
                        </button>
                    )}

                    {phase === 'BUILD' && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-center">
                                <h2 className="text-4xl font-black text-white mb-2">BUILD PHASE READY</h2>
                                <p className="text-white/60">Construction logic coming in next update!</p>
                            </div>
                            <button
                                onClick={resetGame}
                                className="flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 font-black text-white"
                            >
                                <RefreshCcw className="h-5 w-5" />
                                RESTART
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* VFX Overlays */}
            {phase === 'DEMOLITION' && (
                <div className="pointer-events-none absolute inset-0 animate-pulse bg-red-500/5 mix-blend-overlay" />
            )}
        </div>
    );
};
