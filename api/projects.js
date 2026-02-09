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

function parseProjects(html) {
  const projects = [];
  // Match each project card block
  const cardRegex = /<a href="projects\/([^"]+)" class="project-card[^"]*">\s*<div class="project-thumb"[^>]*>\s*<img src="([^"]+)"[^>]*>\s*(?:<div class="laurels-overlay">[\s\S]*?<\/div>\s*)?<\/div>\s*<div class="project-info">\s*<span class="project-title">([\s\S]*?)<\/span>\s*<span class="project-role">([\s\S]*?)<\/span>\s*<\/div>\s*<\/a>/g;
  let m;
  while ((m = cardRegex.exec(html)) !== null) {
    const slug = m[1].replace('.html', '');
    const thumbnail = m[2];
    const titleHtml = m[3];
    const role = m[4].replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();

    // Parse title and studio from titleHtml
    let title, studio = '', hasLaurels = false;
    const studioMatch = titleHtml.match(/^(.*?)(?:\s*·\s*(?:for\s*)?<span class="studio">(.*?)<\/span>)?$/);
    if (studioMatch) {
      title = studioMatch[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
      studio = (studioMatch[2] || '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();
    } else {
      title = titleHtml.replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
    }

    // Check for laurels overlay in the full match
    hasLaurels = m[0].includes('laurels-overlay');

    // Check for scrub frame count (legacy)
    const framesMatch = m[0].match(/data-frames="(\d+)"/);
    const frameCount = framesMatch ? parseInt(framesMatch[1], 10) : 0;

    // Check for preview video
    const previewMatch = m[0].match(/data-preview="([^"]+)"/);
    const previewVideo = previewMatch ? previewMatch[1] : '';

    projects.push({ slug, title, studio, role, thumbnail, hasLaurels, frameCount, previewVideo });
  }
  return projects;
}

function parseProjectPage(html) {
  const data = {};
  // Extract video URLs
  const videoMatches = [...html.matchAll(/data-src="([^"]+)"/g)];
  data.videoUrls = videoMatches.map(m => m[1]);

  // Extract video poster images
  const posterMatches = [...html.matchAll(/class="video-poster"[^>]*src="([^"]+)"|src="([^"]+)"[^>]*class="video-poster"/g)];
  data.posters = posterMatches.map(m => m[1] || m[2]);

  // Extract credit
  const creditMatch = html.match(/<div class="project-credit">\s*<p>([\s\S]*?)<\/p>/);
  if (creditMatch) data.credit = creditMatch[1].trim();

  // Detect page type
  if (html.includes('doc-layout')) data.pageType = 'documentary';
  else if (html.includes('videos-grid')) data.pageType = 'grid';
  else if (html.includes('videos-stacked')) data.pageType = 'stacked';
  else data.pageType = 'single';

  // Extract per-video captions (grid layout)
  if (data.pageType === 'grid') {
    const captionMatches = [...html.matchAll(/<p class="video-caption">([\s\S]*?)<\/p>/g)];
    data.videoCaptions = captionMatches.map(m => m[1].trim());
  }

  // Doc-specific: description and poster image
  if (data.pageType === 'documentary') {
    const descMatch = html.match(/<p class="doc-description">([\s\S]*?)<\/p>/);
    if (descMatch) data.description = descMatch[1].trim();
    const posterImgMatch = html.match(/<div class="doc-poster">\s*<img src="([^"]+)"/);
    if (posterImgMatch) data.docPoster = posterImgMatch[1];
  }

  return data;
}

function generateCardHtml(project) {
  const titleEsc = project.title.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
  const roleEsc = project.role.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
  const studioEsc = project.studio ? project.studio.replace(/&/g, '&amp;').replace(/'/g, '&#39;') : '';

  let titleSpan;
  if (studioEsc) {
    titleSpan = `<span class="project-title">${titleEsc} · for <span class="studio">${studioEsc}</span></span>`;
  } else {
    titleSpan = `<span class="project-title">${titleEsc}</span>`;
  }

  let laurelsHtml = '';
  if (project.hasLaurels) {
    laurelsHtml = `\n            <div class="laurels-overlay">\n              <img src="images/laurels-overlay.webp" alt="Festival Laurels">\n            </div>`;
  }

  const framesAttr = project.frameCount > 0 ? ` data-frames="${project.frameCount}"` : '';
  const previewAttr = project.previewVideo ? ` data-preview="${project.previewVideo}"` : '';

  return `        <a href="projects/${project.slug}.html" class="project-card grid-item fade-in">
          <div class="project-thumb"${previewAttr}${framesAttr}>
            <img src="${project.thumbnail}" alt="${titleEsc}" loading="lazy">${laurelsHtml}
          </div>
          <div class="project-info">
            ${titleSpan}
            <span class="project-role">${roleEsc}</span>
          </div>
        </a>`;
}

function generateProjectPage(project, pageData) {
  const titleEsc = project.title.replace(/&/g, '&amp;').replace(/'/g, '&#39;');

  let videoHtml = '';
  if (pageData.pageType === 'stacked' && pageData.videoUrls.length > 1) {
    const videos = pageData.videoUrls.map((url, i) => {
      const poster = pageData.posters && pageData.posters[i] ? pageData.posters[i] : '';
      return `        <div class="video-container" data-src="${url}">
          <img src="${poster}" alt="${titleEsc}" class="video-poster">
          <button class="play-btn" aria-label="Play video"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="5,3 19,12 5,21"/></svg></button>
        </div>`;
    }).join('\n');
    videoHtml = `        <div class="videos-stacked">\n${videos}\n        </div>`;
  } else {
    const url = pageData.videoUrls[0] || '';
    const poster = pageData.posters && pageData.posters[0] ? pageData.posters[0] : '';
    videoHtml = `        <div class="video-container" data-src="${url}">
          <img src="${poster}" alt="${titleEsc}" class="video-poster">
          <button class="play-btn" aria-label="Play video"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="5,3 19,12 5,21"/></svg></button>
        </div>`;
  }

  const credit = pageData.credit || project.role.replace(/&/g, '&amp;') + '.';

  let mainContent;
  if (pageData.pageType === 'grid') {
    // 2-column grid with per-video captions
    const roleEsc = (project.role || '').replace(/&/g, '&amp;');
    const cards = pageData.videoUrls.map((url, i) => {
      const poster = pageData.posters && pageData.posters[i] ? pageData.posters[i] : '';
      const caption = pageData.videoCaptions && pageData.videoCaptions[i] ? pageData.videoCaptions[i] : '';
      return `        <div class="video-card">
          <div class="video-container" data-src="${url}">
            <img src="${poster}" alt="${titleEsc}" class="video-poster">
            <button class="play-btn" aria-label="Play video"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="5,3 19,12 5,21"/></svg></button>
          </div>
          <p class="video-caption">${caption}</p>
        </div>`;
    }).join('\n');
    mainContent = `      <p class="project-role-label">${roleEsc}.</p>
      <div class="videos-grid">
${cards}
      </div>`;
  } else if (pageData.pageType === 'documentary') {
    const desc = pageData.description || '';
    const docPoster = pageData.docPoster || '';
    mainContent = `      <div class="doc-layout">
        <div class="doc-main">
${videoHtml}
          <div class="laurels-marquee">
            <div class="laurels-track">
              <img src="../images/laurels-strip.webp" alt="Festival Laurels">
              <img src="../images/laurels-strip.webp" alt="Festival Laurels">
            </div>
          </div>
          <p class="doc-description">${desc}</p>
        </div>
        <div class="doc-sidebar">
          <div class="doc-poster">
            <img src="${docPoster}" alt="${titleEsc} - Poster">
          </div>
        </div>
      </div>`;
  } else {
    mainContent = `      <div class="project-layout">
${videoHtml}
        <div class="project-credit">
          <p>${credit}</p>
        </div>
      </div>`;
  }

  const studioSuffix = project.studio ? ` — ${project.studio}` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title}${studioSuffix} — Eli Harrigan</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/style.css">
  <link rel="icon" type="image/png" href="../images/favicon.png">
  <link rel="apple-touch-icon" href="../images/apple-touch-icon.png">
</head>
<body>
  <nav>
    <a href="../index.html" class="nav-logo">Eli Harrigan</a>
    <ul class="nav-links nav-menu">
      <li><a href="../index.html" class="active">work</a></li>
      <li><a href="../photography.html">photography</a></li>
      <li><a href="../about.html">about</a></li>
    </ul>
    <div class="hamburger" aria-label="Toggle menu"><span></span><span></span><span></span></div>
  </nav>
  <main>
    <div class="container-narrow">
      <a href="../index.html" class="back-link">Back to Work</a>
${mainContent}
    </div>
  </main>
  <footer><p>&copy; 2026 Eli Harrigan</p></footer>
  <script src="../js/main.js"></script>
</body>
</html>
`;
}

function rebuildIndexHtml(originalHtml, projects) {
  const cardsHtml = projects.map(p => generateCardHtml(p)).join('\n\n');

  // Replace everything between grid-projects div and its closing
  const gridStart = originalHtml.indexOf('<div class="grid-projects">');
  const gridContentStart = originalHtml.indexOf('>', gridStart) + 1;
  // Find the closing </div> for grid-projects
  // Count nested divs to find the right closing tag
  let depth = 1;
  let i = gridContentStart;
  while (depth > 0 && i < originalHtml.length) {
    const nextOpen = originalHtml.indexOf('<div', i);
    const nextClose = originalHtml.indexOf('</div>', i);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 4;
    } else {
      depth--;
      if (depth === 0) {
        return originalHtml.substring(0, gridContentStart) + '\n\n' + cardsHtml + '\n\n\n      ' + originalHtml.substring(nextClose);
      }
      i = nextClose + 6;
    }
  }
  return originalHtml;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!verifyToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const indexHtml = await githubGet('index.html');
      const projects = parseProjects(indexHtml);

      // For each project, try to fetch its page for additional details
      const enriched = await Promise.all(projects.map(async (p) => {
        try {
          const pageHtml = await githubGet(`projects/${p.slug}.html`);
          const pageData = parseProjectPage(pageHtml);
          return { ...p, ...pageData };
        } catch {
          return { ...p, videoUrls: [], pageType: 'single', credit: '' };
        }
      }));

      return res.status(200).json(enriched);
    }

    if (req.method === 'PUT') {
      // Update project order and/or card-level data
      const { projects } = req.body;
      if (!Array.isArray(projects)) return res.status(400).json({ error: 'projects array required' });

      // Store in a temp staging area (we'll use this in publish)
      // For now, we regenerate index.html and return it
      const indexHtml = await githubGet('index.html');
      const newIndexHtml = rebuildIndexHtml(indexHtml, projects);

      // Store staged changes in response (client tracks them)
      return res.status(200).json({
        stagedFiles: [{ path: 'index.html', content: newIndexHtml }],
        projects,
      });
    }

    if (req.method === 'POST') {
      // Add new project
      const project = req.body;
      if (!project.slug || !project.title) {
        return res.status(400).json({ error: 'slug and title required' });
      }

      // Generate project page
      const pageData = {
        videoUrls: project.videoUrls || [''],
        posters: project.posters || [''],
        credit: project.credit || project.role + '.',
        pageType: project.pageType || 'single',
        description: project.description || '',
        docPoster: project.docPoster || '',
      };
      const pageHtml = generateProjectPage(project, pageData);

      // Get current index and add card
      const indexHtml = await githubGet('index.html');
      const existingProjects = parseProjects(indexHtml);
      existingProjects.push({
        slug: project.slug,
        title: project.title,
        studio: project.studio || '',
        role: project.role || '',
        thumbnail: project.thumbnail || `images/${project.slug}.webp`,
        hasLaurels: project.hasLaurels || false,
      });
      const newIndexHtml = rebuildIndexHtml(indexHtml, existingProjects);

      return res.status(200).json({
        stagedFiles: [
          { path: 'index.html', content: newIndexHtml },
          { path: `projects/${project.slug}.html`, content: pageHtml },
        ],
        projects: existingProjects,
      });
    }

    if (req.method === 'PATCH') {
      // Regenerate a single project page (no index.html changes)
      const project = req.body;
      if (!project.slug || !project.title) {
        return res.status(400).json({ error: 'slug and title required' });
      }
      const pageData = {
        videoUrls: project.videoUrls || [''],
        posters: project.posters || [],
        credit: project.credit || (project.role || '') + '.',
        pageType: project.pageType || 'single',
        description: project.description || '',
        docPoster: project.docPoster || '',
        videoCaptions: project.videoCaptions || [],
      };
      const pageHtml = generateProjectPage(project, pageData);
      return res.status(200).json({
        stagedFiles: [
          { path: `projects/${project.slug}.html`, content: pageHtml },
        ],
      });
    }

    if (req.method === 'DELETE') {
      const { slug } = req.body || req.query;
      if (!slug) return res.status(400).json({ error: 'slug required' });

      const indexHtml = await githubGet('index.html');
      const projects = parseProjects(indexHtml).filter(p => p.slug !== slug);
      const newIndexHtml = rebuildIndexHtml(indexHtml, projects);

      return res.status(200).json({
        stagedFiles: [{ path: 'index.html', content: newIndexHtml }],
        deletedFiles: [`projects/${slug}.html`],
        projects,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
