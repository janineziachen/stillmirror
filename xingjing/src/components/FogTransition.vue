<template>
  <div
    class="fog-transition"
    @click="handleClick"
    tabindex="0"
    ref="containerRef"
  >
    <!-- Fog layers -->
    <div class="fog-layers" :class="{ dispersing }">
      <div class="fog-layer fog-layer-1"></div>
      <div class="fog-layer fog-layer-2"></div>
      <div class="fog-layer fog-layer-3"></div>
      <div class="fog-layer fog-layer-4"></div>
      <div class="fog-layer fog-layer-5"></div>
    </div>

    <!-- Text -->
    <div class="fog-text" :class="{ hiding: dispersing }">
      <p
        v-for="(line, i) in lines"
        :key="i"
        class="fog-line"
        :class="{ visible: i <= visibleLineIndex }"
      >{{ line }}</p>
    </div>

    <!-- Click hint -->
    <p v-if="animating" class="fog-hint">点击跳过</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  active: { type: Boolean, default: false }
})

const emit = defineEmits(['complete'])

const lines = [
  '雾没有散。是你不需要它了。',
  '蓝。绿。远处一笔旧赭。',
  '你看了看手。指尖染着蓝，染着绿。',
  '原来你一路走，一路在画。',
  '有几处在亮。像是有什么想被你看见。'
]

const containerRef = ref(null)
const visibleLineIndex = ref(-1)
const allLinesShown = ref(false)
const completed = ref(false)
const animating = ref(false)
const dispersing = ref(false)

let generation = 0
let skipResolve = null

function wait(ms) {
  return new Promise(resolve => {
    skipResolve = resolve
    setTimeout(resolve, ms)
  })
}

async function playSequence() {
  if (!props.active) return
  const gen = ++generation
  animating.value = true
  visibleLineIndex.value = -1
  allLinesShown.value = false
  completed.value = false
  dispersing.value = false

  await wait(1500)
  if (gen !== generation) return

  for (let i = 0; i < lines.length; i++) {
    if (!props.active || gen !== generation) return
    visibleLineIndex.value = i
    await wait(2200)
    if (gen !== generation) return
  }

  allLinesShown.value = true
  animating.value = false
  skipResolve = null

  // Text done, pause briefly then start dispersal
  await wait(800)
  if (gen !== generation) return
  startDispersal()
}

function handleClick() {
  if (completed.value || dispersing.value) return

  if (animating.value) {
    visibleLineIndex.value = lines.length - 1
    allLinesShown.value = true
    animating.value = false
    if (skipResolve) { skipResolve(); skipResolve = null }
    return
  }
}

function startDispersal() {
  dispersing.value = true
  setTimeout(() => {
    completed.value = true
    emit('complete')
  }, 4500)
}

watch(() => props.active, (val) => {
  if (val) {
    containerRef.value?.focus()
    playSequence()
  }
}, { immediate: true })
</script>

<style scoped>
.fog-transition {
  position: fixed;
  inset: 0;
  z-index: 10;
  cursor: pointer;
  outline: none;
  overflow: hidden;
}

/* --- Fog Layers --- */
.fog-layers {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.fog-layer {
  position: absolute;
  inset: -15%;
  will-change: opacity, transform;
}

/* Layers have slightly different opacities so their drift is visible against each other */
.fog-layer-1 {
  background: rgba(245, 240, 235, 0.85);
  mask-image: radial-gradient(ellipse 120% 120% at 50% 50%, transparent 30%, black 60%);
  -webkit-mask-image: radial-gradient(ellipse 120% 120% at 50% 50%, transparent 30%, black 60%);
  animation: driftA 12s ease-in-out infinite;
}

.fog-layer-2 {
  background: rgba(245, 240, 235, 0.8);
  mask-image: radial-gradient(ellipse 100% 110% at 45% 55%, transparent 20%, black 55%);
  -webkit-mask-image: radial-gradient(ellipse 100% 110% at 45% 55%, transparent 20%, black 55%);
  animation: driftB 9s ease-in-out infinite;
}

.fog-layer-3 {
  background: rgba(245, 240, 235, 0.9);
  mask-image: radial-gradient(ellipse 90% 85% at 55% 48%, transparent 10%, black 50%);
  -webkit-mask-image: radial-gradient(ellipse 90% 85% at 55% 48%, transparent 10%, black 50%);
  animation: driftC 14s ease-in-out infinite;
}

.fog-layer-4 {
  background: rgba(245, 240, 235, 0.85);
  mask-image: radial-gradient(ellipse 70% 75% at 48% 52%, black 0%, transparent 55%);
  -webkit-mask-image: radial-gradient(ellipse 70% 75% at 48% 52%, black 0%, transparent 55%);
  animation: driftB 11s ease-in-out infinite reverse;
}

.fog-layer-5 {
  background: var(--color-paper, #F5F0EB);
  mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, black 0%, transparent 45%);
  -webkit-mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, black 0%, transparent 45%);
  animation: driftA 16s ease-in-out infinite reverse;
}

/* Idle drift — larger movement, different rhythms */
@keyframes driftA {
  0% { transform: translate(0, 0) scale(1) rotate(0deg); }
  25% { transform: translate(25px, -15px) scale(1.02) rotate(0.3deg); }
  50% { transform: translate(-10px, 20px) scale(0.98) rotate(-0.2deg); }
  75% { transform: translate(-20px, -8px) scale(1.01) rotate(0.1deg); }
  100% { transform: translate(0, 0) scale(1) rotate(0deg); }
}

@keyframes driftB {
  0% { transform: translate(0, 0) scale(1) rotate(0deg); }
  33% { transform: translate(-20px, 12px) scale(1.015) rotate(-0.4deg); }
  66% { transform: translate(15px, -18px) scale(0.985) rotate(0.3deg); }
  100% { transform: translate(0, 0) scale(1) rotate(0deg); }
}

@keyframes driftC {
  0% { transform: translate(0, 0) scale(1) rotate(0deg); }
  20% { transform: translate(18px, 10px) scale(1.01) rotate(0.2deg); }
  40% { transform: translate(-8px, -20px) scale(0.99) rotate(-0.3deg); }
  60% { transform: translate(-22px, 5px) scale(1.02) rotate(0.15deg); }
  80% { transform: translate(12px, -12px) scale(0.98) rotate(-0.1deg); }
  100% { transform: translate(0, 0) scale(1) rotate(0deg); }
}

/* --- Progressive dissolve tied to text stages --- */

/* Default: full fog */
.fog-layer {
  opacity: 1;
}

/* Dispersal: layers dissolve from edges (layer 1) to center (layer 5) */
.fog-layers.dispersing .fog-layer-1 {
  animation: fogDissolve 2.8s 0s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  --drift-x: 15px; --drift-y: -10px;
}
.fog-layers.dispersing .fog-layer-2 {
  animation: fogDissolve 3s 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  --drift-x: -12px; --drift-y: 8px;
}
.fog-layers.dispersing .fog-layer-3 {
  animation: fogDissolve 3.2s 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  --drift-x: 8px; --drift-y: 12px;
}
.fog-layers.dispersing .fog-layer-4 {
  animation: fogDissolve 3.5s 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  --drift-x: -6px; --drift-y: -8px;
}
.fog-layers.dispersing .fog-layer-5 {
  animation: fogDissolve 3.8s 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  --drift-x: 3px; --drift-y: 5px;
}

@keyframes fogDissolve {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  50% {
    opacity: 0.5;
    transform: translate(var(--drift-x), var(--drift-y)) scale(1.04);
  }
  100% {
    opacity: 0;
    transform: translate(calc(var(--drift-x) * 2), calc(var(--drift-y) * 2)) scale(1.1);
  }
}

/* --- Text --- */
.fog-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 10%;
  z-index: 5;
  transition: opacity 1.2s var(--ease-gentle);
}

.fog-text.hiding {
  opacity: 0;
}

.fog-line {
  font-family: var(--font-narrative);
  font-weight: 300;
  font-size: 20px;
  line-height: 2.4;
  letter-spacing: 1.5px;
  color: rgba(60, 50, 40, 0.85);
  text-align: center;
  opacity: 0;
  transition: opacity 1.2s var(--ease-gentle);
}

.fog-line.visible {
  opacity: 1;
}

.fog-hint {
  position: absolute;
  bottom: 6vh;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-hint);
  font-size: 14px;
  font-weight: 300;
  color: rgba(60, 50, 40, 0.4);
  animation: breathe 3s var(--ease-breathe) infinite;
  z-index: 5;
}
</style>
