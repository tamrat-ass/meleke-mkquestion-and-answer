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
        // Get cell values and convert to string, handling null/undefined
        const getCell = (col: string) => {
          const cell = row.getCell(col);
          if (cell.value === null || cell.value === undefined) return '';
          return String(cell.value).trim();
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

        // For multiple choice, correct answer is required
        // For short answer, correct answer is required
        if (!correctAnswer.trim()) {
          errors.push(`Row ${rowNumber}: Correct Answer is required`);
          return;
        }

        // Validate question type
        const validTypes = ['multiple_choice', 'short_answer'];
        const normalizedType = questionTypeStr.toLowerCase().trim();
        if (!validTypes.includes(normalizedType)) {
          errors.push(`Row ${rowNumber}: Invalid question type "${questionTypeStr}". Use "multiple_choice" or "short_answer"`);
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

        // Get question type ID based on type
        const dbTypeName = q.question_type === 'short_answer' ? 'short_answer' : 'multiple_choice';
        let typeResult = await sql`
          SELECT id FROM question_types WHERE name = ${dbTypeName} LIMIT 1
        `;
        
        let questionTypeId = typeResult.rows[0]?.id;

        // If question type doesn't exist, create it
        if (!questionTypeId) {
          const createTypeResult = await sql`
            INSERT INTO question_types (name, description)
            VALUES (${dbTypeName}, ${dbTypeName === 'short_answer' ? 'Short Answer Questions' : 'Multiple Choice Questions'})
            RETURNING id
          `;
          questionTypeId = createTypeResult.rows[0]?.id;
        }

        // If still no type ID, skip this question
        if (!questionTypeId) {
          errors.push(`No question type found for: ${q.question_type}`);
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
