var express = require('express');
const async = require('hbs/lib/async');
const { response } = require('../app');
const mailConnection = require('../config/mailConnection');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const userhelpers = require('../helpers/user-helpers')
const twilioHelpers = require('../helpers/twilio_helpers')
const adminHelpers = require('../helpers/admin-helpers')
// const ApiError = require('../config/Apierrors');
let productFilter = [];
let searchProducts;

const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user;
  //console.log(user)
  // console.log("ssss:",process.env.NODEMAILER_USER)
  let cartCount = 0;
  let wishCount = 0;
  if (user) {
    cartCount = await userhelpers.getCartCount(user._id)
    wishCount = await userhelpers.getWishCount(user._id)
  }
  console.log("user:", user)
  let newProducts = await productHelpers.getNewProducts()
  productHelpers.getFeaturedProducts().then((featuredProducts) => {
    res.render('users/home-page', { newProducts,featuredProducts, user, cartCount, wishCount });
  })
});

router.get('/login', (req, res) => {
  if (req.session.userLoggedIn) {
    res.redirect('/')
  } else {
    res.render('users/login', { "loginErr": req.session.userLoginErr })
    req.session.userLoginErr = false
  }
})

router.post('/login', (req, res,next) => {
  
  userhelpers.dologin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user
      req.session.userLoggedIn = true
      res.redirect('/')
    } else {
      req.session.userLoginErr = true
      res.redirect('/login')
    }
  })
})

router.get('/signup', (req, res) => {
  res.render('users/signup', { "userErr": req.session.userExist,"phoneErr": req.session.userPhoneErr })
  req.session.userExist = false
  req.session.userPhoneErr = false
})

router.post('/signup', (req, res) => {
  console.log(req.body)
  req.session.signupBody = req.body
  userhelpers.userExist(req.body.Email, req.body.Mobile).then((response) => {
    console.log(response.exist)
    if (response.exist) {
      req.session.userExist = true
      res.redirect('/signup')
    } else {
      twilioHelpers.sendOtp(req.session.signupBody.Mobile).then((response) => {
        // console.log(response)
        if (response.send) {
          res.redirect('/otp')
        }else{
          req.session.userPhoneErr = true
          res.redirect('/signup')
        }
      })
    }
  })
})

router.get('/otp', (req, res) => {
  res.render('users/otp',{"otpErr": req.session.userOtpErr})
  req.session.userOtpErr = false
})

router.post('/otp', (req, res) => {
  if(req.session.userForgotData){
    console.log(req.session.userForgotData)
    console.log(req.body)
    twilioHelpers.verifyOtp(req.session.userForgotData.Mobile, req.body.verifyOtp)
    .then((response) => {
      if (response.status == 'approved') {
        console.log("approved")
        res.render('users/forgot-change-password')
      }else{
        req.session.userOtpErr = true
        res.redirect('/otp')
      }
    })
  }
  if(req.session.signupBody){
  console.log(req.session.signupBody)
  console.log(req.body)
  twilioHelpers.verifyOtp(req.session.signupBody.Mobile, req.body.verifyOtp)
    .then((response) => {
      if (response.status == 'approved') {
        console.log("approved")
        userhelpers.dosignup(req.session.signupBody).then((response) => {
          //   console.log(response)
          res.redirect('/login')
        })
      }else{
        req.session.userOtpErr = true
        res.redirect('/otp')
      }
    })
  }
})

router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userLoggedIn = false
  res.redirect('/')
})

router.get('/forgot-password',(req,res)=>{
  res.render('users/forgot-password',{"userData":req.session.userData})
  req.session.userData = false
})

router.post('/forgot-password',async(req,res,next)=>{
  try{
  console.log(req.body);
  let userData = await userhelpers.getUserData(req.body.Email)
  req.session.userForgotData = userData
  console.log(userData)
    if(userData){
     twilioHelpers.sendOtp(userData.Mobile).then((response)=>{
      if (response.send) {
        console.log("otp send")
        res.redirect('/otp')
       
      }
     })
    }else{
        req.session.userData = true
        res.redirect('/forgot-password')
    }
  }catch(error){
    next(error)
  }
})

router.post('/forgot-change-password',(req,res,next)=>{
  try{
  console.log(req.body);
  console.log(req.session.userForgotData);
  userhelpers.changeUserForgottenPassword(req.session.userForgotData._id,req.body.new_password)
  .then((response)=>{
    res.json({changed : true})
  })
}catch(error){
  next(error)
}
})

router.get('/cart', verifyLogin, async (req, res) => {
  let userId = req.session.user._id
  //let user = req.session.user
  let products = await userhelpers.getCartProducts(userId)
  let totalValue = 0
  if (products.length > 0) {
    totalValue = await userhelpers.getTotalAmount(userId)
  }
  console.log("products", products)
  res.render('users/newcart', { products, user: req.session.user._id, totalValue })
})

router.get('/add-to-cart/:id', (req, res) => {
  console.log("api called")
  
  let userId = req.session.user._id
  const prodId = req.params.id
  if(!userId){
    res.json({cartAdded:false})
  }else{
  //console.log(userId)
  //console.log(prodId)
  userhelpers.addToCart(prodId, userId).then(() => {
    res.json({ cartAdded: true })
  })
}
})

router.get('/add-to-wishlist/:id', (req, res,next) => {
  try{
  let prodId = req.params.id
  console.log(prodId)
  let userId = req.session.user._id
  console.log(userId)
  userhelpers.addToWishlist(userId, prodId).then((response) => {
    res.json(response)
  })
 }catch(error){
    console.log("error")
    res.json({prodNotAdded:true})
  }
})

router.get('/wishlist',verifyLogin, async (req, res) => {
  let userId = req.session.user._id
  let products = await userhelpers.getWishlistProducts(userId)
  res.render('users/wishlist', { products, user: req.session.user._id })
})

router.post('/remove-wishlist-product', (req, res , next) => {
  try{
  console.log(req.body)
  userhelpers.removeWishlistProduct(req.body).then((response) => {
    res.json(response)
  })
}catch(error){
  next(error)
}
})

router.get('/allProducts', async (req, res) => {
  let page = req.query.page || 0
  console.log("page:",page)
  let prodPerPage = 4
  productFilter = await productHelpers.getAllproducts(page,prodPerPage)
  res.redirect('/shope')

})

router.get('/shope', async (req, res,next) => {
  try{
  console.log("searchproducts:", searchProducts)
  let user = req.session.user
  let cartCount = 0;
  let wishCount = 0;
  let brands = await adminHelpers.getBrands()
  console.log(brands)
  let categories = await adminHelpers.getCategories()
  console.log(categories)
  if (user) {
    cartCount = await userhelpers.getCartCount(user._id)
    wishCount = await userhelpers.getWishCount(user._id)
  }
  if (searchProducts) {
    productFilter = searchProducts;
    res.render('users/viewProducts', { productFilter, cartCount, wishCount, user,brands,categories })
    searchProducts = null
  } else {
    res.render('users/viewProducts', { productFilter, cartCount, wishCount, user,brands, categories })
  }
}catch(error){
  next(error)
}

})

router.get('/newArrivals',async(req,res)=>{
  let newProducts = await productHelpers.getNewArrivalProducts()
  res.render('users/new-arrivals',{newProducts,user:req.session.user})
})

router.get('/product/:id', async (req, res,next) => {
  try{
  let prodId = req.params.id
  let product = await productHelpers.getProductDetails(prodId)
  console.log(product)
  res.render('users/single-product', { product,user:req.session.user })
  }
  catch(error){
    next(error)
  }
})

router.get('/about', (req, res) => {
  res.render('users/about',{user:req.session.user})
})

router.get('/contact', (req, res) => {
  res.render('users/contact',{user:req.session.user})
})

router.post('/change-product-quantity', (req, res, next) => {
  try{
  console.log(req.body)
  userhelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userhelpers.getTotalAmount(req.body.user)
    response.subTotal = await userhelpers.getProductSubtotal(req.body.product,req.body.user)
    //console.log(cartProducts)
    //response.subtotal = cartProducts.totalPrice
    //console.log("subtotal:",subTotal)
    console.log(response)
    res.json(response)
  })
}catch(error){
  next(error)
}
})

router.get('/checkout', verifyLogin, async (req, res,next) => {
  try{
  let userId = req.session.user._id
  let products = await userhelpers.getCartProducts(userId)
  console.log("products", products)
  let total = await userhelpers.getTotalAmount(userId)
  res.render('users/checkout', { total, userId,user: req.session.user ,products})
  }catch(error){
    console.log(error)
    next(error)
  }
})

router.get('/checkout/:id', (req, res) => {
  let total = req.params.id
  let user = req.session.user
  console.log("total:", total)
  res.render('users/checkout', { total, user })
})

router.post('/checkout', async (req, res,next) => {
  try{
  console.log("place:", req.body.total)
  let userEmail = req.session.user.Email
  console.log("user", userEmail)
  let products = await userhelpers.getCartProductsList(req.body.userId)
  let totalPrice = req.body.total
  // console.log(products)
  userhelpers.placeOrder(req.body, products, totalPrice).then(async (orderId) => {
    // console.log("orderId:",orderId)
    if (req.body['payment-method'] == 'COD') {
      await mailConnection.sendMail(userEmail)
      res.json({ codSuccess: true })
    } else {
      userhelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        console.log("response:", response)
        res.json(response)
      })
    }
  })
}catch(error){
  next(error)
}
})

router.post('/verify-payment', (req, res) => {
  console.log(req.body)
  let userEmail = req.session.user.Email
  userhelpers.verifyPayment(req.body).then(async (response) => {
    userhelpers.changePaymentStatus(req.body['order[receipt]']).then(async (response) => {
      await mailConnection.sendMail(userEmail)
      console.log("payment successfull")
      res.json({ status: true })
    })
  }).catch((err)=>{
    res.json({status : false,errmsg: ""})
  })
})

router.get('/order-success', (req, res) => {
  res.render('users/order-success', { user: req.session.user })
})

router.get('/view-orders',verifyLogin, async (req, res,next) => {
  try{
  let orders = await userhelpers.getUserOrders(req.session.user._id)
  console.log(orders)
  res.render('users/orders', { user: req.session.user, orders })
  }catch(error){
    next(error)
  }
})

router.get('/view-order-products/:id', async (req, res,next) => {
  try{
  let orderId = req.params.id
  console.log(orderId)
  let orderItems = await userhelpers.getOrderProductsDetails(orderId)
  console.log("orderItems :", orderItems)
  res.render('users/view-order-details', { user: req.session.user, orderItems })
  }catch(error){
    next(error)
  }
})
// router.get('/orders',async(req,res)=>{
//   let orders = await userhelpers.getUserOrders(req.session.user._id)
//   res.render('users/order-details',{user:req.session.user,orders})
// })

router.post('/apply-coupon', async (req, res,next) => {
  try{
  console.log(req.body)
  //let newTotal=100
  let couponCode = req.body.couponCode
  let userId = req.session.user._id
  let totalAmount = await userhelpers.getTotalAmount(userId)
  //console.log(totalValue)
  console.log("coupon:", couponCode)
  
  userhelpers.getDiscount(couponCode, totalAmount).then((newTotal) => {
    console.log("newtotal:", newTotal)
    //   //res.render('/cart',{newTotal})
    //   //res.redirect('/cart')
    res.json(newTotal)
  })
}catch(error){
  next(error)
}
})

router.get('/profile', async (req, res,next) => {
  try{
  let userId = req.session.user._id
  let userDetails = await userhelpers.getUserDetails(userId)
  res.render('users/profile-page', { userDetails,user:req.session.user })
}catch(error){
  next(error)
}
})


router.get('/edit-profile', async (req, res,next) => {
  try{
  let userId = req.session.user._id
  let userDetails = await userhelpers.getUserDetails(userId)
  res.render('users/profile-edit-page', { userDetails,user:req.session.user })
  }catch(error){
    next(error)
  }
})

router.post('/edit-profile', (req, res,next) => {
  try{
  let userId = req.session.user._id
  // console.log(userId)
  // console.log(req.body)
  console.log(req.files.image)
  userhelpers.updateUserDetails(userId, req.body).then(() => {
    res.redirect('/profile')
    if (req.files.image) {
      let userImage = req.files.image
      //  image.mv('./public/product-images/'+prodId+'.jpg')
      userImage.mv('./public/images/users-dp/' + userId + '.jpg')
    }
  })
}catch(error){
  next(error)
}
})

router.get('/change-password', (req, res) => {
  res.render('users/change-password',{user:req.session.user})
})

router.post('/change-password', (req, res,next) => {
  try{
  console.log(req.body)
  let userId = req.session.user._id
  userhelpers.changePassword(userId, req.body).then((response) => {
    console.log("res:", response)
    res.json(response)
  })
}catch(error){
  next(error)
}
})



router.post('/search-product', async (req, res,next) => {
  try{
  console.log(req.body)
  searchProducts = await userhelpers.searchProducts(req.body)
  // console.log(resolve.search)
  // res.json(resolve.search)
  res.json(searchProducts)
  }catch(error){
    next(error)
  }
})

router.post('/product-filter', async (req, res,next) => {
  try{
  let details = req.body
  console.log("filterDetails:", details)
  let price = parseInt(details.price)
  // let price = details.price
  const brand = [];
  for (const i of details.brandName) {
    brand.push({ brand: i });
  }
  let products = await userhelpers.filterProducts(brand, price)
  console.log('brand:', brand)
  productFilter = products
  res.json({ status: true })
}catch(error){
  next(error)
}


})

router.get('/invoice/:id', async (req, res,next) => {
  try{
  let orderId = req.params.id
  console.log(orderId)
  let invoiceDeliveryData = await userhelpers.getInvoiceDeliveryData(orderId)
  let invoiceProductsData = await userhelpers.getInvoiceProductsData(orderId)
  console.log("invoice:", invoiceDeliveryData)
  console.log("productsdata:", invoiceProductsData)
  let total = 0
  for (i = 0; i < invoiceProductsData.length; i++) {
    total = total + (invoiceProductsData[i].productQuantity * invoiceProductsData[i].productPrice)
  }
  console.log("total:", total)
  res.render('users/invoice', { invoiceDeliveryData, invoiceProductsData, total ,user:req.session.user})
}catch(error){
  next(error)
}
})


router.post('/buysingleproduct',async(req,res,next)=>{
  try{
  console.log(req.body)
  let userId = req.session.user._id
  console.log(userId)
  let cartcheck = await userhelpers.checkCartProduct(userId,req.body.prodId)
  if(cartcheck == '0')
  {
    // console.log(cartcheck);
    res.json({productNotFount : true})
  }else{
    res.json({productNotFount : false})
  }
}catch (error){
  next(error)
}
})


module.exports = router;
