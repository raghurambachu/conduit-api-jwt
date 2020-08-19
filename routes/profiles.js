const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/User");

router.get("/:username", async function (req, res, next) {
  //   username is the username of the user whose profile being viewed by the logged in user
  const username = req.params.username;
  try {
    const userSearched = await User.findOne({ username });
    if (userSearched) {
      const loggedInUser = req.user;
      const profileSearched = userSearched.profileJSON(loggedInUser);
      res.json(profileSearched);
    } else {
      res
        .status(401)
        .json({ msg: `There is no such user with username ${username}` });
    }
  } catch (err) {
    next(err);
  }
});

router.post(
  "/:username/follow",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const usernameToFollow = req.params.username;
    const loggedInUser = req.user;
    try {
      const userToFollow = await User.findOne(
        { username: usernameToFollow },
        "_id"
      );
      if (userToFollow) {
        loggedInUser.follow(userToFollow._id);
        const userProfile = loggedInUser.profileJSON(userToFollow);
        res.json(userProfile);
      } else {
        res
          .status(401)
          .json({ msg: `There is no such user with username ${username}` });
      }
    } catch (err) {}
  }
);

router.delete(
  "/:username/follow",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const usernameToUnfollow = req.params.username;
    const loggedInUser = req.user;
    try {
      const userToUnfollow = await User.findOne(
        { username: usernameToUnfollow },
        "_id"
      );
      if (userToUnfollow) {
        loggedInUser.unFollow(userToUnfollow._id);
        const userProfile = await loggedInUser.profileJSON(userToUnfollow);
        res.json(userProfile);
      } else {
        res
          .status(401)
          .json({ msg: `There is no such user with username ${username}` });
      }
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
