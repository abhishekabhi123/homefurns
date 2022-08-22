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
} = require('../helpers/admin-helper');
var router = express.Router();

router.get('/login', function (req, res, next) {
  req.session.adminLoggedIn
    ? res.redirect('/admin')
    : res.render('admin/login');
});

router.post('/login', (req, res) => {
  doLogin(req.body).then(() => {
    req.session.adminLoggedIn = true;
    res.redirect('/admin');
  });
});

router.use((req, res, next) => {
  req.session.adminLoggedIn ? next() : res.redirect('/admin/login');
});

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
  res.render('admin/add-product');
});

router.post('/add-product', (req, res) => {
  const image = req.files.image;
  addProduct(req.body).then((insertId) => {
    image.mv(`./public/product-images/${insertId}.jpg`, (err, done) => {
      if (!err) res.render('admin/add-product');
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
  });
});

router.get('/categories', (req, res) => {

   
})
module.exports = router;
