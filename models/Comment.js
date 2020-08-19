const { Schema, model } = require("mongoose");

const commentSchema = new Schema(
  {
    body: {
      type: String,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    article: {
      type: Schema.Types.ObjectId,
      ref: "Article",
    },
  },
  { timestamps: true }
);

commentSchema.methods.commentJSON = function (author) {
  const comment = this;
  return {
    comment: {
      id: comment._id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      body: comment.body,
      author: author.profileJSON(author),
    },
  };
};

module.exports = model("Comment", commentSchema);
