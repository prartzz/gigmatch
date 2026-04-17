import { auth, db, waitForFirebase, doc, setDoc, getDoc, collection, addDoc, updateDoc, Timestamp, query, where, getDocs, onSnapshot } from './firebase-config.js';

console.log('[Notifications] Module loaded');

let currentUser = null;
let notificationUnsubscribe = null;

// Initialize notifications
export async function initializeNotifications() {
    try {
        await waitForFirebase();
        
        if (!auth.currentUser) {
            console.log('[Notifications] User not authenticated');
            return;
        }

        currentUser = auth.currentUser;
        console.log('[Notifications] User authenticated:', currentUser.email);

        // Set up real-time listener for notifications
        setupNotificationListener();

    } catch (error) {
        console.error('[Notifications] Error initializing:', error);
    }
}

// Listen for new notifications
function setupNotificationListener() {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            where('read', '==', false)
        );

        notificationUnsubscribe = onSnapshot(q, (snapshot) => {
            console.log('[Notifications] Found', snapshot.docs.length, 'unread notifications');
            updateNotificationBadge(snapshot.docs.length);
        });

    } catch (error) {
        console.error('[Notifications] Error setting up listener:', error);
    }
}

// Send notification
export async function sendNotification(userId, title, message, type = 'info', data = {}) {
    try {
        console.log('[Notifications] Sending notification to', userId);

        const notificationData = {
            userId: userId,
            title: title,
            message: message,
            type: type, // 'info', 'success', 'warning', 'error', 'payment', 'message', 'rating', 'complaint'
            data: data,
            read: false,
            createdAt: Timestamp.now()
        };

        await addDoc(collection(db, 'notifications'), notificationData);
        console.log('[Notifications] Notification sent successfully');

    } catch (error) {
        console.error('[Notifications] Error sending notification:', error);
    }
}

// Send notification to multiple users
export async function sendBulkNotifications(userIds, title, message, type = 'info', data = {}) {
    try {
        console.log('[Notifications] Sending bulk notification to', userIds.length, 'users');
        
        const promises = userIds.map(userId => 
            sendNotification(userId, title, message, type, data)
        );

        await Promise.all(promises);
        console.log('[Notifications] Bulk notifications sent');

    } catch (error) {
        console.error('[Notifications] Error sending bulk notifications:', error);
    }
}

// Get all notifications for current user
export async function getUserNotifications(limit = 20) {
    try {
        if (!currentUser) {
            return [];
        }

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const notifications = [];

        snapshot.forEach(doc => {
            notifications.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return notifications.slice(0, limit);

    } catch (error) {
        console.error('[Notifications] Error getting notifications:', error);
        return [];
    }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId) {
    try {
        await updateDoc(doc(db, 'notifications', notificationId), {
            read: true
        });
        console.log('[Notifications] Marked as read:', notificationId);

    } catch (error) {
        console.error('[Notifications] Error marking as read:', error);
    }
}

// Mark all notifications as read
export async function markAllAsRead() {
    try {
        if (!currentUser) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            where('read', '==', false)
        );

        const snapshot = await getDocs(q);
        const batch = db.batch();

        snapshot.forEach(docSnapshot => {
            batch.update(doc(db, 'notifications', docSnapshot.id), {
                read: true
            });
        });

        await batch.commit();
        console.log('[Notifications] All marked as read');

    } catch (error) {
        console.error('[Notifications] Error marking all as read:', error);
    }
}

// Delete notification
export async function deleteNotification(notificationId) {
    try {
        await db.collection('notifications').doc(notificationId).delete();
        console.log('[Notifications] Deleted:', notificationId);

    } catch (error) {
        console.error('[Notifications] Error deleting notification:', error);
    }
}

// Update notification badge
function updateNotificationBadge(count) {
    const badges = document.querySelectorAll('[data-notification-badge]');
    
    badges.forEach(badge => {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    });

    console.log('[Notifications] Updated badge:', count);
}

// Display notification toast
export function showNotificationToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <strong>${title}</strong><br>
            <small>${message}</small>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    // Add styles if not already present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                padding: 16px;
                max-width: 350px;
                z-index: 10000;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
                animation: slideIn 0.3s ease-out;
                border-left: 4px solid #667eea;
            }

            .notification-success { border-left-color: #4caf50; }
            .notification-error { border-left-color: #f44336; }
            .notification-warning { border-left-color: #ff9800; }
            .notification-payment { border-left-color: #2196f3; }
            .notification-message { border-left-color: #9c27b0; }

            .toast-content {
                font-size: 13px;
                color: #333;
            }

            .toast-content strong {
                display: block;
                margin-bottom: 4px;
            }

            .toast-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #999;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .toast-close:hover {
                color: #333;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @media (max-width: 600px) {
                .notification-toast {
                    bottom: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Notification creation helpers

export async function notifyNewMessage(userId, senderName, conversationId) {
    await sendNotification(
        userId,
        '💬 New Message',
        `${senderName} sent you a message`,
        'message',
        { conversationId }
    );
}

export async function notifyPayment(workerId, employerName, amount, jobTitle) {
    await sendNotification(
        workerId,
        '💳 Payment Received',
        `${employerName} released ₹${amount} for "${jobTitle}"`,
        'payment',
        { amount, jobTitle }
    );
}

export async function notifyNewRating(userId, raterName, rating, jobTitle) {
    await sendNotification(
        userId,
        '⭐ New Rating',
        `${raterName} gave you ${rating} stars for "${jobTitle}"`,
        'rating',
        { rating, jobTitle }
    );
}

export async function notifyComplaint(userId, complaintReason) {
    await sendNotification(
        userId,
        '🚨 Complaint Filed',
        `A complaint has been filed: ${complaintReason.replace(/_/g, ' ')}`,
        'warning',
        { reason: complaintReason }
    );
}

export async function notifyJobPosted(workerId, jobTitle, employerName) {
    await sendNotification(
        workerId,
        '📢 New Job Posted',
        `${employerName} posted "${jobTitle}"`,
        'info',
        { jobTitle }
    );
}

export async function notifyApplicationAccepted(workerId, jobTitle, employerName) {
    await sendNotification(
        workerId,
        '✅ Application Accepted',
        `Your application for "${jobTitle}" has been accepted by ${employerName}`,
        'success',
        { jobTitle, employerName }
    );
}

export async function notifyApplicationRejected(workerId, jobTitle) {
    await sendNotification(
        workerId,
        '❌ Application Rejected',
        `Your application for "${jobTitle}" was not accepted. Keep trying!`,
        'warning',
        { jobTitle }
    );
}

// Cleanup
export function cleanupNotifications() {
    if (notificationUnsubscribe) {
        notificationUnsubscribe();
        console.log('[Notifications] Cleaned up');
    }
}

console.log('[Notifications] Module exported successfully');
