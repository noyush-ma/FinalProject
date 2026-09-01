// groups.js
// קובץ זה אחראי על כל מודל הקבוצות (צ'אטים):
//   - פתיחה/סגירה של מודל הקבוצות ומעבר בין המסכים הפנימיים שלו
//   - יצירת קבוצה חדשה
//   - הצטרפות לקבוצה קיימת לפי קוד הצטרפות
//   - הזמנת חברים קיימים לקבוצה (לפי משתמשים קיימים במערכת)
//   - שליחה/קבלה של הודעות בתוך קבוצה
//   - מערכת ההתראות הקופצות (toasts): כשמגיעה הזמנה או הודעה חדשה,
//     היא "קופצת" על המסך עם אפשרות לחזור אליה.
//
// שים לב: הקובץ הזה נטען אחרי feed.js, ומשתמש באותו משתמש מחובר
// שנשמר ב-sessionStorage תחת המפתח 'currentUser' (בדיוק כמו ב-feed.js).

// ============== משתנים גלובליים ==============

// המשתמש המחובר כרגע (אם אין כזה, כל הפיצ'ר הזה פשוט לא יפעל)
const groupsLoggedInUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

// מזהה הקבוצה שפתוחה כרגע בצ'אט (משמש כדי לדעת אילו הודעות לרענן ולאן לשלוח הודעה)
let activeGroupId = null;

// אוסף של מזהי התראות שכבר הצגנו כ-toast, כדי לא להציג את אותה התראה פעמיים
// (כי אנחנו שולפים מהשרת שוב ושוב בפולינג את כל ההתראות שעדיין "לא נקראו")
const shownNotificationIds = new Set();

// רק אם יש משתמש מחובר - מפעילים את כל הלוגיקה
if (groupsLoggedInUser) {

    // ============== איתור אלמנטים מה-DOM ==============
    const chatsBtn = document.getElementById('chatsBtn');
    const groupsModal = document.getElementById('groupsModal');
    const closeGroupsModal = document.getElementById('closeGroupsModal');

    const groupsListView = document.getElementById('groupsListView');
    const createGroupView = document.getElementById('createGroupView');
    const joinGroupView = document.getElementById('joinGroupView');
    const groupChatView = document.getElementById('groupChatView');

    const myGroupsList = document.getElementById('myGroupsList');
    const groupsEmptyMsg = document.getElementById('groupsEmptyMsg');

    const openCreateGroupBtn = document.getElementById('openCreateGroupBtn');
    const openJoinGroupBtn = document.getElementById('openJoinGroupBtn');

    const newGroupNameInput = document.getElementById('newGroupNameInput');
    const submitCreateGroupBtn = document.getElementById('submitCreateGroupBtn');
    const createGroupError = document.getElementById('createGroupError');

    const joinGroupCodeInput = document.getElementById('joinGroupCodeInput');
    const submitJoinGroupBtn = document.getElementById('submitJoinGroupBtn');
    const joinGroupError = document.getElementById('joinGroupError');

    const activeGroupName = document.getElementById('activeGroupName');
    const activeGroupCode = document.getElementById('activeGroupCode');
    const openInviteMembersBtn = document.getElementById('openInviteMembersBtn');
    const inviteMembersPanel = document.getElementById('inviteMembersPanel');
    const inviteUsersList = document.getElementById('inviteUsersList');

    const groupMessagesList = document.getElementById('groupMessagesList');
    const groupMessageInput = document.getElementById('groupMessageInput');
    const sendGroupMessageBtn = document.getElementById('sendGroupMessageBtn');

    const toastContainer = document.getElementById('toastContainer');

    // ============== ניהול מעבר בין המסכים בתוך המודל ==============

    // מציג רק את המסך המבוקש (view) ומסתיר את שאר המסכים
    function showGroupsView(viewElement) {
        [groupsListView, createGroupView, joinGroupView, groupChatView].forEach((view) => {
            view.classList.remove('active');
        });
        viewElement.classList.add('active');
    }

    // כפתורי "חזרה" בכל מסך - חוזרים תמיד לרשימת הקבוצות
    document.querySelectorAll('.groups-back-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            // אם יוצאים ממסך הצ'אט, מפסיקים לרענן הודעות ברקע כדי לא לבזבז בקשות מיותרות
            activeGroupId = null;
            showGroupsView(groupsListView);
            loadMyGroups(); // רענון הרשימה, למקרה שהצטרפנו/נוצרה קבוצה חדשה
        });
    });

    // ============== פתיחה/סגירה של המודל הראשי ==============

    if (chatsBtn) {
        chatsBtn.addEventListener('click', () => {
            groupsModal.style.display = 'flex';
            showGroupsView(groupsListView);
            loadMyGroups();
        });
    }

    closeGroupsModal.addEventListener('click', () => {
        groupsModal.style.display = 'none';
        activeGroupId = null; // מפסיקים "להאזין" לצ'אט ספציפי כשסוגרים את המודל
    });

    // סגירה גם בלחיצה על הרקע הכהה מחוץ לתוכן המודל
    groupsModal.addEventListener('click', (e) => {
        if (e.target === groupsModal) {
            groupsModal.style.display = 'none';
            activeGroupId = null;
        }
    });

    // ============== מסך רשימת הקבוצות שלי ==============

    // שולף מהשרת את כל הקבוצות שהמשתמש המחובר חבר בהן, ומצייר כרטיס לכל קבוצה
    async function loadMyGroups() {
        try {
            const res = await fetch('/api/groups/user/' + groupsLoggedInUser._id);
            const groups = await res.json();

            // מנקים את הרשימה הישנה (חוץ מהודעת "אין קבוצות")
            myGroupsList.querySelectorAll('.group-card').forEach((el) => el.remove());

            if (!groups.length) {
                groupsEmptyMsg.style.display = 'block';
                return;
            }
            groupsEmptyMsg.style.display = 'none';

            groups.forEach((group) => {
                const card = document.createElement('div');
                card.className = 'group-card';
                card.innerHTML = `
                    <div>
                        <div class="group-card-name">${group.name}</div>
                        <div class="group-card-members-count">${group.members.length} חברים</div>
                    </div>
                    <span>💬</span>
                `;
                // לחיצה על הכרטיס פותחת את הצ'אט של הקבוצה הזו
                card.addEventListener('click', () => openGroupChat(group._id));
                myGroupsList.appendChild(card);
            });
        } catch (err) {
            console.error('שגיאה בטעינת הקבוצות:', err);
        }
    }

    // מעבר למסך יצירת קבוצה
    openCreateGroupBtn.addEventListener('click', () => {
        newGroupNameInput.value = '';
        createGroupError.textContent = '';
        showGroupsView(createGroupView);
    });

    // מעבר למסך הצטרפות לפי קוד
    openJoinGroupBtn.addEventListener('click', () => {
        joinGroupCodeInput.value = '';
        joinGroupError.textContent = '';
        showGroupsView(joinGroupView);
    });

    // ============== יצירת קבוצה חדשה ==============
    submitCreateGroupBtn.addEventListener('click', async () => {
        const name = newGroupNameInput.value.trim();
        if (!name) {
            createGroupError.textContent = 'יש להזין שם לקבוצה';
            return;
        }

        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, ownerId: groupsLoggedInUser._id })
            });
            const data = await res.json();

            if (!res.ok) {
                createGroupError.textContent = data.message || 'שגיאה ביצירת הקבוצה';
                return;
            }

            // הקבוצה נוצרה בהצלחה - נכנסים ישר לתוכה כדי שהמשתמש יראה את קוד ההצטרפות
            await loadMyGroups();
            openGroupChat(data._id);
        } catch (err) {
            createGroupError.textContent = 'שגיאת תקשורת עם השרת';
        }
    });

    // ============== הצטרפות לקבוצה קיימת לפי קוד ==============
    submitJoinGroupBtn.addEventListener('click', async () => {
        const joinCode = joinGroupCodeInput.value.trim();
        if (!joinCode) {
            joinGroupError.textContent = 'יש להזין קוד הצטרפות';
            return;
        }

        try {
            const res = await fetch('/api/groups/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ joinCode, userId: groupsLoggedInUser._id })
            });
            const data = await res.json();

            if (!res.ok) {
                joinGroupError.textContent = data.message || 'שגיאה בהצטרפות לקבוצה';
                return;
            }

            await loadMyGroups();
            openGroupChat(data._id);
        } catch (err) {
            joinGroupError.textContent = 'שגיאת תקשורת עם השרת';
        }
    });

    // ============== מסך הצ'אט של קבוצה ספציפית ==============

    // פותח את מסך הצ'אט עבור קבוצה נתונה: טוען פרטי קבוצה + הודעות
    async function openGroupChat(groupId) {
        activeGroupId = groupId;
        inviteMembersPanel.classList.remove('active'); // מתחילים עם פאנל ההזמנה סגור

        showGroupsView(groupChatView);
        await loadGroupDetails(groupId);
        await loadGroupMessages(groupId);
    }

    // טוען את שם הקבוצה, קוד ההצטרפות שלה, ומכין את רשימת החברים לצורך ההזמנות
    async function loadGroupDetails(groupId) {
        try {
            const res = await fetch('/api/groups/' + groupId);
            const group = await res.json();

            activeGroupName.textContent = group.name;
            activeGroupCode.textContent = group.joinCode;

            // שומרים את רשימת מזהי החברים הנוכחיים על האלמנט, כדי שנוכל לסנן
            // אותם החוצה כשנציג את רשימת המשתמשים להזמנה
            groupChatView.dataset.memberIds = JSON.stringify(group.members.map((m) => m._id));
        } catch (err) {
            console.error('שגיאה בטעינת פרטי הקבוצה:', err);
        }
    }

    // טוען ומציג את כל ההודעות של הקבוצה הפעילה
    async function loadGroupMessages(groupId) {
        try {
            const res = await fetch('/api/groups/' + groupId + '/messages');
            const messages = await res.json();

            groupMessagesList.innerHTML = '';
            messages.forEach((msg) => {
                const bubble = document.createElement('div');
                const isOwn = msg.sender === groupsLoggedInUser._id;
                bubble.className = 'group-message-bubble' + (isOwn ? ' own-message' : '');
                bubble.innerHTML = `
                    ${isOwn ? '' : `<span class="group-message-sender">${msg.senderUsername}</span>`}
                    ${escapeHtml(msg.text)}
                `;
                groupMessagesList.appendChild(bubble);
            });

            // גוללים אוטומטית להודעה האחרונה
            groupMessagesList.scrollTop = groupMessagesList.scrollHeight;
        } catch (err) {
            console.error('שגיאה בטעינת ההודעות:', err);
        }
    }

    // פונקציית עזר קטנה כדי למנוע הזרקת HTML זדוני דרך תוכן הודעה (אבטחה בסיסית)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // שליחת הודעה חדשה בקבוצה הפעילה
    async function sendGroupMessage() {
        const text = groupMessageInput.value.trim();
        if (!text || !activeGroupId) return;

        try {
            const res = await fetch('/api/groups/' + activeGroupId + '/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderId: groupsLoggedInUser._id, text })
            });
            if (res.ok) {
                groupMessageInput.value = '';
                await loadGroupMessages(activeGroupId);
            }
        } catch (err) {
            console.error('שגיאה בשליחת ההודעה:', err);
        }
    }

    sendGroupMessageBtn.addEventListener('click', sendGroupMessage);
    // אפשרות לשלוח הודעה גם בלחיצה על Enter בתוך תיבת הטקסט
    groupMessageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendGroupMessage();
        }
    });

    // ============== הוספת חברים לקבוצה (הזמנה למשתמשים קיימים) ==============

    // פותח/סוגר את פאנל הוספת החברים, ובעת פתיחה טוען את רשימת המשתמשים הקיימים
    openInviteMembersBtn.addEventListener('click', async () => {
        const isOpen = inviteMembersPanel.classList.toggle('active');
        if (isOpen) {
            await loadInvitableUsers();
        }
    });

    // שולף את כל המשתמשים הקיימים במערכת, ומסנן החוצה את מי שכבר חבר בקבוצה
    async function loadInvitableUsers() {
        try {
            const currentMemberIds = JSON.parse(groupChatView.dataset.memberIds || '[]');

            const res = await fetch('/api/users');
            const allUsers = await res.json();

            inviteUsersList.innerHTML = '';

            const invitableUsers = allUsers.filter(
                (u) => u._id !== groupsLoggedInUser._id && !currentMemberIds.includes(u._id)
            );

            if (!invitableUsers.length) {
                inviteUsersList.innerHTML = '<p style="font-size:13px;color:#888;">אין משתמשים נוספים להזמין כרגע</p>';
                return;
            }

            invitableUsers.forEach((user) => {
                const row = document.createElement('div');
                row.className = 'invite-user-row';
                row.innerHTML = `
                    <span>${user.username}</span>
                    <button data-user-id="${user._id}">הזמן</button>
                `;

                // לחיצה על "הזמן" שולחת בקשת הזמנה לשרת, ויוצרת למוזמן התראה קופצת
                row.querySelector('button').addEventListener('click', async (e) => {
                    const btn = e.target;
                    btn.disabled = true;
                    btn.textContent = 'שולח...';

                    try {
                        const inviteRes = await fetch('/api/groups/' + activeGroupId + '/invite', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                inviterId: groupsLoggedInUser._id,
                                inviteeId: user._id
                            })
                        });

                        if (inviteRes.ok) {
                            btn.textContent = 'ההזמנה נשלחה ✓';
                        } else {
                            const data = await inviteRes.json();
                            btn.disabled = false;
                            btn.textContent = 'הזמן';
                            alert(data.message || 'שגיאה בשליחת ההזמנה');
                        }
                    } catch (err) {
                        btn.disabled = false;
                        btn.textContent = 'הזמן';
                    }
                });

                inviteUsersList.appendChild(row);
            });
        } catch (err) {
            console.error('שגיאה בטעינת רשימת המשתמשים:', err);
        }
    }

    // ============== מערכת ההתראות הקופצות (Toasts) ==============

    // יוצר ומציג toast חדש על המסך, בהתאם לסוג ההתראה
    function showToast(notification) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.dataset.notifId = notification._id;

        if (notification.type === 'GROUP_INVITE') {
            // הזמנה לקבוצה - מציגים כפתורי "אשר" ו"דחה"
            toast.innerHTML = `
                <p>${notification.text}</p>
                <div class="toast-actions">
                    <button class="toast-btn-secondary" data-action="decline">דחה</button>
                    <button class="toast-btn-primary" data-action="accept">אשר</button>
                </div>
            `;

            toast.querySelector('[data-action="accept"]').addEventListener('click', () =>
                respondToGroupInvite(notification, 'ACCEPTED', toast)
            );
            toast.querySelector('[data-action="decline"]').addEventListener('click', () =>
                respondToGroupInvite(notification, 'DECLINED', toast)
            );

        } else if (notification.type === 'NEW_MESSAGE') {
            // הודעה חדשה - מציגים כפתור "חזרה אליה" שפותח ישירות את הצ'אט הרלוונטי
            toast.innerHTML = `
                <p>${notification.text}</p>
                <div class="toast-actions">
                    <button class="toast-btn-secondary" data-action="dismiss">סגור</button>
                    <button class="toast-btn-primary" data-action="goto">חזרה להודעה</button>
                </div>
            `;

            toast.querySelector('[data-action="dismiss"]').addEventListener('click', () =>
                dismissToast(notification._id, toast)
            );
            toast.querySelector('[data-action="goto"]').addEventListener('click', async () => {
                await dismissToast(notification._id, toast);
                // פותחים את מודל הקבוצות ומנווטים ישר לצ'אט של הקבוצה הרלוונטית
                groupsModal.style.display = 'flex';
                openGroupChat(notification.group._id || notification.group);
            });
        }

        toastContainer.appendChild(toast);
    }

    // מטפל בלחיצה על "אשר"/"דחה" בהזמנה לקבוצה
    async function respondToGroupInvite(notification, response, toastEl) {
        try {
            await fetch('/api/groups/invite/' + notification._id + '/respond', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ response })
            });
            toastEl.remove();

            // אם אושרה ההזמנה, מרעננים את רשימת הקבוצות (למקרה שהמודל פתוח)
            if (response === 'ACCEPTED') {
                loadMyGroups();
            }
        } catch (err) {
            console.error('שגיאה בטיפול בהזמנה:', err);
        }
    }

    // מסמן התראה כנקראה בשרת, ומסיר אותה מהמסך
    async function dismissToast(notificationId, toastEl) {
        try {
            await fetch('/api/notifications/' + notificationId + '/read', { method: 'PUT' });
        } catch (err) {
            console.error('שגיאה בסימון ההתראה כנקראה:', err);
        }
        toastEl.remove();
    }

    // בודק מול השרת אם יש התראות חדשות שעדיין לא הוצגו, ומציג אותן כ-toast
    async function checkForNewNotifications() {
        try {
            const res = await fetch('/api/notifications/user/' + groupsLoggedInUser._id);
            const notifications = await res.json();

            notifications.forEach((notification) => {
                // מציגים רק התראות שעוד לא הוצגו בסשן הנוכחי (כדי לא לשכפל toasts)
                if (!shownNotificationIds.has(notification._id)) {
                    shownNotificationIds.add(notification._id);
                    showToast(notification);

                    // אם הצ'אט של הקבוצה הזו פתוח כרגע על המסך, מרעננים אותו מיד
                    // כדי שההודעה החדשה תופיע גם בתוך חלון הצ'אט עצמו
                    const notifGroupId = notification.group && (notification.group._id || notification.group);
                    if (notification.type === 'NEW_MESSAGE' && notifGroupId === activeGroupId) {
                        loadGroupMessages(activeGroupId);
                    }
                }
            });
        } catch (err) {
            console.error('שגיאה בבדיקת התראות חדשות:', err);
        }
    }

    // בודקים מייד עם טעינת הדף, ואז כל 5 שניות (פולינג פשוט - "לוקח" מהשרת אם יש חדש)
    checkForNewNotifications();
    setInterval(checkForNewNotifications, 5000);
}