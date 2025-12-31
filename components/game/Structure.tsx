'use client';

import React, { useRef, useState, useMemo } from 'react';
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
    const { phase } = useGameState();
    const [exploded, setExploded] = useState(false);

    useFrame(() => {
        if (phase === 'DEMOLITION' && !exploded && rbRef.current) {
            const currentPos = rbRef.current.translation();
            const explosionSource = new THREE.Vector3(0, 0.5, 0); // Explosion center
            const posVec = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);
            const direction = posVec.clone().sub(explosionSource);
            const distance = direction.length();

            if (distance < 10) {
                setExploded(true);
                const force = Math.max(0, 15 - distance);
                direction.normalize().multiplyScalar(force);
                rbRef.current.applyImpulse({
                    x: direction.x + (Math.random() - 0.5),
                    y: Math.max(2, direction.y) + Math.random() * 5,
                    z: direction.z + (Math.random() - 0.5)
                }, true);
            }
        }
    });

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
        const height = 10;
        for (let x = -Math.floor(width / 2); x <= Math.floor(width / 2); x++) {
            for (let y = 0; y < height; y++) {
                for (let z = -Math.floor(width / 2); z <= Math.floor(width / 2); z++) {
                    // Add some randomness to colors
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
