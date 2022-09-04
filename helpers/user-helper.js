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
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

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
      
      client.verify.v2.services(process.env.TWILIO_SERVICE_ID)
        .verifications
        .create({
          to: `+91${data.phone}`,
          channel: 'sms'
        })
        .then(verification => {
          console.log(verification.status);
          resolve(true);
        });
    });
  },
  verifyOtp: (body, phone) => {
    return new Promise((resolve, reject) => {
      client.verify.v2.services(process.env.TWILIO_SERVICE_ID)
        .verificationChecks
        .create({
          to: `+91${phone}`,
          code: body.otp
        })
        .then(verification_check => {
          console.log(verification_check.status)
          if(verification_check.status === "approved"){
            resolve(true)
          } else {
            resolve( false)
          }
        });
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
            'cartItems': {
              'productId': ObjectId(productId)
            }
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
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $multiply: ['$cartItems.quantity', {
                      $toInt: '$cart.price'
                    }]
                  }
                }
              }
            }, {
              $unset: ["_id"]
            }
            // { $project: { cart: 1 } },
          ])
          .toArray()
          .then((data) => {
            console.log(data[0]);
            let val = data[0] ? data[0].total : '0';
            resolve(val);
          });
      } catch (error) {
        console.error(error);
      }
    });

  },
  getCartProdutDetails: (userId) => {
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
              $match: {
                cartItems: {
                  $exists: true
                }
              }
            },
            {
              $set: {
                total: {
                  $multiply: ['$cartItems.quantity', {
                    $toInt: '$cart.price'
                  }]
                }
              }
            },
            {
              $project: {
                cartItems: 1,
                total: 1
              }
            },
          ])
          .toArray()
          .then((data) => {
            console.log('total is : ', data);
            data.map(item => {
              item.cartItems.total = item.total
              item.cartItems.status = 'Order Placed'
            })
            let products = [];
            data.forEach(item => {
              products.push(item.cartItems)
            })
            console.log('modified data is : ', data);
            resolve(products);
          });
      } catch (error) {
        console.error(error);
      }
    });

  },
  // getCartProdutDetails: (userId) => {
  //   return new Promise((resolve, reject) => {
  //     get().collection(CART_COLLECTION).findOne({userId : ObjectId(userId)}).then((cart) => {
  //       resolve(cart.cartItems)
  //     })
  //   })
  // },
  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      console.log(order, products, total)
      let status = order.paymentMethod === 'cod' ? 'placed' : 'pending'
      let orderObj = {
        deliveryDetails: {
          name: order.name,
          phone: order.phone,
          address: order.address,
        },
        userId: ObjectId(order.userId),
        paymentMethod: order.paymentMethod,
        products: products,
        totalAmount: total,
        paymentStatus: status,
        date: new Date(),
      }
      get().collection(ORDER_COLLECTION).insertOne(orderObj).then((cart) => {
        get().collection(CART_COLLECTION).deleteOne({
          userId: ObjectId(order.userId)
        }).then(() => {

          resolve()
        })
      })
    })
  },
  getOrders: (userId) => {
    return new Promise((resolve, reject) => {
      get()
        .collection(ORDER_COLLECTION)
        .aggregate([

          {
            $match: {
              userId: ObjectId(userId)
            }
          },
          // {$unwind: "$products"},
          // {
          //   $lookup: {
          //     from: PRODUCT_COLLECTION,
          //     localField: "products.productId",
          //     foreignField: "_id",
          //     as: "productDetails"
          //   }
          // },
          // {
          //   $unwind: "$productDetails"
          // },
          // {$project: {productDetails: 1, paymentMethod: 1,  status: 1, products: 1, date: 1}},
        ]).toArray()
        .then((data) => {
          // console.log(data);
          resolve(data);
        });
    })
  },
  getOrderDetails: (orderId) => {
    return new Promise((resolve, reject) => {
      console.log(orderId)
      get().collection(ORDER_COLLECTION).aggregate([{
            $match: {
              _id: ObjectId(orderId)
            }
          },
          {
            $unwind: "$products"
          },
          {
            $lookup: {
              from: PRODUCT_COLLECTION,
              localField: "products.productId",
              foreignField: "_id",
              as: "productDetails"
            }
          },
          {
            $unwind: "$productDetails"
          }
        ]).toArray()
        .then((data) => {
          resolve(data);
        })
    })
  },
  cancelOrders: (orderId, productId) => {
    return new Promise((resolve, reject) => {
      console.log(orderId, productId)
      get().collection(ORDER_COLLECTION).updateOne({
        _id: ObjectId(orderId),
        'products.productId': ObjectId(productId)
      }, {
        $set: {
          'products.$.status': 'cancelled'
        }
      }).then((data) => {
        console.log(data)
        resolve()
      })
    })
  },getCategory: (categoryId) => {
    return new Promise((resolve, reject) => {
      get()
        .collection(PRODUCT_COLLECTION)
        .find({categories: ObjectId(categoryId)})
        .toArray()
        .then((product) => {
          console.log(product);
          resolve(product);
        });
    });
  },


}
