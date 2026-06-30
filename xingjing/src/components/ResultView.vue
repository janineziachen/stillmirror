<template>
  <div class="result-container" :class="{ visible: contentVisible }">
    <img
      :src="panoramaSrc"
      class="result-bg"
      @error="(e) => e.target.style.display = 'none'"
    />

    <div class="result-scroll">
      <div class="result-content">
      <!-- Overall narrative -->
      <p
        v-for="(line, i) in allLines"
        :key="i"
        class="result-line"
        :class="{ visible: i <= visibleLineIndex }"
      >
        {{ line }}
      </p>

      <!-- Action -->
      <div v-if="showAction" class="result-action">
        <p class="result-action-label">花园给你的悄悄话</p>
        <p
          v-for="(line, i) in actionLines"
          :key="i"
          class="result-action-text"
        >{{ line }}</p>
      </div>

      <!-- Save button -->
      <button v-if="showSave" class="save-btn" @click="showPoster = true">
        保存你的花园
      </button>
    </div>
    </div>

    <!-- Restart button -->
    <button v-if="showSave && !showPoster" class="restart-btn" @click="$emit('restart')">
      重新开始
    </button>

    <PosterGenerator
      v-if="showPoster"
      :panorama-type="gardenResult.panoramaType"
      :poster-text="posterText"
      @close="showPoster = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import PosterGenerator from './PosterGenerator.vue'
import { getInterpretation, getAction, getPosterText } from '../services/narrative.js'

const props = defineProps({
  gardenResult: { type: Object, required: true },
  active: { type: Boolean, default: false }
})

defineEmits(['restart'])

const contentVisible = ref(false)
const visibleLineIndex = ref(-1)
const showAction = ref(false)
const showSave = ref(false)
const showPoster = ref(false)

const interpretation = computed(() =>
  getInterpretation(props.gardenResult.scores, props.gardenResult.seedType)
)

const actionText = computed(() =>
  getAction(props.gardenResult.scores, props.gardenResult.seedType)
)

const actionLines = computed(() =>
  actionText.value.split('\n').map(l => l.trim()).filter(l => l)
)

const posterText = computed(() =>
  getPosterText(props.gardenResult.scores)
)

const panoramaSrc = computed(() =>
  `/assets/garden/panorama-${props.gardenResult.panoramaType}.png`
)

const allLines = computed(() => {
  const lines = []
  interpretation.value.overallText.split('\n').forEach(l => l.trim() && lines.push(l.trim()))
  lines.push('')
  interpretation.value.seedText.split('\n').forEach(l => l.trim() && lines.push(l.trim()))
  return lines.filter(l => l)
})

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function playSequence() {
  contentVisible.value = false
  visibleLineIndex.value = -1
  showAction.value = false
  showSave.value = false

  await wait(2000)
  contentVisible.value = true
  await wait(1000)

  for (let i = 0; i < allLines.value.length; i++) {
    visibleLineIndex.value = i
    await wait(1000 + 2500)
  }

  await wait(2000)
  showAction.value = true
  await wait(3000)
  showSave.value = true
}

watch(() => props.active, (val) => {
  if (val) playSequence()
}, { immediate: true })
</script>

<style scoped>
.result-container {
  position: fixed;
  inset: 0;
  opacity: 0;
  transition: opacity 2s var(--ease-gentle);
}

.result-container.visible {
  opacity: 1;
}

.result-bg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(20px) brightness(0.3);
  z-index: 0;
}

.result-scroll {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 26vh;
  padding-bottom: 12vh;
  z-index: 1;
  /* 隐藏滚动条但保留功能 */
  scrollbar-width: none;
}

.result-scroll::-webkit-scrollbar {
  display: none;
}

.result-content {
  position: relative;
  max-width: 560px;
  width: 90%;
  text-align: center;
}

.result-line {
  font-weight: 300;
  font-size: 17px;
  line-height: 1.7;
  color: var(--color-text-primary);
  opacity: 0;
  transition: opacity 1s var(--ease-gentle);
  margin-bottom: 2px;
}

.result-line.visible {
  opacity: 1;
}

.result-action {
  margin-top: var(--space-xl);
  padding: var(--space-lg);
  background: var(--color-glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 1px solid var(--color-glass-border);
  animation: fadeIn 1s var(--ease-gentle);
}

.result-action-label {
  font-family: var(--font-hint);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: var(--space-sm);
  letter-spacing: 1px;
}

.result-action-text {
  font-weight: 300;
  font-size: 17px;
  line-height: 1.75;
  color: rgba(255, 255, 255, 1);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.save-btn {
  margin-top: var(--space-xl);
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-glass-border);
  border-radius: 8px;
  font-family: var(--font-hint);
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: background 0.3s, color 0.3s;
  animation: fadeIn 1s var(--ease-gentle);
}

.save-btn:hover {
  background: var(--color-glass-hover);
  color: var(--color-text-primary);
}

.restart-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 300;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  cursor: pointer;
  transition: opacity 0.3s, background 0.3s, color 0.3s;
}

.restart-btn:hover {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.25);
}
</style>
