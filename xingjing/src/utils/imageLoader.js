const loaded = new Set()

export function preloadImages(srcs) {
  const toLoad = srcs.filter(src => src && !loaded.has(src))
  return Promise.all(toLoad.map(src =>
    new Promise(resolve => {
      const img = new Image()
      img.onload = () => { loaded.add(src); resolve() }
      img.onerror = resolve
      img.src = src
    })
  ))
}

export function getSceneImageSrcs(sceneData) {
  const srcs = []
  if (sceneData.shots) {
    sceneData.shots.forEach(shot => {
      if (shot.image) srcs.push(shot.image)
    })
  }
  if (sceneData.choice) {
    if (sceneData.choice.image) srcs.push(sceneData.choice.image)
    sceneData.choice.options.forEach(opt => {
      if (opt.responseImage) srcs.push(opt.responseImage)
    })
  }
  return srcs
}
