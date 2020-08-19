const bcrypt = require("bcrypt");

// generate password and hash
async function generatePasswordAndHash(password) {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  return {
    salt,
    hash,
  };
}

//Verify password with hash
async function isValidPassword(password, hash) {
  const isValid = await bcrypt.compare(password, hash);
  return isValid;
}

module.exports = {
  generatePasswordAndHash,
  isValidPassword,
};
