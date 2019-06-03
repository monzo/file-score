import Sketch from 'sketch';

import {SECRET_NAME, TOKEN_NAME, API_ENDPOINT} from './config';
import {refresh} from './authenticate';

export default function track({
  file_name,
  file_id,
  score_percentage,
  total_symbols_count,
}) {
  const storedSecret = Sketch.Settings.settingForKey(SECRET_NAME);
  const storedToken = Sketch.Settings.settingForKey(TOKEN_NAME);

  const res = fetch(`${API_ENDPOINT}/design-platform-analytics/file-score`, {
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
  });

  if (!res.ok) {
    const {_value} = res.json();
    if (_value.code === 'unauthorized.bad_access_token.expired') {
      return refresh();
    }
  } else {
    return {
      result: 200,
    };
  }
}
