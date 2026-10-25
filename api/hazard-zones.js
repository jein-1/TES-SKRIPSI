import addHandler from './_hazard-zones/add.js';
import updateHandler from './_hazard-zones/update.js';
import deleteHandler from './_hazard-zones/delete.js';

export default async function handler(req, res) {
  const urlParts = req.url.split('?')[0].split('/').filter(Boolean);
  const action = req.query.action || urlParts[urlParts.length - 1];

  if (action === 'add' || (action === 'hazard-zones' && req.method === 'POST')) {
    return addHandler(req, res);
  }
  if (action === 'update' || (action === 'hazard-zones' && (req.method === 'PATCH' || req.method === 'PUT'))) {
    return updateHandler(req, res);
  }
  if (action === 'delete' || (action === 'hazard-zones' && req.method === 'DELETE')) {
    return deleteHandler(req, res);
  }

  return res.status(404).json({ error: `Hazard zone action not found: ${action}` });
}
