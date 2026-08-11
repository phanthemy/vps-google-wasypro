const express = require('express');
const path = require('path');
const app = express();
const PORT = 5005;

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`WasyPro server running on port ${PORT}`);
});
