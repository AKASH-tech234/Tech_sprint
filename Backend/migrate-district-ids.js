// Migration script to fix existing issues without districtId
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Issue from './src/models/Issue.js';
import readline from 'readline';

dotenv.config();

// Helper function to generate districtId
const generateDistrictId = (state, district) => {
  if (!state || !district) return null;

  const stateSlug = state
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const districtSlug = district
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return `${stateSlug}__${districtSlug}`;
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function migrateIssues() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find issues without districtId
    const issuesWithoutDistrict = await Issue.find({
      $or: [
        { districtId: { $exists: false } },
        { districtId: null },
        { districtId: '' }
      ]
    });

    console.log(`Found ${issuesWithoutDistrict.length} issues without districtId\n`);

    if (issuesWithoutDistrict.length === 0) {
      console.log('✅ All issues have districtId. No migration needed.');
      rl.close();
      await mongoose.disconnect();
      return;
    }

    // Show sample issues
    console.log('Sample issues to be updated:');
    issuesWithoutDistrict.slice(0, 5).forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.title}`);
      console.log(`   Location: ${issue.location?.address || 'N/A'}`);
      console.log(`   State: ${issue.location?.state || 'NOT SET'}`);
      console.log(`   District: ${issue.location?.district || 'NOT SET'}`);
      console.log('');
    });

    console.log('\n⚠️  This script will:');
    console.log('1. Set a default districtId for issues missing state/district');
    console.log('2. Generate proper districtId for issues with state/district');
    console.log('\nDefault values for issues without state/district:');
    console.log('- State: "Your State"');
    console.log('- District: "Your City"');
    console.log('- DistrictId: "your-state__your-city"');

    const answer = await question('\nDo you want to proceed? (yes/no): ');

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Migration cancelled');
      rl.close();
      await mongoose.disconnect();
      return;
    }

    console.log('\n🔄 Starting migration...\n');

    let updated = 0;
    let failed = 0;

    for (const issue of issuesWithoutDistrict) {
      try {
        let state = issue.location?.state;
        let district = issue.location?.district;

        // Set defaults if missing
        if (!state) {
          state = 'Your State';
          issue.location.state = state;
        }
        if (!district) {
          district = 'Your City';
          issue.location.district = district;
        }

        // Generate districtId
        const districtId = generateDistrictId(state, district);
        
        if (districtId) {
          issue.districtId = districtId;
          await issue.save();
          updated++;
          console.log(`✅ Updated: ${issue.title} -> ${districtId}`);
        } else {
          failed++;
          console.log(`❌ Failed to generate districtId for: ${issue.title}`);
        }
      } catch (error) {
        failed++;
        console.error(`❌ Error updating issue ${issue._id}:`, error.message);
      }
    }

    console.log('\n=== MIGRATION COMPLETE ===');
    console.log(`✅ Successfully updated: ${updated} issues`);
    console.log(`❌ Failed: ${failed} issues`);
    console.log(`Total processed: ${issuesWithoutDistrict.length} issues`);

    rl.close();
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

migrateIssues();
