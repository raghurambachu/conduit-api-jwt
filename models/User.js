const { Schema, model } = require("mongoose");
const { issueJwt } = require("../utils/utils");

const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      default: "It's a bio",
    },
    image: {
      type: String,
      default: null,
    },
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: "Article",
      },
    ],
    hash: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

//Doubt how to write a pre-save hook when we have hash and salt field rather
//than just password field

userSchema.methods.userJSON = async function () {
  const user = this;
  const { token, expires } = await issueJwt(user);
  return {
    user: {
      username: user.username,
      email: user.email,
      token,
      image: user.image,
      bio: user.bio,
    },
  };
};

userSchema.methods.isFollowing = function (id) {
  return this.following.some(
    (followerId) => followerId.toString() === id.toString()
  );
};

userSchema.methods.profileJSON = function (user) {
  //The parameter user represents the person who is viewing the profile of the user with the route having username
  //this represents the user queried based on username by the current logged in user.
  return {
    profile: {
      username: this.username,
      bio: this.bio,
      image: this.image,
      following: user ? this.isFollowing(user._id) : false,
    },
  };
};

userSchema.methods.follow = function (id) {
  //here id represents the id of the username to whom the loggedin user wants to follow;
  //this represents the current logged in  user.
  if (!this.following.includes(id)) this.following.push(id);
  this.save();
};

userSchema.methods.unFollow = async function (id) {
  if (this.following.indexOf(id) !== -1)
    this.following = this.following.filter(
      (followId) => followId.toString() !== id.toString()
    );
  await this.save();
};

userSchema.methods.favorite = async function (articleId) {
  if (!this.favorites.includes(articleId)) this.favorites.push(articleId);
  await this.save();
};

userSchema.methods.unFavorite = async function (articleId) {
  if (this.favorites.indexOf(articleId) !== -1) {
    this.favorites = this.favorites.filter(
      (artId) => artId.toString() !== articleId.toString()
    );
  }
  await this.save();
};

userSchema.methods.isFavorite = function (articleId) {
  return this.favorites.some(
    (favId) => favId.toString() === articleId.toString()
  );
};

module.exports = model("User", userSchema);
