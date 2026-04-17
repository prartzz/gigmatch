import { auth, db, waitForFirebase, collection, addDoc, Timestamp, query, where, getDocs } from './firebase-config.js';

let selectedSkills = [];

console.log('[JobPost] Script loaded');

// Add skill to the list
window.addSkill = function() {
    const skillInput = document.getElementById('skillInput');
    const skill = skillInput.value.trim();

    console.log('[JobPost] Add skill called with:', skill);

    if (!skill) {
        console.warn('[JobPost] Skill input is empty');
        alert('Please enter a skill');
        return;
    }

    if (selectedSkills.includes(skill)) {
        console.warn('[JobPost] Skill already added:', skill);
        alert('This skill is already added');
        return;
    }

    selectedSkills.push(skill);
    skillInput.value = '';
    console.log('[JobPost] Skill added. Total skills:', selectedSkills.length);
    renderSkills();
};

// Render skills tags
function renderSkills() {
    const skillsContainer = document.getElementById('skillsTags');
    skillsContainer.innerHTML = selectedSkills.map(skill => `
        <div class="skill-tag">
            ${skill}
            <button type="button" onclick="removeSkill('${skill}')">×</button>
        </div>
    `).join('');
}

// Remove skill
window.removeSkill = function(skill) {
    console.log('[JobPost] Removing skill:', skill);
    selectedSkills = selectedSkills.filter(s => s !== skill);
    console.log('[JobPost] Skills after removal:', selectedSkills.length);
    renderSkills();
};

// Handle Enter key in skill input
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[JobPost] DOM loaded - waiting for Firebase');
    
    await waitForFirebase();
    console.log('[JobPost] Firebase ready');
    
    // Check if user is logged in
    if (!auth.currentUser) {
        console.error('[JobPost] No user logged in, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('[JobPost] User authenticated:', auth.currentUser.email);
    console.log('[JobPost] Setting up event listeners');

    const skillInput = document.getElementById('skillInput');
    if (skillInput) {
        skillInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.addSkill();
            }
        });
        console.log('[JobPost] Skill input listener added');
    }

    // Handle form submission
    const jobPostForm = document.getElementById('jobPostForm');
    if (jobPostForm) {
        console.log('[JobPost] Form found, adding submit listener');
        jobPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('[JobPost] Form submitted');
            await submitJobPost();
        });
    } else {
        console.error('[JobPost] ❌ Job post form not found in DOM!');
    }
});

async function submitJobPost() {
    const messageContainer = document.getElementById('messageContainer');
    const jobPostForm = document.getElementById('jobPostForm');

    try {
        console.log('[JobPost] Submit started');

        // Clear previous messages
        messageContainer.innerHTML = '';

        // Check authentication
        if (!auth.currentUser) {
            console.error('[JobPost] User not authenticated');
            showMessage('❌ You must be logged in to post a job', 'error');
            window.location.href = 'login.html';
            return;
        }

        console.log('[JobPost] User authenticated:', auth.currentUser.uid);

        // Validate skills
        if (selectedSkills.length === 0) {
            console.log('[JobPost] No skills added');
            showMessage('Please add at least one required skill', 'error');
            return;
        }

        // Show loading
        const submitBtn = jobPostForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';

        // Get form data
        const jobTitle = document.getElementById('jobTitle').value.trim();
        const jobDescription = document.getElementById('jobDescription').value.trim();
        const hourlyRateStr = document.getElementById('hourlyRate').value;
        const location = document.getElementById('location').value.trim();
        const category = document.getElementById('category').value;
        const duration = document.getElementById('duration').value;

        console.log('[JobPost] Form data collected:', { jobTitle, location, category, duration });

        // Validate all required fields
        if (!jobTitle) {
            showMessage('Please enter a job title', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        if (jobTitle.length < 5) {
            showMessage('Job title must be at least 5 characters', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        if (!jobDescription) {
            showMessage('Please enter a job description', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        if (jobDescription.length < 20) {
            showMessage('Job description must be at least 20 characters', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        if (!hourlyRateStr) {
            showMessage('Please enter an hourly rate', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        const hourlyRate = parseInt(hourlyRateStr);
        if (isNaN(hourlyRate) || hourlyRate < 100) {
            showMessage('Hourly rate must be at least ₹100', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        if (!location) {
            showMessage('Please enter a location', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        if (!category) {
            showMessage('Please select a category', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        if (!duration) {
            showMessage('Please select a duration', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        // Build job data
        const jobData = {
            title: jobTitle,
            description: jobDescription,
            hourlyRate: hourlyRate,
            location: location,
            category: category,
            duration: duration,
            requiredSkills: selectedSkills,
            employer: auth.currentUser.uid,
            employerName: auth.currentUser.displayName || 'Employer',
            createdAt: Timestamp.now(),
            status: 'active',
            applicationsCount: 0,
            views: 0
        };

        console.log('[JobPost] Job data ready:', jobData);

        // Add to Firestore
        console.log('[JobPost] Firebase db object:', db ? 'EXISTS' : 'NULL');
        console.log('[JobPost] Attempting to add to Firestore...');
        
        const jobsCollection = collection(db, 'jobs');
        console.log('[JobPost] Jobs collection created:', jobsCollection ? 'OK' : 'FAILED');

        const docRef = await addDoc(jobsCollection, jobData);

        console.log('[JobPost] ✓✓✓ SUCCESS! Job saved to Firestore with ID:', docRef.id);
        console.log('[JobPost] Job permanently stored at: jobs/' + docRef.id);

        // Show success message
        showMessage('✅ Job posted successfully! Refreshing...', 'success');

        // Reset form after 1.5 seconds
        setTimeout(() => {
            jobPostForm.reset();
            selectedSkills = [];
            renderSkills();
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;

            // Redirect to jobs list after 2 seconds
            setTimeout(() => {
                console.log('[JobPost] Redirecting to jobs-list.html');
                window.location.href = 'jobs-list.html?posted=true';
            }, 2000);
        }, 1500);

    } catch (error) {
        console.error('[JobPost] ❌ Error posting job:', error);
        console.error('[JobPost] Error code:', error.code);
        console.error('[JobPost] Error message:', error.message);
        
        showMessage(`❌ Error: ${error.message}`, 'error');
        const submitBtn = jobPostForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post Job';
        }
    }
}

function showMessage(message, type) {
    console.log(`[JobPost] [${type.toUpperCase()}]`, message);
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
        console.error('[JobPost] MessageContainer not found!');
        alert(message);
        return;
    }
    const messageClass = type === 'error' ? 'error-message' : 'success-message';
    messageContainer.innerHTML = `<div class="${messageClass}">${message}</div>`;

    if (type === 'error') {
        messageContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}