const { verifyToken } = require('./auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!verifyToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { filename, data, convertToWebp } = req.body;
    // data = base64-encoded image
    // filename = desired filename (e.g. 'my-project.webp')

    if (!filename || !data) {
      return res.status(400).json({ error: 'filename and data required' });
    }

    let outputBuffer;
    let outputFilename = filename;

    if (convertToWebp !== false) {
      // Convert to WebP using sharp
      const sharp = require('sharp');
      const inputBuffer = Buffer.from(data, 'base64');
      outputBuffer = await sharp(inputBuffer)
        .webp({ quality: 85 })
        .toBuffer();
      // Ensure .webp extension
      outputFilename = filename.replace(/\.\w+$/, '.webp');
    } else {
      outputBuffer = Buffer.from(data, 'base64');
    }

    const base64Content = outputBuffer.toString('base64');
    const filePath = `images/${outputFilename}`;

    // Return the file data for the client to include in the publish batch
    return res.status(200).json({
      stagedFile: {
        path: filePath,
        content: base64Content,
        encoding: 'base64',
      },
      filename: outputFilename,
      size: outputBuffer.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// Increase body size limit for image uploads
module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
