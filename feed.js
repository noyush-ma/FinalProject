function openModal(element) {
    var modal = document.getElementById("imageModal");
    modal.style.display = "flex";
    
    var modalImg = document.getElementById("modalImg");
    modalImg.src = element.src;
}

function closeModal() {
    var modal = document.getElementById("imageModal");
    modal.style.display = "none";
}

function doLike() {
    var btn = document.getElementById("likeBtn");
    btn.innerText = "💖 עשיתי לייק!";
}