export default function handler(req, res) {
  try {
    const gifts = require('../../data/gifts.json');
    res.status(200).json(gifts);
  } catch (err) {
    console.error('gifts API error', err);
    res.status(500).json({ error: 'Failed to load gifts' });
  }
}
