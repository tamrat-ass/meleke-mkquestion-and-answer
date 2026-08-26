const bcryptjs = require('bcryptjs');

async function generateHash() {
  const password = 'password123';
  const salt = await bcryptjs.genSalt(10);
  const hash = await bcryptjs.hash(password, salt);
  console.log('Bcrypt hash for "password123":');
  console.log(hash);
}

generateHash();
