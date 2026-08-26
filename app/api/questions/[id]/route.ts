import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if there are game_questions referencing this question
    const gameQuestionsCheck = await sql`
      SELECT COUNT(*) as count FROM game_questions WHERE question_id = ${id}
    `;

    if (gameQuestionsCheck.rows[0]?.count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete question that is used in active games. Please end those games first.' },
        { status: 409 }
      );
    }

    // Check if there are game_answers referencing this question
    const gameAnswersCheck = await sql`
      SELECT COUNT(*) as count FROM game_answers WHERE question_id = ${id}
    `;

    if (gameAnswersCheck.rows[0]?.count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete question that has answers in games. Please clear those answers first.' },
        { status: 409 }
      );
    }

    // Now safe to delete - question_options will cascade delete automatically
    const result = await sql`
      DELETE FROM questions WHERE id = ${id}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Log activity
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Get admin user ID for logging
    const userResult = await sql`
      SELECT u.id FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name = 'admin' LIMIT 1
    `;
    
    const userId = userResult.rows[0]?.id;
    if (userId) {
      await logActivity(
        parseInt(userId as string),
        'QUESTION_DELETED',
        'question',
        parseInt(id),
        { question_id: id },
        ipAddress as string,
        userAgent as string
      );
    }

    return NextResponse.json(
      { message: 'Question deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete question error:', error);
    return NextResponse.json(
      { error: 'Failed to delete question', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await sql`
      SELECT q.id, q.question_text, q.correct_answer, q.marks, q.created_at,
             q.option_a, q.option_b, q.option_c, q.option_d, 
             qt.name as question_type, q.time_limit, q.minimum_time_frame
      FROM questions q
      LEFT JOIN question_types qt ON q.question_type_id = qt.id
      WHERE q.id = ${id}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const question = result.rows[0];

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

    // Extract option values (handle if they're objects)
    const optionAText = extractStringValue(question.option_a);
    const optionBText = extractStringValue(question.option_b);
    const optionCText = extractStringValue(question.option_c);
    const optionDText = extractStringValue(question.option_d);
    
    // Extract question text in case it's stored as object
    const questionText = extractStringValue(question.question_text) || question.question_text;

    // Convert options to array format
    const options = [];
    console.log('Question data from DB:', {
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
    });
    if (optionAText) options.push({ option_key: 'A', option_value: optionAText });
    if (optionBText) options.push({ option_key: 'B', option_value: optionBText });
    if (optionCText) options.push({ option_key: 'C', option_value: optionCText });
    if (optionDText) options.push({ option_key: 'D', option_value: optionDText });
    console.log('Built options array:', options);

    return NextResponse.json(
      { 
        question: {
          ...question,
          question_text: questionText,
          option_a: optionAText,
          option_b: optionBText,
          option_c: optionCText,
          option_d: optionDText,
          options: options
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get question error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { question_text, correct_answer, time_limit, marks, option_a, option_b, option_c, option_d } = await request.json();

    const result = await sql`
      UPDATE questions
      SET question_text = ${question_text}, 
          correct_answer = ${correct_answer},
          time_limit = ${time_limit},
          marks = ${marks},
          option_a = ${option_a || null},
          option_b = ${option_b || null},
          option_c = ${option_c || null},
          option_d = ${option_d || null},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, question_text, correct_answer, time_limit, marks, created_at, option_a, option_b, option_c, option_d
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Log activity
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Get admin user ID for logging
    const userResult = await sql`
      SELECT u.id FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name = 'admin' LIMIT 1
    `;
    
    const userId = userResult.rows[0]?.id;
    if (userId) {
      await logActivity(
        parseInt(userId as string),
        'QUESTION_UPDATED',
        'question',
        parseInt(id),
        { question_text, correct_answer: '***', time_limit, marks },
        ipAddress as string,
        userAgent as string
      );
    }

    return NextResponse.json(
      { 
        question: result.rows[0], 
        message: 'Question updated successfully' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update question error:', error);
    return NextResponse.json(
      { error: 'Failed to update question', details: String(error) },
      { status: 500 }
    );
  }
}
