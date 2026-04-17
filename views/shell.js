'use strict';

function shell(title, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — Percy Lodge</title>
<link rel="stylesheet" href="/css/app.css">
</head>
<body>
<nav class="navbar">
  <a class="nav-brand" href="/">Percy Lodge No. 1427</a>
  <div class="nav-links">
    <a href="/">Meetings</a>
    <a href="/settings/annual">Annual Settings</a>
    <a href="/settings/static">Lodge Settings</a>
    <a href="/settings/templates">Business Templates</a>
  </div>
</nav>
<main class="container">
${content}
</main>
</body>
</html>`;
}

module.exports = { shell };
