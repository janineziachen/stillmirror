<template>
  <div class="garden-viewport" @wheel.prevent="onWheel" ref="viewportRef">

    <!-- White flash overlay for zone transitions -->
    <div class="white-overlay" :class="{ visible: showWhite }"></div>

    <!-- Panorama -->
    <div class="garden-canvas" :style="{ transform: `translateX(-${scrollOffset}px)` }">
      <img
        :src="panoramaSrc"
        class="garden-panorama"
        ref="panoramaRef"
        @load="onImageLoad"
        @error="(e) => e.target.style.display = 'none'"
      />

      <!-- Clickable hotspots on panorama -->
      <button
        v-for="(zone, i) in ZONES"
        :key="zone.id"
        class="hotspot"
        :class="{ visited: interactedZones.includes(zone.id) }"
        :style="hotspotStyle(zone)"
        @click="onHotspotClick(i)"
      >
        <span class="hotspot-ring"></span>
        <span class="hotspot-label">{{ zone.label }}</span>
      </button>
    </div>

    <!-- Zone detail overlay -->
    <GardenZone
      v-if="zoomed && currentZone"
      :zone="currentZone"
      :season="currentZoneSeason"
      :active="zoneActive"
      @interaction-done="onInteractionDone"
    />

    <!-- Hint text -->
    <p v-if="showHint && !zoomed" class="garden-hint">{{ hintText }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import GardenZone from './GardenZone.vue'
import gardenConfig from '../content/garden.json'

const props = defineProps({
  gardenResult: { type: Object, required: true },
  active: { type: Boolean, default: false }
})

const emit = defineEmits(['garden-complete'])

const ZONES = gardenConfig.zones
const phase = ref('intro')
const zoomed = ref(false)
const currentZoneIndex = ref(-1)
const zoneActive = ref(false)
const showWhite = ref(false)
const showHint = ref(false)
const interactedZones = ref([])
const viewportRef = ref(null)
const panoramaRef = ref(null)
const scrollOffset = ref(0)
const maxScroll = ref(0)
const imageScale = ref(1)  // rendered height / natural height

const panoramaSrc = computed(() => {
  const type = props.gardenResult.panoramaType
  return `/assets/garden/panorama-${type}.webp`
})

const currentZone = computed(() => {
  if (currentZoneIndex.value < 0) return null
  return ZONES[currentZoneIndex.value]
})

const currentZoneSeason = computed(() => {
  if (!currentZone.value) return 'mixed'
  return props.gardenResult.gardenState[currentZone.value.id] || 'autumn'
})

const remainingZones = computed(() =>
  ZONES.filter(z => !interactedZones.value.includes(z.id)).length
)

const hintText = computed(() => {
  if (phase.value === 'overview') {
    return remainingZones.value === ZONES.length
      ? '滚动探索你的花园，点击发光的区域'
      : `还有 ${remainingZones.value} 处等你探索`
  }
  return ''
})

function hotspotStyle(zone) {
  const s = imageScale.value
  const pType = props.gardenResult.panoramaType
  const pos = zone.position[pType] || zone.position.spring
  return {
    position: 'absolute',
    left: `${pos.x * s}px`,
    top: `${pos.y * s}px`,
    transform: 'translate(-50%, -50%)'
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function startIntro() {
  await wait(600)
  showHint.value = true
  phase.value = 'overview'
}

function onImageLoad() {
  const img = panoramaRef.value
  if (img) {
    imageScale.value = img.offsetHeight / img.naturalHeight
    maxScroll.value = img.offsetWidth - window.innerWidth
  }
}

let resizeObs = null
onMounted(() => {
  resizeObs = new ResizeObserver(() => {
    const img = panoramaRef.value
    if (img && img.naturalHeight) {
      imageScale.value = img.offsetHeight / img.naturalHeight
      maxScroll.value = img.offsetWidth - window.innerWidth
    }
  })
  if (viewportRef.value) resizeObs.observe(viewportRef.value)
  nextTick(() => {
    const img = panoramaRef.value
    if (img && img.naturalHeight) {
      imageScale.value = img.offsetHeight / img.naturalHeight
      maxScroll.value = img.offsetWidth - window.innerWidth
      if (resizeObs) resizeObs.observe(img)
    }
  })
})
onUnmounted(() => { resizeObs?.disconnect() })

function onWheel(e) {
  if (zoomed.value) return
  const delta = e.deltaY || e.deltaX
  scrollOffset.value = Math.max(0, Math.min(maxScroll.value, scrollOffset.value + delta))
}

async function onHotspotClick(index) {
  if (zoomed.value) return
  currentZoneIndex.value = index
  showHint.value = false

  // white fade in
  showWhite.value = true
  await wait(600)

  zoomed.value = true
  zoneActive.value = true

  // white fade out
  await wait(200)
  showWhite.value = false
  phase.value = 'zone'
}

async function onInteractionDone(zoneId) {
  if (!interactedZones.value.includes(zoneId)) {
    interactedZones.value.push(zoneId)
  }

  // white fade out of detail view
  showWhite.value = true
  await wait(600)

  zoneActive.value = false
  zoomed.value = false
  showHint.value = true
  phase.value = 'overview'

  await wait(200)
  showWhite.value = false

  if (interactedZones.value.length >= ZONES.length) {
    setTimeout(() => emit('garden-complete'), 2000)
  }
}

watch(() => props.active, (val) => {
  if (val) startIntro()
}, { immediate: true })
</script>

<style scoped>
.garden-viewport {
  position: fixed;
  inset: 0;
  overflow: hidden;
  cursor: none;
}

.garden-canvas {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  will-change: transform;
  transition: transform 0.1s linear;
}

.garden-panorama {
  height: 100%;
  width: auto;
  display: block;
}

/* White flash overlay */
.white-overlay {
  position: fixed;
  inset: 0;
  background: #fff;
  opacity: 0;
  pointer-events: none;
  z-index: 200;
  transition: opacity 0.6s ease;
}

.white-overlay.visible {
  opacity: 1;
}

/* Hotspot */
.hotspot {
  position: absolute;
  background: none;
  border: none;
  cursor: none;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
  padding: 0;
}

.hotspot.visited .hotspot-ring {
  opacity: 0.2;
}

.hotspot-ring {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2.5px solid rgba(255, 255, 220, 1);
  box-shadow:
    0 0 12px 4px rgba(255, 220, 100, 0.7),
    0 0 24px 8px rgba(255, 200, 60, 0.4),
    inset 0 0 10px rgba(255, 240, 160, 0.4);
  animation: hotspotPulse 2.4s ease-in-out infinite;
}

.hotspot-label {
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 2.5px;
  color: rgba(255, 255, 220, 1);
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 220, 0.5);
  border-radius: 999px;
  padding: 3px 12px;
  white-space: nowrap;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
}

@keyframes hotspotPulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
}

/* Hint */
.garden-hint {
  position: fixed;
  bottom: 6vh;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 1);
  font-size: 15px;
  letter-spacing: 1px;
  pointer-events: none;
  z-index: 50;
  background: rgba(0, 0, 0, 0.35);
  padding: 4px 14px;
  border-radius: 999px;
  text-shadow:
    0 1px 4px rgba(0,0,0,1),
    0 2px 12px rgba(0,0,0,0.8);
}
</style>
