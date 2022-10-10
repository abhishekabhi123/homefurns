const {
  ObjectId, Db
} = require('mongodb');
const {
  PRODUCT_COLLECTION,
  ADMIN_COLLECTION,
  USER_COLLECTION,
  CATEGORY_COLLECTION,
  ORDER_COLLECTION,
  COUPON_COLLECTION,
  ORDER_ADDRESS_COLLECTION,
} = require('../config/collections');
const {
  get
} = require('../config/connection');
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
    data.categories = ObjectId(data.categories);
    console.log(data);
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
        .deleteOne({
          _id: ObjectId(id)
        })
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
        .findOne({
          _id: ObjectId(id)
        })
        .then((data) => {
          console.log(data);
          resolve(data);
        });
    });
  },
  updateProductDetails: (proId, proDetails, price) => {
    const {
      name,
      pd_price,
      description,
      categories,
      discount = 0,
      mrp
    } = proDetails;
    return new Promise(async (resolve, reject) => {
      price ? price : pd_price
      get()
        .collection(PRODUCT_COLLECTION)
        .updateOne({
          _id: ObjectId(proId)
        }, {
          $set: {
            name: name,
            description: description,
            pd_price: Number(pd_price),
            price: Number(price),
            categories: categories,
            discount: Number(discount),
            mrp: Number(mrp),
          },
        }).then((data) => {
          resolve(data.insertedId);
        })
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
        .deleteOne({
          _id: ObjectId(id)
        })
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
        .findOne({
          _id: ObjectId(id)
        })
        .then((data) => {
          resolve(data);
        });
    });
  },
  addUser: (userData) => {
    return new Promise(async (resolve, reject) => {
      const {
        username,
        email,
        password
      } = userData;
      bcrypt.hash(userData.password, 10).then((result) => {
        userData.password = result;
        // delete userData.confirmPassword;
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
      const {
        username,
        password,
        email
      } = data;
      get()
        .collection(USER_COLLECTION)
        .findOne({
          _id: {
            $ne: ObjectId(id)
          },
          email: email
        })
        .then((user) => {
          if (user) {
            resolve(user);
          } else {
            bcrypt.hash(password, 10).then((pass) => {
              get()
                .collection(USER_COLLECTION)
                .updateOne({
                  _id: ObjectId(id)
                }, {
                  $set: {
                    username: username,
                    password: pass,
                    email: email,
                  },
                })
                .then((result) => {
                  resolve({
                    status: true
                  });
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
        .findOne({
          _id: ObjectId(id)
        })
        .then((user) => {
          if (user.isAllowed === true) {
            console.log('Blocking user');
            get()
              .collection(USER_COLLECTION)
              .updateOne({
                _id: ObjectId(id)
              }, {
                $set: {
                  isAllowed: false
                }
              });
            resolve(true);
          } else {
            console.log('Unblocking user');
            get()
              .collection(USER_COLLECTION)
              .updateOne({
                _id: ObjectId(id)
              }, {
                $set: {
                  isAllowed: true
                }
              });
            resolve(true);
          }
        });
    });
  },
  getAllCategories: () => {
    return new Promise((resolve, reject) => {
      get()
        .collection(CATEGORY_COLLECTION)
        .find()
        .toArray()
        .then((categories) => {
          resolve(categories);
        });
    });
  },
  getCategory: (id) => {
    return new Promise((resolve, reject) => {
      get().collection(CATEGORY_COLLECTION).findOne({
        _id: ObjectId(id)
      }).then((category) => {
        resolve(category);
      })
    })
  },
  addCategory: (data) => {
    return new Promise((resolve, reject) => {
      get()
        .collection(CATEGORY_COLLECTION)
        .insertOne(data)
        .then((status) => {
          resolve(status);
        });
    });
  },
  editCategory: (data, body) => {
    return new Promise((resolve, reject) => {
      const {
        name,
        description,
        discount
      } = body;
      get()
        .collection(CATEGORY_COLLECTION)
        .updateOne({
          _id: ObjectId(data)
        }, {
          $set: {
            name: name,
            description: description,
            discount: Number(discount),
          }
        })
        .then((status) => {
          resolve(true);
        });
    });
  },
  deleteCategory: (data) => {
    return new Promise((resolve, reject) => {
      console.log(data);
      get()
        .collection(CATEGORY_COLLECTION)
        .deleteOne({
          _id: ObjectId(data)
        })
        .then((status) => {
          if (status) resolve(true);
        });
    });
  },
  // getOrders: () => {
  //   return new Promise(async(resolve, reject) => {
  //    await get()
  //       .collection(ORDER_COLLECTION)
  //       .aggregate([{
  //           $lookup: {
  //             from: USER_COLLECTION,
  //             localField: "userId",
  //             foreignField: "_id",
  //             as: "user"
  //           }
  //         },
  //         {
  //           $unwind: "$user"
  //         }
  //       ]).toArray()
  //       .then((data) => {
          
  //         resolve(data);
  //       });
  //   })

      getOrders:()=>{
        return new Promise(async(resolve, reject) => {
          let orders=await get().collection(ORDER_COLLECTION).find({}).sort({date:-1}).toArray();
          resolve(orders);
      })
  },
  getOrderDetails: (orderId) => {
  return new Promise((resolve, reject) => {
    console.log(orderId);
    get().collection(ORDER_COLLECTION)
      .aggregate([{
          $match: {
            _id: ObjectId(orderId),
          },
        },
        {
          $lookup: {
            from: ORDER_ADDRESS_COLLECTION,
            localField: "deliveryDetails",
            foreignField: "_id",
            as: "address",
          },
        },
        {
          $lookup: {
            from: PRODUCT_COLLECTION,
            localField: "products.productId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $lookup: {
            from: USER_COLLECTION,
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $set: {
            date: {
              $dateToString: {
                format: "%d/%m/%Y -- %H:%M",
                date: "$date",
                timezone: "+05:30"
              },
            },
          },
        },
        // { 
        //   $sort: { } 
        // } 
      ]).toArray()
      .then((data) => {
        console.log('///hiiiiiiiiiiii')
         console.log(data[0]) 
        resolve(data[0]);
      });
  });
},
  updateOrderStatus: (orderId, productId, status) => {
    return new Promise((resolve, reject) => {
      console.log('updateproduct')
      get().collection(ORDER_COLLECTION).updateOne({
        _id: ObjectId(orderId),
        'products.productId': ObjectId(productId)
      }, {
        $set: {
          'products.$.status': status
        }
      }).then((data) => {
        console.log(data)
        resolve()
      })
    })
  },
  getCount: () => {
    return new Promise((resolve, reject) => {
      get()
        .collection(USER_COLLECTION)
        .find()
        .count()
        .then((users) => {
          resolve(users);
        });
    });
  },
  getOrderCount: () => {
    return new Promise((resolve, reject) => {
      get().collection(ORDER_COLLECTION).find().count().then((users) => {
        resolve(users);
      })
    });
  },


  getTotalAmountOrders: () => {
    return new Promise(async (resolve, reject) => {
      let total = await get().collection(ORDER_COLLECTION).aggregate([
       
        {
          $project: {
            _id: 0,
            total: '$totalAmount'
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$total'
            }
          }
        }
      ]).toArray()
      resolve(total[0].total);

    })
  },
  getStatsWeek: (timestamp) => {
    return new Promise((resolve, reject) => {

      console.log(timestamp);
      timestamp = "$" + timestamp;
      get().collection(ORDER_COLLECTION).aggregate([{
          $sort: {
            date: 1
          }
        },
        {
          $group: {
            _id: {
              $add: [{
                  $week: "$date"
                },
                {
                  $multiply: [400, {
                    $year: "$date"
                  }]
                }
              ]
            },
            totalAmount: {
              $sum: "$totalAmount"
            },
            date: {
              $min: "$date"
            }
          }
        },
        {
          $sort: {
            date: 1
          }
        },
        {
          $limit: 14,
        }
      ]).toArray().then((data) => {
        console.log("this", data);
        let date = []
        let totalAmount = []
        data.forEach((item) => {
          date.push(item.date.toDateString())
          totalAmount.push(item.totalAmount)
        })
        data = {
          date: date,
          totalAmount: totalAmount
        }
        console.log(data)
        resolve(data);
      })
    })
  },
  getStatsDaily: (timestamp) => {
    return new Promise((resolve, reject) => {

      console.log(timestamp);
      timestamp = "$" + timestamp;
      get().collection(ORDER_COLLECTION).aggregate([{
          $sort: {
            date: 1
          }
        },
        {
          $group: {
            _id: {
              $add: [{
                  $dayOfYear: "$date"
                },
                {
                  $multiply: [400, {
                    $year: "$date"
                  }]
                }
              ]
            },
            totalAmount: {
              $sum: "$totalAmount"
            },
            date: {
              $min: "$date"
            }
          }
        },
        {
          $sort: {
            date: 1
          }
        },
        {
          $limit: 14,
        }
      ]).toArray().then((data) => {
        console.log("this", data);
        let date = []
        let totalAmount = []
        data.forEach((item) => {
          date.push(item.date.toDateString())
          totalAmount.push(item.totalAmount)
        })
        data = {
          date: date,
          totalAmount: totalAmount
        }
        // console.log(data)
        resolve(data);
      })
    })
  },
  getAllCategoryProducts: (categoryId) => {
    return new Promise((resolve, reject) => { 
      get().collection(PRODUCT_COLLECTION).find({categories : ObjectId(categoryId)}).toArray().then((category) => {
        resolve(category)
      })
    })
  },
  editCategoryDiscount: (productId, price , discount) => {
    return new Promise((resolve, reject) => {
      get().collection(PRODUCT_COLLECTION).updateMany({ 
        _id: ObjectId(productId)
      },{$set: {
        price: price,
        discount: discount,
      }})
    })
  },
  addCoupon: (body) => {
    return new Promise((resolve, reject) => {
      get().collection(COUPON_COLLECTION).insertOne(body).then(() => {
        resolve()
      })
    })
  },
  getAllCoupon: () => {
    return new Promise((resolve, reject) => {
      get().collection(COUPON_COLLECTION).find().toArray().then((coupon) => {
        resolve(coupon)
      })
    })
  },
    changeOrderStatus: (details) => {
      console.log("orderrr",details.order)
        return new Promise((resolve, reject) => {
            get().collection(ORDER_COLLECTION).updateOne({ _id: ObjectId(details.order) }, {
                $set: {
                    paymentStatus: details.status
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },


};