import sketch from 'sketch'

const doc = sketch.getSelectedDocument()
const pages = doc.pages

const ignoreTypes = [
  'Page',
  'Artboard',
  'Group',
  'SymbolMaster'
]

export default function() {
  let layerCount = 0
  let symbolsCount = 0

  pages.forEach(function countLayers(layer) {
    const layerType = layer.type
    console.log(`${layerType}`)
    // We want to ignore layers types defined above, slices, masks etc.
    if (shouldCountLayer(layer)) {
      layerCount += 1
    }
    // Count symbols and layers with shared styles
    if (shouldCountSymbol(layer)) {
      symbolsCount += 1
    }

    // Don't iterate through symbol masters (in case there are unlinked symbols)
    if (layer.layers && layer.layers.length
        && layerType != 'SymbolMaster') {
      // iterate through the children
      layer.layers.forEach(countLayers)
    }
  })

  const symbolsPercentage = Math.round((symbolsCount / layerCount) * 100)

  const message = (layerCount == 0) ? `Add some layers first! Get creative`
    : `You're using ${symbolsCount} symbols (${symbolsCount}/${layerCount}) – ${symbolsPercentage}%`
  sketch.UI.message(message)
}

function shouldCountLayer(layer) {
  const layerType = layer.type
  var shouldCount = true
  // Ignored types
  if (ignoreTypes.includes(layerType)) {
    shouldCount = false
  }
  // Slices
  if (layer.sketchObject.class() == "MSSliceLayer") {
    shouldCount = false
  }
  // Masks
  if (layer.sketchObject.hasClippingMask()) {
    shouldCount = false
  }
  // Shape paths that have a parent with a layer style
  if (layerType == 'ShapePath' && layer.parent.sharedStyleId) {
    shouldCount = false
  }
  return shouldCount
}

function shouldCountSymbol(layer) {
  if (layer.type == 'SymbolInstance' || layer.sharedStyleId) {
    return true
  }
  return false
}
