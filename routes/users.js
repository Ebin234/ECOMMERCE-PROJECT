var express = require('express');
const async = require('hbs/lib/async');
const { response } = require('../app');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const userhelpers = require('../helpers/user-helpers')

const verifyLogin = (req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', function(req, res, next) {
  let user = req.session.user
  console.log(user)
  productHelpers.getAllproducts().then((products)=>{
    res.render('users/view-products', { products,user});
  })
});

router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('users/login',{"loginErr":req.session.loginErr})
    req.session.loginErr = false
  }
})

router.post('/login',(req,res)=>{
  userhelpers.dologin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    }else{
      req.session.loginErr=true
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
    req.session.loggedIn=true
    req.session.user = response
    res.redirect('/')
  })
})

router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart',verifyLogin,async(req,res)=>{
  let userId = req.session.user._id
  let products = await userhelpers.getCartProducts(userId)
  console.log("products",products)
  res.render('users/cart',{products})
})

router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
   let userId = req.session.user._id
   const prodId =req.params.id
   //console.log(userId)
   //console.log(prodId)
   userhelpers.addToCart(prodId,userId).then(()=>{
    res.redirect('/')
   })
})

router.get('/home',(req,res)=>{
  res.render('users/home-Page')
})

router.get('/products',(req,res)=>{
  res.render('users/viewProducts')
})

router.get('/product',(req,res)=>{
  res.render('users/product')
})

router.get('/about',(req,res)=>{
  res.render('users/about')
})

router.get('/contact',(req,res)=>{
  res.render('users/contact')
})

router.get('/cart1',(req,res)=>{
  res.render('users/newcart')
})



module.exports = router;
