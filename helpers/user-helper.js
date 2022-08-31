const {
  USER_COLLECTION,
  PRODUCT_COLLECTION,
  CART_COLLECTION,
  ORDER_COLLECTION,
} = require('../config/collections');
const {
  get
} = require('../config/connection');
const bcrypt = require('bcrypt');
const twilio = require('twilio');
const {
  ObjectId
} = require('mongodb');
require('dotenv').config();
const client = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
let otp = 0;
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      const {
        username,
        email,
        password,
        phone
      } = userData;
      bcrypt.hash(password, 10).then((pass) => {
        delete userData.confirmPassword;
        get()
          .collection(USER_COLLECTION)
          .insertOne({
            username: username,
            email: email,
            password: pass,
            phone: phone,
            isAllowed: true,
            cart: [],
          })
          .then((data) => {
            resolve(data.insertedId);
          });
      });
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      console.log(userData);
      let loginStatus = false;
      let response = {};
      let user = await get()
        .collection(USER_COLLECTION)
        .findOne({
          email: userData.email
        });
      if (user) {
        if (user.isAllowed) {
          bcrypt.compare(userData.password, user.password).then((status) => {
            if (status) {
              console.log('Login Success');
              response.user = user;
              response.status = true;
              resolve(response);
            } else {
              console.log('Login Failed1');
              resolve({
                status: false
              });
            }
          });
        } else {
          resolve({
            status: 'block'
          });
        }
      } else {
        console.log('Login Failed2');
        resolve({
          status: false
        });
      }
    });
  },
  getOtp: (data) => {
    otp = generateOTP();
    return new Promise((resolve, reject) => {
      console.log('otpSignup');
      client.messages
        .create({
          body: `This is login otp from Home.com. your otp for login is : ${otp}`,
          to: `+91${data.phone}`,
          from: process.env.TWILIO_NUMBER,
        })
        .then((message) => {
          console.log(message.sid);
          resolve(true);
        })
        .catch((error) => {
          console.log(error);
        });
    });
  },
  verifyOtp: (body) => {
    return new Promise((resolve, reject) => {
      console.log(body.otp);
      if (otp == body.otp) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  },
  loginOtp: (phone) => {
    return new Promise((resolve, reject) => {
      // const {phone} = data;
      console.log(phone);
      get()
        .collection(USER_COLLECTION)
        .findOne({
          phone: phone
        })
        .then((user) => {
          if (user) {
            console.log('user exits');
            resolve(user);
          } else {
            console.log('new user');
            resolve(false);
          }
        });
    });
  },
  getAllProducts: () => {
    return new Promise((resolve, reject) => {
      get()
        .collection(PRODUCT_COLLECTION)
        .find()
        .toArray()
        .then((product) => {
          // console.log(product);
          resolve(product);
        });
    });
  },
  getSuggestions: (limit) => {
    limit = parseInt(limit)
    return new Promise((resolve, reject) => {
      get()
        .collection(PRODUCT_COLLECTION)
        .find().limit(limit)
        .toArray()
        .then((product) => {
          // console.log(product);
          resolve(product);
        });
    });
  },
  getProduct: (id) => {
    return new Promise((resolve, reject) => {
      get()
        .collection(PRODUCT_COLLECTION)
        .findOne({
          _id: ObjectId(id)
        })
        .then((product) => {
          resolve(product);
        });
    });
  },
  addToCart: (userId, productId) => {
    console.log('userId', userId._id, 'productId', productId);
    console.log('userId', typeof userId, 'productId', typeof productId);
    return new Promise((resolve, reject) => {
      try {
        productObj = {
          productId: ObjectId(productId),
          quantity: 1,
        };

        get()
          .collection(CART_COLLECTION)
          .findOne({
            userId: ObjectId(userId._id)
          })
          .then((cart) => {
            console.log(cart);
            if (cart) {
              let state = false;
              let data = cart.cartItems.forEach((product) => {
                console.log(product.productId.toString(), "      ", productId)
                if (product.productId.toString() == ObjectId(productId)) {
                  return state = true
                }
              });
              console.log(data);
              if (state == true) {

                get()
                  .collection(CART_COLLECTION)
                  .updateOne({
                    userId: ObjectId(userId._id),
                    'cartItems.productId': ObjectId(productId)
                  }, {
                    $inc: {
                      'cartItems.$.quantity': 1
                    },
                  })
                  .then((status) => {

                    resolve(status);
                  });
              } else {
                get()
                  .collection(CART_COLLECTION)
                  .updateOne({
                    userId: ObjectId(userId._id)
                  }, {
                    $push: {
                      cartItems: productObj
                    }
                  }, {
                    upsert: true
                  })
                  .then((status) => {
                    resolve(status);
                  });
              }
            } else {
              get()
                .collection(CART_COLLECTION)
                .updateOne({
                  userId: ObjectId(userId._id)
                }, {
                  $push: {
                    cartItems: productObj
                  }
                }, {
                  upsert: true
                })
                .then((status) => {
                  resolve(status);
                });
            }
          });
      } catch (error) {
        console.error(error);
      }
    });
  },
  getCart: (userId) => {
    console.log(userId);
    return new Promise((resolve, reject) => {
      try {
        get()
          .collection(CART_COLLECTION)
          .aggregate([{
              $match: {
                userId: ObjectId(userId)
              }
            },
            {
              $unwind: '$cartItems',
            },
            {
              $lookup: {
                from: 'products',
                localField: 'cartItems.productId',
                foreignField: '_id',
                as: 'cart',
              },
            },
            {
              $unwind: '$cart'
            },
            // {
            //   $unset: ["userId"]
            // }
            // { $project: { cart: 1 } },
          ])
          .toArray()
          .then((data) => {
            console.log(data);
            resolve(data);
          });
      } catch (error) {
        console.error(error);
      }
    });
  },
  changeCartQuantity: (cartId, productId, count) => {
    console.log(cartId, productId, count);
    count = Number(count);
    return new Promise((resolve, reject) => {
      get()
        .collection(CART_COLLECTION)
        .updateOne({
          _id: ObjectId(cartId),
          'cartItems.productId': ObjectId(productId)
        }, {
          $inc: {
            'cartItems.$.quantity': count
          },
        })
        .then((status) => {

          resolve(status);
        });
    })
  },
  removeFromCart: (cartId, productId) => {
    return new Promise((resolve, reject) => {
      get()
        .collection(CART_COLLECTION)
        .updateOne({
          _id: ObjectId(cartId),
          'cartItems.productId': ObjectId(productId)
        }, {
          $pull: {
            'cartItems': {'productId':ObjectId(productId)  }
          }
        })
        .then((status) => { 
          console.log(status)
          resolve(status);
        });
    })
  },
  getTotalAmount: (userId) => {
    console.log(userId);
    return new Promise((resolve, reject) => {
      try {
        get()
          .collection(CART_COLLECTION) 
          .aggregate([{
              $match: {
                userId: ObjectId(userId)
              }
            },
            {
              $unwind: '$cartItems',
            },
            {
              $lookup: {
                from: 'products',
                localField: 'cartItems.productId',
                foreignField: '_id',
                as: 'cart',
              },
            },
            {
              $unwind: '$cart'
            },
            {
              $unset: ["userId"]
            },
            {
              $group:{_id: null,
                total: {$sum:{$multiply:['$cartItems.quantity', {$toInt :'$cart.price'}]}}}
            },{
              $unset: ["_id"]
            }
            // { $project: { cart: 1 } },
          ])
          .toArray()
          .then((data) => {
            console.log(data[0]);
            let val = data[0]?data[0].total:'0';
            resolve(val);
          });
      } catch (error) {
        console.error(error);
      }
    });

},
getCartProdutDetails: (userId) => {
  return new Promise((resolve, reject) => {
    get().collection(CART_COLLECTION).findOne({userId : ObjectId(userId)}).then((cart) => {
      resolve(cart.cartItems)
    })
  })
},
placeOrder: (order, products, total) => {
  return new Promise((resolve, reject) => {
    console.log(order, products, total)
    let status = order.paymentMethod === 'cod' ? 'placed' : 'pending'
    let orderObj = {
      deliveryDetails:{
        name: order.name,
        phone: order.phone,
        address: order.address,
      },
      userId: ObjectId(order.userId),
      paymentMethod: order.paymentMethod,
      products: products,
      totalAmount: total,
      status: status,
      date: new Date()
    }
    get().collection(ORDER_COLLECTION).insertOne(orderObj).then((cart) => {
      get().collection(CART_COLLECTION).deleteOne({userId: ObjectId(order.userId)}).then(() => {

        resolve()
      })
    })
  })
}
}

function generateOTP() {
  var digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}