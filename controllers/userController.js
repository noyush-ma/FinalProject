const User = require('../models/user');
const Post = require('../models/post'); 

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
    if (err.code === 11000) {
      return res.status(400).json({ message: 'שם משתמש או אימייל כבר קיימים במערכת' });
    }
    res.status(400).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
      { new: true, runValidators: true } 
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

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

exports.toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id; 
    const { followerId } = req.body; 
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

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'יש להזין אימייל וסיסמה' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
    }

    const { password: _pw, ...userWithoutPassword } = user.toObject();
    res.status(200).json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};