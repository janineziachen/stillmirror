import { reactive, computed } from 'vue'
import { calculateResult } from '../utils/scoring.js'

const SCENE_ORDER = ['opening', 'scene1', 'scene2', 'scene3', 'scene4', 'scene5', 'scene6']

const state = reactive({
  phase: 'loading',
  currentSceneIndex: 0,
  choices: {},
  gardenResult: null,
  gardenExplore: {
    currentZoneIndex: -1,
    interacted: [],
    zoomed: false
  }
})

export function useGameState() {
  const currentSceneId = computed(() => SCENE_ORDER[state.currentSceneIndex])
  const isLastScene = computed(() => state.currentSceneIndex === SCENE_ORDER.length - 1)

  function startGame() {
    state.phase = 'narrative'
    state.currentSceneIndex = 0
  }

  function recordChoice(sceneId, choice) {
    state.choices[sceneId] = choice
  }

  function advanceScene() {
    if (isLastScene.value) {
      state.gardenResult = calculateResult(state.choices)
      state.phase = 'fog-transition'
    } else {
      state.currentSceneIndex++
    }
  }

  function enterGarden() {
    state.phase = 'garden'
  }

  function enterResult() {
    state.phase = 'result'
  }

  function restartGame() {
    state.phase = 'loading'
    state.currentSceneIndex = 0
    state.choices = {}
    state.gardenResult = null
    state.gardenExplore.currentZoneIndex = -1
    state.gardenExplore.interacted = []
    state.gardenExplore.zoomed = false
  }

  function markZoneInteracted(zoneId) {
    if (!state.gardenExplore.interacted.includes(zoneId)) {
      state.gardenExplore.interacted.push(zoneId)
    }
  }

  function setZoom(zoomed, zoneIndex = -1) {
    state.gardenExplore.zoomed = zoomed
    state.gardenExplore.currentZoneIndex = zoneIndex
  }

  return {
    state,
    currentSceneId,
    isLastScene,
    startGame,
    recordChoice,
    advanceScene,
    enterGarden,
    enterResult,
    restartGame,
    markZoneInteracted,
    setZoom
  }
}
