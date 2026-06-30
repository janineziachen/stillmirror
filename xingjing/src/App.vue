<script setup>
import { ref, computed, watch } from 'vue'
import ScenePlayer from './components/ScenePlayer.vue'
import GardenView from './components/GardenView.vue'
import ResultView from './components/ResultView.vue'
import FogTransition from './components/FogTransition.vue'
import DreamParticles from './components/DreamParticles.vue'
import CursorGlow from './components/CursorGlow.vue'
import { useGameState } from './composables/useGameState.js'
import { useAudio } from './composables/useAudio.js'
import { preloadImages, getSceneImageSrcs } from './utils/imageLoader.js'
import scenes from './content/scenes.json'

const { state, currentSceneId, advanceScene, recordChoice, startGame, enterGarden, enterResult, restartGame } = useGameState()
const { audioState, switchScene: switchAudio, resumeAll, playSfx, toggleMute } = useAudio()

const loadingVisible = ref(false)
const phaseVisible = ref(false)
const showBlack = ref(false)
const audioStarted = ref(false)
const startReady = ref(false)
const starting = ref(false)
const titleVisible = ref(false)

const SCENE_KEYS = ['opening', 'scene1', 'scene2', 'scene3', 'scene4', 'scene5', 'scene6']

const currentSceneData = computed(() => {
  const id = currentSceneId.value
  return scenes[id] || null
})

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function startAudioOnInteraction() {
  if (!audioStarted.value) {
    audioStarted.value = true
    switchAudio('opening')
  }
  resumeAll()
}

async function init() {
  await wait(500)
  loadingVisible.value = true

  const firstScenes = ['opening', 'scene1']
  const srcs = firstScenes.flatMap(id => scenes[id] ? getSceneImageSrcs(scenes[id]) : [])
  await preloadImages(srcs)

  await wait(500)
  loadingVisible.value = false
  titleVisible.value = true
  startReady.value = true
}

async function onStartExplore() {
  if (starting.value) return
  starting.value = true
  startReady.value = false
  titleVisible.value = false

  await wait(2000)
  startAudioOnInteraction()
  await wait(100)

  startGame()
  await wait(100)
  phaseVisible.value = true
}

async function onSceneComplete({ sceneId, choice }) {
  startAudioOnInteraction()
  playSfx('transition')

  if (choice) {
    const sceneKey = SCENE_KEYS[state.currentSceneIndex]
    recordChoice(sceneKey, choice)
  }

  const isLastScene = state.currentSceneIndex === SCENE_KEYS.length - 1

  phaseVisible.value = false
  showBlack.value = true

  const blackDuration = isLastScene ? 1200 : 300
  await wait(600 + blackDuration)

  advanceScene()

  if (state.phase === 'narrative') {
    const nextId = currentSceneId.value
    if (nextId !== 'scene2') switchAudio(nextId)
    const nextIndex = SCENE_KEYS.indexOf(nextId)
    if (nextIndex + 1 < SCENE_KEYS.length) {
      const afterNext = SCENE_KEYS[nextIndex + 1]
      if (scenes[afterNext]) preloadImages(getSceneImageSrcs(scenes[afterNext]))
    }
  } else if (state.phase === 'fog-transition') {
    switchAudio('garden')
  }

  showBlack.value = false
  await wait(100)
  phaseVisible.value = true
}

async function onFogComplete() {
  enterGarden()
}

function onGardenComplete() {
  phaseVisible.value = false
  switchAudio('result')
  setTimeout(() => {
    enterResult()
    phaseVisible.value = true
  }, 2000)
}

async function onRestart() {
  phaseVisible.value = false
  await wait(600)
  restartGame()
  starting.value = false
  audioStarted.value = false
  titleVisible.value = false
  startReady.value = false
  init()
}

// Debug panel sets state.phase directly — watch and sync phaseVisible
watch(() => state.phase, (newPhase, oldPhase) => {
  if (oldPhase === newPhase) return
  if (newPhase === 'garden' || newPhase === 'result' || newPhase === 'fog-transition') {
    phaseVisible.value = false
    setTimeout(() => { phaseVisible.value = true }, 100)
    if (newPhase === 'garden') switchAudio('garden')
    if (newPhase === 'fog-transition') switchAudio('garden')
    if (newPhase === 'result') switchAudio('result')
  }
})

init()
</script>

<template>
  <div class="app-root" @click="startAudioOnInteraction">

    <!-- Dream layers -->
    <CursorGlow />
    <DreamParticles :count="28" />
    <div class="vignette" v-if="state.phase !== 'loading'"></div>

    <!-- Mute button -->
    <button class="mute-btn" @click.stop="toggleMute" :title="audioState.muted ? '开启声音' : '静音'">
      <svg v-if="!audioState.muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
        <line x1="23" y1="9" x2="17" y2="15"/>
        <line x1="17" y1="9" x2="23" y2="15"/>
      </svg>
    </button>

    <!-- Title (loading + narrative opening only) -->
    <div class="title-layer" v-if="state.phase === 'loading' || state.phase === 'narrative'">
      <p class="loading-title" :class="{ visible: loadingVisible || titleVisible }">心镜</p>
    </div>

    <!-- Loading screen -->
    <div v-if="state.phase === 'loading'" class="loading-screen">
      <button
        class="start-btn"
        :class="{ visible: startReady }"
        :disabled="!startReady"
        @click="onStartExplore"
      >
        <img class="vine-frame" src="/assets/vine-frame.png" alt="" aria-hidden="true" />
        <span class="start-btn-text">开始探索</span>
      </button>
    </div>

    <!-- Black overlay for phase transitions -->
    <div class="app-black-overlay" :class="{ visible: showBlack }"></div>

    <!-- Phase: Narrative (Act 1) -->
    <div v-if="state.phase === 'narrative'" class="phase-wrapper" :class="{ visible: phaseVisible }">
      <ScenePlayer
        v-if="currentSceneData"
        :scene-data="currentSceneData"
        :active="phaseVisible"
        :key="currentSceneId"
        @scene-complete="onSceneComplete"
      />
    </div>

    <!-- Phase: Fog Transition (between narrative and garden) -->
    <div v-if="state.phase === 'fog-transition' || state.phase === 'garden'" class="phase-wrapper fog-phase" :class="{ visible: phaseVisible }">
      <GardenView
        :garden-result="state.gardenResult"
        :active="state.phase === 'garden' && phaseVisible"
        @garden-complete="onGardenComplete"
      />
      <FogTransition
        v-if="state.phase === 'fog-transition'"
        :active="phaseVisible"
        @complete="onFogComplete"
      />
    </div>

    <!-- Phase: Garden (Act 2) — GardenView rendered above, shared with fog-transition -->

    <!-- Phase: Result (Act 3) -->
    <div v-if="state.phase === 'result'" class="phase-wrapper" :class="{ visible: phaseVisible }">
      <ResultView
        :garden-result="state.gardenResult"
        :active="phaseVisible"
        @restart="onRestart"
      />
    </div>
  </div>
</template>

<style scoped>
.app-root {
  width: 100%;
  height: 100%;
  position: relative;
}

.mute-btn {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 1000;
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
  opacity: 0.5;
}

.mute-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.app-black-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-black);
  opacity: 0;
  transition: opacity 0.6s var(--ease-gentle);
  pointer-events: none;
  z-index: 500;
}

.app-black-overlay.visible {
  opacity: 1;
}

.fog-phase {
  transition: opacity 0.8s var(--ease-gentle);
}
</style>
