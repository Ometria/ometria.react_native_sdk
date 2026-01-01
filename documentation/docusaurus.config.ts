import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Ometria React Native SDK',
  tagline: 'Mobile SDK for Ometria marketing automation platform',
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
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/', // Docs at root instead of /docs
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Ometria React Native SDK',
      logo: {
        alt: 'Ometria Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          href: 'https://github.com/Ometria/ometria.react_native_sdk',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: `<a href="https://github.com/Ometria/ometria.react_native_sdk" target="_blank">GitHub</a> · <a href="https://ometria.com" target="_blank">Ometria</a> · <a href="https://support.ometria.com/" target="_blank">Support</a> · Copyright © ${new Date().getFullYear()} Ometria`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'kotlin', 'swift', 'ruby'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
