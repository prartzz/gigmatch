import { auth, db, waitForFirebase, doc, getDoc, collection, addDoc, query, where, getDocs, Timestamp, updateDoc } from './firebase-config.js';

let currentJobId = null;
let currentJob = null;
let hasApplied = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await waitForFirebase();

    const params = new URLSearchParams(window.location.search);
    currentJobId = params.get('id');

    if (!currentJobId) {
        showError('Job not found');
        return;
    }

    loadJobDetails();
});

async function loadJobDetails() {
    try {
        const loadingContainer = document.getElementById('loadingContainer');
        const contentContainer = document.getElementById('jobDetailContent');

        loadingContainer.style.display = 'block';
        contentContainer.style.display = 'none';

        const jobRef = doc(db, 'jobs', currentJobId);
        const jobSnap = await getDoc(jobRef);

        if (!jobSnap.exists()) {
            showError('Job no longer available');
            return;
        }

        currentJob = jobSnap.data();
        currentJob.id = jobSnap.id;

        // Check if user already applied
        if (auth.currentUser) {
            const applicationsRef = collection(db, 'applications');
            const q = query(
                applicationsRef,
                where('jobId', '==', currentJobId),
                where('workerId', '==', auth.currentUser.uid)
            );
            const snapshot = await getDocs(q);
            hasApplied = !snapshot.empty;
        }

        renderJobDetails();
        loadingContainer.style.display = 'none';
        contentContainer.style.display = 'block';

    } catch (error) {
        console.error('Error loading job:', error);
        showError(`Error: ${error.message}`);
    }
}

function renderJobDetails() {
    if (!currentJob) return;

    // Title and category
    document.getElementById('jobTitle').textContent = currentJob.title;
    document.getElementById('jobCategory').textContent = currentJob.category;

    // Stats
    document.getElementById('jobRate').textContent = `₹${currentJob.hourlyRate}`;
    document.getElementById('jobDuration').textContent = formatDuration(currentJob.duration);
    document.getElementById('jobLocation').textContent = currentJob.location;
    document.getElementById('applicationCount').textContent = currentJob.applicationsCount || 0;

    // Description
    document.getElementById('jobDescription').textContent = currentJob.description;

    // Skills
    const skillsContainer = document.getElementById('skillsContainer');
    skillsContainer.innerHTML = currentJob.requiredSkills.map(skill => 
        `<div class="skill-badge">${escapeHtml(skill)}</div>`
    ).join('');

    // Meta information
    const metaContainer = document.getElementById('jobMeta');
    const createdDate = currentJob.createdAt?.toDate?.() || new Date();
    metaContainer.innerHTML = `
        <div class="info-item">
            <div class="info-item-icon">💼</div>
            <div class="info-item-content">
                <div class="info-item-label">Job Type</div>
                <div class="info-item-value">${formatDuration(currentJob.duration)}</div>
            </div>
        </div>

        <div class="info-item">
            <div class="info-item-icon">📍</div>
            <div class="info-item-content">
                <div class="info-item-label">Location</div>
                <div class="info-item-value">${escapeHtml(currentJob.location)}</div>
            </div>
        </div>

        <div class="info-item">
            <div class="info-item-icon">💰</div>
            <div class="info-item-content">
                <div class="info-item-label">Hourly Rate</div>
                <div class="info-item-value">₹${currentJob.hourlyRate}/hour</div>
            </div>
        </div>

        <div class="info-item">
            <div class="info-item-icon">📅</div>
            <div class="info-item-content">
                <div class="info-item-label">Posted On</div>
                <div class="info-item-value">${createdDate.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</div>
            </div>
        </div>
    `;

    // Employer info
    document.getElementById('employerAvatar').textContent = getInitials(currentJob.employerName || 'E');
    document.getElementById('employerName').textContent = currentJob.employerName || 'Anonymous Employer';

    // Application form
    renderApplicationSection();
}

function renderApplicationSection() {
    const formContainer = document.getElementById('applicationForm');

    if (!auth.currentUser) {
        formContainer.innerHTML = `
            <p style="text-align: center; color: var(--text-light); padding: 20px;">
                <a href="login.html" style="color: var(--primary); font-weight: 600; text-decoration: none;">
                    Log in to apply for this job
                </a>
            </p>
        `;
        return;
    }

    if (hasApplied) {
        formContainer.innerHTML = `
            <div class="already-applied">
                ✅ You've already applied to this job
            </div>
        `;
        return;
    }

    formContainer.innerHTML = `
        <div class="form-field">
            <label>Cover Letter</label>
            <textarea id="coverLetter" placeholder="Tell the employer why you're a great fit for this job..." required></textarea>
        </div>
        <button type="submit" class="apply-button" onclick="submitApplication(event)">Apply Now</button>
    `;

    // Re-attach event listener if form exists
    const form = document.getElementById('applicationForm');
    if (form) {
        form.onsubmit = submitApplication;
    }
}

window.submitApplication = async function(e) {
    e.preventDefault();

    if (!auth.currentUser) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const coverLetter = document.getElementById('coverLetter').value.trim();
        
        if (!coverLetter) {
            alert('Please write a cover letter');
            return;
        }

        const submitBtn = document.querySelector('.apply-button');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        // Get worker profile
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data() || { fullName: 'Worker' };

        // Create application
        const applicationData = {
            jobId: currentJobId,
            workerId: auth.currentUser.uid,
            workerName: userData.fullName,
            workerEmail: auth.currentUser.email,
            employerId: currentJob.employer,
            coverLetter: coverLetter,
            status: 'pending',
            appliedAt: Timestamp.now(),
            jobTitle: currentJob.title,
            jobRate: currentJob.hourlyRate
        };

        const applicationsRef = collection(db, 'applications');
        await addDoc(applicationsRef, applicationData);

        // Update job applications count
        const jobRef = doc(db, 'jobs', currentJobId);
        const currentCount = currentJob.applicationsCount || 0;
        await updateDoc(jobRef, {
            applicationsCount: currentCount + 1
        });

        // Send notification to employer
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, {
            userId: currentJob.employer,
            message: `📋 New application for "${currentJob.title}" from ${userData.fullName}`,
            type: 'new_application',
            data: {
                jobId: currentJobId,
                jobTitle: currentJob.title,
                workerId: auth.currentUser.uid,
                workerName: userData.fullName,
                applicationId: null  // Will be the doc ID
            },
            read: false,
            createdAt: Timestamp.now()
        });

        hasApplied = true;
        renderApplicationSection();
        alert('✅ Application submitted successfully!');

    } catch (error) {
        console.error('Error submitting application:', error);
        alert(`Error: ${error.message}`);
        const submitBtn = document.querySelector('.apply-button');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Apply Now';
    }
};

window.toggleBookmark = function() {
    alert('🔖 Job bookmarked! (Feature coming soon)');
};

window.shareJob = function() {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: currentJob.title,
            text: `Check out this job: ${currentJob.title}`,
            url: url
        });
    } else {
        alert(`Share: ${url}`);
    }
};

window.messageEmployer = async function() {
    if (!auth.currentUser) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Get current user details
        const userRole = auth.currentUser.email ? 'worker' : 'unknown';
        
        // Get user profile details (try worker first)
        let userData = { name: 'User' };
        try {
            const userDoc = await getDoc(doc(db, 'workers', auth.currentUser.uid));
            if (userDoc.exists()) {
                userData = userDoc.data();
            }
        } catch (e) {
            console.log('[Chat] No worker profile found');
        }

        const workerId = auth.currentUser.uid;
        const workerName = userData.name || 'Worker';
        const employerId = currentJob.employer;
        const employerName = currentJob.employerName || 'Employer';
        const jobId = currentJobId;
        const jobTitle = currentJob.title;

        // Check if conversation already exists
        const q = query(
            collection(db, 'conversations'),
            where('jobId', '==', jobId),
            where('workerId', '==', workerId),
            where('employerId', '==', employerId)
        );

        const existingConversation = await getDocs(q);

        let conversationId;

        if (!existingConversation.empty) {
            // Conversation exists, use it
            conversationId = existingConversation.docs[0].id;
        } else {
            // Create new conversation
            const conversationData = {
                workerId: workerId,
                workerName: workerName,
                employerId: employerId,
                employerName: employerName,
                jobId: jobId,
                jobTitle: jobTitle,
                lastMessage: '',
                lastMessageTime: Timestamp.now(),
                createdAt: Timestamp.now(),
                participants: [workerId, employerId]
            };

            const docRef = await addDoc(collection(db, 'conversations'), conversationData);
            conversationId = docRef.id;
            console.log('[Chat] Created new conversation:', conversationId);
        }

        // Redirect to chat
        window.location.href = `chat.html?conversation=${conversationId}`;

    } catch (error) {
        console.error('[Chat] Error starting conversation:', error);
        alert('Error starting conversation: ' + error.message);
    }
};

// File complaint
window.fileComplaint = function() {
    if (!auth.currentUser) {
        window.location.href = 'login.html';
        return;
    }

    if (!currentJob) {
        alert('Job details not loaded');
        return;
    }

    console.log('[Complaint] Filing complaint against employer:', currentJob.employer);
    window.location.href = `complaint.html?defendantId=${currentJob.employer}&jobId=${currentJob.id}`;
};

// Book job (Payment)
window.bookJob = function() {
    if (!auth.currentUser) {
        window.location.href = 'login.html';
        return;
    }

    if (!currentJob) {
        alert('Job details not loaded');
        return;
    }

    console.log('[Payment] Booking job:', currentJob.id);
    window.location.href = `payment.html?jobId=${currentJob.id}`;
};

function formatDuration(duration) {
    const map = {
        'same-day': 'Same Day',
        'one-day': '1 Day',
        'few-days': 'Few Days',
        'one-week': '1 Week',
        'ongoing': 'Ongoing'
    };
    return map[duration] || duration;
}

function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorContainer.style.display = 'block';
    document.getElementById('loadingContainer').style.display = 'none';
}