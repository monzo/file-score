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

  pages.forEach(function countLayers(layerType) {
    // Ignore types defined above, slices, and masks.
    if (!ignoreTypes.includes(layerType.type)
      && layerType.sketchObject.class() != "MSSliceLayer"
      && !layerType.sketchObject.hasClippingMask()) {
      layerCount += 1
    }
    // Count symbols and layers with shared styles
    if (layerType.type == 'SymbolInstance'
      || layerType.sharedStyleId) {
      symbolsCount += 1
    }

    // Don't iterate through symbol masters (in case there are unlinked symbols)
    if (layerType.layers && layerType.layers.length
        && layerType.type != 'SymbolMaster') {
      // iterate through the children
      layerType.layers.forEach(countLayers)
    }
  })

  const symbolsPercentage = Math.round((symbolsCount / layerCount) * 100)

  const message = (layerCount == 0) ? `Add some layers first! Get creative`
    : `You're using ${symbolsCount} symbols (${symbolsCount}/${layerCount}) – ${symbolsPercentage}%`
  sketch.UI.message(message)
}
