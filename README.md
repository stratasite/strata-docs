# Strata Documentation

Documentation site for Strata Semantic Analytics, built with [Docusaurus](https://docusaurus.io/).

## Installation

```bash
npm install
```

## Local Development

```bash
npm run start
```

This starts a local development server at **http://localhost:3000/developer-docs/**. The local URL structure matches production so you can test exact URLs before deploying.

Most changes are reflected live without restarting the server.

## Build

```bash
npm run build
```

This command generates static content into the `build` directory.

## Deployment

The site is deployed to GitHub Pages at `/developer-docs/` path.

Using SSH:

```bash
USE_SSH=true npm run deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> npm run deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
