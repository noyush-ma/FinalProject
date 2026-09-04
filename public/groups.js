const groupsLoggedInUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

let activeGroupId = null;

if (groupsLoggedInUser) {

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
    const openPublicGroupsBtn = document.getElementById('openPublicGroupsBtn');

    const newGroupNameInput = document.getElementById('newGroupNameInput');
    const submitCreateGroupBtn = document.getElementById('submitCreateGroupBtn');
    const createGroupError = document.getElementById('createGroupError');

    const joinGroupCodeInput = document.getElementById('joinGroupCodeInput');
    const submitJoinGroupBtn = document.getElementById('submitJoinGroupBtn');
    const joinGroupError = document.getElementById('joinGroupError');

    const publicGroupsView = document.getElementById('publicGroupsView');
    const publicGroupsList = document.getElementById('publicGroupsList');
    const publicGroupsEmptyMsg = document.getElementById('publicGroupsEmptyMsg');

    const activeGroupName = document.getElementById('activeGroupName');
    const activeGroupCode = document.getElementById('activeGroupCode');
    const activeGroupPrivacyBadge = document.getElementById('activeGroupPrivacyBadge');
    const toggleGroupPrivacyBtn = document.getElementById('toggleGroupPrivacyBtn');
    const openInviteMembersBtn = document.getElementById('openInviteMembersBtn');
    const inviteMembersPanel = document.getElementById('inviteMembersPanel');
    const inviteUsersList = document.getElementById('inviteUsersList');

    const groupMessagesList = document.getElementById('groupMessagesList');
    const groupMessageInput = document.getElementById('groupMessageInput');
    const sendGroupMessageBtn = document.getElementById('sendGroupMessageBtn');

    function showGroupsView(viewElement) {
        [groupsListView, createGroupView, joinGroupView, publicGroupsView, groupChatView].forEach((view) => {
            if (view) view.classList.remove('active');
        });
        viewElement.classList.add('active');
    }

    document.querySelectorAll('.groups-back-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            activeGroupId = null;
            showGroupsView(groupsListView);
            loadMyGroups(); 
        });
    });


    if (chatsBtn) {
        chatsBtn.addEventListener('click', () => {
            groupsModal.style.display = 'flex';
            showGroupsView(groupsListView);
            loadMyGroups();
        });
    }

    closeGroupsModal.addEventListener('click', () => {
        groupsModal.style.display = 'none';
        activeGroupId = null; 
    });

    groupsModal.addEventListener('click', (e) => {
        if (e.target === groupsModal) {
            groupsModal.style.display = 'none';
            activeGroupId = null;
        }
    });

    async function loadMyGroups() {
        try {
            const res = await fetch('/api/groups/user/' + groupsLoggedInUser._id);
            const groups = await res.json();

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
                        <div class="group-card-name">${group.name} ${group.isPrivate ? '🔒' : '🌐'}</div>
                        <div class="group-card-members-count">${group.members.length} חברים</div>
                    </div>
                    <span>💬</span>
                `;
                card.addEventListener('click', () => openGroupChat(group._id));
                myGroupsList.appendChild(card);
            });
        } catch (err) {
            console.error('שגיאה בטעינת הקבוצות:', err);
        }
    }

    openCreateGroupBtn.addEventListener('click', () => {
        newGroupNameInput.value = '';
        createGroupError.textContent = '';
        const defaultPrivacyRadio = document.querySelector('input[name="newGroupPrivacy"][value="private"]');
        if (defaultPrivacyRadio) defaultPrivacyRadio.checked = true;
        showGroupsView(createGroupView);
    });

    openJoinGroupBtn.addEventListener('click', () => {
        joinGroupCodeInput.value = '';
        joinGroupError.textContent = '';
        showGroupsView(joinGroupView);
    });

    if (openPublicGroupsBtn) {
        openPublicGroupsBtn.addEventListener('click', () => {
            showGroupsView(publicGroupsView);
            loadPublicGroups();
        });
    }

    async function loadPublicGroups() {
        if (!publicGroupsList) return;
        try {
            const res = await fetch('/api/groups/public/' + groupsLoggedInUser._id);
            const groups = await res.json();

            publicGroupsList.querySelectorAll('.group-card').forEach((el) => el.remove());

            if (!groups.length) {
                publicGroupsEmptyMsg.style.display = 'block';
                return;
            }
            publicGroupsEmptyMsg.style.display = 'none';

            groups.forEach((group) => {
                const card = document.createElement('div');
                card.className = 'group-card';
                card.innerHTML = `
                    <div>
                        <div class="group-card-name">${group.name}</div>
                        <div class="group-card-members-count">${group.members.length} חברים · מנהל: ${group.owner ? group.owner.username : ''}</div>
                    </div>
                    <button class="group-action-btn group-action-btn-small" type="button">הצטרף</button>
                `;

                card.querySelector('button').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const btn = e.target;
                    btn.disabled = true;
                    btn.textContent = 'מצטרף...';
                    try {
                        const joinRes = await fetch('/api/groups/' + group._id + '/join-public', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: groupsLoggedInUser._id })
                        });
                        const data = await joinRes.json();
                        if (!joinRes.ok) {
                            btn.disabled = false;
                            btn.textContent = 'הצטרף';
                            alert(data.message || 'שגיאה בהצטרפות לקבוצה');
                            return;
                        }
                        await loadMyGroups();
                        openGroupChat(data._id);
                    } catch (err) {
                        btn.disabled = false;
                        btn.textContent = 'הצטרף';
                    }
                });

                publicGroupsList.appendChild(card);
            });
        } catch (err) {
            console.error('שגיאה בטעינת הקבוצות הציבוריות:', err);
        }
    }

    submitCreateGroupBtn.addEventListener('click', async () => {
        const name = newGroupNameInput.value.trim();
        if (!name) {
            createGroupError.textContent = 'יש להזין שם לקבוצה';
            return;
        }

        const privacyChoice = document.querySelector('input[name="newGroupPrivacy"]:checked');
        const isPrivate = !privacyChoice || privacyChoice.value === 'private';

        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, ownerId: groupsLoggedInUser._id, isPrivate })
            });
            const data = await res.json();

            if (!res.ok) {
                createGroupError.textContent = data.message || 'שגיאה ביצירת הקבוצה';
                return;
            }

            await loadMyGroups();
            openGroupChat(data._id);
        } catch (err) {
            createGroupError.textContent = 'שגיאת תקשורת עם השרת';
        }
    });

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


    async function openGroupChat(groupId) {
        activeGroupId = groupId;
        inviteMembersPanel.classList.remove('active'); 

        showGroupsView(groupChatView);
        await loadGroupDetails(groupId);
        await loadGroupMessages(groupId);
    }

    async function loadGroupDetails(groupId) {
        try {
            const res = await fetch('/api/groups/' + groupId);
            const group = await res.json();

            activeGroupName.textContent = group.name;
            activeGroupCode.textContent = group.joinCode;

            groupChatView.dataset.memberIds = JSON.stringify(group.members.map((m) => m._id));

            const ownerId = group.owner ? (group.owner._id || group.owner) : null;
            const isOwner = ownerId === groupsLoggedInUser._id;

            activeGroupPrivacyBadge.textContent = group.isPrivate ? '🔒 קבוצה פרטית' : '🌐 קבוצה ציבורית';

            openInviteMembersBtn.style.display = isOwner ? 'inline-block' : 'none';

            if (isOwner) {
                toggleGroupPrivacyBtn.style.display = 'inline-block';
                toggleGroupPrivacyBtn.textContent = group.isPrivate ? 'הפוך לציבורית' : 'הפוך לפרטית';
                toggleGroupPrivacyBtn.dataset.currentPrivacy = group.isPrivate ? 'private' : 'public';
            } else {
                toggleGroupPrivacyBtn.style.display = 'none';
            }
        } catch (err) {
            console.error('שגיאה בטעינת פרטי הקבוצה:', err);
        }
    }

    toggleGroupPrivacyBtn.addEventListener('click', async () => {
        if (!activeGroupId) return;
        const newIsPrivate = toggleGroupPrivacyBtn.dataset.currentPrivacy !== 'private';

        toggleGroupPrivacyBtn.disabled = true;
        try {
            const res = await fetch('/api/groups/' + activeGroupId + '/privacy', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: groupsLoggedInUser._id, isPrivate: newIsPrivate })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.message || 'שגיאה בשינוי מצב הפרטיות');
                return;
            }
            await loadGroupDetails(activeGroupId);
        } catch (err) {
            console.error('שגיאה בשינוי מצב הפרטיות:', err);
        } finally {
            toggleGroupPrivacyBtn.disabled = false;
        }
    });

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

            groupMessagesList.scrollTop = groupMessagesList.scrollHeight;
        } catch (err) {
            console.error('שגיאה בטעינת ההודעות:', err);
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

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
    groupMessageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendGroupMessage();
        }
    });

    openInviteMembersBtn.addEventListener('click', async () => {
        const isOpen = inviteMembersPanel.classList.toggle('active');
        if (isOpen) {
            await loadInvitableUsers();
        }
    });

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

    window.openGroupChatFromNotifications = function (groupId) {
        groupsModal.style.display = 'flex';
        openGroupChat(groupId);
    };
    window.refreshMyGroupsFromNotifications = function () {
        loadMyGroups();
    };

    async function checkForActiveChatUpdates() {
        if (!activeGroupId) return;
        try {
            const res = await fetch('/api/notifications/user/' + groupsLoggedInUser._id);
            const notifications = await res.json();

            const relevant = notifications.find((n) => {
                const notifGroupId = n.group && (n.group._id || n.group);
                return n.type === 'NEW_MESSAGE' && notifGroupId === activeGroupId;
            });

            if (relevant) {
                await loadGroupMessages(activeGroupId);
            }
        } catch (err) {
            console.error('שגיאה בבדיקת עדכוני צ׳אט:', err);
        }
    }

    setInterval(checkForActiveChatUpdates, 5000);
}