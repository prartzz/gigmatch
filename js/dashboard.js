// Dashboard Role-Based Routing Logic
import { auth, db, getDoc, doc, setDoc, signOut, onAuthStateChanged, collection, query, where, onSnapshot, updateDoc, getDocs } from './firebase-config.js';
import { initializeNotifications } from './notifications.js';

console.log('[Dashboard] Script loading...');

const ICONS = {
    settings: `<svg width="24" height="24" fill="none" stroke="var(--primary)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`,
    alert: `<svg width="24" height="24" fill="none" stroke="var(--primary)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`,
    database: `<svg width="24" height="24" fill="none" stroke="var(--primary)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>`,
    profile: `<svg width="24" height="24" fill="none" stroke="var(--primary)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`,
    search: `<svg width="24" height="24" fill="none" stroke="var(--primary)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>`,
    chat: `<svg width="24" height="24" fill="none" stroke="var(--primary)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>`,
    document: `<svg width="24" height="24" fill="none" stroke="var(--primary)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`,
    briefcase: `<svg width="24" height="24" fill="none" stroke="var(--primary)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>`,
    plus: `<svg width="24" height="24" fill="none" stroke="var(--primary)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>`
};

// Load Admin Dashboard
function loadAdminDashboard() {
    const dashboardContent = document.getElementById('dashboardContent');
    dashboardContent.innerHTML = `
        <div class="dashboard-section">
            <h3 style="display: flex; align-items: center; gap: 8px;">${ICONS.settings} Admin Panel</h3>
            <p>Manage complaints, users, and jobs</p>
            <a href="admin-dashboard.html" class="btn btn-primary">Open Admin Dashboard</a>
        </div>
        <div class="dashboard-section">
            <h3 style="display: flex; align-items: center; gap: 8px;">${ICONS.alert} Complaints Management</h3>
            <p>Review and resolve user complaints</p>
            <a href="admin-complaints.html" class="btn btn-primary">View Complaints</a>
        </div>
        <div class="dashboard-section">
            <h3 style="display: flex; align-items: center; gap: 8px;">${ICONS.database} Seed Demo Data</h3>
            <p>Create test employers and 30+ demo jobs for presentations</p>
            <a href="seed-demo-data.html" class="btn btn-primary">Seed Data</a>
        </div>
    `;
}

// Load Worker Dashboard
function loadWorkerDashboard() {
    const dashboardContent = document.getElementById('dashboardContent');
    dashboardContent.innerHTML = `
        <div class="dashboard-section">
            <h3 style="display: flex; align-items: center; gap: 8px;">${ICONS.search} Discover Jobs</h3>
            <p>Browse and apply for gigs that match your skills</p>
            <a href="jobs-discover.html" class="btn btn-primary">Browse Jobs</a>
        </div>
        <div class="dashboard-section">
            <h3 style="display: flex; align-items: center; gap: 8px;">${ICONS.chat} Messages</h3>
            <p>Chat with employers about jobs</p>
            <a href="chat.html" class="btn btn-primary">View Messages</a>
        </div>
        <div class="dashboard-section">
            <h3 style="display: flex; align-items: center; gap: 8px;">${ICONS.document} My Applications</h3>
            <p>Track your job applications and opportunities</p>
            <a href="applications.html" class="btn btn-primary">View Applications</a>
        </div>
    `;
}

// Load Employer Dashboard
function loadEmployerDashboard() {
    const dashboardContent = document.getElementById('dashboardContent');
    const html = `
        <div class="dashboard-section">
            <h3 style="display: flex; align-items: center; gap: 8px;">${ICONS.plus} Post a New Job</h3>
            <p>Create a new job posting to find workers</p>
            <a href="job-post.html" class="btn btn-primary">Post a Job</a>
        </div>
        <div class="dashboard-section">
            <h3 style="display: flex; align-items: center; gap: 8px;">${ICONS.briefcase} My Posted Jobs</h3>
            <p>Manage your job postings and view applications</p>
            <a href="jobs-list.html" class="btn btn-primary">View My Jobs</a>
        </div>
        <div class="dashboard-section">
            <h3 style="display: flex; align-items: center; gap: 8px;">${ICONS.chat} Messages</h3>
            <p>Chat with workers about jobs</p>
            <a href="chat.html" class="btn btn-primary">View Messages</a>
        </div>
        <div class="dashboard-section">
            <h3 style="display: flex; align-items: center; gap: 8px;">${ICONS.document} Applications Received</h3>
            <p>Review and manage applications from workers</p>
            <a href="employer-applications.html" class="btn btn-primary">View Applications</a>
        </div>
    `;
    dashboardContent.innerHTML = html;
    console.log('[Dashboard] ✓ Employer dashboard rendered');
    console.log('[Dashboard] Sections count:', dashboardContent.querySelectorAll('.dashboard-section').length);
    console.log('[Dashboard] Has Messages?', dashboardContent.innerHTML.includes('Messages') ? 'YES' : 'NO');
}

// Load appropriate dashboard
async function loadDashboardContent(user) {
    console.log('[Dashboard] loadDashboardContent called for:', user.email);
    
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        let userType = 'worker'; // Default
        
        if (userDoc.exists()) {
            console.log('[Dashboard] User doc found:', userDoc.data());
            userType = userDoc.data().userType || 'worker';
        } else {
            console.log('[Dashboard] No user doc, creating default worker profile');
            // Create default profile
            await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                userType: 'worker',
                fullName: user.displayName || 'User',
                createdAt: new Date()
            });
            userType = 'worker';
        }
        
        console.log('[Dashboard] Loading', userType, 'dashboard');
        
        // Check for admin role
        const userData = userDoc.exists() ? userDoc.data() : {};
        const isAdmin = userData?.role === 'admin';
        
        let profileUrl = 'worker-profile.html';
        
        if (isAdmin) {
            console.log('[Dashboard] ✓ Loading admin dashboard');
            loadAdminDashboard();
            profileUrl = 'admin-profile.html';
        } else if (userType === 'employer') {
            loadEmployerDashboard();
            profileUrl = 'employer-profile.html';
        } else {
            loadWorkerDashboard();
        }

        const profileNavBtn = document.getElementById('profileNavBtn');
        if (profileNavBtn) {
            console.log('[Dashboard] Setting profile icon url to:', profileUrl);
            profileNavBtn.onclick = () => window.location.href = profileUrl;
        }
    } catch (error) {
        console.error('[Dashboard] Error:', error.message);
        console.log('[Dashboard] Loading default worker dashboard');
        loadWorkerDashboard();
    }
}

// Handle Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        console.log('[Dashboard] Logout clicked');
        try {
            await signOut(auth);
            console.log('[Dashboard] User logged out');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('[Dashboard] Logout error:', error);
        }
    });
}

// Notification Panel Handling
let notificationUnsubscribe = null;
const notificationBtn = document.getElementById('notificationBtn');
const notificationPanel = document.getElementById('notificationPanel');
const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');

if (notificationBtn) {
    notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationPanel.classList.toggle('active');
    });
}

if (clearNotificationsBtn) {
    clearNotificationsBtn.addEventListener('click', async () => {
        try {
            if (!auth.currentUser) return;
            
            const notificationsRef = collection(db, 'notifications');
            const q = query(notificationsRef, where('userId', '==', auth.currentUser.uid), where('read', '==', false));
            const snapshot = await getDocs(q);
            
            for (const doc of snapshot.docs) {
                await updateDoc(doc.ref, { read: true });
            }
            
            console.log('[Dashboard] Cleared all notifications');
        } catch (error) {
            console.error('[Dashboard] Error clearing notifications:', error);
        }
    });
}

// Close notification panel when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.notification-icon-btn') && !e.target.closest('.notification-panel')) {
        notificationPanel.classList.remove('active');
    }
});

// Load and display notifications
function setupNotificationListener() {
    if (!auth.currentUser) return;
    
    console.log('[Dashboard] Setting up notification listener for:', auth.currentUser.uid);
    
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', auth.currentUser.uid));
    
    // Unsubscribe from previous listener if exists
    if (notificationUnsubscribe) {
        notificationUnsubscribe();
    }
    
    // Real-time listener
    notificationUnsubscribe = onSnapshot(q, (snapshot) => {
        console.log('[Dashboard] Notifications updated:', snapshot.docs.length);
        updateNotificationDisplay(snapshot.docs);
    }, (error) => {
        console.error('[Dashboard] Error listening to notifications:', error);
    });
}

function updateNotificationDisplay(notificationDocs) {
    const badge = document.getElementById('notificationBadge');
    const notificationList = document.getElementById('notificationList');
    
    // Sort by newest first
    const notifications = notificationDocs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.toDate?.() || new Date(0)) - (a.createdAt?.toDate?.() || new Date(0)));
    
    // Count unread
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Update badge
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
    
    // Update list
    if (notifications.length === 0) {
        notificationList.innerHTML = `
            <div class="notification-empty">
                <div class="notification-empty-icon">📭</div>
                <div>No notifications yet</div>
            </div>
        `;
    } else {
        notificationList.innerHTML = notifications.map(notification => {
            const createdTime = notification.createdAt?.toDate?.() || new Date();
            const timeStr = formatTimeAgo(createdTime);
            const unreadClass = notification.read ? '' : 'unread';
            
            // Get emoji based on notification type
            let emoji = '📩';
            if (notification.type === 'job_accepted') emoji = '🎉';
            else if (notification.type === 'job_rejected') emoji = '❌';
            else if (notification.type === 'job_cancelled') emoji = '⚠️';
            else if (notification.type === 'new_application') emoji = '📋';
            else if (notification.type === 'message') emoji = '💬';
            
            return `
                <div class="notification-item ${unreadClass}" onclick="markAsRead('${notification.id}')">
                    <div class="notification-item-content">
                        <div class="notification-item-icon">${emoji}</div>
                        <div class="notification-item-text">
                            <div class="notification-item-message">${escapeHtml(notification.message)}</div>
                            <div class="notification-item-time">${timeStr}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

window.markAsRead = async function(notificationId) {
    try {
        const notifRef = doc(db, 'notifications', notificationId);
        await updateDoc(notifRef, { read: true });
    } catch (error) {
        console.error('[Dashboard] Error marking as read:', error);
    }
};

function formatTimeAgo(date) {
    if (!date) return 'now';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
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

// Setup auth listener on page load
console.log('[Dashboard] Setting up auth listener');
onAuthStateChanged(auth, async (user) => {
    console.log('[Dashboard] Auth state changed:', user ? user.email : 'null');
    
    if (user) {
        console.log('[Dashboard] User is logged in, loading dashboard...');
        loadDashboardContent(user);
        
        // Initialize notifications
        try {
            await initializeNotifications();
            console.log('[Dashboard] ✓ Notifications initialized');
            
            // Setup notification listener for panel
            setupNotificationListener();
            console.log('[Dashboard] ✓ Notification listener setup');
        } catch (error) {
            console.error('[Dashboard] Error initializing notifications:', error);
        }
    } else {
        console.log('[Dashboard] No user, redirecting to login');
        // Give it a moment to make sure this isn't a fluke
        setTimeout(() => {
            if (!auth.currentUser) {
                window.location.href = 'login.html';
            }
        }, 1000);
    }
});
