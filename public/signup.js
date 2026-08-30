async function handleSignup() {
    var usernameEl = document.getElementById("username");
    var emailEl = document.getElementById("email");
    var passwordEl = document.getElementById("password");
    var submitBtn = document.querySelector('button[onclick="handleSignup()"]');

    var username = usernameEl.value.trim();
    var email = emailEl.value.trim();
    var password = passwordEl.value;

    document.getElementById("usernameError").innerHTML = "";
    document.getElementById("emailError").innerHTML = "";
    document.getElementById("passwordError").innerHTML = "";
    document.getElementById("serverError").innerHTML = "";

    var isValid = true;

    if (username === "") {
        document.getElementById("usernameError").innerHTML = "Please enter a username";
        isValid = false;
    }
    if (!email.includes("@")) {
        document.getElementById("emailError").innerHTML = "Invalid email (missing @)";
        isValid = false;
    }
    if (password.length < 6) {
        document.getElementById("passwordError").innerHTML = "Password must be at least 6 characters";
        isValid = false;
    }

    if (!isValid) return;

    if (submitBtn) submitBtn.disabled = true;

    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        let data = {};
        try {
            data = await res.json();
        } catch (parseErr) {
            // השרת החזיר משהו שהוא לא JSON (למשל דף שגיאה של Express)
            throw new Error(`תגובה לא תקינה מהשרת (סטטוס ${res.status})`);
        }

        if (res.ok) {
            sessionStorage.setItem('currentUser', JSON.stringify(data));
            window.location.href = "feed.html";
        } else {
            document.getElementById("serverError").innerHTML = data.message || "אירעה שגיאה בהרשמה";
        }
    } catch (err) {
        console.error('Signup error:', err);
        document.getElementById("serverError").innerHTML =
            "שגיאת תקשורת עם השרת: " + err.message;
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}