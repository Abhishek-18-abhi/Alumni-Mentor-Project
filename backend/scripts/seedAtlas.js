import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Mentor from '../models/Mentor.js';
import Administrator from '../models/Administrator.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Meeting from '../models/Meeting.js';
import Goal from '../models/Goal.js';
import Feedback from '../models/Feedback.js';
import AuditLog from '../models/AuditLog.js';

const DEMO_PASSWORD = 'Password@123';

const mentorsData = [
  {
    name: 'Priya Sharma',
    email: 'priya1234@gmail.com',
    role: 'mentor',
    jobTitle: 'Senior Software Engineer',
    company: 'Google',
    experience: '5 years',
    domain: 'Cloud & Full Stack',
    college: 'Vivekanand College of BCA',
    course: 'BCA (Batch of 2019)',
    capacity: 4,
    currentMentees: 1,
    skills: ['React', 'Node.js', 'System Design', 'Cloud Computing', 'JavaScript', 'SQL'],
    interests: ['Web Development', 'Software Engineering', 'Cloud Computing'],
    goals: ['Technical skills', 'Interview preparation', 'Project guidance'],
    availability: ['Monday 17:00-20:00', 'Wednesday 17:00-20:00', 'Saturday 09:00-12:00'],
    languages: ['English', 'Hindi'],
    bio: 'BCA alumna working on distributed cloud systems at Google. Passionate about system design and full stack web architecture.',
  },
  {
    name: 'Rahul Verma',
    email: 'rahul1234@gmail.com',
    role: 'mentor',
    jobTitle: 'Lead Data Scientist',
    company: 'Microsoft',
    experience: '6 years',
    domain: 'AI / ML & Data Science',
    college: 'Vivekanand College of BCA',
    course: 'BCA (Batch of 2018)',
    capacity: 3,
    currentMentees: 1,
    skills: ['Python', 'Machine Learning', 'Data Science', 'SQL', 'Artificial Intelligence', 'Data Analytics'],
    interests: ['AI / ML', 'Data Science', 'Data Analytics'],
    goals: ['Technical skills', 'Career guidance', 'Industry knowledge'],
    availability: ['Tuesday 17:00-20:00', 'Thursday 17:00-20:00', 'Sunday 13:00-16:00'],
    languages: ['English', 'Hindi'],
    bio: 'Alumnus specialized in predictive AI and deep learning models. Guiding students in math foundations and machine learning roadmaps.',
  },
  {
    name: 'Ananya Patel',
    email: 'ananyapatel1234@gmail.com',
    role: 'mentor',
    jobTitle: 'Product Manager & UX Lead',
    company: 'Amazon',
    experience: '4 years',
    domain: 'UI/UX & Product Management',
    college: 'Vivekanand College of BCA',
    course: 'BCA (Batch of 2020)',
    capacity: 3,
    currentMentees: 0,
    skills: ['UI/UX', 'Project Management', 'Data Analytics', 'JavaScript', 'Business Intelligence'],
    interests: ['UI/UX', 'Project Management', 'Software Engineering'],
    goals: ['Career guidance', 'Leadership', 'Industry knowledge'],
    availability: ['Friday 17:00-20:00', 'Saturday 13:00-16:00'],
    languages: ['English', 'Hindi', 'Gujarati'],
    bio: 'Connecting user research with business strategy at Amazon. Mentoring students on UX design, agile development, and product mindset.',
  },
  {
    name: 'Vikramaditya Rao',
    email: 'vikram1234@gmail.com',
    role: 'mentor',
    jobTitle: 'Senior Cybersecurity Analyst',
    company: 'Cisco Systems',
    experience: '5 years',
    domain: 'Cybersecurity',
    college: 'Vivekanand College of BCA',
    course: 'BCA (Batch of 2019)',
    capacity: 3,
    currentMentees: 1,
    skills: ['Cybersecurity', 'Python', 'Cloud Computing', 'SQL', 'Software Engineering'],
    interests: ['Cybersecurity', 'Cloud Computing', 'Software Engineering'],
    goals: ['Technical skills', 'Industry knowledge', 'Interview preparation'],
    availability: ['Wednesday 17:00-20:00', 'Saturday 09:00-12:00', 'Sunday 09:00-12:00'],
    languages: ['English', 'Hindi', 'Kannada'],
    bio: 'Security engineer focusing on cloud vulnerability assessment and network defense. Helping juniors understand modern infosec roles.',
  },
  {
    name: 'Sneha Kulkarni',
    email: 'snehakulkarni1234@gmail.com',
    role: 'mentor',
    jobTitle: 'Senior Mobile Engineer',
    company: 'Zomato',
    experience: '3 years',
    domain: 'Mobile Development',
    college: 'Vivekanand College of BCA',
    course: 'BCA (Batch of 2021)',
    capacity: 4,
    currentMentees: 1,
    skills: ['Mobile Development', 'JavaScript', 'React', 'Java', 'UI/UX'],
    interests: ['Mobile Development', 'Web Development', 'UI/UX'],
    goals: ['Technical skills', 'Project guidance', 'Career guidance'],
    availability: ['Tuesday 17:00-20:00', 'Friday 17:00-20:00', 'Saturday 13:00-16:00'],
    languages: ['English', 'Hindi', 'Marathi'],
    bio: 'Mobile dev alumni building high-throughput consumer app interfaces. Mentoring in cross-platform mobile architecture and performance.',
  },
  {
    name: 'Aditya Joshi',
    email: 'aditya1234@gmail.com',
    role: 'mentor',
    jobTitle: 'Staff Backend Architect',
    company: 'Swiggy',
    experience: '7 years',
    domain: 'Software Engineering',
    college: 'Vivekanand College of BCA',
    course: 'BCA (Batch of 2017)',
    capacity: 4,
    currentMentees: 1,
    skills: ['Java', 'Node.js', 'SQL', 'PostgreSQL', 'Cloud Computing', 'AWS'],
    interests: ['Software Engineering', 'Cloud Computing', 'Web Development'],
    goals: ['Technical skills', 'Interview preparation', 'Leadership'],
    availability: ['Monday 17:00-20:00', 'Thursday 17:00-20:00', 'Saturday 09:00-12:00'],
    languages: ['English', 'Hindi'],
    bio: 'Senior architect handling large scale transactional microservices. Passionate about concurrent Java systems and low-latency APIs.',
  },
  {
    name: 'Neha Sundaram',
    email: 'neha1234@gmail.com',
    role: 'mentor',
    jobTitle: 'Senior BI Consultant',
    company: 'Deloitte',
    experience: '4 years',
    domain: 'Business Intelligence',
    college: 'Vivekanand College of BCA',
    course: 'BCA (Batch of 2020)',
    capacity: 3,
    currentMentees: 1,
    skills: ['Power BI', 'SQL', 'Excel', 'Data Analytics', 'Business Intelligence', 'Python'],
    interests: ['Data Analytics', 'Business Intelligence', 'Data Science'],
    goals: ['Career guidance', 'Interview preparation', 'Industry knowledge'],
    availability: ['Thursday 17:00-20:00', 'Friday 17:00-20:00', 'Sunday 13:00-16:00'],
    languages: ['English', 'Hindi', 'Tamil'],
    bio: 'Consultant helping enterprises build data warehousing and executive BI dashboards. Guiding students in Power BI, SQL, and business storytelling.',
  },
  {
    name: 'Rohan Deshmukh',
    email: 'rohan1234@gmail.com',
    role: 'mentor',
    jobTitle: 'Lead Frontend Engineer',
    company: 'Adobe',
    experience: '5 years',
    domain: 'Web Development',
    college: 'Vivekanand College of BCA',
    course: 'BCA (Batch of 2019)',
    capacity: 3,
    currentMentees: 0,
    skills: ['JavaScript', 'React', 'UI/UX', 'Node.js', 'Software Engineering'],
    interests: ['Web Development', 'UI/UX', 'Software Engineering'],
    goals: ['Technical skills', 'Project guidance', 'Interview preparation'],
    availability: ['Monday 17:00-20:00', 'Wednesday 17:00-20:00', 'Friday 17:00-20:00'],
    languages: ['English', 'Hindi', 'Marathi'],
    bio: 'UI engineer creating accessible design systems and reactive frontend architectures. Passionate about Web standards, CSS, and modern React.',
  },
  {
    name: 'Pooja Nambiar',
    email: 'poojanambiar1234@gmail.com',
    role: 'mentor',
    jobTitle: 'Senior Database Architect',
    company: 'Oracle',
    experience: '6 years',
    domain: 'Software Engineering',
    college: 'Vivekanand College of BCA',
    course: 'BCA (Batch of 2018)',
    capacity: 3,
    currentMentees: 1,
    skills: ['SQL', 'PostgreSQL', 'MySQL', 'Cloud Computing', 'AWS', 'Python'],
    interests: ['Software Engineering', 'Cloud Computing', 'Data Analytics'],
    goals: ['Technical skills', 'Industry knowledge', 'Project guidance'],
    availability: ['Tuesday 17:00-20:00', 'Saturday 09:00-12:00'],
    languages: ['English', 'Hindi', 'Malayalam'],
    bio: 'Database specialist focusing on distributed SQL clusters, query optimization, and transaction recovery.',
  },
  {
    name: 'Karan Kapoor',
    email: 'karan1234@gmail.com',
    role: 'mentor',
    jobTitle: 'Lead DevOps & SRE',
    company: 'Flipkart',
    experience: '6 years',
    domain: 'Cloud Computing',
    college: 'Vivekanand College of BCA',
    course: 'BCA (Batch of 2018)',
    capacity: 4,
    currentMentees: 1,
    skills: ['AWS', 'Cloud Computing', 'Python', 'Software Engineering', 'Cybersecurity'],
    interests: ['Cloud Computing', 'Software Engineering', 'Cybersecurity'],
    goals: ['Technical skills', 'Career guidance', 'Interview preparation'],
    availability: ['Wednesday 17:00-20:00', 'Saturday 13:00-16:00', 'Sunday 17:00-20:00'],
    languages: ['English', 'Hindi', 'Punjabi'],
    bio: 'Site Reliability Engineer managing high-availability Kubernetes and AWS infrastructure during massive scale e-commerce flash sales.',
  },
  {
    name: 'Divya Nair',
    email: 'divya1234@gmail.com',
    role: 'mentor',
    jobTitle: 'AI Solutions Specialist',
    company: 'TCS Digital',
    experience: '3 years',
    domain: 'AI / ML',
    college: 'Vivekanand College of BCA',
    course: 'BCA (Batch of 2021)',
    capacity: 3,
    currentMentees: 1,
    skills: ['Python', 'Machine Learning', 'Artificial Intelligence', 'Data Science', 'SQL'],
    interests: ['AI / ML', 'Data Science', 'Data Analytics'],
    goals: ['Project guidance', 'Technical skills', 'Higher studies'],
    availability: ['Monday 17:00-20:00', 'Wednesday 17:00-20:00', 'Saturday 09:00-12:00'],
    languages: ['English', 'Hindi', 'Malayalam'],
    bio: 'Applied AI researcher helping students implement NLP capstone projects and prepare applications for MCA/M.Tech programs.',
  },
  {
    name: 'Manish Tiwari',
    email: 'manishtiwari1234@gmail.com',
    role: 'mentor',
    jobTitle: 'Engineering Manager',
    company: 'Paytm',
    experience: '8 years',
    domain: 'Project Management',
    college: 'Vivekanand College of BCA',
    course: 'BCA (Batch of 2016)',
    capacity: 5,
    currentMentees: 1,
    skills: ['Project Management', 'Software Engineering', 'Java', 'SQL', 'Leadership'],
    interests: ['Project Management', 'Software Engineering', 'Business Intelligence'],
    goals: ['Leadership', 'Career guidance', 'Networking'],
    availability: ['Saturday 13:00-16:00', 'Sunday 09:00-12:00'],
    languages: ['English', 'Hindi'],
    bio: 'Alumnus with 8+ years leading cross-functional engineering pods in fintech. Happy to mentor juniors on career growth and technical management.',
  },
  {
    name: 'Tanvi Sengupta',
    email: 'tanvi1234@gmail.com',
    role: 'mentor',
    jobTitle: 'Full Stack Python Developer',
    company: 'Infosys',
    experience: '2 years',
    domain: 'Web Development',
    college: 'Vivekanand College of BCA',
    course: 'BCA (Batch of 2022)',
    capacity: 4,
    currentMentees: 1,
    skills: ['Python', 'Django', 'JavaScript', 'React', 'SQL', 'PostgreSQL'],
    interests: ['Web Development', 'Software Engineering', 'Open Source'],
    goals: ['Interview preparation', 'Project guidance', 'Career guidance'],
    availability: ['Tuesday 17:00-20:00', 'Thursday 17:00-20:00', 'Saturday 13:00-16:00'],
    languages: ['English', 'Hindi', 'Bengali'],
    bio: 'Recent BCA alumna working on enterprise web apps with Django and React. Specializes in campus recruitment training and capstone project reviews.',
  },
];

const studentsData = [
  {
    name: 'Arjun Mehta',
    email: 'arjun1234@gmail.com',
    role: 'student',
    college: 'Vivekanand College of BCA',
    course: 'BCA',
    year: '3rd Year',
    skills: ['React', 'JavaScript', 'Node.js', 'Python', 'SQL'],
    interests: ['Web Development', 'Software Engineering'],
    goals: ['Technical skills', 'Interview preparation', 'Project guidance'],
    availability: ['Monday 17:00-20:00', 'Wednesday 17:00-20:00', 'Saturday 09:00-12:00'],
    languages: ['English', 'Hindi'],
    bio: 'Final-year BCA student passionate about full stack JavaScript development and building production-ready web capstone applications.',
  },
  {
    name: 'Riya Sen',
    email: 'riya1234@gmail.com',
    role: 'student',
    college: 'Vivekanand College of BCA',
    course: 'BCA',
    year: '3rd Year',
    skills: ['Python', 'Data Science', 'Machine Learning', 'SQL', 'Data Analytics'],
    interests: ['AI / ML', 'Data Science', 'Data Analytics'],
    goals: ['Technical skills', 'Interview preparation', 'Industry knowledge'],
    availability: ['Tuesday 17:00-20:00', 'Thursday 17:00-20:00', 'Sunday 13:00-16:00'],
    languages: ['English', 'Hindi', 'Bengali'],
    bio: 'Aspiring data scientist eager to master deep learning pipelines and real-world analytics workflows.',
  },
  {
    name: 'Varun Chawla',
    email: 'varun1234@gmail.com',
    role: 'student',
    college: 'Vivekanand College of BCA',
    course: 'BCA',
    year: '3rd Year',
    skills: ['AWS', 'Cloud Computing', 'Python', 'SQL', 'Software Engineering'],
    interests: ['Cloud Computing', 'Software Engineering'],
    goals: ['Technical skills', 'Interview preparation', 'Project guidance'],
    availability: ['Wednesday 17:00-20:00', 'Saturday 13:00-16:00', 'Sunday 17:00-20:00'],
    languages: ['English', 'Hindi', 'Punjabi'],
    bio: 'Cloud architecture enthusiast learning containerization, serverless architectures, and AWS best practices.',
  },
  {
    name: 'Sneha Iyer',
    email: 'snehaiyer1234@gmail.com',
    role: 'student',
    college: 'Vivekanand College of BCA',
    course: 'BCA',
    year: '2nd Year',
    skills: ['UI/UX', 'JavaScript', 'React', 'Excel'],
    interests: ['UI/UX', 'Web Development'],
    goals: ['Project guidance', 'Career guidance', 'Technical skills'],
    availability: ['Friday 17:00-20:00', 'Saturday 13:00-16:00'],
    languages: ['English', 'Hindi', 'Tamil'],
    bio: 'Second-year student blending Figma wireframing with React components to build intuitive user interfaces.',
  },
  {
    name: 'Kunal Verma',
    email: 'kunal1234@gmail.com',
    role: 'student',
    college: 'Vivekanand College of BCA',
    course: 'BCA',
    year: '3rd Year',
    skills: ['Cybersecurity', 'Python', 'SQL', 'Cloud Computing'],
    interests: ['Cybersecurity', 'Software Engineering'],
    goals: ['Technical skills', 'Interview preparation', 'Industry knowledge'],
    availability: ['Wednesday 17:00-20:00', 'Saturday 09:00-12:00'],
    languages: ['English', 'Hindi'],
    bio: 'Final-year student studying network packet analysis, security auditing, and web vulnerability mitigation.',
  },
  {
    name: 'Ananya Ghosh',
    email: 'ananyaghosh1234@gmail.com',
    role: 'student',
    college: 'Vivekanand College of BCA',
    course: 'BCA',
    year: '2nd Year',
    skills: ['Mobile Development', 'JavaScript', 'React', 'Java'],
    interests: ['Mobile Development', 'Web Development'],
    goals: ['Project guidance', 'Technical skills', 'Career guidance'],
    availability: ['Tuesday 17:00-20:00', 'Friday 17:00-20:00', 'Saturday 13:00-16:00'],
    languages: ['English', 'Hindi', 'Bengali'],
    bio: 'Building responsive cross-platform mobile apps. Seeking alumni guidance on mobile architecture and offline caching.',
  },
  {
    name: 'Harshvardhan Patil',
    email: 'harsh1234@gmail.com',
    role: 'student',
    college: 'Vivekanand College of BCA',
    course: 'BCA',
    year: '3rd Year',
    skills: ['Java', 'SQL', 'MySQL', 'PostgreSQL', 'Software Engineering'],
    interests: ['Software Engineering', 'Web Development'],
    goals: ['Technical skills', 'Interview preparation', 'Project guidance'],
    availability: ['Monday 17:00-20:00', 'Thursday 17:00-20:00', 'Saturday 09:00-12:00'],
    languages: ['English', 'Hindi', 'Marathi'],
    bio: 'Focused on enterprise Java, Spring Boot, and relational database optimization for campus placement drives.',
  },
  {
    name: 'Pooja Hegde',
    email: 'poojahegde1234@gmail.com',
    role: 'student',
    college: 'Vivekanand College of BCA',
    course: 'BCA',
    year: '2nd Year',
    skills: ['Power BI', 'SQL', 'Excel', 'Data Analytics', 'Business Intelligence'],
    interests: ['Data Analytics', 'Business Intelligence'],
    goals: ['Career guidance', 'Interview preparation', 'Industry knowledge'],
    availability: ['Thursday 17:00-20:00', 'Friday 17:00-20:00', 'Sunday 13:00-16:00'],
    languages: ['English', 'Hindi', 'Kannada'],
    bio: 'Learning Business Intelligence dashboard design, data modeling, and automated reporting in Power BI.',
  },
  {
    name: 'Devendra Singh',
    email: 'devendra1234@gmail.com',
    role: 'student',
    college: 'Vivekanand College of BCA',
    course: 'BCA',
    year: '1st Year',
    skills: ['Python', 'SQL', 'JavaScript'],
    interests: ['Software Engineering', 'Web Development'],
    goals: ['Career guidance', 'Technical skills', 'Networking'],
    availability: ['Tuesday 17:00-20:00', 'Thursday 17:00-20:00', 'Saturday 13:00-16:00'],
    languages: ['English', 'Hindi'],
    bio: 'First-year BCA student building a foundation in programming logic, algorithms, and open source development.',
  },
  {
    name: 'Meera Krishnan',
    email: 'meera1234@gmail.com',
    role: 'student',
    college: 'Vivekanand College of BCA',
    course: 'BCA',
    year: '3rd Year',
    skills: ['Python', 'Machine Learning', 'Artificial Intelligence', 'Data Science'],
    interests: ['AI / ML', 'Data Science'],
    goals: ['Higher studies', 'Project guidance', 'Career guidance'],
    availability: ['Monday 17:00-20:00', 'Wednesday 17:00-20:00', 'Saturday 09:00-12:00'],
    languages: ['English', 'Hindi', 'Malayalam'],
    bio: 'Preparing for MCA entrance examinations and completing research in computer vision and natural language processing.',
  },
  {
    name: 'Abhishek Nair',
    email: 'abhishek1234@gmail.com',
    role: 'student',
    college: 'Vivekanand College of BCA',
    course: 'BCA',
    year: '3rd Year',
    skills: ['SQL', 'PostgreSQL', 'MySQL', 'Python', 'AWS'],
    interests: ['Software Engineering', 'Cloud Computing'],
    goals: ['Technical skills', 'Project guidance', 'Interview preparation'],
    availability: ['Tuesday 17:00-20:00', 'Saturday 09:00-12:00'],
    languages: ['English', 'Hindi', 'Malayalam'],
    bio: 'Interested in database internal engines, query indexing, and scalable cloud database administration.',
  },
  {
    name: 'Simran Kaur',
    email: 'simran1234@gmail.com',
    role: 'student',
    college: 'Vivekanand College of BCA',
    course: 'BCA',
    year: '2nd Year',
    skills: ['Python', 'Django', 'SQL', 'JavaScript', 'React'],
    interests: ['Web Development', 'Software Engineering'],
    goals: ['Interview preparation', 'Project guidance', 'Career guidance'],
    availability: ['Tuesday 17:00-20:00', 'Thursday 17:00-20:00', 'Saturday 13:00-16:00'],
    languages: ['English', 'Hindi', 'Punjabi'],
    bio: 'Developing Python web apps with Django and REST APIs. Looking for code review and best practice guidance.',
  },
  {
    name: 'Yash Trivedi',
    email: 'yash1234@gmail.com',
    role: 'student',
    college: 'Vivekanand College of BCA',
    course: 'BCA',
    year: '3rd Year',
    skills: ['Project Management', 'UI/UX', 'SQL', 'Business Intelligence', 'Software Engineering'],
    interests: ['Project Management', 'UI/UX', 'Business Intelligence'],
    goals: ['Leadership', 'Career guidance', 'Industry knowledge'],
    availability: ['Friday 17:00-20:00', 'Saturday 13:00-16:00', 'Sunday 09:00-12:00'],
    languages: ['English', 'Hindi', 'Gujarati'],
    bio: 'Aspiring Technical Product Manager focused on feature roadmapping, agile team sprints, and tech communication.',
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await connectDB();
    console.log('Connected! Generating password hashes...');

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    // 1. Ensure administrator exists
    const adminEmail = 'admin@college.edu';
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Dr. K. Sharma',
        email: adminEmail,
        passwordHash,
        role: 'admin',
        isActive: true,
      });
      await Administrator.create({
        userId: adminUser._id,
        college: 'Vivekanand College of BCA',
        department: 'BCA Department',
        adminType: 'admin',
      });
      console.log(`[Created] Administrator: ${adminUser.name} (${adminUser.email})`);
    } else {
      console.log(`[Found] Administrator: ${adminUser.name} (${adminUser.email})`);
    }

    const mentorUserMap = new Map();
    const studentUserMap = new Map();

    // 2. Seed 13 Mentors
    console.log('\n--- Seeding 13 Alumni Mentors ---');
    for (const m of mentorsData) {
      let u = await User.findOne({ email: m.email });
      if (!u) {
        u = await User.create({
          name: m.name,
          email: m.email,
          passwordHash,
          role: 'mentor',
          isActive: true,
          settings: { profileVisible: true, notifications: true },
        });
      } else {
        u.name = m.name;
        u.passwordHash = passwordHash;
        u.isActive = true;
        await u.save();
      }

      await Mentor.findOneAndUpdate(
        { userId: u._id },
        {
          userId: u._id,
          jobTitle: m.jobTitle,
          company: m.company,
          experience: m.experience,
          domain: m.domain,
          college: m.college,
          course: m.course,
          capacity: m.capacity,
          currentMentees: m.currentMentees,
          skills: m.skills,
          interests: m.interests,
          goals: m.goals,
          availability: m.availability,
          languages: m.languages,
          bio: m.bio,
          profileComplete: true,
        },
        { upsert: true, new: true }
      );
      mentorUserMap.set(m.email, u);
      console.log(`✓ [Mentor] ${m.name.padEnd(20)} | ${m.company.padEnd(14)} | ${m.email}`);
    }

    // 3. Seed 13 Students
    console.log('\n--- Seeding 13 BCA Students ---');
    for (const s of studentsData) {
      let u = await User.findOne({ email: s.email });
      if (!u) {
        u = await User.create({
          name: s.name,
          email: s.email,
          passwordHash,
          role: 'student',
          isActive: true,
          settings: { profileVisible: true, notifications: true },
        });
      } else {
        u.name = s.name;
        u.passwordHash = passwordHash;
        u.isActive = true;
        await u.save();
      }

      await Student.findOneAndUpdate(
        { userId: u._id },
        {
          userId: u._id,
          college: s.college,
          course: s.course,
          year: s.year,
          skills: s.skills,
          interests: s.interests,
          goals: s.goals,
          languages: s.languages,
          availability: s.availability,
          bio: s.bio,
          profileComplete: true,
        },
        { upsert: true, new: true }
      );
      studentUserMap.set(s.email, u);
      console.log(`✓ [Student] ${s.name.padEnd(20)} | ${s.year.padEnd(10)} | ${s.email}`);
    }

    // 4. Seed realistic mentorship interactions (requests, meetings, goals, feedback)
    console.log('\n--- Seeding Mentorship Activity ---');
    const arjun = studentUserMap.get('arjun1234@gmail.com');
    const priya = mentorUserMap.get('priya1234@gmail.com');

    const riya = studentUserMap.get('riya1234@gmail.com');
    const rahul = mentorUserMap.get('rahul1234@gmail.com');

    const varun = studentUserMap.get('varun1234@gmail.com');
    const karan = mentorUserMap.get('karan1234@gmail.com');

    const snehaI = studentUserMap.get('snehaiyer1234@gmail.com');
    const ananyaP = mentorUserMap.get('ananyapatel1234@gmail.com');

    const kunal = studentUserMap.get('kunal1234@gmail.com');
    const vikram = mentorUserMap.get('vikram1234@gmail.com');

    // Mentorship Requests
    const pairConfigs = [
      {
        student: arjun,
        mentor: priya,
        status: 'accepted',
        score: 88,
        msg: "Hello Priya ma'am, I am aiming for SDE roles in cloud web architecture. Would love your guidance on System Design and project reviews.",
      },
      {
        student: riya,
        mentor: rahul,
        status: 'accepted',
        score: 92,
        msg: 'Dear Rahul sir, I am eager to specialize in Machine Learning and would be grateful for your mentorship on deep learning pipelines.',
      },
      {
        student: varun,
        mentor: karan,
        status: 'accepted',
        score: 90,
        msg: 'Hi Karan sir, I am working with AWS and CI/CD. Would love your mentorship on SRE best practices.',
      },
      {
        student: snehaI,
        mentor: ananyaP,
        status: 'pending',
        score: 85,
        msg: 'Hello Ananya ma\'am, I am interested in UX Design and product thinking. Looking forward to connecting!',
      },
      {
        student: kunal,
        mentor: vikram,
        status: 'accepted',
        score: 86,
        msg: 'Dear Vikram sir, I am preparing for cybersecurity roles and would appreciate your advice on security certifications and networking.',
      },
    ];

    const seededRequests = [];
    for (const p of pairConfigs) {
      if (!p.student || !p.mentor) continue;
      let req = await MentorshipRequest.findOne({ studentId: p.student._id, mentorId: p.mentor._id });
      if (!req) {
        req = await MentorshipRequest.create({
          studentId: p.student._id,
          mentorId: p.mentor._id,
          message: p.msg,
          status: p.status,
          matchSnapshot: {
            score: p.score,
            algorithmVersion: 'v1-weighted-overlap',
            computedAt: new Date(Date.now() - 10 * 86400000),
            factors: [
              { name: 'skills', rawScore: p.score, weight: 0.45, contribution: Math.round(p.score * 0.45), matchedItems: ['Skills Overlap'], explanation: 'Strong technical skill match.' },
              { name: 'interests', rawScore: 80, weight: 0.2, contribution: 16, matchedItems: ['Domain'], explanation: 'Shared domain interest.' },
            ],
          },
          respondedAt: p.status === 'accepted' ? new Date(Date.now() - 8 * 86400000) : null,
        });
      }
      seededRequests.push(req);
    }
    console.log(`✓ Seeded ${seededRequests.length} Mentorship Requests`);

    // Meetings
    const sampleMeetings = [
      {
        mentorId: priya._id,
        studentId: arjun._id,
        date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        time: '18:00',
        mode: 'Google Meet',
        log: 'Discuss Capstone System Design and database sharding strategy.',
        status: 'scheduled',
      },
      {
        mentorId: rahul._id,
        studentId: riya._id,
        date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        time: '17:00',
        mode: 'Zoom',
        log: 'Review PyTorch classification baseline and dataset augmentation.',
        status: 'scheduled',
      },
      {
        mentorId: karan._id,
        studentId: varun._id,
        date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
        time: '19:00',
        mode: 'Google Meet',
        log: 'AWS CloudFormation template walkthrough and IAM policy hardening.',
        status: 'completed',
      },
    ];

    for (const m of sampleMeetings) {
      const exists = await Meeting.findOne({ mentorId: m.mentorId, studentId: m.studentId, date: m.date });
      if (!exists) {
        await Meeting.create(m);
      }
    }
    console.log(`✓ Seeded ${sampleMeetings.length} Scheduled & Completed Meetings`);

    // Goals
    const sampleGoals = [
      { studentId: arjun._id, createdBy: arjun._id, title: 'Complete Full Stack Capstone Architecture Document', target: 'End of Semester', progress: 85, status: 'active' },
      { studentId: arjun._id, createdBy: arjun._id, title: 'Solve Top 50 LeetCode DSA Patterns in Python/JS', target: 'Placement Season', progress: 65, status: 'active' },
      { studentId: riya._id, createdBy: riya._id, title: 'Train PyTorch Sentiment Analysis Model on Custom Dataset', target: 'Week 4', progress: 70, status: 'active' },
      { studentId: varun._id, createdBy: varun._id, title: 'Provision AWS ECS Cluster via Terraform', target: 'Next Month', progress: 50, status: 'active' },
    ];

    for (const g of sampleGoals) {
      const exists = await Goal.findOne({ studentId: g.studentId, title: g.title });
      if (!exists) {
        await Goal.create(g);
      }
    }
    console.log(`✓ Seeded ${sampleGoals.length} Mentorship Goals`);

    // Feedback
    if (seededRequests[0]) {
      const fbExists = await Feedback.findOne({ requestId: seededRequests[0]._id });
      if (!fbExists) {
        await Feedback.create({
          fromUserId: arjun._id,
          toUserId: priya._id,
          requestId: seededRequests[0]._id,
          rating: 5,
          text: "Priya ma'am gave structured feedback on my project architecture and mock interview tips. Extremely helpful!",
        });
        console.log('✓ Seeded Verified Feedback review');
      }
    }

    // Audit Log
    await AuditLog.create({
      userId: adminUser._id,
      action: 'Seeded 26 Verified Users & Mentorship Data',
      resource: 'Database Atlas',
      status: 'Success',
    });

    console.log('\n======================================================');
    console.log('🎉 SUCCESS: All 26 Users & Mentorship Data Seeded to Atlas!');
    console.log(`🔑 Login Password for ALL 26 accounts: "${DEMO_PASSWORD}"`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed with error:', err);
    process.exit(1);
  }
}

seed();
