const loggedInUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
if (!loggedInUser) {
    window.location.href = 'login.html';
}

let map = null;
let allLocations = [];
let currentMarkers = [];

const DEFAULT_CENTER = [32.0853, 34.7818];
const DEFAULT_ZOOM = 12;

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    const btn = document.getElementById('darkModeBtn');
    if (btn) btn.innerText = isDark ? '☀️' : '🌙';
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupLocationForm();
});

function initMap() {
    map = L.map('mapContainer').setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
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
        errorMsg.style.display = 'none';

        buildCategoryFilter(allLocations);
        renderMarkers(allLocations);
        fitMapToMarkers(allLocations);
        renderLocationsList(allLocations);
    } catch (err) {
        console.error('שגיאה בטעינת המיקומים:', err);
        if (loadingMsg) loadingMsg.style.display = 'none';
        errorMsg.style.display = 'block';
    }
}

function buildCategoryFilter(locations) {
    const container = document.getElementById('mapCategoryFilter');
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

// --- הצגת ה-markers על המפה ---
function renderMarkers(locations) {
    currentMarkers.forEach(marker => map.removeLayer(marker));
    currentMarkers = [];

    locations.forEach(loc => {
        if (typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return;

        const marker = L.marker([loc.lat, loc.lng]).addTo(map);
        marker.bindPopup(buildPopupContent(loc));

        currentMarkers.push(marker);
    });
}

function buildPopupContent(loc) {
    const name = escapeHtml(loc.name || '');
    const address = escapeHtml(loc.address || '');

    return `
        <div class="popup-content">
            <strong>${name}</strong>
            <div class="popup-address">${address}</div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function fitMapToMarkers(locations) {
    const validLocations = locations.filter(loc => typeof loc.lat === 'number' && typeof loc.lng === 'number');

    if (validLocations.length === 0) {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        return;
    }

    if (validLocations.length === 1) {
        map.setView([validLocations[0].lat, validLocations[0].lng], 15);
        return;
    }

    const bounds = L.latLngBounds(validLocations.map(loc => [loc.lat, loc.lng]));
    map.fitBounds(bounds, { padding: [30, 30] });
}

async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('שגיאה בשירות ה-Geocoding');

    const results = await res.json();
    if (!results.length) throw new Error('לא נמצאה כתובת תואמת');

    return {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon)
    };
}

function renderLocationsList(locations) {
    const container = document.getElementById('locationsList');
    if (!container) return;
    container.innerHTML = '';

    if (!locations.length) {
        container.innerHTML = '<p class="loc-empty-msg">עדיין לא נוספו מיקומים</p>';
        return;
    }

    locations.forEach(loc => {
        const item = document.createElement('div');
        item.className = 'location-item';
        item.innerHTML = `
            <div class="location-item-info">
                <strong>${escapeHtml(loc.name)}</strong>
                <span>${escapeHtml(loc.address)}</span>
            </div>
            <div class="location-item-actions">
                <button class="loc-edit-btn" data-id="${loc._id}">ערוך</button>
                <button class="loc-delete-btn" data-id="${loc._id}">מחק</button>
            </div>
        `;
        container.appendChild(item);
    });

    document.querySelectorAll('.loc-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => startEditLocation(btn.dataset.id));
    });
    document.querySelectorAll('.loc-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteLocation(btn.dataset.id));
    });
}

function startEditLocation(id) {
    const loc = allLocations.find(l => l._id === id);
    if (!loc) return;

    document.getElementById('editLocationId').value = loc._id;
    document.getElementById('locName').value = loc.name;
    document.getElementById('locAddress').value = loc.address;
    document.getElementById('locSubmitBtn').innerText = 'עדכן מיקום';
    document.getElementById('locCancelEditBtn').style.display = 'inline-block';

    document.getElementById('locationForm').scrollIntoView({ behavior: 'smooth' });
}

function cancelEditLocation() {
    document.getElementById('editLocationId').value = '';
    document.getElementById('locationForm').reset();
    document.getElementById('locSubmitBtn').innerText = 'הוסף מיקום';
    document.getElementById('locCancelEditBtn').style.display = 'none';
}

async function deleteLocation(id) {
    if (!confirm('למחוק את המיקום הזה?')) return;

    try {
        const res = await fetch('/api/locations/' + id, { method: 'DELETE' });
        if (!res.ok) throw new Error('שגיאה במחיקה');

        await loadLocationsFromDB();
    } catch (err) {
        alert('שגיאה במחיקת המיקום: ' + err.message);
    }
}

function setupLocationForm() {
    const form = document.getElementById('locationForm');
    const cancelBtn = document.getElementById('locCancelEditBtn');
    const msgEl = document.getElementById('locFormMsg');

    if (!form) return;

    cancelBtn.addEventListener('click', cancelEditLocation);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msgEl.textContent = '';

        const editId = document.getElementById('editLocationId').value;
        const name = document.getElementById('locName').value.trim();
        const address = document.getElementById('locAddress').value.trim();

        if (!name || !address) {
            msgEl.textContent = 'נא למלא שם וכתובת';
            return;
        }

        const submitBtn = document.getElementById('locSubmitBtn');
        submitBtn.disabled = true;
        msgEl.textContent = 'מאתר את הכתובת על המפה...';

        try {
            const coords = await geocodeAddress(address);

            const payload = { name, address, lat: coords.lat, lng: coords.lng };

            const res = await fetch('/api/locations' + (editId ? '/' + editId : ''), {
                method: editId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'שגיאה בשמירה');
            }

            msgEl.textContent = editId ? 'המיקום עודכן בהצלחה!' : 'המיקום נוסף בהצלחה!';
            cancelEditLocation();
            await loadLocationsFromDB();
        } catch (err) {
            msgEl.textContent = 'שגיאה: ' + err.message;
        } finally {
            submitBtn.disabled = false;
        }
    });
}