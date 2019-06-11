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

      const {ok} = res;

      if (ok) {
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
export const authenticate = async (secret, isRetry = false) => {
  const body = new FormData();
  body.append('grant_type', 'client_credentials');
  body.append('client_id', CLIENT_ID);
  body.append('client_secret', secret);

  const res = await authRequest(body);

  if (!res.ok && !isRetry) {
    await authenticate(secret, true);
  }

  const {access_token} = await res.json();

  if (access_token) {
    Sketch.Settings.setSettingForKey(TOKEN_NAME, access_token);
    return {
      ok: true,
    };
  } else {
    return {
      ok: false,
    };
  }
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
