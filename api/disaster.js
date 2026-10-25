import homeHandler from './_disaster/home.js';
import timelineHandler from './_disaster/timeline.js';
import bmkgHandler from './_disaster/bmkg.js';
import usgsHandler from './_disaster/usgs.js';
import tilesHandler from './_disaster/tiles.js';
import syncHandler from './_disaster/sync.js';

export default async function handler(req, res) {
  // Ambil sub-route dari query 'route' atau dari akhiran URL
  const urlParts = req.url.split('?')[0].split('/').filter(Boolean);
  const route = req.query.route || urlParts[urlParts.length - 1];

  switch (route) {
    case 'home':
    case 'all':
      return homeHandler(req, res);
    case 'timeline':
      return timelineHandler(req, res);
    case 'bmkg':
      return bmkgHandler(req, res);
    case 'usgs':
      return usgsHandler(req, res);
    case 'tiles':
    case 'tile.json':
      return tilesHandler(req, res);
    case 'sync':
      return syncHandler(req, res);
    default:
      // Default to home feed if /api/disaster is requested without subroute
      if (route === 'disaster') {
        return homeHandler(req, res);
      }
      return res.status(404).json({ error: `Disaster route not found: ${route}` });
  }
}
