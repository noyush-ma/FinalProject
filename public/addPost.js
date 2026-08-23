document.getElementById('postForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value;
  const imgUrl = document.getElementById('imgUrl').value;
  const description = document.getElementById('description').value;

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, imgUrl, description })
    });

    const data = await res.json();

    if (res.ok) {
      alert('הפוסט נשמר בהצלחה ב-MongoDB!');
      document.getElementById('postForm').reset();
    } else {
      alert('שגיאה: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('שגיאה בתקשורת עם השרת');
  }
});