const Post = require('../models/post');
const User = require('../models/user');
const Notification = require('../models/notification');  

async function postToFacebookPage(post) {
  const pageId = process.env.FB_PAGE_ID;
  const pageAccessToken = process.env.FB_PAGE_ACCESS_TOKEN;

  if (!pageId || !pageAccessToken) {
    return { success: false, error: 'שיתוף לפייסבוק אינו זמין כרגע (FB_PAGE_ID או FB_PAGE_ACCESS_TOKEN לא מוגדרים)' };
  }

  const message = `${post.title}\n\n${post.textContent || ''}`.trim();

  try {
    let url;
    const params = new URLSearchParams({ access_token: pageAccessToken });

    if (post.imageUrl && post.postType === 'IMAGE') {
      url = `https://graph.facebook.com/v21.0/${pageId}/photos`;
      params.append('url', post.imageUrl);
      params.append('caption', message);
    } else {
      url = `https://graph.facebook.com/v21.0/${pageId}/feed`;
      params.append('message', message);
    }

    const fbResponse = await fetch(url, { method: 'POST', body: params });
    const fbData = await fbResponse.json();

    if (fbData.error) {
      console.error('שגיאת Facebook Graph API:', fbData.error);
      const code = fbData.error.code;
      let friendlyError = fbData.error.message;

      if (code === 200 || code === 100) {
        friendlyError = 'שיתוף לפייסבוק אינו זמין – ה-App טרם קיבל אישור Meta לפרסום בדפים. הפוסט נשמר בהצלחה במערכת.';
      } else if (code === 190) {
        friendlyError = 'שיתוף לפייסבוק נכשל – ה-Access Token פג תוקף. הפוסט נשמר בהצלחה במערכת.';
      }

      return { success: false, error: friendlyError };
    }

    return { success: true, fbPostId: fbData.id || fbData.post_id };
  } catch (err) {
    console.error('שגיאה בחיבור ל-Facebook Graph API:', err);
    return { success: false, error: 'שיתוף לפייסבוק נכשל עקב בעיית תקשורת. הפוסט נשמר בהצלחה במערכת.' };
  }
}

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
      console.error('שגיאה ביצירת התראות פוסט חדש:', notifErr);
    }

    let fbShareResult = null;
    if (req.body.shareToFacebook) {
      fbShareResult = await postToFacebookPage(savedPost);
    }

    res.status(201).json({ ...savedPost.toObject(), fbShareResult });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'פוסט לא נמצא' });
    }

    const { userId } = req.body;

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

exports.getPostsTimeline = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 14, 1), 90);

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));

    const results = await Post.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      }
    ]);

    const countsByDate = {};
    results.forEach(function (r) {
      countsByDate[r._id] = r.count;
    });

    const labels = [];
    const data = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      labels.push(key);
      data.push(countsByDate[key] || 0);
    }

    res.json({ labels, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};