export default async function handler(req, res) {
  // Activer CORS - IMPORTANT pour les requêtes depuis le navigateur
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { command, id, content, fieldId, value } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command required' });
    }

    const TEMPLATE_ID = '4fLVHu7eHUBPzBuFJ7mXWH';
    const OVERLAY_API_URL = `https://app.overlays.uno/apiv2/controlapps/${TEMPLATE_ID}/api`;

    // Construire le payload selon la commande
    let payload = { command };

    if (id) payload.id = id;
    if (content) payload.content = content;
    if (fieldId) payload.fieldId = fieldId;
    if (value) payload.value = value;

    console.log('Envoi à Overlays.uno:', JSON.stringify(payload));

    // Utiliser https natif de Node.js au lieu de fetch
    const https = require('https');
    const url = new URL(OVERLAY_API_URL);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(payload))
      }
    };

    const overlayResponse = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              data: JSON.parse(data)
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: data
            });
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(JSON.stringify(payload));
      req.end();
    });

    console.log('Réponse Overlays.uno:', overlayResponse);

    if (overlayResponse.status !== 200) {
      return res.status(overlayResponse.status).json({
        error: `Overlays.uno error: ${overlayResponse.status}`,
        details: overlayResponse.data,
      });
    }

    return res.status(200).json({
      success: true,
      command: command,
      response: overlayResponse.data,
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message,
      stack: error.stack
    });
  }
}
