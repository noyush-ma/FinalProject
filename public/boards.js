// --- ניהול משתמש מחובר ---
const loggedInUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

// הגנה על העמוד: אם אין משתמש מחובר, מחזירים לדף ההתחברות
if (!loggedInUser) {
    window.location.href = 'login.html';
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

    // הטאב הפעיל כברירת מחדל הוא "סיכות"
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
async function renderSavedPinsTab() {
    const grid = document.getElementById('boardsGrid');
    const noBoardsMsg = document.getElementById('noBoardsMessage');
    grid.innerHTML = '';

    const pins = [];

    // פינים מקומיים - תמונות סטטיות מעמוד הבית שאין להן פוסט אמיתי במונגו
    try {
        getLocalPins().forEach(function (p) {
            pins.push({ isLocal: true, localId: p.localId, imageUrl: p.imageUrl, title: p.title || '', savedAt: p.savedAt });
        });
    } catch (err) {
        console.error('שגיאה בטעינת פינים מקומיים:', err);
    }

    // פינים ששמורים בפועל במונגו - כולל כאלה שלא משויכים לאף לוח (boardId null)
    try {
        const res = await fetch('/api/boards/pins/' + loggedInUser._id);
        const mongoPins = await res.json();
        (mongoPins || []).forEach(function (p) {
            pins.push({ isLocal: false, postId: p.postId, imageUrl: p.imageUrl, title: p.title || '', savedAt: p.savedAt });
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

        const cover = document.createElement('div');
        cover.className = 'board-cover';

        const img = document.createElement('img');
        img.src = pin.imageUrl;
        img.alt = pin.title || '';

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
        card.appendChild(cover);
        card.appendChild(unsaveBtn);
        grid.appendChild(card);
    });
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

    // איסוף התמונות שנבחרו
    const checkedBoxes = document.querySelectorAll('#boardPinsSelectorGrid .pin-checkbox:checked');
    const selectedImages = Array.from(checkedBoxes).map(cb => cb.value);

    // יצירת קולאז' במידה ונבחרו תמונות
    let collageCover = null;
    if (selectedImages.length > 0) {
        collageCover = await createCollageDataURL(selectedImages);
    }

    closeCreateBoardModal();
    createBoardWithNameAndCover(name, collageCover);
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
async function openBoard(boardId, boardName) {
    document.getElementById('boardsPageContainer').style.display = 'none';
    const section = document.getElementById('boardPinsSection');
    section.style.display = 'block';
    document.getElementById('boardPinsTitle').innerText = boardName;

    const grid = document.getElementById('boardPinsGrid');
    grid.innerHTML = '<p class="no-boards-text">טוען...</p>';

    const items = [];

    try {
        const res = await fetch('/api/boards/' + boardId + '/pins?userId=' + loggedInUser._id);
        const posts = await res.json();
        (posts || []).forEach(function (post) {
            items.push({ isLocal: false, postId: post._id, imageUrl: post.imageUrl, title: post.title || '' });
        });
    } catch (err) {
        console.error('שגיאה בטעינת תוכן הלוח:', err);
    }

    // פינים מקומיים ששויכו ללוח הזה (תמונות ללא Post אמיתי במונגו)
    try {
        getLocalPins().forEach(function (p) {
            if (p.boardId === boardId) {
                items.push({ isLocal: true, localId: p.localId, imageUrl: p.imageUrl, title: p.title || '' });
            }
        });
    } catch (err) {
        console.error('שגיאה בטעינת פינים מקומיים של הלוח:', err);
    }

    grid.innerHTML = '';
    if (items.length === 0) {
        grid.innerHTML = '<p class="no-boards-text">עדיין אין פינים שמורים בלוח הזה</p>';
        return;
    }

    items.forEach(function (item) {
        const postElement = document.createElement('div');
        postElement.className = 'post-card board-pin-card';

        const img = document.createElement('img');
        img.src = item.imageUrl;
        img.alt = item.title || '';

        // הסרה מהלוח בלבד - לא מבטלת את השמירה של הסיכה עצמה
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'board-delete-btn pin-unsave-btn';
        removeBtn.title = 'הסרה מהלוח';
        removeBtn.innerText = '✕';
        removeBtn.onclick = function (e) {
            e.stopPropagation();
            removePinFromBoard(item, boardId, boardName);
        };

        postElement.appendChild(img);
        postElement.appendChild(removeBtn);
        grid.appendChild(postElement);
    });
}

// מסיר פין מהלוח (השמירה עצמה נשארת ב"סיכות")
async function removePinFromBoard(item, boardId, boardName) {
    if (item.isLocal) {
        const pins = getLocalPins().map(function (p) {
            if (p.localId === item.localId) p.boardId = null;
            return p;
        });
        setLocalPins(pins);
        openBoard(boardId, boardName);
        return;
    }

    try {
        const res = await fetch('/api/boards/remove-from-board', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: item.postId, userId: loggedInUser._id })
        });

        if (res.ok) {
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
    document.getElementById('boardPinsSection').style.display = 'none';
    document.getElementById('boardsPageContainer').style.display = 'block';
}

// חיפוש בתוך הטאב הפעיל (מסנן לפי שם לוח / כותרת סיכה)
function filterBoardsGridBySearch() {
    const searchValue = document.getElementById('searchInput').value.trim().toLowerCase();
    const cards = document.querySelectorAll('#boardsGrid .board-card:not(.add-board-card)');

    cards.forEach(function (card) {
        const title = card.getAttribute('data-title') || '';
        card.style.display = title.includes(searchValue) ? '' : 'none';
    });
}

// יוצר תמונת קולאז' אחת מתוך מערך של URLs של תמונות
function createCollageDataURL(imageUrls, width = 400, height = 400) {
    return new Promise((resolve) => {
        if (!imageUrls || imageUrls.length === 0) {
            return resolve(null);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // מילוי רקע לבן
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        let loadedCount = 0;
        const total = imageUrls.length;
        
        // חישוב חלוקת הרשת (1x1, 2x2, 3x3 וכו')
        const cols = Math.ceil(Math.sqrt(total));
        const rows = Math.ceil(total / cols);
        const cellW = width / cols;
        const cellH = height / rows;

        imageUrls.forEach((url, index) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous'; // לתמיכה בתמונות משרת חיצוני
            img.onload = () => {
                const col = index % cols;
                const row = Math.floor(index / cols);
                const x = col * cellW;
                const y = row * cellH;

                // ציור התמונה בתוך המשבצת שלה
                ctx.drawImage(img, x, y, cellW, cellH);
                
                // הוספת מסגרת עדינה בין התמונות
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, cellW, cellH);

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