import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Ometria SDKs',
  tagline: 'Mobile SDKs for the Ometria marketing automation platform',
  favicon: 'img/logo.svg',

  future: {
    v4: true,
  },

  // GitHub Pages deployment config (set by deploy.sh based on remote)
  url: process.env.SITE_URL || 'https://ometria.github.io',
  baseUrl: process.env.BASE_URL || '/react-native-ometria/',
  organizationName: 'Ometria',
  projectName: 'ometria.react_native_sdk',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: false,
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'ios',
        path: 'docs-ios',
        routeBasePath: 'ios',
        sidebarPath: './sidebars/ios.ts',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'android',
        path: 'docs-android',
        routeBasePath: 'android',
        sidebarPath: './sidebars/android.ts',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'react-native',
        path: 'docs-react-native',
        routeBasePath: 'react-native',
        sidebarPath: './sidebars/react-native.ts',
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Ometria SDKs',
      logo: {
        alt: 'Ometria Logo',
        src: 'img/logo.svg',
      },
      items: [
        { to: '/ios', label: 'iOS', position: 'left' },
        { to: '/android', label: 'Android', position: 'left' },
        { to: '/react-native', label: 'React Native', position: 'left' },
        {
          type: 'custom-sdkGithubLink',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
      // Placeholder — actual copyright is rendered by src/theme/Footer/Copyright/index.tsx.
      // Docusaurus only mounts the bottom row (and our swizzled Copyright) when this is non-empty.
      copyright: ' ',
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'kotlin', 'swift', 'ruby'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
