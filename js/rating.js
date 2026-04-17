import { auth, db, waitForFirebase, doc, getDoc, setDoc, collection, addDoc, updateDoc, Timestamp, query, where, getDocs } from './firebase-config.js';
import { sendNotification } from './notifications.js';

console.log('[Rating] Script loaded');

let jobData = null;
let currentUser = null;
let ratings = {
    overall: 0,
    communication: 0,
    quality: 0,
    timeliness: 0
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Rating] Page loaded - waiting for Firebase');
    
    try {
        await waitForFirebase();
        console.log('[Rating] Firebase ready');
        
        if (!auth.currentUser) {
            console.error('[Rating] User not authenticated');
            window.location.href = 'login.html';
            return;
        }

        currentUser = auth.currentUser;
        console.log('[Rating] User authenticated:', currentUser.email);

        // Get job ID from URL
        const params = new URLSearchParams(window.location.search);
        const jobId = params.get('jobId');
        const ratedUserId = params.get('ratedUserId');
        window.appId = params.get('appId'); // Capture lifecycle ID

        if (!jobId || !ratedUserId) {
            showMessage('Missing job or user information', 'error');
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
            return;
        }

        // Load job details
        await loadJobDetails(jobId, ratedUserId);

    } catch (error) {
        console.error('[Rating] Error:', error);
        showMessage('Failed to load rating page', 'error');
    }
});

async function loadJobDetails(jobId, ratedUserId) {
    try {
        console.log('[Rating] Loading job:', jobId);
        
        const jobDoc = await getDoc(doc(db, 'jobs', jobId));
        
        if (!jobDoc.exists()) {
            console.error('[Rating] Job not found');
            showMessage('Job not found', 'error');
            return;
        }

        jobData = jobDoc.data();
        jobData.id = jobId;

        // Get user details for the rated person
        let providerName = 'User';
        if (window.appId) {
            const appDoc = await getDoc(doc(db, 'applications', window.appId));
            if (appDoc.exists()) {
                const appData = appDoc.data();
                providerName = appData.workerId === ratedUserId ? appData.workerName : 'Employer';
            }
        }

        console.log('[Rating] Job loaded:', jobData.title);

        // Populate form
        document.getElementById('jobTitle').textContent = jobData.title || jobData.jobTitle || 'GigMatch Job';
        document.getElementById('jobDuration').textContent = jobData.duration || 'Standard Session';
        document.getElementById('providerName').textContent = providerName;

        // Store ratedUserId for later
        document.querySelector('input[name="ratedUserId"]') || (() => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'ratedUserId';
            input.value = ratedUserId;
            document.getElementById('ratingForm').appendChild(input);
        })();

    } catch (error) {
        console.error('[Rating] Error loading job:', error);
        showMessage('Error loading job details', 'error');
    }
}

window.initializeRatingForm = function() {
    console.log('[Rating] Form initialized');
}

window.submitRating = async function() {
    try {
        // Get ratings
        ratings.overall = parseInt(document.getElementById('overallStars').dataset.rating) || 0;
        ratings.communication = parseInt(document.querySelector('[data-category="communication"]')?.dataset.rating) || 0;
        ratings.quality = parseInt(document.querySelector('[data-category="quality"]')?.dataset.rating) || 0;
        ratings.timeliness = parseInt(document.querySelector('[data-category="timeliness"]')?.dataset.rating) || 0;

        // Validate
        if (!ratings.overall || ratings.overall < 1 || ratings.overall > 5) {
            showMessage('Please provide an overall rating', 'error');
            return;
        }

        const review = document.getElementById('review').value.trim();
        const ratedUserId = document.querySelector('input[name="ratedUserId"]').value;

        console.log('[Rating] Submitting rating:', {
            jobId: jobData.id,
            ratedUserId: ratedUserId,
            overall: ratings.overall,
            review: review
        });

        // Disable button
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        // Determine user role
        const userRole = await getUserRole(currentUser.uid);
        const ratedUserRole = await getUserRole(ratedUserId);

        // Create rating document
        const ratingData = {
            jobId: jobData.id,
            ratedById: currentUser.uid,
            ratedByName: currentUser.displayName || 'Anonymous',
            ratedByRole: userRole,
            ratedUserId: ratedUserId,
            ratedUserName: 'User', // Will be updated with actual name
            ratedUserRole: ratedUserRole,
            rating: ratings.overall,
            review: review,
            categories: {
                communication: ratings.communication,
                quality: ratings.quality,
                timeliness: ratings.timeliness
            },
            createdAt: Timestamp.now(),
            helpful: 0
        };

        // Save to Firestore
        const docRef = await addDoc(collection(db, 'ratings'), ratingData);
        console.log('[Rating] Rating saved:', docRef.id);

        // Update user's average rating
        await updateUserAverageRating(ratedUserId);

        // Send notification to rated user
        try {
            await sendNotification(
                ratedUserId,
                `⭐ You received a ${ratings.overall}-star rating from ${currentUser.displayName}`,
                'Rating',
                { jobId: jobData.id, rating: ratings.overall }
            );
            console.log('[Rating] Notification sent to rated user');
        } catch (notifError) {
            console.warn('[Rating] Error sending notification:', notifError);
        }

        // Show success message
        showMessage('✅ Rating submitted successfully! Redirecting to Payment...', 'success');
        
        // Redirect to payment portal after 2 seconds
        setTimeout(() => {
            window.location.href = `payment.html?jobId=${jobData.id}&ratedUserId=${ratedUserId}&appId=${window.appId}`;
        }, 1500);

    } catch (error) {
        console.error('[Rating] Error submitting rating:', error);
        showMessage('Error submitting rating: ' + error.message, 'error');
        
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Rating';
    }
}

async function getUserRole(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return userDoc.data().role || 'user';
        }
    } catch (error) {
        console.error('[Rating] Error getting user role:', error);
    }
    return 'user';
}

async function updateUserAverageRating(userId) {
    try {
        // Get all ratings for this user
        const q = query(collection(db, 'ratings'), where('ratedUserId', '==', userId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log('[Rating] No ratings found for user');
            return;
        }

        // Calculate average
        let total = 0;
        let count = 0;
        let totalCommunication = 0;
        let totalQuality = 0;
        let totalTimeliness = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            total += data.rating || 0;
            count++;
            totalCommunication += data.categories?.communication || 0;
            totalQuality += data.categories?.quality || 0;
            totalTimeliness += data.categories?.timeliness || 0;
        });

        const averageRating = count > 0 ? (total / count).toFixed(2) : 0;
        
        // Update user profile
        await updateDoc(doc(db, 'users', userId), {
            averageRating: parseFloat(averageRating),
            totalRatings: count,
            categoryRatings: {
                communication: (totalCommunication / count).toFixed(2),
                quality: (totalQuality / count).toFixed(2),
                timeliness: (totalTimeliness / count).toFixed(2)
            }
        });

        console.log('[Rating] User average rating updated:', averageRating);

    } catch (error) {
        console.error('[Rating] Error updating user rating:', error);
    }
}

function showMessage(message, type) {
    console.log(`[Rating] [${type.toUpperCase()}] ${message}`);
    
    const errorMsg = document.getElementById('errorMsg');
    const successMsg = document.getElementById('successMsg');

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

console.log('[Rating] Module loaded successfully');
