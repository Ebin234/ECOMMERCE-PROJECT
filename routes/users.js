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
router.get('/', async function(req, res, next) {
  let user = req.session.user
  //console.log(user)
  let cartCount = 0;
  if(user){
  cartCount = await userhelpers.getCartCount(user._id)}
  productHelpers.getAllproducts().then((products)=>{
    res.render('users/home-page', {products,user,cartCount});
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
  //let user = req.session.user
  let products = await userhelpers.getCartProducts(userId)
  let totalValue = await userhelpers.getTotalAmount(userId)
  console.log("products",products)
  res.render('users/newcart',{products ,user:req.session.user._id,totalValue})
})

router.get('/add-to-cart/:id',(req,res)=>{
  console.log("api called")
   let userId = req.session.user._id
   const prodId =req.params.id
   //console.log(userId)
   //console.log(prodId)
   userhelpers.addToCart(prodId,userId).then(()=>{
   // res.redirect('/')
    res.json({status:true})
   })
})

router.get('/allProducts',async(req,res)=>{
  let user = req.session.user
  let cartCount = 0;
  if(user){
  cartCount = await userhelpers.getCartCount(user._id)}
  productHelpers.getAllproducts().then((products)=>{
    res.render('users/viewProducts',{products,user,cartCount})
  })
})

router.get('/product/:id',async(req,res)=>{
  let prodId = req.params.id
  let product = await productHelpers.getProductDetails(prodId)
  console.log(product)
  
  res.render('users/single-product',{product})
})

router.get('/about',(req,res)=>{
  res.render('users/about')
})

router.get('/contact',(req,res)=>{
  res.render('users/contact')
})

router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body)
  userhelpers.changeProductQuantity(req.body).then(async(response)=>{
   response.total = await userhelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.get('/checkout',verifyLogin,async(req,res)=>{
  user=req.session.user
  let total = await userhelpers.getTotalAmount(user._id)
    res.render('users/checkout',{total,user})
  
})

router.post('/checkout',async(req,res)=>{
  //console.log(req.body)
  let products = await userhelpers.getCartProductsList(req.body.userId)
  let totalPrice = await userhelpers.getTotalAmount(req.body.userId)
  // console.log(products)
  userhelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    // console.log("orderId:",orderId)
    if(req.body['payment-method']=='COD'){
    res.json({codSuccess : true})
  }else{
    userhelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
      console.log("response:",response)
      res.json(response)
    })
  }
  })
})

router.post('/verify-payment',(req,res)=>{
  console.log(req.body)
  userhelpers.verifyPayment(req.body).then((response)=>{
    userhelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })
  }).catch((err)=>{
    res.json({status:false,errmsg:''})
  })
})

router.get('/order-success',(req,res)=>{
  res.render('users/order-success',{user:req.session.user})
})

router.get('/view-orders',async(req,res)=>{
  let orders =await userhelpers.getUserOrders(req.session.user._id)
  console.log(orders)
  res.render('users/orders',{user:req.session.user,orders})
})

router.get('/view-order-products/:id',async(req,res)=>{
  let orderId = req.params.id
  console.log(orderId)
  let orderItems =await userhelpers.getOrderProductsDetails(orderId)
  console.log("orderItems :",orderItems)
  res.render('users/view-order-details',{user:req.session.user,orderItems})
})
// router.get('/orders',async(req,res)=>{
//   let orders = await userhelpers.getUserOrders(req.session.user._id)
//   res.render('users/order-details',{user:req.session.user,orders})
// })




module.exports = router;
