// --- ניהול משתמש מחובר ---
const loggedInUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
// הגנה על העמוד: אם אין משתמש מחובר, מחזירים לדף ההתחברות
if (!loggedInUser) {
    window.location.href = 'login.html';
}

// --- פילטרים נוספים לטאב "סיכות": טווח לייקים (מספר שמירות) / סוג פוסט / יחס גובה-רוחב ---
// קטגוריות טווח הלייקים בקפיצות של 1000 - ניתן להרחיב בקלות ע"י הוספת זוגות [min, max] למערך.
const LIKES_BUCKETS = [
    [0, 150],
    [150, 300],
    [300, 450],
    [450, 600],
    [600, 750],
    [750, Infinity]
];

// מטמון מספרי השמירות (📌) לכל פוסט - משמש כתחליף ל"לייקים" (שלא קיימים בפועל באפליקציה),
// כי המספר הפופולרי היחיד שנשמר בפועל בשרת הוא כמות המשתמשים ששמרו כל פוסט.
let pinSaveCountsCache = {};

async function refreshPinSaveCounts() {
    try {
        const res = await fetch('/api/boards/save-counts');
        const postCounts = await res.json();

        const localRes = await fetch('/api/boards/local-save-counts');
        const localCounts = await localRes.json();

        pinSaveCountsCache = Object.assign({}, postCounts, localCounts);
    } catch (err) {
        console.error('שגיאה בטעינת מספרי השמירות:', err);
        pinSaveCountsCache = {};
    }
}
// פונקציה גלובלית שמחזירה את מספר השמירות של סיכה מסוימת (לפי postId, או מזהה מקומי - תמיד 0)
window.getPostSaveCount = function (identifier) {
    return pinSaveCountsCache[identifier] || 0;
};

function populateLikesRangeFilter() {
    const select = document.getElementById('likesRangeFilter');
    if (!select || select.options.length > 0) return;

    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.innerText = 'הכל';
    select.appendChild(allOption);

    LIKES_BUCKETS.forEach(function (bucket, index) {
        const option = document.createElement('option');
        option.value = String(index);
        option.innerText = bucket[1] === Infinity ? (bucket[0] + '+') : (bucket[0] + '-' + bucket[1]);
        select.appendChild(option);
    });
}

// מציג/מסתיר את סרגל הפילטרים - רלוונטי רק לתצוגות של סיכות/פינים (טאב "סיכות" ותצוגת לוח בודד), לא לטאב "לוחות"
function setPinsFilterBarVisible(visible) {
    const bar = document.getElementById('pinsFilterBar');
    if (bar) bar.style.display = visible ? 'flex' : 'none';
}

function resetPinsFilters() {
    const likesSelect = document.getElementById('likesRangeFilter');
    const typeSelect = document.getElementById('postTypeFilter');
    const ratioSelect = document.getElementById('aspectRatioFilter');
    if (likesSelect) likesSelect.value = 'all';
    if (typeSelect) typeSelect.value = 'all';
    if (ratioSelect) ratioSelect.value = 'all';
    filterBoardsGridBySearch();
}

// מחשב את קטגוריית יחס הגובה-רוחב של תמונה בפועל (אחרי שנטענה) ושומר אותה על הכרטיס
function applyRatioToCard(img, card) {
    const compute = function () {
        if (!img.naturalWidth || !img.naturalHeight) return;
        const ratio = img.naturalWidth / img.naturalHeight;
        let ratioCategory = 'square';
        if (ratio > 1.15) ratioCategory = 'landscape';
        else if (ratio < 0.87) ratioCategory = 'portrait';
        card.setAttribute('data-ratio', ratioCategory);
        filterBoardsGridBySearch();
    };

    if (img.complete && img.naturalWidth) {
        compute();
    } else {
        img.addEventListener('load', compute);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const usernameEl = document.getElementById('profileUsername');
    if (usernameEl && loggedInUser) {
        usernameEl.textContent = loggedInUser.username;
    }

    const headerImg = document.getElementById('profileImg');
    const dropdownImg = document.getElementById('profileDropdownImg');
    const currentImage = (loggedInUser && loggedInUser.profileImage) ? loggedInUser.profileImage : 'icons/profileLogo.png';
    if (headerImg) headerImg.src = currentImage;
    if (dropdownImg) dropdownImg.src = currentImage;

    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
        window.addEventListener('click', () => {
            profileDropdown.classList.remove('show');
        });
        profileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    const profileImageInput = document.getElementById('profileImageInput');
    if (profileImageInput) {
        profileImageInput.addEventListener('change', handleProfileImageChange);
    }

    const createPostBtn = document.getElementById('createPost');
    if (createPostBtn) {
        // אין מודל יצירת פוסט בעמוד הלוחות - מעבירים לעמוד הבית ליצירת פוסט
        createPostBtn.addEventListener('click', () => {
            window.location.href = 'feed.html';
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterBoardsGridBySearch);
    }

    // אתחול סרגל הפילטרים הנוסף (טווח לייקים / סוג פוסט / יחס גובה-רוחב)
    populateLikesRangeFilter();
    ['likesRangeFilter', 'postTypeFilter', 'aspectRatioFilter'].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', filterBoardsGridBySearch);
    });
    const resetFiltersBtn = document.getElementById('resetPinsFiltersBtn');
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetPinsFilters);

    // הטאב הפעיל כברירת מחדל הוא "סיכות"
    setPinsFilterBarVisible(true);
    renderSavedPinsTab();
});

function handleLogout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const btn = document.getElementById("darkModeBtn");
    btn.innerText = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
}

// עמוד הלוחות אינו מכיל תפריט סינון קטגוריות - שמירה על הכפתור בלי שגיאה אם אין תפריט כזה
function toggleThreeDotsMenu() {
    const dropdown = document.getElementById('filterDropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

// מכווץ תמונה גדולה לגודל סביר לפני שמירה (כדי לא לשלוח קבצים כבדים לשרת)
function resizeImageToDataURL(file, maxSize) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > height && width > maxSize) {
                    height = Math.round(height * (maxSize / width));
                    width = maxSize;
                } else if (height > maxSize) {
                    width = Math.round(width * (maxSize / height));
                    height = maxSize;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// מטפל בבחירת קובץ תמונה חדש מהמחשב, שולח לשרת ומעדכן את התצוגה
async function handleProfileImageChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('יש לבחור קובץ תמונה בלבד');
        event.target.value = '';
        return;
    }

    try {
        const dataUrl = await resizeImageToDataURL(file, 300);

        const res = await fetch('/api/users/' + loggedInUser._id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: loggedInUser.username,
                email: loggedInUser.email,
                profileImage: dataUrl
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            alert('שגיאה בעדכון תמונת הפרופיל: ' + (errorData.message || 'אירעה שגיאה'));
            return;
        }

        const updatedUser = await res.json();

        const headerImg = document.getElementById('profileImg');
        const dropdownImg = document.getElementById('profileDropdownImg');
        if (headerImg) headerImg.src = dataUrl;
        if (dropdownImg) dropdownImg.src = dataUrl;

        loggedInUser.profileImage = updatedUser.profileImage || dataUrl;
        sessionStorage.setItem('currentUser', JSON.stringify(loggedInUser));
    } catch (err) {
        console.error(err);
        alert('שגיאה בהעלאת התמונה');
    } finally {
        event.target.value = '';
    }
}

// --- טאבים: "סיכות" (ברירת מחדל) / "לוחות" ---
function switchTab(btnEl, tabName) {
    const tabButtons = document.querySelectorAll('.new-board-inline .tab-btn');
    tabButtons.forEach(function (b) { b.classList.remove('active'); });
    btnEl.classList.add('active');

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    // סרגל הפילטרים הנוסף רלוונטי רק לתצוגת סיכות (לא לטאב "לוחות")
    setPinsFilterBarVisible(tabName === 'pins');
}

// מפתח האחסון המקומי לפינים ללא Post במונגו (זהה למפתח שבו משתמש savedPins.js בעמוד הבית)
function getLocalPinsKey() {
    return 'pinterestLocalSavedPins_' + loggedInUser._id;
}

function getLocalPins() {
    try {
        return JSON.parse(localStorage.getItem(getLocalPinsKey()) || '[]');
    } catch (err) {
        return [];
    }
}

function setLocalPins(pins) {
    localStorage.setItem(getLocalPinsKey(), JSON.stringify(pins));
}

// --- טאב "סיכות": כל התמונות ששמר המשתמש - גם מקומיות (localStorage) וגם מהמונגו ---
// כל סיכה ניתנת לביטול שמירה ישירות מכאן, גם אם היא לא משויכת לאף לוח.
// --- טאב "סיכות": כל התמונות ששמר המשתמש - גם מקומיות (localStorage) וגם מהמונגו ---
async function renderSavedPinsTab() {
    const grid = document.getElementById('boardsGrid');
    const noBoardsMsg = document.getElementById('noBoardsMessage');
    grid.innerHTML = '';

    // טעינת מספרי השמירות (📌) מראש כדי שהתגיות והפילטר לפי "לייקים" יעבדו על הכרטיסים
    await refreshPinSaveCounts();

    const pins = [];

    // פינים מקומיים - אין להם פוסט אמיתי במונגו, לכן אין תיאור/סוג אמיתיים - ברירת מחדל: תמונה בלי תיאור
    try {
        getLocalPins().forEach(function (p) {
            pins.push({ isLocal: true, localId: p.localId, identifier: p.imageUrl, imageUrl: p.imageUrl, title: p.title || '', description: '', postType: 'IMAGE', savedAt: p.savedAt });
        });
    } catch (err) {
        console.error('שגיאה בטעינת פינים מקומיים:', err);
    }

    // פינים ששמורים בפועל במונגו
    try {
        const res = await fetch('/api/boards/pins/' + loggedInUser._id);
        const mongoPins = await res.json();
        (mongoPins || []).forEach(function (p) {
            pins.push({ isLocal: false, postId: p.postId, identifier: p.postId, imageUrl: p.imageUrl, title: p.title || '', description: p.description || '', postType: p.postType || 'IMAGE', savedAt: p.savedAt });
        });
    } catch (err) {
        console.error('שגיאה בטעינת פינים מהשרת:', err);
    }

    if (pins.length === 0) {
        noBoardsMsg.textContent = 'עדיין לא שמרת שום דבר 📌';
        noBoardsMsg.style.display = 'block';
        return;
    }
    noBoardsMsg.style.display = 'none';

    pins.sort(function (a, b) { return new Date(b.savedAt) - new Date(a.savedAt); });

    pins.forEach(function (pin) {
        const card = document.createElement('div');
        card.className = 'board-card pin-card';
        card.setAttribute('data-title', (pin.title || '').toLowerCase());
        // שדות נוספים לצורך סרגל הפילטרים (חיפוש לפי תיאור, סוג פוסט, טווח לייקים - יחס גובה-רוחב מחושב אחרי טעינת התמונה)
        card.setAttribute('data-description', (pin.description || '').toLowerCase());
        card.setAttribute('data-posttype', pin.postType || 'IMAGE');

        const cover = document.createElement('div');
        cover.className = 'board-cover';

        const img = document.createElement('img');
        img.src = pin.imageUrl;
        img.alt = pin.title || '';
        applyRatioToCard(img, card);

        // יצירת תגית מספר השמירות בצד ימין
        const countBadge = document.createElement('div');
        countBadge.className = 'pin-save-count-badge';
        // שימוש בפונקציה הגלובלית לקבלת כמות השמירות
          const saveCount = pin.isLocal ? 1 : window.getPostSaveCount(pin.identifier);
        countBadge.innerText = `📌 ${saveCount}`;
        card.setAttribute('data-likes', saveCount);

        // כפתור מחיקה בצד שמאל
        const unsaveBtn = document.createElement('button');
        unsaveBtn.type = 'button';
        unsaveBtn.className = 'board-delete-btn pin-unsave-btn';
        unsaveBtn.title = 'ביטול שמירה';
        unsaveBtn.innerText = '✕';
        unsaveBtn.onclick = function (e) {
            e.stopPropagation();
            unsavePinFromPinsTab(pin);
        };

        cover.appendChild(img);
        cover.appendChild(countBadge); // הוספת מספר השמירות לתוך תמונת העטיפה (צד ימין לפי עיצוב)
        card.appendChild(cover);
        card.appendChild(unsaveBtn);  // כפתור המחיקה נשאר בצד שמאל
        grid.appendChild(card);
    });

    // הפעלת הפילטרים הנוכחיים (אם הוזן משהו בשדה החיפוש/הפילטרים לפני הרענון)
    filterBoardsGridBySearch();
}

// מבטל שמירה מלאה של סיכה מתוך טאב "סיכות" (גם אם היא לא הייתה משויכת לאף לוח)
async function unsavePinFromPinsTab(pin) {
    if (pin.isLocal) {
        const pins = getLocalPins().filter(function (p) { return p.localId !== pin.localId; });
        setLocalPins(pins);
        renderSavedPinsTab();
        return;
    }

    try {
        const res = await fetch('/api/boards/unsave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: pin.postId, userId: loggedInUser._id })
        });

        if (res.ok) {
            renderSavedPinsTab();
        } else {
            const errorData = await res.json();
            alert('שגיאה בביטול השמירה: ' + (errorData.message || 'לא ניתן לבטל את השמירה'));
        }
    } catch (err) {
        console.error(err);
        alert('שגיאה בתקשורת עם השרת');
    }
}

// --- טאב "לוחות": רק הלוחות של המשתמש המחובר ---
async function loadBoards() {
    const grid = document.getElementById('boardsGrid');
    const noBoardsMsg = document.getElementById('noBoardsMessage');
    grid.innerHTML = '';
    noBoardsMsg.style.display = 'none';

    addCreateBoardTile(grid);

    try {
        const res = await fetch('/api/boards/user/' + loggedInUser._id);
        const boards = await res.json();

        (boards || []).forEach(function (board) {
            const card = document.createElement('div');
            card.className = 'board-card';
            card.setAttribute('data-title', board.name.toLowerCase());
            card.onclick = function () { openBoard(board._id, board.name); };

            const cover = document.createElement('div');
            cover.className = 'board-cover';
            if (board.coverImage) {
                const img = document.createElement('img');
                img.src = board.coverImage;
                cover.appendChild(img);
            } else {
                cover.classList.add('board-cover-empty');
            }

            const nameEl = document.createElement('div');
            nameEl.className = 'board-name';
            nameEl.innerText = board.name;

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'board-delete-btn';
            deleteBtn.title = 'מחיקת לוח';
            deleteBtn.innerText = '🗑';
            deleteBtn.onclick = function (e) {
                e.stopPropagation();
                deleteBoard(board._id);
            };

            card.appendChild(cover);
            card.appendChild(nameEl);
            card.appendChild(deleteBtn);
            grid.appendChild(card);
        });
    } catch (err) {
        console.error('שגיאה בטעינת הלוחות:', err);
    }
}

// אריח "לוח חדש +" שמופיע תמיד בראש טאב הלוחות - פותח מודאל יצירה ייעודי (לא הודעת פופאפ)
function addCreateBoardTile(grid) {
    const tile = document.createElement('div');
    tile.className = 'board-card add-board-card';
    tile.onclick = openCreateBoardModal;

    const cover = document.createElement('div');
    cover.className = 'board-cover add-board-cover';
    cover.innerText = '+';

    const nameEl = document.createElement('div');
    nameEl.className = 'board-name';
    nameEl.innerText = 'לוח חדש';

    tile.appendChild(cover);
    tile.appendChild(nameEl);
    grid.appendChild(tile);
}

// --- מודאל יצירת לוח חדש (רכיב UI אמיתי בעמוד, לא הודעת prompt/alert של הדפדפן) ---
function ensureCreateBoardModal() {
    let modalEl = document.getElementById('createBoardModal');
    if (modalEl) return modalEl;

    modalEl = document.createElement('div');
    modalEl.id = 'createBoardModal';
    modalEl.className = 'modal';
    modalEl.innerHTML = `
        <div class="modal-content save-board-modal-content">
            <span class="close" id="closeCreateBoardModalBtn">&times;</span>
            <h3>יצירת לוח חדש</h3>
            <div class="new-board-inline-save">
                <input type="text" id="createBoardNameInput" placeholder="שם ללוח החדש">
            </div>
            <h4 style="margin: 12px 0 6px 0;">בחר תמונות מהסיכות ללוח:</h4>
            <div id="boardPinsSelectorGrid" class="board-pins-selector-grid"></div>
            <button type="button" id="submitCreateBoardBtn" style="margin-top: 12px;">יצירת לוח</button>
        </div>
    `;
    document.body.appendChild(modalEl);

    modalEl.querySelector('#closeCreateBoardModalBtn').addEventListener('click', closeCreateBoardModal);
    modalEl.querySelector('#submitCreateBoardBtn').addEventListener('click', submitCreateBoardModal);
    modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) closeCreateBoardModal();
    });

    return modalEl;
}
async function openCreateBoardModal() {
    const modalEl = ensureCreateBoardModal();
    modalEl.style.display = 'flex';
    
    const input = document.getElementById('createBoardNameInput');
    if (input) {
        input.value = '';
        input.focus();
    }

    // טעינת הסיכות לתוך גריד הבחירה במודאל
    const container = document.getElementById('boardPinsSelectorGrid');
    container.innerHTML = '<p>טוען סיכות...</p>';

    const pins = await getAllSavedPinsForUser();
    container.innerHTML = '';

    if (pins.length === 0) {
        container.innerHTML = '<p>אין סיכות שמורות לבחירה</p>';
        return;
    }

    pins.forEach(pin => {
        const item = document.createElement('label');
        item.className = 'pin-select-item';
        item.innerHTML = `
            <input type="checkbox" value="${pin.imageUrl}" class="pin-checkbox" data-id="${pin.id}" data-islocal="${pin.isLocal}">
            <img src="${pin.imageUrl}" alt="${pin.title}">
        `;
        container.appendChild(item);
    });
}

function closeCreateBoardModal() {
    const modalEl = document.getElementById('createBoardModal');
    if (modalEl) modalEl.style.display = 'none';
}


async function submitCreateBoardModal() {
    const input = document.getElementById('createBoardNameInput');
    const name = input ? input.value.trim() : '';

    if (!name) {
        alert('יש להזין שם ללוח');
        return;
    }

    const checkedBoxes = document.querySelectorAll('#boardPinsSelectorGrid .pin-checkbox:checked');
    const selectedPins = Array.from(checkedBoxes).map(cb => ({
        id: cb.getAttribute('data-id'),
        isLocal: cb.getAttribute('data-islocal') === 'true',
        url: cb.value
    }));

    let collageCover = null;
    if (selectedPins.length > 0) {
        collageCover = await createCollageDataURL(selectedPins.map(p => p.url));
    }

    closeCreateBoardModal();

    try {
        const res = await fetch('/api/boards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                ownerId: loggedInUser._id,
                coverImage: collageCover
            })
        });

        if (res.ok) {
            const newBoard = await res.json();
            const newBoardId = newBoard._id || newBoard.id; // וידוא שלקחנו את ה-ID הנכון מהתגובה

            // שיוך כל סיכה ללוח החדש
            for (const pin of selectedPins) {
                if (pin.isLocal) {
                    const localPins = getLocalPins().map(p => {
                        if (p.localId === pin.id) p.boardId = newBoardId;
                        return p;
                    });
                    setLocalPins(localPins);
                } else {
                    await fetch('/api/boards/add-to-board', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            postId: pin.id, 
                            boardId: newBoardId, 
                            userId: loggedInUser._id 
                        })
                    });
                }
            }

            loadBoards();
        } else {
            alert('שגיאה ביצירת הלוח');
        }
    } catch (err) {
        console.error(err);
        alert('שגיאה בתקשורת עם השרת');
    }
}

async function deleteBoard(boardId) {
    const confirmDelete = confirm('האם למחוק את הלוח? כל השמירות בתוכו יימחקו לצמיתות');
    if (!confirmDelete) return;

    try {
        const res = await fetch('/api/boards/' + boardId + '?userId=' + loggedInUser._id, {
            method: 'DELETE'
        });

        if (res.ok) {
            loadBoards();
        } else {
            const errorData = await res.json();
            alert('שגיאה במחיקת הלוח: ' + (errorData.message || 'לא ניתן למחוק את הלוח'));
        }
    } catch (err) {
        console.error(err);
        alert('שגיאה בתקשורת עם השרת');
    }
}

// פתיחת תצוגת הפינים השמורים בלוח מסוים - השרת מוודא שהמשתמש המחובר הוא בעל הלוח.
// אפשר לחזור מכאן לדף בחירת הלוח דרך כפתור "חזרה ללוחות" (closeBoardView).
// פתיחת תצוגת הפינים השמורים בלוח מסוים - מוצג בדיוק כמו בטאב הסיכות
async function openBoard(boardId, boardName) {
    currentBoard = { id: boardId, name: boardName };
    document.getElementById('boardsPageContainer').style.display = 'none';
    const section = document.getElementById('boardPinsSection');
    section.style.display = 'block';
    document.getElementById('boardPinsTitle').innerText = boardName;
    setPinsFilterBarVisible(true);

    const grid = document.getElementById('boardPinsGrid');
    
    // שינוי ה-class של הגריד כדי להבטיח עיצוב זהה ללוח הראשי
    grid.className = 'boards-grid';
    grid.innerHTML = '<p class="no-boards-text">טוען...</p>';

    // טעינת מספרי השמירות (📌) מראש עבור תגיות "הלייקים" והפילטר לפי טווח
    await refreshPinSaveCounts();

    const items = [];

    // 1. טעינת פינים מהשרת
    try {
        const res = await fetch('/api/boards/' + boardId + '/pins?userId=' + loggedInUser._id);
        const posts = await res.json();
        (posts || []).forEach(function (post) {
            items.push({ isLocal: false, postId: post._id, imageUrl: post.imageUrl, title: post.title || '', description: post.textContent || '', postType: post.postType || 'IMAGE' });
        });
    } catch (err) {
        console.error('שגיאה בטעינת תוכן הלוח:', err);
    }

    // 2. טעינת פינים מקומיים שמשויכים ללוח הזה
    try {
        getLocalPins().forEach(function (p) {
            if (p.boardId === boardId) {
                items.push({ isLocal: true, localId: p.localId, imageUrl: p.imageUrl, title: p.title || '', description: '', postType: 'IMAGE' });
            }
        });
    } catch (err) {
        console.error('שגיאה בטעינת פינים מקומיים של הלוח:', err);
    }

    grid.innerHTML = '';
    if (items.length === 0) {
        grid.innerHTML = '<p class="no-boards-text">עדיין אין פינים שמורים בלוח הזה 📌</p>';
        return;
    }

    
    // יצירת הכרטיסיות באותו המבנה בדיוק כמו בטאב הסיכות
    items.forEach(function (item) {
        const card = document.createElement('div');
        card.className = 'board-card pin-card';
        card.setAttribute('data-title', (item.title || '').toLowerCase());
        card.setAttribute('data-description', (item.description || '').toLowerCase());
        card.setAttribute('data-posttype', item.postType || 'IMAGE');

        const cover = document.createElement('div');
        cover.className = 'board-cover';

        const img = document.createElement('img');
        img.src = item.imageUrl;
        img.alt = item.title || '';
        applyRatioToCard(img, card);

        // זיהוי המזהה הנכון ( postId או localId ) לצורך שליפת כמות השמירות
       const identifier = item.postId || item.localId || item.imageUrl;
        const saveCount = item.isLocal ? 1 : window.getPostSaveCount(identifier);

        const countBadge = document.createElement('div');
        countBadge.className = 'pin-save-count-badge';
        countBadge.innerText = `📌 ${saveCount}`;
        card.setAttribute('data-likes', saveCount);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'board-delete-btn pin-unsave-btn';
        removeBtn.title = 'הסרה מהלוח';
        removeBtn.innerText = '✕';
        removeBtn.onclick = function (e) {
            e.stopPropagation();
            removePinFromBoard(item, boardId, boardName);
        };

        cover.appendChild(img);
        cover.appendChild(countBadge); // הצגת מספר השמירות מימין
        card.appendChild(cover);
        card.appendChild(removeBtn);   // כפתור הסרה משמאל
        grid.appendChild(card);
    });

    // הפעלת הפילטרים הנוכחיים על תוכן הלוח שנטען כרגע
    filterBoardsGridBySearch();
}

// מסיר פין מהלוח (השמירה עצמה נשארת ב"סיכות")
async function removePinFromBoard(item, boardId, boardName) {
    if (item.isLocal) {
        const pins = getLocalPins().map(function (p) {
            if (p.localId === item.localId) p.boardId = null;
            return p;
        });
        setLocalPins(pins);
        await updateBoardCoverAfterChange(boardId);
        openBoard(boardId, boardName);
        return;
    }

    try {
        const res = await fetch('/api/boards/remove-from-board', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: item.postId, boardId: boardId, userId: loggedInUser._id })
        });

        if (res.ok) {
            await updateBoardCoverAfterChange(boardId);
            openBoard(boardId, boardName);
        } else {
            const errorData = await res.json();
            alert('שגיאה בהסרה מהלוח: ' + (errorData.message || 'לא ניתן להסיר מהלוח'));
        }
    } catch (err) {
        console.error(err);
        alert('שגיאה בתקשורת עם השרת');
    }
}

function closeBoardView() {
    // 1. הסתרת תצוגת הסיכות בתוך הלוח והצגת המיכל הראשי
    document.getElementById('boardPinsSection').style.display = 'none';
    document.getElementById('boardsPageContainer').style.display = 'block';

    // 2. עדכון ויזואלי של הטאבים - הפיכת טאב "לוחות" לפעיל
    const tabButtons = document.querySelectorAll('.new-board-inline .tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));

    // מציאת כפתור הטאב של "לוחות" והוספת מחלקת active
    const boardsTabBtn = Array.from(tabButtons).find(btn => btn.textContent.includes('לוחות'));
    if (boardsTabBtn) {
        boardsTabBtn.classList.add('active');
    }

    // 3. טעינת הלוחות מחדש וניקוי שדה החיפוש
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    // סרגל הפילטרים הנוסף רלוונטי רק לתצוגות של סיכות/פינים, לא לטאב "לוחות"
    setPinsFilterBarVisible(false);

    loadBoards();
}

// חיפוש בתוך הטאב הפעיל (מסנן לפי שם לוח / כותרת סיכה)
// חיפוש + סינון בתוך הטאב הפעיל:
// - חיפוש חופשי לפי שם לוח / כותרת סיכה / תיאור הפוסט (כמו קודם, רק שעכשיו גם לפי תיאור)
// - 3 פרמטרי סינון נוספים שרלוונטיים רק לכרטיסי "סיכה" (post-card): טווח לייקים (📌), סוג פוסט, יחס גובה-רוחב
//   כרטיסי "לוח" (board-card רגיל) לא מכילים את התכונות האלו, ולכן מסוננים רק לפי החיפוש החופשי כרגיל.
function filterBoardsGridBySearch() {
    const searchValue = document.getElementById('searchInput').value.trim().toLowerCase();

    const likesSelect = document.getElementById('likesRangeFilter');
    const typeSelect = document.getElementById('postTypeFilter');
    const ratioSelect = document.getElementById('aspectRatioFilter');

    const likesBucketIndex = likesSelect && likesSelect.value !== 'all' ? parseInt(likesSelect.value, 10) : null;
    const typeValue = typeSelect ? typeSelect.value : 'all';
    const ratioValue = ratioSelect ? ratioSelect.value : 'all';

    // כולל גם את הכרטיסים בטאב "סיכות" (#boardsGrid) וגם את אלו בתוך תצוגת לוח בודד (#boardPinsGrid)
    const cards = document.querySelectorAll('#boardsGrid .board-card:not(.add-board-card), #boardPinsGrid .board-card');

    cards.forEach(function (card) {
        const title = card.getAttribute('data-title') || '';
        const description = card.getAttribute('data-description') || '';
        let visible = !searchValue || title.includes(searchValue) || description.includes(searchValue);

        if (visible && card.classList.contains('pin-card')) {
            // סינון לפי טווח לייקים (מספר שמירות)
            if (visible && likesBucketIndex !== null) {
                const likes = parseInt(card.getAttribute('data-likes'), 10) || 0;
                const bucket = LIKES_BUCKETS[likesBucketIndex];
                if (!bucket || likes < bucket[0] || likes > bucket[1]) visible = false;
            }

            // סינון לפי סוג פוסט
            if (visible && typeValue !== 'all') {
                const postType = card.getAttribute('data-posttype') || '';
                if (postType !== typeValue) visible = false;
            }

            // סינון לפי יחס גובה-רוחב (מחושב מהתמונה בפועל אחרי טעינתה)
            if (visible && ratioValue !== 'all') {
                const ratio = card.getAttribute('data-ratio') || '';
                if (ratio !== ratioValue) visible = false;
            }
        }

        card.style.display = visible ? '' : 'none';
    });
}

function createCollageDataURL(imageUrls, width = 400, height = 400) {
    return new Promise((resolve) => {
        if (!imageUrls || imageUrls.length === 0) {
            return resolve(null);
        }

        // הגבלה לעד 3 התמונות הראשונות בלבד (הכי עדכניות)
        const recentUrls = imageUrls.slice(0, 3);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        let loadedCount = 0;
        const total = recentUrls.length;

        recentUrls.forEach((url, index) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                let x = 0, y = 0, w = width, h = height;

                // חישוב מיקום לפי כמות התמונות (1, 2 או 3)
                if (total === 2) {
                    w = width / 2;
                    x = index * w;
                } else if (total === 3) {
                    if (index === 0) {
                        w = width / 2;
                        h = height;
                        x = 0;
                        y = 0;
                    } else {
                        w = width / 2;
                        h = height / 2;
                        x = width / 2;
                        y = (index - 1) * (height / 2);
                    }
                }

                ctx.drawImage(img, x, y, w, h);
                
                // קו הפרדה לבן בין התמונות
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, w, h);

                loadedCount++;
                if (loadedCount === total) {
                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                }
            };
            img.onerror = () => {
                loadedCount++;
                if (loadedCount === total) {
                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                }
            };
            img.src = url;
        });
    });
}
async function getAllSavedPinsForUser() {
    const pins = [];

    // 1. פינים מקומיים
    try {
        getLocalPins().forEach(p => {
            pins.push({ id: p.localId, imageUrl: p.imageUrl, title: p.title || '', isLocal: true });
        });
    } catch (err) {
        console.error('שגיאה בטעינת פינים מקומיים:', err);
    }

    // 2. פינים מהשרת
    try {
        const res = await fetch('/api/boards/pins/' + loggedInUser._id);
        const mongoPins = await res.json();
        (mongoPins || []).forEach(p => {
            pins.push({ id: p.postId, imageUrl: p.imageUrl, title: p.title || '', isLocal: false });
        });
    } catch (err) {
        console.error('שגיאה בטעינת פינים מהשרת:', err);
    }

    return pins;
}



async function openAddPinsModal() {
    const modal = ensureCreateBoardModal();
    modal.style.display = 'flex';
    
    // הסתרת שדה השם
    const input = document.getElementById('createBoardNameInput');
    if (input) { 
        input.value = currentBoard.name || 'לוח'; 
        if (input.parentElement) input.parentElement.style.display = 'none'; 
    }
    
    document.querySelector('#createBoardModal h3').innerText = `הוספת תמונות ללוח: ${currentBoard.name}`;
    
    // איפוס הכפתור מכל האירועים הישנים של יצירת לוח
    const oldBtn = document.getElementById('submitCreateBoardBtn');
    if (oldBtn) {
        const newBtn = oldBtn.cloneNode(true); // ניקוי אירועים ישנים
        newBtn.innerText = 'הוסף ללוח';
        newBtn.onclick = function (e) {
            e.preventDefault(); // מונע את שליחת הטופס והקפצת ה-alert
            savePinsToCurrentBoard();
        };
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    }

    // סינון תמונות שכבר קיימות בלוח
    const currentImgs = new Set([...document.querySelectorAll('#boardPinsGrid img')].map(img => img.src));
    const allPins = await getAllSavedPinsForUser();
    const availablePins = (allPins || []).filter(pin => !currentImgs.has(pin.imageUrl));

    const container = document.getElementById('boardPinsSelectorGrid');
    container.innerHTML = availablePins.length === 0 ? '<p>כל התמונות כבר בלוח זה 📌</p>' : '';
    
    availablePins.forEach(pin => {
        container.innerHTML += `
            <label class="pin-select-item">
                <input type="checkbox" value="${pin.imageUrl}" class="pin-checkbox" data-id="${pin.id}" data-islocal="${pin.isLocal}">
                <img src="${pin.imageUrl}" alt="${pin.title || ''}">
            </label>`;
    });
}

async function savePinsToCurrentBoard() {
    const selected = [...document.querySelectorAll('#boardPinsSelectorGrid .pin-checkbox:checked')].map(cb => ({
        id: cb.getAttribute('data-id'),
        isLocal: cb.getAttribute('data-islocal') === 'true'
    }));

    if (!selected.length) return alert('יש לבחור לפחות תמונה אחת');

    for (const pin of selected) {
        if (pin.isLocal) {
            setLocalPins(getLocalPins().map(p => (p.localId === pin.id ? { ...p, boardId: currentBoard.id } : p)));
        } else {
            await fetch('/api/boards/add-to-board', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: pin.id, boardId: currentBoard.id, userId: loggedInUser._id })
            });
        }
    }

    // החזרת החלון והכפתור למצב המקורי של יצירת לוח חדש
    const input = document.getElementById('createBoardNameInput');
    if (input) { 
        input.value = ''; 
        if (input.parentElement) input.parentElement.style.display = 'block'; 
    }
    
    document.querySelector('#createBoardModal h3').innerText = 'יצירת לוח חדש';

    const btn = document.getElementById('submitCreateBoardBtn');
    if (btn) {
        const newBtn = btn.cloneNode(true);
        newBtn.innerText = 'יצירת לוח';
        newBtn.onclick = function (e) {
            if (typeof submitCreateBoardModal === 'function') {
                submitCreateBoardModal(e);
            }
        };
        btn.parentNode.replaceChild(newBtn, btn);
    }

    closeCreateBoardModal();
    openBoard(currentBoard.id, currentBoard.name);
}

async function updateBoardCoverAfterChange(boardId) {
    try {
        const remainingImages = [];

        // 1. איסוף פינים מהשרת שנשארו בלוח
        const res = await fetch('/api/boards/' + boardId + '/pins?userId=' + loggedInUser._id);
        if (res.ok) {
            const posts = await res.json();
            (posts || []).forEach(p => {
                if (p && p.imageUrl) remainingImages.push(p.imageUrl);
            });
        }

        // 2. איסוף פינים מקומיים שנשארו בלוח
        getLocalPins().forEach(p => {
            if (p.boardId === boardId && p.imageUrl) {
                remainingImages.push(p.imageUrl);
            }
        });

        // 3. יצירת קולאז' חדש מ-3 התמונות האחרונות שנשארו בלבד
        let newCover = null;
        if (remainingImages.length > 0) {
            // לוקחים רק עד 3 תמונות אחרונות
            const recentImages = remainingImages.slice(-3);
            newCover = await createCollageDataURL(recentImages);
        }

        // 4. עדכון השער של הלוח בשרת
        await fetch('/api/boards/' + boardId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: loggedInUser._id,
                coverImage: newCover
            })
        });
    } catch (err) {
        console.error('שגיאה בעדכון תמונת השער של הלוח:', err);
    }
}

