// Fetches recent Instagram posts via the Graph API
// Requires INSTAGRAM_TOKEN env var (long-lived token, 60-day expiry)

let cache = { data: null, ts: 0 };
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

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
    const fields = 'id,caption,media_url,permalink,thumbnail_url,media_type,timestamp';
    const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${token}`;

    const r = await fetch(url);
    const data = await r.json();

    if (data.error) {
      console.error('Instagram API error:', data.error);
      return res.status(502).json({ error: data.error.message || 'Instagram API error' });
    }

    // Filter to images and carousels only (skip videos/reels)
    const posts = (data.data || [])
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

    // Set browser cache headers too
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json(result);
  } catch (err) {
    console.error('Instagram fetch error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch Instagram posts' });
  }
};
