<template>
  <div class="scene-player">
    <!-- Black overlay for transitions -->
    <div class="transition-overlay" :class="{ visible: showBlack }"></div>

    <!-- Shot display -->
    <ShotDisplay
      v-if="phase === 'shots' || phase === 'response' || phase === 'planting' || phase === 'choice'"
      :image="currentImage"
      :lines="currentLines"
      :active="shotActive"
      :key="shotKey"
      @complete="onShotComplete"
    />

    <!-- Choice background image -->
    <img
      v-if="phase === 'choice' && sceneData.choice.image"
      :src="sceneData.choice.image"
      class="scene-image visible"
      style="z-index: 0;"
      @error="(e) => e.target.style.display = 'none'"
    />

    <!-- Choice panel -->
    <ChoicePanel
      v-if="phase === 'choice'"
      :prompt="sceneData.choice.prompt"
      :options="sceneData.choice.options"
      :visible="choiceVisible"
      @choose="onChoose"
    />

    <!-- Back button -->
    <button
      class="back-btn"
      :class="{ visible: canGoBack }"
      @click.stop="goBack"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ShotDisplay from './ShotDisplay.vue'
import ChoicePanel from './ChoicePanel.vue'

const props = defineProps({
  sceneData: { type: Object, required: true },
  active: { type: Boolean, default: false }
})

const emit = defineEmits(['scene-complete'])

const phase = ref('shots')
const shotIndex = ref(0)
const shotActive = ref(false)
const showBlack = ref(false)
const choiceVisible = ref(false)
const chosenOption = ref(null)

const shotKey = computed(() => {
  const shots = props.sceneData.shots
  if (!shots) return `${shotIndex.value}-${phase.value}`
  const idx = phase.value === 'choice' ? shots.length - 1 : shotIndex.value
  const img = shots[idx]?.image
  let groupStart = idx
  while (groupStart > 0 && shots[groupStart - 1]?.image === img) groupStart--
  const phaseKey = phase.value === 'choice' ? 'shots' : phase.value
  return `${shots[0]?.id}-${groupStart}-${phaseKey}`
})

const currentImage = computed(() => {
  if (phase.value === 'shots') {
    return props.sceneData.shots[shotIndex.value]?.image || null
  }
  if (phase.value === 'choice') {
    const shots = props.sceneData.shots
    return props.sceneData.choice?.image || shots[shots.length - 1]?.image || null
  }
  if (phase.value === 'planting') {
    return props.sceneData.plantingImage || null
  }
  if (phase.value === 'response' && chosenOption.value) {
    return chosenOption.value.responseImage || null
  }
  return null
})

const nextImage = computed(() => {
  if (phase.value === 'shots') {
    return props.sceneData.shots[shotIndex.value + 1]?.image || null
  }
  return null
})

const sameImageNext = computed(() =>
  phase.value === 'shots' &&
  currentImage.value !== null &&
  currentImage.value === nextImage.value
)

const currentLines = computed(() => {
  if (phase.value === 'shots') {
    return props.sceneData.shots[shotIndex.value]?.lines || []
  }
  if (phase.value === 'planting') {
    return props.sceneData.plantingLines || []
  }
  if (phase.value === 'response' && chosenOption.value) {
    return chosenOption.value.responseLines || []
  }
  return []
})

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const canGoBack = computed(() => {
  if (phase.value === 'shots' && shotIndex.value > 0) return true
  if (phase.value === 'choice') return true
  return false
})

const prevImage = computed(() => {
  if (phase.value === 'shots' && shotIndex.value > 0) {
    return props.sceneData.shots[shotIndex.value - 1]?.image || null
  }
  if (phase.value === 'choice') {
    const shots = props.sceneData.shots
    return shots[shots.length - 1]?.image || null
  }
  return null
})

async function goBack() {
  if (!canGoBack.value) return

  if (phase.value === 'choice') {
    choiceVisible.value = false
    await wait(200)
    phase.value = 'shots'
    shotIndex.value = props.sceneData.shots.length - 1
    shotActive.value = true
    return
  }

  const sameImagePrev = currentImage.value !== null && currentImage.value === prevImage.value
  if (sameImagePrev) {
    shotIndex.value--
  } else {
    shotActive.value = false
    await wait(300)
    shotIndex.value--
    shotActive.value = true
  }
}

async function transitionToNext() {
  if (sameImageNext.value) {
    return
  }
  shotActive.value = false
  await wait(300)
  shotActive.value = true
}

async function onShotComplete() {
  const isLastShot = shotIndex.value >= props.sceneData.shots.length - 1

  if (phase.value === 'response' && props.sceneData.plantingImage) {
    shotActive.value = false
    await wait(300)
    phase.value = 'planting'
    await wait(100)
    shotActive.value = true
    return
  }

  if (phase.value === 'planting') {
    emit('scene-complete', {
      sceneId: props.sceneData.dimension || 'opening',
      choice: chosenOption.value
        ? {
            id: chosenOption.value.id,
            score: chosenOption.value.score ?? null,
            seedType: chosenOption.value.seedType ?? null,
            input: chosenOption.value._userInput ?? null
          }
        : null
    })
    return
  }

  if (phase.value === 'response') {
    emit('scene-complete', {
      sceneId: props.sceneData.dimension || 'opening',
      choice: chosenOption.value
        ? {
            id: chosenOption.value.id,
            score: chosenOption.value.score ?? null,
            seedType: chosenOption.value.seedType ?? null,
            input: chosenOption.value._userInput ?? null
          }
        : null
    })
    return
  }

  if (isLastShot && props.sceneData.choice) {
    phase.value = 'choice'
    await wait(300)
    choiceVisible.value = true
  } else if (isLastShot && !props.sceneData.choice) {
    emit('scene-complete', { sceneId: 'opening', choice: null })
  } else {
    await transitionToNext()
    shotIndex.value++
  }
}

async function onChoose({ optionId, input }) {
  const option = props.sceneData.choice.options.find(o => o.id === optionId)
  if (input) option._userInput = input
  chosenOption.value = option
  choiceVisible.value = false

  await wait(300)
  phase.value = 'response'
  await wait(100)
  shotActive.value = true
}

function reset() {
  phase.value = 'shots'
  shotIndex.value = 0
  shotActive.value = false
  showBlack.value = false
  choiceVisible.value = false
  chosenOption.value = null
}

watch(() => props.active, (val) => {
  if (val) {
    reset()
    setTimeout(() => { shotActive.value = true }, 100)
  }
}, { immediate: true })
</script>

<style scoped>
.scene-player {
  position: fixed;
  inset: 0;
}

.transition-overlay {
  position: fixed;
  inset: 0;
  background: white;
  opacity: 0;
  transition: opacity 2s var(--ease-gentle);
  pointer-events: none;
  z-index: 100;
}

.transition-overlay.visible {
  opacity: 1;
}

.scene-image {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
  z-index: 0;
}

.back-btn {
  position: fixed;
  bottom: 24px;
  left: 64px;
  z-index: 50;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s, background 0.3s;
  opacity: 0;
  pointer-events: none;
}

.back-btn.visible {
  opacity: 0.5;
  pointer-events: auto;
}

.back-btn.visible:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}
</style>
