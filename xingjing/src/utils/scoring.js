export function getSeasonState(score) {
  if (score <= 2) return 'winter'
  if (score === 3) return 'autumn'
  return 'spring'
}

export function getPanoramaType(scores) {
  const vals = Object.values(scores)
  const winterCount = vals.filter(s => s <= 2).length
  const springCount = vals.filter(s => s >= 4).length
  if (winterCount >= 3) return 'winter'
  if (springCount >= 3) return 'spring'
  return 'mixed'
}

export function getNarrativeTemplate(scores) {
  const seasons = Object.values(scores).map(s => getSeasonState(s))
  const winterCount = seasons.filter(s => s === 'winter').length
  const springCount = seasons.filter(s => s === 'spring').length
  const autumnCount = seasons.filter(s => s === 'autumn').length

  if (winterCount >= 4) return 'mostly-winter'
  if (autumnCount >= 4) return 'mostly-autumn'
  if (springCount >= 4) return 'mostly-spring'
  if (winterCount >= 3 && springCount >= 1) return 'one-bright-spot'
  if (springCount >= 3 && winterCount >= 1) return 'one-dark-spot'
  if (winterCount >= 2 && springCount >= 1) return 'mixed-warming'
  if (springCount >= 2 && winterCount >= 1) return 'mixed-cooling'
  return 'mixed-warming'
}

export function getLowestDimension(scores) {
  const priority = ['acceptance', 'present', 'defusion', 'self', 'action']
  let lowestScore = 6
  let lowestDim = null
  for (const dim of priority) {
    if (scores[dim] < lowestScore) {
      lowestScore = scores[dim]
      lowestDim = dim
    }
  }
  return lowestDim
}

export function calculateResult(choices) {
  const scores = {
    acceptance: choices.scene1?.score ?? 3,
    defusion: choices.scene2?.score ?? 3,
    present: choices.scene3?.score ?? 3,
    self: choices.scene4?.score ?? 3,
    action: choices.scene6?.score ?? 3
  }
  const seedType = choices.scene5?.seedType ?? 'warm'

  const gardenState = {
    lake: getSeasonState(scores.acceptance),
    sky: getSeasonState(scores.defusion),
    path: getSeasonState(scores.present),
    tree: getSeasonState(scores.self),
    garden: getSeasonState(scores.action),
    bridge: getSeasonState(scores.action)
  }

  const panoramaType = getPanoramaType(scores)
  const narrativeTemplate = getNarrativeTemplate(scores)
  const lowestDimension = getLowestDimension(scores)

  return {
    scores,
    seedType,
    gardenState,
    panoramaType,
    narrativeTemplate,
    lowestDimension
  }
}
