import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import ExcelJS from 'exceljs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read Excel file
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      return NextResponse.json(
        { error: 'Excel file is empty' },
        { status: 400 }
      );
    }

    // Validate and insert questions
    const insertedQuestions: any[] = [];
    const errors: string[] = [];

    // Get section
    let sectionId;
    
    try {
      // Get or create default section
      const sectionResult = await sql`
        SELECT id FROM sections WHERE name = 'Default Section' LIMIT 1
      `;
      
      if (sectionResult.rows.length > 0) {
        sectionId = sectionResult.rows[0].id;
      } else {
        // Create default section
        const adminResult = await sql`
          SELECT u.id FROM users u 
          JOIN roles r ON u.role_id = r.id 
          WHERE r.name = 'admin' LIMIT 1
        `;
        
        const userId = adminResult.rows[0]?.id || '00000000-0000-0000-0000-000000000000';
        
        const newSection = await sql`
          INSERT INTO sections (name, description, created_by)
          VALUES ('Default Section', 'Default section for bulk uploads', ${userId})
          RETURNING id
        `;
        sectionId = newSection.rows[0].id;
      }

    } catch (error) {
      console.error('Error setting up section:', error);
      return NextResponse.json(
        { error: 'Failed to set up section' },
        { status: 500 }
      );
    }

    // Process each row
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      try {
        // Get cell values and convert to string, handling null/undefined and objects
        const getCell = (col: string) => {
          const cell = row.getCell(col);
          let value: any = cell.value;
          
          // Handle null/undefined
          if (value === null || value === undefined) return '';
          
          // If it's an object, extract the text value
          if (typeof value === 'object' && !(value instanceof Date)) {
            // ExcelJS might return objects with rich text or formulas
            if ((value as any).richText && Array.isArray((value as any).richText)) {
              // Extract text from rich text array
              return (value as any).richText.map((rt: any) => rt.text || rt).join('').trim();
            }
            if ((value as any).text) return String((value as any).text).trim();
            if ((value as any).result) return String((value as any).result).trim();
            if ((value as any).formula) return String((value as any).formula).trim();
            // If it's a plain object, try to convert
            return JSON.stringify(value).replace(/[{}"\[\]]/g, '').trim();
          }
          
          // Convert to string
          return String(value).trim();
        };

        const questionText = getCell('A');
        const questionTypeStr = getCell('B') || 'multiple_choice';
        const correctAnswer = getCell('C');
        const optionA = getCell('D');
        const optionB = getCell('E');
        const optionC = getCell('F');
        const optionD = getCell('G');
        const timeLimit = parseInt(getCell('H') || '30');
        const marks = parseInt(getCell('I') || '1');
        const roundName = getCell('J');

        if (!questionText.trim()) {
          errors.push(`Row ${rowNumber}: Question is required`);
          return;
        }

        if (!roundName.trim()) {
          errors.push(`Row ${rowNumber}: Round is required`);
          return;
        }

        // For multiple choice and short answer, correct answer is required
        // For sign_screen, signed, and general_knowledge, correct answer is NOT required
        const normalizedType = questionTypeStr.toLowerCase().trim();
        if (normalizedType !== 'sign_screen' && normalizedType !== 'signed' && normalizedType !== 'general knowledge' && !correctAnswer.trim()) {
          errors.push(`Row ${rowNumber}: Correct Answer is required for ${normalizedType}`);
          return;
        }

        // Validate question type
        const validTypes = ['multiple_choice', 'short_answer', 'sign_screen', 'signed', 'general knowledge'];
        if (!validTypes.includes(normalizedType)) {
          errors.push(`Row ${rowNumber}: Invalid question type "${questionTypeStr}". Use "multiple_choice", "short_answer", "sign_screen", or "general knowledge"`);
          return;
        }

        insertedQuestions.push({
          id: Math.random().toString(),
          question_text: questionText,
          question_type: normalizedType,
          correct_answer: correctAnswer,
          timeLimit,
          marks,
          optionA,
          optionB,
          optionC,
          optionD,
          round_name: roundName,
        });

      } catch (error) {
        errors.push(`Row ${rowNumber}: ${String(error)}`);
      }
    });

    // Now insert all questions to database
    let successCount = 0;
    for (const q of insertedQuestions) {
      try {
        // Get round ID by round name
        const roundResult = await sql`
          SELECT id FROM rounds WHERE name = ${q.round_name} LIMIT 1
        `;
        
        if (roundResult.rows.length === 0) {
          errors.push(`Round "${q.round_name}" not found in database`);
          continue;
        }

        const roundId = roundResult.rows[0].id;

        // Get question type ID based on type with database constraints (with fallback for missing columns)
        const dbTypeName = q.question_type === 'short_answer' ? 'short_answer' : q.question_type === 'sign_screen' ? 'sign_screen' : q.question_type === 'signed' ? 'signed' : q.question_type === 'general knowledge' ? 'general knowledge' : 'multiple_choice';
        
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
            WHERE name = ${dbTypeName} 
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
              WHERE name = ${dbTypeName} 
              LIMIT 1
            `;
          } else {
            throw columnError;
          }
        }
        
        let questionTypeId = typeResult.rows[0]?.id;
        let minTimeLimit = typeResult.rows[0]?.min_time_limit || 5;
        let maxTimeLimit = typeResult.rows[0]?.max_time_limit || 300;
        let minMinimumTimeFrame = typeResult.rows[0]?.min_minimum_time_frame || 1;

        // If question type doesn't exist, create it with default constraints
        if (!questionTypeId) {
          const typeDescriptions: Record<string, string> = {
            'short_answer': 'Short Answer Questions',
            'sign_screen': 'Sign Screen Questions',
            'signed': 'Signed Questions',
            'general knowledge': 'General Knowledge Questions',
            'multiple_choice': 'Multiple Choice Questions'
          };
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
              VALUES (${dbTypeName}, ${typeDescriptions[dbTypeName] || dbTypeName}, 30, 5, 300, 1)
              RETURNING id, min_time_limit, max_time_limit, min_minimum_time_frame
            `;
            questionTypeId = createTypeResult.rows[0]?.id;
            minTimeLimit = createTypeResult.rows[0]?.min_time_limit || 5;
            maxTimeLimit = createTypeResult.rows[0]?.max_time_limit || 300;
            minMinimumTimeFrame = createTypeResult.rows[0]?.min_minimum_time_frame || 1;
          } catch (createError: any) {
            // If columns don't exist, create without them
            if (createError.code === '42703') {
              const createTypeResult = await sql`
                INSERT INTO question_types (name, description)
                VALUES (${dbTypeName}, ${typeDescriptions[dbTypeName] || dbTypeName})
                RETURNING id
              `;
              questionTypeId = createTypeResult.rows[0]?.id;
            } else {
              throw createError;
            }
          }
        }

        // If still no type ID, skip this question
        if (!questionTypeId) {
          errors.push(`No question type found for: ${q.question_type}`);
          continue;
        }

        // Validate time_limit against database constraints
        if (q.timeLimit < minTimeLimit || q.timeLimit > maxTimeLimit) {
          errors.push(`Row with question "${q.question_text}": Time limit ${q.timeLimit}s is outside allowed range ${minTimeLimit}-${maxTimeLimit}s for ${dbTypeName} (from database)`);
          continue;
        }

        const maxQResult = await sql`
          SELECT MAX(question_number) as max_num FROM questions 
          WHERE section_id = ${sectionId} AND round_id = ${roundId}
        `;
        
        const questionNumber = (maxQResult.rows[0]?.max_num || 0) + 1;

        const userResult = await sql`
          SELECT u.id FROM users u 
          JOIN roles r ON u.role_id = r.id 
          WHERE r.name = 'admin' LIMIT 1
        `;
        
        const userId = userResult.rows[0]?.id || '00000000-0000-0000-0000-000000000000';

        const insertResult = await sql`
          INSERT INTO questions (
            section_id, round_id, question_type_id, question_number,
            question_text, correct_answer, time_limit, marks, created_by,
            option_a, option_b, option_c, option_d
          )
          VALUES (
            ${sectionId}, ${roundId}, ${questionTypeId}, ${questionNumber},
            ${q.question_text}, ${q.correct_answer}, ${q.timeLimit}, ${q.marks}, ${userId},
            ${q.optionA || ''}, ${q.optionB || ''}, ${q.optionC || ''}, ${q.optionD || ''}
          )
          RETURNING id
        `;

        const questionId = insertResult.rows[0].id;
        console.log(`✓ Inserted question with options: ${q.question_text}`);
        
        successCount++;
      } catch (error) {
        errors.push(`Error inserting question "${q.question_text}": ${String(error)}`);
        console.error('Error inserting question:', error);
      }
    }

    return NextResponse.json(
      {
        inserted: successCount,
        total: worksheet.rowCount - 1,
        parsed: insertedQuestions.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully imported ${successCount} out of ${worksheet.rowCount - 1} questions`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload questions error:', error);
    return NextResponse.json(
      { error: 'Failed to upload questions', details: String(error) },
      { status: 500 }
    );
  }
}
