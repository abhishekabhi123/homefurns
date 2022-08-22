const { MongoClient } = require("mongodb");

const state = {
  db: null,
};
module.exports.connect = (done) => {
  const url = "mongodb://localhost:27017";
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