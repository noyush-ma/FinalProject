
const FACEBOOK_APP_ID = '1021350294284366';

window.fbAsyncInit = function () {
    FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false,
        version: 'v19.0'
    });
    FB.getLoginStatus(function (response) {
        if (response.status === 'connected') {
            fetchFacebookProfile();
        }
    });
};

(function (d, s, id) {
    if (d.getElementById(id)) return;
    const js = d.createElement(s);
    js.id = id;
    js.src = 'https://connect.facebook.net/he_IL/sdk.js';
    d.getElementsByTagName('head')[0].appendChild(js);
}(document, 'script', 'facebook-jssdk'));

function fbSetStatus(text, isError) {
    const el = document.getElementById('fbStatusMsg');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('fb-error', !!isError);
}

function handleFbLoginClick() {
    if (FACEBOOK_APP_ID === 'YOUR_FACEBOOK_APP_ID') {
        fbSetStatus('יש להגדיר App ID אמיתי מ-developers.facebook.com בקובץ facebook.js', true);
        return;
    }
    FB.login(function (response) {
        if (response.authResponse) {
            fetchFacebookProfile();
        } else {
            fbSetStatus('ההתחברות בוטלה או נדחתה על ידי המשתמש', true);
        }
    }, { scope: 'public_profile,email' });
}

function fetchFacebookProfile() {
    fbSetStatus('טוען נתונים מ-Facebook...');
    FB.api('/me', { fields: 'name,email,picture.width(120).height(120)' }, function (profile) {
        if (!profile || profile.error) {
            fbSetStatus('שגיאה בשליפת הנתונים מ-Facebook', true);
            return;
        }

        document.getElementById('fbProfilePic').src = profile.picture?.data?.url || '';
        document.getElementById('fbProfileName').textContent = profile.name || '';
        document.getElementById('fbProfileEmail').textContent = profile.email || 'אימייל לא זמין (הרשאה לא אושרה)';

        document.getElementById('fbLoginArea').style.display = 'none';
        document.getElementById('fbProfileCard').style.display = 'flex';
        fbSetStatus('');
    });
}

function handleFbLogoutClick() {
    FB.logout(function () {
        document.getElementById('fbProfileCard').style.display = 'none';
        document.getElementById('fbLoginArea').style.display = 'block';
        fbSetStatus('התנתקת בהצלחה מ-Facebook');
    });
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('fbLoginBtn')?.addEventListener('click', handleFbLoginClick);
    document.getElementById('fbLogoutBtn')?.addEventListener('click', handleFbLogoutClick);
});