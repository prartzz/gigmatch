#!/usr/bin/env node

/**
 * GigMatch Job Seeding Script
 * Run: node seed-jobs-direct.js
 * 
 * Creates test employer users and 30+ diverse jobs instantly
 */

const fs = require('fs');
const path = require('path');

// Import Firebase modules
const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} = require('firebase/auth');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  Timestamp,
  query,
  where
} = require('firebase/firestore');

// Firebase config (from firebase-config.js)
const firebaseConfig = {
  apiKey: "AIzaSyCHC3ijBT9lw4scf5KJ3BR3gszYVndPcD8",
  authDomain: "gigmatch-20012026.firebaseapp.com",
  projectId: "gigmatch-20012026",
  storageBucket: "gigmatch-20012026.firebasestorage.app",
  messagingSenderId: "323639386049",
  appId: "1:323639386049:web:8eb5bcc9a1889595cc9940",
  measurementId: "G-9PSF9C9FPF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test Employer Data
const testEmployers = [
  {
    email: 'techstartup@gigmatch.test',
    password: 'TechStartup123@',
    name: 'Tech Startup India',
    userType: 'employer'
  },
  {
    email: 'mobilesolutions@gigmatch.test',
    password: 'Mobile123@',
    name: 'Mobile Solutions Inc',
    userType: 'employer'
  },
  {
    email: 'designstudio@gigmatch.test',
    password: 'Design123@',
    name: 'Creative Design Studio',
    userType: 'employer'
  },
  {
    email: 'contentmedia@gigmatch.test',
    password: 'Content123@',
    name: 'Content Media Hub',
    userType: 'employer'
  },
  {
    email: 'homerenoexp@gigmatch.test',
    password: 'Home123@',
    name: 'Home Renovation Express',
    userType: 'employer'
  },
  {
    email: 'corporatefacilities@gigmatch.test',
    password: 'Corporate123@',
    name: 'Corporate Facilities Mgmt',
    userType: 'employer'
  }
];

const jobTemplates = [
  // Development & Coding Jobs
  {
    title: 'React.js Web Application Development',
    description: 'Build a responsive React web app with modern UI/UX. Need experience with hooks, state management, and REST APIs. Project duration: 2 weeks.',
    category: 'coding',
    hourlyRate: 750,
    location: 'Bangalore',
    duration: 'one-week',
    requiredSkills: ['React', 'JavaScript', 'CSS', 'REST APIs'],
    employerIndex: 0
  },
  {
    title: 'Full-Stack Node.js Backend Development',
    description: 'Create scalable REST APIs using Node.js and Express. Database design with MongoDB. Must have experience with async/await and microservices.',
    category: 'coding',
    hourlyRate: 800,
    location: 'Bangalore',
    duration: 'one-week',
    requiredSkills: ['Node.js', 'Express', 'MongoDB', 'REST APIs'],
    employerIndex: 0
  },
  {
    title: 'React Native Mobile App - iOS/Android',
    description: 'Develop cross-platform mobile app with React Native. Need Firebase integration and push notifications. Must deliver quality app with 95%+ test coverage.',
    category: 'coding',
    hourlyRate: 900,
    location: 'Bangalore',
    duration: 'few-days',
    requiredSkills: ['React Native', 'JavaScript', 'Firebase', 'Redux'],
    employerIndex: 1
  },
  {
    title: 'Python Django Web Application',
    description: 'Build Django web app with PostgreSQL database. Need ORM expertise and admin panel customization. Perfect for e-commerce or SaaS project.',
    category: 'coding',
    hourlyRate: 650,
    location: 'Remote',
    duration: 'one-week',
    requiredSkills: ['Django', 'Python', 'PostgreSQL', 'REST APIs'],
    employerIndex: 1
  },
  {
    title: 'WordPress Plugin Development',
    description: 'Create custom WordPress plugins for e-commerce functionality. Need PHP expertise and WooCommerce knowledge. Will require ongoing support.',
    category: 'coding',
    hourlyRate: 500,
    location: 'Remote',
    duration: 'few-days',
    requiredSkills: ['PHP', 'WordPress', 'WooCommerce', 'JavaScript'],
    employerIndex: 1
  },
  {
    title: 'Vue.js Dashboard Development',
    description: 'Build admin dashboard with Vue.js 3 and Vuetify. Real-time data visualization with charts. Need experience with Vuex for state management.',
    category: 'coding',
    hourlyRate: 700,
    location: 'Remote',
    duration: 'few-days',
    requiredSkills: ['Vue.js', 'JavaScript', 'Chart.js', 'CSS'],
    employerIndex: 0
  },
  // Design Jobs
  {
    title: 'UI/UX Design for Mobile App',
    description: 'Design user interface for fintech mobile application. Need Figma expertise, user research understanding, and prototyping skills. Deliverables: wireframes and high-fidelity designs.',
    category: 'design',
    hourlyRate: 600,
    location: 'Remote',
    duration: 'few-days',
    requiredSkills: ['Figma', 'UI Design', 'UX Design', 'Prototyping'],
    employerIndex: 2
  },
  {
    title: 'Website Redesign - E-Commerce Platform',
    description: 'Redesign existing e-commerce website for better user experience. Need conversion optimization expertise. Deliverables: Figma design file and design system documentation.',
    category: 'design',
    hourlyRate: 650,
    location: 'Remote',
    duration: 'one-week',
    requiredSkills: ['Figma', 'UX Design', 'E-commerce', 'Design Systems'],
    employerIndex: 2
  },
  {
    title: 'Logo & Brand Identity Design',
    description: 'Create complete brand identity for tech startup. Need logo design, color palette, typography guide, and brand guidelines. Will involve 3-4 revision rounds.',
    category: 'design',
    hourlyRate: 500,
    location: 'Remote',
    duration: 'few-days',
    requiredSkills: ['Adobe XD', 'Illustrator', 'Branding', 'Logo Design'],
    employerIndex: 2
  },
  {
    title: 'Motion Graphics & Animation',
    description: 'Create explainer video animation for SaaS product. Need After Effects expertise. Deliverable: 2-minute animated explainer video.',
    category: 'design',
    hourlyRate: 700,
    location: 'Remote',
    duration: 'one-week',
    requiredSkills: ['After Effects', 'Animation', 'Motion Design', 'Video'],
    employerIndex: 2
  },
  // Content Writing
  {
    title: 'Technical Blog Writing - AI & Machine Learning',
    description: 'Write 8-10 technical blog posts about machine learning, AI, and data science. Need strong technical background and SEO knowledge. 2000-2500 words per article.',
    category: 'content',
    hourlyRate: 450,
    location: 'Remote',
    duration: 'one-week',
    requiredSkills: ['Writing', 'Technical Writing', 'SEO', 'ML Knowledge'],
    employerIndex: 3
  },
  {
    title: 'Social Media Content Creation',
    description: 'Create 30 Instagram/Twitter/LinkedIn posts for tech company. Need copywriting skills and understanding of social media trends. Includes hashtag research.',
    category: 'content',
    hourlyRate: 300,
    location: 'Remote',
    duration: 'few-days',
    requiredSkills: ['Copywriting', 'Social Media', 'Content Marketing', 'Hashtags'],
    employerIndex: 3
  },
  {
    title: 'Product Documentation Writing',
    description: 'Write comprehensive API documentation and user guide for SaaS product. Need technical writing skills and Markdown/HTML knowledge. Will include code examples.',
    category: 'content',
    hourlyRate: 500,
    location: 'Remote',
    duration: 'one-week',
    requiredSkills: ['Technical Writing', 'API Documentation', 'Markdown', 'English'],
    employerIndex: 3
  },
  // Construction & Repair
  {
    title: 'Home Renovation & Interior Painting',
    description: 'Paint 3-bedroom house interior including wall preparation and finishing. Need 5+ years experience. Budget: ₹15,000-20,000. Timeline: 5 days.',
    category: 'construction',
    hourlyRate: 300,
    location: 'Delhi',
    duration: 'few-days',
    requiredSkills: ['Painting', 'Interior Design', 'Color Selection', 'Finishing'],
    employerIndex: 4
  },
  {
    title: 'Electrical Repair & Maintenance',
    description: 'Fix electrical issues in commercial building - wiring problems, outlet replacement, switchboard maintenance. Immediate requirement.',
    category: 'repair',
    hourlyRate: 400,
    location: 'Mumbai',
    duration: 'same-day',
    requiredSkills: ['Electrical Work', 'Troubleshooting', 'Safety', 'Maintenance'],
    employerIndex: 4
  },
  {
    title: 'Plumbing Installation & Repair',
    description: 'Install new bathroom fixtures and repair existing plumbing issues. Need experience with modern plumbing systems. 3-4 days work.',
    category: 'repair',
    hourlyRate: 350,
    location: 'Bangalore',
    duration: 'few-days',
    requiredSkills: ['Plumbing', 'Installation', 'Troubleshooting', 'Maintenance'],
    employerIndex: 4
  },
  // Cleaning & Maintenance
  {
    title: 'Office Cleaning - Daily Service',
    description: 'Daily office cleaning for 10,000 sq ft corporate space. Work after 6 PM. Need experienced team with janitorial equipment. Ongoing contract.',
    category: 'cleaning',
    hourlyRate: 200,
    location: 'Bangalore',
    duration: 'ongoing',
    requiredSkills: ['Cleaning', 'Organization', 'Time Management', 'Equipment'],
    employerIndex: 5
  },
  {
    title: 'Post-Construction Cleanup',
    description: 'Clean up after construction project - debris removal, dust cleaning, final polish. Need team of 4-5 people. 2 days work.',
    category: 'cleaning',
    hourlyRate: 250,
    location: 'Pune',
    duration: 'few-days',
    requiredSkills: ['Cleaning', 'Heavy Lifting', 'Safety', 'Attention to Detail'],
    employerIndex: 5
  },
  {
    title: 'Residential House Cleaning',
    description: 'Deep cleaning of 3-bedroom house - kitchen, bathrooms, living areas. One-time service. Budget: ₹5,000. Timeline: 1 day.',
    category: 'cleaning',
    hourlyRate: 180,
    location: 'Bangalore',
    duration: 'same-day',
    requiredSkills: ['Cleaning', 'Organization', 'Attention to Detail', 'Safety'],
    employerIndex: 5
  },
  // Tutoring & Education
  {
    title: 'Python Programming Tutor',
    description: 'Teach Python to beginner programmers. Need experience with teaching and creating learning materials. Online classes, 5 hours per week.',
    category: 'tutoring',
    hourlyRate: 400,
    location: 'Remote',
    duration: 'ongoing',
    requiredSkills: ['Python', 'Teaching', 'Communication', 'Problem Solving'],
    employerIndex: 0
  },
  {
    title: 'IELTS/English Preparation Coach',
    description: 'Provide IELTS preparation coaching for 2-3 students. Focus on speaking and writing. Online sessions.',
    category: 'tutoring',
    hourlyRate: 350,
    location: 'Remote',
    duration: 'ongoing',
    requiredSkills: ['English', 'IELTS', 'Teaching', 'Communication'],
    employerIndex: 3
  },
  // Additional variety
  {
    title: 'Data Entry & Virtual Assistant',
    description: 'Data entry for customer database - 500+ records from scanned documents. Need accuracy and attention to detail. Can work remotely.',
    category: 'content',
    hourlyRate: 150,
    location: 'Remote',
    duration: 'few-days',
    requiredSkills: ['Data Entry', 'Excel', 'Typing', 'Organization'],
    employerIndex: 3
  },
  {
    title: 'SEO Optimization & Google Analytics Setup',
    description: 'Optimize website for search engines - keyword research, on-page SEO, technical SEO. Setup Google Analytics and tracking.',
    category: 'content',
    hourlyRate: 500,
    location: 'Remote',
    duration: 'one-week',
    requiredSkills: ['SEO', 'Google Analytics', 'Keyword Research', 'HTML/CSS'],
    employerIndex: 3
  }
];

// Utility function for colored console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║  🌱 GigMatch Job Seeding Script 🌱    ║', 'cyan');
  log('╚════════════════════════════════════════╝\n', 'cyan');

  try {
    // Step 1: Create/Get employers
    log('📝 Step 1: Setting up employer accounts...', 'yellow');
    const employers = [];

    // Get all existing employers first
    const usersSnapshot = await getDocs(collection(db, 'users'));
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      if (user.userType === 'employer') {
        employers.push({ id: doc.id, name: user.fullName });
      }
    });

    log(`✓ Found ${employers.length} existing employer(s)`, 'green');

    // Try to create new employers
    for (const employer of testEmployers) {
      try {
        // Check if email already exists
        const userQuery = query(
          collection(db, 'users'),
          where('email', '==', employer.email)
        );
        const existingSnapshot = await getDocs(userQuery);

        if (existingSnapshot.empty) {
          // Create new user
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            employer.email,
            employer.password
          );
          const userId = userCredential.user.uid;

          // Add to users collection
          await addDoc(collection(db, 'users'), {
            uid: userId,
            email: employer.email,
            fullName: employer.name,
            userType: 'employer',
            role: 'user',
            createdAt: Timestamp.now()
          });

          employers.push({ id: userId, name: employer.name });
          log(`✓ Created employer: ${employer.name}`, 'green');
        } else {
          log(`⚠ Employer already exists: ${employer.name}`, 'yellow');
        }
      } catch (error) {
        log(`✗ Error with ${employer.name}: ${error.message}`, 'red');
      }
    }

    log(`\n✓ Total employers available: ${employers.length}\n`, 'green');

    // Step 2: Create jobs
    log('📋 Step 2: Creating jobs...', 'yellow');
    let jobsCreated = 0;
    let jobsFailed = 0;

    for (let i = 0; i < jobTemplates.length; i++) {
      const jobTemplate = jobTemplates[i];
      
      try {
        const employerIndex = jobTemplate.employerIndex % employers.length;
        const employer = employers[employerIndex];

        const jobData = {
          title: jobTemplate.title,
          description: jobTemplate.description,
          category: jobTemplate.category,
          hourlyRate: jobTemplate.hourlyRate,
          location: jobTemplate.location,
          duration: jobTemplate.duration,
          requiredSkills: jobTemplate.requiredSkills,
          status: 'active',
          employer: employer.id,
          employerName: employer.name,
          applicationsCount: 0,
          views: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        await addDoc(collection(db, 'jobs'), jobData);
        jobsCreated++;

        // Progress indicator
        if ((i + 1) % 5 === 0) {
          log(`✓ Created ${i + 1}/${jobTemplates.length} jobs...`, 'green');
        }
      } catch (error) {
        log(`✗ Error creating job "${jobTemplate.title}": ${error.message}`, 'red');
        jobsFailed++;
      }
    }

    // Step 3: Summary
    log('\n╔════════════════════════════════════════╗', 'cyan');
    log('║        🎉 SEEDING COMPLETE! 🎉        ║', 'cyan');
    log('╚════════════════════════════════════════╝\n', 'cyan');

    log(`✓ Jobs Created: ${jobsCreated}/${jobTemplates.length}`, 'green');
    log(`✗ Jobs Failed: ${jobsFailed}`, jobsFailed > 0 ? 'red' : 'green');
    log(`✓ Employers: ${employers.length}`, 'green');

    log('\n📊 Jobs by Category:', 'yellow');
    const byCategory = {};
    jobTemplates.forEach(job => {
      byCategory[job.category] = (byCategory[job.category] || 0) + 1;
    });
    Object.entries(byCategory).forEach(([cat, count]) => {
      log(`   • ${cat}: ${count} jobs`, 'cyan');
    });

    log('\n🔗 Next Steps:', 'yellow');
    log('1. Open http://localhost:8000/jobs-discover.html', 'cyan');
    log('2. Try filtering by category, location, rate, duration', 'cyan');
    log('3. Browse and apply for jobs', 'cyan');

    log('\n✅ Demo data ready for your presentation!\n', 'green');

  } catch (error) {
    log(`\n✗ Fatal Error: ${error.message}\n`, 'red');
    console.error(error);
  }
}

// Run the script
main().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
