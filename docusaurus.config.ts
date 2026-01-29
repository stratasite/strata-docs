import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import generateDocsApiPlugin from './src/plugins/generate-docs-api';
import {siteUrls} from './src/site-urls';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Strata - Developer Docs',
  tagline: 'Documentation for Data Engineers building semantic models',
  favicon: 'img/favicon.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // URLs: see src/site-urls.ts for dev vs prod (DOCS_ENV or NODE_ENV)
  url: siteUrls.site,
  baseUrl: siteUrls.baseUrl,

  // GitHub pages deployment config (when using *.github.io; override if using custom domain)
  // organizationName: 'your-username',
  // projectName: 'strata-docs',
  
  // Deployment configuration
  trailingSlash: false,

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
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
          routeBasePath: 'docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      generateDocsApiPlugin,
      {},
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Strata Developer Docs',
      logo: {
        alt: 'Strata Developer Docs',
        src: siteUrls.logoPath,
        href: siteUrls.baseUrl,
        width: 32,
        height: 32,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Getting Started',
        },
        {
          href: siteUrls.github,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started/installation',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Strata Business Intelligence.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    // Algolia DocSearch (critical for search; required for GitHub Pages).
    // Apply at https://docsearch.algolia.com/ and add credentials when ready.
    // algolia: {
    //   appId: 'YOUR_APP_ID',
    //   apiKey: 'YOUR_SEARCH_API_KEY',
    //   indexName: 'strata_developers',
    //   contextualSearch: true,
    // },
  } satisfies Preset.ThemeConfig,
};

export default config;
