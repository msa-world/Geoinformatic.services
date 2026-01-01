"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { worldPolygons, isPointInAnyPolygon } from "@/data/world-polygons";

interface ParticleGlobeProps {
    count?: number;
    variant?: "sphere" | "ring" | "map" | "earth";
}

// Simplified high-resolution polygon for Pakistan (Long, Lat)
// Source: https://github.com/glynnbird/countriesgeojson/blob/master/pakistan.geojson
const pakistanPolygon = [
    [75.158028, 37.133031], [75.896897, 36.666806], [76.192848, 35.898403], [77.837451, 35.49401],
    [76.871722, 34.653544], [75.757061, 34.504923], [74.240203, 34.748887], [73.749948, 34.317699],
    [74.104294, 33.441473], [74.451559, 32.7649], [75.258642, 32.271105], [74.405929, 31.692639],
    [74.42138, 30.979815], [73.450638, 29.976413], [72.823752, 28.961592], [71.777666, 27.91318],
    [70.616496, 27.989196], [69.514393, 26.940966], [70.168927, 26.491872], [70.282873, 25.722229],
    [70.844699, 25.215102], [71.04324, 24.356524], [68.842599, 24.359134], [68.176645, 23.691965],
    [67.443667, 23.944844], [67.145442, 24.663611], [66.372828, 25.425141], [64.530408, 25.237039],
    [62.905701, 25.218409], [61.497363, 25.078237], [61.874187, 26.239975], [63.316632, 26.756532],
    [63.233898, 27.217047], [62.755426, 27.378923], [62.72783, 28.259645], [61.771868, 28.699334],
    [61.369309, 29.303276], [60.874248, 29.829239], [62.549857, 29.318572], [63.550261, 29.468331],
    [64.148002, 29.340819], [64.350419, 29.560031], [65.046862, 29.472181], [66.346473, 29.887943],
    [66.381458, 30.738899], [66.938891, 31.304911], [67.683394, 31.303154], [67.792689, 31.58293],
    [68.556932, 31.71331], [68.926677, 31.620189], [69.317764, 31.901412], [69.262522, 32.501944],
    [69.687147, 33.105499], [70.323594, 33.358533], [69.930543, 34.02012], [70.881803, 33.988856],
    [71.156773, 34.348911], [71.115019, 34.733126], [71.613076, 35.153203], [71.498768, 35.650563],
    [71.262348, 36.074388], [71.846292, 36.509942], [72.920025, 36.720007], [74.067552, 36.836176],
    [74.575893, 37.020841], [75.158028, 37.133031]
];

// Helper to normalize and center the map points
const normalizedPolygon = pakistanPolygon.map(([x, y]) => {
    // Center roughly at 69.3, 30.3
    // Scale factor 0.35 to fit nicely
    return [(x - 69.3) * 0.35, (y - 30.3) * 0.35];
});

function isPointInPolygon(point: number[], vs: number[][]) {
    // ray-casting algorithm based on
    // https://github.com/substack/point-in-polygon
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];

        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function GlobeParticles({ count = 8000, variant = "sphere" }: ParticleGlobeProps) {
    const mesh = useRef<THREE.Points>(null);
    const { mouse, camera } = useThree();

    // Generate initial positions
    const initialData = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        // Primary color palette
        const color1 = new THREE.Color("#C7A24D"); // Gold
        const color2 = new THREE.Color("#D97D25"); // Orange
        const color3 = new THREE.Color("#7FA89A"); // Sage Green
        const colorGrid = new THREE.Color("#444444"); // Dark Grey for Grid
        const colorGridBright = new THREE.Color("#666666"); // Lighter Grey for Grid Intersections

        for (let i = 0; i < count; i++) {
            let isGridParticle = false;

            if (variant === "sphere") {
                // Fibonacci sphere
                const phi = Math.acos(-1 + (2 * i) / count);
                const theta = Math.sqrt(count * Math.PI) * phi;
                const r = 2.5;

                positions[i * 3] = r * Math.cos(theta) * Math.sin(phi);
                positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
                positions[i * 3 + 2] = r * Math.cos(phi);
            } else if (variant === "ring") {
                // Ring / Torus
                const angle = Math.random() * Math.PI * 2;
                const rBase = 2.2;
                const rVar = (Math.random() - 0.5) * 1.5;
                const r = rBase + rVar;
                const z = (Math.random() - 0.5) * 0.8;

                positions[i * 3] = r * Math.cos(angle);
                positions[i * 3 + 1] = r * Math.sin(angle);
                positions[i * 3 + 2] = z;
            } else if (variant === "map") {
                // Pakistan Map
                let pX, pY;
                let found = false;
                let attempts = 0;

                while (!found && attempts < 50) {
                    pX = (Math.random() - 0.5) * 7.0;
                    pY = (Math.random() - 0.5) * 7.0;
                    if (isPointInPolygon([pX, pY], normalizedPolygon)) {
                        found = true;
                    }
                    attempts++;
                }

                if (!found) {
                    pX = (Math.random() - 0.5);
                    pY = (Math.random() - 0.5);
                }

                positions[i * 3] = pX as number;
                positions[i * 3 + 1] = (pY as number) * 1.2;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
            } else if (variant === "earth") {
                // Earth Map on Sphere with Grid
                let found = false;
                let attempts = 0;
                let pX, pY, pZ;
                const r = 2.5;

                // Increase attempts for better quality
                while (!found && attempts < 200) {
                    // Random point on sphere (Uniform)
                    const u = Math.random();
                    const v = Math.random();
                    const theta = 2 * Math.PI * u; // 0 to 2pi
                    const phi = Math.acos(2 * v - 1); // 0 to pi

                    // Convert to Lat/Lon (-90 to 90, -180 to 180)
                    const lat = 90 - (phi * 180 / Math.PI);
                    const lon = (theta * 180 / Math.PI) - 180;

                    // 1. Check Land
                    if (isPointInAnyPolygon([lon, lat], worldPolygons)) {
                        found = true;
                        isGridParticle = false;
                    }
                    // 2. Check Grid Lines (e.g. every 15 degrees)
                    else {
                        const gridSpacing = 15;
                        const threshold = 1.5; // Thickness of grid line

                        // Distance to nearest grid line
                        const latDist = Math.abs(lat % gridSpacing);
                        const lonDist = Math.abs(lon % gridSpacing);

                        // Check if close to grid line (wrapping handling imprecise but okay for visual)
                        if (latDist < threshold || (gridSpacing - latDist) < threshold ||
                            lonDist < threshold || (gridSpacing - lonDist) < threshold) {

                            // Optional: sparse sampling on grid to not make it solid lines
                            if (Math.random() > 0.6) {
                                found = true;
                                isGridParticle = true;
                            }
                        }
                    }

                    if (found) {
                        pX = r * Math.sin(phi) * Math.cos(theta);
                        pY = r * Math.cos(phi);
                        pZ = r * Math.sin(phi) * Math.sin(theta);
                    }
                    attempts++;
                }

                if (!found) {
                    pX = 0; pY = -999; pZ = 0; // Hide
                }

                positions[i * 3] = pX as number;
                positions[i * 3 + 1] = pY as number;
                positions[i * 3 + 2] = pZ as number;
            }

            // Coloring logic
            const choice = Math.random();
            let c;

            if (variant === "earth" && isGridParticle) {
                // Grid color
                c = choice < 0.5 ? colorGrid : colorGridBright;
            } else {
                // Default theme palette
                c = choice < 0.33 ? color1 : choice < 0.66 ? color2 : color3;
                if (variant === "map" && choice < 0.2) {
                    c = color3;
                }
            }

            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        return { positions, colors };
    }, [count, variant]);

    // We need a stable buffer for the *current* positions to update in-place
    // and the *original* positions to reference.
    const particleData = useMemo(() => {
        return {
            currentPositions: new Float32Array(initialData.positions),
            originalPositions: new Float32Array(initialData.positions),
            colors: initialData.colors
        }
    }, [initialData]);

    const raycaster = new THREE.Raycaster();

    useFrame((state) => {
        if (!mesh.current) return;

        const time = state.clock.getElapsedTime();

        // Rotation logic depending on variant
        if (variant === "sphere") {
            mesh.current.rotation.y = time * 0.08;
            mesh.current.rotation.x = Math.sin(time * 0.1) * 0.05;
        } else if (variant === "ring") {
            mesh.current.rotation.z = time * 0.05;
            mesh.current.rotation.x = 1.2;
        } else if (variant === "map") {
            mesh.current.rotation.y = Math.sin(time * 0.2) * 0.05;
            mesh.current.rotation.x = Math.sin(time * 0.15) * 0.05;
        } else if (variant === "earth") {
            mesh.current.rotation.y = time * 0.05; // Spin Earth
            mesh.current.rotation.z = 0.35; // Tilt axis
            mesh.current.rotation.x = 0.2;
        }

        // Raycast logic
        raycaster.setFromCamera(mouse, camera);
        let interactionTarget = null;

        // Interaction logic similar to sphere for 'earth'
        if (variant === "sphere" || variant === "earth") {
            const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 2.5);
            const intersectionPoint = new THREE.Vector3();
            if (raycaster.ray.intersectSphere(sphere, intersectionPoint)) {
                interactionTarget = intersectionPoint;
                interactionTarget.applyMatrix4(mesh.current.matrixWorld.clone().invert());
            }
        } else {
            // Plane intersection for map/ring
            const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
            const target = new THREE.Vector3();
            // ... simplified logic from before ...
            const matrixInv = mesh.current.matrixWorld.clone().invert();
            const rayLocal = raycaster.ray.clone().applyMatrix4(matrixInv);
            if (Math.abs(rayLocal.direction.z) > 0.001) {
                const t = -rayLocal.origin.z / rayLocal.direction.z;
                interactionTarget = rayLocal.origin.clone().add(rayLocal.direction.clone().multiplyScalar(t));
            }
        }

        const { currentPositions, originalPositions } = particleData;
        const count3 = count * 3;

        for (let i = 0; i < count3; i += 3) {
            const ox = originalPositions[i];
            const oy = originalPositions[i + 1];
            const oz = originalPositions[i + 2];

            if (oy === -999) continue; // Skip hidden particles

            // 1. Calculate Target Position with breathing wave
            const wave = Math.sin(time * 1.5 + ox * 2.0) * 0.02;

            let tx = ox + ox * wave;
            let ty = oy + oy * wave;
            let tz = oz + oz * wave;

            // 2. Apply Interaction
            if (interactionTarget) {
                const dx = ox - interactionTarget.x;
                const dy = oy - interactionTarget.y;
                const dz = oz - interactionTarget.z;
                const distSq = dx * dx + dy * dy + dz * dz;

                if (distSq < 2.5) {
                    const dist = Math.sqrt(distSq);
                    const force = (1.5 - dist) / 1.5;
                    const noiseX = Math.sin(i * 12.3) * 1.5;
                    const noiseY = Math.cos(i * 45.6) * 1.5;

                    if (variant === "map") {
                        tx += (dx + noiseX) * force * 2.0;
                        ty += (dy + noiseY) * force * 2.0;
                        tz += force * 3.0;
                    } else {
                        // Sphere/Earth push out
                        tx += (dx + noiseX) * force * 1.5;
                        ty += (dy + noiseY) * force * 1.5;
                        tz += (dz + noiseX) * force * 1.5;
                    }
                }
            }

            // 3. Smooth Lerp
            const lerpFactor = 0.08;
            currentPositions[i] += (tx - currentPositions[i]) * lerpFactor;
            currentPositions[i + 1] += (ty - currentPositions[i + 1]) * lerpFactor;
            currentPositions[i + 2] += (tz - currentPositions[i + 2]) * lerpFactor;
        }

        mesh.current.geometry.attributes.position.needsUpdate = true;
    });

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
                size={0.045}
                vertexColors
                transparent
                opacity={0.9}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

export default function ParticleGlobe({ variant = "sphere" }: { variant?: "sphere" | "ring" | "map" | "earth" }) {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas
                camera={{ position: [0, 0, 6.5], fov: 55 }}
                dpr={[1, 2]}
                gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
                style={{ pointerEvents: 'auto' }}
            >
                <GlobeParticles variant={variant} />
                <ambientLight intensity={0.6} />
            </Canvas>
        </div>
    );
}
