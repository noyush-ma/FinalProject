const Board = require('../models/board');
const SavedPin = require('../models/savedPin');

exports.createBoard = async (req, res) => {
  try {
    const { name, ownerId, coverImage } = req.body;

    if (!name || !ownerId) {
      return res.status(400).json({ message: 'יש לספק שם ללוח ומזהה משתמש (ownerId)' });
    }

    const newBoard = new Board({
      name: name.trim(),
      owner: ownerId,
      coverImage: coverImage || null
    });

    const savedBoard = await newBoard.save();
    res.status(201).json(savedBoard);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'כבר קיים לוח בשם הזה' });
    }
    res.status(400).json({ message: err.message });
  }
};

exports.getUserBoards = async (req, res) => {
  try {
    const boards = await Board.find({ owner: req.params.userId }).sort({ createdAt: -1 });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'לוח לא נמצא' });
    }
    if (req.query.userId && board.owner.toString() !== req.query.userId) {
      return res.status(403).json({ message: 'אין הרשאה לצפות בלוח זה' });
    }
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'לוח לא נמצא' });
    }
    if (req.body.userId && board.owner.toString() !== req.body.userId) {
      return res.status(403).json({ message: 'אין הרשאה לערוך לוח זה' });
    }

    if (req.body.name) board.name = req.body.name.trim();
    if (req.body.coverImage !== undefined) board.coverImage = req.body.coverImage;
    
    const updatedBoard = await board.save();
    res.json(updatedBoard);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'כבר קיים לוח בשם הזה' });
    }
    res.status(400).json({ message: err.message });
  }
};

exports.deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'לוח לא נמצא' });
    }
    if (req.query.userId && board.owner.toString() !== req.query.userId) {
      return res.status(403).json({ message: 'אין הרשאה למחוק לוח זה' });
    }

    await SavedPin.updateMany({ board: board._id }, { board: null });
    await Board.findByIdAndDelete(board._id);

    res.json({ message: 'הלוח נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBoardPins = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'לוח לא נמצא' });
    }
    if (!req.query.userId || board.owner.toString() !== req.query.userId) {
      return res.status(403).json({ message: 'אין הרשאה לצפות בתוכן הלוח הזה' });
    }

    const savedPins = await SavedPin.find({ board: board._id })
      .sort({ savedAt: -1 })
      .populate('post');

    const posts = savedPins.filter(sp => sp.post).map(sp => sp.post);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.savePin = async (req, res) => {
  try {
    const { postId, userId } = req.body;

    if (!postId || !userId) {
      return res.status(400).json({ message: 'חסרים נתונים: יש לספק postId ו-userId' });
    }

    const existing = await SavedPin.findOne({ post: postId, user: userId });
    if (existing) {
      return res.status(200).json(existing);
    }

    const savedPin = await SavedPin.create({ post: postId, user: userId, board: null });
    res.status(201).json(savedPin);
  } catch (err) {
    if (err.code === 11000) {
      const existing = await SavedPin.findOne({ post: req.body.postId, user: req.body.userId });
      if (existing) return res.status(200).json(existing);
    }
    res.status(400).json({ message: err.message });
  }
};

exports.addPinToBoard = async (req, res) => {
  try {
    const { postId, boardId, userId } = req.body;

    if (!postId || !boardId || !userId) {
      return res.status(400).json({ message: 'חסרים נתונים: יש לספק postId, boardId ו-userId' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'לוח לא נמצא' });
    }
    if (board.owner.toString() !== userId) {
      return res.status(403).json({ message: 'לא ניתן לשמור ללוח שאינו שלך' });
    }

    const savedPin = await SavedPin.findOneAndUpdate(
      { post: postId, user: userId },
      { $set: { post: postId, user: userId, board: boardId }, $setOnInsert: { savedAt: new Date() } },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    res.status(200).json(savedPin);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.removeFromBoard = async (req, res) => {
  try {
    const { postId, userId } = req.body;

    if (!postId || !userId) {
      return res.status(400).json({ message: 'חסרים נתונים: יש לספק postId ו-userId' });
    }

    const updated = await SavedPin.findOneAndUpdate(
      { post: postId, user: userId },
      { board: null },
      { returnDocument: 'after' }
    );
    if (!updated) {
      return res.status(404).json({ message: 'לא נמצאה שמירה להסרה מהלוח' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.unsavePin = async (req, res) => {
  try {
    const { postId, userId } = req.body;

    if (!postId || !userId) {
      return res.status(400).json({ message: 'חסרים נתונים: יש לספק postId ו-userId' });
    }

    const deleted = await SavedPin.findOneAndDelete({ post: postId, user: userId });
    if (!deleted) {
      return res.status(404).json({ message: 'לא נמצאה שמירה להסרה' });
    }

    res.json({ message: 'ההסרה בוצעה בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserSavedPins = async (req, res) => {
  try {
    const savedPins = await SavedPin.find({ user: req.params.userId })
      .sort({ savedAt: -1 })
      .populate('post');

    const pins = savedPins
      .filter(sp => sp.post)
      .map(sp => ({
        postId: sp.post._id,
        boardId: sp.board,
        imageUrl: sp.post.imageUrl,
        title: sp.post.title,
        description: sp.post.textContent,
        postType: sp.post.postType,
        savedAt: sp.savedAt
      }));

    res.json(pins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSaveStatus = async (req, res) => {
  try {
    const { postId, userId } = req.params;
    const savedPin = await SavedPin.findOne({ post: postId, user: userId });

    if (!savedPin) {
      return res.json({ saved: false });
    }

    res.json({ saved: true, boardId: savedPin.board });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPinSaveCounts = async (req, res) => {
  try {
    const counts = await SavedPin.aggregate([
      { $group: { _id: '$post', count: { $sum: 1 } } }
    ]);
    const result = {};
    counts.forEach(function (c) {
      result[c._id.toString()] = c.count;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
