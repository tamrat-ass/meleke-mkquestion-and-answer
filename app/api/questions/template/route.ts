import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    
    // Create Questions sheet (main sheet)
    const worksheet = workbook.addWorksheet('Questions');
    
    // Add headers in exact order: Question, Type, Correct Answer, Option A, Option B, Option C, Option D, Time Limit, Marks, Round
    worksheet.columns = [
      { header: 'Question', key: 'question', width: 40 },
      { header: 'Type', key: 'type', width: 18 },
      { header: 'Correct Answer', key: 'correctAnswer', width: 20 },
      { header: 'Option A', key: 'optionA', width: 20 },
      { header: 'Option B', key: 'optionB', width: 20 },
      { header: 'Option C', key: 'optionC', width: 20 },
      { header: 'Option D', key: 'optionD', width: 20 },
      { header: 'Time Limit (seconds)', key: 'timeLimit', width: 20 },
      { header: 'Marks', key: 'marks', width: 10 },
      { header: 'Round', key: 'round', width: 20 }
    ];

    // Add example data
    const templateData = [
      {
        question: 'What is the capital of France?',
        type: 'multiple_choice',
        correctAnswer: 'B',
        optionA: 'London',
        optionB: 'Paris',
        optionC: 'Berlin',
        optionD: 'Madrid',
        timeLimit: 30,
        marks: 1,
        round: 'Round 1'
      },
      {
        question: 'What is 2 + 2?',
        type: 'multiple_choice',
        correctAnswer: 'C',
        optionA: '3',
        optionB: '5',
        optionC: '4',
        optionD: '6',
        timeLimit: 30,
        marks: 1,
        round: 'Round 1'
      },
      {
        question: 'What is the chemical symbol for Gold?',
        type: 'short_answer',
        correctAnswer: 'Au',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        timeLimit: 60,
        marks: 2,
        round: 'Round 2'
      },
      {
        question: 'Name the largest planet in our solar system.',
        type: 'short_answer',
        correctAnswer: 'Jupiter',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        timeLimit: 60,
        marks: 2,
        round: 'Round 2'
      }
    ];

    worksheet.addRows(templateData);

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return as file download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="questions_template.xlsx"',
      },
    });
  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
