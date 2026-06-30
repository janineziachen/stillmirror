<template>
  <div class="cursor-glow" :style="cursorStyle" aria-hidden="true">
    <div class="cursor-orb"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const cursorStyle = ref({
  transform: 'translate(-100px, -100px)'
})

let targetX = -100
let targetY = -100
let currentX = -100
let currentY = -100
let rafId = null

function onMove(e) {
  targetX = e.clientX
  targetY = e.clientY
}

function animate() {
  currentX += (targetX - currentX) * 0.12
  currentY += (targetY - currentY) * 0.12
  cursorStyle.value = {
    transform: `translate(${currentX}px, ${currentY}px)`
  }
  rafId = requestAnimationFrame(animate)
}

onMounted(() => {
  window.addEventListener('mousemove', onMove)
  rafId = requestAnimationFrame(animate)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMove)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.cursor-glow {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 9999;
}

.cursor-orb {
  position: absolute;
  top: -25px;
  left: -25px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.7) 0%,
    rgba(255, 255, 255, 0.25) 25%,
    rgba(255, 255, 255, 0.06) 55%,
    transparent 100%
  );
  mix-blend-mode: screen;
}
</style>
