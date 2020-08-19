const { Schema, model } = require("mongoose");
const User = require("./User");
const slugify = require("slugify");

const articleSchema = new Schema(
  {
    slug: {
      type: String,
      lowercase: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    tagList: [String],
    favoritesCount: {
      type: Number,
      default: 0,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  { timestamps: true }
);

articleSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true });
  }
  next();
});

articleSchema.methods.countFavorites = async function (articleId) {
  try {
    const count = await User.countDocuments({
      favorites: { $in: [articleId] },
    });
    return count;
  } catch (err) {
    console.error(err);
  }
};

articleSchema.methods.articleJSON = async function (user) {
  const article = this;
  const authorDet = await User.findById(article.author);
  return {
    article: {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tagList,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: user ? user.isFavorite(this._id) : false,
      favoritesCount: await this.countFavorites(this._id),
      author: authorDet.profileJSON(user),
    },
  };
};

module.exports = model("Article", articleSchema);
