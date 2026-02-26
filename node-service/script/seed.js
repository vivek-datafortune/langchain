/**
 * Seed script: creates dummy data with correct relations and inserts into DB.
 *
 * Rules:
 * - 1 country → 2 states → max 4 cities → 1 clinic
 * - 30 users (all linked to that clinic; city_id/state_id/country_id random from created)
 * - 70 tests (user_id from users, clinic_id = the one clinic, location IDs from created)
 *
 * Does not touch: Conversation, Product, Ticket.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import Country from '../src/models/Country.js';
import State from '../src/models/State.js';
import City from '../src/models/City.js';
import Clinic from '../src/models/Clinic.js';
import User from '../src/models/User.js';
import Test from '../src/models/Test.js';

const GENDERS = ['male', 'female', 'other'];
const USER_TYPE = 'patient'; // all seeded users are patients
const TEST_TYPES = ['HBA1C', 'CBC', 'LIPID', 'RFT', 'LFT'];
const HBA1C_RESULTS = ['Normal', 'Prediabetes', 'Diabetes'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
  return String(Math.floor(1000000000 + Math.random() * 9000000000));
}

function randomDob() {
  const year = 1950 + Math.floor(Math.random() * 50);
  const month = Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  return new Date(year, month, day);
}

async function run() {
  await connectDB();

  // Delete in reverse dependency order (only models we seed)
  console.log('Clearing existing seed data...');
  await Test.deleteMany({});
  await User.deleteMany({});
  await Clinic.deleteMany({});
  await City.deleteMany({});
  await State.deleteMany({});
  await Country.deleteMany({});

  // 1 country
  const country = await Country.create({
    code: 'IN',
    name: 'India',
    is_active: true,
    is_deleted: false,
  });
  console.log('Created 1 country:', country.name);

  // 2 states
  const states = await State.insertMany([
    { code: 'MH', name: 'Maharashtra', country_name: country.name, country_id: country._id, is_active: true, is_deleted: false },
    { code: 'KA', name: 'Karnataka', country_name: country.name, country_id: country._id, is_active: true, is_deleted: false },
  ]);
  console.log('Created 2 states');

  // 4 cities (2 per state)
  const cities = await City.insertMany([
    { code: 'MUM', name: 'Mumbai', state_name: states[0].name, country_name: country.name, state_id: states[0]._id, country_id: country._id, is_active: true },
    { code: 'PUN', name: 'Pune', state_name: states[0].name, country_name: country.name, state_id: states[0]._id, country_id: country._id, is_active: true },
    { code: 'BLR', name: 'Bengaluru', state_name: states[1].name, country_name: country.name, state_id: states[1]._id, country_id: country._id, is_active: true },
    { code: 'MYS', name: 'Mysuru', state_name: states[1].name, country_name: country.name, state_id: states[1]._id, country_id: country._id, is_active: true },
  ]);
  console.log('Created 4 cities');

  // 1 clinic (use first city/state/country)
  const clinic = await Clinic.create({
    name: 'MediVoice Central Clinic',
    email: 'contact@medivoice-clinic.com',
    phone_number: '9876543210',
    city_id: cities[0]._id,
    state_id: states[0]._id,
    country_id: country._id,
    is_verified: true,
    is_test_account: false,
    is_active: true,
    clinic_id: '10001',
  });
  console.log('Created 1 clinic:', clinic.name);

  // 30 users — all with same clinic_id; city_id/state_id/country_id random from created
  const phoneSet = new Set();
  const users = [];
  const firstNames = ['Aarav', 'Ananya', 'Vikram', 'Priya', 'Rahul', 'Sneha', 'Arjun', 'Kavya', 'Rohan', 'Diya', 'Aditya', 'Isha', 'Karan', 'Neha', 'Vivek', 'Pooja', 'Suresh', 'Lakshmi', 'Raj', 'Meera', 'Amit', 'Shruti', 'Sanjay', 'Anjali', 'Deepak', 'Kiran', 'Manoj', 'Rekha', 'Nitin', 'Sunita'];
  const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Nair', 'Iyer', 'Gupta', 'Mehta', 'Joshi', 'Desai', 'Rao', 'Pillai', 'Nayak', 'Malhotra', 'Verma', 'Shah', 'Kapoor', 'Agarwal', 'Dubey'];

  for (let i = 0; i < 30; i++) {
    let phone = randomPhone();
    while (phoneSet.has(phone)) phone = randomPhone();
    phoneSet.add(phone);

    const city = pick(cities);
    const state = states.find((s) => s._id.equals(city.state_id));
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    const gender = pick(GENDERS);

    users.push({
      phone,
      name,
      gender,
      dob: randomDob(),
      user_type: USER_TYPE,
      email: `${name.toLowerCase().replace(/\s/g, '.')}.${Date.now()}${i}@example.com`,
      clinic_id: clinic._id,
      city_id: city._id,
      state_id: state._id,
      country_id: country._id,
    });
  }
  const createdUsers = await User.insertMany(users);
  console.log('Created 30 users');

  // 70 tests — user_id from created users; clinic_id = clinic; city/state/country random from created
  const tests = [];
  for (let i = 0; i < 70; i++) {
    const user = pick(createdUsers);
    const city = pick(cities);
    const state = states.find((s) => s._id.equals(city.state_id));

    tests.push({
      user_id: user._id,
      clinic_id: clinic._id,
      city_id: city._id,
      state_id: state._id,
      country_id: country._id,
      user_data: {
        name: user.name,
        email: user.email,
        gender: user.gender,
        mobile: user.phone,
      },
      clinic_data: { name: clinic.name },
      test_type: pick(TEST_TYPES),
      hba1c: (4 + Math.random() * 6).toFixed(1),
      hba1c_result: pick(HBA1C_RESULTS),
      is_active: true,
      is_deleted: false,
    });
  }
  await Test.insertMany(tests);
  console.log('Created 70 tests');

  console.log('Seed completed successfully.');
  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
