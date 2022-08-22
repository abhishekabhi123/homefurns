const { ObjectId } = require('mongodb');
const {
  PRODUCT_COLLECTION,
  ADMIN_COLLECTION,
  USER_COLLECTION,
} = require('../config/collections');
const { get } = require('../config/connection');
const bcrypt = require('bcrypt');

module.exports = {
  doLogin: (loginCredentials) => {
    return new Promise((resolve, reject) => {
      get()
        .collection(ADMIN_COLLECTION)
        .findOne(loginCredentials)
        .then((state) => {
          resolve(state);
        });
    });
  },
  addProduct: (data) => {
    // const {name} = data;
    return new Promise((resolve, reject) => {
      get()
        .collection(PRODUCT_COLLECTION)
        .insertOne(data)
        .then((data) => {
          resolve(data.insertedId);
        });
    });
  },
  getAllProducts: () => {
    return new Promise((resolve, reject) => {
      get()
        .collection(PRODUCT_COLLECTION)
        .find()
        .toArray()
        .then((products) => {
          // console.log(products);
          resolve(products);
        });
    });
  },
  deleteProduct: (id) => {
    return new Promise((resolve, reject) => {
      get()
        .collection(PRODUCT_COLLECTION)
        .deleteOne({ _id: ObjectId(id) })
        .then((data) => {
          console.log('success');
          resolve(data);
        });
    });
  },
  getProductDetails: (id) => {
    return new Promise((resolve, reject) => {
      get()
        .collection(PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(id) })
        .then((data) => {
          console.log(data);
          resolve(data);
        });
    });
  },
  updateProductDetails: (proId, proDetails) => {
    const { name, price, description } = proDetails;
    return new Promise(async (resolve, reject) => {
      get()
        .collection(PRODUCT_COLLECTION)
        .updateOne(
          { _id: ObjectId(proId) },
          {
            $set: {
              name: name,
              description: description,
              price: price,
            },
          }
        );
    });
  },
  getAllUsers: () => {
    return new Promise((resolve, reject) => {
      get()
        .collection(USER_COLLECTION)
        .find()
        .toArray()
        .then((users) => {
          resolve(users);
        });
    });
  },
  deleteUser: (id) => {
    return new Promise(async (resolve, reject) => {
      get()
        .collection(USER_COLLECTION)
        .deleteOne({ _id: ObjectId(id) })
        .then((data) => {
          console.log('success');
          resolve(data);
        });
    });
  },
  getUserDetails: (id) => {
    return new Promise(async (resolve, reject) => {
      get()
        .collection(USER_COLLECTION)
        .findOne({ _id: ObjectId(id) })
        .then((data) => {
          resolve(data);
        });
    });
  },
  addUser: (userData) => {
    return new Promise(async (resolve, reject) => {
      const { username, email, password } = userData;
      bcrypt.hash(userData.password, 10).then((result) => {
        userData.password = result;
        delete userData.confirmPassword;
        get()
          .collection(USER_COLLECTION)
          .insertOne({
            username: username,
            email: email,
            password: password,
            isAllowed: true,
          })
          .then((data) => {
            resolve(data.insertedId);
          });
      });
    });
  },
  updateUser: (id, data) => {
    return new Promise((resolve, reject) => {
      const { username, password, email } = data;
      get()
        .collection(USER_COLLECTION)
        .findOne({ _id: { $ne: ObjectId(id) }, email: email })
        .then((user) => {
          if (user) {
            resolve(user);
          } else {
            bcrypt.hash(password, 10).then((pass) => {
              get()
                .collection(USER_COLLECTION)
                .updateOne(
                  { _id: ObjectId(id) },
                  {
                    $set: {
                      username: username,
                      password: password,
                      email: email,
                    },
                  }
                )
                .then((result) => {
                  resolve({ status: true });
                });
            });
          }
        });
    });
  },
  blockUser: (id) => {
    return new Promise((resolve, reject) => {
      get()
        .collection(USER_COLLECTION)
        .findOne({ _id: ObjectId(id) })
        .then((user) => {
          if (user.isAllowed === true) {
            console.log('Blocking user');
            get()
              .collection(USER_COLLECTION)
              .updateOne({ _id: ObjectId(id) }, { $set: { isAllowed: false } });
              resolve(true);
          } else {
            console.log('Unblocking user');
            get()
              .collection(USER_COLLECTION)
              .updateOne({ _id: ObjectId(id) }, { $set: { isAllowed: true } });
              resolve(true);
          }
        });
    });
  },
};
