import { auth, db, waitForFirebase, doc, getDoc, setDoc, collection, addDoc, updateDoc, Timestamp, query, where, getDocs, orderBy } from './firebase-config.js';
import { sendNotification } from './notifications.js';

console.log('[Complaint] Script loaded');

let currentUser = null;

// Initialize for complaint form page
if (document.getElementById('complaintForm')) {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('[Complaint] Form page loaded');
        
        try {
            await waitForFirebase();
            
            if (!auth.currentUser) {
                window.location.href = 'login.html';
                return;
            }

            currentUser = auth.currentUser;
            
            // Get defendant user ID from URL
            const params = new URLSearchParams(window.location.search);
            const defendantId = params.get('defendantId');
            const jobId = params.get('jobId');

            if (defendantId) {
                document.getElementById('defendantUserId').value = defendantId;
            }

            if (jobId) {
                document.getElementById('jobSelectionGroup').style.display = 'none';
            } else {
                document.getElementById('jobSelectionGroup').style.display = 'block';
                // Load user's jobs
                // await loadUserJobs();
            }

        } catch (error) {
            console.error('[Complaint] Error:', error);
            showMessage('Error loading complaint form', 'error');
        }
    });
}

// Complaint form submission
async function submitComplaint() {
    try {
        const reason = document.getElementById('reason').value.trim();
        const description = document.getElementById('description').value.trim();
        const evidence = document.getElementById('evidence').value.trim();
        const defendantUserId = document.getElementById('defendantUserId').value;

        if (!reason || !description) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }

        if (!defendantUserId) {
            showMessage('Missing defendant information. Please try again.', 'error');
            return;
        }

        console.log('[Complaint] Submitting complaint:', { reason, defendantUserId });

        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const evidenceList = evidence ? evidence.split('\n').filter(line => line.trim()) : [];

        const complaintData = {
            jobId: document.getElementById('jobId')?.value || '',
            filerUserId: currentUser.uid,
            filerName: currentUser.displayName || 'Anonymous',
            filerEmail: currentUser.email,
            defendantUserId: defendantUserId,
            defendantName: 'User', // Will be filled from user data
            reason: reason,
            description: description,
            evidence: evidenceList,
            status: 'open',
            resolution: '',
            createdAt: Timestamp.now(),
            resolvedAt: null,
            adminNotes: ''
        };

        const docRef = await addDoc(collection(db, 'complaints'), complaintData);
        console.log('[Complaint] Complaint submitted:', docRef.id);

        // Send notification to defendant and admins
        try {
            await sendNotification(
                defendantUserId,
                `🚨 A complaint has been filed against you: ${reason}`,
                'Complaint',
                { complaintId: docRef.id }
            );
            console.log('[Complaint] Notification sent to defendant');
        } catch (notifError) {
            console.warn('[Complaint] Error sending notification to defendant:', notifError);
        }

        showMessage('✅ Complaint submitted successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);

    } catch (error) {
        console.error('[Complaint] Error:', error);
        showMessage('Error submitting complaint: ' + error.message, 'error');
        
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Complaint';
    }
}

function showMessage(message, type) {
    const errorMsg = document.getElementById('errorMsg');
    const successMsg = document.getElementById('successMsg');

    if (!errorMsg || !successMsg) return;

    if (type === 'error') {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        successMsg.style.display = 'none';
    } else {
        successMsg.textContent = message;
        successMsg.style.display = 'block';
        errorMsg.style.display = 'none';
    }
}

// Admin Dashboard Functions

let allComplaints = [];

async function initializeAdminDashboard() {
    try {
        await waitForFirebase();
        
        if (!auth.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        currentUser = auth.currentUser;
        
        // Check if user is admin by verifying role in user document
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        
        if (userData?.role !== 'admin') {
            console.error('[Complaint] Access denied - user is not an admin');
            document.body.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100vh;">
                    <div style="text-align: center;">
                        <h1>Access Denied</h1>
                        <p>You do not have permission to access this page.</p>
                        <a href="dashboard.html" style="color: #667eea; text-decoration: none;">← Back to Dashboard</a>
                    </div>
                </div>
            `;
            return;
        }
        
        console.log('[Complaint] Admin dashboard loading...');
        
        await loadAdminComplaints();
        updateStats();

    } catch (error) {
        console.error('[Complaint] Error initializing admin:', error);
    }
}

async function loadAdminComplaints() {
    try {
        console.log('[Complaint] Loading all complaints...');

        const q = query(
            collection(db, 'complaints'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        allComplaints = [];

        snapshot.forEach(doc => {
            allComplaints.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log('[Complaint] Loaded', allComplaints.length, 'complaints');
        displayComplaints(allComplaints);

    } catch (error) {
        console.error('[Complaint] Error loading complaints:', error);
    }
}

function displayComplaints(complaints) {
    const list = document.getElementById('complaintsList');
    
    if (complaints.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="icon">✅</div>
                <p>No complaints found</p>
            </div>
        `;
        return;
    }

    list.innerHTML = complaints.map(complaint => {
        const statusBadgeClass = `status-${complaint.status.replace('_', '-')}`;
        const createdDate = complaint.createdAt?.toDate?.() || new Date();
        
        return `
            <div class="complaint-card">
                <div class="complaint-header">
                    <div class="complaint-title">${escapeHtml(complaint.reason.replace(/_/g, ' ').toUpperCase())}</div>
                    <span class="status-badge ${statusBadgeClass}">${complaint.status.replace(/_/g, ' ')}</span>
                </div>
                <div class="complaint-details">
                    <div class="detail-item">
                        <span class="detail-label">Filer:</span>
                        <span>${escapeHtml(complaint.filerName || 'Anonymous')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Against:</span>
                        <span>${escapeHtml(complaint.defendantName || 'User')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Filed:</span>
                        <span>${createdDate.toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="complaint-description">
                    ${escapeHtml(complaint.description.substring(0, 150))}${complaint.description.length > 150 ? '...' : ''}
                </div>
                <div class="complaint-actions">
                    <button class="btn btn-view" onclick="viewComplaintDetail('${complaint.id}')">View Details</button>
                    ${complaint.status === 'open' ? `<button class="btn btn-resolve" onclick="markAsReview('${complaint.id}')">Review</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function viewComplaintDetail(complaintId) {
    try {
        const complaint = allComplaints.find(c => c.id === complaintId);
        if (!complaint) return;

        const createdDate = complaint.createdAt?.toDate?.() || new Date();

        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        modalTitle.textContent = `${complaint.reason.replace(/_/g, ' ').toUpperCase()}`;
        
        let content = `
            <strong>Status:</strong> <span style="color: #667eea; font-weight: 600;">${complaint.status}</span><br><br>
            <strong>Filed by:</strong> ${escapeHtml(complaint.filerName || 'Anonymous')} (${escapeHtml(complaint.filerEmail || 'N/A')})<br>
            <strong>Against:</strong> ${escapeHtml(complaint.defendantName || 'User')}<br>
            <strong>Date Filed:</strong> ${createdDate.toLocaleDateString()}<br><br>
            <strong>Description:</strong><br>
            <div style="background: #f9f9f9; padding: 10px; border-radius: 4px; margin: 10px 0;">
                ${escapeHtml(complaint.description)}
            </div>
        `;

        if (complaint.evidence && complaint.evidence.length > 0) {
            content += `<strong>Evidence:</strong><br>`;
            complaint.evidence.forEach(url => {
                content += `<div>🔗 <a href="${escapeHtml(url)}" target="_blank">${escapeHtml(url.substring(0, 50))}...</a></div>`;
            });
            content += `<br>`;
        }

        if (complaint.adminNotes) {
            content += `<strong>Admin Notes:</strong><br>
                <div style="background: #f9f9f9; padding: 10px; border-radius: 4px;">
                    ${escapeHtml(complaint.adminNotes)}
                </div>`;
        }

        modalBody.innerHTML = content;

        // Store current complaint for resolution
        window.currentComplaintId = complaintId;
        
        document.getElementById('detailModal').classList.add('active');

    } catch (error) {
        console.error('[Complaint] Error viewing detail:', error);
    }
}

async function markAsReview(complaintId) {
    try {
        await updateDoc(doc(db, 'complaints', complaintId), {
            status: 'under_review'
        });
        
        console.log('[Complaint] Marked as under review:', complaintId);
        await loadAdminComplaints();
        updateStats();
        
    } catch (error) {
        console.error('[Complaint] Error updating status:', error);
    }
}

async function resolveComplaint(complaintId, notes) {
    try {
        await updateDoc(doc(db, 'complaints', complaintId), {
            status: 'resolved',
            adminNotes: notes,
            resolvedAt: Timestamp.now()
        });

        console.log('[Complaint] Complaint resolved:', complaintId);
        
        document.getElementById('resolveModal').classList.remove('active');
        await loadAdminComplaints();
        updateStats();
        alert('✅ Complaint marked as resolved');

    } catch (error) {
        console.error('[Complaint] Error resolving complaint:', error);
        alert('Error resolving complaint');
    }
}

function updateStats() {
    if (!document.getElementById('statTotal')) return;

    const stats = {
        total: allComplaints.length,
        open: allComplaints.filter(c => c.status === 'open').length,
        review: allComplaints.filter(c => c.status === 'under_review').length,
        resolved: allComplaints.filter(c => c.status === 'resolved').length
    };

    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statOpen').textContent = stats.open;
    document.getElementById('statReview').textContent = stats.review;
    document.getElementById('statResolved').textContent = stats.resolved;
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

console.log('[Complaint] Module loaded successfully');
