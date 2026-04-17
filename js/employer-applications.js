import { auth, db, waitForFirebase, collection, query, where, getDocs, doc, getDoc, updateDoc, Timestamp, addDoc, deleteDoc } from './firebase-config.js';

let allApplications = [];
let allJobs = {};
let currentFilter = 'all';
let filterJobId = null;
let filterJobTitle = null;

console.log('[EmployerApplications] Script loaded');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[EmployerApplications] Page loaded - waiting for Firebase');
    await waitForFirebase();
    console.log('[EmployerApplications] Firebase ready');

    if (!auth.currentUser) {
        console.error('[EmployerApplications] No authenticated user!');
        window.location.href = 'login.html';
        return;
    }

    // Check for jobId parameter in URL
    const params = new URLSearchParams(window.location.search);
    filterJobId = params.get('jobId');
    console.log('[EmployerApplications] Filter job ID:', filterJobId);

    console.log('[EmployerApplications] User authenticated:', auth.currentUser.uid);
    await loadApplications();
});

async function loadApplications() {
    try {
        const loadingContainer = document.getElementById('loadingContainer');
        const applicationsContainer = document.getElementById('applicationsContainer');
        const emptyState = document.getElementById('emptyState');

        loadingContainer.style.display = 'block';
        applicationsContainer.style.display = 'none';
        emptyState.style.display = 'none';

        console.log('[EmployerApplications] Loading jobs for employer:', auth.currentUser.uid);

        // First, get all jobs posted by this employer
        const jobsRef = collection(db, 'jobs');
        const jobsQuery = query(jobsRef, where('employer', '==', auth.currentUser.uid));
        const jobsSnapshot = await getDocs(jobsQuery);

        const jobIds = [];
        allJobs = {};

        jobsSnapshot.forEach(doc => {
            const jobData = doc.data();
            jobData.id = doc.id;
            jobIds.push(doc.id);
            allJobs[doc.id] = jobData;
        });

        // If filtering by specific job, update header
        if (filterJobId && allJobs[filterJobId]) {
            filterJobTitle = allJobs[filterJobId].title;
            const header = document.querySelector('.page-header');
            if (header) {
                header.innerHTML = `
                    <a href="employer-applications.html" style="display: inline-block; margin-bottom: 12px; color: #6366f1; font-weight: 600; text-decoration: none; font-size: 14px;">← Back to All Applications</a>
                    <h1>📋 Applications for: ${escapeHtml(filterJobTitle)}</h1>
                    <p>Review and manage applications for this specific job posting</p>
                `;
            }
        }

        console.log('[EmployerApplications] Found', jobIds.length, 'jobs');
        console.log('[EmployerApplications] Filter job title:', filterJobTitle);

        // Now get all applications for these jobs
        allApplications = [];

        if (jobIds.length > 0) {
            const applicationsRef = collection(db, 'applications');
            
            // If filtering by specific job, only get applications for that job
            const jobsToCheck = filterJobId ? [filterJobId] : jobIds;
            
            // Get applications for each job
            for (const jobId of jobsToCheck) {
                const appsQuery = query(applicationsRef, where('jobId', '==', jobId));
                const appsSnapshot = await getDocs(appsQuery);

                appsSnapshot.forEach(doc => {
                    const appData = doc.data();
                    appData.id = doc.id;
                    allApplications.push(appData);
                });
            }
        }

        console.log('[EmployerApplications] Found', allApplications.length, 'applications');

        loadingContainer.style.display = 'none';

        if (allApplications.length === 0) {
            applicationsContainer.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            applicationsContainer.style.display = 'block';
            emptyState.style.display = 'none';
            renderApplications();
        }

    } catch (error) {
        console.error('[EmployerApplications] Error loading applications:', error);
        showToast('Error loading applications: ' + error.message, 'error');
        document.getElementById('loadingContainer').style.display = 'none';
    }
}

function renderApplications() {
    const applicationsContainer = document.getElementById('applicationsContainer');
    applicationsContainer.innerHTML = '';

    // Group applications by job
    const applicationsByJob = {};

    allApplications.forEach(app => {
        if (!applicationsByJob[app.jobId]) {
            applicationsByJob[app.jobId] = [];
        }
        applicationsByJob[app.jobId].push(app);
    });

    // Filter applications
    for (const jobId in applicationsByJob) {
        const job = allJobs[jobId];
        let applications = applicationsByJob[jobId];

        // Filter by status
        if (currentFilter !== 'all') {
            applications = applications.filter(app => app.status === currentFilter);
        }

        if (applications.length === 0) continue;

        const jobSection = document.createElement('div');
        jobSection.className = 'job-section';
        jobSection.style.animation = `slideUp 0.4s ease-out`;

        jobSection.innerHTML = `
            <div class="job-section-header">
                <div class="job-section-title">${escapeHtml(job.title)}</div>
                <div class="job-section-meta">
                    <span>💼 ${escapeHtml(job.category)}</span>
                    <span>📍 ${escapeHtml(job.location)}</span>
                    <span>💰 ₹${job.hourlyRate}/hr</span>
                    <span>${applications.length} application(s)</span>
                </div>
            </div>
            <div class="job-section-content" id="job-${jobId}">
                ${applications.map(app => renderApplicationCard(app, job)).join('')}
            </div>
        `;

        applicationsContainer.appendChild(jobSection);
    }
}

function renderApplicationCard(app, job) {
    const appliedDate = app.appliedAt?.toDate?.() || new Date();
    const dateStr = appliedDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const timeStr = appliedDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const statusClass = `status-${app.status}`;

    let actionButtons = '';
    if (app.status === 'pending') {
        actionButtons = `
            <button class="btn-action btn-accept" onclick="acceptApplication('${app.id}', '${app.jobId}')">
                ✅ Accept
            </button>
            <button class="btn-action btn-reject" onclick="rejectApplication('${app.id}', '${app.jobId}')">
                ❌ Reject
            </button>
            <button class="btn-action btn-message" onclick="messageWorker('${app.workerId}', '${app.workerName}', '${app.jobId}')">
                💬 Message
            </button>
        `;
    } else if (app.status === 'accepted') {
        actionButtons = `
            <button class="btn-action btn-accept" onclick="markInProgress('${app.id}', '${app.workerId}', '${job.title}')">
                ✅ Confirm Worker Started
            </button>
            <button class="btn-action btn-message" onclick="messageWorker('${app.workerId}', '${app.workerName}', '${app.jobId}')">
                💬 Message Worker
            </button>
            <button class="btn-action btn-reject" onclick="rejectApplication('${app.id}', '${app.jobId}')">
                ↩️ Cancel Assignment
            </button>
        `;
    } else if (app.status === 'in_progress') {
        actionButtons = `
            <div style="padding: 8px; font-size: 13px; color: var(--primary);">⏳ Worker is currently working...</div>
            <button class="btn-action btn-message" onclick="messageWorker('${app.workerId}', '${app.workerName}', '${app.jobId}')">
                💬 Message Worker
            </button>
        `;
    } else if (app.status === 'completed_pending_review') {
        actionButtons = `
            <button class="btn-action btn-accept" style="background:var(--primary); color:white; border:none;" onclick="rateWorkerAndPay('${app.workerId}', '${app.jobId}', '${app.id}')">
                ⭐ Rate & Pay Worker
            </button>
        `;
    } else if (app.status === 'completed') {
        actionButtons = `
            <div style="padding: 8px; font-size: 13px; color: #10b981; font-weight:bold;">💸 Paid & Completed</div>
        `;
    } else if (app.status === 'rejected') {
        actionButtons = `
            <button class="btn-action btn-accept" onclick="acceptApplication('${app.id}', '${app.jobId}')">
                ↩️ Reconsider
            </button>
        `;
    }

    return `
        <div class="application-card ${statusClass}">
            <div class="app-header">
                <div class="app-worker-info">
                    <div class="app-worker-name">${escapeHtml(app.workerName)}</div>
                    <div class="app-worker-email">📧 ${escapeHtml(app.workerEmail)}</div>
                </div>
                <span class="app-status-badge status-${app.status}">
                    ${app.status.toUpperCase()}
                </span>
            </div>

            <div class="app-details">
                <div class="detail-item">
                    <div class="detail-label">Applied On</div>
                    <div class="detail-value">${dateStr} at ${timeStr}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Job Title</div>
                    <div class="detail-value">${escapeHtml(job.title)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Job Rate</div>
                    <div class="detail-value">₹${job.hourlyRate}/hour</div>
                </div>
                ${app.status === 'accepted' ? `
                    <div class="detail-item">
                        <div class="detail-label">Status</div>
                        <div class="detail-value">✅ Assigned to Worker</div>
                    </div>
                ` : ''}
            </div>

            <div class="cover-letter">
                <div class="cover-letter-label">📝 Cover Letter</div>
                <div class="cover-letter-text">${escapeHtml(app.coverLetter)}</div>
            </div>

            <div class="app-actions">
                ${actionButtons}
            </div>
        </div>
    `;
}

window.acceptApplication = async function(appId, jobId) {
    if (!confirm('Are you sure you want to accept this application and assign the job to this worker?')) {
        return;
    }

    try {
        const appRef = doc(db, 'applications', appId);
        const appDoc = await getDoc(appRef);
        const appData = appDoc.data();

        // Update application status
        await updateDoc(appRef, {
            status: 'accepted',
            assignedAt: Timestamp.now()
        });

        // Create a job assignment record
        const assignmentData = {
            jobId: jobId,
            workerId: appData.workerId,
            employerId: auth.currentUser.uid,
            applicationId: appId,
            workerName: appData.workerName,
            workerEmail: appData.workerEmail,
            jobTitle: appData.jobTitle,
            jobRate: appData.jobRate,
            status: 'active',
            assignedAt: Timestamp.now()
        };

        const assignmentsRef = collection(db, 'assignments');
        const assignmentDocRef = await addDoc(assignmentsRef, assignmentData);
        console.log('[EmployerApplications] Created assignment:', assignmentDocRef.id);

        // Send notification to worker
        await sendNotification(
            appData.workerId,
            `🎉 Congrats! You've been accepted for: ${appData.jobTitle}`,
            'job_accepted',
            { jobId: jobId, jobTitle: appData.jobTitle }
        );

        showToast('✅ Application accepted! Worker has been notified.', 'success');
        
        // Reload applications
        await loadApplications();

    } catch (error) {
        console.error('[EmployerApplications] Error accepting application:', error);
        showToast('Error accepting application: ' + error.message, 'error');
    }
};

window.markInProgress = async function(appId, workerId, jobTitle) {
    if (!confirm('Confirm the worker has successfully joined and started?')) return;
    try {
        await updateDoc(doc(db, 'applications', appId), {
            status: 'in_progress',
            startedAt: Timestamp.now()
        });

        // Also update assignment status if you want to keep them perfectly in sync
        const assignmentsRef = collection(db, 'assignments');
        const q = query(assignmentsRef, where('applicationId', '==', appId));
        const snapshot = await getDocs(q);
        for (const assignDoc of snapshot.docs) {
            await updateDoc(doc(db, 'assignments', assignDoc.id), { status: 'in_progress' });
        }

        await sendNotification(
            workerId,
            `⏳ Work started for: ${jobTitle}`,
            'job_started'
        );

        showToast('✅ Job marked as In Progress!', 'success');
        await loadApplications();
    } catch (error) {
        console.error('[EmployerApplications] Error marking in progress:', error);
        showToast('Error updating status: ' + error.message, 'error');
    }
};

window.rateWorkerAndPay = function(workerId, jobId, appId) {
    window.location.href = `rating.html?jobId=${jobId}&ratedUserId=${workerId}&appId=${appId}`;
};

window.rejectApplication = async function(appId, jobId) {
    if (!confirm('Are you sure you want to reject this application?')) {
        return;
    }

    try {
        const appRef = doc(db, 'applications', appId);
        const appDoc = await getDoc(appRef);
        const appData = appDoc.data();

        // Update application status
        await updateDoc(appRef, {
            status: 'rejected',
            rejectedAt: Timestamp.now()
        });

        // If it was accepted, remove the assignment
        if (appData.status === 'accepted') {
            const assignmentsRef = collection(db, 'assignments');
            const q = query(assignmentsRef, where('applicationId', '==', appId));
            const snapshot = await getDocs(q);
            
            for (const assignDoc of snapshot.docs) {
                await deleteDoc(doc(db, 'assignments', assignDoc.id));
            }

            // Send cancellation notification
            await sendNotification(
                appData.workerId,
                `❌ The assignment for ${appData.jobTitle} has been cancelled.`,
                'job_cancelled',
                { jobId: jobId, jobTitle: appData.jobTitle }
            );
        } else {
            // Send rejection notification
            await sendNotification(
                appData.workerId,
                `Your application for ${appData.jobTitle} was not selected.`,
                'job_rejected',
                { jobId: jobId, jobTitle: appData.jobTitle }
            );
        }

        showToast('❌ Application rejected. Worker has been notified.', 'success');
        await loadApplications();

    } catch (error) {
        console.error('[EmployerApplications] Error rejecting application:', error);
        showToast('Error rejecting application: ' + error.message, 'error');
    }
};

window.messageWorker = async function(workerId, workerName, jobId) {
    try {
        // Get job details
        const jobRef = doc(db, 'jobs', jobId);
        const jobDoc = await getDoc(jobRef);
        const jobData = jobDoc.data();

        // Get/create conversation
        const conversationRef = collection(db, 'conversations');
        const q = query(
            conversationRef,
            where('jobId', '==', jobId),
            where('workerId', '==', workerId),
            where('employerId', '==', auth.currentUser.uid)
        );

        const existingConv = await getDocs(q);
        let conversationId;

        if (!existingConv.empty) {
            conversationId = existingConv.docs[0].id;
        } else {
            // Create new conversation
            const convData = {
                workerId: workerId,
                workerName: workerName,
                employerId: auth.currentUser.uid,
                employerName: 'You',
                jobId: jobId,
                jobTitle: jobData.title,
                lastMessage: '',
                lastMessageTime: Timestamp.now(),
                createdAt: Timestamp.now(),
                participants: [workerId, auth.currentUser.uid]
            };

            const docRef = await addDoc(collection(db, 'conversations'), convData);
            conversationId = docRef.id;
        }

        window.location.href = `chat.html?conversation=${conversationId}`;

    } catch (error) {
        console.error('[EmployerApplications] Error messaging worker:', error);
        showToast('Error starting conversation: ' + error.message, 'error');
    }
};

window.filterApplications = function(filter) {
    currentFilter = filter;

    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Re-render
    renderApplications();
};

async function sendNotification(userId, message, type, data = {}) {
    try {
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, {
            userId: userId,
            message: message,
            type: type,
            data: data,
            read: false,
            createdAt: Timestamp.now()
        });
    } catch (error) {
        console.error('[EmployerApplications] Error sending notification:', error);
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
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
