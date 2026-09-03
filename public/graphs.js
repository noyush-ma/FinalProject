
// public/graphs.js

// --- מצב כהה (זהה בהתנהגותו לשאר העמודים באתר) ---
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('darkModeBtn');
    btn.innerText = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

// צבעים קבועים לפי קטגוריה, כדי שהגרף יהיה עקבי גם כשהוא נטען מחדש
const CATEGORY_COLORS = {
    'nature': '#4caf50',
    'animals': '#ff9800',
    'urban': '#607d8b',
    'places': '#3f51b5',
    'movies': '#9c27b0',
    'food & drinks': '#f44336',
    'arts': '#e91e63',
    'celebrity': '#ffc107',
    'beauty': '#00bcd4',
    'general': '#795548'
};

function colorForCategory(name, index) {
    const key = (name || '').toLowerCase();
    return CATEGORY_COLORS[key] || `hsl(${(index * 47) % 360}, 65%, 55%)`;
}

// === גרף 1: התפלגות פוסטים לפי קטגוריה (נתונים חיים מ-MongoDB דרך ה-API של השרת) ===
async function loadCategoryChart() {
    try {
        const res = await fetch('/api/posts/stats/by-category');
        if (!res.ok) throw new Error('שגיאה בטעינת נתוני קטגוריות');
        const data = await res.json(); // { category: count, ... }

        const labels = Object.keys(data);
        const values = Object.values(data);
        const colors = labels.map((label, i) => colorForCategory(label, i));

        const ctx = document.getElementById('categoryChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    } catch (err) {
        console.error(err);
        document.getElementById('categoryChart').replaceWith(
            errorMessageNode('לא ניתן היה לטעון את נתוני הקטגוריות')
        );
    }
}

// === גרף 2: קצב פרסום פוסטים לאורך זמן (נתונים חיים מ-MongoDB, מקובצים לפי תאריך בשרת) ===
async function loadTimelineChart() {
    try {
        const res = await fetch('/api/posts/stats/timeline?days=14');
        if (!res.ok) throw new Error('שגיאה בטעינת נתוני ציר הזמן');
        const data = await res.json(); // { labels: [...], data: [...] }

        const ctx = document.getElementById('timelineChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'פוסטים ביום',
                    data: data.data,
                    borderColor: '#e60023',
                    backgroundColor: 'rgba(230, 0, 35, 0.15)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    } catch (err) {
        console.error(err);
        document.getElementById('timelineChart').replaceWith(
            errorMessageNode('לא ניתן היה לטעון את ציר הזמן')
        );
    }
}

function errorMessageNode(text) {
    const p = document.createElement('p');
    p.className = 'weather-error';
    p.textContent = text;
    return p;
}

// === שירות Web חיצוני: קריאה אמיתית ל-Open-Meteo (דרך נתיב ה-API של השרת שלנו) ===
// לוח קצר של קודי מזג אוויר (WMO) לתצוגה ידידותית עם אימוג'י מתאים
const WEATHER_CODE_MAP = {
    0: ['בהיר', '☀️'],
    1: ['בהיר בעיקר', '🌤️'],
    2: ['מעונן חלקית', '⛅'],
    3: ['מעונן', '☁️'],
    45: ['ערפילי', '🌫️'],
    48: ['ערפילי', '🌫️'],
    51: ['טפטוף קל', '🌦️'],
    61: ['גשם קל', '🌧️'],
    63: ['גשם', '🌧️'],
    65: ['גשם עז', '🌧️'],
    71: ['שלג קל', '🌨️'],
    80: ['ממטרים', '🌦️'],
    95: ['סופת רעמים', '⛈️']
};

function describeWeatherCode(code) {
    return WEATHER_CODE_MAP[code] || ['לא ידוע', '🌡️'];
}

async function fetchWeather() {
    const cityInput = document.getElementById('cityInput');
    const resultBox = document.getElementById('weatherResult');
    const errorBox = document.getElementById('weatherError');
    const button = document.getElementById('getWeatherBtn');

    const city = cityInput.value.trim();
    errorBox.textContent = '';
    resultBox.classList.remove('show');

    if (!city) {
        errorBox.textContent = 'יש להקליד שם עיר';
        return;
    }

    button.disabled = true;
    button.textContent = 'טוען...';

    try {
        // הקריאה הזו מגיעה לנתיב /api/weather בשרת שלנו, שהוא-עצמו פונה בפועל
        // ל-Web Service חיצוני (Open-Meteo) ומחזיר לנו את התוצאה המעובדת
        const res = await fetch('/api/weather?city=' + encodeURIComponent(city));
        const data = await res.json();

        if (!res.ok) {
            errorBox.textContent = data.message || 'שגיאה בשליפת מזג האוויר';
            return;
        }

        const [description, icon] = describeWeatherCode(data.weathercode);

        resultBox.innerHTML = `
            <div class="weather-icon">${icon}</div>
            <div>
                <div class="weather-main">${data.city}${data.country ? ', ' + data.country : ''} — ${data.temperature}°C</div>
                <div class="weather-details">${description} · מהירות רוח: ${data.windspeed} קמ"ש · עודכן: ${data.time}</div>
            </div>
        `;
        resultBox.classList.add('show');
    } catch (err) {
        console.error(err);
        errorBox.textContent = 'שגיאת תקשורת עם השרת';
    } finally {
        button.disabled = false;
        button.textContent = 'בדוק מזג אוויר';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCategoryChart();
    loadTimelineChart();

    document.getElementById('getWeatherBtn').addEventListener('click', fetchWeather);
    document.getElementById('cityInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') fetchWeather();
    });

    // טעינה ראשונית של מזג אוויר לעיר ברירת המחדל שבתיבת הקלט
    fetchWeather();
});