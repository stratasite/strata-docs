import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type {Plugin} from '@docusaurus/types';
import type {LoadContext} from '@docusaurus/types';

interface DocFile {
  id: string;
  title: string;
  url: string;
  content: string;
  frontmatter: Record<string, unknown>;
  section: string;
  path: string;
}

interface Section {
  id: string;
  title: string;
  url: string;
  items: DocFile[];
}

// =============================================================================
// Content is loaded from separate markdown files for easier editing
// =============================================================================
const CONTENT_DIR = path.join(__dirname, 'content');

function loadContent(filename: string): string {
  const filePath = path.join(CONTENT_DIR, filename);
  return fs.readFileSync(filePath, 'utf-8').trim();
}

function generateContentForAiAgents(
  context: LoadContext,
  options: Record<string, unknown>
): Plugin {
  return {
    name: 'generate-content-for-ai-agents',
    async postBuild(props) {
      const {outDir, siteConfig} = props;
      const {baseUrl} = siteConfig;

      const docsDir = path.join(context.siteDir, 'docs');
      const apiDir = path.join(outDir, 'api');
      const schemaDir = path.join(apiDir, 'schema');

      // Create API directories
      if (!fs.existsSync(apiDir)) {
        fs.mkdirSync(apiDir, {recursive: true});
      }
      if (!fs.existsSync(schemaDir)) {
        fs.mkdirSync(schemaDir, {recursive: true});
      }

      // Read all documentation
      const docs = readDocsRecursive(docsDir, baseUrl);
      const sections = groupDocsBySection(docs, baseUrl);

      // Generate the 3 AI artifacts
      generateLlmsTxt(outDir, docs, sections);
      generateDocsJson(apiDir, baseUrl);
      generateJsonSchemas(schemaDir, baseUrl);

      console.log('✓ Generated /llms.txt (canonical AI knowledge export)');
      console.log('✓ Generated /api/docs.json (machine discovery index)');
      console.log('✓ Generated /api/schema/*.json (validation schemas)');
    },
  };
}

// =============================================================================
// ARTIFACT 1: Canonical AI Knowledge Export - /llms.txt
// =============================================================================
function generateLlmsTxt(outDir: string, docs: DocFile[], sections: Section[]) {
  const lines: string[] = [];

  // Header
  lines.push('# Strata Semantic Modeling Reference');
  lines.push('');
  lines.push('> Complete reference for AI agents building semantic models with Strata CLI');
  lines.push('');
  lines.push('Strata is a semantic layer platform that transforms raw database tables into business-ready analytics models. Data engineers define semantic models using YAML files, which are version-controlled and deployed via CLI.');
  lines.push('');

  // Rules section (CRITICAL - must be near top)
  lines.push(loadContent('rules.md'));
  lines.push('');

  // Table of Contents with anchors
  lines.push('## Table of Contents');
  lines.push('');
  
  const sectionOrder = [
    'getting-started',
    'cli',
    'semantic-model',
    'advanced',
    'examples',
    'troubleshooting',
  ];

  for (const sectionId of sectionOrder) {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const anchor = toAnchor(section.title);
      lines.push(`- [${section.title}](#${anchor})`);
      for (const item of section.items) {
        if (item.id !== 'index') {
          const itemAnchor = toAnchor(item.title);
          lines.push(`  - [${item.title}](#${itemAnchor})`);
        }
      }
    }
  }
  
  lines.push('- [Canonical YAML Examples](#canonical-yaml-examples)');
  lines.push('- [Common Mistakes to Avoid](#common-mistakes-to-avoid)');
  lines.push('');

  // Section content
  for (const sectionId of sectionOrder) {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      lines.push('---');
      lines.push('');
      lines.push(`## ${section.title}`);
      lines.push('');

      // Sort items: index first, then alphabetically
      const sortedItems = [...section.items].sort((a, b) => {
        if (a.id === 'index') return -1;
        if (b.id === 'index') return 1;
        return a.path.localeCompare(b.path);
      });

      for (const item of sortedItems) {
        // Add section header for non-index items
        if (item.id !== 'index') {
          lines.push(`### ${item.title}`);
          lines.push('');
        }

        // Process content: convert links to anchors
        const processedContent = convertLinksToAnchors(item.content, docs);
        
        // Remove MDX-specific syntax that AI doesn't need
        const cleanContent = cleanMdxContent(processedContent);
        
        lines.push(cleanContent);
        lines.push('');
      }
    }
  }

  // Add canonical examples
  lines.push('---');
  lines.push('');
  lines.push(loadContent('examples.md'));
  lines.push('');

  // Add common mistakes
  lines.push('---');
  lines.push('');
  lines.push(loadContent('mistakes.md'));

  // Write the file
  const llmsTxtPath = path.join(outDir, 'llms.txt');
  fs.writeFileSync(llmsTxtPath, lines.join('\n'));
}

// =============================================================================
// ARTIFACT 2: Machine Discovery Index - /api/docs.json
// =============================================================================
function generateDocsJson(apiDir: string, baseUrl: string) {
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  const index = {
    version: '1.0',
    strata_version_compatibility: '>=0.9.0',
    
    // Registry of semantic objects with their schemas
    semantic_objects: {
      table: {
        schema: '/api/schema/table.json',
        file_pattern: 'tbl.*.yml',
        description: 'Semantic table definition with dimensions and measures',
      },
      relation: {
        schema: '/api/schema/relation.json',
        file_pattern: 'rel.*.yml',
        description: 'Table relationships and join definitions',
      },
      project: {
        schema: '/api/schema/project.json',
        file_pattern: 'project.yml',
        description: 'Project configuration and server connection',
      },
      datasources: {
        schema: '/api/schema/datasources.json',
        file_pattern: 'datasources.yml',
        description: 'Database connection configurations',
      },
      migration: {
        schema: '/api/schema/migration.json',
        file_pattern: 'migrations/*.yml',
        description: 'Schema migration for renaming/swapping',
      },
      test: {
        schema: '/api/schema/test.json',
        file_pattern: 'tests/*.yml',
        description: 'Query validation test definitions',
      },
    },

    // CLI command registry for agents to plan actions
    cli_commands: {
      'strata init': 'Initialize new Strata project in current directory',
      'strata datasource add <name>': 'Add and configure a database connection',
      'strata datasource test <name>': 'Test database connection',
      'strata datasource list': 'List configured datasources',
      'strata table create <name>': 'Generate table YAML from database introspection',
      'strata relation create <name>': 'Generate relation YAML template',
      'strata audit': 'Validate semantic model (syntax + semantics)',
      'strata audit syntax': 'Check YAML syntax only',
      'strata audit models': 'Validate model semantics only',
      'strata deploy': 'Deploy semantic model to Strata server',
      'strata deploy --dry-run': 'Preview deployment without applying',
      'strata test': 'Run query validation tests',
      'strata migration create': 'Create a migration file for renaming',
    },

    // Critical constraints that AI must know
    critical_constraints: [
      'Field names must be globally unique across entire semantic layer',
      'No many_to_many relationships - use junction tables instead',
      'Measures must include aggregation function (sum, count, avg, min, max)',
      'Dimensions must NOT include aggregation functions',
      'Every table requires: datasource, name, physical_name, cost, fields',
      'Every field requires: type, name, data_type, expression',
    ],

    // Link to full knowledge
    full_knowledge: '/llms.txt',
  };

  fs.writeFileSync(
    path.join(apiDir, 'docs.json'),
    JSON.stringify(index, null, 2)
  );
}

// =============================================================================
// ARTIFACT 3: Strict Validation Schemas - /api/schema/*.json
// =============================================================================
function generateJsonSchemas(schemaDir: string, baseUrl: string) {
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const schemaBaseUrl = `https://strata.do${cleanBaseUrl}/api/schema`;

  // Table Schema - strict validation
  const tableSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `${schemaBaseUrl}/table.json`,
    version: '1.0',
    type: 'object',
    required: ['datasource', 'name', 'physical_name', 'cost', 'fields'],
    additionalProperties: false,
    properties: {
      datasource: {type: 'string'},
      name: {type: 'string'},
      physical_name: {type: 'string'},
      cost: {type: 'integer', minimum: 1},
      snapshot_date: {type: 'string'},
      tags: {type: 'array', items: {type: 'string'}},
      partitions: {
        type: 'array',
        items: {$ref: '#/definitions/partition'},
      },
      imports: {type: 'array', items: {type: 'string'}},
      fields: {
        type: 'array',
        items: {$ref: '#/definitions/field'},
        minItems: 1,
      },
    },
    definitions: {
      partition: {
        type: 'object',
        required: ['dimension', 'predicate', 'filter_value'],
        additionalProperties: false,
        properties: {
          dimension: {type: 'string'},
          predicate: {enum: ['between', 'in_list']},
          filter_value: {type: 'string'},
          filter_value_end: {type: 'string'},
          description: {type: 'string'},
        },
      },
      field: {
        type: 'object',
        required: ['type', 'name', 'data_type', 'expression'],
        additionalProperties: false,
        properties: {
          type: {enum: ['dimension', 'measure']},
          name: {type: 'string'},
          description: {type: 'string'},
          data_type: {
            enum: ['string', 'integer', 'bigint', 'decimal', 'date', 'date_time', 'boolean', 'binary'],
          },
          hidden: {type: 'boolean', default: false},
          display_type: {
            enum: ['default', 'html', 'url', 'email', 'phone_number', 'image'],
            default: 'default',
          },
          formatter: {type: 'string'},
          disable_value_listing: {type: 'boolean', default: false},
          value_list_size: {type: 'integer', minimum: 1},
          grains: {type: 'array', items: {type: 'string'}},
          expression: {$ref: '#/definitions/expression'},
        },
      },
      expression: {
        type: 'object',
        required: ['sql'],
        additionalProperties: false,
        properties: {
          sql: {type: 'string'},
          primary_key: {type: 'boolean', default: false},
          lookup: {type: 'boolean', default: false},
          array: {type: 'boolean', default: false},
        },
      },
    },
  };

  // Relation Schema - strict validation
  const relationSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `${schemaBaseUrl}/relation.json`,
    version: '1.0',
    type: 'object',
    required: ['datasource'],
    properties: {
      datasource: {type: 'string'},
    },
    additionalProperties: {
      type: 'object',
      required: ['left', 'right', 'sql', 'cardinality'],
      additionalProperties: false,
      properties: {
        left: {type: 'string'},
        right: {type: 'string'},
        sql: {type: 'string'},
        cardinality: {enum: ['one_to_one', 'one_to_many', 'many_to_one']},
        join: {enum: ['inner', 'left', 'right'], default: 'inner'},
        allow_measure_expansion: {type: 'boolean', default: false},
      },
    },
  };

  // Project Schema - strict validation
  const projectSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `${schemaBaseUrl}/project.json`,
    version: '1.0',
    type: 'object',
    required: ['name', 'server'],
    additionalProperties: false,
    properties: {
      name: {type: 'string'},
      description: {type: 'string'},
      uid: {type: 'string'},
      server: {type: 'string', format: 'uri'},
      production_branch: {type: 'string', default: 'main'},
      git: {type: 'string'},
      project_id: {type: 'integer'},
      environments: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            server: {type: 'string', format: 'uri'},
            api_key: {type: 'string'},
          },
        },
      },
    },
  };

  // Datasources Schema - strict validation
  const datasourcesSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `${schemaBaseUrl}/datasources.json`,
    version: '1.0',
    type: 'object',
    additionalProperties: {
      type: 'object',
      required: ['adapter'],
      properties: {
        adapter: {
          enum: ['postgres', 'snowflake', 'mysql', 'sqlserver', 'athena', 'trino', 'duckdb', 'druid'],
        },
        host: {type: 'string'},
        port: {type: 'integer'},
        database: {type: 'string'},
        schema: {type: 'string'},
        warehouse: {type: 'string'},
        account: {type: 'string'},
        catalog: {type: 'string'},
        region: {type: 'string'},
        workgroup: {type: 'string'},
        s3_output_location: {type: 'string'},
        ssl: {type: 'boolean', default: false},
        tier: {enum: ['hot', 'warm', 'cold'], default: 'hot'},
      },
    },
  };

  // Migration Schema - strict validation
  const migrationSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `${schemaBaseUrl}/migration.json`,
    version: '1.0',
    type: 'object',
    required: ['version', 'operations'],
    additionalProperties: false,
    properties: {
      version: {type: 'string'},
      description: {type: 'string'},
      operations: {
        type: 'array',
        items: {
          type: 'object',
          oneOf: [
            {
              required: ['type', 'from', 'to'],
              properties: {
                type: {const: 'rename_field'},
                from: {type: 'string'},
                to: {type: 'string'},
              },
            },
            {
              required: ['type', 'from', 'to'],
              properties: {
                type: {const: 'rename_table'},
                from: {type: 'string'},
                to: {type: 'string'},
              },
            },
            {
              required: ['type', 'field_a', 'field_b'],
              properties: {
                type: {const: 'swap_fields'},
                field_a: {type: 'string'},
                field_b: {type: 'string'},
              },
            },
          ],
        },
        minItems: 1,
      },
    },
  };

  // Test Schema - strict validation
  const testSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `${schemaBaseUrl}/test.json`,
    version: '1.0',
    type: 'object',
    required: ['name', 'query'],
    additionalProperties: false,
    properties: {
      name: {type: 'string'},
      description: {type: 'string'},
      query: {
        type: 'object',
        required: ['dimensions', 'measures'],
        additionalProperties: false,
        properties: {
          dimensions: {type: 'array', items: {type: 'string'}},
          measures: {type: 'array', items: {type: 'string'}},
          filters: {
            type: 'array',
            items: {
              type: 'object',
              required: ['field', 'operator', 'value'],
              properties: {
                field: {type: 'string'},
                operator: {enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in']},
                value: {},
              },
            },
          },
        },
      },
      assert_sql: {type: 'string'},
      assert_row_count: {type: 'integer', minimum: 0},
    },
  };

  // Write all schemas
  fs.writeFileSync(path.join(schemaDir, 'table.json'), JSON.stringify(tableSchema, null, 2));
  fs.writeFileSync(path.join(schemaDir, 'relation.json'), JSON.stringify(relationSchema, null, 2));
  fs.writeFileSync(path.join(schemaDir, 'project.json'), JSON.stringify(projectSchema, null, 2));
  fs.writeFileSync(path.join(schemaDir, 'datasources.json'), JSON.stringify(datasourcesSchema, null, 2));
  fs.writeFileSync(path.join(schemaDir, 'migration.json'), JSON.stringify(migrationSchema, null, 2));
  fs.writeFileSync(path.join(schemaDir, 'test.json'), JSON.stringify(testSchema, null, 2));
}

// =============================================================================
// Helper Functions
// =============================================================================

function toAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function convertLinksToAnchors(content: string, docs: DocFile[]): string {
  // Convert markdown links to anchors
  // [Link Text](/path/to/page) -> [Link Text](#anchor)
  // [Link Text](../relative/path) -> [Link Text](#anchor)
  
  return content.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, linkText, url) => {
      // Skip external URLs and schema URLs
      if (url.startsWith('http://') || url.startsWith('https://') || url.includes('/api/schema/')) {
        return match;
      }
      
      // Skip anchor links (already correct)
      if (url.startsWith('#')) {
        return match;
      }

      // Try to find the doc this links to
      const normalizedUrl = url.replace(/^\.\.\/|^\.\/|^\//, '').replace(/\/$/, '');
      const doc = docs.find(d => {
        const docPath = d.path.replace(/\.(md|mdx)$/, '').replace(/\\/g, '/');
        return docPath === normalizedUrl || docPath.endsWith(normalizedUrl);
      });

      if (doc) {
        const anchor = toAnchor(doc.title);
        return `[${linkText}](#${anchor})`;
      }

      // If we can't find it, convert to anchor based on link text
      const anchor = toAnchor(linkText);
      return `[${linkText}](#${anchor})`;
    }
  );
}

function cleanMdxContent(content: string): string {
  let cleaned = content;

  // Remove import statements
  cleaned = cleaned.replace(/^import\s+.*$/gm, '');

  // Remove MDX component tags like :::tip, :::info, :::warning, :::danger
  // Keep the content inside
  cleaned = cleaned.replace(/^:::(tip|info|warning|danger|note)\s*(.*)?$/gm, '**$1:** $2');
  cleaned = cleaned.replace(/^:::$/gm, '');

  // Remove JSX components (keep content if possible)
  cleaned = cleaned.replace(/<[A-Z][^>]*>([\s\S]*?)<\/[A-Z][^>]*>/g, '$1');
  cleaned = cleaned.replace(/<[A-Z][^/>]*\/>/g, '');

  // Remove empty lines at start
  cleaned = cleaned.replace(/^\n+/, '');

  // Normalize multiple newlines to max 2
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

function readDocsRecursive(
  dir: string,
  baseUrl: string,
  relativePath = ''
): DocFile[] {
  const files: DocFile[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, {withFileTypes: true});

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      // Skip api directory (don't include the LLM integration docs in the output)
      if (entry.name.startsWith('.') || entry.name === 'img' || entry.name === 'node_modules' || entry.name === 'api') {
        continue;
      }
      files.push(...readDocsRecursive(fullPath, baseUrl, relPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) &&
      entry.name !== '_category_.json'
    ) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const {data: frontmatter, content: body} = matter(content);

      const urlPath = relPath.replace(/\.(md|mdx)$/, '').replace(/\\/g, '/');
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const url = `${cleanBaseUrl}/${urlPath}`;

      const title =
        (frontmatter.title as string) ||
        extractTitle(body) ||
        entry.name.replace(/\.(md|mdx)$/, '');

      const id = entry.name
        .replace(/\.(md|mdx)$/, '')
        .replace(/[^a-z0-9-]/gi, '-')
        .toLowerCase();

      files.push({
        id,
        title,
        url,
        content: body.trim(),
        frontmatter,
        section: getSectionFromPath(relPath),
        path: relPath,
      });
    }
  }

  return files;
}

function extractTitle(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function getSectionFromPath(filePath: string): string {
  const parts = filePath.split(path.sep);
  if (parts.length > 1) {
    return parts[0];
  }
  return 'root';
}

function groupDocsBySection(docs: DocFile[], baseUrl: string): Section[] {
  const sectionsMap = new Map<string, Section>();

  for (const doc of docs) {
    const sectionId = doc.section === 'root' ? 'root' : doc.section;

    if (!sectionsMap.has(sectionId)) {
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const sectionUrl =
        doc.section === 'root' ? cleanBaseUrl : `${cleanBaseUrl}/${sectionId}`;

      sectionsMap.set(sectionId, {
        id: sectionId,
        title: formatSectionTitle(sectionId),
        url: sectionUrl,
        items: [],
      });
    }

    sectionsMap.get(sectionId)!.items.push(doc);
  }

  const sections = Array.from(sectionsMap.values());
  const sectionOrder = [
    'getting-started',
    'cli',
    'semantic-model',
    'advanced',
    'examples',
    'troubleshooting',
  ];
  
  sections.sort((a, b) => {
    const aIndex = sectionOrder.indexOf(a.id);
    const bIndex = sectionOrder.indexOf(b.id);
    if (aIndex === -1 && bIndex === -1) return a.id.localeCompare(b.id);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  sections.forEach((section) => {
    section.items.sort((a, b) => a.path.localeCompare(b.path));
  });

  return sections;
}

function formatSectionTitle(sectionId: string): string {
  if (sectionId === 'root') return 'Documentation';
  
  const titleMap: Record<string, string> = {
    'getting-started': 'Getting Started',
    'cli': 'CLI Reference',
    'semantic-model': 'Semantic Model',
    'advanced': 'Advanced Features',
    'examples': 'Examples',
    'troubleshooting': 'Troubleshooting',
  };
  
  return titleMap[sectionId] || sectionId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default generateContentForAiAgents;
