# AI Integration Architecture Decision

## Context

We're building **Strata**, a semantic layer platform for data engineers. We provide a CLI tool that generates YAML configuration files (tables, relationships, datasources) that define semantic models on top of raw database tables.

Our **documentation site** needs to be accessible to AI agents (Claude, ChatGPT, Cursor, GitHub Copilot, etc.) so they can:
1. Help users understand Strata concepts
2. Generate valid YAML configuration files
3. Answer questions about CLI commands and semantic modeling

## Target Audience

### Primary: AI Agents helping data engineers
- **ChatGPT/Claude** - Users paste our docs into conversations to get help
- **Cursor/GitHub Copilot** - IDE assistants autocompleting YAML files
- **Custom AI tools** - Automated semantic model generation
- **LLM-powered data platforms** - Integrations that generate Strata models

### Secondary: Developer tools
- **IDE extensions** - Need JSON Schemas for autocomplete/validation
- **CI/CD validators** - Validate YAML before deployment
- **Custom integrations** - Programmatic access to documentation

## What We Have Right Now (Production)

### 1. Full Documentation Export: `/llms.txt`
```
GET https://strata.do/developer-docs/llms.txt
```

**Returns:** Complete documentation as single markdown file
- Size: ~2 MB (~500K tokens)
- Format: Flat markdown with table of contents at top
- Links: Internal markdown links to sections within the same file
- Content: Everything - Getting Started, CLI, Semantic Model, Advanced, Examples

**Current behavior:** This is a **static markdown dump** of all docs.

### 2. Documentation Index: `/api/docs.json`
```
GET https://strata.do/developer-docs/api/docs.json
```

**Returns:** JSON index of documentation structure
```json
{
  "title": "Strata Developer Documentation",
  "sections": [
    {
      "id": "semantic-model",
      "title": "Semantic Model",
      "url": "/developer-docs/semantic-model",  // ← HTML page URL
      "endpoint": "/api/semantic-model.json",   // ← JSON API (we generate this)
      "items": [
        {
          "id": "tables",
          "title": "Tables",
          "url": "/developer-docs/semantic-model/tables"  // ← HTML page URL
        }
      ]
    }
  ],
  "full_markdown": "/llms.txt"
}
```

**Current behavior:** We generate section JSON files like `/api/semantic-model.json` that include full MDX content.

### 3. Section JSON APIs: `/api/semantic-model.json`
```
GET https://strata.do/developer-docs/api/semantic-model.json
```

**Returns:** One section's complete content in structured JSON
```json
{
  "id": "semantic-model",
  "title": "Semantic Model",
  "pages": [
    {
      "id": "tables",
      "title": "Tables",
      "content_markdown": "# Tables\n\nFull MDX content here...",
      "sections": [
        {"level": 1, "text": "Tables"},
        {"level": 2, "text": "Overview"}
      ]
    }
  ]
}
```

**Current behavior:** We generate these for every section (getting-started, cli, semantic-model, advanced, examples, troubleshooting).

### 4. JSON Schema Endpoints: `/api/schema/table.json`
```
GET https://strata.do/developer-docs/api/schema/table.json
```

**Returns:** JSON Schema for validating YAML files
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["datasource", "name", "physical_name", "cost", "fields"],
  "properties": {...}
}
```

**Current behavior:** We generate schemas for: table, relation, project, datasources, migration, test.

## What We're Proposing

### Proposal A: Simplify to 2 Entry Points (Our Current Thinking)

```
Keep:
✅ /llms.txt                    → Default for AI agents (get everything)
✅ /api/docs.json               → Discovery index (schemas + critical rules)
✅ /api/schema/*.json           → YAML validation schemas

Remove:
❌ /api/semantic-model.json     → Redundant with /llms.txt
❌ /api/getting-started.json    → Redundant
❌ All section JSON endpoints   → Add complexity without clear value
```

**Rationale:**
- Modern LLMs have huge context windows (Claude 200K, GPT-4 128K, Gemini 1M)
- Loading 2 MB once is faster than multiple 200 KB requests
- Simpler for users: "Just use /llms.txt"
- Section JSONs only save bandwidth if context is limited (rare in 2026)

**Recommended usage:**
```
AI Agent Workflow:
1. User: "Help me build a semantic model"
2. AI: GET /llms.txt → loads everything
3. AI: Has complete context for entire conversation
4. If generating YAML: GET /api/docs.json → discover schemas
5. If validating: GET /api/schema/table.json → validate YAML
```

### Proposal B: Keep All Section JSONs (Maximum Flexibility)

```
Keep Everything:
✅ /llms.txt                    → For full context loading
✅ /api/docs.json               → Discovery index
✅ /api/semantic-model.json     → Targeted section loading
✅ /api/getting-started.json    → Targeted section loading
✅ All section JSON endpoints   → Maximum flexibility
✅ /api/schema/*.json           → YAML validation
```

**Rationale:**
- More flexibility for different use cases
- Smaller payloads for targeted queries
- Future-proof for context-limited models
- Matches patterns like Stripe API, Kubernetes API

**Recommended usage:**
```
AI Agent Workflow Option 1 (Extended conversation):
1. GET /llms.txt → complete context

AI Agent Workflow Option 2 (Quick query):
1. GET /api/docs.json → discover sections
2. GET /api/semantic-model.json → fetch only needed section
3. Answer specific question

AI Agent Workflow Option 3 (YAML generation):
1. GET /api/docs.json → discover schemas
2. GET /api/schema/table.json → fetch schema
3. GET /api/semantic-model.json → get examples
4. Generate valid YAML
```

## Key Questions We Need Answered

### 1. **Entry Point Philosophy**
Given that our target users are AI agents helping data engineers:

**Question:** Should we optimize for **simplicity** (one clear path: use `/llms.txt`) or **flexibility** (multiple paths for different use cases)?

**Trade-off:**
- Simplicity = Easier to explain, faster to adopt, less maintenance
- Flexibility = More options, smaller payloads, future-proof

### 2. **Context Window Reality (2026)**
Modern LLMs have large context windows:
- Claude 3.5: 200K tokens (~800 KB)
- GPT-4 Turbo: 128K tokens (~500 KB)  
- Gemini 1.5 Pro: 1M tokens (~4 MB)

Our docs: ~500K tokens (2 MB markdown)

**Question:** Given these context sizes, is there **real value** in providing sectioned JSON endpoints, or is `/llms.txt` sufficient for 95% of use cases?

**Our concern:** Are we over-engineering by providing multiple JSON endpoints when one markdown file works?

### 3. **JSON Schema Discovery**
We need JSON Schemas for YAML validation, but:

**Question:** Should schemas be:
- **A) Listed in `/api/docs.json`** (discoverable via index)
- **B) Separate entry points** (documented but not discoverable)
- **C) Embedded in section JSONs** (each section includes relevant schemas)

**Our current thinking:** Option A (discoverable via index) feels cleanest.

### 4. **Industry Standards vs Innovation**

**Question:** What do AI-first companies do?

Examples we know:
- **Stripe API docs** - Has both full export and sectioned endpoints
- **Kubernetes API** - OpenAPI specs with references
- **Anthropic/OpenAI** - Mostly markdown with some structured JSON

**What we don't know:**
- What's considered **standard practice** for AI-consumable documentation in 2026?
- Are we missing patterns that have become industry standard?
- Should we be more innovative or more conventional?

### 5. **Navigation After Initial Load**

If AI loads `/llms.txt` and sees links like:
```markdown
- [Tables](/semantic-model/tables): Table model reference
```

**Question:** What should that link point to?
- **A) HTML page** (for humans) - Current behavior
- **B) Another JSON endpoint** - Not implemented
- **C) Anchor within same markdown file** - Makes most sense for `/llms.txt`

**Our confusion:** If `/llms.txt` is meant to be complete, why would it have links that navigate away?

### 6. **Token Optimization Priority**

**Question:** Should we optimize for:
- **A) Minimum initial load** (use section JSONs, 200 KB at a time)
- **B) Minimum total requests** (use `/llms.txt`, 2 MB once)
- **C) Both** (provide both, let AI choose)

**Our data:**
- Option A: 5 requests × 200 KB = 1 MB total, 5 API calls
- Option B: 1 request × 2 MB = 2 MB total, 1 API call
- Option C: Doubles our maintenance (generate both formats)

Which is actually more token/cost efficient in practice?

## What We're Asking

**We need expert opinion on:**

1. **For our target audience (AI agents in 2026)**, is providing sectioned JSON endpoints (/api/semantic-model.json) valuable, or is `/llms.txt` sufficient?

2. **For JSON Schema discovery**, is nesting schema references in `/api/docs.json` the right approach, or is there a better pattern?

3. **What's the industry standard** for AI-consumable documentation? Are we following best practices or reinventing the wheel?

4. **Should we prioritize** developer experience (simple, one path) or technical flexibility (multiple endpoints)?

5. **Is there something we're missing** that would make this genuinely better for AI agents?

## Our Hypothesis

**We think:**
- `/llms.txt` is sufficient for 90% of AI agent use cases (reading/understanding docs)
- `/api/docs.json` is needed for discovery (schemas, critical rules, structure)
- Section JSON endpoints add complexity without proportional value
- JSON Schemas are essential for YAML generation/validation

**But we want to validate this thinking.**

As an innovative team building for the future, we want to:
- ✅ Meet industry standards where they make sense
- ✅ Innovate where we can provide better DX
- ✅ Avoid over-engineering
- ✅ Make it dead simple for AI agents to consume our docs

**Is our hypothesis correct, or are we missing something important?**

---

## Additional Context

### Our Current Implementation Effort

Right now we generate:
- ✅ `/llms.txt` (already built, working)
- ✅ `/api/docs.json` (already built, working)
- ✅ `/api/{section}.json` for each section (already built, ~6 endpoints)
- ✅ `/api/schema/*.json` (already built, ~6 schemas)

**Question:** Should we keep all of this, or simplify before launch?

### Performance Considerations

- Our docs site is static (Docusaurus build)
- All JSON files are pre-generated at build time (not dynamic)
- CDN-cached responses
- No server-side processing

**Cost of complexity:** Maintenance and documentation, not runtime performance.

### Documentation Burden

**Current docs needed:**
- Explain what `/llms.txt` is
- Explain what `/api/docs.json` is
- Explain section endpoints
- Explain when to use which
- Provide examples for each path

**Simplified docs:**
- "Use `/llms.txt` for AI agents"
- "Use `/api/docs.json` to discover schemas"
- Done.

**Which documentation burden is worth it?**
