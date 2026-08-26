import { writeFileSync } from 'fs';
import { join } from 'path';
import { utils, write } from 'xlsx';

// Create template data
const templateData = [
  {
    'Question Title': 'What is the capital of France?',
    'Category': 'Geography',
    'Difficulty': 'easy',
    'Option A': 'Paris',
    'Option B': 'London',
    'Option C': 'Berlin',
    'Option D': 'Madrid',
    'Correct Answer': 'A',
    'Explanation': 'Paris is the capital city of France.',
  },
  {
    'Question Title': 'What is 2 + 2?',
    'Category': 'Mathematics',
    'Difficulty': 'easy',
    'Option A': '3',
    'Option B': '4',
    'Option C': '5',
    'Option D': '6',
    'Correct Answer': 'B',
    'Explanation': 'Basic arithmetic: 2 plus 2 equals 4.',
  },
  {
    'Question Title': 'What year did World War II end?',
    'Category': 'History',
    'Difficulty': 'medium',
    'Option A': '1943',
    'Option B': '1944',
    'Option C': '1945',
    'Option D': '1946',
    'Correct Answer': 'C',
    'Explanation': 'World War II ended in 1945.',
  },
];

// Create workbook and worksheet
const wb = utils.book_new();
const ws = utils.json_to_sheet(templateData);

// Set column widths
const columnWidths = [
  { wch: 30 }, // Question Title
  { wch: 15 }, // Category
  { wch: 12 }, // Difficulty
  { wch: 20 }, // Option A
  { wch: 20 }, // Option B
  { wch: 20 }, // Option C
  { wch: 20 }, // Option D
  { wch: 12 }, // Correct Answer
  { wch: 30 }, // Explanation
];

ws['!cols'] = columnWidths;

// Add the worksheet to the workbook
utils.book_append_sheet(wb, ws, 'Questions');

// Create instructions sheet
const instructionsData = [
  { 'Field': 'Question Title', 'Required': 'Yes', 'Description': 'The question text (max 500 characters)' },
  { 'Field': 'Category', 'Required': 'Yes', 'Description': 'Category of the question (e.g., Mathematics, History, Geography, Science)' },
  { 'Field': 'Difficulty', 'Required': 'Yes', 'Description': 'Difficulty level: easy, medium, or hard' },
  { 'Field': 'Option A', 'Required': 'Yes', 'Description': 'First answer option' },
  { 'Field': 'Option B', 'Required': 'Yes', 'Description': 'Second answer option' },
  { 'Field': 'Option C', 'Required': 'Yes', 'Description': 'Third answer option' },
  { 'Field': 'Option D', 'Required': 'Yes', 'Description': 'Fourth answer option' },
  { 'Field': 'Correct Answer', 'Required': 'Yes', 'Description': 'Correct answer: A, B, C, or D' },
  { 'Field': 'Explanation', 'Required': 'No', 'Description': 'Explanation for the correct answer (optional)' },
];

const wsInstructions = utils.json_to_sheet(instructionsData);
wsInstructions['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 40 }];

utils.book_append_sheet(wb, wsInstructions, 'Instructions');

// Write file to public directory
const outputPath = join(process.cwd(), 'public', 'questions-template.xlsx');
write(wb, outputPath);

console.log('[v0] Questions template created successfully at:', outputPath);
