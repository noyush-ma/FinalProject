const Post = require('../../models/post');

// יצירת פוסט חדש
exports.createPost = async (req, res) => {
  try {
    const newPost = new Post({
      title: req.body.title,
      imageUrl: req.body.imgUrl,
      textContent: req.body.description,
      category: req.body.category,
      postType: req.body.postType
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
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) {
      return res.status(404).json({ message: 'פוסט לא נמצא' });
    }
    res.json({ message: 'הפוסט נמחק בהצלחה', deletedPost });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};