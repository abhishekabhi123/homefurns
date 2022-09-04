const { response } = require('express');
var express = require('express');
const { getAllCategories } = require('../helpers/admin-helper');
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
} = require('../helpers/user-helper');
var router = express.Router();

const most = [
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
    } else{
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
      res.render('user/index', { products, most, user });
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
      res.render('user/shop', { products, categories, user: req.session.user });
    })
  });
});

router.get('/product/:id', (req, res) => {
  getProduct(req.params.id).then((product) => {
    getSuggestions(4).then((suggestions) => {

      console.log(suggestions);
      res.render('user/product-details', { product,user: req.session.user, suggestions: suggestions});
    })
  });
});

router.get('/login', (req, res) => {

  res.render('user/login',{ loginErr: req.session.loginErr});   
  
});

router.get('/asdf', (req, res) => {
  res.render('user/signup');
});

function verifyLogin(req, res, next) {
  if(req.session.loggedIn) {
    next();
  } else {
    res.redirect('/login');
  } 
}

router.get('/addToCart/:id',verifyLogin, (req, res) => {
  addToCart(req.session.user, req.params.id).then(() => {
    console.log("added to cart");
    res.redirect('/cart');
  })
})

router.get('/cart',verifyLogin, (req, res) => {
  getCart(req.session.user._id).then((data) => {
    getTotalAmount(req.session.user._id).then((total) => {

      console.log(data);
      // console.log(data[0].cartItems)
      res.render('user/cart', {data: data, total: total, user: req.session.user});
    })
  })
})   
router.post('/changeQuantity',verifyLogin, (req, res) => {
  const {cart, product,user , count} = req.body;
  changeCartQuantity(cart, product, count).then((data) => {
    getTotalAmount(user).then((total) => {
      data.total = total
      console.log(data);
      res.status(200).json(data)
    })
  })
})

router.post('/removeFromCart', (req, res) => {
  const {cart, product} = req.body;
  removeFromCart(cart, product).then((data) => {
    if(data){
      res.redirect('/cart')} else{
        res.send("some error occured")}
  })
})

router.get('/checkout', (req, res) => {
  getTotalAmount(req.session.user._id).then((total) => {
    res.render('user/checkout', {total: total, user: req.session.user});
  })
})

router.post('/checkout',verifyLogin, (req, res) => {
  getCartProdutDetails(req.body.userId).then((products) => {
      getTotalAmount(req.body.userId).then((total) => {
        placeOrder(req.body, products, total).then(()=> {
          console.log('products are : ',products)
          res.json({status: true})
        })
      })
  })
  console.log(req.body)
})

router.get('/orders', (req, res) => {
  getOrders(req.session.user._id).then((orders) => {
    console.log(orders)
    res.render('user/orders', {orders: orders})
  })
})

router.get('/order/details/:id', (req, res) => {
  getOrderDetails(req.params.id).then((orders) => {
    console.log("Product details : ",orders)
    res.render('user/order-details',{orderDetails:orders})
  })
}) 

router.get('/order/cancel/:orderId/:productId', (req, res) => {
  cancelOrders(req.params.orderId,req.params.productId).then(() => {
    res.redirect('/')
  })
})

router.get('/categories/:categoryId',(req, res) => {
  user = req.session.user;
  getCategory(req.params.categoryId).then((products) => {
    getAllCategories().then((categories) => {

      res.render('user/shop', { products: products,categories, most, user });
    })
  })
})

router.get('/logout',verifyLogin, (req, res) => {
  req.session.destroy();
  res.redirect('/');
});
 

module.exports = router;
