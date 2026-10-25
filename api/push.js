import subscribeHandler from './_push/subscribe.js';
import unsubscribeHandler from './_push/unsubscribe.js';
import vapidKeyHandler from './_push/vapid-key.js';

export default async function handler(req, res) {
  const urlParts = req.url.split('?')[0].split('/').filter(Boolean);
  const action = req.query.action || urlParts[urlParts.length - 1];

  if (action === 'subscribe') {
    return subscribeHandler(req, res);
  }
  if (action === 'unsubscribe') {
    return unsubscribeHandler(req, res);
  }
  if (action === 'vapid-key' || action === 'vapid_key') {
    return vapidKeyHandler(req, res);
  }

  return res.status(404).json({ error: `Push action not found: ${action}` });
}
