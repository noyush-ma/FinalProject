function checkForm() {
    var email = document.getElementById("name").value;
    var password = document.getElementById("password").value;

    document.getElementById("emailError").innerHTML = "";
    document.getElementById("passwordError").innerHTML = "";

    var isValid = true;

    if (email.includes("@") == false) {
        document.getElementById("emailError").innerHTML = "Invalid email (missing @)";
        isValid = false; 
    }

    if (password == "") {
        document.getElementById("passwordError").innerHTML = "Please enter a password";
        isValid = false;
    }

    if (isValid == true) {
        window.location.href = "feed.html";
    }
}