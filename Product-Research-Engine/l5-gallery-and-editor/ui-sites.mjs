// Separate UI-research targets; never mixed into the Structure Library gallery run.
export const uiSites = {
  'invideo-editor': {
    seed: 'https://ai.invideo.io/',
    hosts: ['ai.invideo.io'],
    paths: ['^/(?!login(?:/|$)|sign-in(?:/|$)|signin(?:/|$)|signup(?:/|$)|auth(?:/|$)).*'],
    manualLoginRequested: true,
  },
  veed: {
    seed: 'https://www.veed.io/',
    hosts: ['www.veed.io', 'veed.io'],
    paths: ['^/(?!login(?:/|$)|sign-in(?:/|$)|signin(?:/|$)|signup(?:/|$)|auth(?:/|$)).*'],
    manualLoginRequested: true,
  },
};
