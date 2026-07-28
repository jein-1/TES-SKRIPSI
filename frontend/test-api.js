
async function test() {
  try {
    const loginRes = await fetch('https://tsunami-dimss.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin1', password: 'password123' })
    });
    
    if (!loginRes.ok) {
      console.error('Login failed:', await loginRes.text());
      process.exit(1);
    }
    
    const { token } = await loginRes.json();
    console.log('Got token:', token.slice(0, 10) + '...');
    
    const addRes = await fetch('https://tsunami-dimss.vercel.app/api/shelters/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: 'test_api_' + Date.now(),
        name: 'Test API Shelter',
        lat: -0.89,
        lng: 119.87,
        capacity: 100,
        radiusMeters: 50,
        address: 'Test Address'
      })
    });
    
    if (!addRes.ok) {
      console.error('Add failed:', await addRes.text());
      process.exit(1);
    }
    
    console.log('Add succeeded:', await addRes.json());
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
