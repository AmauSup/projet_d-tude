function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message) {
  sendJson(res, status, { success: false, message });
}

function sendEmpty(res, status = 204) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
  });
  res.end();
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);

  if (!chunks.length) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    throw new Error('JSON invalide');
  }
}

module.exports = {
  sendJson,
  sendError,
  sendEmpty,
  readJsonBody,
};