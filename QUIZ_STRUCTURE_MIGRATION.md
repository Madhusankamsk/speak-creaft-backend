# Quiz Structure Migration

This document explains the migration from the old quiz question format to the new format that matches the React Native app structure.

## Changes Made

### 1. Question Model Update (`src/models/Question.js`)
- **Old Format**: `options: [String]` (array of strings)
- **New Format**: `options: [{ id: String, text: String }]` (array of objects with id and text)

### 2. Migration Script (`scripts/migrate-question-format.js`)
- Converts existing questions from old format to new format
- Automatically assigns option IDs (A, B, C, D, etc.)
- Skips questions already in new format

### 3. Sample Data Update (`scripts/create-sample-data.js`)
- Updated to use new question format
- All sample questions now use the new structure

## How to Run the Migration

### Step 1: Run the Migration Script
```bash
cd backend
node scripts/migrate-question-format.js
```

### Step 2: Verify the Migration
Check that questions now have the new format:
```javascript
// Old format (before migration)
options: ['am', 'is', 'are', 'be']
correctAnswer: 'is'

// New format (after migration)
options: [
  { id: 'A', text: 'am' },
  { id: 'B', text: 'is' },
  { id: 'C', text: 'are' },
  { id: 'D', text: 'be' }
]
correctAnswer: 'B'
```

### Step 3: Update Frontend Code (if needed)
The React Native app already uses the new format, so no changes are needed there.

## Benefits of the New Format

1. **Consistency**: Matches the React Native app structure
2. **Flexibility**: Option IDs can be customized (A, B, C, D or 1, 2, 3, 4, etc.)
3. **Clarity**: Clear separation between option identifier and text
4. **Extensibility**: Easy to add more properties to options in the future

## API Compatibility

The API endpoints remain the same, but the response format for questions now includes the new structure:

```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "_id": "...",
        "question": "What is the correct form...",
        "options": [
          { "id": "A", "text": "am" },
          { "id": "B", "text": "is" },
          { "id": "C", "text": "are" },
          { "id": "D", "text": "be" }
        ],
        "correctAnswer": "B",
        "explanation": "..."
      }
    ]
  }
}
```

## Rollback (if needed)

If you need to rollback to the old format, you can:

1. Revert the Question model changes
2. Create a reverse migration script
3. Update the sample data script

However, this is not recommended as the new format is more robust and matches the frontend requirements. 