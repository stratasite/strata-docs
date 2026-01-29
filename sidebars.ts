import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Sidebar configuration for Strata documentation.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    // 1. Installation and Setup (highest priority)
    {
      type: 'category',
      label: 'Getting Started',
      link: { type: 'doc', id: 'getting-started/index' },
      items: [
        'getting-started/installation',
        'getting-started/concepts',
        'getting-started/quickstart',
      ],
    },
    // 2. CLI (guide-style pages)
    {
      type: 'category',
      label: 'CLI',
      link: { type: 'doc', id: 'cli/index' },
      items: [
        'cli/projects',
        'cli/datasources',
        'cli/tables',
        'cli/relationships',
        'cli/migrations',
        'cli/tests',
        'cli/audit',
        'cli/deployment',
        'cli/ci-cd',
      ],
    },
    // 3. Semantic Model Reference (includes datasources config & tiers)
    {
      type: 'category',
      label: 'Semantic Model',
      link: { type: 'doc', id: 'semantic-model/index' },
      items: [
        'semantic-model/datasources',
        {
          type: 'category',
          label: 'Adapters',
          link: { type: 'doc', id: 'semantic-model/adapters/index' },
          items: [
            'semantic-model/adapters/postgres',
            'semantic-model/adapters/snowflake',
            'semantic-model/adapters/mysql',
            'semantic-model/adapters/sqlserver',
            'semantic-model/adapters/athena',
            'semantic-model/adapters/trino',
            'semantic-model/adapters/duckdb',
            'semantic-model/adapters/druid',
          ],
        },
        'semantic-model/tables',
        'semantic-model/fields-and-types',
        {
          type: 'category',
          label: 'Fields',
          link: { type: 'doc', id: 'semantic-model/fields/index' },
          items: [
            {
              type: 'category',
              label: 'Dimensions',
              link: { type: 'doc', id: 'semantic-model/fields/dimensions/index' },
              items: ['semantic-model/fields/dimensions/date-time'],
            },
            {
              type: 'category',
              label: 'Measures',
              link: { type: 'doc', id: 'semantic-model/fields/measures/index' },
              items: [
                'semantic-model/fields/measures/compound',
                'semantic-model/fields/measures/snapshot',
              ],
            },
            'semantic-model/fields/data-types',
            'semantic-model/fields/formatters',
          ],
        },
        'semantic-model/expressions',
        {
          type: 'category',
          label: 'Expressions Reference',
          items: [
            'semantic-model/expressions/sql',
            'semantic-model/expressions/lookups',
            'semantic-model/expressions/arrays',
            'semantic-model/expressions/extended-blending',
          ],
        },
        {
          type: 'category',
          label: 'Relationships',
          items: [
            'semantic-model/relationships/cardinality',
            'semantic-model/relationships/join-types',
          ],
        },
        'semantic-model/imports',
        {
          type: 'category',
          label: 'Advanced',
          link: { type: 'doc', id: 'advanced/index' },
          items: [
            'advanced/extended-blending-groups',
            'advanced/exclusions',
            'advanced/inclusions',
            'advanced/partitions',
            'advanced/cost-optimization',
            {
              type: 'category',
              label: 'Decorators',
              items: [
                'advanced/decorators/temporal',
                'advanced/decorators/window',
                'advanced/decorators/contribution',
              ],
            },
            'advanced/multi-datasource',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      link: { type: 'doc', id: 'examples/index' },
      items: [
        'examples/tpcds-tutorial',
        {
          type: 'category',
          label: 'Patterns',
          items: [
            'examples/patterns/star-schema',
            'examples/patterns/snowflake-schema',
            'examples/patterns/fact-dimension',
          ],
        },
        {
          type: 'category',
          label: 'Recipes',
          items: [
            'examples/recipes/customer-360',
            'examples/recipes/sales-analysis',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'API',
      link: { type: 'doc', id: 'api/index' },
      items: [
        'api/json-schema',
        'api/openapi',
      ],
    },
  ],
};

export default sidebars;
