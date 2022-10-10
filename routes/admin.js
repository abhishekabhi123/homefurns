var express = require('express');
const { Timestamp } = require('mongodb');
const { get } = require('../config/connection');
const {
  addProduct,
  getAllProducts,
  deleteProduct,
  getProductDetails,
  doLogin,
  getAllUsers,
  deleteUser,
  getUserDetails,
  updateProductDetails,
  addUser,
  updateUser,
  blockUser,
  addCategory,
  getAllCategories,
  deleteCategory,
  editCategory,
  getCategory,
  getOrders,
  getOrderDetails,
  updateOrderStatus,
  getCount,
  getOrderCount,
  getTotalAmountOrders,
  getStatsWeek,
  getStatsDaily,
  getAllCategoryProducts,
  editCategoryDiscount,
  addCoupon,
  getAllCoupon,
  getStatsCategory,
  changeOrderStatus,
  
} = require('../helpers/admin-helper');
const { getTotalAmount } = require('../helpers/user-helper');
var router = express.Router();

router.get('/login', function (req, res, next) {
  if (req.session.adminLoggedIn) {
    res.redirect('/admin')
  } else {
    res.render('admin/login', {
      "loginErr": req.session.loginErr
    });
    req.session.loginErr = false;
  }
});


router.post('/login', (req, res) => {
  doLogin(req.body).then((state) => {
    if (state) {
      req.session.adminLoggedIn = true;
      res.redirect('/admin');
    } else {
      req.session.loginErr = true;
      res.redirect('/admin/login');

    }
  });
});

router.use((req, res, next) => {
  req.session.adminLoggedIn ? next() : res.redirect('/admin/login');
});

/* GET home page. */
router.get('/',async (req, res) => {
    let usersCount = await getCount();
    let orderCount=await getOrderCount();
    let getTotalAmountOrder=await getTotalAmountOrders();
    console.log("totalis",getTotalAmountOrder)
    
    
    res.render('admin/admin',{count:usersCount,order:orderCount,total:getTotalAmountOrder})
});

router.get('/stats/week',(req,res) => { 
  console.log("started");
getStatsWeek().then((graph) => {
  
  res.status(200).json(graph);  
})
})
router.get('/stats/daily',(req,res) => { 
  console.log("started");
getStatsDaily().then((graph) => {
  res.status(200).json(graph);   
})
})
router.get('/stats/categorysale',(req,res) => { 
  console.log("started");
getStatsCategory().then((graph) => {
  res.status(200).json(graph);   
})
})

router.get('/logout', (req, res) => {
  req.session.adminLoggedIn = false;
  res.redirect('/admin');
});

router.get('/users', (req, res) => {
  getAllUsers().then((users) => {
    res.render('admin/users', {
      users: users
    });
  });
});

router.get('/add-user', (req, res) => {
  res.render('admin/add-user');
});

router.post('/add-user', (req, res) => {
  addUser(req.body).then((user) => {
    res.redirect('/admin/users');
  });
  // res.render('admin/add-user');
});

router.get('/edit-user/:id', (req, res) => {
  getUserDetails(req.params.id).then((user) => {
    res.render('admin/edit-user', {
      user: user,
      admin: true
    });
  });
});

router.post('/edit-user/:id', (req, res) => {
  updateUser(req.params.id, req.body).then((result) => {
    if (result.status) res.redirect('/admin/users');
    else res.render('admin/edit-user', {
      user: result,
      admin: true
    });
  });
});

router.get('/delete-user/:id', (req, res) => {
  deleteUser(req.params.id).then(() => {
    res.redirect('/admin/users');
  });
});

router.get('/block-user/:id', (req, res) => {
  blockUser(req.params.id).then(() => {
    res.redirect('/admin/users');
  });
});

router.get('/products', (req, res) => {
  getAllProducts().then((products) => {
    res.render('admin/products', {
      products
    });
  });
});

router.get('/add-product', (req, res) => {
  getAllCategories().then((categories) => {

    res.render('admin/add-product', {
      categories: categories
    });
  })
});

router.post('/add-product', (req, res) => {
  const image = req.files.image;
  if(req.body.discount) {
    req.body.mrp = req.body.price
    req.body.price = req.body.price - (req.body.price / req.body.discount)
  }
  console.log("body",req.body)
  addProduct(req.body).then((insertId) => {
    console.log(insertId)
    image.mv(`./public/product-images/${insertId}.jpg`, (err, done) => {
      if (!err) res.redirect('/admin/add-product');
      else console.log(err);
    });
  });
});

router.get('/delete-product/:id', (req, res) => {
  deleteProduct(req.params.id).then(() => {
    res.redirect('/admin/products');
  });
});

router.get('/edit-product/:id', async (req, res) => {
  let categories = await getAllCategories()
  let product = await  getProductDetails(req.params.id)
  let current_category = await getCategory(product.categories)
  console.log(current_category)
    res.render('admin/edit-product', {
      product: product,
      admin: true,
      categories: categories,
      current_category : current_category,
    });
});

router.post('/edit-product/:id', async (req, res) => {
  let {discount} = await getCategory(req.body.categories)//get the discount for the selected category
  req.body.pd_price = req.body.mrp - ( req.body.discount / 100 ) * req.body.mrp//this sets the product discount price with mrp
  let price = req.body.pd_price - (discount / 100) * req.body.pd_price//t final price && product discounted price - discount
  discount = parseInt(discount) + parseInt(req.body.discount)// Sums the total discount && product discount + category discount
  updateProductDetails(req.params.id, req.body, price).then(() => {//Update the product details in the database
    res.redirect('/admin/products');
    if(req.files?.image){
      const image = req.files.image;
      image.mv(`./public/product-images/${insertId}.jpg`, (err, done) => {
      if (!err) res.render('admin/add-product');
      else console.log(err);
    });
    }
  });
});


// ===================CATEGORIES=====================

router.get('/categories', (req, res) => {
  getAllCategories().then((categories) => {
    res.render('admin/categories', {
      categories
    });
  });
});

router.get('/add-category', (req, res) => {
  getAllProducts().then((products) => {
    res.render('admin/add-category', {
      products
    });
  });
});
router.post('/add-category', (req, res) => {
  addCategory(req.body).then((status) => {
    console.log(status);
    res.redirect('/admin/categories');
  });
});

router.get('/edit-category/:id', (req, res) => {
  getCategory(req.params.id).then((category) => {
    res.render('admin/edit-category', {
      category: category
    });
  });
});
router.post('/edit-category/:id', async (req, res) => {
  await editCategory(req.params.id, req.body)
  let category = await getAllCategoryProducts(req.params.id)
  let {discount} = req.body
  category.forEach(async element => {
      let price = element.pd_price - (element.pd_price * (discount / 100))
      discount = parseInt(discount) + parseInt(element.discount)
      await editCategoryDiscount(element._id, price, discount)
  });
    res.redirect('/admin/categories');
});

router.get('/delete-category/:id', (req, res) => {
  deleteCategory(req.params.id).then((status) => {
    res.redirect('/admin/categories');
  });
});

//===================Orders=========================

router.get('/orders',async (req, res) => {
  // getOrders().then((orders) => {
  //   console.log(orders[0].deliveryDetails)
  //   res.render('admin/orders', {
  //     orders: orders
  //   })
  // })
  let orders=await getOrders()
  console.log(orders[0].deliveryDetails)
    res.render('admin/orders', {
      orders: orders
    })
  
})

router.get('/order/details/:id', (req, res) => {
  getOrderDetails(req.params.id).then((orders) => {
    res.render('admin/order-details', {
      orderDetails: orders
    })
  })
})

router.post('/order/change-order-status', (req, res) => {
  console.log("toommy",req.body)
   changeOrderStatus(req.body).then((response) => {
    res.json(response)
  })
})

router.get('/order/cancel/:orderId/:productId', (req, res) => {
  // console.log(req.params.orderId)
  updateOrderStatus(req.params.orderId, req.params.productId, "cancelled").then(() => {
    res.redirect('/admin/orders')
  })
})



//==================Coupon =============================
router.get('/coupon', (req, res) => {
  getAllCoupon().then((coupon) => {

    res.render("admin/view_coupons", {coupon: coupon})
  })
})
router.get('/coupon/add', (req, res) => {
  res.render("admin/add_coupon")
})
router.post("/coupon/add", (req, res) => {
  req.body.coupon_code = req.body.coupon_code.toUpperCase()
  req.body.discount = parseInt(req.body.discount)
  addCoupon(req.body).then(() => {
    res.redirect("/admin/coupon")
  })
})


router.get('/report', async(req, res) => {
let daily=await  getStatsDaily()
  let date=daily.date;
  let amount=daily.totalAmount
      res.render('admin/report',{date,amount})
})




module.exports = router;