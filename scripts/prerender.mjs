import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const BASE_URL = 'https://floinvite.com';

const ROUTES = [
  {
    path: '/',
    title: 'Floinvite - Fast SME Site Access | Zero Hardware',
    description: 'The fastest site access management system for SMEs. Check-in in 30 seconds with zero hardware or kiosks. Notify hosts instantly.',
    fallbackHtml: '<main><h1>SME Site Access Fast and Hardware-Free</h1><p>Check in people in 30 seconds. No kiosks. No iPads. No hardware.</p></main>',
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/` }
    ]
  },
  {
    path: '/features',
    title: 'Floinvite Features | Visitor Management Platform for Fast Check-Ins',
    description: 'Explore Floinvite features for visitor management, guest check-in, notifications, and export-ready records for growing teams.',
    fallbackHtml: '<main><h1>Floinvite Features</h1><p>Visitor check-ins, host notifications, and export-ready records for offices, sites, and shared spaces.</p></main>',
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/` },
      { name: 'Features', item: `${BASE_URL}/features` }
    ]
  },
  {
    path: '/pricing',
    title: 'Floinvite Pricing | Simple, Transparent Plans for Every Business',
    description: 'Choose the right Floinvite plan for your business. From Starter to Compliance+ with audit-ready workflows.',
    fallbackHtml: '<main><h1>Floinvite Pricing</h1><p>Simple and transparent plans for teams that need fast site access management.</p></main>',
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/` },
      { name: 'Pricing', item: `${BASE_URL}/pricing` }
    ]
  },
  {
    path: '/construction',
    title: 'Construction Site Visitor Log Software | Floinvite',
    description: 'Replace paper sign-in sheets with a construction site visitor log and site access management workflow built for fast-moving contractors.',
    fallbackHtml: '<main><h1>Construction Site Visitor Log</h1><p>Track contractors and visitors in real time with export-ready records.</p></main>',
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/` },
      { name: 'Construction', item: `${BASE_URL}/construction` }
    ]
  },
  {
    path: '/offices',
    title: 'Office Visitor Management System | Guest Check In | Floinvite',
    description: 'Modern office visitor management with fast guest check in, host alerts, and a searchable visitor log.',
    fallbackHtml: '<main><h1>Office Visitor Management</h1><p>Speed up reception check-ins with instant host notifications and searchable records.</p></main>',
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/` },
      { name: 'Offices', item: `${BASE_URL}/offices` }
    ]
  },
  {
    path: '/healthcare',
    title: 'Clinic Patient Check In and HIPAA Visitor Log | Floinvite',
    description: 'Support clinic patient check in with secure workflows and a HIPAA visitor log process designed for healthcare environments.',
    fallbackHtml: '<main><h1>Healthcare Check-In Workflow</h1><p>Run clinic check-ins with structured, searchable visitor records.</p></main>',
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/` },
      { name: 'Healthcare', item: `${BASE_URL}/healthcare` }
    ]
  },
  {
    path: '/coworking',
    title: 'Coworking Space Management and Member Check In | Floinvite',
    description: 'Run coworking space management with fast member check in, visitor tracking, and clean logs for shared workplaces.',
    fallbackHtml: '<main><h1>Coworking Member Check In</h1><p>Manage member and visitor arrivals with one lightweight workflow.</p></main>',
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/` },
      { name: 'Coworking', item: `${BASE_URL}/coworking` }
    ]
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | Floinvite',
    description: 'Read the Floinvite Privacy Policy, including how visitor and host data is collected, used, protected, and retained.',
    fallbackHtml: '<main><h1>Privacy Policy</h1><p>Learn how Floinvite collects, uses, protects, and retains data.</p></main>',
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/` },
      { name: 'Privacy Policy', item: `${BASE_URL}/privacy` }
    ]
  },
  {
    path: '/terms',
    title: 'Terms of Service | Floinvite',
    description: 'Read the Floinvite Terms of Service covering acceptable use, data responsibilities, liability limits, and legal terms.',
    fallbackHtml: '<main><h1>Terms of Service</h1><p>Review the legal terms and conditions for using Floinvite.</p></main>',
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/` },
      { name: 'Terms of Service', item: `${BASE_URL}/terms` }
    ]
  }
];

function upsertTag(html, pattern, replacement, fallbackInsert = '') {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }
  return html.replace('</head>', `${fallbackInsert}\n</head>`);
}

function setMetaByName(html, name, content) {
  const pattern = new RegExp(`<meta\\s+name="${name}"[^>]*>`, 'i');
  return upsertTag(
    html,
    pattern,
    `<meta name="${name}" content="${content}" />`,
    `  <meta name="${name}" content="${content}" />`
  );
}

function setMetaByProperty(html, property, content) {
  const pattern = new RegExp(`<meta\\s+property="${property}"[^>]*>`, 'i');
  return upsertTag(
    html,
    pattern,
    `<meta property="${property}" content="${content}" />`,
    `  <meta property="${property}" content="${content}" />`
  );
}

function setCanonical(html, href) {
  const pattern = /<link\s+rel="canonical"[^>]*>/i;
  return upsertTag(
    html,
    pattern,
    `<link rel="canonical" href="${href}" />`,
    `  <link rel="canonical" href="${href}" />`
  );
}

function setTitle(html, title) {
  return html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
}

function setFallbackContent(html, fallbackHtml) {
  return html.replace('<div id="root"></div>', `<div id="root">${fallbackHtml}</div>`);
}

function buildRouteSchemas(route, url) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: route.breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.item
    }))
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: route.title,
    description: route.description,
    url,
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Floinvite',
      url: BASE_URL
    }
  };

  return { breadcrumbSchema, webPageSchema };
}

function setRouteJsonLd(html, route, url) {
  const { breadcrumbSchema, webPageSchema } = buildRouteSchemas(route, url);
  const breadcrumbScript = `<script type="application/ld+json">\n${JSON.stringify(breadcrumbSchema, null, 2)}\n</script>`;
  const webPageScript = `<script type="application/ld+json">\n${JSON.stringify(webPageSchema, null, 2)}\n</script>`;

  const breadcrumbPattern = /<script type="application\/ld\+json">\s*\{[\s\S]*?"@type"\s*:\s*"BreadcrumbList"[\s\S]*?\}\s*<\/script>/i;
  const withBreadcrumb = upsertTag(html, breadcrumbPattern, breadcrumbScript, `  ${breadcrumbScript}`);

  const webPagePattern = /<script type="application\/ld\+json">\s*\{[\s\S]*?"@type"\s*:\s*"WebPage"[\s\S]*?\}\s*<\/script>/i;
  return upsertTag(withBreadcrumb, webPagePattern, webPageScript, `  ${webPageScript}`);
}

function outputPathForRoute(routePath) {
  if (routePath === '/') {
    return path.join(DIST_DIR, 'index.html');
  }
  return path.join(DIST_DIR, routePath.slice(1), 'index.html');
}

async function run() {
  const template = await readFile(path.join(DIST_DIR, 'index.html'), 'utf-8');

  for (const route of ROUTES) {
    const url = `${BASE_URL}${route.path}`;
    let html = template;
    html = setTitle(html, route.title);
    html = setCanonical(html, url);
    html = setMetaByName(html, 'description', route.description);
    html = setMetaByProperty(html, 'og:title', route.title);
    html = setMetaByProperty(html, 'og:description', route.description);
    html = setMetaByProperty(html, 'og:url', url);
    html = setMetaByName(html, 'twitter:title', route.title);
    html = setMetaByName(html, 'twitter:description', route.description);
    html = setMetaByName(html, 'twitter:url', url);
    html = setRouteJsonLd(html, route, url);
    html = setFallbackContent(html, route.fallbackHtml);

    const outputFile = outputPathForRoute(route.path);
    await mkdir(path.dirname(outputFile), { recursive: true });
    await writeFile(outputFile, html, 'utf-8');
    console.log(`Prerendered ${route.path} -> ${path.relative(ROOT_DIR, outputFile)}`);
  }
}

run().catch((error) => {
  console.error(`Prerender failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
