<template>
  <div class="particles-layer" aria-hidden="true">
    <span
      v-for="p in particles"
      :key="p.id"
      class="particle"
      :ref="el => setRef(el, p.id)"
      :style="p.style"
    >
      <span class="particle-glow" :style="p.glowStyle" />
    </span>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  count: { type: Number, default: 28 }
})

function rand(min, max) {
  return min + Math.random() * (max - min)
}

const els = new Map()
function setRef(el, id) {
  if (el) els.set(id, el)
  else els.delete(id)
}

const particles = ref([])
const timers = []

function scheduleMove(id) {
  const el = els.get(id)
  if (!el) return
  const dur = rand(8, 18)
  el.style.transition = `transform ${dur}s cubic-bezier(0.45, 0, 0.55, 1)`
  el.style.transform = `translate(${rand(-12, 112) - parseFloat(el.dataset.baseLeft)}vw, ${rand(-12, 112) - parseFloat(el.dataset.baseTop)}vh)`
  timers.push(setTimeout(() => scheduleMove(id), dur * 1000 + rand(0, 1500)))
}

onMounted(() => {
  particles.value = Array.from({ length: props.count }, (_, i) => {
    const size = rand(2, 6)
    const flickerDur = rand(1.2, 3.5)
    const flickerDelay = -rand(0, flickerDur)
    const hue = rand(35, 52)
    const baseLeft = rand(2, 98)
    const baseTop = rand(2, 98)

    return {
      id: i,
      baseLeft,
      baseTop,
      style: {
        left: `${baseLeft}vw`,
        top: `${baseTop}vh`,
        width: `${size}px`,
        height: `${size}px`
      },
      glowStyle: {
        '--glow': `hsl(${hue}, 75%, 88%)`,
        '--flicker-dur': `${flickerDur}s`,
        animationDelay: `${flickerDelay}s`
      }
    }
  })

  requestAnimationFrame(() => {
    particles.value.forEach(p => {
      const el = els.get(p.id)
      if (el) {
        el.dataset.baseLeft = p.baseLeft
        el.dataset.baseTop = p.baseTop
      }
      timers.push(setTimeout(() => scheduleMove(p.id), rand(0, 3000)))
    })
  })
})

onUnmounted(() => {
  timers.forEach(t => clearTimeout(t))
})
</script>

<style scoped>
.particles-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10;
  overflow: hidden;
}

.particle {
  position: absolute;
  will-change: transform;
}

.particle-glow {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--glow, #fff);
  box-shadow:
    0 0 4px 1px var(--glow, rgba(255, 255, 255, 0.8)),
    0 0 10px 3px var(--glow, rgba(255, 255, 255, 0.4));
  animation: particleFlicker var(--flicker-dur, 2.5s) ease-in-out infinite;
  will-change: transform, opacity;
}

@keyframes particleFlicker {
  0%   { opacity: 0; transform: scale(0.6); }
  15%  { opacity: 0.95; transform: scale(1.15); }
  30%  { opacity: 0.2; }
  45%  { opacity: 0.85; transform: scale(1); }
  60%  { opacity: 0.05; }
  78%  { opacity: 0.7; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(0.6); }
}
</style>
