function openModal(element) {
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
    document.getElementById("newCommentInput").value = "";
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

function focusCommentInput() {
    var inputComment = document.getElementById("newCommentInput");
    inputComment.focus();
}

function showTyping() {
    var inputComment = document.getElementById("newCommentInput");
    var indicator = document.getElementById("typingIndicator");
    
    if (inputComment.value.length > 0) {
        indicator.style.display = "block";
    } else {
        indicator.style.display = "none";
    }
}

function addComment() {
    var inputComment = document.getElementById("newCommentInput");
    var commentText = inputComment.value.trim();
    var commentsList = document.getElementById("commentsList");

    if (commentText === "") {
        return;
    }

    var newComment = document.createElement("div");
    newComment.className = "comment-item";
    newComment.innerText = commentText;

    commentsList.appendChild(newComment);

    inputComment.value = "";

    document.getElementById("typingIndicator").style.display = "none";

    commentsList.scrollTop = commentsList.scrollHeight;
}