// Profile Management Logic
import { auth, db, waitForFirebase, doc, setDoc, getDoc, collection, query, where, getDocs, Timestamp } from './firebase-config.js';

let currentUserType = 'worker'; // will be determined from user data

// Format date
function formatDate(date) {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Load user profile based on role
async function loadUserProfile(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        currentUserType = userData.userType || 'worker';

        if (currentUserType === 'worker') {
            await loadWorkerProfile(userId, userData);
        } else {
            await loadEmployerProfile(userId, userData);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load and display worker profile
async function loadWorkerProfile(userId, userData) {
    const fullName = userData.fullName || 'Not set';
    const bio = userData.bio || 'No bio added';
    const skills = userData.skills ? userData.skills.join(', ') : 'Not specified';
    const experience = userData.experience ? userData.experience + ' years' : 'Not specified';
    const hourlyRate = userData.hourlyRate ? '₹' + userData.hourlyRate : 'Not specified';
    const location = userData.location || 'Not specified';
    const memberSince = formatDate(userData.createdAt);

    document.getElementById('displayName').textContent = fullName;
    document.getElementById('displayBio').textContent = bio;
    document.getElementById('displaySkills').textContent = skills;
    document.getElementById('displayExperience').textContent = experience;
    document.getElementById('displayRate').textContent = hourlyRate;
    document.getElementById('displayLocation').textContent = location;
    document.getElementById('displayMemberSince').textContent = memberSince;

    // Populate form for editing
    document.getElementById('fullName').value = userData.fullName || '';
    document.getElementById('bio').value = userData.bio || '';
    document.getElementById('skills').value = userData.skills ? userData.skills.join(', ') : '';
    document.getElementById('experience').value = userData.experience || '';
    document.getElementById('hourlyRate').value = userData.hourlyRate || '';
    document.getElementById('location').value = userData.location || '';

    // Load ratings
    await loadUserRatings(userId);
}

// Load and display employer profile
async function loadEmployerProfile(userId, userData) {
    const companyName = userData.fullName || 'Not set';
    const description = userData.bio || 'No description added';
    const email = userData.email || 'Not specified';
    const phone = userData.phone || 'Not specified';
    const location = userData.location || 'Not specified';
    const memberSince = formatDate(userData.createdAt);

    document.getElementById('displayName').textContent = companyName;
    document.getElementById('displayDescription').textContent = description;
    document.getElementById('displayEmail').textContent = email;
    document.getElementById('displayPhone').textContent = phone;
    document.getElementById('displayLocation').textContent = location;
    document.getElementById('displayMemberSince').textContent = memberSince;

    // Populate form for editing
    document.getElementById('companyName').value = userData.fullName || '';
    document.getElementById('companyDescription').value = userData.bio || '';
    document.getElementById('contactEmail').value = userData.email || '';
    document.getElementById('contactPhone').value = userData.phone || '';
    document.getElementById('location').value = userData.location || '';

    // Load ratings
    await loadUserRatings(userId);
}

// Load and display user ratings
async function loadUserRatings(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.data() || {};
        
        const ratingsSection = document.getElementById('ratingsSection');
        if (!ratingsSection) return;

        if (userData.averageRating) {
            ratingsSection.style.display = 'block';
            document.getElementById('avgRating').textContent = userData.averageRating.toFixed(1) + '/5';
            document.getElementById('totalReviews').textContent = userData.totalRatings || 0;

            if (userData.categoryRatings) {
                const categories = userData.categoryRatings;
                document.getElementById('categoryRatings').innerHTML = `
                    <p>💬 Communication: ${categories.communication || '-'}/5</p>
                    <p>✨ Quality: ${categories.quality || '-'}/5</p>
                    <p>⏱️ Timeliness: ${categories.timeliness || '-'}/5</p>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading ratings:', error);
    }
}

// Toggle between view and edit mode
function toggleEditMode() {
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');

    if (viewMode && editMode) {
        if (viewMode.style.display === 'none') {
            // Switch to view mode
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
        } else {
            // Switch to edit mode
            viewMode.style.display = 'none';
            editMode.style.display = 'block';
        }
    }
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await waitForFirebase();
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                await loadUserProfile(user.uid);
                setupEventListeners();
            } else {
                console.error('User not authenticated');
                window.location.href = 'login.html';
            }
        });
    } catch (e) {
        console.error('Error initializing Firebase on profile page:', e);
    }
});

// Setup event listeners
function setupEventListeners() {
    // Edit button
    const editBtn = document.getElementById('editBtn');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleEditMode();
        });
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleEditMode();
        });
    }

    // Handle Worker Profile
    const workerProfileForm = document.getElementById('workerProfileForm');
    if (workerProfileForm) {
        workerProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = auth.currentUser.uid;

            const profileData = {
                fullName: document.getElementById('fullName').value,
                bio: document.getElementById('bio').value,
                skills: document.getElementById('skills').value.split(',').map(s => s.trim()).filter(s => s),
                experience: parseInt(document.getElementById('experience').value) || 0,
                hourlyRate: parseFloat(document.getElementById('hourlyRate').value) || 0,
                location: document.getElementById('location').value,
                updatedAt: Timestamp.now()
            };
            
            try {
                await setDoc(doc(db, 'users', userId), profileData, { merge: true });
                alert('✅ Profile saved successfully!');
                
                // Reload profile data and switch to view mode
                await loadUserProfile(userId);
                toggleEditMode();
            } catch (error) {
                console.error('Profile error:', error.message);
                alert('❌ Error saving profile: ' + error.message);
            }
        });
    }

    // Handle Employer Profile
    const employerProfileForm = document.getElementById('employerProfileForm');
    if (employerProfileForm) {
        employerProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = auth.currentUser.uid;

            const profileData = {
                fullName: document.getElementById('companyName').value,
                bio: document.getElementById('companyDescription').value,
                email: document.getElementById('contactEmail').value,
                phone: document.getElementById('contactPhone').value,
                location: document.getElementById('location').value,
                updatedAt: Timestamp.now()
            };
            
            try {
                await setDoc(doc(db, 'users', userId), profileData, { merge: true });
                alert('✅ Profile saved successfully!');
                
                // Reload profile data and switch to view mode
                await loadUserProfile(userId);
                toggleEditMode();
            } catch (error) {
                console.error('Profile error:', error.message);
                alert('❌ Error saving profile: ' + error.message);
            }
        });
    }
}
