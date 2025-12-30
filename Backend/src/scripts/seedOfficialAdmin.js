import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/userModel.js';

dotenv.config();

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return String(value).trim();
};

const run = async () => {
  const mongoUri = requireEnv('MONGO_URI');
  const email = requireEnv('OFFICIAL_ADMIN_EMAIL');
  const password = requireEnv('OFFICIAL_ADMIN_PASSWORD');

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
  });

  const normalizedEmail = email.toLowerCase();

  const makeUsernameFromEmail = (value) => {
    const localPart = String(value).split('@')[0] || 'official';
    const sanitized = localPart
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '');
    const base = sanitized.length >= 3 ? sanitized : `official_${sanitized || 'user'}`;
    return base.slice(0, 30);
  };

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await User.findOne({ email: normalizedEmail }).select('_id email role username');

  if (existing) {
    await User.updateOne(
      { _id: existing._id },
      {
        $set: {
          password: passwordHash,
          role: 'official',
          officialDetails: { designation: 'team-lead' },
          isActive: true,
        },
      }
    );
  } else {
    const baseUsername = makeUsernameFromEmail(normalizedEmail);
    let created = null;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const suffix = attempt === 0 ? '' : `_${attempt}`;
      const candidate = `${baseUsername.slice(0, 30 - suffix.length)}${suffix}`;

      try {
        created = await User.create({
          username: candidate,
          email: normalizedEmail,
          password: passwordHash,
          role: 'official',
          officialDetails: { designation: 'team-lead' },
          isActive: true,
        });
        break;
      } catch (err) {
        const isDup = err && (err.code === 11000 || err.code === 11001);
        const dupUsername = isDup && (err.keyPattern?.username || err.keyValue?.username);
        if (dupUsername) continue;
        throw err;
      }
    }

    if (!created) {
      throw new Error('Could not generate a unique username for the official admin');
    }
  }

  const user = await User.findOne({ email: normalizedEmail }).select('email role username');

  // IMPORTANT: never print password
  console.log(`✅ Official admin ready: ${user.email} (role=${user.role}, username=${user.username})`);
  console.log('ℹ️ Ensure backend env OFFICIAL_ADMIN_EMAIL is set to this email to enable admin permissions.');

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('❌ Seed failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
