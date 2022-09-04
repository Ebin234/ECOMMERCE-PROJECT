var express = require('express');
const { response } = require('../app');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const userhelpers = require('../helpers/user-helpers')

/* GET home page. */
router.get('/', function(req, res, next) {
  productHelpers.getAllproducts().then((products)=>{
    res.render('users/view-products', { products,});
  })
});

router.get('/login',(req,res)=>{
  res.render('users/login')
})

router.post('/login',(req,res)=>{
  userhelpers.dologin(req.body).then((response)=>{
    if(response.status){
      res.redirect('/')
    }else{
      res.redirect('/login')
    }
  })
})

router.get('/signup',(req,res)=>{
  res.render('users/signup')
})

router.post('/signup',(req,res)=>{
  console.log(req.body)
  userhelpers.dosignup(req.body).then((response)=>{
    console.log(response)
    res.redirect('/login')
  })
})

module.exports = router;
