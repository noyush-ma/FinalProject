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

    loadBoards();
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

// טוען אך ורק את הלוחות של המשתמש המחובר - כל משתמש רואה רק את הלוחות שלו
async function loadBoards() {
    const grid = document.getElementById('boardsGrid');
    const noBoardsMsg = document.getElementById('noBoardsMessage');
    grid.innerHTML = '';

    try {
        const res = await fetch('/api/boards/user/' + loggedInUser._id);
        const boards = await res.json();

        if (!boards || boards.length === 0) {
            noBoardsMsg.style.display = 'block';
            return;
        }
        noBoardsMsg.style.display = 'none';

        boards.forEach(function (board) {
            const card = document.createElement('div');
            card.className = 'board-card';
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

async function createNewBoard() {
    const input = document.getElementById('newBoardInput');
    const name = input.value.trim();

    if (!name) {
        alert('יש להזין שם ללוח');
        return;
    }

    try {
        const res = await fetch('/api/boards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, ownerId: loggedInUser._id })
        });

        if (res.ok) {
            input.value = '';
            loadBoards();
        } else {
            const errorData = await res.json();
            alert('שגיאה ביצירת הלוח: ' + (errorData.message || 'לא ניתן ליצור את הלוח'));
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

// פתיחת תצוגת הפינים השמורים בלוח מסוים - השרת מוודא שהמשתמש המחובר הוא בעל הלוח
async function openBoard(boardId, boardName) {
    document.getElementById('boardsPageContainer').style.display = 'none';
    const section = document.getElementById('boardPinsSection');
    section.style.display = 'block';
    document.getElementById('boardPinsTitle').innerText = boardName;

    const grid = document.getElementById('boardPinsGrid');
    grid.innerHTML = '<p class="no-boards-text">טוען...</p>';

    try {
        const res = await fetch('/api/boards/' + boardId + '/pins?userId=' + loggedInUser._id);
        const posts = await res.json();

        grid.innerHTML = '';
        if (!posts || posts.length === 0) {
            grid.innerHTML = '<p class="no-boards-text">עדיין אין פינים שמורים בלוח הזה</p>';
            return;
        }

        posts.forEach(function (post) {
            const postElement = document.createElement('div');
            postElement.className = 'post-card';

            const img = document.createElement('img');
            img.src = post.imageUrl;
            img.alt = post.title || '';

            postElement.appendChild(img);
            grid.appendChild(postElement);
        });
    } catch (err) {
        console.error('שגיאה בטעינת תוכן הלוח:', err);
        grid.innerHTML = '<p class="no-boards-text">שגיאה בטעינת הלוח</p>';
    }
}

function closeBoardView() {
    document.getElementById('boardPinsSection').style.display = 'none';
    document.getElementById('boardsPageContainer').style.display = 'block';
}
