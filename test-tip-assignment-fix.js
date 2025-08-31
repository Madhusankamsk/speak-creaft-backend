const mongoose = require('mongoose');
const DailyUnlock = require('./src/models/DailyUnlock');
const UserTipInteraction = require('./src/models/UserTipInteraction');
const Tip = require('./src/models/Tip');
const User = require('./src/models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function runTipAssignmentTest(user, allTips) {
  // Get unlocked tips
  const unlockedTipIds = await UserTipInteraction.find({
    userId: user._id,
    isUnlocked: true
  }).distinct('tipId');
  
  console.log(`Tips already unlocked: ${unlockedTipIds.length}`);
  
  // Get tips that have been assigned to this user in any daily unlock
  const assignedTipIds = await DailyUnlock.find({
    userId: user._id
  }).distinct('unlockedTips.tipId');
  
  console.log(`Tips already assigned in daily unlocks: ${assignedTipIds.length}`);
  
  // Check for duplicates (tips that are both unlocked and assigned)
  const unlockedSet = new Set(unlockedTipIds.map(id => id.toString()));
  const assignedSet = new Set(assignedTipIds.map(id => id.toString()));
  const duplicates = [];
  
  for (const tipId of unlockedSet) {
    if (assignedSet.has(tipId)) {
      duplicates.push(tipId);
    }
  }
  
  console.log(`Duplicate tips (both unlocked and assigned): ${duplicates.length}`);
  
  if (duplicates.length > 0) {
    console.log('\n⚠️  Found duplicate tips:');
    for (const tipId of duplicates) {
      const tip = allTips.find(t => t._id.toString() === tipId);
      console.log(`  - ${tip ? tip.title : 'Unknown tip'} (ID: ${tipId})`);
    }
  }
  
  // Test the new exclusion logic
  const excludedTipIds = new Set([
    ...unlockedTipIds.map(id => id.toString()),
    ...assignedTipIds.map(id => id.toString())
  ]);
  
  const availableTips = allTips.filter(tip => 
    !excludedTipIds.has(tip._id.toString())
  );
  
  console.log(`\nAvailable tips after exclusion: ${availableTips.length}`);
  
  // Check if we have enough tips
  if (availableTips.length >= 3) {
    console.log('✅ Sufficient tips available for daily assignment');
  } else {
    console.log(`⚠️  Only ${availableTips.length} tips available, will need fallback logic`);
    
    // Test fallback logic
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentDailyUnlocks = await DailyUnlock.find({
      userId: user._id,
      date: { $gte: sevenDaysAgo }
    }).populate('unlockedTips.tipId');
    
    const recentlyShownTipIds = new Set();
    recentDailyUnlocks.forEach(dailyUnlock => {
      dailyUnlock.unlockedTips.forEach(unlockInfo => {
        if (unlockInfo.tipId && unlockInfo.tipId._id) {
          recentlyShownTipIds.add(unlockInfo.tipId._id.toString());
        }
      });
    });
    
    const nonRecentAssignedTips = allTips.filter(tip => 
      assignedTipIds.some(id => id.toString() === tip._id.toString()) &&
      !recentlyShownTipIds.has(tip._id.toString())
    );
    
    const recentAssignedTips = allTips.filter(tip => 
      assignedTipIds.some(id => id.toString() === tip._id.toString()) &&
      recentlyShownTipIds.has(tip._id.toString())
    );
    
    const fallbackTips = [
      ...availableTips,
      ...nonRecentAssignedTips,
      ...recentAssignedTips
    ];
    
    console.log(`Fallback tips available: ${fallbackTips.length}`);
    console.log(`  - Fresh tips: ${availableTips.length}`);
    console.log(`  - Non-recent assigned: ${nonRecentAssignedTips.length}`);
    console.log(`  - Recent assigned: ${recentAssignedTips.length}`);
  }
  
  // Test creating a new daily unlock
  console.log('\n--- Testing Daily Unlock Creation ---');
  
  // Simulate the createDailyUnlock logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if there's already a daily unlock for today
  const existingDailyUnlock = await DailyUnlock.findOne({
    userId: user._id,
    date: today
  });
  
  if (existingDailyUnlock) {
    console.log('Daily unlock already exists for today');
    console.log(`Tips assigned today: ${existingDailyUnlock.unlockedTips.length}`);
    
    // Check if any of today's tips were already assigned before
    const todayTipIds = existingDailyUnlock.unlockedTips.map(ut => ut.tipId.toString());
    const previouslyAssigned = todayTipIds.filter(tipId => 
      assignedTipIds.some(id => id.toString() === tipId)
    );
    
    console.log(`Tips assigned today that were previously assigned: ${previouslyAssigned.length}`);
    
    if (previouslyAssigned.length > 0) {
      console.log('⚠️  Found tips assigned today that were previously assigned:');
      for (const tipId of previouslyAssigned) {
        const tip = allTips.find(t => t._id.toString() === tipId);
        console.log(`  - ${tip ? tip.title : 'Unknown tip'} (ID: ${tipId})`);
      }
    } else {
      console.log('✅ All tips assigned today are fresh (not previously assigned)');
    }
  } else {
    console.log('No daily unlock for today - would create new one');
  }
}

async function testTipAssignmentFix() {
  try {
    console.log('Testing tip assignment fix...\n');
    
    // Check database state first
    const totalTips = await Tip.countDocuments();
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const quizCompletedUsers = await User.countDocuments({ quizCompleted: true });
    
    console.log('Database Overview:');
    console.log(`- Total tips: ${totalTips}`);
    console.log(`- Total users: ${totalUsers}`);
    console.log(`- Active users: ${activeUsers}`);
    console.log(`- Users with completed quiz: ${quizCompletedUsers}`);
    
    // Check tip levels
    const tipLevels = await Tip.distinct('level');
    console.log(`- Tip levels available: ${tipLevels.join(', ') || 'None'}`);
    
    // Get a test user with completed quiz
    const user = await User.findOne({ isActive: true, quizCompleted: true });
    if (!user) {
      console.log('\nNo active user with completed quiz found for testing');
      console.log('Looking for any user with completed quiz...');
      
      const anyQuizCompletedUser = await User.findOne({ quizCompleted: true });
      if (anyQuizCompletedUser) {
        console.log(`Found user with completed quiz: ${anyQuizCompletedUser.email} (ID: ${anyQuizCompletedUser._id})`);
        console.log(`- User level: ${anyQuizCompletedUser.level || 'Not set'}`);
        console.log(`- Quiz completed: ${anyQuizCompletedUser.quizCompleted}`);
        console.log(`- User active: ${anyQuizCompletedUser.isActive}`);
        
        if (!anyQuizCompletedUser.level) {
          console.log('\n⚠️  User has completed quiz but level is not set. This is a data issue.');
          return;
        }
        
        // Use this user for testing
        const allTips = await Tip.find({
          level: anyQuizCompletedUser.level,
          isActive: true
        });
        
        console.log(`\nTotal tips available for level ${anyQuizCompletedUser.level}: ${allTips.length}`);
        
        if (allTips.length === 0) {
          console.log('\n⚠️  No tips found for this user level. Please check if tips exist for this level.');
          return;
        }
        
        // Continue with the rest of the test using this user
        await runTipAssignmentTest(anyQuizCompletedUser, allTips);
      } else {
        console.log('\nNo users with completed quiz found. Please complete a quiz first.');
      }
      return;
    }
    
    console.log(`\nTesting with user: ${user.email} (ID: ${user._id})`);
    console.log(`- User level: ${user.level || 'Not set'}`);
    console.log(`- Quiz completed: ${user.quizCompleted}`);
    console.log(`- User active: ${user.isActive}`);
    
    if (!user.level) {
      console.log('\n⚠️  User level is not set. This should be set after quiz completion.');
      return;
    }
    
    // Get all tips for user's level
    const allTips = await Tip.find({
      level: user.level,
      isActive: true
    });
    
    console.log(`\nTotal tips available for level ${user.level}: ${allTips.length}`);
    
    if (allTips.length === 0) {
      console.log('\n⚠️  No tips found for this user level. Please check if tips exist for this level.');
      return;
    }
    
    // Continue with the rest of the test
    await runTipAssignmentTest(user, allTips);
    
  } catch (error) {
    console.error('Error testing tip assignment fix:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the test
testTipAssignmentFix();
