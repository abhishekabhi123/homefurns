const { MongoClient } = require("mongodb");
require('dotenv').config()

const state = {
  db: null,
};
module.exports.connect = (done) => {
  const url = process.env.MONGODB_CONNECT;
  console.log("this is vishnu",url);
  const dbName = "Home";

  MongoClient.connect(url, (err, data) => {
    if (err) done(err);
    state.db = data.db(dbName);
    done();
  });
};

module.exports.get = () => {
    return state.db
}