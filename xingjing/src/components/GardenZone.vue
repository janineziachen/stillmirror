<template>
  <div class="zone-overlay" v-if="active">

    <img
      :src="detailImageSrc"
      class="zone-detail-image"
      @error="(e) => e.target.style.display = 'none'"
    />
    <div class="zone-image-wash"></div>

    <!-- 主解读卡片 -->
    <div class="zone-text-block" :class="{ visible: cardVisible, hidden: cardHidden }">
      <p
        v-for="(line, i) in interpretationLines"
        :key="i"
        class="zone-interpretation narrative-line"
        :class="{ visible: i <= visibleLineIndex }"
      >{{ line }}</p>
    </div>

    <!-- 互动按钮 -->
    <button
      v-if="showAction"
      class="zone-action-btn"
      :class="{ visible: showAction }"
      @click="doInteraction"
    >{{ zone.interaction.label }}</button>

    <!-- 互动后文字，单独居中逐行显示 -->
    <div class="zone-after-block" :class="{ visible: afterVisible }">
      <p
        v-for="(line, i) in afterLines"
        :key="i"
        class="zone-after-text narrative-line"
        :class="{ visible: i <= afterLineIndex }"
      >{{ line }}</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  zone: { type: Object, required: true },
  season: { type: String, required: true },
  active: { type: Boolean, default: false }
})

const emit = defineEmits(['interaction-done'])

const visibleLineIndex = ref(-1)
const cardVisible = ref(false)
const cardHidden = ref(false)
const showAction = ref(false)
const afterVisible = ref(false)
const afterLineIndex = ref(-1)

const detailImageSrc = computed(() =>
  `/assets/garden/detail-${props.zone.id}-${props.season}.png`
)

const interpretationLines = computed(() => {
  const text = props.zone.interpretations[props.season] || ''
  return text.split('\n').filter(s => s.trim())
})

const afterLines = computed(() => {
  const afterText = props.zone.interaction.afterText
  const text = typeof afterText === 'object'
    ? (afterText[props.season] || afterText['autumn'] || '')
    : afterText
  return text.split('\n').filter(s => s.trim())
})

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function playSequence() {
  visibleLineIndex.value = -1
  cardVisible.value = false
  cardHidden.value = false
  showAction.value = false
  afterVisible.value = false

  // 1. 等一秒
  await wait(1000)

  // 2. 卡片缓缓出现
  cardVisible.value = true
  await wait(600)

  // 走字
  for (let i = 0; i < interpretationLines.value.length; i++) {
    visibleLineIndex.value = i
    await wait(2600)
  }

  // 字走完，按钮出现
  showAction.value = true
}

async function doInteraction() {
  showAction.value = false
  cardHidden.value = true
  await wait(500)

  afterVisible.value = true
  afterLineIndex.value = -1

  for (let i = 0; i < afterLines.value.length; i++) {
    afterLineIndex.value = i
    await wait(1800)
  }

  await wait(2000)
  emit('interaction-done', props.zone.id)
}

watch(() => props.active, (val) => {
  if (val) playSequence()
}, { immediate: true })
</script>

<style scoped>
.zone-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
}

.zone-detail-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
  z-index: 0;
}

.zone-image-wash {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  pointer-events: none;
  z-index: 1;
}

/* 主解读卡片 */
.zone-text-block {
  position: absolute;
  bottom: 7vh;
  left: 50%;
  transform: translateX(-50%);
  width: 82%;
  max-width: 560px;
  z-index: 10;
  text-align: center;
  padding: 16px 24px 14px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  opacity: 0;
  transition: opacity 0.8s ease;
}

.zone-text-block.visible {
  opacity: 1;
}

.zone-text-block.hidden {
  opacity: 0;
  pointer-events: none;
}

.zone-interpretation {
  font-size: 16px;
  line-height: 1.55;
  margin-bottom: 2px;
  color: rgba(255, 255, 255, 1);
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 1),
    0 2px 6px rgba(0, 0, 0, 0.9),
    0 4px 12px rgba(0, 0, 0, 0.7),
    0 0 20px rgba(0, 0, 0, 0.5);
}

/* 互动后文字块，居中独立显示 */
.zone-after-block {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.8s ease;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.4);
}

.zone-after-block.visible {
  opacity: 1;
}

.zone-after-text {
  font-size: 20px;
  line-height: 1.75;
  letter-spacing: 1px;
  text-align: center;
  color: rgba(255, 255, 255, 1);
  text-shadow:
    0 1px 3px rgba(0, 0, 0, 1),
    0 2px 8px rgba(0, 0, 0, 0.9),
    0 4px 16px rgba(0, 0, 0, 0.7),
    0 8px 32px rgba(0, 0, 0, 0.5);
}

/* 互动按钮 */
.zone-action-btn {
  position: absolute;
  bottom: 25vh;
  right: 20vw;
  z-index: 10;
  padding: 10px 24px;
  font-size: 17px;
  font-weight: 400;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 1);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 999px;
  opacity: 0;
  transition: opacity 0.8s ease, background 0.3s, border-color 0.3s;
}

.zone-action-btn.visible {
  opacity: 1;
  animation: btnBreathe 3s ease-in-out infinite;
}

.zone-action-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.5);
}

@keyframes btnBreathe {
  0%, 100% { opacity: 0.75; }
  50% { opacity: 1; }
}
</style>
