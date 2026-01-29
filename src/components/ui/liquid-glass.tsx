"use client"

import React, { useEffect, useRef } from "react"

// Utility functions
function smoothStep(a: number, b: number, t: number) {
    t = Math.max(0, Math.min(1, (t - a) / (b - a)))
    return t * t * (3 - 2 * t)
}

function length(x: number, y: number) {
    return Math.sqrt(x * x + y * y)
}

function roundedRectSDF(x: number, y: number, width: number, height: number, radius: number) {
    const qx = Math.abs(x) - width + radius
    const qy = Math.abs(y) - height + radius
    return Math.min(Math.max(qx, qy), 0) + length(Math.max(qx, 0), Math.max(qy, 0)) - radius
}

function texture(x: number, y: number) {
    return { type: "t", x, y }
}

function generateId() {
    return "liquid-glass-" + Math.random().toString(36).substr(2, 9)
}

interface ShaderOptions {
    width?: number
    height?: number
    fragment?: (uv: { x: number; y: number }, mouse: { x: number; y: number }) => { x: number; y: number }
}

class Shader {
    width: number
    height: number
    fragment: (uv: { x: number; y: number }, mouse: { x: number; y: number }) => { x: number; y: number }
    canvasDPI: number
    id: string
    offset: number
    mouse: { x: number; y: number }
    mouseUsed: boolean
    container: HTMLElement
    svg!: SVGSVGElement
    feImage!: SVGFEImageElement
    feDisplacementMap!: SVGFEDisplacementMapElement
    canvas!: HTMLCanvasElement
    context!: CanvasRenderingContext2D | null
    cleanupListeners: () => void = () => { }

    constructor(container: HTMLElement, options: ShaderOptions = {}) {
        this.container = container
        this.width = options.width || container.clientWidth
        this.height = options.height || container.clientHeight
        this.fragment = options.fragment || ((uv) => texture(uv.x, uv.y))
        this.canvasDPI = 1
        this.id = generateId()
        this.offset = 10

        this.mouse = { x: 0, y: 0 }
        this.mouseUsed = false

        this.initElements()
        this.setupEventListeners()
        this.updateShader()
    }

    initElements() {
        // Style container
        this.container.style.position = "relative"
        this.container.style.overflow = "hidden"
        // Add shadow from snippet
        this.container.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.25), 0 -10px 25px inset rgba(0, 0, 0, 0.15)"

        // Create SVG filter
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        this.svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
        this.svg.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
      `

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")
        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter")
        filter.setAttribute("id", `${this.id}_filter`)
        filter.setAttribute("filterUnits", "objectBoundingBox")
        filter.setAttribute("x", "0%")
        filter.setAttribute("y", "0%")
        filter.setAttribute("width", "100%")
        filter.setAttribute("height", "100%")

        this.feImage = document.createElementNS("http://www.w3.org/2000/svg", "feImage")
        this.feImage.setAttribute("id", `${this.id}_map`)
        this.feImage.setAttribute("result", "map")

        // We need to use preserveAspectRatio="none" to stretch the displacement map
        this.feImage.setAttribute("preserveAspectRatio", "none")

        this.feDisplacementMap = document.createElementNS("http://www.w3.org/2000/svg", "feDisplacementMap")
        this.feDisplacementMap.setAttribute("in", "SourceGraphic")
        this.feDisplacementMap.setAttribute("in2", "map")
        this.feDisplacementMap.setAttribute("xChannelSelector", "R")
        this.feDisplacementMap.setAttribute("yChannelSelector", "G")
        this.feDisplacementMap.setAttribute("scale", "20")

        filter.appendChild(this.feImage)
        filter.appendChild(this.feDisplacementMap)
        defs.appendChild(filter)
        this.svg.appendChild(defs)

        // Create canvas for displacement map (hidden)
        this.canvas = document.createElement("canvas")
        this.canvas.width = this.width * this.canvasDPI
        this.canvas.height = this.height * this.canvasDPI
        this.canvas.style.display = "none"

        this.context = this.canvas.getContext("2d")

        // Append SVG to container
        this.container.appendChild(this.svg)

        // Apply filter to container's content (or a background element)
        const bg = document.createElement("div")
        bg.style.cssText = `
            position: absolute;
            inset: 0;
            backdrop-filter: url(#${this.id}_filter) blur(0.25px) contrast(1.2) brightness(1.05) saturate(1.1);
            z-index: 0;
        `
        this.container.appendChild(bg)
    }

    setupEventListeners() {
        const onMouseMove = (e: MouseEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mouse.x = (e.clientX - rect.left) / rect.width
            this.mouse.y = (e.clientY - rect.top) / rect.height

            this.updateShader()
        }

        // Attach to document to track mouse even outside the small pill
        document.addEventListener("mousemove", onMouseMove)

        this.cleanupListeners = () => {
            document.removeEventListener("mousemove", onMouseMove)
        }
    }

    updateShader() {
        const mouseProxy = new Proxy(this.mouse, {
            get: (target, prop) => {
                this.mouseUsed = true
                return target[prop as keyof typeof target]
            },
        })

        this.mouseUsed = false

        const w = this.width * this.canvasDPI
        const h = this.height * this.canvasDPI

        if (w === 0 || h === 0) return

        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w
            this.canvas.height = h
        }

        const data = new Uint8ClampedArray(w * h * 4)

        let maxScale = 0
        const rawValues: number[] = []

        for (let i = 0; i < data.length; i += 4) {
            const x = (i / 4) % w
            const y = Math.floor(i / 4 / w)
            const pos = this.fragment({ x: x / w, y: y / h }, mouseProxy)
            const dx = pos.x * w - x
            const dy = pos.y * h - y
            maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy))
            rawValues.push(dx, dy)
        }

        maxScale *= 0.5

        let index = 0
        for (let i = 0; i < data.length; i += 4) {
            const r = rawValues[index++] / maxScale + 0.5
            const g = rawValues[index++] / maxScale + 0.5
            data[i] = r * 255
            data[i + 1] = g * 255
            data[i + 2] = 0
            data[i + 3] = 255
        }

        if (this.context) {
            this.context.putImageData(new ImageData(data, w, h), 0, 0)
            this.feImage.setAttributeNS("http://www.w3.org/1999/xlink", "href", this.canvas.toDataURL())
            this.feDisplacementMap.setAttribute("scale", (maxScale / this.canvasDPI).toString())
        }
    }

    destroy() {
        this.cleanupListeners()
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild)
        }
        this.canvas.remove()
    }
}

interface LiquidGlassProps {
    className?: string
}

export function LiquidGlass({ className }: LiquidGlassProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const shaderRef = useRef<Shader | null>(null)

    useEffect(() => {
        if (!containerRef.current) return

        // Create shader
        const shader = new Shader(containerRef.current, {
            fragment: (uv, mouse) => {
                const ix = uv.x - 0.5
                const iy = uv.y - 0.5
                const distanceToEdge = roundedRectSDF(ix, iy, 0.3, 0.2, 0.6)
                const displacement = smoothStep(0.8, 0, distanceToEdge - 0.15)
                const scaled = smoothStep(0, 1, displacement)
                return texture(ix * scaled + 0.5, iy * scaled + 0.5)
            },
        })

        shaderRef.current = shader

        return () => {
            if (shaderRef.current) {
                shaderRef.current.destroy()
                shaderRef.current = null
            }
        }
    }, [])

    return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }} />
}
