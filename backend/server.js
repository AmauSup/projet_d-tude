const http = require('http');
const { router } = require('./routes');
const { ensureDbFile } = require('./data/store');

const PORT = 3001;

async function start() {
  await ensureDbFile();

  const server = http.createServer((req, res) => {
    router(req, res);
  });

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();