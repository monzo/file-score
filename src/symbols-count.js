import sketch from 'sketch'

const doc = sketch.getSelectedDocument()
const pages = doc.pages

const ignoreTypes = [
  'Page',
  'Artboard',
  'Group'
]

export default function() {
  let layerCount = 0
  let symbolsCount = 0

  pages.forEach(function countLayers(layerType) {
    if (!ignoreTypes.includes(layerType.type)
      && layerType.sketchObject.class() != "MSSliceLayer") {
      layerCount += 1
    }
    // Count symbols and layers with shared styles
    if (layerType.type == 'SymbolInstance'
      || layerType.sharedStyleId) {
      symbolsCount += 1
    }

    if (layerType.layers && layerType.layers.length) {
      // iterate through the children
      layerType.layers.forEach(countLayers)
    }
  })

  const symbolsPercentage = Math.round((symbolsCount / layerCount) * 100)

  sketch.UI.message(`You're using ${symbolsCount} symbols (${symbolsCount}/${layerCount}) – ${symbolsPercentage}%`)
}
