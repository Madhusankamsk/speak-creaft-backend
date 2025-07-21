const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Admin = require('../src/models/Admin');
require('dotenv').config();

const categories = [
  {
    name: 'Grammar',
    description: 'English grammar rules and concepts',
    color: '#3B82F6',
    icon: 'fas fa-language'
  },
  {
    name: 'Vocabulary',
    description: 'English vocabulary and word meanings',
    color: '#10B981',
    icon: 'fas fa-book'
  },
  {
    name: 'Pronunciation',
    description: 'English pronunciation and phonetics',
    color: '#F59E0B',
    icon: 'fas fa-volume-up'
  },
  {
    name: 'Conversation',
    description: 'Everyday conversation and communication',
    color: '#8B5CF6',
    icon: 'fas fa-comments'
  }
];

async function setupCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/speakcraft');
    console.log('Connected to MongoDB');

    // Find or create admin
    let admin = await Admin.findOne({ email: 'admin@speakcraft.com' });
    if (!admin) {
      console.log('Creating admin account...');
      admin = new Admin({
        name: 'Admin',
        email: 'admin@speakcraft.com',
        password: 'admin123',
        role: 'admin',
        permissions: ['all']
      });
      await admin.save();
      console.log('Admin created with ID:', admin._id);
    } else {
      console.log('Admin found with ID:', admin._id);
    }

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Create new categories with admin ID
    const categoriesWithAdmin = categories.map(cat => ({
      ...cat,
      createdBy: admin._id
    }));

    const createdCategories = await Category.insertMany(categoriesWithAdmin);
    console.log('Created categories:');
    createdCategories.forEach(cat => {
      console.log(`- ${cat.name}: ${cat._id}`);
    });

    console.log('Categories setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up categories:', error);
    process.exit(1);
  }
}

setupCategories(); 