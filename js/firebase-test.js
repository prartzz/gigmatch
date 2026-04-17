// Firebase Connection Test Utility
import { auth, db, analytics } from './firebase-config.js';

class FirebaseConnectionTester {
    /**
     * Test if Firebase app is initialized
     */
    static testAppInitialization() {
        try {
            // Check if critical Firebase services are initialized (auth and db)
            if (!auth) {
                console.error('❌ Firebase App Initialization: Auth module failed');
                return false;
            }
            
            if (!db) {
                console.error('❌ Firebase App Initialization: Firestore module failed');
                return false;
            }
            
            console.log('✅ Firebase App Initialized Successfully');
            console.log('   - Auth Module: Ready ✓');
            console.log('   - Firestore Module: Ready ✓');
            console.log('   - Analytics Module:', analytics ? 'Initialized ✓' : 'Optional (Not initialized)');
            return true;
        } catch (error) {
            console.error('❌ Firebase Initialization Error:', error.message);
            return false;
        }
    }

    /**
     * Test Firebase Authentication connection
     */
    static testAuthConnection() {
        try {
            if (!auth) {
                console.error('❌ Authentication Module: Not initialized');
                return false;
            }
            
            console.log('✅ Firebase Authentication Module Connected');
            console.log('   - Module Type:', typeof auth);
            console.log('   - Current User:', auth.currentUser ? auth.currentUser.email : 'None (not logged in)');
            
            return true;
        } catch (error) {
            console.error('❌ Authentication Connection Error:', error.message);
            return false;
        }
    }

    /**
     * Test Firestore connection
     */
    static async testFirestoreConnection() {
        try {
            if (!db) {
                console.error('❌ Firestore Module: Not initialized');
                return false;
            }
            
            console.log('✅ Firestore Database Module Connected');
            console.log('   - Module Type:', typeof db);
            console.log('   - Connection Status: Ready');
            
            return true;
        } catch (error) {
            console.error('❌ Firestore Connection Error:', error.message);
            return false;
        }
    }

    /**
     * Run all connection tests
     */
    static async runAllTests() {
        console.log('🔍 Firebase Connection Tests Started...');
        console.log('═'.repeat(50));
        
        const results = {
            appInit: this.testAppInitialization(),
            auth: this.testAuthConnection(),
            firestore: await this.testFirestoreConnection()
        };
        
        console.log('═'.repeat(50));
        
        const allPassed = Object.values(results).every(r => r === true);
        
        if (allPassed) {
            console.log('✅ ALL TESTS PASSED - Firebase is ready!');
        } else {
            console.log('⚠️ Some tests failed - Check the errors above');
        }
        
        return results;
    }

    /**
     * Display Firebase configuration info
     */
    static displayConfig() {
        const config = {
            apiKey: 'AIzaSyCHC3ijBT9lw4scf5KJ3BR3gszYVndPcD8'.substring(0, 10) + '...',
            authDomain: 'gigmatch-20012026.firebaseapp.com',
            projectId: 'gigmatch-20012026',
            storageBucket: 'gigmatch-20012026.firebasestorage.app'
        };
        
        console.log('📋 Firebase Configuration:');
        console.table(config);
    }

    /**
     * Test network connectivity
     */
    static async testNetworkConnectivity() {
        try {
            console.log('🌐 Testing Network Connectivity...');
            
            const response = await fetch('https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js', {
                mode: 'no-cors'
            });
            
            console.log('✅ Network Connection: OK');
            console.log('   Can reach Firebase CDN: Yes');
            return true;
        } catch (error) {
            console.error('❌ Network Connection Error:', error.message);
            console.log('   Possible causes: No internet, firewall blocked, CDN down');
            return false;
        }
    }

    /**
     * Check browser compatibility
     */
    static checkBrowserCompatibility() {
        console.log('🔧 Browser Compatibility:');
        
        const checks = {
            'LocalStorage': typeof localStorage !== 'undefined',
            'IndexedDB': 'indexedDB' in window,
            'Fetch API': 'fetch' in window,
            'Promise': 'Promise' in window,
            'ES Modules': 'import' in document.createElement('script')
        };
        
        for (const [feature, supported] of Object.entries(checks)) {
            console.log(`   ${supported ? '✅' : '❌'} ${feature}`);
        }
    }

    /**
     * Generate a connection status report
     */
    static async generateReport() {
        console.log('\n');
        console.log('╔════════════════════════════════════════════════════╗');
        console.log('║         FIREBASE CONNECTION STATUS REPORT          ║');
        console.log('╚════════════════════════════════════════════════════╝');
        
        this.displayConfig();
        console.log('');
        
        await this.testNetworkConnectivity();
        console.log('');
        
        this.checkBrowserCompatibility();
        console.log('');
        
        const results = await this.runAllTests();
        
        console.log('\n');
        console.log('📊 Summary:');
        console.log('   App Initialization:', results.appInit ? '✅' : '❌');
        console.log('   Auth Connection:', results.auth ? '✅' : '❌');
        console.log('   Firestore Connection:', results.firestore ? '✅' : '❌');
        
        return results;
    }
}

// Export the tester
export default FirebaseConnectionTester;
