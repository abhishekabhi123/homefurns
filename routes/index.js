const { json } = require('express');
var express = require('express');
const {
  doLogin,
  doSignup,
  getOtp,
  verifyOtp,
  loginOtp,
  getAllProducts,
  getProduct,
} = require('../helpers/user-helper');
var router = express.Router();

const products = [
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
  verifyOtp(req.body).then((response) => {
    if (response) {
      loginOtp(req.session.phone).then((response) => {
        console.log(response);
        req.session.loggedIn = true;
        req.session.user = response;
        res.redirect('/');
      });
    }
  });
});

router.post('/login', (req, res) => {
  console.log(req.body);
  doLogin(req.body).then((response) => {
    if(response.status == "block"){
      console.log("blocked");
      res.render("user/blocked")
    }
     else if (response.status == true) {
      console.log(response);
      req.session.loggedIn = true;
      req.session.user = response.user;
      res.redirect('/');
    } else {
      console.log(response);
      console.log('error ');
      req.session.loginErr = 'Username or password incorrect';
      res.redirect('/');
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
  if (req.session.loggedIn) {
    res.render('user/index', { products, most, user });
  } else {
    res.render('user/index', { products, most });
  }
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
    res.render('user/shop', { products });
  });  
});  

router.get('/product/:id', (req, res) => {
  getProduct(req.params.id).then((product) => {
    console.log(product);
    res.render('user/product-details', { product });
  })
})


// router.use((req, res, next) => {
//   if(req.session.loggedIn) {
//     next();
//   } else {
//     res.redirect('/login');
//   }
// })


router.get('/login', (req, res) => {
  res.render('user/login');
});

router.get('/asdf', (req, res) => {
  res.render('user/signup');
});


router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
