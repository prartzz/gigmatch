import { auth, db, waitForFirebase, collection, query, where, getDocs, orderBy, limit, doc, getDoc } from './firebase-config.js';

let allJobs = [];
let filteredJobs = [];
let isMapView = false;
let map = null;
let markers = [];
let userBookmarks = [];

// Pagination State
let currentPage = 1;
const jobsPerPage = 8;

// Geocoding Cache to prevent hitting API limits
const geocodeCache = {
    'bangalore': { lat: 12.9716, lng: 77.5946 },
    'bengaluru': { lat: 12.9716, lng: 77.5946 },
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'delhi': { lat: 28.7041, lng: 77.1025 },
    'new delhi': { lat: 28.7041, lng: 77.1025 },
    'hyderabad': { lat: 17.3850, lng: 78.4867 },
    'chennai': { lat: 13.0827, lng: 80.2707 },
    'pune': { lat: 18.5204, lng: 73.8567 },
    'kolkata': { lat: 22.5726, lng: 88.3639 }
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await waitForFirebase();
        console.log('[Discover] Firebase ready, loading jobs...');

        // Fetch user bookmarks if logged in
        if (auth.currentUser) {
            try {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    userBookmarks = userSnap.data().bookmarkedJobs || [];
                }
            } catch (e) {
                console.error('Failed to load bookmarks', e);
            }
        }

        await loadJobs();
    } catch (error) {
        console.error('[Discover] Error waiting for Firebase:', error);
    }

    // Setup rate slider handler with real-time filtering
    const rateFilter = document.getElementById('rateFilter');
    if (rateFilter) {
        rateFilter.addEventListener('input', (e) => {
            document.getElementById('rateValue').textContent = e.target.value;
            applyFilters();
        });
    }

    // Setup checkbox listeners for real-time filtering
    ['same-day', 'few-days', 'one-week', 'ongoing'].forEach(dur => {
        const checkbox = document.getElementById(`duration-${dur}`);
        if (checkbox) {
            checkbox.addEventListener('change', applyFilters);
        }
    });

    // Setup text input listener for location
    const locationFilter = document.getElementById('locationFilter');
    if (locationFilter) {
        locationFilter.addEventListener('input', applyFilters);
    }
});

async function loadJobs() {
    const jobsContainer = document.getElementById('jobsContainer');
    jobsContainer.innerHTML = '<p style="text-align:center; padding: 40px;">Loading jobs...</p>';

    try {
        console.log('[Discover] Firebase db check:', window.db ? 'EXISTS' : 'NULL');
        const jobsCollection = collection(window.db || db, 'jobs');
        console.log('[Discover] Querying jobs collection...');
        
        const q = query(
            jobsCollection,
            where('status', '==', 'active')
        );

        console.log('[Discover] Executing query...');
        const querySnapshot = await getDocs(q);
        console.log('[Discover] Query returned:', querySnapshot.size, 'jobs');
        
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

        filteredJobs = allJobs;
        renderJobs();

    } catch (error) {
        console.error('Error loading jobs:', error);
        jobsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #e53e3e;">
                <p>Error loading jobs. Please try again.</p>
                <p style="font-size: 12px;">${error.message}</p>
            </div>
        `;
    }
}

function renderJobs() {
    const jobsContainer = document.getElementById('jobsContainer');
    const jobCount = document.getElementById('jobCount');
    const paginationContainer = document.getElementById('paginationContainer');

    jobCount.textContent = filteredJobs.length;

    if (filteredJobs.length === 0) {
        jobsContainer.innerHTML = `
            <div class="no-jobs" style="grid-column: 1 / -1;">
                <div class="no-jobs-icon">🔍</div>
                <h3>No jobs found</h3>
                <p>Try adjusting your filters to find more opportunities</p>
            </div>
        `;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const startIndex = (currentPage - 1) * jobsPerPage;
    const paginatedJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);

    jobsContainer.innerHTML = paginatedJobs.map(job => `
        <div class="job-card" onclick="openJobDetail('${job.id}')">
            <div class="job-card-header">
                <div class="job-card-title">
                    <h3>
                        ${escapeHtml(job.title)}
                        ${userBookmarks.includes(job.id) ? '<span style="color: #ecc94b; margin-left: 8px;" title="Bookmarked">★</span>' : ''}
                    </h3>
                    <p>${escapeHtml(job.category)} • ${job.daysAgo === 0 ? 'Today' : job.daysAgo + ' days ago'}</p>
                </div>
                <div class="job-card-rate">
                    <div class="rate">₹${job.hourlyRate}</div>
                    <div class="rate-period">per hour</div>
                </div>
            </div>

            <p class="job-card-description">${escapeHtml(job.description)}</p>

            <div class="job-card-meta">
                <div class="job-meta-item">📍 ${escapeHtml(job.location)}</div>
                <div class="job-meta-item">⏱️ ${formatDuration(job.duration)}</div>
                <div class="job-meta-item">👥 ${job.applicationsCount || 0} applications</div>
            </div>

            <div class="job-skills">
                ${job.requiredSkills.slice(0, 4).map(skill => 
                    `<div class="job-skill-tag">${escapeHtml(skill)}</div>`
                ).join('')}
                ${job.requiredSkills.length > 4 ? `<div class="job-skill-tag">+${job.requiredSkills.length - 4} more</div>` : ''}
            </div>

            <div class="job-card-footer">
                <div class="employer-info">
                    <div class="employer-avatar">${getInitials(job.employerName || 'E')}</div>
                    <span>${escapeHtml(job.employerName || 'Anonymous Employer')}</span>
                </div>
                <button class="apply-btn" onclick="event.stopPropagation(); openJobDetail('${job.id}')">View Details</button>
            </div>
        </div>
    `).join('');

    renderPagination();

    if (isMapView) {
        updateMapMarkers(paginatedJobs);
    }
}

function renderPagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    if (currentPage < totalPages) {
        html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})">Next &raquo;</button>`;
    }
    
    paginationContainer.innerHTML = html;
}

window.goToPage = function(page) {
    currentPage = page;
    renderJobs();
    document.querySelector('.discover-header').scrollIntoView({ behavior: 'smooth' });
};

window.toggleView = function() {
    isMapView = !isMapView;
    const viewToggleBtn = document.getElementById('viewToggleBtn');
    const jobsContainer = document.getElementById('jobsContainer');
    const mapContainer = document.getElementById('mapContainer');

    if (isMapView) {
        viewToggleBtn.textContent = 'Show List View 📋';
        jobsContainer.style.display = 'none';
        mapContainer.style.display = 'block';
        if (!map) initMap();
        else map.invalidateSize();
        
        const startIndex = (currentPage - 1) * jobsPerPage;
        const paginatedJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);
        updateMapMarkers(paginatedJobs);
    } else {
        viewToggleBtn.textContent = 'Show Map View 🗺️';
        jobsContainer.style.display = 'flex';
        mapContainer.style.display = 'none';
    }
};

function initMap() {
    // Default center to India (Bangalore region)
    map = L.map('mapContainer').setView([12.9716, 77.5946], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

async function updateMapMarkers(jobsToShow) {
    if (!map) return;
    
    // Clear existing markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const bounds = L.latLngBounds();

    for (const job of jobsToShow) {
        let lat = job.lat;
        let lng = job.lng;
        
        if (!lat || !lng) {
            const locKey = job.location.toLowerCase().split(',')[0].trim();
            if (geocodeCache[locKey]) {
                // Use cache with slight offset to prevent exact overlapping of multiple jobs in same city
                lat = geocodeCache[locKey].lat + (Math.random() - 0.5) * 0.05;
                lng = geocodeCache[locKey].lng + (Math.random() - 0.5) * 0.05;
            } else {
                try {
                    // Fetch real coordinates from Nominatim OpenStreetMap API
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(job.location)}`);
                    const data = await response.json();
                    
                    if (data && data.length > 0) {
                        lat = parseFloat(data[0].lat);
                        lng = parseFloat(data[0].lon);
                        geocodeCache[locKey] = { lat, lng }; // Store in cache for future
                    } else {
                        // Fallback to Bangalore if API fails to find it
                        lat = 12.9716 + (Math.random() - 0.5) * 0.1;
                        lng = 77.5946 + (Math.random() - 0.5) * 0.1;
                    }
                } catch (error) {
                    console.error("Geocoding API error for", job.location, error);
                    lat = 12.9716; lng = 77.5946;
                }
            }
        }
        
        const marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup(`
            <div style="min-width: 200px;">
                <strong style="font-size: 16px; color: #4f46e5;">${escapeHtml(job.title)}</strong><br>
                <span style="color: #6b7280;">₹${job.hourlyRate}/hr</span><br>
                <span style="font-size: 12px; display:block; margin: 8px 0;">📍 ${escapeHtml(job.location)}</span>
                <button onclick="window.openJobDetail('${job.id}')" style="width: 100%; padding: 6px; background: #6366f1; color: white; border: none; border-radius: 4px; cursor: pointer;">View Job</button>
            </div>
        `);
        markers.push(marker);
        bounds.extend([lat, lng]);
    }

    if (markers.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}


window.applyFilters = function() {
    const category = document.getElementById('categoryFilter').value.trim();
    const location = document.getElementById('locationFilter').value.trim().toLowerCase();
    const maxRate = parseInt(document.getElementById('rateFilter').value) || 5000;
    const sort = document.getElementById('sortBy').value;
    
    const savedFilterCb = document.getElementById('savedFilter');
    const showSavedOnly = savedFilterCb ? savedFilterCb.checked : false;

    // Get checked duration filters
    const durations = [];
    ['same-day', 'few-days', 'one-week', 'ongoing'].forEach(dur => {
        const checkbox = document.getElementById(`duration-${dur}`);
        if (checkbox && checkbox.checked) {
            durations.push(dur);
        }
    });

    console.log('[Discover] Applying filters:', { category, location, maxRate, durations, sort });

    // Apply filters
    filteredJobs = allJobs.filter(job => {
        // Saved filter
        if (showSavedOnly && !userBookmarks.includes(job.id)) {
            return false;
        }

        // Category filter
        if (category && job.category.toLowerCase() !== category.toLowerCase()) {
            return false;
        }

        // Location filter
        if (location && !job.location.toLowerCase().includes(location)) {
            return false;
        }

        // Rate filter
        if (job.hourlyRate > maxRate) {
            return false;
        }

        // Duration filter
        if (durations.length > 0) {
            const jobDuration = (job.duration || '').toLowerCase().trim();
            if (!durations.includes(jobDuration)) {
                return false;
            }
        }

        return true;
    });

    console.log(`[Discover] Filtered to ${filteredJobs.length} jobs from ${allJobs.length}`);

    // Reset to page 1 when filters change
    currentPage = 1;

    // Apply sorting
    if (sort === 'newest') {
        filteredJobs.sort((a, b) => {
            const timeA = a.createdAt?.toDate?.() || new Date(0);
            const timeB = b.createdAt?.toDate?.() || new Date(0);
            return timeB - timeA;
        });
    } else if (sort === 'rate-high') {
        filteredJobs.sort((a, b) => b.hourlyRate - a.hourlyRate);
    } else if (sort === 'rate-low') {
        filteredJobs.sort((a, b) => a.hourlyRate - b.hourlyRate);
    }

    renderJobs();
};

window.resetFilters = function() {
    document.getElementById('categoryFilter').value = '';
    document.getElementById('locationFilter').value = '';
    document.getElementById('rateFilter').value = '5000';
    document.getElementById('rateValue').textContent = '5000';
    document.getElementById('sortBy').value = 'newest';

    const savedFilterCb = document.getElementById('savedFilter');
    if (savedFilterCb) savedFilterCb.checked = false;

    ['same-day', 'few-days', 'one-week', 'ongoing'].forEach(dur => {
        const elem = document.getElementById(`duration-${dur}`);
        if (elem) elem.checked = false;
    });

    filteredJobs = allJobs;
    renderJobs();
};

window.openJobDetail = function(jobId) {
    window.location.href = `job-detail.html?id=${jobId}`;
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

function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
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