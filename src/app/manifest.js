export default function manifest() {
  return {
    name: 'Caudal Finance',
    short_name: 'Caudal',
    description: 'Personal finance & SOFIPO investments tracker',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F0F0F',
    theme_color: '#0F0F0F',
    orientation: 'portrait',
    icons: [
      {
        src: '/caudal-logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/caudal-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
