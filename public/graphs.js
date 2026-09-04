
const loggedInUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
if (!loggedInUser) {
    window.location.href = 'login.html';
}

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

        drawDoughnutChart('categoryChart', labels, values, colors);

        // ציור מחדש בעת שינוי גודל החלון, כדי לשמור על responsive כמו קודם
        window.addEventListener('resize', debounce(() => {
            drawDoughnutChart('categoryChart', labels, values, colors);
        }, 200));
    } catch (err) {
        console.error(err);
        document.getElementById('categoryChart').replaceWith(
            errorMessageNode('לא ניתן היה לטעון את נתוני הקטגוריות')
        );
    }
}

// מצייר גרף דונאט (doughnut) בעזרת D3.js בתוך div נתון
function drawDoughnutChart(containerId, labels, values, colors) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const legendHeight = 34;
    const width = container.clientWidth || 300;
    const height = Math.max((container.clientHeight || 320) - legendHeight, 120);
    const radius = Math.min(width, height) / 2 - 10;

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);
    const arcHover = d3.arc().innerRadius(radius * 0.6).outerRadius(radius * 1.05);

    const dataset = labels.map((label, i) => ({ label, value: values[i], color: colors[i] }));

    const tooltip = d3.select(container)
        .append('div')
        .attr('class', 'd3-tooltip');

    g.selectAll('path')
        .data(pie(dataset))
        .join('path')
        .attr('d', arc)
        .attr('fill', d => d.data.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .on('mouseenter', function (event, d) {
            d3.select(this).transition().duration(120).attr('d', arcHover);
            tooltip.style('opacity', 1).text(`${d.data.label}: ${d.data.value}`);
        })
        .on('mousemove', function (event) {
            const [x, y] = d3.pointer(event, container);
            tooltip.style('left', (x + 12) + 'px').style('top', (y - 10) + 'px');
        })
        .on('mouseleave', function () {
            d3.select(this).transition().duration(120).attr('d', arc);
            tooltip.style('opacity', 0);
        });

    // מקרא (legend) בתחתית, במקום legend: { position: 'bottom' } של Chart.js
    const legend = d3.select(container)
        .append('div')
        .attr('class', 'd3-legend');

    const item = legend.selectAll('.d3-legend-item')
        .data(dataset)
        .join('div')
        .attr('class', 'd3-legend-item');

    item.append('span')
        .attr('class', 'd3-legend-swatch')
        .style('background-color', d => d.color);

    item.append('span').text(d => d.label);
}

// === גרף 2: קצב פרסום פוסטים לאורך זמן (נתונים חיים מ-MongoDB, מקובצים לפי תאריך בשרת) ===
async function loadTimelineChart() {
    try {
        const res = await fetch('/api/posts/stats/timeline?days=14');
        if (!res.ok) throw new Error('שגיאה בטעינת נתוני ציר הזמן');
        const data = await res.json(); // { labels: [...], data: [...] }

        drawTimelineChart('timelineChart', data.labels, data.data);

        // ציור מחדש בעת שינוי גודל החלון, כדי לשמור על responsive כמו קודם
        window.addEventListener('resize', debounce(() => {
            drawTimelineChart('timelineChart', data.labels, data.data);
        }, 200));
    } catch (err) {
        console.error(err);
        document.getElementById('timelineChart').replaceWith(
            errorMessageNode('לא ניתן היה לטעון את ציר הזמן')
        );
    }
}

// מצייר גרף קו (line chart) עם מילוי שטח, בעזרת D3.js, בתוך div נתון
function drawTimelineChart(containerId, labels, values) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const margin = { top: 10, right: 16, bottom: 26, left: 34 };
    const width = (container.clientWidth || 400) - margin.left - margin.right;
    const height = (container.clientHeight || 320) - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${container.clientWidth || 400} ${container.clientHeight || 320}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const dataset = labels.map((label, i) => ({ label, value: values[i] }));

    const x = d3.scalePoint()
        .domain(dataset.map(d => d.label))
        .range([0, width])
        .padding(0.5);

    const yMax = d3.max(dataset, d => d.value) || 0;
    const y = d3.scaleLinear()
        .domain([0, yMax === 0 ? 1 : yMax])
        .nice()
        .range([height, 0]);

    // ציר Y, מתחיל מ-0 ומציג רק מספרים שלמים (כמו precision: 0 ב-Chart.js)
    g.append('g')
        .call(d3.axisLeft(y).ticks(Math.min(yMax, 5)).tickFormat(d3.format('d')))
        .call(sel => sel.select('.domain').remove())
        .attr('color', 'currentColor')
        .attr('font-size', '11px');

    // ציר X עם תוויות התאריכים
    g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .attr('color', 'currentColor')
        .attr('font-size', '11px')
        .selectAll('text')
        .attr('transform', 'rotate(-25)')
        .style('text-anchor', 'end');

    const area = d3.area()
        .x(d => x(d.label))
        .y0(height)
        .y1(d => y(d.value))
        .curve(d3.curveMonotoneX);

    const line = d3.line()
        .x(d => x(d.label))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

    g.append('path')
        .datum(dataset)
        .attr('fill', 'rgba(230, 0, 35, 0.15)')
        .attr('d', area);

    g.append('path')
        .datum(dataset)
        .attr('fill', 'none')
        .attr('stroke', '#e60023')
        .attr('stroke-width', 2)
        .attr('d', line);

    const tooltip = d3.select(container)
        .append('div')
        .attr('class', 'd3-tooltip');

    g.selectAll('circle')
        .data(dataset)
        .join('circle')
        .attr('cx', d => x(d.label))
        .attr('cy', d => y(d.value))
        .attr('r', 3)
        .attr('fill', '#e60023')
        .on('mouseenter', function (event, d) {
            d3.select(this).transition().duration(100).attr('r', 5);
            tooltip.style('opacity', 1).text(`${d.label}: ${d.value}`);
        })
        .on('mousemove', function (event) {
            const [px, py] = d3.pointer(event, container);
            tooltip.style('left', (px + 12) + 'px').style('top', (py - 10) + 'px');
        })
        .on('mouseleave', function () {
            d3.select(this).transition().duration(100).attr('r', 3);
            tooltip.style('opacity', 0);
        });
}

// עוזר קטן לדחיית ביצוע פונקציה (לצמצום קריאות ציור מחדש בעת resize)
function debounce(fn, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), wait);
    };
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