const loggedInUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
if (!loggedInUser) {
    window.location.href = 'login.html';
}

let map = null;
let allLocations = [];
let currentMarkers = [];

const DEFAULT_CENTER = [32.0853, 34.7818]; // תל אביב (ב-Leaflet מעבירים מערך [lat, lng])
const DEFAULT_ZOOM = 12;

function applyDarkModeFromStorage() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        const btn = document.getElementById('darkModeBtn');
        if (btn) btn.innerText = '☀️';
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    const btn = document.getElementById('darkModeBtn');
    if (btn) btn.innerText = isDark ? '☀️' : '🌙';
}

document.addEventListener('DOMContentLoaded', () => {
    applyDarkModeFromStorage();
    initMap(); // אתחול המפה מיד כשה-DOM מוכן
});

// --- אתחול המפה עם Leaflet ו-OpenStreetMap ---
function initMap() {
    map = L.map('mapContainer').setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    // הוספת שכבת העיצוב של המפה (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    loadLocationsFromDB();
}

async function loadLocationsFromDB() {
    const loadingMsg = document.getElementById('mapLoadingMsg');
    const errorMsg = document.getElementById('mapErrorMsg');

    try {
        const res = await fetch('/api/locations');
        if (!res.ok) throw new Error('שגיאת שרת');

        allLocations = await res.json();

        if (loadingMsg) loadingMsg.style.display = 'none';
        if (errorMsg) errorMsg.style.display = 'none';

        buildCategoryFilter(allLocations);
        renderMarkers(allLocations);
        fitMapToMarkers(allLocations);
    } catch (err) {
        console.error('שגיאה בטעינת המיקומים:', err);
        if (loadingMsg) loadingMsg.style.display = 'none';
        if (errorMsg) errorMsg.style.display = 'block';
    }
}
