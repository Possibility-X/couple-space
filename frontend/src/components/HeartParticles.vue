<template>
  <canvas ref="canvas" class="fixed inset-0 pointer-events-none z-0" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref(null)
let ctx, animFrame
const particles = []

function createParticle(w, h) {
  return {
    x: Math.random() * w, y: h + 20,
    vx: (Math.random() - 0.5) * 0.8,
    vy: -(1 + Math.random() * 1.5),
    size: 8 + Math.random() * 12,
    opacity: 0.4 + Math.random() * 0.4,
    life: 1
  }
}

function drawHeart(ctx, x, y, size, opacity) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = '#fb7185'
  ctx.beginPath()
  ctx.moveTo(x, y + size * 0.3)
  ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3)
  ctx.bezierCurveTo(x - size * 0.5, y + size * 0.6, x, y + size * 0.9, x, y + size)
  ctx.bezierCurveTo(x, y + size * 0.9, x + size * 0.5, y + size * 0.6, x + size * 0.5, y + size * 0.3)
  ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3)
  ctx.fill()
  ctx.restore()
}

function animate() {
  if (!canvas.value) return
  const w = canvas.value.width, h = canvas.value.height
  ctx.clearRect(0, 0, w, h)

  if (Math.random() < 0.03) particles.push(createParticle(w, h))

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx; p.y += p.vy
    p.life -= 0.003
    p.opacity = p.life * 0.5
    drawHeart(ctx, p.x, p.y, p.size, p.opacity)
    if (p.life <= 0 || p.y < -20) particles.splice(i, 1)
  }

  animFrame = requestAnimationFrame(animate)
}

function resize() {
  if (!canvas.value) return
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  resize()
  window.addEventListener('resize', resize)
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animFrame)
  window.removeEventListener('resize', resize)
})
</script>
