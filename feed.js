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
    var heartIcon = document.getElementById("heartIcon");
    var likeCount = document.getElementById("like-count");
    var currentLikes = parseInt(likeCount.innerText);

    if (heartIcon.src.indexOf("emptyHeart.png") !== -1){
        heartIcon.src = "fullHeart.png";
        likeCount.innerText = currentLikes + 1;
    } else {
        heartIcon.src = "emptyHeart.png";
        likeCount.innerText = currentLikes - 1;
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