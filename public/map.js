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
