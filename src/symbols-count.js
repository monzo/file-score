import Sketch from 'sketch';
import path from '@skpm/path';
import FormData from 'sketch-polyfill-fetch/lib/form-data';

import {SECRET_NAME, TOKEN_NAME, API_ENDPOINT, CLIENT_ID} from './config';
import {refresh} from './authenticate';

const doc = Sketch.getSelectedDocument();
const pages = doc.pages;

const ignoreTypes = ['Page', 'Artboard', 'Group', 'SymbolMaster'];

export default async function() {
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
  Sketch.UI.message(message);

  const fileName = path.parse(doc.path).base;

  const trackingRequest = await track({
    file_name: decodeURI(fileName),
    file_id: doc.id,
    score_percentage: symbolsPercentage,
    total_symbols_count: symbolsCount,
  });

  if (trackingRequest.result === 200) {
    Sketch.UI.message(`🖲 ${message}`);
  } else {
    Sketch.UI.message(message);
  }
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

const track = async ({
  file_name,
  file_id,
  score_percentage,
  total_symbols_count,
}) => {
  const storedSecret = Sketch.Settings.settingForKey(SECRET_NAME);
  const storedToken = Sketch.Settings.settingForKey(TOKEN_NAME);

  const res = await fetch(
    `${API_ENDPOINT}/design-platform-analytics/file-score`,
    {
      method: 'POST',
      body: JSON.stringify({
        file_name: file_name,
        file_id: file_id,
        score_percentage: score_percentage,
        total_symbols_count: total_symbols_count,
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
    }
  );

  if (!res.ok) {
    const {_value} = res.json();
    if (_value.code === 'bad_request.access_token.expired') {
      await refresh();
    }
    throw new Error('HTTP error ' + res.status);
  } else {
    return {
      result: 200,
    };
  }
};
