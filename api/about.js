const { verifyToken } = require('./auth');

const GITHUB_API = 'https://api.github.com';
const OWNER = process.env.GITHUB_OWNER || 'harriganeli-source';
const REPO = process.env.GITHUB_REPO || 'portfolio';

async function githubGet(path) {
  const r = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!r.ok) throw new Error(`GitHub GET ${path}: ${r.status}`);
  const data = await r.json();
  return Buffer.from(data.content, 'base64').toString('utf-8');
}

function parseAboutPage(html) {
  const data = {};

  // Extract heading
  const headingMatch = html.match(/<h1>([\s\S]*?)<\/h1>/);
  data.heading = headingMatch ? headingMatch[1].trim() : 'Hey there!';

  // Extract bio paragraphs (all <p> inside .about-bio, except .about-contact)
  const bioMatch = html.match(/<div class="about-bio">([\s\S]*?)<\/div>/);
  if (bioMatch) {
    const bioHtml = bioMatch[1];
    const paragraphs = [...bioHtml.matchAll(/<p(?:\s+class="about-contact")?>([\s\S]*?)<\/p>/g)];
    data.bioParas = [];
    data.contactHtml = '';
    for (const p of paragraphs) {
      const fullTag = p[0];
      if (fullTag.includes('about-contact')) {
        data.contactHtml = p[1].trim();
      } else {
        data.bioParas.push(p[1].trim());
      }
    }
  } else {
    data.bioParas = [];
    data.contactHtml = '';
  }

  // Extract headshot src
  const headshotMatch = html.match(/<div class="about-headshot">\s*<img src="([^"]+)"/);
  data.headshotSrc = headshotMatch ? headshotMatch[1] : 'images/headshot.webp';

  // Extract photo grid images
  const photoGridMatch = html.match(/<div class="about-photo-grid">([\s\S]*?)<\/div>\s*<\/main>/);
  if (photoGridMatch) {
    data.photos = [...photoGridMatch[1].matchAll(/<img src="([^"]+)"/g)].map(m => m[1]);
  } else {
    data.photos = [];
  }

  return data;
}

function generateAboutPage(data) {
  const bioParasHtml = data.bioParas.map(p => `            <p>${p}</p>`).join('\n');
  const contactLine = data.contactHtml
    ? `\n            <p class="about-contact">${data.contactHtml}</p>`
    : '';

  const photosHtml = data.photos.map(src =>
    `      <div class="about-photo"><img src="${src}" alt="" loading="lazy"></div>`
  ).join('\n');

  // Rebuild client logos section from the original (we don't edit logos here)
  // We preserve whatever logos exist in the original HTML
  const logosHtml = (data._logosHtml || '').trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Eli Harrigan — About</title>
  <meta name="description" content="About Eli Harrigan — Multimedia producer, director, editor, and photographer.">
  <meta property="og:title" content="Eli Harrigan — About">
  <meta property="og:description" content="Multimedia producer, director, editor, and photographer.">
  <meta property="og:image" content="https://editwitheli.com/images/og-image.jpg">
  <meta property="og:url" content="https://editwitheli.com/about">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://editwitheli.com/images/og-image.jpg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
  <link rel="icon" type="image/png" href="images/favicon.png">
  <link rel="apple-touch-icon" href="images/apple-touch-icon.png">
</head>
<body class="page-about">

  <nav>
    <a href="index.html" class="nav-logo">Eli Harr<span class="logo-i">ı<span class="i-dot"></span></span>gan</a>
    <ul class="nav-links nav-menu">
      <li><a href="index.html">work</a></li>
      <li><a href="photography.html">photography</a></li>
      <li><a href="about.html" class="active">about</a></li>
    </ul>
    <div class="hamburger" aria-label="Toggle menu">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </nav>

  <main>
    <!-- About content -->
    <div class="about-content">
      <div class="about-content-inner">
        <div class="about-hero">
          <div class="about-bio">
            <h1>${data.heading}</h1>
${bioParasHtml}${contactLine}
          </div>
          <div class="about-headshot">
            <img src="${data.headshotSrc}" alt="Eli Harrigan">
          </div>
        </div>
      </div>
    </div>

    <!-- Client logos -->
${logosHtml}

    <!-- Photo grids -->
    <div class="about-photo-grid">
${photosHtml}
    </div>
  </main>

  <footer>
    <p>&copy; 2026 Eli Harrigan</p>
  </footer>

  <script src="js/main.js"></script>
</body>
</html>
`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!verifyToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const aboutHtml = await githubGet('about.html');

    if (req.method === 'GET') {
      const data = parseAboutPage(aboutHtml);
      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      const updates = req.body;
      const existing = parseAboutPage(aboutHtml);

      // Merge updates
      const merged = {
        heading: updates.heading !== undefined ? updates.heading : existing.heading,
        bioParas: updates.bioParas !== undefined ? updates.bioParas : existing.bioParas,
        contactHtml: updates.contactHtml !== undefined ? updates.contactHtml : existing.contactHtml,
        headshotSrc: updates.headshotSrc !== undefined ? updates.headshotSrc : existing.headshotSrc,
        photos: updates.photos !== undefined ? updates.photos : existing.photos,
      };

      // Preserve logos section from original HTML
      const logosMatch = aboutHtml.match(/(\s*<!-- Client logos -->[\s\S]*?<\/div>\s*<\/div>)/);
      merged._logosHtml = logosMatch ? logosMatch[1] : '';

      const newHtml = generateAboutPage(merged);

      return res.status(200).json({
        stagedFiles: [{ path: 'about.html', content: newHtml }],
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
