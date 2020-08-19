const express = require("express");
const passport = require("passport");
const Article = require("../models/Article");
const User = require("../models/User");
const Comment = require("../models/Comment");
const router = express.Router();
const slugify = require("slugify");
const e = require("express");

// List articles
router.get("/", async function (req, res, next) {
  const query = {};
  const limit = 2;
  const offset = 0;
  if (typeof req.query.limit !== "undefined") {
    limit = req.query.limit;
  }
  if (typeof req.query.offset !== "undefined") {
    offset = req.query.offset;
  }
  if (typeof req.query.tag !== "undefined") {
    query.tagList = { $in: [req.query.tag] };
  }
  Promise.all([
    req.query.author ? User.findOne({ username: req.query.author }) : null,
    req.query.favorited
      ? User.findOne({ username: req.query.favorited })
      : null,
  ])
    .then(function (result) {
      const author = result[0];
      const favoriter = result[1];
      if (author) {
        query.author = author._id;
      }
      if (favoriter) {
        query._id = { $in: favoriter.favorites };
      } else if (req.query.favorited) {
        query._id = { $in: [] };
      }

      return Promise.all([
        Article.find(query)
          .limit(+limit)
          .skip(+offset)
          .sort({ createdAt: "desc" })
          .populate("author")
          .exec(),
        Article.countDocuments(query).exec(),
      ])
        .then(async function (result) {
          let articles = result[0];
          const articlesCount = result[1];
          for (let i = 0; i < articles.length; i++) {
            articles[i] = await articles[i].articleJSON(req.user);
          }
          return res.json({
            articles,
            articlesCount,
          });
        })
        .catch(next);
    })
    .catch((err) => next(err));
});

//Get feeds
router.get(
  "/feed",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    var limit = 3;
    var offset = 0;
    if (typeof req.query.limit !== "undefined") {
      req.query.limit = limit;
    }
    if (typeof req.query.offset !== "undefined") {
      req.query.offset = offset;
    }
    const query = {
      author: { $in: [req.user.following] },
    };
    try {
      const articles = await Article.find(query)
        .limit(+limit)
        .skip(+offset)
        .sort({ createdAt: "desc" })
        .exec();
      if (!articles || !articles.length) {
        res.status(404).json({ msg: "No articles found." });
      }
      for (let i = 0; i < articles.length; i++) {
        articles[i] = await articles[i]
          .articleJSON(req.user)
          .then((data) => data.article);
      }
      const articlesCount = await Article.countDocuments(query);
      res.json({ articles, articlesCount });
    } catch (err) {
      next(err);
    }
  }
);

// Create article
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const { title, description, body } = req.body.article;
    if (!title || !description || !body) {
      return res
        .status(400)
        .json({ msg: "Title,Description or Body fields cannot be empty" });
    }
    const article = req.body.article;
    article.author = req.user._id;
    try {
      const articleCreated = await Article.create(article);
      const articleJSON = await articleCreated.articleJSON(req.user);
      res.json(articleJSON);
    } catch (err) {
      next(err);
    }
  }
);

// Get Article
router.get("/:slug", async function (req, res, next) {
  const slug = req.params.slug;
  try {
    const article = await Article.findOne({ slug });
    if (!article) {
      return res.status(401).json({ msg: "Requested article does not exist" });
    }
    const articleAuthor = await User.findOne({ _id: article.author });
    const articleJSON = await article.articleJSON(articleAuthor);
    res.json(articleJSON);
  } catch (err) {
    next(err);
  }
});

//Update Article
router.put(
  "/:slug",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const slug = req.params.slug;
    try {
      const article = await Article.findOne({ slug });
      if (!article)
        return res.status(400).json({ msg: "No such article found." });
      if (req.body.article.title) {
        req.body.article.slug = slugify(req.body.article.title, {
          lower: true,
        });
      }
      if (article.author.toString() === req.user._id.toString()) {
        const updatedArticle = await Article.findByIdAndUpdate(
          article._id,
          req.body.article,
          { new: true }
        );
        const articleAuthor = await User.findOne({ _id: article.author });
        const articleJSON = await updatedArticle.articleJSON(articleAuthor);
        res.json(articleJSON);
      } else {
        res.json({ msg: "Not authorised user to update the article." });
      }
    } catch (err) {
      next(err);
    }
  }
);

//Delete Article
router.delete(
  "/:slug",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const slug = req.params.slug;
    try {
      const article = await Article.findOne({ slug });
      if (!article)
        return res.status(400).json({ msg: "No such article found." });

      if (article.author.toString() === req.user._id.toString()) {
        const deletedArticle = Article.findByIdAndDelete(article._id);
        res.json({ article: deletedArticle });
      } else {
        res.json({ msg: "Not authorised user to update the article." });
      }
    } catch (err) {
      next(err);
    }
  }
);

// Add Comments
router.post(
  "/:slug/comments",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const slug = req.params.slug;
    try {
      const article = await Article.findOne({ slug });
      if (!article)
        return res.status(400).json({ msg: "No such article found." });
      if (!req.body.comment.body) {
        return res.status(401).json({ msg: "Comment body cannot be empty!!" });
      }
      req.body.comment.author = req.user._id;
      req.body.comment.article = article._id;
      const comment = await Comment.create(req.body.comment);
      const updatedArticle = await Article.findByIdAndUpdate(article._id, {
        $push: { comments: comment._id },
      });
      const commentJSON = comment.commentJSON(req.user);
      res.json(commentJSON);
    } catch (err) {
      next(err);
    }
  }
);

// Get Comments
router.get("/:slug/comments", async function (req, res, next) {
  const slug = req.params.slug;
  try {
    const article = await Article.findOne({ slug });
    const articleAuthor = await User.findOne({ _id: article.author });
    if (!article)
      return res.status(400).json({ msg: "No such article found." });

    let allComments = await Comment.find({ article: article._id });

    allComments = allComments.map((comment) => ({
      ...comment.commentJSON(articleAuthor),
    }));
    res.json({ comments: allComments });
  } catch (err) {
    next(err);
  }
});

// Favorite an article
router.post(
  "/:slug/favorite",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const slug = req.params.slug;
    try {
      const article = await Article.findOne({ slug });
      if (!article) {
        return res.status(401).json({ msg: "No such article exists." });
      }
      const user = req.user;
      const addToFav = await user.favorite(article._id);
      const articleJSON = await article.articleJSON(req.user);
      res.json(articleJSON);
    } catch (err) {
      next(err);
    }
  }
);

// Unfavorite an article
router.delete(
  "/:slug/favorite",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const slug = req.params.slug;
    try {
      const article = await Article.findOne({ slug });
      if (!article) {
        return res.status(401).json({ msg: "No such article exists." });
      }
      const user = req.user;
      const removeFromFav = await user.unFavorite(article._id);
      const articleJSON = await article.articleJSON(req.user);
      res.json(articleJSON);
    } catch (err) {
      next(err);
    }
  }
);

// Delete Comments
router.delete(
  "/:slug/comments/:id",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const slug = req.params.slug;
    const commentId = req.params.id;
    try {
      const article = await Article.findOne({ slug });
      if (article) {
        const comment = await Comment.findById(commentId);
        //Check if comment exists.
        if (comment) {
          if (req.user._id.toString() === comment.author.toString()) {
            const deleteComment = await Comment.findByIdAndDelete(commentId);
            const deleteFromArticle = await Article.findByIdAndUpdate(
              article._id,
              { $pull: { comments: commentId } }
            );
            res.json({ msg: "Successfully deleted the comment" });
          } else {
            return res.status(401).json({ msg: "Unauthorised access" });
          }
        } else {
          res.status(401).json({ msg: "No such comment exists." });
        }
      } else {
        res.status(401).json({ msg: "No such article exists" });
      }
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
