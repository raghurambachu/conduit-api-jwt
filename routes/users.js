var express = require("express");
var router = express.Router();
const passport = require("passport");

const User = require("../models/User");

const {
  generatePasswordAndHash,
  isValidPassword,
} = require("../middlewares/auth");

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const user = req.user;
    const userProfile = await user.userJSON();
    res.json(userProfile);
  }
);

router.put(
  "/",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const updatedFields = req.body.user;
    try {
      if (updatedFields.password) {
        const { salt, hash } = await generatePasswordAndHash(password);
        delete updatedFields.password;
        updatedFields.salt = salt;
        updatedFields.hash = hash;
      }
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updatedFields,
        { new: true }
      );
      const userProfile = await updatedUser.userJSON();
      res.json(userProfile);
    } catch (err) {
      next(err);
    }
  }
);

router.post("/login", async function (req, res, next) {
  const { email, password } = req.body.user;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: "Could not find the user." });

    const isValid = await isValidPassword(password, user.hash);
    if (isValid) {
      const userProfile = await user.userJSON();
      return res.json(userProfile);
    } else {
      res.status(401).json({ msg: "You entered the wrong credentials." });
    }
  } catch (err) {
    next(err);
  }
});

router.post("/register", async function (req, res, next) {
  const { username, password, email } = req.body.user;
  try {
    const { salt, hash } = await generatePasswordAndHash(password);
    const newUser = new User({
      username,
      email,
      hash,
      salt,
    });
    const user = await newUser.save();
    const userProfile = await user.userJSON();
    res.status(201).json(userProfile);
  } catch (err) {
    res.status(500).json({ msg: "Server is not running" });
  }
});

module.exports = router;
