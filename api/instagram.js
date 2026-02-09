// Fetches recent Instagram posts via the Facebook Graph API
// Requires INSTAGRAM_TOKEN env var (long-lived Facebook user token, 60-day expiry)
//
// Flow: Facebook token → find Pages → get Instagram Business Account → fetch media

const GRAPH = 'https://graph.facebook.com/v19.0';

let cache = { data: null, ts: 0 };
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

async function graphGet(path, token) {
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(`${GRAPH}${path}${sep}access_token=${token}`);
  return r.json();
}

async function findInstagramAccount(token) {
  // 1. Get user's Facebook Pages
  const pages = await graphGet('/me/accounts?fields=id,name,access_token', token);
  if (pages.error) throw new Error('Pages lookup failed: ' + pages.error.message);
  if (!pages.data || !pages.data.length) throw new Error('No Facebook Pages found — link your Instagram to a Facebook Page');

  // 2. Check each page for a connected Instagram Business Account
  for (const page of pages.data) {
    const info = await graphGet(`/${page.id}?fields=instagram_business_account`, page.access_token);
    if (info.instagram_business_account) {
      return {
        igId: info.instagram_business_account.id,
        pageToken: page.access_token,
      };
    }
  }
  throw new Error('No Instagram Business/Creator account found on your Facebook Pages');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.INSTAGRAM_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Instagram token not configured' });
  }

  // Return cached data if fresh
  if (cache.data && Date.now() - cache.ts < CACHE_TTL) {
    return res.status(200).json(cache.data);
  }

  try {
    const limit = parseInt(req.query.limit) || 20;

    // Find the Instagram account via Facebook Pages
    const { igId, pageToken } = await findInstagramAccount(token);

    // Fetch recent media
    const fields = 'id,caption,media_url,permalink,thumbnail_url,media_type,timestamp';
    const media = await graphGet(`/${igId}/media?fields=${fields}&limit=${limit}`, pageToken);

    if (media.error) {
      console.error('Instagram media error:', media.error);
      return res.status(502).json({ error: media.error.message || 'Instagram API error' });
    }

    // Filter to images and carousels only (skip videos/reels)
    const posts = (media.data || [])
      .filter(p => p.media_type === 'IMAGE' || p.media_type === 'CAROUSEL_ALBUM')
      .map(p => ({
        id: p.id,
        src: p.media_url,
        link: p.permalink,
        caption: p.caption || '',
        date: p.timestamp,
      }));

    const result = { posts };
    cache = { data: result, ts: Date.now() };

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json(result);
  } catch (err) {
    console.error('Instagram fetch error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch Instagram posts' });
  }
};
