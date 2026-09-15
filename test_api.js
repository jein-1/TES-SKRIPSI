import { readFileSync } from 'fs';

// mock env
const envFile = readFileSync('.env', 'utf-8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
  }
});

// mock JWT
import jwt from 'jsonwebtoken';
process.env.JWT_SECRET = 'dummysecret';
const token = jwt.sign({ user: 'admin' }, 'dummysecret');

const req = {
  method: 'POST',
  headers: {
    authorization: `Bearer ${token}`
  },
  body: {
    id: 'HZ123',
    name: 'Test',
    coords: [[-0.8, 119.8], [-0.8, 119.9]],
    zrbLevel: 4,
    description: 'Test desc'
  }
};

const res = {
  setHeader: () => {},
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('Response:', this.statusCode, data);
  },
  end: function() {
    console.log('Response ended');
  }
};

async function test() {
  const { default: handler } = await import('./api/hazard-zones/add.js');
  await handler(req, res);
}

test().catch(console.error);
