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