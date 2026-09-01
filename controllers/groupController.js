// כל הלוגיקה העסקית של קבוצות הצ'אט: יצירה, הצטרפות לפי קוד,
// הזמנת חברים קיימים, אישור/דחיית הזמנה, ושליחת/קריאת הודעות בתוך קבוצה.
const Group = require('../models/group');
const GroupMessage = require('../models/message');
const Notification = require('../models/notification');
const User = require('../models/user');

// פונקציית עזר: יוצרת קוד הצטרפות אקראי בן 6 תווים (אותיות גדולות + ספרות)
// לדוגמה: "A1B2C3" - המשתמש ישתמש בקוד הזה כדי "להיכנס לקבוצה קיימת"
function generateJoinCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 1. יצירת קבוצה חדשה
// מקבל: name (שם הקבוצה), ownerId (מי יוצר אותה)
// הבעלים מתווסף אוטומטית לרשימת החברים
exports.createGroup = async (req, res) => {
  try {
    const { name, ownerId } = req.body;

    if (!name || !ownerId) {
      return res.status(400).json({ message: 'יש לספק שם קבוצה ומזהה בעלים' });
    }

    // מוודאים שהקוד ייחודי - במקרה הנדיר של התנגשות מגרילים שוב
    let joinCode = generateJoinCode();
    let codeExists = await Group.findOne({ joinCode });
    while (codeExists) {
      joinCode = generateJoinCode();
      codeExists = await Group.findOne({ joinCode });
    }

    const newGroup = new Group({
      name,
      owner: ownerId,
      members: [ownerId], // הבעלים הוא החבר הראשון בקבוצה
      joinCode
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 2. שליפת כל הקבוצות שמשתמש מסוים חבר בהן (לצורך הצגת רשימת "הצ'אטים שלי")
exports.getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.params.userId })
      .populate('owner', 'username profileImage')
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. שליפת פרטי קבוצה בודדת, כולל רשימת החברים המלאה (שם + תמונת פרופיל)
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members', 'username profileImage')
      .populate('owner', 'username profileImage');

    if (!group) {
      return res.status(404).json({ message: 'קבוצה לא נמצאה' });
    }
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. הצטרפות לקבוצה קיימת לפי קוד הצטרפות
// זו הדרך של המשתמש "להיכנס לקבוצה קיימת" בלי לקבל הזמנה אישית
exports.joinGroupByCode = async (req, res) => {
  try {
    const { joinCode, userId } = req.body;

    if (!joinCode || !userId) {
      return res.status(400).json({ message: 'יש לספק קוד הצטרפות ומזהה משתמש' });
    }

    const group = await Group.findOne({ joinCode: joinCode.toUpperCase() });
    if (!group) {
      return res.status(404).json({ message: 'לא נמצאה קבוצה עם קוד זה' });
    }

    // בדיקה שהמשתמש לא כבר חבר בקבוצה
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: 'אתה כבר חבר בקבוצה זו' });
    }

    group.members.push(userId);
    await group.save();

    res.status(200).json(group);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 5. הזמנת משתמש קיים לקבוצה (לפי שם משתמש/מזהה שנבחר מרשימת המשתמשים הקיימים במערכת)
// לא מוסיפים אותו ישירות לקבוצה - יוצרים לו התראת "הזמנה" שהוא צריך לאשר
exports.inviteUserToGroup = async (req, res) => {
  try {
    const { inviterId, inviteeId } = req.body;
    const groupId = req.params.groupId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'קבוצה לא נמצאה' });
    }

    if (group.members.includes(inviteeId)) {
      return res.status(400).json({ message: 'המשתמש כבר חבר בקבוצה' });
    }

    // בודקים אם כבר קיימת הזמנה ממתינה לאותו משתמש לאותה קבוצה, כדי לא לשלוח כפול
    const existingInvite = await Notification.findOne({
      recipient: inviteeId,
      group: groupId,
      type: 'GROUP_INVITE',
      status: 'PENDING'
    });
    if (existingInvite) {
      return res.status(400).json({ message: 'כבר נשלחה הזמנה למשתמש זה' });
    }

    const inviter = await User.findById(inviterId);
    const inviterName = inviter ? inviter.username : 'משתמש';

    // יצירת התראת ההזמנה - היא זו שתקפוץ למוזמן על המסך
    const invite = new Notification({
      recipient: inviteeId,
      type: 'GROUP_INVITE',
      text: `${inviterName} הזמין אותך להצטרף לקבוצה "${group.name}"`,
      group: groupId,
      fromUser: inviterId,
      status: 'PENDING'
    });

    await invite.save();
    res.status(201).json(invite);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 6. תגובה להזמנה לקבוצה (אישור/דחייה)
// אם אושר - המשתמש מתווסף לרשימת החברים בקבוצה
exports.respondToInvite = async (req, res) => {
  try {
    const { response } = req.body; // 'ACCEPTED' או 'DECLINED'
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification || notification.type !== 'GROUP_INVITE') {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }

    notification.status = response;
    notification.isRead = true;
    await notification.save();

    if (response === 'ACCEPTED') {
      const group = await Group.findById(notification.group);
      if (group && !group.members.includes(notification.recipient)) {
        group.members.push(notification.recipient);
        await group.save();
      }
    }

    res.status(200).json(notification);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 7. שליפת כל ההודעות של קבוצה מסוימת (מסודרות מהישנה לחדשה, כמו כל צ'אט)
exports.getGroupMessages = async (req, res) => {
  try {
    const messages = await GroupMessage.find({ group: req.params.groupId })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 8. שליחת הודעה חדשה בתוך קבוצה
// בנוסף לשמירת ההודעה, יוצרים התראת "הודעה חדשה" לכל שאר חברי הקבוצה
// כדי שהיא תקפוץ להם על המסך (עם אופציה "לחזור אליה")
exports.sendGroupMessage = async (req, res) => {
  try {
    const { senderId, text } = req.body;
    const groupId = req.params.groupId;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'לא ניתן לשלוח הודעה ריקה' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'קבוצה לא נמצאה' });
    }

    const sender = await User.findById(senderId);
    const senderUsername = sender ? sender.username : 'משתמש';

    const message = new GroupMessage({
      group: groupId,
      sender: senderId,
      senderUsername,
      text: text.trim()
    });
    await message.save();

    // יוצרים התראה לכל חבר בקבוצה חוץ מהשולח עצמו
    const recipients = group.members.filter(
      (memberId) => memberId.toString() !== senderId
    );

    // מקצרים את התצוגה המקדימה של ההודעה כדי שהפופ-אפ לא יהיה ארוך מדי
    const preview = text.length > 40 ? text.slice(0, 40) + '...' : text;

    const notifications = recipients.map((memberId) => ({
      recipient: memberId,
      type: 'NEW_MESSAGE',
      text: `הודעה חדשה מ-${senderUsername} בקבוצה "${group.name}": ${preview}`,
      group: groupId,
      fromUser: senderId,
      isRead: false
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};