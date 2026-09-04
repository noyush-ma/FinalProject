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

function buildCategoryFilter(locations) {
    const container = document.getElementById('mapCategoryFilter');
    if (!container) return;
    container.innerHTML = '';

    const categories = [...new Set(locations.map(loc => loc.category).filter(Boolean))];
    if (categories.length === 0) return;

    const allBtn = document.createElement('button');
    allBtn.className = 'map-filter-btn active';
    allBtn.textContent = 'הכל';
    allBtn.onclick = () => selectCategory('all', allBtn);
    container.appendChild(allBtn);

    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'map-filter-btn';
        btn.textContent = category;
        btn.onclick = () => selectCategory(category, btn);
        container.appendChild(btn);
    });
}

function selectCategory(category, clickedBtn) {
    document.querySelectorAll('.map-filter-btn').forEach(b => b.classList.remove('active'));
    clickedBtn.classList.add('active');

    const filtered = category === 'all'
        ? allLocations
        : allLocations.filter(loc => loc.category === category);

    renderMarkers(filtered);
    fitMapToMarkers(filtered);
}
