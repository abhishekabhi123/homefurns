const {
  response
} = require('express');
var express = require('express');
var paypal = require('../public/javascripts/paypal')

const {
  getAllCategories
} = require('../helpers/admin-helper');
const userHelper = require('../helpers/user-helper');
const {
  doLogin,
  doSignup,
  getOtp,
  verifyOtp,
  loginOtp,
  getAllProducts,
  getProduct,
  addToCart,
  getCart,
  changeCartQuantity,
  removeFromCart,
  getTotalAmount,
  getCartProdutDetails,
  placeOrder,
  getSuggestions,
  getOrders,
  getAmount,
  getOrderDetails,
  cancelOrders,
  getCategory,
  addAddress,
  getAddress,
  getAddressById,
  addCheckoutAddress,
  updateprofile,
  getUserDetails,
  validateCoupon,
  addCoupon,
  getDeleteAddress,
  editAddress,
  addToWishlist,
  getAllOrders,
} = require('../helpers/user-helper');
const { payment } = require('paypal-rest-sdk');
var router = express.Router();

const most = [{
    name: 'Chair',
    price: '$250',
    image: '/images/chair.svg',
  },
  {
    name: 'Chair',
    price: '$250',
    image: '/images/chair.svg',
  },
  {
    name: 'Chair',
    price: '$250',
    image: '/images/chair.svg',
  },
  {
    name: 'Chair',
    price: '$250',
    image: '/images/chair.svg',
  },
];


router.get('/get-otp', (req, res) => {
  res.render('user/otp-get');
});


router.post('/get-otp', (req, res) => {
  getOtp(req.body).then((response) => {
    console.log(response);
    if (response) {
      req.session.phone = req.body.phone;
      console.log(req.session.phone);
      res.render('user/otp-verify');
    }
  });
});

router.post('/verify-otp', (req, res) => {
  let phone = req.session.phone
  verifyOtp(req.body, phone).then((response) => {
    if (response) {
      loginOtp(req.session.phone).then((response) => {
        console.log(response);
        req.session.loggedIn = true;
        req.session.user = response;
        res.redirect('/');
      });
    } else {
      res.redirect('/get-otp');
    }
  });
});

router.post('/login', (req, res) => {
  console.log(req.body);
  doLogin(req.body).then((response) => {
    if (response.status == 'block') {
      console.log('blocked');
      res.render('user/blocked');
    } else if (response.status == true) {
      console.log(response);
      req.session.loggedIn = true;
      req.session.user = response.user;
      res.redirect('/');
    } else {
      console.log(response);
      console.log('error ');
      req.session.loginErr = true;
      res.redirect('/login');
    }
  });
});

// router.get("/signup", (req, res) => {
//   res.render("user/signup");
// });

router.post('/signup', (req, res) => {
  console.log(req.body);
  doSignup(req.body).then((response) => {
    console.log(response);

    req.session.loggedIn = true;
    req.session.user = req.body;
    res.status(200);
    res.redirect('/');
  });
});


/* GET home page. */
router.get('/', function (req, res, next) {
  user = req.session.user;
  console.log(user);
  getAllProducts().then((products) => {
    if (req.session.loggedIn) {
      res.render('user/index', {
        products,
        most,
        user
      });
    } else {
      console.log('login ', req.session.loginErr);
      res.render('user/index', {
        products,
        most,
        loginErr: req.session.loginErr,
      });
      req.session.loginErr = false;
    }
  });
});

// router.get("/login", (req, res) => {
//   if (req.session.loggedIn) {
//     res.redirect("/");
//   } else {
//     res.set('Cache-Control', 'no-store')
//     res.render("user/login",{error : req.session.loginErr});
//     req.session.loginErr = null;
//   }
// });

router.get('/shop', (req, res) => {
  getAllProducts().then((products) => {
    getAllCategories().then((categories) => {
      res.render('user/shop', {
        products,
        categories,
        user: req.session.user
      });
    })
  });
});

router.get('/product/:id', (req, res) => {
  getProduct(req.params.id).then((product) => {
    getSuggestions(4).then((suggestions) => {

      console.log(suggestions);
      res.render('user/product-details', {
        product,
        user: req.session.user,
        suggestions: suggestions
      });
    })
  });
});

router.get('/login', (req, res) => {

  res.render('user/login', {
    loginErr: req.session.loginErr
  });

});

router.get('/asdf', (req, res) => {
  res.render('user/signup');
});

function verifyLogin(req, res, next) {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
}

router.get('/addToCart/:id', verifyLogin, (req, res) => {
  addToCart(req.session.user, req.params.id).then(() => {  
    // console.log("added to cart");
    res.status(200).json(true);
    // res.redirect('/shop')
  })
})


router.post('/addToWishlist', verifyLogin, (req, res) => {
  console.log("haaaaaaaaaaaaaaaa",req.body.id)
  addToWishlist(req.session.user._id, req.body.id).then((response) => {  
    // console.log("added to cart");
    
    res.status(200).json(response);
    // res.redirect('/shop')
  })
})



router.get('/cart', verifyLogin, (req, res) => {
  try{
  getCart(req.session.user._id).then((data) => {
    getTotalAmount(req.session.user._id).then((total) => {  

      // console.log(total);
      // console.log(data[0].cartItems)
      res.render('user/cart', {
        data: data,
        total: total,
        user: req.session.user
      });
    }).catch((err) => {
      console.log(err);
    });
  }).catch((err) => {
      console.log(err);
    });
}
catch(err) {
  console.log(err)
}
})
router.post('/changeQuantity', verifyLogin, (req, res) => {
  const {
    cart,
    product,
    user,
    count
  } = req.body;
  changeCartQuantity(cart, product, count).then((data) => {
    getTotalAmount(user).then((total) => {
      data.total = total
      // console.log(data);
      res.status(200).json(data)
    })
  })
})

router.post('/removeFromCart', (req, res) => {
  const {
    cart,
    product
  } = req.body;
  removeFromCart(cart, product).then((data) => {
    if (data) {
      res.redirect('/cart')
    } else {
      res.send("some error occured")
    }
  })
})

router.get('/checkout', (req, res) => {
  getTotalAmount(req.session.user._id).then((total) => {
    getAddress(req.session.user._id).then((address) => {
      // console.log(address);
      // console.log(total);
      res.render('user/checkout', {
        total: total,
        user: req.session.user,
        address: address
      });
    });
  })
})

// router.post('/checkout',verifyLogin, (req, res) => {
//   getCartProdutDetails(req.body.userId).then((products) => {
//       getTotalAmount(req.body.userId).then((total) => {
//         placeOrder(req.body, products, total).then(()=> {
//           console.log('products are : ',products)
//           res.json({status: true})
//           // res.redirect('/success')
//         })
//       })
//   })
//   console.log(req.body)
// })

router.get('/orders', (req, res) => {
  getOrders(req.session.user._id).then((orders) => {
    console.log("here",orders)
    res.render('user/orders', {
      orders: orders
    })
  })
})

router.get('/order/details/:id', (req, res) => {
  getOrderDetails(req.params.id).then((orders) => {
    // console.log("Product details : ", orders)
    res.render('user/order-details', {
      orderDetails: orders
    })
  })
})

router.get('/order/cancel/:orderId/:productId', (req, res) => {
  cancelOrders(req.params.orderId, req.params.productId).then(() => {
    res.redirect('/orders')
  })
})

router.get('/categories/:categoryId', (req, res) => {
  user = req.session.user;
  getCategory(req.params.categoryId).then((products) => {
    getAllCategories().then((categories) => {

      res.render('user/shop', {
        products: products,
        categories,
        most,
        user
      });
    })
  })
})

router.get('/logout', verifyLogin, (req, res) => {
  req.session.destroy();
  res.redirect('/');  
});

router.get('/success', verifyLogin, (req, res) => {
  res.render('user/success')
})



router.get("/address/add", (req, res) => {
  res.render("user/add-address")
});


router.post("/address/add", (req, res) => {
  // let user = req.session.user
  console.log("in address post route")
  addAddress(req.body, user._id).then((address) => {
    res.redirect("/checkout");
  });
});

router.post("/address", verifyLogin, (req, res) => {
  // console.log(req.body)
  req.session.address = req.body.address
  // console.log("og gokul",req.session.address)
  res.redirect("/payment");
})

router.get("/payment", verifyLogin, (req, res) => {
  let user = req.session.user ? req.session.user : null;
  res.render("user/payment", {
    user: user
  })
})



router.post("/checkout", verifyLogin, async (req, res) => {
  // console.log(req.body);
  let user = req.session.user ? req.session.user : null;
  let addrs = req.session.address ? req.session.address : null;
  
  //getting the address and adding it into order address collection to make it immutable.
  // console.log("user : ", user);
  // console.log("addrs : ", addrs);
  let address = await getAddressById(addrs);
  // console.log("myadress",address);
  // console.log("address : ", address);
  // let orderAddress = await addCheckoutAddress(address);
  // console.log("orderaddress : ", orderAddress);
  // fetching product details and total amount
  let products = await getCartProdutDetails(user._id);
  // console.log("products is ", products)
  // let orderProducts = await addOrderProducts(user.userId, products[0])
  // console.log("orderProducts is : ", orderProducts);
  let total = await getTotalAmount(user._id);
  console.log(typeof total,'this is a number');
  const data = {
    username: address.name,
    phone: address.phone,
    address: address.houseName+" "+address.postOffice,
    payment:req.body.payment,
    id:user._id,
  };


  placeOrder(data, products, total).then((data) => {
    // console.log(req.body.payment)
    if (req.body.payment == 'Cash On Delivery') {  
      res.json({
        success: true
      })
      res.render('user/placed');

    } else if (req.body.payment == 'paypal') { 
      res.json({
        success: true
      })
    } else {
      // console.log("in razor pay router", data)
      userHelper.generateRazorpay(data.insertedId, total).then((response) => {
        res.json(response);
      })
    }
  });
}, );
router.post("/api/orders", async (req, res) => {
  try {
    let user = req.session.user ? req.session.user : null;
    let total = await getTotalAmount(user._id);
    console.log(total);
    const order = await paypal.createOrder(total.total);
    res.status(200).json(order);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post("/api/orders/:orderID/capture", async (req, res) => {
  const {
    orderID
  } = req.params;
  // console.log("Order id is : ",orderID)
  try {
    const captureData = await paypal.capturePayment(orderID);
    res.json(captureData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});



router.post('/verifyPayment', (req, res) => {
  console.log(req.body)
  userHelper.verifyPayment(req.body).then(() => {
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('Payment success');
      res.json({
        status: true
      })
    })
  }).catch((error) => {
    console.log('big error', error);
    res.json({
      status: false,
      errormsg: ''
    })
  })
})


router.get('/account', verifyLogin, (req, res) => {
  let users = req.session.user;
  let body = req.body;
  res.render('user/dashboard', {
    users: users,
    body: body
  })
})


router.get('/dashboard',verifyLogin, (req, res) => {
  let users = req.session.user;
  let body = req.body;
  getAddress(req.session.user._id).then((address) => {
    console.log(address);
    res.render('user/dashboard', {
      address: address,
      users: users,
      body: body,
    })
  })
})



router.get('/user-orders', async (req, res) => {
  let orders = await getOrders(req.session.user._id)
  res.render('user/user-order', {
    orders: orders 
  })
});

router.get('/user-cart', async (req, res) => {
  let orders = await getCart(req.session.user._id)
  let total = await getTotalAmount(req.session.user._id)
  res.render('user/user-cart', {
    orders: orders,
    total: total
  })
});  


router.get('/edit-profile', (req, res) => {
  let users = req.session.user
  res.render('user/edit-profile', {
    users: users
  });
})


router.post('/edit-profile/:id', (req, res) => {
  updateprofile(req.params.id, req.body).then((result) => {
    // console.log();
    if (result.status) {
      res.redirect('/');
    } else {
      res.send('<h1>error</h1>')
    }
  });
});

router.post("/coupon/apply/:couponId", async (req, res) => {
  try{
    let coupon = await validateCoupon(req.params.couponId.trim().toUpperCase());
    await addCoupon(req.session.user._id, req.body.coupon_code.trim().toUpperCase(), coupon.discount)
    res.status(200).json("Successfully applied coupon")
  } catch(err) {
    console.log(err)
    res.status(404).json("Invalid coupon")
  }
})


router.get("/address/delete/:id", async (req, res) => {
  await getDeleteAddress(req.params.id)
  res.redirect("/dashboard")
})

router.get("/address/edit/:id", async (req, res) => {
  let address = await getAddressById(req.params.id)
  res.render("user/edit-address", {address: address})
})

router.post("/address/edit/:id", async (req, res) => {
  await editAddress(req.params.id, req.body)
  res.redirect("/dashboard")
})

router.get("/test",(req, res) => {
  res.render('user/test')
})

// var currentTime = new Date(); 
// var currentOffset = currentTime.getTimezoneOffset();
// var ISTOffset = 330; // IST offset UTC +5:30 
// var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000);
// var hoursIST = ISTTime.getHours()
// var minutesIST = ISTTime.getMinutes()
// console.log(hoursIST + ":" + minutesIST)



module.exports = router; 