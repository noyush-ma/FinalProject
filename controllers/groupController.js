const Group = require('../models/group');
const GroupMessage = require('../models/message');
const Notification = require('../models/notification');
const User = require('../models/user');
function generateJoinCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

exports.createGroup = async (req, res) => {
  try {
    const { name, ownerId, isPrivate } = req.body;

    if (!name || !ownerId) {
      return res.status(400).json({ message: 'יש לספק שם קבוצה ומזהה בעלים' });
    }

    let joinCode = generateJoinCode();
    let codeExists = await Group.findOne({ joinCode });
    while (codeExists) {
      joinCode = generateJoinCode();
      codeExists = await Group.findOne({ joinCode });
    }

    const newGroup = new Group({
      name,
      owner: ownerId,
      members: [ownerId], 
      joinCode,
      isPrivate: typeof isPrivate === 'boolean' ? isPrivate : true
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

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

exports.getPublicGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      isPrivate: false,
      members: { $ne: req.params.userId }
    })
      .populate('owner', 'username profileImage')
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

exports.joinPublicGroup = async (req, res) => {
  try {
    const { userId } = req.body;
    const groupId = req.params.groupId;

    if (!userId) {
      return res.status(400).json({ message: 'יש לספק מזהה משתמש' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'קבוצה לא נמצאה' });
    }

    if (group.isPrivate) {
      return res.status(403).json({ message: 'הקבוצה פרטית - ניתן להצטרף רק לפי קוד או הזמנה מהמנהל' });
    }

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

exports.setGroupPrivacy = async (req, res) => {
  try {
    const { userId, isPrivate } = req.body;
    const groupId = req.params.groupId;

    if (typeof isPrivate !== 'boolean') {
      return res.status(400).json({ message: 'יש לספק ערך isPrivate מסוג בוליאני' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'קבוצה לא נמצאה' });
    }

    if (group.owner.toString() !== userId) {
      return res.status(403).json({ message: 'רק מנהל הקבוצה יכול לשנות את מצב הפרטיות' });
    }

    group.isPrivate = isPrivate;
    await group.save();

    res.status(200).json(group);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.inviteUserToGroup = async (req, res) => {
  try {
    const { inviterId, inviteeId } = req.body;
    const groupId = req.params.groupId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'קבוצה לא נמצאה' });
    }

    if (group.owner.toString() !== inviterId) {
      return res.status(403).json({ message: 'רק מנהל הקבוצה יכול לשלוח הזמנות הצטרפות' });
    }

    if (group.members.includes(inviteeId)) {
      return res.status(400).json({ message: 'המשתמש כבר חבר בקבוצה' });
    }

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

exports.respondToInvite = async (req, res) => {
  try {
    const { response } = req.body; 
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

exports.getGroupMessages = async (req, res) => {
  try {
    const messages = await GroupMessage.find({ group: req.params.groupId })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

    const recipients = group.members.filter(
      (memberId) => memberId.toString() !== senderId
    );

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