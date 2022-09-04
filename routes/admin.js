var express = require('express');
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
} = require('../helpers/admin-helper');
var router = express.Router();

router.get('/login', function (req, res, next) {
 if(req.session.adminLoggedIn) {
     res.redirect('/admin')
 } else {
    res.render('admin/login',{"loginErr":req.session.loginErr});
    req.session.loginErr = false;
 }
});


router.post('/login', (req, res) => {
  doLogin(req.body).then((state) => {
    if (state){
      req.session.adminLoggedIn = true;
    res.redirect('/admin');
    }else{
      req.session.loginErr = true;
      res.redirect('/admin/login');
      
    }
  });
});

// router.use((req, res, next) => {
//   req.session.adminLoggedIn ? next() : res.redirect('/admin/login');
// });

/* GET home page. */
router.get('/', (req, res) => {
  res.render('admin/admin');
});

router.get('/logout', (req, res) => {
  req.session.adminLoggedIn = false;
  res.redirect('/admin');
});

router.get('/users', (req, res) => {
  getAllUsers().then((users) => {
    res.render('admin/users', { users: users });
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
    res.render('admin/edit-user', { user: user, admin: true });
  });
});

router.post('/edit-user/:id', (req, res) => {
  updateUser(req.params.id, req.body).then((result) => {
    if (result.status) res.redirect('/admin/users');
    else res.render('admin/edit-user', { user: result, admin: true });
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
    res.render('admin/products', { products });
  });
});

router.get('/add-product', (req, res) => {
  getAllCategories().then((categories) => {

    res.render('admin/add-product',{categories: categories});
  })
});

router.post('/add-product', (req, res) => {
  const image = req.files.image;
  console.log(req.body)
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

router.get('/edit-product/:id', (req, res) => {
  getProductDetails(req.params.id).then((product) => {
    console.log(product);
    res.render('admin/edit-product', { product: product, admin: true });
  });
});

router.post('/edit-product/:id', (req, res) => {
  updateProductDetails(req.params.id, req.body).then(() => {
    res.redirect('/admin/products');
    image.mv(`./public/product-images/${insertId}.jpg`, (err, done) => {
      if (!err) res.render('admin/add-product');
      else console.log(err);
    });
  });
});


// ===================CATEGORIES=====================

router.get('/categories', (req, res) => {
  getAllCategories().then((categories) => {
    res.render('admin/categories', { categories });
  });
});

router.get('/add-category', (req, res) => {
  getAllProducts().then((products) => {
    res.render('admin/add-category', { products });
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
    res.render('admin/edit-category', { category: category });
  });
});
router.post('/edit-category/:id', (req, res) => {
  editCategory(req.params.id, req.body).then((status) => {
    res.redirect('/admin/categories');
  });
});

router.get('/delete-category/:id', (req, res) => {
  deleteCategory(req.params.id).then((status) => {
    res.redirect('/admin/categories');
  });
});

//===================Orders=========================

router.get('/orders', (req, res) => {
  getOrders().then((orders) => {
    res.render('admin/orders',{orders:orders })
  })
})
 
router.get('/order/details/:id', (req, res) => {
  getOrderDetails(req.params.id).then((orders) => {
    res.render('admin/order-details',{orderDetails:orders})
  })
})

router.post('/order/changeStatus', (req, res) => {
  const { orderId, productId, status } = req.body
  updateOrderStatus(orderId, productId, status).then((orders) => {
    res.status(200).send("success")
  })
})

router.get('/order/cancel/:orderId/:productId', (req, res) => {
  console.log(req.params.orderId)
  updateOrderStatus(req.params.orderId,req.params.productId, "cancelled").then(() => {
    res.redirect('/admin/orders')
  })
})

module.exports = router;
