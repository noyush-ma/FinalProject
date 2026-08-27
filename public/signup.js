async function handleSignup() {
    var usernameEl = document.getElementById("username");
    var emailEl = document.getElementById("email");
    var passwordEl = document.getElementById("password");

    var username = usernameEl.value.trim();
    var email = emailEl.value.trim();
    var password = passwordEl.value;

    // ניקוי שגיאות קודמות
    document.getElementById("usernameError").innerHTML = "";
    document.getElementById("emailError").innerHTML = "";
    document.getElementById("passwordError").innerHTML = "";
    document.getElementById("serverError").innerHTML = "";

    var isValid = true;

    if (username === "") {
        document.getElementById("usernameError").innerHTML = "Please enter a username";
        isValid = false;
    }

    if (email.includes("@") === false) {
        document.getElementById("emailError").innerHTML = "Invalid email (missing @)";
        isValid = false;
    }

    if (password === "") {
        document.getElementById("passwordError").innerHTML = "Please enter a password";
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();

        if (res.ok) {
            // שומרים את פרטי המשתמש המחובר לזיכרון הדפדפן לצורך שימוש בעמודים הבאים
            sessionStorage.setItem('currentUser', JSON.stringify(data));
            window.location.href = "feed.html";
        } else {
            document.getElementById("serverError").innerHTML = data.message || "אירעה שגיאה בהרשמה";
        }
    } catch (err) {
        document.getElementById("serverError").innerHTML = "שגיאת תקשורת עם השרת. ודאו שהשרת פעיל.";
        console.error('Signup error:', err);
    }
}