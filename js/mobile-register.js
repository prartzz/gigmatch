// Mobile-First Registration with OTP Verification
import { auth, db, waitForFirebase, createUserWithEmailAndPassword, sendEmailVerification, doc, setDoc, RecaptchaVerifier, signInWithPhoneNumber } from './firebase-config.js';

// State Management
let registrationState = {
    mobileNumber: '',
    confirmationResult: null,
    userRole: '',
    fullName: '',
    email: '',
    password: '',
    currentStep: 1
};

let recaptchaVerifier = null;

// Wait for Firebase to be ready before setting up handlers
waitForFirebase().then(() => {
    console.log('[MobileRegister] Firebase ready, setting up registration handlers...');
    setupMobileRegistrationHandlers();
});

function setupMobileRegistrationHandlers() {
    // DOM Elements
    const mobileNumberInput = document.getElementById('mobileNumber');
    const otpInput = document.getElementById('otpInput');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const registrationForm = document.getElementById('registrationForm');

    // Buttons
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const resendOtpLink = document.getElementById('resendOtpLink');
    const backToPhoneBtn = document.getElementById('backToPhone');
    const nextToEmailBtn = document.getElementById('nextToEmail');
    const backToOtpBtn = document.getElementById('backToOtp');
    const backToRoleBtn = document.getElementById('backToRole');

    // Step Elements
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const step4 = document.getElementById('step4');

    // Progress Indicators
    const prog1 = document.getElementById('prog1');
    const prog2 = document.getElementById('prog2');
    const prog3 = document.getElementById('prog3');
    const prog4 = document.getElementById('prog4');

    // Note: Using mock OTP for testing (no Firebase Phone Auth needed, no billing required)
    // Test OTP: 123456
    // To switch to real SMS later: uncomment reCAPTCHA init code and follow OTP_SETUP_GUIDE.md

    // ========== Step 1: Phone Number ==========
    sendOtpBtn.addEventListener('click', async () => {
        const phoneNumber = mobileNumberInput.value.trim();

        if (!phoneNumber || phoneNumber.length !== 10) {
            alert('Please enter a valid 10-digit mobile number');
            return;
        }

        if (!/^\d+$/.test(phoneNumber)) {
            alert('Mobile number should contain only digits');
            return;
        }

        registrationState.mobileNumber = phoneNumber;
        
        sendOtpBtn.classList.add('loading');
        sendOtpBtn.disabled = true;

        try {
            // MOCK OTP for testing (no billing needed)
            const phoneNumberFormatted = `+91${phoneNumber}`;
            console.log(`[MobileRegister] Test mode: OTP sent to ${phoneNumberFormatted}`);
            console.log('[MobileRegister] Test OTP: 123456');
            
            alert(`✅ Test OTP sent to ${phoneNumberFormatted}\n\n📝 Test OTP: 123456`);
            moveToStep(2);
            
        } catch (error) {
            console.error('[MobileRegister] Error:', error.message);
            alert(`Error: ${error.message}`);
        } finally {
            sendOtpBtn.classList.remove('loading');
            sendOtpBtn.disabled = false;
        }
    });
    verifyOtpBtn.addEventListener('click', async () => {
        const otp = otpInput.value.trim();

        if (!otp || otp.length !== 6) {
            alert('Please enter a valid 6-digit OTP');
            return;
        }

        if (!/^\d+$/.test(otp)) {
            alert('OTP should contain only digits');
            return;
        }

        verifyOtpBtn.classList.add('loading');
        verifyOtpBtn.disabled = true;

        try {
            // MOCK OTP verification for testing
            if (otp === '123456') {
                console.log('[MobileRegister] Test OTP verified successfully');
                alert('✅ Phone number verified successfully!');
                moveToStep(3);
            } else {
                alert('❌ Invalid OTP. Correct test OTP is 123456');
            }
            
        } catch (error) {
            console.error('[MobileRegister] Error verifying OTP:', error.message);
            alert(`Error: ${error.message}`);
        } finally {
            verifyOtpBtn.classList.remove('loading');
            verifyOtpBtn.disabled = false;
        }
    });

    resendOtpLink.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (!registrationState.mobileNumber) {
            alert('Please enter phone number first');
            moveToStep(1);
            return;
        }

        resendOtpLink.textContent = 'Resending...';
        resendOtpLink.style.pointerEvents = 'none';

        try {
            console.log('[MobileRegister] Resending test OTP');
            alert('✅ Test OTP resent: 123456');
            otpInput.value = '';
            otpInput.focus();
        } catch (error) {
            console.error('[MobileRegister] Error resending OTP:', error.message);
            alert(`Error: ${error.message}`);
        } finally {
            resendOtpLink.textContent = 'Resend OTP';
            resendOtpLink.style.pointerEvents = 'auto';
        }
    });

backToPhoneBtn.addEventListener('click', () => {
    otpInput.value = '';
    moveToStep(1);
});

// ========== Step 3: Role Selection ==========
nextToEmailBtn.addEventListener('click', () => {
    const selectedRole = document.querySelector('input[name="userRole"]:checked');

    if (!selectedRole) {
        alert('Please select your role');
        return;
    }

    registrationState.userRole = selectedRole.value;
    
    // Show admin code field if admin role is selected
    const adminCodeGroup = document.getElementById('adminCodeGroup');
    if (selectedRole.value === 'admin') {
        adminCodeGroup.style.display = 'block';
        document.getElementById('adminCode').focus();
    } else {
        adminCodeGroup.style.display = 'none';
        document.getElementById('adminCode').value = '';
    }
    
    moveToStep(4);
});

// Add event listener for role selection to show/hide admin code
document.querySelectorAll('input[name="userRole"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const adminCodeGroup = document.getElementById('adminCodeGroup');
        if (e.target.value === 'admin') {
            adminCodeGroup.style.display = 'block';
        } else {
            adminCodeGroup.style.display = 'none';
        }
    });
});

backToOtpBtn.addEventListener('click', () => {
    moveToStep(2);
});

// ========== Step 4: Email & Password ==========
registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const adminCode = document.getElementById('adminCode').value.trim();

    // Validation
    if (!fullName) {
        alert('Please enter your full name');
        return;
    }

    if (!email || !isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }

    if (!password || password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
    }

    if (!/[A-Z]/.test(password)) {
        alert('Password must contain at least one uppercase letter');
        return;
    }

    if (!/\d/.test(password)) {
        alert('Password must contain at least one number');
        return;
    }

    // Validate admin code if admin role selected
    if (registrationState.userRole === 'admin') {
        const ADMIN_CODE = 'ADMIN2026';
        if (adminCode !== ADMIN_CODE) {
            alert('❌ Invalid admin code. Please try again.');
            document.getElementById('adminCode').focus();
            return;
        }
        console.log('[MobileRegister] Admin code verified');
    }

    registrationState.fullName = fullName;
    registrationState.email = email;
    registrationState.password = password;

    // Create account
    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        // Create Firebase user
        const result = await createUserWithEmailAndPassword(auth, email, password);

        // Note: Email verification is optional during testing
        // Uncomment below line to enable email verification for production:
        // await sendEmailVerification(result.user);
        console.log('[MobileRegister] User created:', email);

        // Store user data in Firestore
        const userData = {
            uid: result.user.uid,
            fullName: fullName,
            email: email,
            mobileNumber: registrationState.mobileNumber,
            userType: registrationState.userRole,
            createdAt: new Date(),
            profileCompleted: false
        };

        // Add role field if admin
        if (registrationState.userRole === 'admin') {
            userData.role = 'admin';
        }

        await setDoc(doc(db, 'users', result.user.uid), userData);

        // Create role-specific profile
        if (registrationState.userRole === 'worker') {
            await setDoc(doc(db, 'workers', result.user.uid), {
                uid: result.user.uid,
                fullName: fullName,
                mobileNumber: registrationState.mobileNumber,
                createdAt: new Date()
            });
        } else if (registrationState.userRole === 'employer') {
            await setDoc(doc(db, 'employers', result.user.uid), {
                uid: result.user.uid,
                fullName: fullName,
                mobileNumber: registrationState.mobileNumber,
                createdAt: new Date()
            });
        } else if (registrationState.userRole === 'admin') {
            await setDoc(doc(db, 'admins', result.user.uid), {
                uid: result.user.uid,
                fullName: fullName,
                mobileNumber: registrationState.mobileNumber,
                role: 'admin',
                createdAt: new Date()
            });
        }

        alert('✅ Account created successfully!\\n\\nRedirecting to dashboard...');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);

    } catch (error) {
        console.error('Registration error:', error);
        alert('❌ Error creating account: ' + error.message);
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
});

backToRoleBtn.addEventListener('click', () => {
    moveToStep(3);
});

// ========== Utility Functions ==========

/**
 * Move to a specific step in the registration process
 */
function moveToStep(stepNumber) {
    // Hide all steps
    step1.classList.add('hidden');
    step2.classList.add('hidden');
    step3.classList.add('hidden');
    step4.classList.add('hidden');

    // Remove active state from all progress indicators
    prog1.classList.remove('active');
    prog2.classList.remove('active');
    prog3.classList.remove('active');
    prog4.classList.remove('active');

    // Show current step
    switch (stepNumber) {
        case 1:
            step1.classList.remove('hidden');
            prog1.classList.add('active');
            mobileNumberInput.focus();
            break;
        case 2:
            step2.classList.remove('hidden');
            prog1.classList.add('active');
            prog2.classList.add('active');
            otpInput.focus();
            break;
        case 3:
            step3.classList.remove('hidden');
            prog1.classList.add('active');
            prog2.classList.add('active');
            prog3.classList.add('active');
            break;
        case 4:
            step4.classList.remove('hidden');
            prog1.classList.add('active');
            prog2.classList.add('active');
            prog3.classList.add('active');
            prog4.classList.add('active');
            fullNameInput.focus();
            break;
    }

    registrationState.currentStep = stepNumber;
    
    // Scroll to top
    document.querySelector('.mobile-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Format mobile number input (auto insert space every 5 digits)
 */
mobileNumberInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) {
        value = value.slice(0, 10);
    }
    e.target.value = value;
});

/**
 * Format OTP input (only digits)
 */
otpInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 6) {
        value = value.slice(0, 6);
    }
    e.target.value = value;
});

/**
 * Prevent form submission on Enter key for navigation steps
 */
registrationForm.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && registrationState.currentStep < 4) {
        e.preventDefault();
    }
    });
} // End of setupMobileRegistrationHandlers

// ========== Utility Functions (Module Level) ==========

/**
 * Move to a specific step in the registration process
 */
function moveToStep(stepNumber) {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const step4 = document.getElementById('step4');
    const prog1 = document.getElementById('prog1');
    const prog2 = document.getElementById('prog2');
    const prog3 = document.getElementById('prog3');
    const prog4 = document.getElementById('prog4');
    const mobileNumberInput = document.getElementById('mobileNumber');
    const otpInput = document.getElementById('otpInput');
    const fullNameInput = document.getElementById('fullName');
    
    // Hide all steps
    step1.classList.add('hidden');
    step2.classList.add('hidden');
    step3.classList.add('hidden');
    step4.classList.add('hidden');

    // Remove active state from all progress indicators
    prog1.classList.remove('active');
    prog2.classList.remove('active');
    prog3.classList.remove('active');
    prog4.classList.remove('active');

    // Show current step
    switch (stepNumber) {
        case 1:
            step1.classList.remove('hidden');
            prog1.classList.add('active');
            mobileNumberInput.focus();
            break;
        case 2:
            step2.classList.remove('hidden');
            prog1.classList.add('active');
            prog2.classList.add('active');
            otpInput.focus();
            break;
        case 3:
            step3.classList.remove('hidden');
            prog1.classList.add('active');
            prog2.classList.add('active');
            prog3.classList.add('active');
            break;
        case 4:
            step4.classList.remove('hidden');
            prog1.classList.add('active');
            prog2.classList.add('active');
            prog3.classList.add('active');
            prog4.classList.add('active');
            fullNameInput.focus();
            break;
    }

    registrationState.currentStep = stepNumber;
    
    // Scroll to top
    document.querySelector('.mobile-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Initial setup
console.log('[MobileRegister] Mobile registration page loaded');
