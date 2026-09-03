const Post = require('../models/post');
const User = require('../models/user'); // נחוץ כדי לאמת סיסמה מול המשתמש בעריכה
const Notification = require('../models/notification'); // נחוץ כדי להודיע לעוקבים על פוסט חדש

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

    // יצירת התראת "פוסט חדש" לכל מי שעוקב אחרי המשתמש שהעלה את הפוסט
    try {
      const followers = await User.find({ following: authorUser._id }, '_id');
      if (followers.length) {
        const notificationsToInsert = followers.map((follower) => ({
          recipient: follower._id,
          type: 'NEW_POST',
          text: `${authorUser.username} העלה/העלתה פוסט חדש: "${savedPost.title}"`,
          fromUser: authorUser._id,
          post: savedPost._id
        }));
        await Notification.insertMany(notificationsToInsert);
      }
    } catch (notifErr) {
      // שגיאה ביצירת ההתראות לא צריכה למנוע את יצירת הפוסט עצמו
      console.error('שגיאה ביצירת התראות פוסט חדש:', notifErr);
    }

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

// שליפת פוסטים רק של משתמשים שהמשתמש המחובר עוקב אחריהם ("פיד חברים")
exports.getFollowingPosts = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'המשתמש לא נמצא' });
    }

    const posts = await Post.find({ author: { $in: user.following } }).sort({ createdAt: -1 });
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

// הוספת תגובה לפוסט - נשמרת לצמיתות ב-MongoDB בתוך מערך comments
exports.addComment = async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!userId || !text || !text.trim()) {
      return res.status(400).json({ message: 'יש לספק userId וטקסט תגובה' });
    }

    const author = await User.findById(userId);
    if (!author) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'פוסט לא נמצא' });
    }

    const newComment = {
      authorId: author._id,
      authorUsername: author.username,
      text: text.trim(),
      createdAt: new Date()
    };
    post.comments.push(newComment);
    await post.save();

    res.status(201).json({ comments: post.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// מחיקת תגובה מפוסט - מותר רק לכותב התגובה עצמו, או לבעל הפוסט (מנהל/ת התוכן)
exports.deleteComment = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'יש לספק userId' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'פוסט לא נמצא' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'תגובה לא נמצאה' });
    }

    const isCommentAuthor = comment.authorId && comment.authorId.toString() === userId;
    const isPostOwner = post.author && post.author.toString() === userId;

    if (!isCommentAuthor && !isPostOwner) {
      return res.status(403).json({ message: 'אין לך הרשאה למחוק תגובה זו' });
    }

    comment.deleteOne();
    await post.save();

    res.json({ comments: post.comments });
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

// סטטיסטיקת פוסטים: כמה פוסטים קיימים בכל קטגוריה (GroupBy לפי category)
exports.getPostCountsByCategory = async (req, res) => {
  try {
    const counts = await Post.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const result = {};
    counts.forEach(function (c) {
      result[c._id || 'General'] = c.count;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};