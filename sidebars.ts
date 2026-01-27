import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Sidebar configuration for Strata documentation.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/index',
        'getting-started/installation',
        'getting-started/quickstart',
        'getting-started/concepts',
      ],
    },
    {
      type: 'category',
      label: 'CLI',
      items: [
        'cli/index',
        'cli/datasource',
        'cli/init',
        'cli/create',
        'cli/table',
        'cli/deploy',
        'cli/audit',
        {
          type: 'category',
          label: 'Adapters',
          items: [
            'cli/adapters/index',
            'cli/adapters/postgres',
            'cli/adapters/snowflake',
            'cli/adapters/mysql',
            'cli/adapters/sqlserver',
            'cli/adapters/athena',
            'cli/adapters/trino',
            'cli/adapters/duckdb',
            'cli/adapters/druid',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/index',
        'guides/creating-tables',
        'guides/fields-and-types',
        'guides/expressions',
        'guides/relationships',
        'guides/migrations',
        'guides/testing',
        'guides/deployment',
        'guides/ci-cd',
      ],
    },
    {
      type: 'category',
      label: 'Semantic Model',
      items: [
        'semantic-model/index',
        'semantic-model/datasources',
        'semantic-model/tables',
        {
          type: 'category',
          label: 'Fields',
          items: [
            'semantic-model/fields/index',
            {
              type: 'category',
              label: 'Dimensions',
              items: [
                'semantic-model/fields/dimensions/index',
                'semantic-model/fields/dimensions/date-time',
              ],
            },
            {
              type: 'category',
              label: 'Measures',
              items: [
                'semantic-model/fields/measures/index',
                'semantic-model/fields/measures/compound',
                'semantic-model/fields/measures/snapshot',
              ],
            },
            'semantic-model/fields/data-types',
            'semantic-model/fields/formatters',
          ],
        },
        {
          type: 'category',
          label: 'Expressions',
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
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      items: [
        'advanced/index',
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
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/index',
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
      items: [
        'api/index',
        'api/json-schema',
        'api/openapi',
      ],
    },
  ],
};

export default sidebars;
