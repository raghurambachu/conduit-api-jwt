const mongoose = require("mongoose");

mongoose.connect(
  "mongodb://localhost:27017/conduit-api-jwt",
  {
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useNewUrlParser: true,
  },
  (err) => console.log("Connected ", err ? err : true)
);
