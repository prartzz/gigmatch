import { auth, db, waitForFirebase, collection, query, where, getDocs, updateDoc, deleteDoc, doc } from './firebase-config.js';

let allJobs = [];
let currentFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[JobsList] Page loaded - waiting for Firebase');
    await waitForFirebase();
    console.log('[JobsList] Firebase ready');

    if (!auth.currentUser) {
        console.error('[JobsList] No authenticated user!');
        window.location.href = 'login.html';
        return;
    }

    console.log('[JobsList] User authenticated:', auth.currentUser.uid);
    loadMyJobs();

    // Show success message if needed
    const params = new URLSearchParams(window.location.search);
    if (params.get('posted') === 'true') {
        showNotification('✅ Job posted successfully!', 3000);
        window.history.replaceState({}, document.title, 'jobs-list.html');
    }
});

async function loadMyJobs() {
    try {
        const loadingContainer = document.querySelector('[id="loadingContainer"]') || document.createElement('div');
        if (loadingContainer.id) loadingContainer.style.display = 'block';

        const jobsCollection = collection(db, 'jobs');
        const q = query(jobsCollection, where('employer', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);

        allJobs = [];
        querySnapshot.forEach(doc => {
            const jobData = doc.data();
            jobData.id = doc.id;

            // Calculate days ago
            const createdTime = jobData.createdAt?.toDate?.() || new Date();
            const now = new Date();
            const daysAgo = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24));
            jobData.daysAgo = daysAgo;

            allJobs.push(jobData);
        });

        // Sort by newest first (in JavaScript instead of Firestore)
        allJobs.sort((a, b) => {
            const timeA = a.createdAt?.toDate?.() || new Date(0);
            const timeB = b.createdAt?.toDate?.() || new Date(0);
            return timeB - timeA;
        });

        if (loadingContainer.id) loadingContainer.style.display = 'none';
        renderJobs();

    } catch (error) {
        console.error('Error loading jobs:', error);
        document.getElementById('jobsContainer').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #e53e3e;">
                <p>Error loading jobs. Please try again.</p>
            </div>
        `;
    }
}

function renderJobs() {
    const jobsContainer = document.getElementById('jobsContainer');
    const emptyState = document.getElementById('emptyState');

    // Filter jobs
    let filteredJobs = allJobs;
    if (currentFilter !== 'all') {
        filteredJobs = allJobs.filter(job => job.status === currentFilter);
    }

    if (filteredJobs.length === 0) {
        jobsContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    jobsContainer.style.display = 'grid';
    emptyState.style.display = 'none';

    jobsContainer.innerHTML = filteredJobs.map(job => `
        <div class="job-item">
            <div class="job-item-header">
                <div class="job-item-title">
                    <h3>${escapeHtml(job.title)}</h3>
                    <div class="job-item-meta">
                        <div class="meta-item">📂 ${escapeHtml(job.category)}</div>
                        <div class="meta-item">📍 ${escapeHtml(job.location)}</div>
                        <div class="meta-item">⏱️ ${formatDuration(job.duration)}</div>
                    </div>
                </div>
                <span class="job-status status-${job.status}">${formatStatus(job.status)}</span>
            </div>

            <p style="color: var(--text-dark); margin: 12px 0; line-height: 1.5;">
                ${escapeHtml(job.description.substring(0, 150))}${job.description.length > 150 ? '...' : ''}
            </p>

            <div class="job-item-stats">
                <div class="stat">
                    <div class="stat-value">₹${job.hourlyRate}</div>
                    <div class="stat-label">Hourly Rate</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${job.applicationsCount || 0}</div>
                    <div class="stat-label">Applications</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${job.views || 0}</div>
                    <div class="stat-label">Views</div>
                </div>
            </div>

            <div class="job-item-actions">
                <button class="action-btn action-btn-primary" onclick="viewApplications('${job.id}')">
                    👥 Applications
                </button>
                ${job.status === 'completed' ? `<button class="action-btn action-btn-primary" onclick="releasePayment('${job.id}')">
                    💳 Release Payment
                </button>` : ''}
                <button class="action-btn action-btn-secondary" onclick="editJob('${job.id}')">
                    ✏️ Edit
                </button>
                <button class="action-btn action-btn-secondary" onclick="toggleJobStatus('${job.id}', '${job.status}')">
                    ${job.status === 'active' ? '⏸️ Pause' : job.status === 'completed' ? '🔄 Archive' : '▶️ Activate'}
                </button>
                <button class="action-btn action-btn-danger" onclick="deleteJob('${job.id}')">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
}

window.filterByStatus = function(status) {
    currentFilter = status;
    
    // Update active tab
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    renderJobs();
};

window.viewApplications = function(jobId) {
    console.log('[JobsList] Viewing applications for job:', jobId);
    // Navigate to employer applications page filtered by this job
    window.location.href = `employer-applications.html?jobId=${jobId}`;
};

window.editJob = function(jobId) {
    // TODO: Implement job editing
    alert('✏️ Edit job (Coming soon)');
};

window.toggleJobStatus = async function(jobId, currentStatus) {
    try {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const jobRef = doc(db, 'jobs', jobId);
        
        await updateDoc(jobRef, { status: newStatus });
        
        // Update local state
        const job = allJobs.find(j => j.id === jobId);
        if (job) job.status = newStatus;
        
        renderJobs();
        showNotification(`Job ${newStatus === 'active' ? 'activated' : 'paused'}`, 2000);
    } catch (error) {
        console.error('Error updating job status:', error);
        alert(`Error: ${error.message}`);
    }
};

window.deleteJob = async function(jobId) {
    if (!confirm('Are you sure you want to delete this job? This cannot be undone.')) {
        return;
    }

    try {
        const jobRef = doc(db, 'jobs', jobId);
        await deleteDoc(jobRef);
        
        // Update local state
        allJobs = allJobs.filter(j => j.id !== jobId);
        
        renderJobs();
        showNotification('Job deleted successfully', 2000);
    } catch (error) {
        console.error('Error deleting job:', error);
        alert(`Error: ${error.message}`);
    }
};

window.releasePayment = function(jobId) {
    if (!jobId) {
        alert('Job ID not found');
        return;
    }
    console.log('[Payment] Redirecting to payment page for job:', jobId);
    window.location.href = `payment.html?jobId=${jobId}`;
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

function formatStatus(status) {
    const map = {
        'active': '🟢 Active',
        'inactive': '🔴 Inactive',
        'filled': '✅ Filled'
    };
    return map[status] || status;
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

function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, duration);
}