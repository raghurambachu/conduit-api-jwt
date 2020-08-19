const express = require("express");
const Article = require("../models/Article");
const router = express.Router();

router.get("/", async function (req, res, next) {
  try {
    const tags = await Article.distinct("tagList");
    if (tags) {
      res.json({ tags: tags });
    } else {
      res.statusCode(404).json({ msg: "No tags yet" });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
