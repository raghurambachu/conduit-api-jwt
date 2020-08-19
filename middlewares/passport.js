const { Strategy, ExtractJwt } = require("passport-jwt");
const User = require("../models/User");

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.APP_SECRET,
};

const JwtStrategy = new Strategy(opts, function (payload, done) {
  console.log(payload);
  User.findOne({ _id: payload.sub }, function (err, user) {
    if (err) return done(err, false);
    if (user) return done(null, user);
    else return done(null, false);
  });
});

module.exports = (passport) => {
  passport.use(JwtStrategy);
};
