'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameState } from '@/lib/game-state';
import { audioManager } from '@/lib/audio-manager';

interface BlockProps {
    position: [number, number, number];
    color: string;
}

const Block = ({ position, color }: BlockProps) => {
    const rbRef = useRef<RapierRigidBody>(null);
    const { phase, blastPoints, collectBlock } = useGameState();
    const [exploded, setExploded] = useState(false);
    const [hidden, setHidden] = useState(false);

    useFrame(() => {
        if (phase === 'DEMOLITION' && !exploded && rbRef.current && blastPoints.length > 0) {
            const currentPos = rbRef.current.translation();
            const posVec = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);

            let triggered = false;
            blastPoints.forEach((bp) => {
                const blastSource = new THREE.Vector3(...bp.position);
                const direction = posVec.clone().sub(blastSource);
                const distance = direction.length();

                if (distance < 6) {
                    triggered = true;
                    const force = Math.max(0, 12 - distance);
                    direction.normalize().multiplyScalar(force);
                    rbRef.current?.applyImpulse({
                        x: direction.x + (Math.random() - 0.5) * 2,
                        y: Math.max(1, direction.y) + Math.random() * 8,
                        z: direction.z + (Math.random() - 0.5) * 2
                    }, true);
                }
            });

            if (triggered) {
                setExploded(true);
            }
        }
    });

    useEffect(() => {
        if (phase === 'SCAN') {
            setExploded(false);
            setHidden(false);
        }
    }, [phase]);

    const handleCollect = (e: any) => {
        e.stopPropagation();
        if (phase === 'DEMOLITION' && !hidden) {
            setHidden(true);
            collectBlock();
            audioManager?.playSound('pop', 0.2, 1.2 + Math.random() * 0.6);
        }
    };

    if (hidden) return null;

    return (
        <RigidBody
            ref={rbRef}
            position={position}
            colliders="cuboid"
            type={phase === 'SCAN' || phase === 'BLAST_PREP' ? 'fixed' : 'dynamic'}
            friction={0.6}
            restitution={0.1}
        >
            <mesh castShadow receiveShadow onClick={handleCollect}>
                <boxGeometry args={[0.92, 0.92, 0.92]} />
                <meshStandardMaterial
                    color={color}
                    metalness={0.5}
                    roughness={0.4}
                    emissive={phase === 'SCAN' ? color : 'black'}
                    emissiveIntensity={phase === 'SCAN' ? 0.3 : 0}
                />
            </mesh>
        </RigidBody>
    );
};

export const Structure = () => {
    const { level, setTotalBlocks, builtItems } = useGameState();

    const blocks = useMemo(() => {
        const items = [];
        const width = 3;
        // Height increases with level
        const height = 5 + (level * 2);

        for (let x = -Math.floor(width / 2); x <= Math.floor(width / 2); x++) {
            for (let y = 0; y < height; y++) {
                for (let z = -Math.floor(width / 2); z <= Math.floor(width / 2); z++) {
                    const grey = 0.4 + Math.random() * 0.3;
                    items.push({
                        position: [x, y + 0.5, z] as [number, number, number],
                        color: `rgb(${Math.floor(grey * 255)}, ${Math.floor(grey * 255)}, ${Math.floor(grey * 255)})`
                    });
                }
            }
        }
        return items;
    }, [level]);

    useEffect(() => {
        setTotalBlocks(blocks.length);
    }, [blocks.length, setTotalBlocks]);

    return (
        <group>
            {/* The Tower */}
            {blocks.map((b, i) => (
                <Block key={`${level}-${i}`} position={b.position} color={b.color} />
            ))}

            {/* Persistent Built Items */}
            {builtItems.map((item) => (
                <group key={item.id} position={item.position}>
                    {item.type === 'HOUSE' ? (
                        <group>
                            <mesh position={[0, 0.5, 0]} castShadow>
                                <boxGeometry args={[1, 1, 1]} />
                                <meshStandardMaterial color="#8b4513" />
                            </mesh>
                            <mesh position={[0, 1.25, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                                <coneGeometry args={[0.8, 0.5, 4]} />
                                <meshStandardMaterial color="#a52a2a" />
                            </mesh>
                        </group>
                    ) : (
                        <group>
                            <mesh position={[0, 0.4, 0]} castShadow>
                                <cylinderGeometry args={[0.1, 0.1, 0.8]} />
                                <meshStandardMaterial color="#5d4037" />
                            </mesh>
                            <mesh position={[0, 1, 0]} castShadow>
                                <sphereGeometry args={[0.4]} />
                                <meshStandardMaterial color="#2e7d32" />
                            </mesh>
                        </group>
                    )}
                </group>
            ))}
        </group>
    );
};
