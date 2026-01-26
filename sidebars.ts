import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Sidebar configuration for Strata documentation.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'getting-started/index',
      label: 'Getting Started',
    },
    {
      type: 'doc',
      id: 'getting-started/strata-cli',
      label: 'Strata CLI',
    },
    {
      type: 'doc',
      id: 'getting-started/installation',
      label: 'Installation',
    },
  ],
};

export default sidebars;
