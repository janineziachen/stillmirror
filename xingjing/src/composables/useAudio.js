import { ref, reactive } from 'vue'

const audioState = reactive({
  muted: false,
  masterVolume: 1
})

const activeAudios = new Map()
const fadeIntervals = new Map()

function createAudio(src, { loop = false } = {}) {
  const audio = new Audio(src)
  audio.loop = loop
  audio.volume = 0
  audio.preload = 'auto'
  return audio
}

function clearFade(key) {
  if (fadeIntervals.has(key)) {
    clearInterval(fadeIntervals.get(key))
    fadeIntervals.delete(key)
  }
}

function fadeIn(key, audio, targetVolume, duration = 3000) {
  clearFade(key)
  audio._targetVolume = targetVolume
  audio.volume = 0
  audio.play().catch(() => {})
  const steps = 60
  const stepTime = duration / steps
  let current = 0
  const interval = setInterval(() => {
    current += targetVolume / steps
    if (current >= targetVolume) {
      audio.volume = audioState.muted ? 0 : targetVolume
      clearFade(key)
    } else {
      audio.volume = audioState.muted ? 0 : current
    }
  }, stepTime)
  fadeIntervals.set(key, interval)
}

function fadeOut(key, audio, duration = 3000) {
  clearFade(key)
  const startVolume = audio._targetVolume || audio.volume
  if (startVolume <= 0) { audio.pause(); return }
  const steps = 60
  const stepTime = duration / steps
  let current = startVolume
  const interval = setInterval(() => {
    current -= startVolume / steps
    if (current <= 0) {
      audio.volume = 0
      audio.pause()
      clearFade(key)
    } else {
      audio.volume = audioState.muted ? 0 : current
    }
  }, stepTime)
  fadeIntervals.set(key, interval)
}

export function useAudio() {
  const currentScene = ref(null)

  // 所有曲目统一目标响度约 -18 LUFS 感知区间
  // 各曲已知响度差异用 volume 补偿：越安静的曲子给更高的值
  const AUDIO_CONFIG = {
    opening: {
      music: { src: '/audio/music-opening.mp3', volume: 0.30, loop: true }
    },
    scene1: {
      music: { src: '/audio/music-lake.mp3', volume: 0.28, loop: true }
    },
    scene2: {
      music: { src: '/audio/music-sky.mp3', volume: 0.30, loop: true }
    },
    scene3: {
      music: { src: '/audio/music-path.mp3', volume: 0.18, loop: true }
    },
    scene4: {
      music: { src: '/audio/music-tree.mp3', volume: 0.24, loop: true }
    },
    scene5: {
      music: { src: '/audio/music-garden.mp3', volume: 0.30, loop: true }
    },
    scene6: {
      music: { src: '/audio/music-bridge.mp3', volume: 0.20, loop: true }
    },
    garden: {
      music: { src: '/audio/music-garden-view.mp3', volume: 0.28, loop: true }
    },
    result: {
      music: { src: '/audio/music-result.mp3', volume: 0.26, loop: true }
    }
  }

  const SFX = {
    click: { src: '/audio/sfx-click.mp3', volume: 0.3 },
    transition: { src: '/audio/sfx-transition.mp3', volume: 0.2 },
    interaction: { src: '/audio/sfx-interaction.mp3', volume: 0.25 }
  }

  function switchScene(sceneId) {
    if (currentScene.value === sceneId) return
    currentScene.value = sceneId

    // 淡出所有正在播放的音轨（3s），之后清除
    activeAudios.forEach((audio, key) => {
      fadeOut(key, audio, 3000)
      setTimeout(() => {
        activeAudios.delete(key)
        fadeIntervals.delete(key)
      }, 3200)
    })

    const config = AUDIO_CONFIG[sceneId]
    if (!config) return

    // 新音轨在 0.5s 后开始淡入，与淡出重叠 2.5s，过渡更丝滑
    setTimeout(() => {
      if (config.ambient) {
        const key = `${sceneId}-ambient`
        const audio = createAudio(config.ambient.src, { loop: config.ambient.loop })
        activeAudios.set(key, audio)
        fadeIn(key, audio, config.ambient.volume, 3000)
      }
      if (config.music) {
        const key = `${sceneId}-music`
        const audio = createAudio(config.music.src, { loop: config.music.loop })
        activeAudios.set(key, audio)
        fadeIn(key, audio, config.music.volume, 3000)
      }
    }, 500)
  }

  function resumeAll() {
    activeAudios.forEach(audio => {
      if (audio.paused) audio.play().catch(() => {})
    })
  }

  function playSfx(name) {
    const config = SFX[name]
    if (!config || audioState.muted) return
    const audio = new Audio(config.src)
    audio.volume = config.volume
    audio.play().catch(() => {})
  }

  function toggleMute() {
    audioState.muted = !audioState.muted
    activeAudios.forEach((audio, key) => {
      if (audioState.muted) {
        audio.volume = 0
      } else {
        // 恢复到当前淡入/淡出进行中的正确音量
        audio.volume = audio._targetVolume || 0.25
      }
    })
  }

  function stopAll() {
    fadeIntervals.forEach(interval => clearInterval(interval))
    fadeIntervals.clear()
    activeAudios.forEach(audio => {
      audio.volume = 0
      audio.pause()
      audio.currentTime = 0
    })
    activeAudios.clear()
  }

  return {
    audioState,
    switchScene,
    resumeAll,
    playSfx,
    toggleMute,
    stopAll
  }
}

