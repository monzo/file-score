import sketch from 'sketch';
import path from '@skpm/path';

import {env, config} from './config';

const doc = sketch.getSelectedDocument();
const pages = doc.pages;

const ignoreTypes = ['Page', 'Artboard', 'Group', 'SymbolMaster'];

export default function() {
  let layerCount = 0;
  let symbolsCount = 0;

  pages.forEach(function countLayers(layer) {
    const layerType = layer.type;

    // We want to ignore layers types defined above, slices, masks etc.
    if (shouldCountLayer(layer)) {
      layerCount += 1;
    }
    // Count symbols and layers with shared styles
    if (shouldCountSymbol(layer)) {
      symbolsCount += 1;
    }

    // Don't iterate through symbol masters (in case there are unlinked symbols)
    if (layer.layers && layer.layers.length && layerType != 'SymbolMaster') {
      // iterate through the children
      layer.layers.forEach(countLayers);
    }
  });

  const symbolsPercentage = Math.round((symbolsCount / layerCount) * 100);

  const message =
    layerCount == 0
      ? `Add some layers first! Get creative`
      : `You're using ${symbolsCount} symbols (${symbolsCount}/${layerCount}) – ${symbolsPercentage}%`;
  sketch.UI.message(message);

  const fileName = path.parse(doc.path).base;

  const dataToTrack = {
    filename: decodeURI(fileName),
    id: doc.id,
    percentage: symbolsPercentage,
    totalSymbolsCount: symbolsCount,
  };

  track(dataToTrack);
}

function shouldCountLayer(layer) {
  const layerType = layer.type;
  var shouldCount = true;
  // Ignored types
  if (ignoreTypes.includes(layerType)) {
    shouldCount = false;
  }

  // Slices
  if (layer.sketchObject.class() == 'MSSliceLayer') {
    shouldCount = false;
  }

  // Masks (that aren't symbols)
  if (layer.sketchObject.hasClippingMask() && !layer.sharedStyleId) {
    shouldCount = false;
  }

  // Shape paths that have a parent with a layer style
  if (layerType == 'ShapePath' && layer.parent.sharedStyleId) {
    shouldCount = false;
  }
  return shouldCount;
}

function shouldCountSymbol(layer) {
  if (layer.type == 'SymbolInstance' || layer.sharedStyleId) {
    return true;
  }
  return false;
}

function track({filename, id, percentage}) {
  fetch(`${config[env].api}/design-platform-analytics/file-score`, {
    method: 'POST',
    body: JSON.stringify({
      token: config[env].token,
      file_name: filename,
      file_id: id,
      score_percentage: percentage,
    }),
  })
    .then(response => response.text())
    .then(text => console.log(text))
    .catch(e => console.error(e));
}
