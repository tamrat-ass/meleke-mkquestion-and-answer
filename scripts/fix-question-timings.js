const { sql } = require('../lib/db');

async function fixQuestionTimings() {
  try {
    console.log('Fixing question timings...');
    
    // Update questions with NULL time_limit to default 30
    const updateTimeLimit = await sql`
      UPDATE questions
      SET time_limit = 30
      WHERE time_limit IS NULL
      RETURNING id
    `;
    
    console.log(`Updated ${updateTimeLimit.rows.length} questions with time_limit = 30`);
    
    // Update questions with NULL minimum_time_frame to default 5
    const updateMinTime = await sql`
      UPDATE questions
      SET minimum_time_frame = 5
      WHERE minimum_time_frame IS NULL
      RETURNING id
    `;
    
    console.log(`Updated ${updateMinTime.rows.length} questions with minimum_time_frame = 5`);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error fixing question timings:', error);
  }
}

fixQuestionTimings();
