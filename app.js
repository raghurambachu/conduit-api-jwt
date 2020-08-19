var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const passport = require("passport");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const profilesRouter = require("./routes/profiles");
const articlesRouter = require("./routes/articles");
const tagsRouter = require("./routes/tags");

require("./config/database");
require("dotenv").config();

var app = express();

require("./middlewares/passport")(passport);
app.use(passport.initialize());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", indexRouter);
app.use("/api/users", usersRouter);
app.use("/api/profiles", profilesRouter);
app.use("/api/articles", articlesRouter);
app.use("/api/tags", tagsRouter);
// app.use("/api/articles", articleRouter);

module.exports = app;
