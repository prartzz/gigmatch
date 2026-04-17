// Authentication Logic
import { auth, db, waitForFirebase, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, collection, doc, setDoc, query, where, getDocs } from './firebase-config.js';

// Admin setup code (hardcoded for security)
const ADMIN_CODE = 'ADMIN2026';

// Wait for Firebase to be ready before setting up listeners
waitForFirebase().then(() => {
    console.log('[Auth] Firebase ready, setting up auth listeners...');
    setupAuthHandlers();
    setupAdminOption();
});

async function setupAdminOption() {
    try {
        // Check if any admins exist
        const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
        const adminSnapshot = await getDocs(adminQuery);
        
        if (adminSnapshot.empty) {
            // No admins exist, show admin setup option
            const adminOption = document.getElementById('adminOption');
            if (adminOption) {
                adminOption.style.display = 'block';
                console.log('[Auth] No admins found - Admin Setup option enabled');
            }
        } else {
            console.log('[Auth] Admin exists - Admin Setup option disabled');
        }
    } catch (error) {
        console.error('[Auth] Error checking admin status:', error);
    }
}

function setupAuthHandlers() {
    // Handle role selection change
    const userTypeSelect = document.getElementById('userType');
    if (userTypeSelect) {
        userTypeSelect.addEventListener('change', (e) => {
            const adminCodeGroup = document.getElementById('adminCodeGroup');
            if (e.target.value === 'admin') {
                adminCodeGroup.style.display = 'block';
            } else {
                adminCodeGroup.style.display = 'none';
            }
        });
    }

    // Handle Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                await signInWithEmailAndPassword(auth, email, password);
                console.log('Login successful');
                // Redirect to dashboard after login
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Login error:', error.message);
                alert('Login failed: ' + error.message);
            }
        });
    }

    // Handle Registration
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const fullName = document.getElementById('fullName').value;
            const userType = document.getElementById('userType').value;
            
            try {
                // Validate admin code if admin setup
                if (userType === 'admin') {
                    const adminCode = document.getElementById('adminCode').value.trim();
                    if (adminCode !== ADMIN_CODE) {
                        alert('❌ Invalid admin code. Please try again.');
                        return;
                    }
                    console.log('[Auth] Admin code verified');
                }

                const result = await createUserWithEmailAndPassword(auth, email, password);
                
                // Store user data in Firestore
                const userData = {
                    fullName: fullName,
                    userType: userType === 'admin' ? 'admin' : userType,
                    email: email,
                    createdAt: new Date()
                };
                
                // Add role field if admin
                if (userType === 'admin') {
                    userData.role = 'admin';
                }
                
                await setDoc(doc(db, 'users', result.user.uid), userData);
                console.log('Registration successful');
                
                if (userType === 'admin') {
                    alert('✅ Admin account created successfully!');
                } else {
                    alert('Registration successful! Please login.');
                }
                
                // Redirect to dashboard for admin, login for others
                if (userType === 'admin') {
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = 'login.html';
                }
            } catch (error) {
                console.error('Registration error:', error.message);
                alert('Registration failed: ' + error.message);
            }
        });
    }

    // Check Authentication Status
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('User logged in:', user.email);
        } else {
            console.log('No user logged in');
        }
    });
}
