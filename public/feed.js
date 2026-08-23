let currentOpenImg = null;

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

    document.getElementById("heartIcon").src = "emptyHeart.png";

    var saveBtn = document.getElementById("saveBtn");
    saveBtn.innerText = "שמירה";
    saveBtn.style.backgroundColor = "#e60023";

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

    if (currentSrc === "emptyHeart.png") {
        likeImg.setAttribute("src", "fullHeart.png");
        likeCountSpan.textContent = currentLikes + 1;

        likeImg.classList.add("heart-pop");
    
    setTimeout(() => {
        likeImg.classList.remove("heart-pop");
    }, 400);
    
    } else {
        likeImg.setAttribute("src", "emptyHeart.png");
        likeCountSpan.textContent = Math.max(0, currentLikes - 1);
    }
}

function doSave() {
    var saveBtn = document.getElementById("saveBtn");
    if (saveBtn.innerText === "שמירה") {
        saveBtn.innerText = "נשמר";
        saveBtn.style.backgroundColor = "#333333";
    } else {
        saveBtn.innerText = "שמירה";
        saveBtn.style.backgroundColor = "#e60023";
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

function deleteCurrentPost() {
    if (!currentOpenImg) return;
    
    const confirmDelete = confirm("האם את בטוחה שברצונך למחוק פוסט זה?");
    if (confirmDelete) {
        currentOpenImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        document.getElementById("modalImg").src = currentOpenImg.src;
        document.getElementById("deleteDropdown").style.display = "none";
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
  
  if (clickCount > 0) {
    badge.classList.add('show');
    
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerText = '💬 קיבלת הודעה חדשה!';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 2000);
  } 
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

async function loadPostsFromDB() {
  try {
    const res = await fetch('/api/posts');
    const posts = await res.json();

    const postsContainer = document.getElementById('YOUR_CONTAINER_ID'); // תחליפי ל-ID של הקונטיינר אצלך
    postsContainer.innerHTML = ''; // מנקה אלמנטים קודמים/סטטיים

    posts.forEach(post => {
      // יצירת האלמנט לפי ה-HTML והעיצוב הקיים באתר שלך
      const postElement = document.createElement('div');
      postElement.className = 'post'; // הקלאס הקיים אצלך ב-CSS

      postElement.innerHTML = `
        <img src="${post.imgUrl}" alt="${post.title}">
        <h3>${post.title}</h3>
        <p>${post.description || ''}</p>
      `;

      postsContainer.appendChild(postElement);
    });
  } catch (err) {
    console.error('שגיאה בטעינת הפוסטים:', err);
  }
}

// הרצה ברגע שהעמוד נטען
document.addEventListener('DOMContentLoaded', loadPostsFromDB);

const modal = document.getElementById('postModal');
const createPostBtn = document.getElementById('createPost');
const closeModalBtn = document.getElementById('closeModal');
const postForm = document.getElementById('postForm');

// פתיחת המודל בלחיצה על הכפתור הקיים
createPostBtn.addEventListener('click', () => {
  modal.style.display = 'flex';
});

// סגירת המודל בלחיצה על ה-X
closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// סגירת המודל בלחיצה מחוץ לחלון
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

// שליחת הטופס לשרת
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value;
  const imgUrl = document.getElementById('imgUrl').value;
  const description = document.getElementById('description').value;

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, imgUrl, description })
    });

    if (res.ok) {
      alert('הפוסט פורסם בהצלחה!');
      postForm.reset();
      modal.style.display = 'none';
      
      // אם יש לך פונקציה שטוענת מחדש את הפוסטים בעמוד, תפעילי אותה כאן:
      if (typeof loadPostsFromDB === 'function') {
        loadPostsFromDB();
      }
    } else {
      const data = await res.json();
      alert('שגיאה: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('שגיאה בתקשורת עם השרת');
  }
});