require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createMissingRounds() {
  const client = await pool.connect();
  try {
    console.log('Creating missing rounds...');

    const roundsToCreate = [
      { name: 'Round 1', round_number: 1 },
      { name: 'Round 2', round_number: 2 },
      { name: 'Round 3', round_number: 3 },
    ];

    for (const round of roundsToCreate) {
      // Check if round already exists
      const existingResult = await client.query(
        'SELECT id FROM rounds WHERE name = $1',
        [round.name]
      );

      if (existingResult.rows.length > 0) {
        console.log(`✓ Round "${round.name}" already exists`);
        continue;
      }

      // Create the round
      const result = await client.query(
        'INSERT INTO rounds (name, round_number) VALUES ($1, $2) RETURNING id',
        [round.name, round.round_number]
      );

      console.log(`✓ Created round: ${round.name} (ID: ${result.rows[0].id})`);
    }

    console.log('✓ All rounds created successfully');
  } catch (error) {
    console.error('Error creating rounds:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createMissingRounds();
