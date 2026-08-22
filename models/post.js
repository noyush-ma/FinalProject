// שמירת הפוסטים בזיכרון השרת
let posts = [];
let nextId = 1;

class Post {
  constructor({ authorId, postType, title, textContent = null, imageUrl = null, category }) {
    // אימות סוג הפוסט (טקסט, תמונה או משולב)
    const validTypes = ['TEXT', 'IMAGE', 'COMBINED'];
    if (!validTypes.includes(postType)) {
      throw new Error("Invalid post type. Must be TEXT, IMAGE, or COMBINED");
    }

    this.id = nextId++;
    this.authorId = authorId;
    this.postType = postType;
    this.title = title;
    this.textContent = textContent;
    this.imageUrl = imageUrl;
    this.category = category;
    this.createdAt = new Date();
  }

  // 1. Create - יצירת פוסט חדש
  static create(data) {
    const newPost = new Post(data);
    posts.push(newPost);
    return newPost;
  }

  // 2. List - הצגת כל הפוסטים
  static getAll() {
    return posts;
  }

  // מציאת פוסט לפי ID (פעולת עזר)
  static getById(id) {
    return posts.find(p => p.id === Number(id));
  }

  // 3. Update - עדכון פרטי פוסט
  static update(id, updatedData) {
    const post = Post.getById(id);
    if (!post) return null;

    if (updatedData.title !== undefined) post.title = updatedData.title;
    if (updatedData.textContent !== undefined) post.textContent = updatedData.textContent;
    if (updatedData.imageUrl !== undefined) post.imageUrl = updatedData.imageUrl;
    if (updatedData.category !== undefined) post.category = updatedData.category;

    return post;
  }

  // 4. Delete - מחיקת פוסט
  static delete(id) {
    const index = posts.findIndex(p => p.id === Number(id));
    if (index === -1) return false;

    posts.splice(index, 1);
    return true;
  }

  // 5. Search - חיפוש לפי קטגוריה ו/או תאריכים
  static search({ category, startDate, endDate }) {
    return posts.filter(post => {
      let matches = true;

      // סינון לפי קטגוריה
      if (category && post.category.toLowerCase() !== category.toLowerCase()) {
        matches = false;
      }

      // סינון לפי תאריך התחלה
      if (startDate && new Date(post.createdAt) < new Date(startDate)) {
        matches = false;
      }

      // סינון לפי תאריך סיום
      if (endDate && new Date(post.createdAt) > new Date(endDate)) {
        matches = false;
      }

      return matches;
    });
  }
}

module.exports = Post;