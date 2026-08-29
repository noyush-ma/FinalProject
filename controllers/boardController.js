const Board = require('../models/board');
const SavedPin = require('../models/savedPin');

// יצירת לוח חדש עבור משתמש
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

// שליפת כל הלוחות של משתמש מסוים בלבד (הלוחות פרטיים למשתמש שיצר אותם)
exports.getUserBoards = async (req, res) => {
  try {
    const boards = await Board.find({ owner: req.params.userId }).sort({ createdAt: -1 });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// שליפת לוח בודד לפי מזהה - עם בדיקת בעלות אם סופק userId
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

// עדכון לוח (שם / תמונת שער) - רק על ידי הבעלים
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
    if (req.body.coverImage) board.coverImage = req.body.coverImage;

    const updatedBoard = await board.save();
    res.json(updatedBoard);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'כבר קיים לוח בשם הזה' });
    }
    res.status(400).json({ message: err.message });
  }
};

// מחיקת לוח - כולל כל השמירות (SavedPin) ששייכות אליו, רק על ידי הבעלים
exports.deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'לוח לא נמצא' });
    }
    if (req.query.userId && board.owner.toString() !== req.query.userId) {
      return res.status(403).json({ message: 'אין הרשאה למחוק לוח זה' });
    }

    await SavedPin.deleteMany({ board: board._id });
    await Board.findByIdAndDelete(board._id);

    res.json({ message: 'הלוח נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// שליפת כל הפוסטים (פינים) השמורים בלוח מסוים - רק לבעל הלוח
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

    // מסנן פינים שהפוסט המקורי שלהם נמחק בינתיים
    const posts = savedPins.filter(sp => sp.post).map(sp => sp.post);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// שמירת פוסט ללוח מסוים.
// כל פוסט יכול להיות שמור על ידי משתמש נתון ללוח אחד בלבד בו-זמנית -
// שמירה חוזרת של אותו פוסט ללוח אחר מעבירה אותו במקום ליצור כפילות.
exports.savePin = async (req, res) => {
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
      { post: postId, board: boardId, user: userId, savedAt: new Date() },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(savedPin);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// הסרת שמירה של פוסט - ניתן להסיר רק שמירה של המשתמש עצמו
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

// בדיקת מצב שמירה: האם פוסט מסוים שמור על ידי משתמש מסוים, ובאיזה לוח
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
