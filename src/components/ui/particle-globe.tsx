"use client";

import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { worldPolygons, isPointInAnyPolygon } from "@/data/world-polygons";

interface ParticleGlobeProps {
    count?: number;
    variant?: "sphere" | "ring" | "map" | "earth";
}

// Reuse existing pakistanPolygon for fallback or other logic if needed, 
// strictly speaking we are replacing its usage for particle generation with the image,
// but keeping it doesn't hurt. For brevity/cleanliness in this specific task, 
// I will remove the hardcoded polygon to rely fully on the image as requested.

function GlobeParticles({ count = 2000, variant = "sphere" }: ParticleGlobeProps) {
    const mesh = useRef<THREE.Points>(null);
    const { mouse, camera } = useThree();

    // Conditionally load texture only if variant is map
    // Note: Hooks must be unconditional, so we load it but might not use it if variant != map.
    // However, to avoid loading overhead when not needed, we can't easily skip hook calls.
    // Given the component structure, it's better to always load or split components. 
    // For this refactor, we'll load it. If performance is a concern, we'd refactor into sub-components.
    // For now, let's load it conditionally by checking variant inside? No, hooks rules.
    // We will assume this component is used specifically for the requested purpose or acceptable overhead.

    // Actually, to avoid error if texture doesn't exist when variant != map, 
    // we should be careful. But the user asked for this specifically for the map variant.
    // We can conditionally useLoader if we are careful, but React warns.
    // Better strategy: Load it, it's a small asset.
    const mapTexture = useLoader(THREE.TextureLoader, "/images/pakistan-map.png");

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

        // Prepare map data if variant is map
        let mapData: ImageData | null = null;
        if (variant === "map" && mapTexture) {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (ctx) {
                const img = mapTexture.image;
                canvas.width = img.width;
                canvas.height = img.height;
                // Flip Y is handled by TextureLoader usually for textures, but here we access the raw image
                ctx.drawImage(img, 0, 0);
                mapData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            }
        }

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
            } else if (variant === "map" && mapData) {
                // Image based sampling
                const { width, height, data } = mapData;
                let pX = 0, pY = 0, pZ = 0;
                let found = false;
                let attempts = 0;

                while (!found && attempts < 200) {
                    const x = Math.floor(Math.random() * width);
                    const y = Math.floor(Math.random() * height);
                    const index = (y * width + x) * 4;
                    const alpha = data[index + 3];
                    // Also check if not white background if image isn't transparent (R,G,B > 240)
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];
                    const isWhite = r > 240 && g > 240 && b > 240;

                    if (alpha > 20 && !isWhite) {
                        found = true;
                        // Map 0..width to -range..range
                        // Aspect ratio preservation
                        const aspect = width / height;
                        const scale = 6.5; // Overall size of the map in 3D space

                        pX = (x / width - 0.5) * scale * aspect;
                        // Flip Y because canvas Y is down, 3D Y is up (usually)
                        pY = -(y / height - 0.5) * scale;

                        // Add some depth
                        pZ = (Math.random() - 0.5) * 0.2; // Slight thickness
                    }
                    attempts++;
                }

                if (!found) {
                    // Fallback to hidden if we couldn't find a spot (should stay rare with enough attempts)
                    pX = 0; pY = -999; pZ = 0;
                }

                positions[i * 3] = pX;
                positions[i * 3 + 1] = pY;
                positions[i * 3 + 2] = pZ;

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
    }, [count, variant, mapTexture]);

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

    // Throttle updates to ~30fps to reduce CPU/GPU usage on lower-end devices
    const accumRef = useRef(0)
    useFrame((state, delta) => {
        accumRef.current += delta
        if (accumRef.current < 1 / 30) return
        accumRef.current = 0
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
            // Gentle float for map
            mesh.current.rotation.y = Math.sin(time * 0.1) * 0.05; // Less rotation
            mesh.current.rotation.x = Math.sin(time * 0.05) * 0.02;
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
                        tx += (dx + noiseX) * force * 0.2;
                        ty += (dy + noiseY) * force * 0.2;
                        tz += force * 0.3;
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
                size={0.035} // Slightly smaller for map detail
                vertexColors
                transparent
                opacity={0.8}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

export default function ParticleGlobe({ variant = "sphere", count = 2000 }: { variant?: "sphere" | "ring" | "map" | "earth", count?: number }) {
    // Respect user preference for reduced motion — render a lightweight fallback.
    const [reduced, setReduced] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === 'undefined') return
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        setReduced(mq.matches)
        const handler = () => setReduced(mq.matches)
        mq.addEventListener?.('change', handler)
        return () => mq.removeEventListener?.('change', handler)
    }, [])

    if (reduced) {
        return <div className="absolute inset-0 z-0 bg-black/40" aria-hidden />
    }

    return (
        <div className="absolute inset-0 z-0">
            <Canvas
                camera={{ position: [0, 0, 6.5], fov: 55 }}
                dpr={[1, 1.5]}
                gl={{ antialias: false, alpha: true }}
                style={{ pointerEvents: 'auto' }}
            >
                <Suspense fallback={null}>
                    <GlobeParticles variant={variant} count={count} />
                </Suspense>
                <ambientLight intensity={0.6} />
            </Canvas>
        </div>
    );
}


