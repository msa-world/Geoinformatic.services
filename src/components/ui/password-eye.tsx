"use client"

import React, { useRef, useState } from "react"

type PasswordEyeProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string
  name: string
}

export default function PasswordEye({ id, name, className = "", ...props }: PasswordEyeProps) {
  const [visible, setVisible] = useState(false)
  const [blinking, setBlinking] = useState(false)
  const eyeRef = useRef<HTMLButtonElement | null>(null)
  const pupilRef = useRef<SVGCircleElement | null>(null)

  // Toggle with a blink animation (play blink then switch visibility)
  const handleToggle = () => {
    // start blink
    setBlinking(true)
    // after blink duration, toggle visibility and stop blinking
    setTimeout(() => {
      setVisible((v) => !v)
      setBlinking(false)
    }, 160)
  }

  // Move pupil when hovering over the field or the eye. We compute
  // relative vector from the eye center to the mouse and translate the
  // pupil within a small radius so it stays inside the eye shape.
  const onMouseMove = (e: React.MouseEvent) => {
    const eye = eyeRef.current
    const pupil = pupilRef.current
    if (!eye || !pupil) return

    // If we're blinking, don't override the blink transform (CSS handles it)
    if (blinking) return

    const rect = eye.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy

    // Reduce travel so the pupil never leaves the eye 'tulip' shape.
    // Use a small fraction of the button size (safe margin).
    const max = Math.min(rect.width, rect.height) * 0.08 // pupil travel radius
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const nx = (dx / dist) * Math.min(dist, max)
    const ny = (dy / dist) * Math.min(dist, max)

    // Apply CSS transform for smooth movement. No scaling here; blink CSS handles scale.
    ;(pupil.style as any).transform = `translate(${nx}px, ${ny}px)`
  }

  const onMouseLeave = () => {
    const pupil = pupilRef.current
    if (!pupil) return
    if (blinking) return
    ;(pupil.style as any).transform = `translate(0px, 0px)`
  }

  return (
  <div
    className={`password-field-wrapper relative flex items-center w-full ${className}`}
    onMouseMove={onMouseMove}
    onMouseLeave={onMouseLeave}
  >
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        {...props}
        className={`pr-12 ${className}`}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={handleToggle}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        ref={eyeRef}
        className={`password-eye-button password-eye-offset absolute right-3 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full ${blinking ? 'blinking' : ''}`}
      >
        {visible ? (
          // Open eye with pupil when password is visible (smaller SVG)
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1" fill="rgba(255,255,255,0.0)" />
            <g>
              <circle cx="12" cy="12" r="5.5" fill="#FFFFFF00" stroke="#000000" strokeWidth="0.5" />
              <circle ref={pupilRef as any} cx="12" cy="12" r="2.2" fill="#111827" className="password-eye-pupil" />
            </g>
          </svg>
        ) : (
          // Closed eye icon when password is hidden (smaller SVG)
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12s4-7 10-7c3 0 5 2 6 3" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M22 12s-4 7-10 7c-3 0-5-2-6-3" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  )
}
