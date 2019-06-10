import Sketch from 'sketch';
import FormData from 'sketch-polyfill-fetch/lib/form-data';

import {SECRET_NAME, TOKEN_NAME, API_ENDPOINT, CLIENT_ID} from './config';

/**
 * Ask the user for the secret and attempt to authenticate
 */
export default () => {
  Sketch.UI.getInputFromUser(
    'Please enter the token beginning "mnz"',
    {
      initialValue: '',
      description: 'This is intended for internal use only',
    },
    async (err, value) => {
      if (err) return;

      const res = await authenticate(value);

      const {access_token} = res;

      if (access_token) {
        Sketch.Settings.setSettingForKey(TOKEN_NAME, access_token);
        Sketch.Settings.setSettingForKey(SECRET_NAME, value);
        Sketch.UI.message('🗝 Token saved');
      } else {
        Sketch.UI.message('🤔 Hmm we had a problem authenticating you');
      }
    }
  );
};

/**
 * Token exchange
 */
export const authenticate = async secret => {
  const body = new FormData();
  body.append('grant_type', 'client_credentials');
  body.append('client_id', CLIENT_ID);
  body.append('client_secret', secret);

  const res = await authRequest(body);

  if (!res.ok) {
    await refresh();
  }

  return await res.json();
};

/**
 * Refresh the token
 */
export const refresh = async () => {
  const secret = Sketch.Settings.settingForKey(SECRET_NAME);
  const refreshToken = Sketch.Settings.settingForKey(TOKEN_NAME);

  const body = new FormData();
  body.append('grant_type', 'refesh_token');
  body.append('client_id', CLIENT_ID);
  body.append('refresh_token', refreshToken);
  body.append('client_secret', secret);

  const res = await authRequest(body);

  if (!res.ok) {
    Sketch.UI.message(
      'We were unable to re-authenticate you - Please add the token from 1Password'
    );
  }

  return await res.json();
};

/**
 * Makes a fetch request to the oauth endpoint
 */
const authRequest = async body => {
  return await fetch(`${API_ENDPOINT}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: 'application/json',
    },
    body: body,
  });
};
