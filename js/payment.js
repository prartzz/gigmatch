import { auth, db, waitForFirebase, doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, Timestamp } from './firebase-config.js';

let currentJobId = null;
let currentWorkerId = null;
let currentAppId = null;
let jobData = null;
let appData = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await waitForFirebase();

        // Ensure user is logged in
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'login.html';
                return;
            }

            const params = new URLSearchParams(window.location.search);
            currentJobId = params.get('jobId');
            currentWorkerId = params.get('ratedUserId');
            currentAppId = params.get('appId');

            if (!currentJobId || !currentWorkerId || !currentAppId) {
                showMessage('Missing transaction context. Returning to dashboard...', 'error');
                setTimeout(() => window.location.href = 'dashboard.html', 2500);
                return;
            }

            await loadTransactionDetails();
        });

    } catch (error) {
        console.error('[Payment] Setup error:', error);
        showMessage('Error initializing payment portal.', 'error');
    }
});

async function loadTransactionDetails() {
    try {
        // Load job and app data
        const jobDoc = await getDoc(doc(db, 'jobs', currentJobId));
        const appDoc = await getDoc(doc(db, 'applications', currentAppId));

        if (!jobDoc.exists() || !appDoc.exists()) {
            throw new Error('Data not found');
        }

        jobData = jobDoc.data();
        appData = appDoc.data();

        // Populate receipt
        document.getElementById('workerName').textContent = appData.workerName || 'Worker';
        document.getElementById('jobTitle').textContent = jobData.title || appData.jobTitle || 'GigMatch Job';
        
        const rate = jobData.hourlyRate || appData.jobRate || '0';
        document.getElementById('hourlyRate').textContent = `₹${rate}/hr`;
        
        // Let's assume standard 1 hour completion for now unless a logged duration exists
        document.getElementById('totalDue').textContent = `₹${rate}`;

    } catch (error) {
        console.error('[Payment] Error loading details:', error);
        showMessage('Error loading payment details.', 'error');
    }
}

window.processPayment = async function() {
    if (!confirm('Are you sure you want to release the payment and complete the job?')) return;

    const confirmBtn = document.getElementById('confirmBtn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Processing Payment...';

    try {
        // 1. Close the loop in Applications and Assignments
        await updateDoc(doc(db, 'applications', currentAppId), {
            status: 'completed',
            completedAt: Timestamp.now(),
            paymentMethod: typeof selectedMethod !== 'undefined' ? selectedMethod : 'cash'
        });

        const assignmentsRef = collection(db, 'assignments');
        const assignmentQ = query(assignmentsRef, where('applicationId', '==', currentAppId));
        const assignSnapshot = await getDocs(assignmentQ);
        for (const assignDoc of assignSnapshot.docs) {
            await updateDoc(doc(db, 'assignments', assignDoc.id), { status: 'completed' });
        }

        // 2. Draft Final Payment Release Message
        let methodMessage = selectedMethod === 'cash' ? "via Direct Cash" : "via Online Escrow Transfer";
        const notifyMsg = `💸 Payment Released: A payment of ${document.getElementById('totalDue').textContent} has been released ${methodMessage} for completing "${jobData.title}".`;

        // 3. Dispatch Notification
        await sendNotification(currentWorkerId, notifyMsg, 'payment_released', { jobId: currentJobId });

        showMessage('✅ Payment successfully disbursed! The gig is fully completed.', 'success');

        // Allow UX display before returning out
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);

    } catch (error) {
        console.error('[Payment] Processing Error:', error);
        showMessage('Payment processing failed. Try again.', 'error');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm & Complete Job';
    }
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
        console.error('[Payment] Notify error:', error);
    }
}

function showMessage(msg, type) {
    const errorEl = document.getElementById('errorMsg');
    const successEl = document.getElementById('successMsg');
    
    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    if (type === 'error') {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
    } else {
        successEl.textContent = msg;
        successEl.style.display = 'block';
    }
}
