// Public gallery entry points only. No generation, account or editor routes.
// A redirect outside the configured scope is reported, never guessed around.
export const sites = {
  higgsfield: {
    seed: 'https://higgsfield.ai/community',
    hosts: ['higgsfield.ai'],
    paths: ['^/community(?:/|$)', '^/originals(?:/|$)', '^/contests(?:/|$)', '^/@[^/]+(?:/|$)'],
  },
  invideo: {
    seed: 'https://invideo.io/ideas/',
    hosts: ['invideo.io', 'www.invideo.io'],
    paths: ['^/ideas(?:/|$)'],
  },
  kling: {
    seed: 'https://kling.ai/explore/kling',
    hosts: ['kling.ai'],
    paths: ['^/explore(?:/|$)'],
  },
  openart: {
    seed: 'https://openart.ai/explore',
    hosts: ['openart.ai'],
    paths: ['^/explore(?:/|$)', '^/community(?:/|$)'],
  },
  heygen: {
    seed: 'https://community.heygen.com/public/collections/made-with-heygen-inspiration',
    hosts: ['community.heygen.com'],
    paths: ['^/public/collections/made-with-heygen-inspiration/?$', '^/public/resources/'],
  },
};

