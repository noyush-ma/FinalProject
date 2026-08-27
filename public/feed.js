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