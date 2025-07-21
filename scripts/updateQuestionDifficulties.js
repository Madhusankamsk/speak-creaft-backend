const mongoose = require('mongoose');
const Question = require('../src/models/Question');
require('dotenv').config();

async function updateQuestionDifficulties() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/speakcraft');
    console.log('Connected to MongoDB');

    // Find questions without difficulty or with null/undefined difficulty
    const questionsWithoutDifficulty = await Question.find({
      $or: [
        { difficulty: { $exists: false } },
        { difficulty: null },
        { difficulty: '' }
      ]
    });

    console.log(`Found ${questionsWithoutDifficulty.length} questions without difficulty`);

    if (questionsWithoutDifficulty.length > 0) {
      // Update all questions to have 'medium' difficulty as default
      const result = await Question.updateMany(
        {
          $or: [
            { difficulty: { $exists: false } },
            { difficulty: null },
            { difficulty: '' }
          ]
        },
        { $set: { difficulty: 'medium' } }
      );

      console.log(`Updated ${result.modifiedCount} questions with default difficulty 'medium'`);
    }

    // Show current difficulty distribution
    const difficultyStats = await Question.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\nCurrent difficulty distribution:');
    difficultyStats.forEach(stat => {
      console.log(`- ${stat._id || 'No difficulty'}: ${stat.count} questions`);
    });

    console.log('\nQuestion difficulties updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating question difficulties:', error);
    process.exit(1);
  }
}

updateQuestionDifficulties(); 