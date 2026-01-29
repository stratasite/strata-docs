/**
 * Single source of truth for all site URLs (dev and prod).
 *
 * - npm run start → development (site: http://localhost:3000)
 * - npm run build → production (site: https://developers.strata.site)
 *
 * Override: DOCS_ENV=production npm run start (use prod URLs locally)
 *          DOCS_ENV=development npm run build (use dev URLs in build)
 *
 * Edit the values below to change URLs; GitHub and example server URLs are also here.
 */
const isProd = process.env.NODE_ENV === 'production';
const envOverride = process.env.DOCS_ENV; // optional: 'development' | 'production'

const isProduction = envOverride === 'production' || (envOverride !== 'development' && isProd);

export const siteUrls = {
  /** Production: developer docs. Development: local server. */
  site: isProduction
    ? 'https://developers.strata.site'
    : 'http://localhost:3000',

  /** Base path (usually '/' for custom domain or GitHub Pages project path). */
  baseUrl: isProduction ? '/' : '/',

  /** GitHub repository URL (navbar, etc.). */
  github: 'https://github.com/your-username/strata-docs',

  /** Navbar logo path (relative to static/; theme prepends baseUrl). */
  logoPath: 'img/logo.svg',

  /** Example Strata server URLs used in docs (for reference; MDX may still use placeholders). */
  examples: {
    strataServer: 'https://strata.usdata.io',
    strataStaging: 'https://staging.strata.usdata.io',
    strataLocal: 'http://localhost:3000',
  },
} as const;

export type SiteUrls = typeof siteUrls;
