'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameState } from '@/lib/game-state';

interface BlockProps {
    position: [number, number, number];
    color: string;
}

const Block = ({ position, color }: BlockProps) => {
    const rbRef = useRef<RapierRigidBody>(null);
    const { phase, blastPoints } = useGameState();
    const [exploded, setExploded] = useState(false);

    useFrame(() => {
        if (phase === 'DEMOLITION' && !exploded && rbRef.current && blastPoints.length > 0) {
            const currentPos = rbRef.current.translation();
            const posVec = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);

            // Check each blast point for impulse
            blastPoints.forEach((bp) => {
                const blastSource = new THREE.Vector3(...bp.position);
                const direction = posVec.clone().sub(blastSource);
                const distance = direction.length();

                if (distance < 6) {
                    const force = Math.max(0, 12 - distance);
                    direction.normalize().multiplyScalar(force);
                    rbRef.current?.applyImpulse({
                        x: direction.x + (Math.random() - 0.5) * 2,
                        y: Math.max(1, direction.y) + Math.random() * 8,
                        z: direction.z + (Math.random() - 0.5) * 2
                    }, true);
                }
            });
            setExploded(true);
        }
    });

    useEffect(() => {
        if (phase === 'SCAN') setExploded(false);
    }, [phase]);

    return (
        <RigidBody
            ref={rbRef}
            position={position}
            colliders="cuboid"
            type={phase === 'SCAN' || phase === 'BLAST_PREP' ? 'fixed' : 'dynamic'}
            friction={0.6}
            restitution={0.1}
        >
            <mesh castShadow receiveShadow>
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
    const blocks = useMemo(() => {
        const items = [];
        const width = 3;
        const height = 8;
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
    }, []);

    return (
        <group>
            {blocks.map((b, i) => (
                <Block key={i} position={b.position} color={b.color} />
            ))}
        </group>
    );
};
