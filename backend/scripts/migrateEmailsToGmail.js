import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const emailMapping = {
  // 14 Students
  'arjun.mehta@student.edu': 'arjun1234@gmail.com',
  'riya.sen@student.edu': 'riya1234@gmail.com',
  'varun.chawla@student.edu': 'varun1234@gmail.com',
  'sneha.iyer@student.edu': 'snehaiyer1234@gmail.com',
  'kunal.verma@student.edu': 'kunal1234@gmail.com',
  'ananya.ghosh@student.edu': 'ananyaghosh1234@gmail.com',
  'harsh.patil@student.edu': 'harsh1234@gmail.com',
  'pooja.hegde@student.edu': 'poojahegde1234@gmail.com',
  'devendra.singh@student.edu': 'devendra1234@gmail.com',
  'meera.krishnan@student.edu': 'meera1234@gmail.com',
  'abhishek.nair@student.edu': 'abhishek1234@gmail.com',
  'simran.kaur@student.edu': 'simran1234@gmail.com',
  'yash.trivedi@student.edu': 'yash1234@gmail.com',
  'aarav_1790928120312@student.edu': 'aarav1234@gmail.com',

  // 13 Mentors
  'priya.sharma@alumni.edu': 'priya1234@gmail.com',
  'rahul.verma@alumni.edu': 'rahul1234@gmail.com',
  'ananya.patel@alumni.edu': 'ananyapatel1234@gmail.com',
  'vikram.rao@alumni.edu': 'vikram1234@gmail.com',
  'sneha.kulkarni@alumni.edu': 'snehakulkarni1234@gmail.com',
  'aditya.joshi@alumni.edu': 'aditya1234@gmail.com',
  'neha.sundaram@alumni.edu': 'neha1234@gmail.com',
  'rohan.deshmukh@alumni.edu': 'rohan1234@gmail.com',
  'pooja.nambiar@alumni.edu': 'poojanambiar1234@gmail.com',
  'karan.kapoor@alumni.edu': 'karan1234@gmail.com',
  'divya.nair@alumni.edu': 'divya1234@gmail.com',
  'manish.tiwari@alumni.edu': 'manishtiwari1234@gmail.com',
  'tanvi.sengupta@alumni.edu': 'tanvi1234@gmail.com',
};

async function migrate() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!');

  let updatedCount = 0;
  for (const [oldEmail, newEmail] of Object.entries(emailMapping)) {
    const user = await User.findOne({ email: oldEmail.toLowerCase() });
    if (user) {
      user.email = newEmail.toLowerCase();
      await user.save();
      console.log(`✓ Updated [${user.role}] ${user.name}: ${oldEmail} -> ${newEmail}`);
      updatedCount++;
    } else {
      console.log(`- Not found (already updated or non-existent): ${oldEmail}`);
    }
  }

  console.log(`\nMigration completed: ${updatedCount} users updated.`);

  const remainingEdu = await User.countDocuments({ email: { $regex: /edu$/i } });
  console.log(`Remaining .edu emails in users collection: ${remainingEdu}`);

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
