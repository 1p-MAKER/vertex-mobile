'use client';

import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Float, Box } from '@react-three/drei';
import { Structure } from './Structure';
import { useGameState } from '@/lib/game-state';
import { useTranslation } from 'react-i18next';
import { Bomb, Play, RefreshCcw, Layout, PlusCircle } from 'lucide-react';
import * as THREE from 'three';

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
    const { phase } = useGameState();
    const [items, setItems] = useState<{ pos: [number, number, number], color: string }[]>([]);

    if (phase !== 'BUILD') return null;

    return (
        <>
            {items.map((item, i) => (
                <RigidBody key={i} position={item.pos} colliders="cuboid">
                    <Box args={[1, 1, 1]}>
                        <meshStandardMaterial color={item.color} />
                    </Box>
                </RigidBody>
            ))}
            {/* Click to build logic can be added here or via a dedicated build ghost */}
        </>
    );
}

export const GameScene = () => {
    const { phase, setPhase, resetGame, score, blastPoints } = useGameState();
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
                        <BlastPointsRenderer />
                        <DIYItems />
                        <InteractiveFloor />
                        <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000" />
                    </Physics>
                </Suspense>
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

                {/* Instruction Overlay */}
                <div className="flex justify-center flex-1 items-center">
                    {phase === 'BLAST_PREP' && (
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur-md text-white/80 animate-bounce">
                            CLICK ON FLOOR TO PLACE DYNAMITES ({blastPoints.length})
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <div className="pointer-events-auto flex flex-col items-center gap-6 pb-4">
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
                            disabled={blastPoints.length === 0}
                            className="group flex items-center gap-3 rounded-full bg-red-600 px-10 py-5 text-lg font-black text-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(220,38,38,0.4)] disabled:opacity-50 disabled:grayscale"
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
                        <div className="flex flex-col items-center gap-6">
                            <div className="text-center bg-blue-600/20 border border-blue-500/50 p-6 rounded-3xl backdrop-blur-xl">
                                <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">CLEARED!</h2>
                                <p className="text-blue-200 font-bold uppercase tracking-widest text-xs">Ready for new construction</p>
                            </div>
                            <div className="flex gap-4">
                                <button className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 font-black text-white">
                                    <PlusCircle className="h-5 w-5" />
                                    HOUSE
                                </button>
                                <button className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 font-black text-white">
                                    <PlusCircle className="h-5 w-5" />
                                    TREE
                                </button>
                            </div>
                            <button
                                onClick={resetGame}
                                className="flex items-center gap-2 rounded-full bg-white px-8 py-3 font-black text-black text-sm"
                            >
                                <RefreshCcw className="h-4 w-4" />
                                RESET GAME
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* VFX Overlays */}
            {phase === 'DEMOLITION' && (
                <div className="pointer-events-none absolute inset-0 animate-pulse bg-red-500/10 mix-blend-overlay" />
            )}
        </div>
    );
};
