import sketch from 'sketch'
// documentation: https://developer.sketchapp.com/reference/api/

const doc = sketch.getSelectedDocument()
const pages = doc.pages

const ignoreTypes = [
  'Page',
  'Artboard',
  'Group'
]

export default function() {
  let layerCount = 0

  function countLayers(layerType) {
    if (!ignoreTypes.includes(layerType.type)) {
      layerCount += 1
    }

    if (layerType.layers && layerType.layers.length) {
      // iterate through the children
      layerType.layers.forEach(countLayers)
    }
  }

  pages.forEach(countLayers)

  const symbolsCount = doc.getSymbols().length
  const symbolsPercentage = Math.round((symbolsCount / layerCount) * 100)

  sketch.UI.message(`You're using ${symbolsCount} symbols (${symbolsCount}/${layerCount}) – ${symbolsPercentage}% ✨`)
}
