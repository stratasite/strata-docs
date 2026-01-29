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

function generateDocsApiPlugin(
  context: LoadContext,
  options: Record<string, unknown>
): Plugin {
  return {
    name: 'generate-docs-api',
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

      // Generate documentation index
      const docs = readDocsRecursive(docsDir, baseUrl);
      const sections = groupDocsBySection(docs, baseUrl);

      const index = {
        sections: sections.map((section) => ({
          id: section.id,
          title: section.title,
          url: section.url,
          items: section.items.map((item) => ({
            id: item.id,
            title: item.title,
            url: item.url,
          })),
        })),
      };

      fs.writeFileSync(
        path.join(apiDir, 'docs.json'),
        JSON.stringify(index, null, 2)
      );

      // Generate section JSON files
      for (const section of sections) {
        const sectionContent = {
          title: section.title,
          content: section.items.map((item) => item.content).join('\n\n'),
          pages: section.items.map((item) => ({
            id: item.id,
            title: item.title,
            url: item.url,
            content: item.content,
          })),
          relatedLinks: extractRelatedLinks(section.items),
        };

        fs.writeFileSync(
          path.join(apiDir, `${section.id}.json`),
          JSON.stringify(sectionContent, null, 2)
        );
      }

      // Generate JSON Schema files
      generateJsonSchemas(schemaDir);

      // Generate CLI commands JSON
      generateCliCommands(apiDir, docs);

      console.log(`✓ Generated API files in ${apiDir}`);
      console.log(`✓ Generated ${sections.length} section JSON files`);
      console.log(`✓ Generated JSON Schema files`);
    },
  };
}

function generateJsonSchemas(schemaDir: string) {
  // Table Schema
  const tableSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    title: 'Strata Table Model',
    required: ['datasource', 'name', 'physical_name', 'cost', 'fields'],
    properties: {
      datasource: {type: 'string', description: 'Datasource key or name'},
      name: {type: 'string', description: 'Logical table name'},
      physical_name: {type: 'string', description: 'Physical table name in database'},
      cost: {type: 'integer', description: 'Cost number (lower = preferred)'},
      snapshot_date: {type: 'string', description: 'Snapshot date dimension name'},
      tags: {type: 'array', items: {type: 'string'}},
      partitions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            dimension: {type: 'string'},
            predicate: {enum: ['between', 'in_list']},
            filter_value: {type: 'string'},
            filter_value_end: {type: 'string'},
            description: {type: 'string'},
          },
        },
      },
      imports: {type: 'array', items: {type: 'string'}},
      fields: {
        type: 'array',
        items: {$ref: '#/definitions/field'},
      },
    },
    definitions: {
      field: {
        type: 'object',
        required: ['type', 'name', 'data_type', 'expression'],
        properties: {
          type: {enum: ['dimension', 'measure']},
          name: {type: 'string'},
          description: {type: 'string'},
          data_type: {
            enum: ['string', 'integer', 'bigint', 'decimal', 'date', 'date_time', 'boolean', 'binary'],
          },
          hidden: {type: 'boolean'},
          display_type: {enum: ['default', 'html', 'url', 'email', 'phone_number', 'image']},
          formatter: {type: 'string'},
          disable_value_listing: {type: 'boolean'},
          value_list_size: {type: 'integer'},
          grains: {type: 'array', items: {type: 'string'}},
          expression: {
            type: 'object',
            required: ['sql'],
            properties: {
              primary_key: {type: 'boolean'},
              lookup: {type: 'boolean'},
              array: {type: 'boolean'},
              sql: {type: 'string'},
            },
          },
        },
      },
    },
  };

  // Relation Schema
  const relationSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    title: 'Strata Relation Model',
    required: ['datasource'],
    properties: {
      datasource: {type: 'string', description: 'Datasource key'},
    },
    patternProperties: {
      '.*': {
        type: 'object',
        required: ['left', 'right', 'sql', 'cardinality'],
        properties: {
          left: {type: 'string', description: 'Left table name'},
          right: {type: 'string', description: 'Right table name'},
          sql: {type: 'string', description: 'Join condition'},
          cardinality: {enum: ['one_to_one', 'one_to_many', 'many_to_one']},
          join: {enum: ['left', 'right', 'inner', 'full']},
          allow_measure_expansion: {type: 'boolean'},
        },
      },
    },
  };

  // Project Schema
  const projectSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    title: 'Strata Project Configuration',
    required: ['name', 'server'],
    properties: {
      name: {type: 'string'},
      description: {type: 'string'},
      uid: {type: 'string'},
      server: {type: 'string'},
      production_branch: {type: 'string'},
      git: {type: 'string'},
      project_id: {type: 'integer'},
      environments: {
        type: 'object',
        patternProperties: {
          '.*': {
            type: 'object',
            properties: {
              server: {type: 'string'},
              api_key: {type: 'string'},
            },
          },
        },
      },
    },
  };

  fs.writeFileSync(
    path.join(schemaDir, 'table.json'),
    JSON.stringify(tableSchema, null, 2)
  );
  fs.writeFileSync(
    path.join(schemaDir, 'relation.json'),
    JSON.stringify(relationSchema, null, 2)
  );
  fs.writeFileSync(
    path.join(schemaDir, 'project.json'),
    JSON.stringify(projectSchema, null, 2)
  );
}

function generateCliCommands(apiDir: string, docs: DocFile[]) {
  const cliDocs = docs.filter((doc) => doc.section === 'reference' && doc.path.includes('cli/'));
  
  const commands = cliDocs.map((doc) => {
    const title = doc.title;
    const command = title.toLowerCase().replace(/\s+/g, '-');
    const content = doc.content;
    
    // Extract command info from content
    const synopsisMatch = content.match(/## Synopsis\s+```bash\s+(.+?)\s+```/s);
    const descriptionMatch = content.match(/## Description\s+(.+?)(?=\n##|\n```|$)/s);
    
    return {
      id: doc.id,
      command,
      title,
      url: doc.url,
      synopsis: synopsisMatch ? synopsisMatch[1] : '',
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
    };
  });

  const cliDir = path.join(apiDir, 'cli');
  if (!fs.existsSync(cliDir)) {
    fs.mkdirSync(cliDir, {recursive: true});
  }
  
  fs.writeFileSync(
    path.join(cliDir, 'commands.json'),
    JSON.stringify({commands}, null, 2)
  );
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
      if (entry.name.startsWith('.') || entry.name === 'img' || entry.name === 'node_modules') {
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
      const url = `${cleanBaseUrl}/docs/${urlPath}`;

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
      const baseUrlPart = doc.url.split('/docs/')[0] || baseUrl;
      const sectionUrl =
        doc.section === 'root'
          ? `${baseUrlPart}/docs`
          : `${baseUrlPart}/docs/${sectionId}`;

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
    'guides',
    'semantic-model',
    'advanced',
    'reference',
    'examples',
    'api',
    'root',
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
  return sectionId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function extractRelatedLinks(items: DocFile[]): Array<{title: string; url: string}> {
  const links = new Set<{title: string; url: string}>();

  for (const item of items) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(item.content)) !== null) {
      const url = match[2];
      if (url.startsWith('../') || url.startsWith('./') || url.startsWith('/docs/')) {
        links.add({
          title: match[1],
          url: normalizeLink(url, item.url),
        });
      }
    }
  }

  return Array.from(links);
}

function normalizeLink(link: string, currentUrl: string): string {
  if (link.startsWith('/')) {
    return link;
  }

  const currentDir = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
  const resolved = path.resolve(currentDir, link).replace(/\\/g, '/');
  return resolved;
}

export default generateDocsApiPlugin;
