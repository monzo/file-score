export const env = 'local';

export const config = {
  local: {
    api: 'http://localhost:8000',
    token: '65565F273A9D944BCF9F4CA6B7C6C',
  },
  staging: {
    api: 'https://api.tools.s101.nonprod-ffs.io',
  },
  production: {
    api: 'https://api.monzo.com',
  },
};
