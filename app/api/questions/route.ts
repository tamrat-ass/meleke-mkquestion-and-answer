import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/auth';

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
        q.option_d,
        q.status
      FROM questions q
      LEFT JOIN question_types qt ON q.question_type_id = qt.id
      LEFT JOIN rounds r ON q.round_id = r.id
      WHERE q.is_deleted = false
      ORDER BY r.round_number ASC, q.created_at DESC
    `;

    // Helper function to safely extract string from any data type
    const extractStringValue = (value: any): string => {
      if (!value) return '';
      
      // If it's already a string, return it (trim whitespace)
      if (typeof value === 'string') {
        const trimmed = String(value).trim();
        // Filter out JavaScript object representations
        if (trimmed === '[object Object]' || trimmed.includes('[object')) {
          return '';
        }
        return trimmed;
      }
      
      // If it's an object, try multiple property names to extract the value
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Try common property names used to store option text
        for (const key of ['text', 'value', 'option', 'answer', 'content', 'label', 'name']) {
          if (value[key]) {
            const extracted = String(value[key]).trim();
            if (extracted && extracted !== '[object Object]' && !extracted.includes('[object')) {
              return extracted;
            }
          }
        }
        
        // If no standard properties found, try Object.values to get any string
        const values = Object.values(value);
        for (const v of values) {
          if (typeof v === 'string' && v && v !== '[object Object]' && !v.includes('[object')) {
            return v.trim();
          }
        }
      }
      
      // Last resort: convert to string and clean up
      const str = String(value).trim();
      if (str === '[object Object]' || str.includes('[object')) {
        return '';
      }
      return str;
    };

    // Helper to extract answer letter
    const extractAnswerLetter = (value: any): string => {
      if (!value) return '';
      
      // If it's a string, take first character
      if (typeof value === 'string') {
        const char = value.trim().toUpperCase().charAt(0);
        if (/[A-D]/.test(char)) return char;
      }
      
      // If it's an object, try to extract
      if (typeof value === 'object' && value !== null) {
        for (const key of ['value', 'answer', 'letter', 'text']) {
          if (value[key]) {
            const char = String(value[key]).trim().toUpperCase().charAt(0);
            if (/[A-D]/.test(char)) return char;
          }
        }
      }
      
      // Convert to string and get first valid character
      const char = String(value).trim().toUpperCase().charAt(0);
      return /[A-D]/.test(char) ? char : '';
    };

    // Convert options to array format
    const questionsWithOptions = result.rows.map((row: any) => {
      // Extract option values (handle if they're objects)
      const optionAText = extractStringValue(row.option_a);
      const optionBText = extractStringValue(row.option_b);
      const optionCText = extractStringValue(row.option_c);
      const optionDText = extractStringValue(row.option_d);

      // Extract correct answer letter
      const correctAnswerLetter = extractAnswerLetter(row.correct_answer);
      
      // Also extract question text in case it's stored as object
      const questionText = extractStringValue(row.title) || row.title;

      const options = [];
      if (optionAText) options.push({ option_key: 'A', option_value: optionAText });
      if (optionBText) options.push({ option_key: 'B', option_value: optionBText });
      if (optionCText) options.push({ option_key: 'C', option_value: optionCText });
      if (optionDText) options.push({ option_key: 'D', option_value: optionDText });

      return {
        id: row.id,
        title: questionText,
        question_type: row.question_type || 'multiple_choice',
        difficulty: row.difficulty ? (row.difficulty > 2 ? 'hard' : row.difficulty > 1 ? 'medium' : 'easy') : 'medium',
        created_at: row.created_at,
        round_id: row.round_id,
        round_name: row.round_name || 'No Round',
        round_number: row.round_number,
        correct_answer: correctAnswerLetter,
        time_limit: row.time_limit,
        minimum_time_frame: row.minimum_time_frame,
        option_a: optionAText,
        option_b: optionBText,
        option_c: optionCText,
        option_d: optionDText,
        options: options,
        status: row.status
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

    // Get question type ID and constraints from database
    let questionTypeId;
    let questionTypeTimeLimit = 30; // default fallback
    let minTimeLimit = 5;
    let maxTimeLimit = 300;
    let minMinimumTimeFrame = 1;
    
    // Try to fetch with new constraint columns, fallback if they don't exist
    let typeResult;
    try {
      typeResult = await sql`
        SELECT 
          id, 
          time_limit,
          min_time_limit,
          max_time_limit,
          min_minimum_time_frame
        FROM question_types 
        WHERE name = ${question_type} 
        LIMIT 1
      `;
    } catch (columnError: any) {
      // If constraint columns don't exist, use basic query
      if (columnError.code === '42703') {
        typeResult = await sql`
          SELECT 
            id, 
            time_limit
          FROM question_types 
          WHERE name = ${question_type} 
          LIMIT 1
        `;
      } else {
        throw columnError;
      }
    }
    
    if (typeResult.rows.length > 0) {
      questionTypeId = typeResult.rows[0].id;
      questionTypeTimeLimit = typeResult.rows[0].time_limit || 30;
      minTimeLimit = typeResult.rows[0].min_time_limit || 5;
      maxTimeLimit = typeResult.rows[0].max_time_limit || 300;
      minMinimumTimeFrame = typeResult.rows[0].min_minimum_time_frame || 1;
    } else {
      // Create question type if it doesn't exist with default constraints
      try {
        const createTypeResult = await sql`
          INSERT INTO question_types (
            name, 
            description, 
            time_limit,
            min_time_limit,
            max_time_limit,
            min_minimum_time_frame
          )
          VALUES (${question_type}, ${question_type}, 30, 5, 300, 1)
          RETURNING id, time_limit, min_time_limit, max_time_limit, min_minimum_time_frame
        `;
        questionTypeId = createTypeResult.rows[0].id;
        questionTypeTimeLimit = createTypeResult.rows[0].time_limit || 30;
        minTimeLimit = createTypeResult.rows[0].min_time_limit || 5;
        maxTimeLimit = createTypeResult.rows[0].max_time_limit || 300;
        minMinimumTimeFrame = createTypeResult.rows[0].min_minimum_time_frame || 1;
      } catch (createError: any) {
        // If columns don't exist, create without them
        if (createError.code === '42703') {
          const createTypeResult = await sql`
            INSERT INTO question_types (name, description, time_limit)
            VALUES (${question_type}, ${question_type}, 30)
            RETURNING id, time_limit
          `;
          questionTypeId = createTypeResult.rows[0].id;
          questionTypeTimeLimit = createTypeResult.rows[0].time_limit || 30;
        } else {
          throw createError;
        }
      }
    }

    // Validate time_limit against database constraints
    const finalTimeLimit = time_limit || questionTypeTimeLimit;
    if (finalTimeLimit < minTimeLimit || finalTimeLimit > maxTimeLimit) {
      return NextResponse.json(
        { 
          error: `Time limit ${finalTimeLimit} is outside allowed range for ${question_type}: ${minTimeLimit}-${maxTimeLimit} seconds (from database)` 
        },
        { status: 400 }
      );
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
        ${question_text}, ${correct_answer}, ${finalTimeLimit}, ${marks || 1}, ${userId},
        ${optionA || ''}, ${optionB || ''}, ${optionC || ''}, ${optionD || ''}
      )
      RETURNING id
    `;

    const questionId = insertResult.rows[0].id;

    // Log activity
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    await logActivity(
      parseInt(userId as string),
      'QUESTION_CREATED',
      'question',
      questionId,
      { 
        question_text, 
        question_type, 
        round_id,
        correct_answer: correct_answer ? '***' : null
      },
      ipAddress as string,
      userAgent as string
    );

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
