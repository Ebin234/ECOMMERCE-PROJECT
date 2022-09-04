var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')

/* GET home page. */
router.get('/', function(req, res, next) {
  productHelpers.getAllproducts().then((products)=>{
    res.render('users/view-products', { products,});
  })
});

router.get('/login',(req,res)=>{
  res.render('users/login')
})

router.get('/signup',(req,res)=>{
  res.render('users/signup')
})

module.exports = router;
