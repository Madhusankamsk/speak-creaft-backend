const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000'; // Change this to your backend URL
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'Testpassword@123',
  name: 'Test User'
};

// Test quiz submission
async function testQuizSubmission() {
  try {
    console.log('=== Starting Quiz Submission Test ===');
    
    // Step 1: Register or login a test user
    console.log('\n1. Attempting to login user...');
    let authResponse;
    try {
      authResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
      });
    } catch (loginError) {
      if (loginError.response?.status === 401) {
        console.log('User not found, attempting to register...');
        authResponse = await axios.post(`${BASE_URL}/api/auth/register`, TEST_USER);
      } else {
        throw loginError;
      }
    }

    if (!authResponse.data.success) {
      throw new Error('Authentication failed: ' + authResponse.data.message);
    }

    const token = authResponse.data.data.accessToken;
    const userId = authResponse.data.data.user._id;
    console.log('✓ Authentication successful');
    console.log('User ID:', userId);
    console.log('Token preview:', token.substring(0, 20) + '...');

    // Step 2: Get quiz questions
    console.log('\n2. Fetching quiz questions...');
    const questionsResponse = await axios.get(`${BASE_URL}/api/quiz/questions`);
    
    if (!questionsResponse.data.success || !questionsResponse.data.data.length) {
      throw new Error('No quiz questions available');
    }

    const questions = questionsResponse.data.data;
    console.log('✓ Found', questions.length, 'questions');

    // Step 3: Prepare quiz answers (simulate user answers)
    console.log('\n3. Preparing quiz answers...');
    const answers = questions.map(question => ({
      questionId: question._id,
      userAnswer: question.options[0], // Always pick first option for test
      timeSpent: Math.floor(Math.random() * 30) + 10 // Random time between 10-40 seconds
    }));

    const quizData = {
      answers,
      timeSpent: answers.reduce((total, answer) => total + answer.timeSpent, 0)
    };

    console.log('✓ Prepared answers for', answers.length, 'questions');
    console.log('Total time spent:', quizData.timeSpent, 'seconds');

    // Step 4: Submit quiz with authentication
    console.log('\n4. Submitting quiz results...');
    const submitResponse = await axios.post(
      `${BASE_URL}/api/quiz/submit`,
      quizData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!submitResponse.data.success) {
      throw new Error('Quiz submission failed: ' + submitResponse.data.message);
    }

    console.log('✓ Quiz submitted successfully!');
    console.log('Results:', {
      score: submitResponse.data.data.score,
      totalQuestions: submitResponse.data.data.totalQuestions,
      level: submitResponse.data.data.level,
      levelName: submitResponse.data.data.levelName,
      timeSpent: submitResponse.data.data.timeSpent
    });

    // Step 5: Verify quiz status
    console.log('\n5. Verifying quiz status...');
    const statusResponse = await axios.get(
      `${BASE_URL}/api/quiz/status`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!statusResponse.data.success) {
      throw new Error('Failed to get quiz status: ' + statusResponse.data.message);
    }

    console.log('✓ Quiz status verified:');
    console.log('Quiz completed:', statusResponse.data.data.quizCompleted);
    console.log('User level:', statusResponse.data.data.level);
    console.log('Quiz score:', statusResponse.data.data.quizScore);

    // Step 6: Check quiz history
    console.log('\n6. Checking quiz history...');
    const historyResponse = await axios.get(
      `${BASE_URL}/api/quiz/history`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!historyResponse.data.success) {
      throw new Error('Failed to get quiz history: ' + historyResponse.data.message);
    }

    console.log('✓ Quiz history retrieved:');
    console.log('Total quiz attempts:', historyResponse.data.data.quizzes.length);
    if (historyResponse.data.data.quizzes.length > 0) {
      const latestQuiz = historyResponse.data.data.quizzes[0];
      console.log('Latest quiz:', {
        score: latestQuiz.score,
        totalQuestions: latestQuiz.totalQuestions,
        level: latestQuiz.assignedLevel,
        completedAt: latestQuiz.completedAt
      });
    }

    console.log('\n=== Quiz Submission Test PASSED ===');
    return true;

  } catch (error) {
    console.error('\n=== Quiz Submission Test FAILED ===');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run the test
if (require.main === module) {
  testQuizSubmission()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = testQuizSubmission; 