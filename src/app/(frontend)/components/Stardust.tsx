'use client'

import { useEffect, useRef } from 'react'

type Star = {
  x: number
  y: number
  ux: number
  uy: number
  speed: number
  bornAt: number
  lifeMs: number
  length: number
}

const SPAWN_MIN_MS = 4500
const SPAWN_MAX_MS = 11000

export function Stardust() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    function resize() {
      if (!canvas || !ctx) return
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const stars: Star[] = []
    let raf = 0
    let lastFrame = performance.now()
    let spawnTimer: ReturnType<typeof setTimeout> | null = null

    function spawnStar() {
      const W = window.innerWidth
      const H = window.innerHeight
      const goRight = Math.random() < 0.5
      const baseAngle = goRight ? Math.PI * 0.16 : Math.PI - Math.PI * 0.16
      const jitter = (Math.random() - 0.5) * Math.PI * 0.18
      const angle = baseAngle + jitter
      const ux = Math.cos(angle)
      const uy = Math.sin(angle)

      const startX = goRight
        ? -40 + Math.random() * (W * 0.55)
        : W * 0.45 + Math.random() * (W * 0.55) + 40
      const startY = -30 + Math.random() * (H * 0.4)

      stars.push({
        x: startX,
        y: startY,
        ux,
        uy,
        speed: 3.8 + Math.random() * 2.6,
        bornAt: performance.now(),
        lifeMs: 1900 + Math.random() * 900,
        length: 80 + Math.random() * 70,
      })
      startLoop()
    }

    function scheduleNext(initial = false) {
      if (spawnTimer) clearTimeout(spawnTimer)
      const delay = initial
        ? 1200 + Math.random() * 2000
        : SPAWN_MIN_MS + Math.random() * (SPAWN_MAX_MS - SPAWN_MIN_MS)
      spawnTimer = setTimeout(() => {
        if (!document.hidden) spawnStar()
        scheduleNext()
      }, delay)
    }

    function startLoop() {
      if (raf) return
      lastFrame = performance.now()
      raf = requestAnimationFrame(frame)
    }
    function stopLoop() {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    function frame(now: number) {
      if (!ctx) return
      const dt = Math.min(now - lastFrame, 48)
      lastFrame = now
      const step = dt / 16
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'round'

      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i]
        const age = now - s.bornAt
        const life = 1 - age / s.lifeMs
        if (life <= 0) {
          stars.splice(i, 1)
          continue
        }
        s.x += s.ux * s.speed * step
        s.y += s.uy * s.speed * step

        const fadeIn = Math.min(age / 280, 1)
        const eased = life * life * fadeIn

        const segs = 16
        for (let j = 0; j < segs; j++) {
          const t1 = j / segs
          const t2 = (j + 1) / segs
          const x1 = s.x - s.ux * s.length * t1
          const y1 = s.y - s.uy * s.length * t1
          const x2 = s.x - s.ux * s.length * t2
          const y2 = s.y - s.uy * s.length * t2
          const a = (1 - t1) * eased
          ctx.strokeStyle = `rgba(255, 215, 175, ${a * 0.5})`
          ctx.lineWidth = (1 - t1) * 1.7 + 0.3
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
        }

        const haloR = 16
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, haloR)
        grad.addColorStop(0, `rgba(255, 220, 185, ${eased * 0.42})`)
        grad.addColorStop(1, `rgba(255, 220, 185, 0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(s.x, s.y, haloR, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(255, 245, 225, ${eased * 0.95})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, 1.7, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalCompositeOperation = 'source-over'

      if (stars.length === 0) {
        stopLoop()
        return
      }
      raf = requestAnimationFrame(frame)
    }

    function onVisibility() {
      if (document.hidden) {
        if (spawnTimer) {
          clearTimeout(spawnTimer)
          spawnTimer = null
        }
        stopLoop()
      } else {
        if (!spawnTimer) scheduleNext(true)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    scheduleNext(true)

    return () => {
      cancelAnimationFrame(raf)
      if (spawnTimer) clearTimeout(spawnTimer)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} className="stardust" aria-hidden />
}
