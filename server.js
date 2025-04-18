// server.js
const express = require('express');
const path = require('path');

const app = express();
// serve static files from the React build
app.use(express.static(path.join(__dirname, 'build')));

// always return the main index.html, so React Router works
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// use the PORT environment variable, or default to 8080
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
