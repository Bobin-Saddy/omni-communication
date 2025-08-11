// pages/api/webhook.js
let storedMessages = []; // simple in-memory store

export default function handler(req, res) {
  if (req.method === 'GET') {
    const VERIFY_TOKEN = '12345';
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } 
  
  else if (req.method === 'POST') {
    console.log('Incoming webhook:', JSON.stringify(req.body, null, 2));

    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0]?.value?.messages;

    if (changes && changes.length > 0) {
      changes.forEach(msg => {
        storedMessages.push({
          id: msg.id,
          from: msg.from,
          text: msg.text?.body || '',
          timestamp: msg.timestamp
        });
      });
    }
    res.sendStatus(200);
  }
}
export { storedMessages };
