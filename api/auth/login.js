import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Parse admin accounts from environment variable (JSON string)
  let adminAccounts = [];
  try {
    if (process.env.ADMIN_ACCOUNTS_JSON) {
      adminAccounts = JSON.parse(process.env.ADMIN_ACCOUNTS_JSON);
    } else {
      console.warn('WARNING: ADMIN_ACCOUNTS_JSON is not configured in environment.');
    }
  } catch (err) {
    console.error('Failed to parse ADMIN_ACCOUNTS_JSON:', err);
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const account = adminAccounts.find(a => a.username === username);
  if (!account) {
    // Prevent timing attacks by hashing a dummy string if user not found
    await bcrypt.hash(password, 10);
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const isMatch = await bcrypt.compare(password, account.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Generate JWT token (expires in 2 hours)
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('ERROR: JWT_SECRET is missing from environment variables.');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const token = jwt.sign(
    { sub: account.username, name: account.name, role: account.role },
    secret,
    { expiresIn: '2h' }
  );

  return res.status(200).json({
    success: true,
    token,
    name: account.name,
    role: account.role,
  });
}
