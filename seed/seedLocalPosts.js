// seed/seedLocalPosts.js
// -----------------------------------------------------------------------------
// סקריפט חד-פעמי: הופך את 37 הפוסטים ה"קבועים" שהיו כתובים ידנית ב-feed.html
// לפוסטים אמיתיים ב-MongoDB, עם מזהה (_id) אמיתי לכל אחד.
//
// למה זה נחוץ? כל עוד התמונות האלה היו "מוטבעות" ישירות ב-HTML (בלי לעבור
// דרך ה-DB), לא היה להן _id אמיתי - ולכן אי אפשר היה לשמור עליהן לייקים
// או תגובות (אין לאן לשמור אותם). אחרי הרצת הסקריפט הזה, כל התמונות האלה
// יהפכו לפוסטים לכל דבר, בדיוק כמו פוסט שהועלה דרך כפתור "יצירת פוסט" -
// כולל לייקים ותגובות שנשמרים לצמיתות.
//
// איך מריצים: פעם אחת בלבד, מתוך שורש הפרויקט:
//   npm run seed
// -----------------------------------------------------------------------------

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const Post = require('../models/post');

const LOCAL_POSTS = [
  {
    "title": "view",
    "imageUrl": "pictures/view.png",
    "textContent": "Austrian nature",
    "category": "nature",
    "authorUsername": "karin"
  },
  {
    "title": "flower",
    "imageUrl": "pictures/flower.png",
    "textContent": "pink drowing flower",
    "category": "arts",
    "authorUsername": "floraa"
  },
  {
    "title": "koala",
    "imageUrl": "pictures/koala.png",
    "textContent": "our cute koala!",
    "category": "animals",
    "authorUsername": "Israel_zoo"
  },
  {
    "title": "sea",
    "imageUrl": "pictures/sea.png",
    "textContent": "Sea in Spain!!",
    "category": "nature",
    "authorUsername": "saritush"
  },
  {
    "title": "dog",
    "imageUrl": "pictures/dog.png",
    "textContent": "our dog loee on a trip!!!",
    "category": "animals",
    "authorUsername": "let_animals_live"
  },
  {
    "title": "cat",
    "imageUrl": "pictures/cat.png",
    "textContent": "A cat from Florida is taking a pic with the moon",
    "category": "animals",
    "authorUsername": "NASA"
  },
  {
    "title": "coffeeShop",
    "imageUrl": "pictures/coffeeShop.png",
    "textContent": "come to visit us at our new coffeeShop!",
    "category": "places",
    "authorUsername": "Eli_85"
  },
  {
    "title": "mall",
    "imageUrl": "pictures/mall.png",
    "textContent": "at the mall!!",
    "category": "places",
    "authorUsername": "Sasha"
  },
  {
    "title": "arts",
    "imageUrl": "pictures/artsDrowings.png",
    "textContent": "Another drowing of mine",
    "category": "arts",
    "authorUsername": "yarden_drows"
  },
  {
    "title": "city",
    "imageUrl": "pictures/city.png",
    "textContent": "USA",
    "category": "urban",
    "authorUsername": "shoogi"
  },
  {
    "title": "wallpaper",
    "imageUrl": "pictures/wallpaper.png",
    "textContent": "cute wallpaper!",
    "category": "arts",
    "authorUsername": "lauren"
  },
  {
    "title": "minions",
    "imageUrl": "pictures/minions.png",
    "textContent": "a happy birthday wish from the minions.",
    "category": "movies",
    "authorUsername": "Diseny"
  },
  {
    "title": "school",
    "imageUrl": "pictures/school.png",
    "textContent": "i'm bored",
    "category": "places",
    "authorUsername": "nehoray"
  },
  {
    "title": "cooking",
    "imageUrl": "pictures/cooking.png",
    "textContent": "making chicken with vegetabales",
    "category": "food & drinks",
    "authorUsername": "cook_with_sharon"
  },
  {
    "title": "rainbow",
    "imageUrl": "pictures/rainbow.png",
    "textContent": "a beautiful rainbow",
    "category": "nature",
    "authorUsername": "Angel"
  },
  {
    "title": "fruit",
    "imageUrl": "pictures/fruit.png",
    "textContent": "fruitsss",
    "category": "food & drinks",
    "authorUsername": "Jessicaaa"
  },
  {
    "title": "clothesShop",
    "imageUrl": "pictures/clothesShop.png",
    "textContent": "shop aesthetic",
    "category": "places",
    "authorUsername": "renana"
  },
  {
    "title": "homeDesign",
    "imageUrl": "pictures/homeDesign.png",
    "textContent": "home design inspo",
    "category": "arts",
    "authorUsername": "RON"
  },
  {
    "title": "nyc",
    "imageUrl": "pictures/nyc.png",
    "textContent": "traveling in NYC!!",
    "category": "places",
    "authorUsername": "Karen"
  },
  {
    "title": "vanGohArt",
    "imageUrl": "pictures/vanGohArt.png",
    "textContent": "a masterpiece by Van Goh",
    "category": "arts",
    "authorUsername": "Van Goh"
  },
  {
    "title": "conditory",
    "imageUrl": "pictures/conditory.png",
    "textContent": "pastries homeMade!",
    "category": "food & drinks",
    "authorUsername": "Chef MISHEL"
  },
  {
    "title": "motivationQuote",
    "imageUrl": "pictures/motivationQuote.png",
    "textContent": "motivation for you!",
    "category": "general",
    "authorUsername": "Anonymous"
  },
  {
    "title": "spain",
    "imageUrl": "pictures/spain.png",
    "textContent": "welcome to spain!",
    "category": "places",
    "authorUsername": "jorje"
  },
  {
    "title": "disneyCars",
    "imageUrl": "pictures/disneyCars.png",
    "textContent": "speedy carssss",
    "category": "movies",
    "authorUsername": "Disney"
  },
  {
    "title": "NoaKirel",
    "imageUrl": "pictures/NoaKirel.png",
    "textContent": "noa kilaaaaa",
    "category": "celebrity",
    "authorUsername": "korali"
  },
  {
    "title": "jerusalem",
    "imageUrl": "pictures/jerusalem.png",
    "textContent": "welcome to jerusalem!",
    "category": "places",
    "authorUsername": "moshe"
  },
  {
    "title": "macarons",
    "imageUrl": "pictures/macarons.png",
    "textContent": "macarons in the bakery",
    "category": "food & drinks",
    "authorUsername": "rachel"
  },
  {
    "title": "mountain",
    "imageUrl": "pictures/mountain.png",
    "textContent": "mountain view",
    "category": "nature",
    "authorUsername": "hannah"
  },
  {
    "title": "flowerss",
    "imageUrl": "pictures/flowerss.png",
    "textContent": "so beutiful flowers!",
    "category": "nature",
    "authorUsername": "lola"
  },
  {
    "title": "artsf",
    "imageUrl": "pictures/artsf.png",
    "textContent": "flowers and sun",
    "category": "arts",
    "authorUsername": "nori"
  },
  {
    "title": "greenLights",
    "imageUrl": "pictures/greenLights.png",
    "textContent": "Green Lights in Icelend!",
    "category": "nature",
    "authorUsername": "Monica"
  },
  {
    "title": "forast",
    "imageUrl": "pictures/forast.png",
    "textContent": "Wonderful Forast",
    "category": "nature",
    "authorUsername": "Rocka"
  },
  {
    "title": "wallpapers",
    "imageUrl": "pictures/wallpaper2.webp",
    "textContent": "pink Bow tie!",
    "category": "arts",
    "authorUsername": "Lana"
  },
  {
    "title": "pinkHeart",
    "imageUrl": "pictures/pinkHeart.png",
    "textContent": "beutiful art of pink heart!",
    "category": "arts",
    "authorUsername": "Lory"
  },
  {
    "title": "moana",
    "imageUrl": "pictures/moana.jpg",
    "textContent": "live action moana",
    "category": "movies",
    "authorUsername": "Mary"
  },
  {
    "title": "mrs cat",
    "imageUrl": "pictures/mrs cat.webp",
    "textContent": "mrs cat",
    "category": "animals",
    "authorUsername": "morgan"
  },
  {
    "title": "snoopy",
    "imageUrl": "pictures/snoopy.webp",
    "textContent": "SNOOPY!!!",
    "category": "general",
    "authorUsername": "snoopy_lover"
  }
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('מחובר ל-MongoDB, מתחיל בזריעת הפוסטים הקבועים...');

  // יוצרים (אם עוד לא קיים) משתמש "מערכת" שישמש כבעלים הטכני של הפוסטים האלה.
  // שימו לב: השם שמוצג בפועל על כל פוסט הוא authorUsername (השם המקורי שהיה
  // כתוב ב-HTML, כמו "karin" או "floraa") ולא שם המשתמש הזה.
  let systemUser = await User.findOne({ email: 'legacy-content@pinterest.local' });
  if (!systemUser) {
    systemUser = await User.create({
      username: 'Pinterest Legacy Content',
      email: 'legacy-content@pinterest.local',
      password: 'not-a-real-account'
    });
    console.log('נוצר משתמש מערכת עבור הפוסטים הקבועים.');
  }

  let created = 0;
  let skipped = 0;

  for (const postData of LOCAL_POSTS) {
    const alreadyExists = await Post.findOne({ imageUrl: postData.imageUrl });
    if (alreadyExists) {
      skipped++;
      continue;
    }

    await Post.create({
      title: postData.title,
      imageUrl: postData.imageUrl,
      textContent: postData.textContent,
      category: postData.category,
      postType: 'IMAGE',
      author: systemUser._id,
      authorUsername: postData.authorUsername,
      likedBy: [],
      comments: []
    });
    created++;
  }

  console.log(`הסתיים: ${created} פוסטים חדשים נוצרו, ${skipped} כבר היו קיימים ודולגו.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('שגיאה בזריעת הפוסטים:', err);
  process.exit(1);
});
