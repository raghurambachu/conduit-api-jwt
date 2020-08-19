const jwt = require("jsonwebtoken");

async function issueJwt(user) {
  const _id = user._id;
  const expiresIn = "1d";
  const payload = {
    sub: _id,
    iat: Date.now(),
    username: user.username,
    email: user.email,
  };

  const signedToken = await jwt.sign(payload, process.env.APP_SECRET, {
    expiresIn,
  });
  return {
    token: "Bearer " + signedToken,
    expires: expiresIn,
  };
}

module.exports = { issueJwt };
