// Test script to check district data in database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Issue from './src/models/Issue.js';

dotenv.config();

async function checkDistrictData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get sample issues
    const issues = await Issue.find({}).limit(10).select('title districtId location createdAt');
    
    console.log('=== SAMPLE ISSUES FROM DATABASE ===\n');
    issues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.title}`);
      console.log(`   District ID: ${issue.districtId || 'NOT SET'}`);
      console.log(`   Location:`);
      console.log(`     - Address: ${issue.location?.address || 'N/A'}`);
      console.log(`     - City: ${issue.location?.city || 'N/A'}`);
      console.log(`     - State: ${issue.location?.state || 'N/A'}`);
      console.log(`     - District: ${issue.location?.district || 'NOT SET'}`);
      console.log(`     - Lat/Lng: ${issue.location?.lat}, ${issue.location?.lng}`);
      console.log(`   Created: ${issue.createdAt}`);
      console.log('');
    });

    // Count issues with and without districtId
    const withDistrict = await Issue.countDocuments({ districtId: { $exists: true, $ne: null } });
    const withoutDistrict = await Issue.countDocuments({ 
      $or: [
        { districtId: { $exists: false } },
        { districtId: null }
      ]
    });

    console.log('=== DISTRICT ID STATISTICS ===');
    console.log(`Issues WITH districtId: ${withDistrict}`);
    console.log(`Issues WITHOUT districtId: ${withoutDistrict}`);
    console.log(`Total issues: ${withDistrict + withoutDistrict}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDistrictData();
