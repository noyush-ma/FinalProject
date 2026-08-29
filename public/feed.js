let currentOpenImg = null;

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

    // הצגת תמונת הפרופיל הנוכחית (גם באייקון בהדר וגם בתוך התפריט הנפתח)
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

function openModal(element) {
    currentOpenImg = element;
    
    var modal = document.getElementById("imageModal");
    modal.style.display = "flex";
    
    var modalImg = document.getElementById("modalImg");
    modalImg.src = element.src;

    var targetLikes = element.getAttribute("data-likes");
    document.getElementById("like-count").innerText = targetLikes;

    var targetUsername = element.getAttribute("data-username");
    document.getElementById("modalUsername").innerText = targetUsername;

    var targetDesc = element.getAttribute("data-description");
    document.getElementById("modalDesc").innerText = targetDesc;

    document.getElementById("heartIcon").src = "icons/emptyHeart.png";

    var saveBtn = document.getElementById("saveBtn");
    saveBtn.innerText = "שמירה";
    saveBtn.style.backgroundColor = "#e60023";
    refreshSaveButtonState(element.getAttribute("data-id"));

    document.getElementById("commentsList").innerHTML = "";
    document.getElementById("commentsList").style.display = "none";
    document.getElementById("accordionArrow").classList.remove("open");
    document.getElementById("comments-title-text").innerText = "הערות (0)";
    document.getElementById("newCommentInput").value = "";
    document.getElementById("typingIndicator").style.display = "none";
}

function closeModal() {
    var modal = document.getElementById("imageModal");
    modal.style.display = "none";
}

function doLike() {
    const likeImg = document.querySelector("#likeBtn img");
    const likeCountSpan = document.getElementById("like-count");
    
    if (!likeImg || !likeCountSpan) return;

    let currentSrc = likeImg.getAttribute("src");
    let currentLikes = parseInt(likeCountSpan.textContent) || 0;

    if (currentSrc === "icons/emptyHeart.png") {
        likeImg.setAttribute("src", "icons/fullHeart.png");
        likeCountSpan.textContent = currentLikes + 1;

        likeImg.classList.add("heart-pop");
    
    setTimeout(() => {
        likeImg.classList.remove("heart-pop");
    }, 400);
    
    } else {
        likeImg.setAttribute("src", "icons/emptyHeart.png");
        likeCountSpan.textContent = Math.max(0, currentLikes - 1);
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

    document.getElementById('saveBoardModal').style.display = 'flex';
    await loadUserBoardsForSaveModal();
}

function closeSaveBoardModal() {
    document.getElementById('saveBoardModal').style.display = 'none';
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

// שומר את הפוסט הפתוח כרגע ללוח נבחר (פוסט נתון נשמר תמיד רק ללוח אחד בו-זמנית)
async function saveCurrentPostToBoard(boardId) {
    if (!currentOpenImg || !loggedInUser) return;
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
    const input = document.getElementById('newBoardNameInput');
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

    var currentCount = commentsList.getElementsByClassName("comment-item").length;
    var titleText = document.getElementById("comments-title-text");
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
            method: 'DELETE'
        });

        if (res.ok) {
            // מחיקה מהדום רק אחרי שהמחיקה במונגו הצליחה
            const postCard = currentOpenImg.closest('.post-card');
            if (postCard) postCard.remove();
            closeModal();
        } else {
            const errorData = await res.json();
            alert('שגיאה במחיקת הפוסט: ' + (errorData.message || 'לא ניתן למחוק את הפוסט'));
        }
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
let clickCount = 0;

button.addEventListener('click', () => {
  document.body.classList.add('active-pink');
  setTimeout(() => {
    document.body.classList.remove('active-pink');
  }, 50);

  button.classList.remove('animate-btn');
  void button.offsetWidth; 
  button.classList.add('animate-btn');
  
  clickCount++;
  badge.textContent = clickCount;
});

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

// 1. פונקציה שטוענת ומציגה את הפוסטים מהדאטהבייס
 async function loadPostsFromDB() {
  try {
    const res = await fetch('/api/posts');
    const posts = await res.json();

    const postsContainer = document.getElementById('postsContainer');

    posts.forEach(post => {
      const postElement = document.createElement('div');
      postElement.className = 'post-card';
      postElement.setAttribute('data-category', (post.category || 'General').toLowerCase());
      postElement.setAttribute('data-id', post._id);

      const img = document.createElement('img');
      img.src = post.imageUrl;
      img.alt = post.title;
      img.setAttribute('data-id', post._id);
      img.setAttribute('data-likes', 0);
      img.setAttribute('data-username', 'you');
      img.setAttribute('data-description', post.textContent || '');
      img.setAttribute('onclick', 'openModal(this)');

      postElement.appendChild(img);
      postsContainer.appendChild(postElement);
    });
  } catch (err) {
    console.error('שגיאה בטעינת הפוסטים:', err);
  }
}

// הרצת הפונקציה מיד כשהעמוד מסיים להיטען
document.addEventListener('DOMContentLoaded', loadPostsFromDB);


// 2. ניהול חלון המודל (פתיחה וסגירה)
const modal = document.getElementById('postModal');
const createPostBtn = document.getElementById('createPost');
const closeModalBtn = document.getElementById('closeModal');
const postForm = document.getElementById('postForm');

// פתיחת המודל בלחיצה על כפתור יצירת פוסט
createPostBtn.addEventListener('click', () => {
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

  // שליפת ה ערכים מהטופס
  const titleVal = document.getElementById('title').value;
  const imgUrlVal = document.getElementById('imgUrl').value;
  const descriptionVal = document.getElementById('description').value;
  const categoryVal = document.getElementById('category').value;
  const postTypeVal = document.getElementById('postType').value;

  // בניית האובייקט - נשלח authorId חוקי של מונגו בפורמט ObjectId (24 תווים)
  const newPostData = {
    title: titleVal,
    imgUrl: imgUrlVal,
    description: descriptionVal,
    category: categoryVal,
    postType: postTypeVal,
  };

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(newPostData)
    });

    if (res.ok) {
      alert('הפוסט פורסם בהצלחה!');
      postForm.reset();
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
