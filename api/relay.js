import https from 'https';

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

    // Utiliser https natif de Node.js
    const url = new URL(OVERLAY_API_URL);
    const payloadString = JSON.stringify(payload);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadString)
      }
    };

    const overlayResponse = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
