const Post = require('../models/post');
const User = require('../models/user'); // נחוץ כדי לאמת סיסמה מול המשתמש בעריכה

// יצירת פוסט חדש
exports.createPost = async (req, res) => {
  try {
    if (!req.body.authorId) {
      return res.status(400).json({ message: 'יש להתחבר כדי לפרסם פוסט (חסר authorId)' });
    }

    const authorUser = await User.findById(req.body.authorId);
    if (!authorUser) {
      return res.status(404).json({ message: 'המשתמש המחובר לא נמצא' });
    }

    const newPost = new Post({
      title: req.body.title,
      imageUrl: req.body.imgUrl,
      textContent: req.body.description,
      category: req.body.category,
      postType: req.body.postType,
      author: authorUser._id,
      authorUsername: authorUser.username
    });
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// שליפת כל הפוסטים
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// הוספה/הסרה של לייק לפוסט (טוגל) - נשמר לצמיתות ב-MongoDB בתוך מערך likedBy
exports.toggleLike = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'יש לספק userId' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'פוסט לא נמצא' });
    }

    const alreadyLiked = post.likedBy.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likedBy = post.likedBy.filter((id) => id.toString() !== userId);
    } else {
      post.likedBy.push(userId);
    }

    await post.save();
    res.json({ liked: !alreadyLiked, likesCount: post.likedBy.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// שליפת פוסט יחיד לפי מזהה
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'פוסט לא נמצא' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// מחיקת פוסט לפי מזהה
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'פוסט לא נמצא' });
    }

    const { userId } = req.body;

    // בדיקה: המשתמש שמנסה למחוק הוא אכן זה שהעלה את הפוסט
    if (!userId || post.author.toString() !== userId) {
      return res.status(403).json({ message: 'ניתן למחוק רק פוסטים שהעלית בעצמך' });
    }

    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'הפוסט נמחק בהצלחה', deletedPost });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'פוסט לא נמצא' });
    }

    const { userId } = req.body;

    // בדיקה: המשתמש שמנסה לערוך הוא אכן זה שהעלה את הפוסט
    if (!userId || post.author.toString() !== userId) {
      return res.status(403).json({ message: 'ניתן לערוך רק פוסטים שהעלית בעצמך' });
    }

    post.title = req.body.title;
    post.imageUrl = req.body.imgUrl;
    post.textContent = req.body.description;
    post.category = req.body.category;
    post.postType = req.body.postType;

    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};