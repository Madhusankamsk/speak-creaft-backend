const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Question = require('../src/models/Question');
const Admin = require('../src/models/Admin');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/speakcraft', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const createSampleData = async () => {
    try {
        console.log('Creating sample data...');

        // Create a sample admin if not exists
        let admin = await Admin.findOne({ email: 'admin@speakcraft.com' });
        if (!admin) {
            admin = new Admin({
                name: 'Admin User',
                email: 'admin@speakcraft.com',
                password: 'admin123',
                role: 'admin',
                permissions: [
                    'user_management',
                    'content_management',
                    'category_management',
                    'analytics_view',
                    'system_settings',
                    'admin_management'
                ]
            });
            await admin.save();
            console.log('✅ Sample admin created');
        } else {
            console.log('✅ Admin already exists');
        }

        // Create sample categories
        const categories = [
            { name: 'Grammar', description: 'English grammar questions', createdBy: admin._id },
            { name: 'Vocabulary', description: 'Vocabulary and word usage', createdBy: admin._id },
            { name: 'Pronunciation', description: 'Pronunciation and phonetics', createdBy: admin._id },
            { name: 'Conversation', description: 'Daily conversation skills', createdBy: admin._id }
        ];

        const createdCategories = [];
        for (const catData of categories) {
            let category = await Category.findOne({ name: catData.name });
            if (!category) {
                category = new Category(catData);
                await category.save();
                console.log(`✅ Category "${catData.name}" created`);
            } else {
                console.log(`✅ Category "${catData.name}" already exists`);
            }
            createdCategories.push(category);
        }

        // Create sample questions with new format
        const questions = [
            {
                question: 'What is the correct form of the verb "to be" in the present tense for "he"?',
                type: 'multiple_choice',
                options: [
                    { id: 'A', text: 'am' },
                    { id: 'B', text: 'is' },
                    { id: 'C', text: 'are' },
                    { id: 'D', text: 'be' }
                ],
                correctAnswer: 'B',
                explanation: 'The correct form of "to be" for third person singular (he/she/it) is "is".',
                categoryId: createdCategories[0]._id, // Grammar
                difficulty: 'easy',
                isActive: true,
                createdBy: admin._id
            },
            {
                question: 'Which word is a synonym for "happy"?',
                type: 'multiple_choice',
                options: [
                    { id: 'A', text: 'sad' },
                    { id: 'B', text: 'joyful' },
                    { id: 'C', text: 'angry' },
                    { id: 'D', text: 'tired' }
                ],
                correctAnswer: 'B',
                explanation: 'Joyful is a synonym for happy, meaning feeling or showing great pleasure.',
                categoryId: createdCategories[1]._id, // Vocabulary
                difficulty: 'easy',
                isActive: true,
                createdBy: admin._id
            },
            {
                question: 'How do you pronounce the word "schedule"?',
                type: 'multiple_choice',
                options: [
                    { id: 'A', text: 'shed-yool' },
                    { id: 'B', text: 'sked-yool' },
                    { id: 'C', text: 'shedule' },
                    { id: 'D', text: 'skedule' }
                ],
                correctAnswer: 'B',
                explanation: 'In American English, "schedule" is pronounced as "sked-yool".',
                categoryId: createdCategories[2]._id, // Pronunciation
                difficulty: 'medium',
                isActive: true,
                createdBy: admin._id
            },
            {
                question: 'What is the appropriate response to "How are you?"?',
                type: 'multiple_choice',
                options: [
                    { id: 'A', text: 'Goodbye' },
                    { id: 'B', text: 'I am fine, thank you' },
                    { id: 'C', text: 'What is your name?' },
                    { id: 'D', text: 'I do not know' }
                ],
                correctAnswer: 'B',
                explanation: 'The most appropriate response to "How are you?" is "I am fine, thank you" or similar expressions.',
                categoryId: createdCategories[3]._id, // Conversation
                difficulty: 'easy',
                isActive: true,
                createdBy: admin._id
            },
            {
                question: 'Which sentence uses the correct past perfect tense?',
                type: 'multiple_choice',
                options: [
                    { id: 'A', text: 'I have eaten dinner' },
                    { id: 'B', text: 'I had eaten dinner before she arrived' },
                    { id: 'C', text: 'I ate dinner' },
                    { id: 'D', text: 'I will eat dinner' }
                ],
                correctAnswer: 'B',
                explanation: 'The past perfect tense (had + past participle) is used to show that one action happened before another in the past.',
                categoryId: createdCategories[0]._id, // Grammar
                difficulty: 'hard',
                isActive: true,
                createdBy: admin._id
            }
        ];

        for (const qData of questions) {
            const existingQuestion = await Question.findOne({ 
                question: qData.question,
                categoryId: qData.categoryId 
            });
            
            if (!existingQuestion) {
                const question = new Question(qData);
                await question.save();
                console.log(`✅ Question created: "${qData.question.substring(0, 50)}..."`);
            } else {
                console.log(`✅ Question already exists: "${qData.question.substring(0, 50)}..."`);
            }
        }

        console.log('\n🎉 Sample data creation completed!');
        console.log('\n📋 Summary:');
        console.log(`- Admin: ${admin.email} (password: admin123)`);
        console.log(`- Categories: ${createdCategories.length}`);
        console.log(`- Questions: ${questions.length}`);
        console.log('\n🔗 You can now test the admin panel at: http://localhost:5000/admin');

    } catch (error) {
        console.error('❌ Error creating sample data:', error);
    } finally {
        mongoose.connection.close();
    }
};

createSampleData(); 