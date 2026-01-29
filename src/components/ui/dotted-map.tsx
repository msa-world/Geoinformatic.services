"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function MapPoints() {
    const mesh = useRef<THREE.Points>(null);
    const { mouse, camera, viewport } = useThree();
    const [particles, setParticles] = useState<{ positions: Float32Array; colors: Float32Array } | null>(null);

    useEffect(() => {
        // Load the image to sample
        const img = new Image();
        img.src = "/world-map-solid.png";
        img.crossOrigin = "Anonymous";

        img.onload = () => {
            // Draw to invisible canvas
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // Desired resolution for sampling (balance detail vs performance)
            // Increased for higher density as requested
            const width = 320;
            const height = 160;

            canvas.width = width;
            canvas.height = height;

            // Draw image to fill the canvas
            ctx.drawImage(img, 0, 0, width, height);
            const data = ctx.getImageData(0, 0, width, height).data;

            const pos = [];
            const col = [];

            // EXACT COLORS from ParticleGlobe (Max Brightness for Sea Blue Theme)
            // Made even brighter/more vivid
            const color1 = new THREE.Color("#FFFFFF"); // Pure White
            const color2 = new THREE.Color("#FFD700"); // Gold
            const color3 = new THREE.Color("#00FFFF"); // Cyan/Aqua

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = (y * width + x) * 4;
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];
                    const alpha = data[index + 3];

                    // Threshold: if pixel is dark/opaque enough, create particle
                    // Adjusted for new image - assuming solid map is non-transparent
                    if (alpha > 50) {

                        // Map pixel (x,y) to World (x,y)
                        // Center is (0,0)
                        const pX = (x / width - 0.5) * 20; // Width of 20 units
                        const pY = -(y / height - 0.5) * 10; // Height of 10 units (flip Y)
                        const pZ = 0;

                        // Add slight randomness to break the grid look
                        const jitter = 0.03;
                        pos.push(pX + (Math.random() - 0.5) * jitter);
                        pos.push(pY + (Math.random() - 0.5) * jitter);
                        pos.push(pZ);

                        // Color Logic
                        const choice = Math.random();
                        const c = choice < 0.33 ? color1 : choice < 0.66 ? color2 : color3;
                        col.push(c.r, c.g, c.b);
                    }
                }
            }

            setParticles({
                positions: new Float32Array(pos),
                colors: new Float32Array(col)
            });
        };
    }, []);

    const particleData = useMemo(() => {
        if (!particles) return null;
        return {
            currentPositions: new Float32Array(particles.positions),
            originalPositions: new Float32Array(particles.positions),
            colors: particles.colors
        };
    }, [particles]);

    const raycaster = new THREE.Raycaster();

    useFrame((state) => {
        if (!mesh.current || !particleData) return;

        const time = state.clock.getElapsedTime();

        // Responsive Scaling
        // We want the map (width 20) to cover the viewport width
        // Viewport width at Z=0 for Camera Z=6 is roughly... calculated by:
        // vH = 2 * tan(fov/2) * dist
        // vW = vH * aspect

        // Scale factor to fill screen
        // Base width is 20. If viewport.width > 20, we scale up.
        // We add a multiplier to "Cover" fully (1.2x)
        const scaleFactor = Math.max(viewport.width / 18, viewport.height / 9) * 1.1;
        mesh.current.scale.set(scaleFactor, scaleFactor, 1);

        // Raycast
        raycaster.setFromCamera(mouse, camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const target = new THREE.Vector3();
        let interactionTarget = null;

        if (raycaster.ray.intersectPlane(plane, target)) {
            // Transform target to local space because mesh is scaled
            interactionTarget = target.clone().divideScalar(scaleFactor);
        }

        const { currentPositions, originalPositions } = particleData;
        const count = currentPositions.length / 3;

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const ox = originalPositions[i3];
            const oy = originalPositions[i3 + 1];
            const oz = originalPositions[i3 + 2];

            // 1. Breathing
            const wave = Math.sin(time * 1.5 + ox * 2.0) * 0.02;

            let tx = ox + ox * wave;
            let ty = oy + oy * wave;
            let tz = oz + oz * wave;

            // 2. Mouse Interaction
            if (interactionTarget) {
                const dx = ox - interactionTarget.x;
                const dy = oy - interactionTarget.y;
                const dz = oz - 0;
                const distSq = dx * dx + dy * dy + dz * dz;

                // Interaction radius needs to be relative to unscaled coordinates
                // Reduced from 1.5 to 1.0 for even smaller area/less dispersion
                if (distSq < 1.0) {
                    const dist = Math.sqrt(distSq);
                    // Adjusted force range - reduced max force
                    const force = (1.0 - dist) / 1.0;

                    // Reduced noise significantly
                    const noiseX = Math.sin(i * 12.3) * 0.2;
                    const noiseY = Math.cos(i * 45.6) * 0.2;

                    // Reduced multipliers further for subtle effect
                    tx += (dx + noiseX) * force * 0.3;
                    ty += (dy + noiseY) * force * 0.3;
                    tz += force * 0.5;
                }
            }

            const lerpFactor = 0.08;
            currentPositions[i3] += (tx - currentPositions[i3]) * lerpFactor;
            currentPositions[i3 + 1] += (ty - currentPositions[i3 + 1]) * lerpFactor;
            currentPositions[i3 + 2] += (tz - currentPositions[i3 + 2]) * lerpFactor;
        }

        mesh.current.geometry.attributes.position.needsUpdate = true;
    });

    if (!particleData) return null;

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleData.currentPositions.length / 3}
                    array={particleData.currentPositions}
                    itemSize={3}
                    args={[particleData.currentPositions, 3]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={particleData.colors.length / 3}
                    array={particleData.colors}
                    itemSize={3}
                    args={[particleData.colors, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.07} // Slightly larger for coverage
                vertexColors
                transparent
                opacity={1.0}
                sizeAttenuation={true}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

export default function DottedMap() {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas
                camera={{ position: [0, 0, 6.0], fov: 55 }}
                dpr={[1, 2]}
                gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
                style={{ pointerEvents: 'auto' }}
            >
                <MapPoints />
                <ambientLight intensity={0.6} />
            </Canvas>
        </div>
    );
}
