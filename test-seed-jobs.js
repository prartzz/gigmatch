// Test data seeding script
// Run this in browser console to create test jobs in Firestore

import { db } from './js/firebase-config.js';
import { collection, addDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js';

const testJobs = [
    {
        title: "Website Design & Development",
        description: "Looking for experienced web developer to create a responsive website with modern design. Project includes frontend development, backend integration, and deployment.",
        category: "IT",
        hourlyRate: 500,
        location: "Bangalore",
        duration: "one-week",
        requiredSkills: ["HTML", "CSS", "React", "JavaScript"],
        status: "active",
        employerName: "Tech Startup India",
        employerId: "test-employer-1",
        applicationsCount: 0,
        views: 0
    },
    {
        title: "Mobile App Development",
        description: "We need a React Native mobile app developed for iOS and Android. The app should include user authentication, database integration, and third-party API integration.",
        category: "IT",
        hourlyRate: 750,
        location: "Mumbai",
        duration: "few-days",
        requiredSkills: ["React Native", "JavaScript", "Firebase"],
        status: "active",
        employerName: "Mobile Solutions Inc",
        employerId: "test-employer-2",
        applicationsCount: 0,
        views: 0
    },
    {
        title: "Office Cleaning Service",
        description: "Daily office cleaning required for a 5000 sq ft corporate office. Need experienced cleaning professionals who can work during evening hours after office closes.",
        category: "Cleaning",
        hourlyRate: 150,
        location: "Pune",
        duration: "ongoing",
        requiredSkills: ["Cleaning", "Organization", "Time Management"],
        status: "active",
        employerName: "Corporate Facilities",
        employerId: "test-employer-3",
        applicationsCount: 0,
        views: 0
    },
    {
        title: "Home Interior Painting",
        description: "Need professional painters for 3-bedroom house interior painting. Need expertise in wall preparation, paint selection, and finishing. Timeline: 1 week.",
        category: "Construction",
        hourlyRate: 300,
        location: "Delhi",
        duration: "one-week",
        requiredSkills: ["Painting", "Interior Design", "Color Selection"],
        status: "active",
        employerName: "Home Renovation Express",
        employerId: "test-employer-4",
        applicationsCount: 0,
        views: 0
    },
    {
        title: "Content Writing - Tech Blog",
        description: "Looking for experienced content writers to write technical blog posts about web development, AI, and cloud computing. 4-5 articles per week. Must have technical background.",
        category: "Writing",
        hourlyRate: 400,
        location: "Remote",
        duration: "ongoing",
        requiredSkills: ["Writing", "SEO", "Technical Knowledge"],
        status: "active",
        employerName: "Tech Media Hub",
        employerId: "test-employer-5",
        applicationsCount: 0,
        views: 0
    }
];

async function seedJobs() {
    console.log('🌱 Starting to seed test jobs...');
    
    try {
        for (const job of testJobs) {
            const jobWithTimestamp = {
                ...job,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };
            
            const docRef = await addDoc(collection(db, 'jobs'), jobWithTimestamp);
            console.log(`✅ Created job: "${job.title}" (ID: ${docRef.id})`);
        }
        
        console.log('✨ All test jobs created successfully!');
        console.log('Now go to http://localhost:8000/jobs-discover.html to see the jobs');
        return true;
    } catch (error) {
        console.error('❌ Error seeding jobs:', error);
        return false;
    }
}

// Export for use
window.seedTestJobs = seedJobs;

// Run it
seedJobs();
