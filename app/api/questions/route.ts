import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await sql`
      SELECT 
        q.id,
        q.question_text as title,
        qt.name as question_type,
        q.marks as difficulty,
        q.created_at,
        q.round_id,
        r.name as round_name,
        r.round_number,
        q.correct_answer,
        q.time_limit,
        q.minimum_time_frame,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d
      FROM questions q
      LEFT JOIN question_types qt ON q.question_type_id = qt.id
      LEFT JOIN rounds r ON q.round_id = r.id
      WHERE q.is_deleted = false
      ORDER BY r.round_number ASC, q.created_at DESC
    `;

    // Convert options to array format
    const questionsWithOptions = result.rows.map((row: any) => {
      const options = [];
      if (row.option_a) options.push({ option_key: 'A', option_value: row.option_a });
      if (row.option_b) options.push({ option_key: 'B', option_value: row.option_b });
      if (row.option_c) options.push({ option_key: 'C', option_value: row.option_c });
      if (row.option_d) options.push({ option_key: 'D', option_value: row.option_d });

      return {
        id: row.id,
        title: row.title,
        question_type: row.question_type || 'multiple_choice',
        difficulty: row.difficulty ? (row.difficulty > 2 ? 'hard' : row.difficulty > 1 ? 'medium' : 'easy') : 'medium',
        created_at: row.created_at,
        round_id: row.round_id,
        round_name: row.round_name || 'No Round',
        round_number: row.round_number,
        correct_answer: row.correct_answer,
        time_limit: row.time_limit,
        minimum_time_frame: row.minimum_time_frame,
        option_a: row.option_a,
        option_b: row.option_b,
        option_c: row.option_c,
        option_d: row.option_d,
        options: options
      };
    });

    return NextResponse.json(
      {
        questions: questionsWithOptions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Questions list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      question_text, 
      round_id, 
      question_type, 
      correct_answer, 
      time_limit, 
      marks,
      optionA,
      optionB,
      optionC,
      optionD
    } = await request.json();

    if (!question_text) {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      );
    }

    if (!round_id) {
      return NextResponse.json(
        { error: 'Round ID is required' },
        { status: 400 }
      );
    }

    // Get or create default section
    let sectionId;
    const sectionResult = await sql`
      SELECT id FROM sections WHERE name = 'Default Section' LIMIT 1
    `;
    
    if (sectionResult.rows.length > 0) {
      sectionId = sectionResult.rows[0].id;
    } else {
      const adminResult = await sql`
        SELECT u.id FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE r.name = 'admin' LIMIT 1
      `;
      
      const userId = adminResult.rows[0]?.id || '00000000-0000-0000-0000-000000000000';
      
      const newSection = await sql`
        INSERT INTO sections (name, description, created_by)
        VALUES ('Default Section', 'Default section for questions', ${userId})
        RETURNING id
      `;
      sectionId = newSection.rows[0].id;
    }

    // Get question type ID
    let questionTypeId;
    const normalizedType = question_type === 'short_answer' ? 'short_answer' : 'multiple_choice';
    const typeResult = await sql`
      SELECT id FROM question_types WHERE name = ${normalizedType} LIMIT 1
    `;
    
    if (typeResult.rows.length > 0) {
      questionTypeId = typeResult.rows[0].id;
    } else {
      // Create question type if it doesn't exist
      const createTypeResult = await sql`
        INSERT INTO question_types (name, description)
        VALUES (${normalizedType}, ${normalizedType === 'short_answer' ? 'Short Answer Questions' : 'Multiple Choice Questions'})
        RETURNING id
      `;
      questionTypeId = createTypeResult.rows[0].id;
    }

    // Get next question number
    const maxQResult = await sql`
      SELECT MAX(question_number) as max_num FROM questions 
      WHERE section_id = ${sectionId} AND round_id = ${round_id}
    `;
    
    const questionNumber = (maxQResult.rows[0]?.max_num || 0) + 1;

    // Get user ID
    const userResult = await sql`
      SELECT u.id FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name = 'admin' LIMIT 1
    `;
    
    const userId = userResult.rows[0]?.id || '00000000-0000-0000-0000-000000000000';

    // Insert question
    const insertResult = await sql`
      INSERT INTO questions (
        section_id, round_id, question_type_id, question_number,
        question_text, correct_answer, time_limit, marks, created_by,
        option_a, option_b, option_c, option_d
      )
      VALUES (
        ${sectionId}, ${round_id}, ${questionTypeId}, ${questionNumber},
        ${question_text}, ${correct_answer}, ${time_limit || 30}, ${marks || 1}, ${userId},
        ${optionA || ''}, ${optionB || ''}, ${optionC || ''}, ${optionD || ''}
      )
      RETURNING id
    `;

    const questionId = insertResult.rows[0].id;

    return NextResponse.json(
      {
        question: {
          id: questionId,
          question_text,
          correct_answer,
          question_type,
        },
        message: 'Question created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create question error:', error);
    return NextResponse.json(
      { error: 'Failed to create question', details: String(error) },
      { status: 500 }
    );
  }
}
