import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import generateContentForAiAgents from './src/plugins/generate-content-for-ai-agents';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

// URL config: baseUrl is /developer-docs/ both locally and in production
// Local: http://localhost:3000/developer-docs/ — Production: https://strata.do/developer-docs/
const isProd = process.env.NODE_ENV === 'production';
const envOverride = process.env.DOCS_ENV;
const baseUrlEnv = process.env.DOCS_BASE_URL;
const isProduction = envOverride === 'production' || (envOverride !== 'development' && isProd);
const baseUrl =
  baseUrlEnv && baseUrlEnv.startsWith('/') && baseUrlEnv.endsWith('/')
    ? baseUrlEnv
    : '/developer-docs/';
const siteUrl = isProduction ? 'https://strata.do' : 'http://localhost:3000';
const githubUrl = 'https://github.com/stratasite/developer-docs';
const logoPath = 'img/logo.svg';

const config: Config = {
  title: 'Strata - Developer Docs',
  tagline: 'Documentation for Data Engineers building semantic models',
  favicon: 'img/favicon.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  url: siteUrl,
  baseUrl,

  // GitHub pages deployment config (when using *.github.io; override if using custom domain)
  // organizationName: 'stratasite',
  // projectName: 'developer-docs',
  
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
          // Serve docs at baseUrl root (no /docs/ prefix in URL)
          routeBasePath: '/',
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
      generateContentForAiAgents,
      {},
    ],
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['en'],
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: '/',
        highlightSearchTermsOnTargetPage: true,
      },
    ],
    // Note: For production with higher traffic, consider Algolia DocSearch:
    // Apply at https://docsearch.algolia.com/ and replace the local search plugin above
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Strata Developer Docs',
      logo: {
        alt: 'Strata Developer Docs',
        src: logoPath,
        href: baseUrl,
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
              to: 'getting-started/installation',
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
  } satisfies Preset.ThemeConfig,
};

export default config;
