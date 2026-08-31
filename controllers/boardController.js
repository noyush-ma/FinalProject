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

// מחיקת לוח - רק על ידי הבעלים.
// חשוב: מחיקת לוח לא מוחקת את השמירות (הסיכות) שהיו בו - היא רק מנתקת אותן מהלוח
// (מאפסת את שדה board ל-null), כך שהתמונות נשארות שמורות בטאב "סיכות".
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

// שמירת פוסט ל"סיכות" בלבד - שמירה מיידית, בלי לבחור/ליצור לוח.
// אם הפוסט כבר שמור (בכל מצב, גם אם הוא כבר משויך ללוח), הפעולה לא משנה כלום
// ופשוט מחזירה את השמירה הקיימת.
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
      // מירוץ נדיר של שתי בקשות שמירה בו-זמנית - השמירה כבר קיימת, זה בסדר
      const existing = await SavedPin.findOne({ post: req.body.postId, user: req.body.userId });
      if (existing) return res.status(200).json(existing);
    }
    res.status(400).json({ message: err.message });
  }
};

// הוספת פין (שמור או לא) ללוח מסוים.
// אם הפין עדיין לא שמור בכלל - הפעולה גם שומרת אותו ב"סיכות" וגם משייכת אותו ללוח, ביחד.
// אם הפין כבר משויך ללוח אחר, הוא "עובר" ללוח החדש (לוח אחד בו-זמנית לכל פין).
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

// הסרת פין מלוח בלבד - השמירה עצמה (הסיכה) נשארת, רק שדה board מתאפס ל-null.
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

// ביטול שמירה מלא של פוסט (גם מ"סיכות" וגם מכל לוח שהוא היה בו) - ניתן לבטל רק שמירה של המשתמש עצמו
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

// שליפת כל הפינים ששמר משתמש מסוים, בכל הלוחות שלו יחד (לצורך טאב "סיכות" בעמוד הלוחות)
exports.getUserSavedPins = async (req, res) => {
  try {
    const savedPins = await SavedPin.find({ user: req.params.userId })
      .sort({ savedAt: -1 })
      .populate('post');

    // מסנן פינים שהפוסט המקורי שלהם נמחק בינתיים
    const pins = savedPins
      .filter(sp => sp.post)
      .map(sp => ({
        postId: sp.post._id,
        boardId: sp.board,
        imageUrl: sp.post.imageUrl,
        title: sp.post.title,
        description: sp.post.textContent,
        savedAt: sp.savedAt
      }));

    res.json(pins);
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
