"use client";

import createGlobe from "cobe";
import { useEffect, useRef } from "react";

export default function WorldGlobe({ className }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointerInteracting = useRef<number | null>(null);
    const pointerInteractionMovement = useRef(0);
    const r = useRef(0);

    useEffect(() => {
        let phi = 0;
        let width = 0;
        const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth)
        window.addEventListener('resize', onResize)
        onResize()

        if (!canvasRef.current) return;

        const globe = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: width * 2,
            height: width * 2,
            phi: 0,
            theta: 0.3,
            dark: 1,
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: [0.3, 0.3, 0.3],
            markerColor: [0.1, 0.8, 1],
            glowColor: [0.78, 0.63, 0.3],
            markers: [],
            onRender: (state) => {
                // Drag physics
                if (pointerInteracting.current !== null) {
                    const delta = pointerInteractionMovement.current;
                    pointerInteractionMovement.current = 0;
                    r.current += delta / 200;
                }

                // Auto rotation
                if (!pointerInteracting.current) {
                    phi += 0.003
                }

                state.phi = phi + r.current
                state.width = width * 2
                state.height = width * 2
            },
        })

        setTimeout(() => canvasRef.current!.style.opacity = '1')

        return () => {
            globe.destroy();
            window.removeEventListener('resize', onResize);
        }
    }, [])

    return (
        <div className={`w-full max-w-[800px] aspect-square mx-auto relative ${className || ''}`}>
            <canvas
                ref={canvasRef}
                className="w-full h-full opacity-0 transition-opacity duration-1000 ease-in-out cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => {
                    pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
                }}
                onPointerUp={() => {
                    pointerInteracting.current = null;
                }}
                onPointerOut={() => {
                    pointerInteracting.current = null;
                }}
                onMouseMove={(e) => {
                    if (pointerInteracting.current !== null) {
                        const delta = e.clientX - pointerInteracting.current;
                        pointerInteractionMovement.current = delta;
                        r.current = delta / 100;
                    }
                }}
                onTouchMove={(e) => {
                    if (pointerInteracting.current !== null && e.touches[0]) {
                        const delta = e.touches[0].clientX - pointerInteracting.current;
                        pointerInteractionMovement.current = delta;
                        r.current = delta / 100;
                    }
                }}
            />
        </div>
    );
}
