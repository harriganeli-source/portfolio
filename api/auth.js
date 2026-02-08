const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Password required' });

  const hash = crypto.createHash('sha256').update(password).digest('hex');
  if (hash !== process.env.ADMIN_PASSWORD_HASH) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  // Create a simple signed token: timestamp.signature
  const timestamp = Date.now();
  const payload = `${timestamp}`;
  const signature = crypto
    .createHmac('sha256', process.env.AUTH_SECRET)
    .update(payload)
    .digest('hex');
  const token = `${payload}.${signature}`;

  return res.status(200).json({ token });
};

// Helper used by other routes to verify token
module.exports.verifyToken = function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.replace('Bearer ', '');
  const [timestamp, signature] = token.split('.');
  if (!timestamp || !signature) return false;

  // Check if token is less than 24 hours old
  const age = Date.now() - parseInt(timestamp, 10);
  if (age > 24 * 60 * 60 * 1000) return false;

  const expected = crypto
    .createHmac('sha256', process.env.AUTH_SECRET)
    .update(timestamp)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};
