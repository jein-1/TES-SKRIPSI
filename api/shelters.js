import addHandler from './_shelters/add.js';
import updateHandler from './_shelters/update.js';
import deleteHandler from './_shelters/delete.js';

export default async function handler(req, res) {
  const urlParts = req.url.split('?')[0].split('/').filter(Boolean);
  const action = req.query.action || urlParts[urlParts.length - 1];

  if (action === 'add' || (action === 'shelters' && req.method === 'POST')) {
    return addHandler(req, res);
  }
  if (action === 'update' || (action === 'shelters' && (req.method === 'PATCH' || req.method === 'PUT'))) {
    return updateHandler(req, res);
  }
  if (action === 'delete' || (action === 'shelters' && req.method === 'DELETE')) {
    return deleteHandler(req, res);
  }

  return res.status(404).json({ error: `Shelter action not found: ${action}` });
}
