'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { OrbitControls, PerspectiveCamera, Environment, Float } from '@react-three/drei';
import { Structure } from './Structure';
import { useGameState } from '@/lib/game-state';
import { useTranslation } from 'react-i18next';
import { Bomb, RefreshCcw, Layout, ArrowRight, Trash2, PlusCircle } from 'lucide-react';
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
    const { phase, addBlastPoint, addBuiltItem, score, addScore } = useGameState();

    return (
        <group>
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
                onClick={(e) => {
                    if (phase === 'BLAST_PREP') {
                        addBlastPoint([e.point.x, e.point.y + 0.1, e.point.z]);
                    } else if (phase === 'BUILD' && (window as any).selectedDIY) {
                        const type = (window as any).selectedDIY;
                        const cost = type === 'HOUSE' ? 500 : 200;
                        if (score >= cost) {
                            addBuiltItem(type, [e.point.x, 0, e.point.z]);
                            addScore(-cost);
                            audioManager?.playSound('pop', 0.5, 0.8);
                        }
                    }
                }}
            >
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#111" roughness={1} metalness={0} opacity={0.8} transparent />
            </mesh>
            {phase === 'BUILD' && (
                <gridHelper args={[20, 20, 0x333333, 0x111111]} position={[0, 0.01, 0]} />
            )}
        </group>
    );
};

export const GameScene = () => {
    const { phase, setPhase, nextLevel, resetGame, score, blastPoints, level, clearedBlocks, totalBlocks } = useGameState();
    const { t } = useTranslation();
    const [selectedDIY, setSelectedDIY] = useState<'HOUSE' | 'TREE' | null>(null);

    // Communicate to R3F layer
    useEffect(() => {
        (window as any).selectedDIY = selectedDIY;
    }, [selectedDIY]);

    const clearanceRate = totalBlocks > 0 ? (clearedBlocks / totalBlocks) * 100 : 0;

    // -- SAFE AREA STYLES --
    const safeTop = { paddingTop: 'env(safe-area-inset-top, 20px)' };
    const safeBottom = { paddingBottom: 'env(safe-area-inset-bottom, 20px)' };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black', fontFamily: '-apple-system, system-ui, sans-serif' }}>

            {/* LAYER 1: 3D CANVAS */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
                <Canvas shadows dpr={[1, 2]}>
                    <PerspectiveCamera makeDefault position={[12, 10, 15]} fov={35} />
                    <OrbitControls
                        makeDefault
                        enablePan={false}
                        autoRotate={phase === 'SCAN'}
                        autoRotateSpeed={0.5}
                        maxPolarAngle={Math.PI / 2.1}
                    />
                    <ambientLight intensity={0.8} />
                    <spotLight position={[15, 25, 10]} intensity={2} castShadow />
                    <Environment preset="city" />

                    <Suspense fallback={null}>
                        <Physics gravity={[0, -9.81, 0]}>
                            <Structure />
                            <BlastPointsRenderer />
                            <InteractiveFloor />
                        </Physics>
                    </Suspense>
                </Canvas>
            </div>

            {/* LAYER 2: UI OVERLAY */}

            {/* HEADER */}
            <div style={{ ...safeTop, position: 'absolute', top: 0, left: 0, width: '100%', paddingLeft: 20, paddingRight: 20, zIndex: 50, pointerEvents: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ pointerEvents: 'auto', marginTop: 10 }}>
                    <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 900, fontStyle: 'italic', color: 'white', textTransform: 'uppercase', letterSpacing: '-1px' }}>
                        BUILD & BLAST <span style={{ color: '#ef4444' }}>DIY</span>
                    </h1>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 2, letterSpacing: '2px' }}>
                        LEVEL {String(level).padStart(2, '0')}
                    </div>
                </div>
                <div style={{ pointerEvents: 'auto', marginTop: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: '8px 15px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>BUDGET</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'white', lineHeight: 1 }}>${score}</div>
                </div>
            </div>

            {/* TOP INFO (Clearance) */}
            {(phase === 'DEMOLITION' || phase === 'BUILD') && (
                <div style={{ position: 'absolute', top: '15%', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 40, pointerEvents: 'none' }}>
                    <div style={{ width: '120px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
                            <span style={{ fontSize: '8px', fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>CLEARED</span>
                            <span style={{ fontSize: '10px', fontWeight: 900, color: 'white' }}>{Math.floor(clearanceRate)}%</span>
                        </div>
                        <div style={{ height: '3px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${clearanceRate}%`, backgroundColor: '#f97316', transition: 'width 0.3s' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* INSTRUCTIONS */}
            <div style={{ position: 'absolute', top: '50%', width: '100%', textAlign: 'center', zIndex: 40, pointerEvents: 'none', transform: 'translateY(-50%)' }}>
                {phase === 'BLAST_PREP' && (
                    <div className="animate-bounce" style={{ display: 'inline-block', backgroundColor: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)', padding: '10px 20px', borderRadius: '30px', backdropFilter: 'blur(5px)' }}>
                        <span style={{ color: 'white', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
                            TAP TO SET TNT: {blastPoints.length}
                        </span>
                    </div>
                )}
                {phase === 'BUILD' && selectedDIY && (
                    <div className="animate-pulse" style={{ display: 'inline-block', backgroundColor: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.4)', padding: '10px 20px', borderRadius: '30px', backdropFilter: 'blur(5px)' }}>
                        <span style={{ color: '#60a5fa', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
                            TAP TO PLACE {selectedDIY}
                        </span>
                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div style={{ ...safeBottom, position: 'absolute', bottom: 30, width: '100%', display: 'flex', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' }}>
                <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: 15, alignItems: 'center', width: '100%', padding: '0 20px' }}>

                    {phase === 'SCAN' && (
                        <button
                            onClick={() => setPhase('BLAST_PREP')}
                            style={{ backgroundColor: 'white', color: 'black', padding: '15px 40px', borderRadius: '40px', border: 'none', fontWeight: 900, fontSize: '16px', boxShadow: '0 10px 30px rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}
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
                            style={{
                                backgroundColor: blastPoints.length > 0 ? '#dc2626' : '#4b5563',
                                opacity: blastPoints.length > 0 ? 1 : 0.5,
                                color: 'white', padding: '15px 40px', borderRadius: '40px', border: 'none', fontWeight: 900, fontSize: '16px', boxShadow: '0 10px 30px rgba(220,38,38,0.4)', display: 'flex', alignItems: 'center', gap: 10
                            }}
                        >
                            <Bomb size={24} /> DETONATE!
                        </button>
                    )}

                    {phase === 'DEMOLITION' && (
                        <button
                            onClick={() => setPhase('BUILD')}
                            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', padding: '12px 30px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700, fontSize: '14px', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            <Trash2 size={18} style={{ color: '#f87171' }} /> FINISH CLEANUP
                        </button>
                    )}

                    {phase === 'BUILD' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', width: '100%' }}>
                            <div style={{ backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '25px', backdropFilter: 'blur(20px)', width: 'auto', display: 'flex', gap: 15 }}>
                                <button
                                    onClick={() => setSelectedDIY(selectedDIY === 'HOUSE' ? null : 'HOUSE')}
                                    style={{
                                        backgroundColor: selectedDIY === 'HOUSE' ? 'white' : 'transparent',
                                        color: selectedDIY === 'HOUSE' ? 'black' : 'white',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        padding: '10px 20px', borderRadius: '15px', fontWeight: 900, fontSize: '10px'
                                    }}
                                >
                                    HOUSE ($500)
                                </button>
                                <button
                                    onClick={() => setSelectedDIY(selectedDIY === 'TREE' ? null : 'TREE')}
                                    style={{
                                        backgroundColor: selectedDIY === 'TREE' ? 'white' : 'transparent',
                                        color: selectedDIY === 'TREE' ? 'black' : 'white',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        padding: '10px 20px', borderRadius: '15px', fontWeight: 900, fontSize: '10px'
                                    }}
                                >
                                    TREE ($200)
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    onClick={nextLevel}
                                    style={{ backgroundColor: '#2563eb', color: 'white', padding: '12px 35px', borderRadius: '40px', border: 'none', fontWeight: 900, fontSize: '14px', boxShadow: '0 10px 20px rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}
                                >
                                    NEXT LEVEL <ArrowRight size={18} />
                                </button>
                                <button onClick={resetGame} style={{ backgroundColor: 'transparent', border: 'none', padding: '10px' }}>
                                    <RefreshCcw size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};
