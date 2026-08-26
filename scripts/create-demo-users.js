const http = require('http');

const users = [
  { email: 'admin@example.com', password: 'password123', fullName: 'Admin User' },
  { email: 'teacher@example.com', password: 'password123', fullName: 'Teacher User' },
  { email: 'player@example.com', password: 'password123', fullName: 'Player User' }
];

async function createUser(user) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(user);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/signup',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✓ Created user: ${user.email}`);
          resolve();
        } else {
          console.log(`✗ Failed to create ${user.email}: ${responseData}`);
          resolve(); // Continue even if one fails
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Error creating ${user.email}:`, error.message);
      resolve(); // Continue even if one fails
    });

    req.write(data);
    req.end();
  });
}

async function createAllUsers() {
  console.log('Creating demo users...\n');
  
  for (const user of users) {
    await createUser(user);
  }

  console.log('\nDemo users created successfully!');
  console.log('You can now login at http://localhost:3000');
}

createAllUsers();
