import interpretations from '../content/interpretations.json'
import actions from '../content/actions.json'
import { getSeasonState, getNarrativeTemplate, getLowestDimension } from '../utils/scoring.js'

export function getInterpretation(scores, seedType) {
  const dimensionKeys = ['acceptance', 'defusion', 'present', 'self', 'action']
  const dimensionTexts = dimensionKeys.map(key => {
    const season = getSeasonState(scores[key])
    return interpretations.dimensions[key][season]
  })

  const seedText = interpretations.seeds[seedType]
  const template = getNarrativeTemplate(scores)
  const overallText = interpretations.overall[template]

  return { overallText, dimensionTexts, seedText }
}

export function getAction(scores, seedType) {
  const lowest = getLowestDimension(scores)
  return actions[lowest][seedType]
}

export function getPosterText(scores) {
  const template = getNarrativeTemplate(scores)
  const options = interpretations.poster[template] || interpretations.poster['mixed']
  return options[Math.floor(Math.random() * options.length)]
}
