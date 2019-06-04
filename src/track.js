import Sketch from 'sketch';

import {SECRET_NAME, TOKEN_NAME, API_ENDPOINT} from './config';
import {refresh} from './authenticate';

export default async function track(data) {
  const storedSecret = Sketch.Settings.settingForKey(SECRET_NAME);
  const storedToken = Sketch.Settings.settingForKey(TOKEN_NAME);

  const res = await fetch(
    `${API_ENDPOINT}/design-platform-analytics/file-score`,
    {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
    }
  );

  if (!res.ok) {
    const {_value} = res.json();
    if (_value.code === 'unauthorized.bad_access_token.expired') {
      return refresh();
    }
  } else {
    return res;
  }
}
