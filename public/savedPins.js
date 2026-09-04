(function () {
    if (typeof loggedInUser === 'undefined' || !loggedInUser) return;

    const LOCAL_PINS_KEY = 'pinterestLocalSavedPins_' + loggedInUser._id;

    function getLocalSavedPins() {
        try {
            return JSON.parse(localStorage.getItem(LOCAL_PINS_KEY) || '[]');
        } catch (err) {
            return [];
        }
    }

    function setLocalSavedPins(pins) {
        localStorage.setItem(LOCAL_PINS_KEY, JSON.stringify(pins));
    }

    function getCurrentPinInfo() {
        if (typeof currentOpenImg === 'undefined' || !currentOpenImg) return null;

        const postId = currentOpenImg.getAttribute('data-id');
        if (postId) {
            return { isLocal: false, postId: postId };
        }

        return {
            isLocal: true,
            localId: currentOpenImg.src,
            imageUrl: currentOpenImg.src,
            title: currentOpenImg.alt || ''
        };
    }


    window.refreshSaveButtonState = async function (postId) {
        const saveBtn = document.getElementById('saveBtn');
        if (!saveBtn || !loggedInUser) return;

        const pinInfo = getCurrentPinInfo();
        if (pinInfo && pinInfo.isLocal) {
            const saved = getLocalSavedPins().some(function (p) { return p.localId === pinInfo.localId; });
            if (saved) {
                saveBtn.innerText = 'נשמר';
                saveBtn.style.backgroundColor = '#333333';
            } else {
                saveBtn.innerText = 'שמירה';
                saveBtn.style.backgroundColor = '#e60023';
            }
            return;
        }

        if (!postId) return;
        try {
            const res = await fetch('/api/boards/save-status/' + postId + '/' + loggedInUser._id);
            const data = await res.json();
            if (data.saved) {
                saveBtn.innerText = 'נשמר';
                saveBtn.style.backgroundColor = '#333333';
            } else {
                saveBtn.innerText = 'שמירה';
                saveBtn.style.backgroundColor = '#e60023';
            }
        } catch (err) {
            console.error('שגיאה בבדיקת מצב שמירה:', err);
        }
    };

    window.doSave = function () {
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn && saveBtn.innerText === 'נשמר') {
            unsaveCurrentPost();
        } else {
            saveCurrentPinDirect();
        }
    };

    window.saveCurrentPinDirect = async function () {
        const pinInfo = getCurrentPinInfo();
        if (!pinInfo) {
            alert('לא ניתן לשמור פוסט זה כרגע');
            return;
        }
        const saveBtn = document.getElementById('saveBtn');

        if (pinInfo.isLocal) {
            const pins = getLocalSavedPins().filter(function (p) { return p.localId !== pinInfo.localId; });
            pins.unshift({
                localId: pinInfo.localId,
                imageUrl: pinInfo.imageUrl,
                title: pinInfo.title,
                boardId: null,
                savedAt: new Date().toISOString()
            });
            setLocalSavedPins(pins);

            if (saveBtn) {
                saveBtn.innerText = 'נשמר';
                saveBtn.style.backgroundColor = '#333333';
            }
            return;
        }

        try {
            const res = await fetch('/api/boards/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: pinInfo.postId, userId: loggedInUser._id })
            });

            if (res.ok) {
                if (saveBtn) {
                    saveBtn.innerText = 'נשמר';
                    saveBtn.style.backgroundColor = '#333333';
                }
            } else {
                const errorData = await res.json();
                alert('שגיאה בשמירה: ' + (errorData.message || 'לא ניתן לשמור את הפוסט'));
            }
        } catch (err) {
            console.error(err);
            alert('שגיאה בתקשורת עם השרת בזמן השמירה');
        }
    };

    window.unsaveCurrentPost = async function () {
        const pinInfo = getCurrentPinInfo();
        if (!pinInfo) return;
        const saveBtn = document.getElementById('saveBtn');

        if (pinInfo.isLocal) {
            const pins = getLocalSavedPins().filter(function (p) { return p.localId !== pinInfo.localId; });
            setLocalSavedPins(pins);
            if (saveBtn) {
                saveBtn.innerText = 'שמירה';
                saveBtn.style.backgroundColor = '#e60023';
            }
            return;
        }

        try {
            const res = await fetch('/api/boards/unsave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: pinInfo.postId, userId: loggedInUser._id })
            });

            if (res.ok && saveBtn) {
                saveBtn.innerText = 'שמירה';
                saveBtn.style.backgroundColor = '#e60023';
            }
        } catch (err) {
            console.error('שגיאה בהסרת השמירה:', err);
        }
    };
    
    
})();
