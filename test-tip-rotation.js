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

async function testTipRotation() {
  try {
    console.log('Testing tip rotation fix...\n');
    
    // Get a test user
    const user = await User.findOne({ isActive: true });
    if (!user) {
      console.log('No active user found for testing');
      return;
    }
    
    console.log(`Testing with user: ${user.email} (ID: ${user._id})`);
    
    // Get all tips for user's level
    const allTips = await Tip.find({
      level: user.level,
      isActive: true
    });
    
    console.log(`Total tips available for level ${user.level}: ${allTips.length}`);
    
    // Get unlocked tips
    const unlockedTipIds = await UserTipInteraction.find({
      userId: user._id,
      isUnlocked: true
    }).distinct('tipId');
    
    console.log(`Tips already unlocked: ${unlockedTipIds.length}`);
    
    // Get recent daily unlocks (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentDailyUnlocks = await DailyUnlock.find({
      userId: user._id,
      date: { $gte: sevenDaysAgo }
    }).populate('unlockedTips.tipId');
    
    console.log(`Daily unlocks in last 7 days: ${recentDailyUnlocks.length}`);
    
    // Collect recently shown tip IDs
    const recentlyShownTipIds = new Set();
    recentDailyUnlocks.forEach(dailyUnlock => {
      dailyUnlock.unlockedTips.forEach(unlockInfo => {
        if (unlockInfo.tipId && unlockInfo.tipId._id) {
          recentlyShownTipIds.add(unlockInfo.tipId._id.toString());
        }
      });
    });
    
    console.log(`Tips shown in last 7 days: ${recentlyShownTipIds.size}`);
    
    // Get tip usage statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyUnlocks30Days = await DailyUnlock.find({
      userId: user._id,
      date: { $gte: thirtyDaysAgo }
    }).populate('unlockedTips.tipId');
    
    const tipUsage = {};
    dailyUnlocks30Days.forEach(dailyUnlock => {
      dailyUnlock.unlockedTips.forEach(unlockInfo => {
        if (unlockInfo.tipId && unlockInfo.tipId._id) {
          const tipId = unlockInfo.tipId._id.toString();
          tipUsage[tipId] = (tipUsage[tipId] || 0) + 1;
        }
      });
    });
    
    console.log(`Tips used in last 30 days: ${Object.keys(tipUsage).length}`);
    
    // Show most frequently used tips
    const sortedUsage = Object.entries(tipUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    console.log('\nMost frequently used tips in last 30 days:');
    for (const [tipId, count] of sortedUsage) {
      const tip = allTips.find(t => t._id.toString() === tipId);
      console.log(`  - ${tip ? tip.title : 'Unknown tip'} (${count} times)`);
    }
    
    // Test the new selection logic
    let availableTips = allTips.filter(tip => 
      !unlockedTipIds.includes(tip._id)
    );
    
    if (availableTips.length < 3) {
      const nonRecentTips = allTips.filter(tip => 
        !recentlyShownTipIds.has(tip._id.toString())
      );
      
      if (nonRecentTips.length >= 3) {
        availableTips = nonRecentTips;
        console.log(`\n✅ Using ${nonRecentTips.length} non-recent tips (avoiding repetition)`);
      } else {
        const priorityTips = allTips.filter(tip => 
          !recentlyShownTipIds.has(tip._id.toString())
        );
        const otherTips = allTips.filter(tip => 
          recentlyShownTipIds.has(tip._id.toString())
        );
        
        availableTips = [...priorityTips, ...otherTips];
        console.log(`\n⚠️  Using ${priorityTips.length} priority tips + ${otherTips.length} other tips`);
      }
      
      // Sort by usage frequency
      availableTips.sort((a, b) => {
        const aUsage = tipUsage[a._id.toString()] || 0;
        const bUsage = tipUsage[b._id.toString()] || 0;
        return aUsage - bUsage;
      });
    }
    
    console.log(`\nFinal available tips for selection: ${availableTips.length}`);
    
    if (availableTips.length >= 3) {
      const selectedTips = availableTips.slice(0, 3);
      console.log('\nSelected tips would be:');
      selectedTips.forEach((tip, index) => {
        const usage = tipUsage[tip._id.toString()] || 0;
        const isRecent = recentlyShownTipIds.has(tip._id.toString());
        console.log(`  ${index + 1}. ${tip.title} (used ${usage} times${isRecent ? ', shown recently' : ''})`);
      });
    } else {
      console.log('\n❌ Not enough tips available for selection');
    }
    
  } catch (error) {
    console.error('Error testing tip rotation:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the test
testTipRotation();
