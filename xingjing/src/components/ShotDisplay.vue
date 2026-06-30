<template>
  <div
    class="scene-container"
    @click="handleAdvance"
    @keydown.space.prevent="handleAdvance"
    @keydown.enter.prevent="handleAdvance"
    @mousemove="onMouseMove"
    tabindex="0"
    ref="containerRef"
  >
    <div class="scene-image-wrapper" :style="parallaxStyle">
      <img
        v-if="image"
        :src="image"
        class="scene-image"
        :class="{ visible: imageVisible }"
        @error="onImageError"
      />
    </div>

    <div class="text-backdrop"></div>
    <div class="narrative-text">
      <p
        v-for="(line, i) in lines"
        :key="`${textGen}-${i}`"
        class="narrative-line"
        :class="{ visible: i <= visibleLineIndex }"
      >
        {{ line }}
      </p>
    </div>

    <p v-if="allLinesShown && !completed" class="hint-text">点击继续</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  image: { type: String, default: null },
  lines: { type: Array, required: true },
  active: { type: Boolean, default: false }
})

const emit = defineEmits(['complete'])

const containerRef = ref(null)
const imageVisible = ref(false)
const visibleLineIndex = ref(-1)
const allLinesShown = ref(false)
const completed = ref(false)
const animating = ref(false)

const mouseX = ref(0.5)
const mouseY = ref(0.5)

let generation = 0
let skipResolve = null
const textGen = ref(0)

const parallaxStyle = computed(() => {
  const offsetX = (mouseX.value - 0.5) * -8
  const offsetY = (mouseY.value - 0.5) * -5
  return {
    transform: `translate(${offsetX}px, ${offsetY}px) scale(1.03)`
  }
})

function onMouseMove(e) {
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect) return
  mouseX.value = e.clientX / rect.width
  mouseY.value = e.clientY / rect.height
}

function wait(ms) {
  return new Promise(resolve => {
    skipResolve = resolve
    setTimeout(resolve, ms)
  })
}

async function playSequence() {
  if (!props.active) return
  const gen = ++generation
  textGen.value++
  animating.value = true
  visibleLineIndex.value = -1
  allLinesShown.value = false
  completed.value = false

  imageVisible.value = true
  await wait(1500)
  if (gen !== generation) return

  for (let i = 0; i < props.lines.length; i++) {
    if (!props.active || gen !== generation) return
    visibleLineIndex.value = i
    await wait(1500)
    if (gen !== generation) return
  }

  allLinesShown.value = true
  animating.value = false
  skipResolve = null
}

function handleAdvance() {
  if (completed.value) return

  if (animating.value) {
    visibleLineIndex.value = props.lines.length - 1
    allLinesShown.value = true
    animating.value = false
    if (skipResolve) { skipResolve(); skipResolve = null }
    return
  }

  if (!allLinesShown.value) return
  completed.value = true
  emit('complete')
}

function onImageError(e) {
  e.target.style.display = 'none'
}

watch(() => props.active, (val) => {
  if (val) {
    imageVisible.value = false
    nextTick(() => {
      containerRef.value?.focus()
      playSequence()
    })
  }
}, { immediate: true })

watch(() => props.lines, (newLines, oldLines) => {
  if (!props.active) return
  if (newLines === oldLines) return
  const gen = ++generation
  textGen.value++
  animating.value = true
  visibleLineIndex.value = -1
  allLinesShown.value = false
  completed.value = false
  skipResolve = null
  const runLines = async () => {
    await wait(400)
    if (gen !== generation) return
    for (let i = 0; i < newLines.length; i++) {
      if (!props.active || gen !== generation) return
      visibleLineIndex.value = i
      await wait(1500)
      if (gen !== generation) return
    }
    allLinesShown.value = true
    animating.value = false
    skipResolve = null
  }
  runLines()
})
</script>

<style scoped>
.scene-image-wrapper {
  position: absolute;
  inset: 0;
  overflow: hidden;
  transition: transform 1.2s var(--ease-gentle);
  will-change: transform;
}

.scene-image-wrapper .scene-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  background: #000;
}

.text-backdrop {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 42%;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.72) 0%,
    rgba(0, 0, 0, 0.45) 40%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 1;
}
</style>
