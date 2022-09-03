var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')

/* GET home page. */
router.get('/', function(req, res, next) {
  productHelpers.getAllproducts().then((products)=>{
    res.render('users/view-products', { products,});
  })
});

module.exports = router;
