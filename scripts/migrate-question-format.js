const mongoose = require('mongoose');
const Question = require('../src/models/Question');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/speakcraft', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const migrateQuestionFormat = async () => {
    try {
        console.log('Starting question format migration...');

        // Find all questions
        const questions = await Question.find({});
        console.log(`Found ${questions.length} questions to process`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const question of questions) {
            console.log(`\nProcessing question: "${question.question.substring(0, 50)}..."`);
            console.log('Current options structure:', JSON.stringify(question.options, null, 2));

            // Check if this question already has the new format
            if (question.options && question.options.length > 0 && 
                typeof question.options[0] === 'object' && 
                question.options[0].id && 
                question.options[0].text) {
                console.log(`Skipping question - already in new format`);
                skippedCount++;
                continue;
            }

            // Handle different types of existing data
            let newOptions = [];
            
            if (question.options && Array.isArray(question.options)) {
                // Handle the corrupted format where options are objects with numeric keys
                if (question.options.length > 0 && typeof question.options[0] === 'object' && question.options[0]['0']) {
                    console.log('Converting corrupted format...');
                    newOptions = question.options.map((optionObj, index) => {
                        // Convert the object with numeric keys back to a string
                        const optionText = Object.keys(optionObj)
                            .filter(key => key !== '_id' && !isNaN(parseInt(key)))
                            .sort((a, b) => parseInt(a) - parseInt(b))
                            .map(key => optionObj[key])
                            .join('');
                        
                        return {
                            id: String.fromCharCode(65 + index), // A, B, C, D, etc.
                            text: optionText
                        };
                    });
                } else if (typeof question.options[0] === 'string') {
                    console.log('Converting string array format...');
                    newOptions = question.options.map((option, index) => ({
                        id: String.fromCharCode(65 + index), // A, B, C, D, etc.
                        text: option
                    }));
                } else {
                    console.log('Unknown format, skipping...');
                    skippedCount++;
                    continue;
                }

                // Update the correctAnswer to use the new option IDs
                let newCorrectAnswer = question.correctAnswer;
                if (typeof question.correctAnswer === 'string') {
                    // Find the index of the correct answer in the old options
                    const oldOptions = question.options.map(opt => {
                        if (typeof opt === 'string') return opt;
                        if (opt['0']) {
                            return Object.keys(opt)
                                .filter(key => key !== '_id' && !isNaN(parseInt(key)))
                                .sort((a, b) => parseInt(a) - parseInt(b))
                                .map(key => opt[key])
                                .join('');
                        }
                        return '';
                    });
                    
                    const correctIndex = oldOptions.findIndex(opt => opt === question.correctAnswer);
                    if (correctIndex !== -1) {
                        newCorrectAnswer = String.fromCharCode(65 + correctIndex);
                    }
                }

                // Update the question
                await Question.findByIdAndUpdate(question._id, {
                    options: newOptions,
                    correctAnswer: newCorrectAnswer
                });

                console.log(`✅ Migrated question with ${newOptions.length} options`);
                console.log('New options:', JSON.stringify(newOptions, null, 2));
                console.log('New correct answer:', newCorrectAnswer);
                migratedCount++;
            } else {
                console.log(`⚠️  Skipping question - no valid options found`);
                skippedCount++;
            }
        }

        console.log('\n🎉 Migration completed!');
        console.log(`- Migrated: ${migratedCount} questions`);
        console.log(`- Skipped: ${skippedCount} questions`);
        console.log(`- Total processed: ${migratedCount + skippedCount}`);

    } catch (error) {
        console.error('❌ Error during migration:', error);
        console.error('Error details:', error.message);
    } finally {
        mongoose.connection.close();
    }
};

migrateQuestionFormat(); 