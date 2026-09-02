const User = require('../models/user');
const Post = require('../models/post'); // נחוץ כדי לעדכן רטרואקטיבית שם משתמש בכל הפוסטים שלו

// 1. יצירת משתמש חדש (Create)
exports.createUser = async (req, res) => {
  try {
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      profileImage: req.body.profileImage,
      bio: req.body.bio
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    // שגיאת "שדה כבר קיים" (username/email ייחודיים) מגיעה עם קוד 11000
    if (err.code === 11000) {
      return res.status(400).json({ message: 'שם משתמש או אימייל כבר קיימים במערכת' });
    }
    res.status(400).json({ message: err.message });
  }
};

// 2. שליפת כל המשתמשים (Read all)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. שליפת משתמש יחיד לפי מזהה (Read one)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. עדכון משתמש קיים (Update)
exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        profileImage: req.body.profileImage,
        bio: req.body.bio
      },
      { new: true, runValidators: true } // מחזיר את המסמך המעודכן ומריץ ולידציה
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    // אם שם המשתמש שונה, מעדכנים רטרואקטיבית את כל הפוסטים הקיימים שהוא כבר פרסם,
    // כדי שהשם המוצג עליהם יתעדכן גם הוא ולא יישאר "תקוע" עם השם הישן
    if (req.body.username) {
      await Post.updateMany(
        { author: updatedUser._id },
        { authorUsername: updatedUser.username }
      );
    }

    res.json(updatedUser);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'שם משתמש או אימייל כבר קיימים במערכת' });
    }
    res.status(400).json({ message: err.message });
  }
};

// 5. מחיקת משתמש לפי מזהה (Delete)
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }
    res.json({ message: 'המשתמש נמחק בהצלחה', deletedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 7. עקיבה/הפסקת עקיבה אחרי משתמש אחר (טוגל) - נשמר לצמיתות בשדה following ב-MongoDB
exports.toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id; // המשתמש שרוצים לעקוב/להפסיק לעקוב אחריו
    const { followerId } = req.body; // המשתמש המחובר שמבצע את הפעולה

    if (!followerId) {
      return res.status(400).json({ message: 'יש לספק followerId' });
    }
    if (followerId === targetUserId) {
      return res.status(400).json({ message: 'לא ניתן לעקוב אחרי עצמך' });
    }

    const followerUser = await User.findById(followerId);
    const targetUser = await User.findById(targetUserId);
    if (!followerUser || !targetUser) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    const alreadyFollowing = followerUser.following.some((id) => id.toString() === targetUserId);

    if (alreadyFollowing) {
      followerUser.following = followerUser.following.filter((id) => id.toString() !== targetUserId);
    } else {
      followerUser.following.push(targetUserId);
    }

    await followerUser.save();
    res.json({ following: !alreadyFollowing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 8. התחברות משתמש קיים (Login)
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'יש להזין אימייל וסיסמה' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || user.password !== password) {
      // הודעה גנרית בכוונה - לא לחשוף אם הבעיה היא באימייל או בסיסמה
      return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
    }

    // לא מחזירים את הסיסמה חזרה ללקוח
    const { password: _pw, ...userWithoutPassword } = user.toObject();
    res.status(200).json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};