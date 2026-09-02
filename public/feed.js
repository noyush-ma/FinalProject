let currentOpenImg = null;
let pendingEditPassword = null;
let pendingEditPostId = null;
let pendingEditPostData = null;

// --- ניהול משתמש מחובר ---
// שולף את פרטי המשתמש המחובר שנשמרו ב-sessionStorage בזמן ה-login/signup
const loggedInUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

// הגנה על עמוד ה-feed: אם אין משתמש מחובר, מחזירים אותו אוטומטית לדף ההתחברות
if (!loggedInUser) {
    window.location.href = 'login.html';
}

// הצגת שם המשתמש בתפריט הנפתח שנפתח דרך אייקון הפרופיל
document.addEventListener('DOMContentLoaded', () => {
    const usernameEl = document.getElementById('profileUsername');
    if (usernameEl && loggedInUser) {
        usernameEl.textContent = loggedInUser.username;
    }

    // --- עריכת שם משתמש (מתעדכן גם ב-MongoDB) ---
    const editBtn = document.getElementById('editUsernameBtn');
    const editInput = document.getElementById('editUsernameInput');
    const usernameError = document.getElementById('usernameError');

    function enterEditMode() {
        usernameError.textContent = '';
        editInput.value = loggedInUser.username;
        usernameEl.style.display = 'none';
        editBtn.style.display = 'none';
        editInput.hidden = false;
        editInput.focus();
        editInput.select();
    }

    function exitEditMode() {
        editInput.hidden = true;
        usernameEl.style.display = '';
        editBtn.style.display = '';
    }

    async function saveNewUsername() {
        const newUsername = editInput.value.trim();
        usernameError.textContent = '';

        if (!newUsername) {
            usernameError.textContent = 'שם המשתמש לא יכול להיות ריק';
            return;
        }
        if (newUsername === loggedInUser.username) {
            exitEditMode();
            return;
        }

        try {
            const res = await fetch('/api/users/' + loggedInUser._id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername })
            });
            const data = await res.json();

            if (!res.ok) {
                usernameError.textContent = data.message || 'שגיאה בעדכון שם המשתמש';
                return;
            }

            // עדכון הזיכרון המקומי (sessionStorage) והתצוגה, בהתאם למה שחזר בפועל מהשרת
            loggedInUser.username = data.username;
            sessionStorage.setItem('currentUser', JSON.stringify(loggedInUser));
            usernameEl.textContent = data.username;
            exitEditMode();
        } catch (err) {
            usernameError.textContent = 'שגיאת תקשורת עם השרת';
        }
    }

    if (editBtn && editInput) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            enterEditMode();
        });
        editInput.addEventListener('click', (e) => e.stopPropagation());
        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveNewUsername();
            if (e.key === 'Escape') exitEditMode();
        });
        editInput.addEventListener('blur', saveNewUsername);
    }

    // הצגת תמונת הפרופיל הנוכחית (גם באייקון בהדר וגם בתוך התפריט הנפתח)
    const headerImg = document.getElementById('profileImg');
    const dropdownImg = document.getElementById('profileDropdownImg');
    const currentImage = (loggedInUser && loggedInUser.profileImage) ? loggedInUser.profileImage : 'icons/profileLogo.png';
    if (dropdownImg) dropdownImg.src = currentImage;

    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
        // סגירת התפריט בלחיצה מחוץ לו
        window.addEventListener('click', () => {
            profileDropdown.classList.remove('show');
        });
        // מונע סגירה כשלוחצים בתוך התפריט עצמו (למשל על תמונת הפרופיל)
        profileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // העלאת תמונת פרופיל חדשה מהמחשב
    const profileImageInput = document.getElementById('profileImageInput');
    if (profileImageInput) {
        profileImageInput.addEventListener('change', handleProfileImageChange);
    }
});

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

        // עדכון התמונה בהדר ובתפריט הנפתח
        const headerImg = document.getElementById('profileImg');
        const dropdownImg = document.getElementById('profileDropdownImg');
        if (headerImg) headerImg.src = dataUrl;
        if (dropdownImg) dropdownImg.src = dataUrl;

        // עדכון המשתמש המחובר בזיכרון הדפדפן כדי שהתמונה תישאר גם אחרי רענון
        loggedInUser.profileImage = updatedUser.profileImage || dataUrl;
        sessionStorage.setItem('currentUser', JSON.stringify(loggedInUser));
    } catch (err) {
        console.error(err);
        alert('שגיאה בהעלאת התמונה');
    } finally {
        event.target.value = '';
    }
}

// התנתקות: מנקה את פרטי המשתמש מהזיכרון ומחזיר לדף ההתחברות
function handleLogout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

let currentModalAuthorId = null;
let followingIds = new Set((loggedInUser && loggedInUser.following) ? loggedInUser.following.map(String) : []);

function openModal(element) {
    currentOpenImg = element;
    
    var modal = document.getElementById("imageModal");
    modal.style.display = "flex";

    var modalImg = document.getElementById("modalImg");
    var modalVideo = document.getElementById("modalVideo");
    var isVideo = element.tagName === 'VIDEO' || element.getAttribute('data-media-type') === 'video';

    if (isVideo) {
        modalVideo.pause();
        modalVideo.src = element.currentSrc || element.src;
        modalVideo.classList.remove("landscape");
        modalVideo.onloadedmetadata = function () {
            if (modalVideo.videoWidth > modalVideo.videoHeight) {
                modalVideo.classList.add("landscape");
            }
        };
        modalVideo.style.display = "block";
        modalImg.style.display = "none";
        modalImg.src = "";
    } else {
        modalVideo.pause();
        modalVideo.style.display = "none";
        modalVideo.src = "";
        modalImg.style.display = "block";
        modalImg.src = element.src;

        // זיהוי אוריינטציה: תמונה רוחבית (landscape) תוצג במלואה (contain),
        // תמונה אנכית תמשיך להתנהג כמו היום (cover)
        modalImg.classList.remove("landscape");
        modalImg.onload = function () {
            if (modalImg.naturalWidth > modalImg.naturalHeight) {
                modalImg.classList.add("landscape");
            }
        };
    }

    var targetLikes = element.getAttribute("data-likes");
    document.getElementById("like-count").innerText = targetLikes;

    var targetUsername = element.getAttribute("data-username");
    document.getElementById("modalUsername").innerText = targetUsername;

    var targetDesc = element.getAttribute("data-description");
    document.getElementById("modalDesc").innerText = targetDesc;

    // מצב הלב משתקף מהמצב שנשמר בפועל בפוסט (לא מתאפס יותר בכל פתיחה)
    var likedByMe = element.getAttribute("data-liked-by-me") === "true";
    document.getElementById("heartIcon").src = likedByMe ? "icons/fullHeart.png" : "icons/emptyHeart.png";

    // --- כפתור עקיבה אחרי מי שהעלה את הפוסט ---
    var followBtn = document.getElementById("followBtn");
    var postDataRaw = element.dataset.post;
    currentModalAuthorId = null;
    if (postDataRaw) {
        try {
            var postData = JSON.parse(postDataRaw);
            if (postData.author && loggedInUser && postData.author !== loggedInUser._id) {
                currentModalAuthorId = postData.author;
                followBtn.hidden = false;
                updateFollowBtnUI();
            } else {
                followBtn.hidden = true;
            }
        } catch (e) {
            followBtn.hidden = true;
        }
    } else {
        // פוסט לוקאלי קבוע (מה-HTML) - אין משתמש אמיתי לעקוב אחריו
        followBtn.hidden = true;
    }

    var saveBtn = document.getElementById("saveBtn");
    saveBtn.innerText = "שמירה";
    saveBtn.style.backgroundColor = "#e60023";
    refreshSaveButtonState(element.getAttribute("data-id"));

    document.getElementById("commentsList").innerHTML = "";
    document.getElementById("newCommentInput").value = "";
    document.getElementById("typingIndicator").style.display = "none";
}

function updateFollowBtnUI() {
    var followBtn = document.getElementById("followBtn");
    if (!currentModalAuthorId) return;
    var isFollowing = followingIds.has(currentModalAuthorId);
    followBtn.textContent = isFollowing ? "עוקב/ת" : "עקוב";
    followBtn.classList.toggle("following", isFollowing);
}

// טוגל עקיבה אחרי מי שהעלה את הפוסט הפתוח כרגע - מתעדכן ונשמר ב-MongoDB
async function toggleFollowAuthor() {
    if (!currentModalAuthorId || !loggedInUser) return;
    var followBtn = document.getElementById("followBtn");
    followBtn.disabled = true;

    try {
        const res = await fetch('/api/users/' + currentModalAuthorId + '/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ followerId: loggedInUser._id })
        });
        const data = await res.json();

        if (res.ok) {
            if (data.following) {
                followingIds.add(currentModalAuthorId);
            } else {
                followingIds.delete(currentModalAuthorId);
            }
            // עדכון גם בזיכרון המקומי כדי שהמצב יישאר תקין גם אחרי רענון
            loggedInUser.following = Array.from(followingIds);
            sessionStorage.setItem('currentUser', JSON.stringify(loggedInUser));
            updateFollowBtnUI();
        }
    } catch (err) {
        console.error('שגיאה בעדכון עקיבה:', err);
    } finally {
        followBtn.disabled = false;
    }
}

function closeModal() {
    var modal = document.getElementById("imageModal");
    modal.style.display = "none";
    var modalVideo = document.getElementById("modalVideo");
    if (modalVideo) {
        modalVideo.pause();
    }
}

// עושה/מבטל לייק לפוסט הפתוח כרגע במודל, ושומר את זה לצמיתות ב-MongoDB
// (אם הפוסט לוקאלי-קבוע מה-HTML, בלי מזהה אמיתי - הלייק נשאר ויזואלי בלבד לאותו סשן)
async function doLike() {
    const likeImg = document.querySelector("#likeBtn img");
    const likeCountSpan = document.getElementById("like-count");

    if (!likeImg || !likeCountSpan || !currentOpenImg) return;

    const postId = currentOpenImg.getAttribute("data-id");
    let currentSrc = likeImg.getAttribute("src");
    const wasLiked = currentSrc === "icons/fullHeart.png";

    // עדכון אופטימי מיידי בממשק
    likeImg.setAttribute("src", wasLiked ? "icons/emptyHeart.png" : "icons/fullHeart.png");
    if (!wasLiked) {
        likeImg.classList.add("heart-pop");
        setTimeout(() => likeImg.classList.remove("heart-pop"), 400);
    }

    // פוסט לוקאלי-קבוע (אין data-id אמיתי) - אין עם מי לדבר בשרת, נשאר רק ויזואלי
    if (!postId || !loggedInUser) {
        let currentLikes = parseInt(likeCountSpan.textContent) || 0;
        likeCountSpan.textContent = wasLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
        return;
    }

    try {
        const res = await fetch('/api/posts/' + postId + '/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: loggedInUser._id })
        });
        const data = await res.json();

        if (!res.ok) {
            // נכשל בשרת - מחזירים את המצב הקודם
            likeImg.setAttribute("src", wasLiked ? "icons/fullHeart.png" : "icons/emptyHeart.png");
            return;
        }

        likeCountSpan.textContent = data.likesCount;
        likeImg.setAttribute("src", data.liked ? "icons/fullHeart.png" : "icons/emptyHeart.png");

        // מעדכנים גם את הכרטיס בפיד עצמו, כדי שהמצב יישאר נכון גם בלי לרענן את הדף
        currentOpenImg.setAttribute("data-likes", data.likesCount);
        currentOpenImg.setAttribute("data-liked-by-me", data.liked ? "true" : "false");
    } catch (err) {
        console.error('שגיאה בשמירת הלייק:', err);
        likeImg.setAttribute("src", wasLiked ? "icons/fullHeart.png" : "icons/emptyHeart.png");
    }
}

// בודק מול השרת אם הפוסט הפתוח כרגע כבר שמור על ידי המשתמש המחובר, ומעדכן את כפתור השמירה בהתאם
async function refreshSaveButtonState(postId) {
    var saveBtn = document.getElementById("saveBtn");
    if (!postId || !loggedInUser) return;

    try {
        const res = await fetch('/api/boards/save-status/' + postId + '/' + loggedInUser._id);
        const data = await res.json();
        if (data.saved) {
            saveBtn.innerText = "נשמר";
            saveBtn.style.backgroundColor = "#333333";
        }
    } catch (err) {
        console.error('שגיאה בבדיקת מצב שמירה:', err);
    }
}

// לחיצה על כפתור השמירה בתוך המודל: אם כבר שמור - מסירים, אחרת פותחים בחירת לוח
function doSave() {
    var saveBtn = document.getElementById("saveBtn");
    if (saveBtn.innerText === "נשמר") {
        unsaveCurrentPost();
    } else {
        openSaveBoardModal();
    }
}

// הסרת השמירה של הפוסט הפתוח כרגע (רק עבור המשתמש המחובר)
async function unsaveCurrentPost() {
    if (!currentOpenImg || !loggedInUser) return;
    const postId = currentOpenImg.getAttribute("data-id");
    if (!postId) return;

    try {
        const res = await fetch('/api/boards/unsave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: postId, userId: loggedInUser._id })
        });

        if (res.ok) {
            var saveBtn = document.getElementById("saveBtn");
            saveBtn.innerText = "שמירה";
            saveBtn.style.backgroundColor = "#e60023";
        }
    } catch (err) {
        console.error('שגיאה בהסרת השמירה:', err);
    }
}

// פותח את חלון בחירת הלוח לשמירת הפוסט הפתוח כרגע
async function openSaveBoardModal() {
    if (!currentOpenImg) return;
    const postId = currentOpenImg.getAttribute("data-id");
    if (!postId) {
        alert('לא ניתן לשמור פוסט זה כרגע');
        return;
    }

    const saveBoardModalEl = document.getElementById('saveBoardModal');
    if (!saveBoardModalEl) {
        // TODO: פיצ'ר שמירה ללוחות עדיין לא הושלם ב-HTML (חסר מודאל #saveBoardModal)
        alert('פיצ\'ר שמירה ללוחות עדיין לא זמין');
        return;
    }
    saveBoardModalEl.style.display = 'flex';
    await loadUserBoardsForSaveModal();
}

function closeSaveBoardModal() {
    const saveBoardModalEl = document.getElementById('saveBoardModal');
    if (saveBoardModalEl) saveBoardModalEl.style.display = 'none';
}

// טוען את הלוחות של המשתמש המחובר בלבד (כל משתמש רואה רק את הלוחות שלו) לחלון השמירה
async function loadUserBoardsForSaveModal() {
    const listEl = document.getElementById('userBoardsList');
    if (!loggedInUser) return;
    listEl.innerHTML = '<p class="no-boards-text">טוען לוחות...</p>';

    try {
        const res = await fetch('/api/boards/user/' + loggedInUser._id);
        const boards = await res.json();

        listEl.innerHTML = '';
        if (!boards || boards.length === 0) {
            listEl.innerHTML = '<p class="no-boards-text">עדיין אין לך לוחות. צרי לוח חדש למטה 👇</p>';
            return;
        }

        boards.forEach(function (board) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'board-select-item';
            item.innerText = board.name;
            item.onclick = function () { saveCurrentPostToBoard(board._id); };
            listEl.appendChild(item);
        });
    } catch (err) {
        console.error('שגיאה בטעינת הלוחות:', err);
        listEl.innerHTML = '<p class="no-boards-text">שגיאה בטעינת הלוחות</p>';
    }
}

async function saveCurrentPostToBoard(boardId) {
    const postId = currentOpenImg.getAttribute("data-id");
    if (!postId) return;

    try {
        const res = await fetch('/api/boards/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: postId, boardId: boardId, userId: loggedInUser._id })
        });

        if (res.ok) {
            var saveBtn = document.getElementById("saveBtn");
            saveBtn.innerText = "נשמר";
            saveBtn.style.backgroundColor = "#333333";
            closeSaveBoardModal();
        } else {
            const errorData = await res.json();
            alert('שגיאה בשמירה: ' + (errorData.message || 'לא ניתן לשמור את הפוסט'));
        }
    } catch (err) {
        console.error(err);
        alert('שגיאה בתקשורת עם השרת בזמן השמירה');
    }
}

// יוצר לוח חדש ומיד שומר אליו את הפוסט הפתוח כרגע
async function createBoardAndSave() {
    const name = input.value.trim();

    if (!name) {
        alert('יש להזין שם ללוח');
        return;
    }
    if (!loggedInUser) return;

    try {
        const res = await fetch('/api/boards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, ownerId: loggedInUser._id })
        });

        if (res.ok) {
            const newBoard = await res.json();
            input.value = '';
            await saveCurrentPostToBoard(newBoard._id);
        } else {
            const errorData = await res.json();
            alert('שגיאה ביצירת הלוח: ' + (errorData.message || 'לא ניתן ליצור את הלוח'));
        }
    } catch (err) {
        console.error(err);
        alert('שגיאה בתקשורת עם השרת בזמן יצירת הלוח');
    }
}

function postsText() {
    var searchValue = document.getElementById("searchInput").value.toLowerCase();
    var postCards = document.querySelectorAll(".post-card");
    var hasResults = false;

    postCards.forEach(function(card) {
        var img = card.querySelector("img");
        var description = img.getAttribute("data-description").toLowerCase();

        if (description.includes(searchValue)) {
            card.style.display = "block";
            hasResults = true;
        } else {
            card.style.display = "none";
        }
    });

    var noResultsDiv = document.getElementById("noResultsMessage");
    if (hasResults) {
        noResultsDiv.style.display = "none";
    } else {
        noResultsDiv.style.display = "block";
    }
}
document.getElementById("searchInput").addEventListener("input", postsText);

function toggleComments() {
    var commentsList = document.getElementById("commentsList");
    var arrow = document.getElementById("accordionArrow");

    if (commentsList.style.display === "none") {
        commentsList.style.display = "block";
        arrow.classList.add("open");
    } else {
        commentsList.style.display = "none";
        arrow.classList.remove("open");
    }
}

function focusCommentInput() {
    var commentsList = document.getElementById("commentsList");
    var arrow = document.getElementById("accordionArrow");

    if (commentsList.style.display === "none") {
        commentsList.style.display = "block";
        arrow.classList.add("open");
    }
    var inputComment = document.getElementById("newCommentInput");
    inputComment.focus();
}

function showTyping() {
    var inputComment = document.getElementById("newCommentInput");
    var indicator = document.getElementById("typingIndicator");
    var sendBtn = document.getElementById("sendCommentBtn");
    
    if (inputComment.value.trim().length > 0) {
        indicator.style.display = "block";
        sendBtn.style.display = "inline-flex";
    } else {
        indicator.style.display = "none";
        sendBtn.style.display = "none";
    }
}

function addComment() {
    var inputComment = document.getElementById("newCommentInput");
    var commentText = inputComment.value.trim();
    var commentsList = document.getElementById("commentsList");
    var sendBtn = document.getElementById("sendCommentBtn");

    if (commentText === "") {
        return;
    }

    if (commentsList.style.display === "none") {
        commentsList.style.display = "block";
        document.getElementById("accordionArrow").classList.add("open");
    }

    var newComment = document.createElement("div");
    newComment.className = "comment-item";
    newComment.innerText = commentText;
    commentsList.appendChild(newComment);

    var titleText = document.getElementById("comments-title-text");
    var currentCount = commentsList.getElementsByClassName("comment-item").length;
    if (currentCount === 1) {
        titleText.innerText = "הערה 1";
    } else {
        titleText.innerText = "הערות (" + currentCount + ")";
    }

    inputComment.value = "";
    sendBtn.style.display = "none";
    document.getElementById("typingIndicator").style.display = "none";
    commentsList.scrollTop = commentsList.scrollHeight;
}

function openShareModal() {
    var shareModal = document.getElementById("shareModal");
    shareModal.style.display = "flex";
}

function closeShareModal() {
    var shareModal = document.getElementById("shareModal");
    shareModal.style.display = "none";
}

function toggleDeleteMenu(event) {
    event.stopPropagation();
    const dropdown = document.getElementById("deleteDropdown");
    const isHidden = window.getComputedStyle(dropdown).display === "none";
    dropdown.style.display = isHidden ? "block" : "none";
}

async function deleteCurrentPost() {
    if (!currentOpenImg) return;

    const postData = JSON.parse(currentOpenImg.dataset.post || '{}');

    if (!loggedInUser || postData.author !== loggedInUser._id) {
        alert("ניתן למחוק רק פוסטים שהעלית בעצמך");
        document.getElementById("deleteDropdown").style.display = "none";
        return;
    }

    const confirmDelete = confirm("האם את בטוחה שברצונך למחוק פוסט זה?");
    if (!confirmDelete) return;

    document.getElementById("deleteDropdown").style.display = "none";

    const postId = currentOpenImg.getAttribute("data-id");

    // אם אין מזהה מונגו (למשל פוסט ישן/דמו שלא הגיע מהדאטהבייס) - רק מסתירים בעמוד
    if (!postId) {
        const postCard = currentOpenImg.closest('.post-card');
        if (postCard) postCard.remove();
        closeModal();
        return;
    }

    try {
        const res = await fetch('/api/posts/' + postId, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: loggedInUser._id })
        });
    } catch (err) {
        console.error(err);
        alert('שגיאה בתקשורת עם השרת בזמן מחיקת הפוסט');
    }
}

window.addEventListener('click', function() {
    const dropdown = document.getElementById("deleteDropdown");
    if (dropdown) {
        dropdown.style.display = "none";
    }
});

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const btn = document.getElementById("darkModeBtn");
    if (document.body.classList.contains("dark-mode")) {
        btn.innerText = "☀️";
    } else {
        btn.innerText = "🌙";
    }
}
   
const button = document.getElementById('createPost');
const badge = document.getElementById('badge');

// אנימציית "רעד" קטנה על כפתור יצירת הפוסט בלחיצה (ויזואלי בלבד, לא קשור להתראות)
button.addEventListener('click', () => {
  button.classList.remove('animate-btn');
  void button.offsetWidth; 
  button.classList.add('animate-btn');
});

// ==================== מרכז ההתראות ====================
// כפתור הפעמון פותח מודל עם כל היסטוריית ההתראות (במקום פופ-אפים קופצים בצד).
// הבאדג' ליד הפעמון מציג את מספר ההתראות שעוד לא נקראו, ומתעדכן כל כמה שניות.

const notificationsModal = document.getElementById('notificationsModal');
const notificationsList = document.getElementById('notificationsList');
const notificationsEmptyMsg = document.getElementById('notificationsEmptyMsg');
const messagesButton = document.getElementById('messagesButton');
const closeNotificationsModal = document.getElementById('closeNotificationsModal');

// מחזיר טקסט זמן יחסי קצר וקריא ("לפני 3 דקות" וכו') מתאריך התראה
function formatNotificationTime(dateString) {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'ממש עכשיו';
    if (diffMin < 60) return `לפני ${diffMin} דקות`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    const diffDays = Math.floor(diffHours / 24);
    return `לפני ${diffDays} ימים`;
}

// שולף ומרענן רק את מספר ההתראות שלא נקראו (עבור הבאדג' ליד הפעמון)
async function refreshNotificationsBadge() {
    if (!loggedInUser) return;
    try {
        const res = await fetch('/api/notifications/user/' + loggedInUser._id);
        const unread = await res.json();
        if (unread.length > 0) {
            badge.textContent = unread.length;
            badge.classList.add('show');
        } else {
            badge.classList.remove('show');
        }
    } catch (err) {
        console.error('שגיאה בבדיקת התראות חדשות:', err);
    }
}

// בונה שורת התראה בודדת בתוך מרכז ההתראות, כולל כפתורי הפעולה המתאימים לסוג שלה
function buildNotificationItem(notification) {
    const item = document.createElement('div');
    item.className = 'notification-item' + (notification.isRead ? '' : ' unread');

    const body = document.createElement('div');
    body.className = 'notification-item-body';
    body.innerHTML = `
        <p class="notification-item-text">${notification.text}</p>
        <span class="notification-item-time">${formatNotificationTime(notification.createdAt)}</span>
    `;
    item.appendChild(body);

    const actions = document.createElement('div');
    actions.className = 'notification-item-actions';

    if (notification.type === 'GROUP_INVITE' && notification.status === 'PENDING') {
        const acceptBtn = document.createElement('button');
        acceptBtn.className = 'notification-action-btn primary';
        acceptBtn.textContent = 'אשר';
        acceptBtn.onclick = () => respondToGroupInviteFromCenter(notification._id, 'ACCEPTED', item);

        const declineBtn = document.createElement('button');
        declineBtn.className = 'notification-action-btn secondary';
        declineBtn.textContent = 'דחה';
        declineBtn.onclick = () => respondToGroupInviteFromCenter(notification._id, 'DECLINED', item);

        actions.appendChild(acceptBtn);
        actions.appendChild(declineBtn);
    } else if (notification.type === 'NEW_MESSAGE') {
        const gotoBtn = document.createElement('button');
        gotoBtn.className = 'notification-action-btn primary';
        gotoBtn.textContent = 'חזרה להודעה';
        gotoBtn.onclick = () => {
            notificationsModal.style.display = 'none';
            const groupId = notification.group && (notification.group._id || notification.group);
            if (groupId && window.openGroupChatFromNotifications) {
                window.openGroupChatFromNotifications(groupId);
            }
        };
        actions.appendChild(gotoBtn);
    } else if (notification.type === 'NEW_POST') {
        const gotoBtn = document.createElement('button');
        gotoBtn.className = 'notification-action-btn primary';
        gotoBtn.textContent = 'צפייה בפיד חברים';
        gotoBtn.onclick = () => {
            notificationsModal.style.display = 'none';
            showFriendsFeed();
        };
        actions.appendChild(gotoBtn);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'notification-delete-btn';
    deleteBtn.title = 'מחיקת התראה';
    deleteBtn.textContent = '🗑';
    deleteBtn.onclick = () => deleteNotificationFromCenter(notification._id, item);
    actions.appendChild(deleteBtn);

    item.appendChild(actions);
    return item;
}

// שולף את כל היסטוריית ההתראות ומרנדר אותה בתוך המודל
async function loadNotificationsCenter() {
    if (!loggedInUser) return;
    try {
        const res = await fetch('/api/notifications/user/' + loggedInUser._id + '/all');
        const notifications = await res.json();

        notificationsList.querySelectorAll('.notification-item').forEach((el) => el.remove());

        if (!notifications.length) {
            notificationsEmptyMsg.style.display = 'block';
        } else {
            notificationsEmptyMsg.style.display = 'none';
            notifications.forEach((notification) => {
                notificationsList.appendChild(buildNotificationItem(notification));
            });
        }

        // סימון כל ההתראות שנטענו כ"נקראו", ורענון הבאדג' בהתאם
        const unreadOnes = notifications.filter((n) => !n.isRead);
        await Promise.all(unreadOnes.map((n) =>
            fetch('/api/notifications/' + n._id + '/read', { method: 'PUT' }).catch(() => {})
        ));
        refreshNotificationsBadge();
    } catch (err) {
        console.error('שגיאה בטעינת מרכז ההתראות:', err);
    }
}

// מטפל בלחיצה על "אשר"/"דחה" בהזמנה לקבוצה, ישירות מתוך מרכז ההתראות
async function respondToGroupInviteFromCenter(notificationId, response, itemEl) {
    try {
        await fetch('/api/groups/invite/' + notificationId + '/respond', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ response })
        });
        itemEl.remove();
        if (response === 'ACCEPTED' && window.refreshMyGroupsFromNotifications) {
            window.refreshMyGroupsFromNotifications();
        }
    } catch (err) {
        console.error('שגיאה בטיפול בהזמנה:', err);
    }
}

// מוחק התראה לצמיתות ממרכז ההתראות (וגם מה-DB)
async function deleteNotificationFromCenter(notificationId, itemEl) {
    try {
        await fetch('/api/notifications/' + notificationId, { method: 'DELETE' });
        itemEl.remove();
        if (!notificationsList.querySelector('.notification-item')) {
            notificationsEmptyMsg.style.display = 'block';
        }
    } catch (err) {
        console.error('שגיאה במחיקת ההתראה:', err);
    }
}

if (messagesButton) {
    messagesButton.addEventListener('click', () => {
        notificationsModal.style.display = 'flex';
        loadNotificationsCenter();
    });
}
if (closeNotificationsModal) {
    closeNotificationsModal.addEventListener('click', () => {
        notificationsModal.style.display = 'none';
    });
}
notificationsModal.addEventListener('click', (e) => {
    if (e.target === notificationsModal) {
        notificationsModal.style.display = 'none';
    }
});

// בודקים מייד עם טעינת הדף, ואז כל כמה שניות, אם יש התראות חדשות שלא נקראו (לבאדג' בלבד)
refreshNotificationsBadge();
setInterval(refreshNotificationsBadge, 5000);

window.onscroll = function() {
    const topBtn = document.getElementById("scrollToTopBtn");
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        topBtn.style.display = "block";
    } else {
        topBtn.style.display = "none";
    }
};

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: "smooth" 
    });
}

function toggleThreeDotsMenu() {
    const dropdown = document.getElementById('filterDropdown');
    dropdown.classList.toggle('show');
}

function filterImages(category) {
    const posts = document.querySelectorAll('.post-card');
    const noResultsMessage = document.getElementById('noResultsMessage');
    let hasVisibleItems = false;

    posts.forEach(post => {
        if (category === 'all' || post.getAttribute('data-category') === category) {
            post.style.display = 'block';
            hasVisibleItems = true;
        } else {
            post.style.display = 'none';
        }
    });

    if (hasVisibleItems) {
        noResultsMessage.style.display = 'none';
    } else {
        noResultsMessage.style.display = 'block';
    }

    document.getElementById('filterDropdown').classList.remove('show');
}

window.addEventListener('click', function(event) {
    if (!event.target.matches('#threeDots')) {
        const dropdown = document.getElementById('filterDropdown');
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
});

// בונה את אלמנט ה-DOM של כרטיס פוסט בודד (משמש גם לפיד הראשי וגם לפיד החברים)
function buildPostCardElement(post) {
  const postElement = document.createElement('div');
  postElement.className = 'post-card';
  postElement.setAttribute('data-category', (post.category || 'General').toLowerCase());
  postElement.setAttribute('data-id', post._id);

  const likedBy = (post.likedBy || []).map(String);
  const likedByMe = !!(loggedInUser && likedBy.includes(loggedInUser._id));

  const isVideo = post.postType === 'VIDEO';
  const mediaEl = document.createElement(isVideo ? 'video' : 'img');
  mediaEl.src = post.imageUrl;
  if (isVideo) {
    mediaEl.muted = true;
    mediaEl.setAttribute('playsinline', '');
    mediaEl.setAttribute('preload', 'metadata');
  } else {
    mediaEl.alt = post.title;
  }
  mediaEl.setAttribute('data-id', post._id);
  mediaEl.setAttribute('data-likes', likedBy.length);
  mediaEl.setAttribute('data-liked-by-me', likedByMe ? 'true' : 'false');
  mediaEl.setAttribute('data-username', post.authorUsername || 'משתמש לא ידוע');
  mediaEl.setAttribute('data-description', post.textContent || '');
  mediaEl.setAttribute('data-media-type', isVideo ? 'video' : 'image');
  mediaEl.setAttribute('onclick', 'openModal(this)');
  mediaEl.dataset.post = JSON.stringify(post);

  postElement.appendChild(mediaEl);
  return postElement;
}

// 1. פונקציה שטוענת ומציגה את הפוסטים מהדאטהבייס (הפיד הראשי - כל הפוסטים)
 async function loadPostsFromDB() {
  try {
    const res = await fetch('/api/posts');
    const posts = await res.json();
    const postsContainer = document.getElementById('postsContainer');

    // מסירים כרטיסי DB קודמים (אם יש) כדי לא לשכפל בעת מעבר חזרה מפיד החברים
    postsContainer.querySelectorAll('.post-card[data-id]').forEach((el) => el.remove());

    posts.forEach(post => {
      postsContainer.appendChild(buildPostCardElement(post));
    });
  } catch (err) {
    console.error('שגיאה בטעינת הפוסטים:', err);
  }
}

// טוען רק פוסטים של משתמשים שהמשתמש המחובר עוקב אחריהם ("פיד חברים")
async function loadFollowingPosts() {
  try {
    const res = await fetch('/api/posts/following/' + loggedInUser._id);
    const posts = await res.json();
    const postsContainer = document.getElementById('postsContainer');

    postsContainer.querySelectorAll('.post-card[data-id]').forEach((el) => el.remove());

    posts.forEach(post => {
      postsContainer.appendChild(buildPostCardElement(post));
    });

    document.getElementById('noFriendsPostsMessage').style.display = posts.length ? 'none' : 'block';
  } catch (err) {
    console.error('שגיאה בטעינת פיד החברים:', err);
  }
}

// --- מעבר בין הפיד הראשי לפיד החברים ---
let currentFeedMode = 'main';

function showMainFeed() {
    currentFeedMode = 'main';
    document.getElementById('mainFeedBtn').classList.add('active');
    document.getElementById('friendsFeedBtn').classList.remove('active');
    document.getElementById('noFriendsPostsMessage').style.display = 'none';
    document.querySelectorAll('.post-card:not([data-id])').forEach((el) => {
        el.style.display = '';
    });
    loadPostsFromDB();
}

function showFriendsFeed() {
    currentFeedMode = 'friends';
    document.getElementById('friendsFeedBtn').classList.add('active');
    document.getElementById('mainFeedBtn').classList.remove('active');
    // מסתירים את הפוסטים הלוקאליים הקבועים - פיד החברים מציג רק פוסטים אמיתיים של עוקבים
    document.querySelectorAll('.post-card:not([data-id])').forEach((el) => {
        el.style.display = 'none';
    });
    loadFollowingPosts();
}

document.getElementById('mainFeedBtn').addEventListener('click', showMainFeed);
document.getElementById('friendsFeedBtn').addEventListener('click', showFriendsFeed);

// הרצת הפונקציה מיד כשהעמוד מסיים להיטען
document.addEventListener('DOMContentLoaded', loadPostsFromDB);


// 2. ניהול חלון המודל (פתיחה וסגירה)
const modal = document.getElementById('postModal');
const createPostBtn = document.getElementById('createPost');
const closeModalBtn = document.getElementById('closeModal');
const postForm = document.getElementById('postForm');

// --- החלפת השדה/תצוגה המקדימה בהתאם לסוג הפוסט (תמונה/וידאו/טקסט) ---
const postTypeSelect = document.getElementById('postType');
const mediaUrlGroup = document.getElementById('mediaUrlGroup');
const imgUrlInput = document.getElementById('imgUrl');
const imgUrlLabel = document.getElementById('imgUrlLabel');
const imgPreview = document.getElementById('imgPreview');
const videoPreview = document.getElementById('videoPreview');

function updateMediaFieldForType() {
    const type = postTypeSelect.value;

    if (type === 'IMAGE' || type === 'VIDEO') {
        mediaUrlGroup.style.display = 'block';
        imgUrlInput.required = true;
        imgUrlLabel.innerText = type === 'VIDEO' ? 'video URL:' : 'image URL:';
        imgUrlInput.placeholder = type === 'VIDEO'
            ? 'https://example.com/video.mp4'
            : 'https://example.com/image.jpg';
    } else {
        // TEXT או שאין עדיין בחירה - אין צורך בקישור מדיה
        mediaUrlGroup.style.display = 'none';
        imgUrlInput.required = false;
        imgUrlInput.value = '';
    }

    updateMediaPreview();
}

function updateMediaPreview() {
    const url = imgUrlInput.value.trim();
    const isVideo = postTypeSelect.value === 'VIDEO';

    if (isVideo) {
        imgPreview.style.display = 'none';
        imgPreview.src = '';
        if (url) {
            videoPreview.src = url;
            videoPreview.style.display = 'block';
        } else {
            videoPreview.style.display = 'none';
            videoPreview.src = '';
        }
    } else {
        videoPreview.style.display = 'none';
        videoPreview.src = '';
        if (url) {
            imgPreview.src = url;
            imgPreview.style.display = 'block';
        } else {
            imgPreview.style.display = 'none';
            imgPreview.src = '';
        }
    }
}

postTypeSelect.addEventListener('change', updateMediaFieldForType);
imgUrlInput.addEventListener('input', updateMediaPreview);

// פתיחת המודל בלחיצה על כפתור יצירת פוסט
createPostBtn.addEventListener('click', () => {
  document.getElementById('editPostId').value = '';
  pendingEditPassword = null;
  document.getElementById('postModalTitle').innerText = 'create new post';
  document.getElementById('postSubmitBtn').innerText = 'post';
  postForm.reset();
  updateMediaFieldForType();
  modal.style.display = 'flex';
});

// סגירת המודל בלחיצה על ה-X
closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// סגירת המודל בלחיצה על הרקע מחוץ לחלון
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

// 3. שליחת הטופס והוספת פוסט חדש לשרת
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const editId = document.getElementById('editPostId').value;

  const newPostData = {
    title: document.getElementById('title').value,
    imgUrl: document.getElementById('imgUrl').value,
    description: document.getElementById('description').value,
    category: document.getElementById('category').value,
    postType: document.getElementById('postType').value
  };

  if (editId) {
    newPostData.userId = loggedInUser._id;
    newPostData.password = pendingEditPassword;
  } else {
    newPostData.authorId = loggedInUser._id;
  }

  try {
    const res = await fetch('/api/posts' + (editId ? '/' + editId : ''), {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPostData)
    });

    if (res.ok) {
      alert(editId ? 'הפוסט עודכן בהצלחה!' : 'הפוסט פורסם בהצלחה!');
      postForm.reset();
      updateMediaFieldForType();
      document.getElementById('editPostId').value = '';
      pendingEditPassword = null;
      document.getElementById('postModalTitle').innerText = 'create new post';
      document.getElementById('postSubmitBtn').innerText = 'post';
      modal.style.display = 'none';
      if (typeof loadPostsFromDB === 'function') loadPostsFromDB();
    } else {
      const errorData = await res.json();
      alert('שגיאה מהשרת: ' + (errorData.message || 'לא ניתן לשמור את הפוסט'));
    }
  } catch (err) {
    console.error(err);
    alert('שגיאה בתקשורת עם השרת');
  }
});

function editCurrentPost() {
    document.getElementById("deleteDropdown").style.display = "none";
    if (!currentOpenImg) return;

    const postId = currentOpenImg.getAttribute("data-id");
    const postData = JSON.parse(currentOpenImg.dataset.post || '{}');

    if (!postId || !loggedInUser || postData.author !== loggedInUser._id) {
        alert("ניתן לערוך רק פוסטים שהעלית בעצמך");
        return;
    }

    document.getElementById("editPostId").value = postId;
    document.getElementById("title").value = postData.title || '';
    document.getElementById("imgUrl").value = postData.imageUrl || '';
    document.getElementById("description").value = postData.textContent || '';
    document.getElementById("category").value = postData.category || '';
    document.getElementById("postType").value = postData.postType || '';
    updateMediaFieldForType();

    document.getElementById("postModalTitle").innerText = "עריכת פוסט";
    document.getElementById("postSubmitBtn").innerText = "עדכן פוסט";

    closeModal();
    modal.style.display = "flex";
}