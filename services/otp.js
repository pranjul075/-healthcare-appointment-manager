function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function expiryInMinutes(minutes) {
  return new Date(Date.now() + minutes * 60000).toISOString();
}

function isExpired(expiresAtIso) {
  return new Date(expiresAtIso).getTime() < Date.now();
}

module.exports = { generateCode, expiryInMinutes, isExpired };
