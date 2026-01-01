'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { OrbitControls, PerspectiveCamera, Environment, Float } from '@react-three/drei';
import { Structure } from './Structure';
import { useGameState } from '@/lib/game-state';
import { useTranslation } from 'react-i18next';
import { Bomb, RefreshCcw, Layout, ArrowRight, Trash2 } from 'lucide-react';
import { audioManager } from '@/lib/audio-manager';

// Simplified Renderer components
const BlastPointsRenderer = () => {
    const { blastPoints, removeBlastPoint } = useGameState();
    return (
        <group>
            {blastPoints.map((bp) => (
                <Float key={bp.id} speed={5} rotationIntensity={2} floatIntensity={0.5}>
                    <mesh position={bp.position} onClick={(e) => { e.stopPropagation(); removeBlastPoint(bp.id); }}>
                        <cylinderGeometry args={[0.08, 0.08, 0.3, 8]} />
                        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
                    </mesh>
                </Float>
            ))}
        </group>
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
            <meshStandardMaterial color="#111" roughness={1} metalness={0} opacity={0.8} transparent />
        </mesh>
    );
};

export const GameScene = () => {
    const { phase, setPhase, resetGame, score, blastPoints } = useGameState();
    const { t } = useTranslation();

    // -- SAFE AREA STYLES --
    const safeTop = { paddingTop: 'env(safe-area-inset-top, 20px)' };
    const safeBottom = { paddingBottom: 'env(safe-area-inset-bottom, 20px)' };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black' }}>

            {/* LAYER 1: 3D CANVAS */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
                <Canvas shadows dpr={[1, 2]}>
                    {/* CAMERA SETUP */}
                    <PerspectiveCamera makeDefault position={[12, 10, 15]} fov={35} />
                    <OrbitControls
                        makeDefault
                        enablePan={false}
                        autoRotate={phase === 'SCAN'}
                        autoRotateSpeed={0.5}
                        maxPolarAngle={Math.PI / 2.1}
                    />

                    {/* LIGHTING */}
                    <ambientLight intensity={0.8} />
                    <spotLight position={[15, 25, 10]} intensity={2} castShadow />
                    <Environment preset="city" />

                    {/* PHYSICS WORLD */}
                    <Suspense fallback={null}>
                        <Physics gravity={[0, -9.81, 0]}>
                            <Structure />
                            <BlastPointsRenderer />
                            <InteractiveFloor />
                        </Physics>
                    </Suspense>
                </Canvas>
            </div>

            {/* LAYER 2: UI OVERLAY (ABSOLUTE POSITIONING) */}

            {/* HEADER */}
            <div style={{ ...safeTop, position: 'absolute', top: 0, left: 0, width: '100%', paddingLeft: 20, paddingRight: 20, zIndex: 50, pointerEvents: 'none', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ pointerEvents: 'auto', marginTop: 10 }}>
                    <h1 className="text-xl font-black italic text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        BUILD & BLAST
                    </h1>
                </div>
                <div style={{ pointerEvents: 'auto', marginTop: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)' }}>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">SCORE</div>
                    <div className="text-xl font-black text-white leading-none">{score}</div>
                </div>
            </div>

            {/* MIDDLE STATUS */}
            {phase === 'BLAST_PREP' && (
                <div style={{ position: 'absolute', top: '20%', width: '100%', textAlign: 'center', zIndex: 40, pointerEvents: 'none' }}>
                    <div className="inline-block bg-red-600/30 border border-red-500/50 px-4 py-2 rounded-full backdrop-blur-md">
                        <span className="text-white text-xs font-bold uppercase tracking-widest">
                            TAP FLOOR TO PLACE TNT: {blastPoints.length}
                        </span>
                    </div>
                </div>
            )}

            {/* FOOTER BUTTONS */}
            <div style={{ ...safeBottom, position: 'absolute', bottom: 30, width: '100%', display: 'flex', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' }}>
                <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: 15, alignItems: 'center' }}>

                    {phase === 'SCAN' && (
                        <button
                            onClick={() => setPhase('BLAST_PREP')}
                            className="bg-white text-black px-10 py-5 rounded-full font-black text-lg shadow-xl active:scale-95 transition-transform flex items-center gap-2"
                        >
                            <Layout size={20} /> START SCAN
                        </button>
                    )}

                    {phase === 'BLAST_PREP' && (
                        <button
                            onClick={() => {
                                setPhase('DEMOLITION');
                                audioManager?.playSynthExplosion();
                            }}
                            disabled={blastPoints.length === 0}
                            className={`px-10 py-5 rounded-full font-black text-lg shadow-xl active:scale-95 transition-transform flex items-center gap-2 text-white ${blastPoints.length > 0 ? 'bg-red-600' : 'bg-gray-600 opacity-50'}`}
                        >
                            <Bomb size={24} /> DETONATE!
                        </button>
                    )}

                    {phase === 'DEMOLITION' && (
                        <button
                            onClick={() => setPhase('BUILD')}
                            className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full font-bold shadow-xl active:scale-95 transition-transform flex items-center gap-2"
                        >
                            <Trash2 size={20} className="text-red-400" /> FINISH CLEANUP
                        </button>
                    )}

                    {phase === 'BUILD' && (
                        <div className="flex flex-col gap-4 items-center">
                            <div className="bg-blue-600/20 border border-blue-400/30 p-6 rounded-2xl backdrop-blur-xl text-center">
                                <h2 className="text-2xl font-black text-white italic">Level Cleared!</h2>
                            </div>
                            <button
                                onClick={resetGame}
                                className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <RefreshCcw size={16} /> RESTART LEVEL
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};
