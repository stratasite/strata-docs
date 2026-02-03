# Strata Documentation

Documentation site for Strata Semantic Analytics, built with [Docusaurus](https://docusaurus.io/).

## Installation

```bash
yarn install
```

## Local Development

The site uses the same base path locally as in production so you can test the exact URLs before pushing.

```bash
npm run start
# or: yarn start
```

Then open **http://localhost:3000/docs/developers/** in your browser (same path as production at https://strata.do/docs/developers/). Most changes are reflected live without restarting the server.

## Build

```bash
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Docs are built for the path **`/docs/developers/`** and deployed to the main site so they are served at **https://strata.do/docs/developers/**.

- **CI (recommended):** On push to `main`, the GitHub Action builds the site and pushes the output into the `stratasite.github.io` repo under `docs/developers/`. Configure in the developer-docs repo:
  - **Settings → Secrets and variables → Actions:** add `MAIN_SITE_TOKEN` (a Personal Access Token with write access to the `stratasite/stratasite.github.io` repo).

- **Local / manual:** Build with the same base URL, then copy the `build/` contents into the main site repo at `docs/developers/`:

  ```bash
  DOCS_BASE_URL=/docs/developers/ npm run build
  # Copy build/* into stratasite.github.io repo at docs/developers/
  ```

Legacy deploy via Docusaurus (e.g. to a separate gh-pages branch):

```bash
USE_SSH=true yarn deploy
# or
GIT_USER=<Your GitHub username> yarn deploy
```
