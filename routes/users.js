var express = require('express');
const mailConnection = require('../config/mailConnection');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const userhelpers = require('../helpers/user-helpers')
const twilioHelpers = require('../helpers/twilio_helpers')
const adminHelpers = require('../helpers/admin-helpers')
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
  let cartCount = 0;
  let wishCount = 0;
  if (user) {
    cartCount = await userhelpers.getCartCount(user._id)
    wishCount = await userhelpers.getWishCount(user._id)
  }
  console.log("user:", user)
  let newProducts = await productHelpers.getNewProducts()
  productHelpers.getFeaturedProducts(8).then((featuredProducts) => {
    res.render('users/home-Page', { newProducts, featuredProducts, user, cartCount, wishCount });
  })
});

/*  Signup page */
router.get('/signup', (req, res) => {
  let cartCount = 0;
  let wishCount = 0;
  res.render('users/signup', { cartCount, wishCount, "userErr": req.session.userExist, "phoneErr": req.session.userPhoneErr })
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
        console.log(response)
        if (response.send) {
          res.redirect('/otp')
        } else {
          req.session.userPhoneErr = true
          res.redirect('/signup')
        }
      })
    }
  })
})

/* OTP */
router.get('/otp', (req, res) => {
  let cartCount = 0;
  let wishCount = 0;
  res.render('users/otp', { cartCount, wishCount, "otpErr": req.session.userOtpErr })
  req.session.userOtpErr = false
})

router.post('/otp', (req, res,next) => {
  try{
    let cartCount = 0;
    let wishCount = 0;
  if (req.session.userForgotData) {
    console.log(req.session.userForgotData)
    console.log(req.body)
    twilioHelpers.verifyOtp(req.session.userForgotData.Mobile, req.body.verifyOtp)
      .then((response) => {
        if (response.status == 'approved') {
          console.log("approved")
          res.render('users/forgot-change-password',{cartCount,wishCount})
        } else {
          req.session.userOtpErr = true
          res.redirect('/otp')
        }
      })
  }
  if (req.session.signupBody) {
    console.log(req.session.signupBody)
    console.log(req.body)
    twilioHelpers.verifyOtp(req.session.signupBody.Mobile, req.body.verifyOtp)
      .then((response) => {
        if (response.status == 'approved') {
          console.log("approved")
          userhelpers.dosignup(req.session.signupBody).then((response) => {
            //   console.log(response)
            res.redirect('/login')
            req.session.signupBody=false
          })
        } else {
          req.session.userOtpErr = true
          res.redirect('/otp')
        }
      })
  }
}catch(err){
  next(err)
}
})

/* LOGIN PAGE */
router.get('/login', (req, res) => {
  let cartCount = 0;
  let wishCount = 0;
  if (req.session.userLoggedIn) {
    res.redirect('/')
  } else {
    res.render('users/login', { cartCount, wishCount, "loginErr": req.session.userLoginErr })
    req.session.userLoginErr = false
  }
})

router.post('/login', (req, res, next) => {
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

/* FORGOT PASSWORD */
router.get('/forgot-password', (req, res) => {
  let cartCount = 0;
  let wishCount = 0;
  res.render('users/forgot-password', { cartCount, wishCount, "userData": req.session.userData })
  req.session.userData = false
})

router.post('/forgot-password', async (req, res, next) => {
  try {
    console.log(req.body);
    let userData = await userhelpers.getUserData(req.body.Email)
    req.session.userForgotData = userData
    console.log(userData)
    if (userData) {
      twilioHelpers.sendOtp(userData.Mobile).then((response) => {
        if (response.send) {
          console.log("otp send")
          res.redirect('/otp')
        }
      })
    } else {
      req.session.userData = true
      res.redirect('/forgot-password')
    }
  } catch (error) {
    next(error)
  }
})

router.post('/forgot-change-password', (req, res, next) => {
  try {
    console.log(req.body);
    console.log(req.session.userForgotData);
    userhelpers.changeUserForgottenPassword(req.session.userForgotData._id, req.body.new_password)
      .then((response) => {
        res.json({ changed: true })
      })
  } catch (error) {
    next(error)
  }
})

/* ADD TO CART */
router.get('/add-to-cart/:id', (req, res) => {
  console.log("api called")

  let userId = req.session.user._id
  const prodId = req.params.id
  if (!userId) {
    res.json({ cartAdded: false })
  } else {
    //console.log(userId)
    //console.log(prodId)
    userhelpers.addToCart(prodId, userId).then(() => {
      res.json({ cartAdded: true })
    })
  }
})

/* ADD TO WISHLIST */
router.get('/add-to-wishlist/:id', (req, res, next) => {
  try {
    let prodId = req.params.id
    console.log(prodId)
    let userId = req.session.user._id
    console.log(userId)
    userhelpers.addToWishlist(userId, prodId).then((response) => {
      res.json(response)
    })
  } catch (error) {
    console.log("error")
    res.json({ prodNotAdded: true })
  }
})

/* ALL PRODUCTS PAGE */
router.get('/allProducts', async (req, res) => {
  let page = req.query.page || 0
  console.log("page:", page)
  let prodPerPage = 12
  productFilter = await productHelpers.getAllproducts(page, prodPerPage)
  res.redirect('/shope')
})

router.get('/shope', async (req, res, next) => {
  try {
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
      res.render('users/viewProducts', { user, productFilter, cartCount, wishCount, user, brands, categories })
      searchProducts = null
    } else {
      res.render('users/viewProducts', { user, productFilter, cartCount, wishCount, user, brands, categories })
    }
  } catch (error) {
    next(error)
  }
})

/* SEARCH PRODUCTS */
router.post('/search-product', async (req, res, next) => {
  try {
    console.log(req.body)
    searchProducts = await userhelpers.searchProducts(req.body)
    // console.log(resolve.search)
    // res.json(resolve.search)
    res.json(searchProducts)
  } catch (error) {
    next(error)
  }
})

/* FILTER PRODUCTS */
router.post('/product-filter', async (req, res, next) => {
  try {
    let details = req.body
    console.log("filterDetails:", details)
    let price = parseInt(details.price)
    // let price = details.price
    const brand = [];
    for (const i of details.brandName) {
      brand.push({ brand: i });
    }
    const category = [];
    for (const i of details.categoryName) {
      category.push({ Category: i });
    }
    console.log("categories:", category);
    let products = await userhelpers.filterProducts(category, brand, price)
    // console.log('brand:', brand)
    productFilter = products
    res.json({ status: true })
  } catch (error) {
    next(error)
  }
})

/* NEW PRODUCTS PAGE */
router.get('/newArrivals', async (req, res) => {
  let user = req.session.user;
  let cartCount = 0;
  let wishCount = 0;
  if (user) {
    cartCount = await userhelpers.getCartCount(user._id)
    wishCount = await userhelpers.getWishCount(user._id)
  }
  let newProducts = await productHelpers.getNewArrivalProducts()
  res.render('users/new-arrivals', { newProducts, user, cartCount, wishCount })
})

/* CART PAGE */
router.get('/cart', verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = await userhelpers.getCartCount(user._id)
  let wishCount = await userhelpers.getWishCount(user._id)
  let products = await userhelpers.getCartProducts(user._id)
  let totalValue = 0
  if (cartCount === 0) {
    req.session.total = 0
    res.render('users/empty-cart', { user, cartCount, wishCount })
  } else {
    if (products.length > 0) {
      totalValue = await userhelpers.getTotalAmount(user._id)
    }
    req.session.total = totalValue
    console.log(req.session.total)
    console.log("products", products)
    res.render('users/newcart', { products, cartCount, wishCount, user, totalValue })
  }
})

/* CHANGE PRODUCT QUANTITY */
router.post('/change-product-quantity', (req, res, next) => {
  try {
    console.log(req.body)
    let cartCount = 0
    userhelpers.changeProductQuantity(req.body).then(async (response) => {
      cartCount = await userhelpers.getCartCount(req.body.user)
      if (cartCount > 0) {
        response.total = await userhelpers.getTotalAmount(req.body.user)
        req.session.total = response.total
        response.subTotal = await userhelpers.getProductSubtotal(req.body.product, req.body.user)
      }
      console.log("sesstotal:", req.session.total)
      //response.subtotal = cartProducts.totalPrice
      //console.log("subtotal:",subTotal)
      console.log(response)
      res.json(response)
    })
  } catch (error) {
    next(error)
  }
})

router.get('/remove-product/:id',(req,res,next)=>{
  try{
  let userId = req.session.user._id;
     console.log(req.params.id);
     userhelpers.removeCartProduct(userId,req.params.id).then(()=>{
      res.redirect('/cart')
     })
  }catch(error){
    next(error)
  }
})

/* APPLY COUPON */
router.post('/apply-coupon', async (req, res, next) => {
  try {
    console.log(req.body)
    //let newTotal=100
    let couponCode = req.body.couponCode
    let userId = req.session.user._id
    let totalAmount = await userhelpers.getTotalAmount(userId)
    //console.log(totalValue)
    console.log("coupon:", couponCode)

    userhelpers.getDiscount(couponCode, totalAmount).then((newTotal) => {
      console.log("newtotal:", newTotal)
      req.session.total = newTotal.total
      console.log(("sesstotal", req.session.total));
      //   //res.render('/cart',{newTotal})
      //   //res.redirect('/cart')
      res.json(newTotal)
    })
  } catch (error) {
    next(error)
  }
})

/* WISHLIST PAGE */
router.get('/wishlist', verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = await userhelpers.getCartCount(user._id)
  let wishCount = await userhelpers.getWishCount(user._id)
  if (wishCount === 0) {
    res.render('users/empty-wishlist', { user, cartCount, wishCount })
  } else {
    let products = await userhelpers.getWishlistProducts(user._id)
    res.render('users/wishlist', { products, user, cartCount, wishCount })
  }
})

/* REMOVE WISHLIST PRODUCT */
router.post('/remove-wishlist-product', (req, res, next) => {
  try {
    console.log(req.body)
    userhelpers.removeWishlistProduct(req.body).then((response) => {
      res.json(response)
    })
  } catch (error) {
    next(error)
  }
})

/* CHECKOUT PAGE */
router.get('/checkout', verifyLogin, async (req, res, next) => {
  try {
    let userId = req.session.user._id
    let cartCount = await userhelpers.getCartCount(userId)
    let wishCount = await userhelpers.getWishCount(userId)
    let products = await userhelpers.getCartProducts(userId)
    console.log("products", products)
    if (cartCount === 0) {
      res.redirect('/cart')
    } else {
      let total = req.session.total
      // await userhelpers.getTotalAmount(userId)
      res.render('users/checkout', { total, cartCount, wishCount, userId, user: req.session.user, products })
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

router.post('/checkout', async (req, res, next) => {
  try {
    console.log("place:", req.body.total)
    let userEmail = req.session.user.Email
    console.log("user", userEmail)
    let products = await userhelpers.getCartProductsList(req.body.userId)
    console.log("hi:",products)
    let totalPrice = parseInt(req.body.total)
    
    userhelpers.placeOrder(req.body, products, totalPrice).then(async (orderId) => {
      // console.log("orderId:",orderId)
      if (req.body['payment-method'] == 'COD') {
        for(var i=0;i<products.length;i++){
          
         await userhelpers.adminProductQuantityChange(products[i])
        }
        await mailConnection.sendMail(userEmail)
        res.json({ codSuccess: true })
      } else {
        userhelpers.generateRazorpay(orderId, totalPrice).then((response) => {
          console.log("response:", response)
          res.json(response)
        })
      }
    })
  } catch (error) {
    next(error)
  }
})

/* PAYMENT VERIFY */
router.post('/verify-payment', (req, res) => {
  console.log(req.body)
  let userEmail = req.session.user.Email
  userhelpers.verifyPayment(req.body).then(async (response) => {
    userhelpers.changePaymentStatus(req.body['order[receipt]']).then(async (response) => {
      await mailConnection.sendMail(userEmail)
      console.log("payment successfull")
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false, errmsg: "" })
  })
})

/* ORDER SUCCESS PAGE */
router.get('/order-success', verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = await userhelpers.getCartCount(user._id)
  let wishCount = await userhelpers.getWishCount(user._id)
  res.render('users/order-success', { user, cartCount, wishCount })
})

/* VIEW ORDERS PAGE */
router.get('/view-orders', verifyLogin, async (req, res, next) => {
  try {
    let user = req.session.user;
    let cartCount = await userhelpers.getCartCount(user._id)
    let wishCount = await userhelpers.getWishCount(user._id)
    let orders = await userhelpers.getUserOrders(user._id)
    console.log(orders.length)
    if (orders.length === 0) {
      res.render('users/empty-orders', { user, cartCount, wishCount })
    } else {
      res.render('users/orders', { user, wishCount, cartCount, orders })
    }
  } catch (error) {
    next(error)
  }
})

/* INVOICE PAGE */
router.get('/invoice/:id', async (req, res, next) => {
  try {
    let user = req.session.user;
    let cartCount = await userhelpers.getCartCount(user._id)
    let wishCount = await userhelpers.getWishCount(user._id)
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
    res.render('users/invoice', { cartCount, wishCount, invoiceDeliveryData, invoiceProductsData, total, user })
  } catch (error) {
    next(error)
  }
})

/* VIEW ORDERS PRODUCTS PAGE */
router.get('/view-order-products/:id', async (req, res, next) => {
  try {
    let user = req.session.user;
    let cartCount = await userhelpers.getCartCount(user._id)
    let wishCount = await userhelpers.getWishCount(user._id)
    let orderId = req.params.id
    console.log(orderId)
    let orderItems = await userhelpers.getOrderProductsDetails(orderId)
    console.log("orderItems :", orderItems)
    res.render('users/view-order-details', { user, cartCount, wishCount, orderItems })
  } catch (error) {
    next(error)
  }
})

/*SINGLE PRODUCT DETAILS PAGE */
router.get('/product/:id', async (req, res, next) => {
  try {
    let user = req.session.user;
    let cartCount = 0;
    let wishCount = 0;
    if (user) {
      cartCount = await userhelpers.getCartCount(user._id)
      wishCount = await userhelpers.getWishCount(user._id)
    }
    let prodId = req.params.id
    let product = await productHelpers.getProductDetails(prodId)
    let featured = await productHelpers.getFeaturedProducts(4)
    console.log(product)
    res.render('users/single-product', {featured, product, user, cartCount, wishCount })
  }
  catch (error) {
    next(error)
  }
})

/* SINGLE PRODUCT  BUY */
router.post('/buysingleproduct', async (req, res, next) => {
  try {
    console.log(req.body)
    let userId = req.session.user._id
    console.log(userId)
    let cartcheck = await userhelpers.checkCartProduct(userId, req.body.prodId)
    if (cartcheck == '0') {
      // console.log(cartcheck);
      res.json({ productNotFount: true })
    } else {
      res.json({ productNotFount: false })
    }
  } catch (error) {
    next(error)
  }
})

/* PROFILE PAGE */
router.get('/profile', verifyLogin, async (req, res, next) => {
  try {
    let user = req.session.user;
    let cartCount = await userhelpers.getCartCount(user._id)
    let wishCount = await userhelpers.getWishCount(user._id)
    let userDetails = await userhelpers.getUserDetails(user._id)
    res.render('users/profile-page', { userDetails, user, cartCount, wishCount })
  } catch (error) {
    next(error)
  }
})

/* EDIT PROFILE PAGE */
router.get('/edit-profile', verifyLogin, async (req, res, next) => {
  try {
    let user = req.session.user;
    let cartCount = await userhelpers.getCartCount(user._id)
    let wishCount = await userhelpers.getWishCount(user._id)
    let userDetails = await userhelpers.getUserDetails(user._id)
    res.render('users/profile-edit-page', { userDetails, user, cartCount, wishCount })
  } catch (error) {
    next(error)
  }
})

router.post('/edit-profile', (req, res, next) => {
  try {
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
  } catch (error) {
    next(error)
  }
})

/* CHNAGE PASSWORD */
router.get('/change-password', verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = await userhelpers.getCartCount(user._id)
  let wishCount = await userhelpers.getWishCount(user._id)
  res.render('users/change-password', { user, cartCount, wishCount })
})

router.post('/change-password', (req, res, next) => {
  try {
    console.log(req.body)
    let userId = req.session.user._id
    userhelpers.changePassword(userId, req.body).then((response) => {
      console.log("res:", response)
      res.json(response)
    })
  } catch (error) {
    next(error)
  }
})

/* ABOUT PAGE */
router.get('/about', async (req, res) => {
  let user = req.session.user;
  let cartCount = 0;
  let wishCount = 0;
  if (user) {
    cartCount = await userhelpers.getCartCount(user._id)
    wishCount = await userhelpers.getWishCount(user._id)
  }
  res.render('users/about', { user, cartCount, wishCount })
})

/*CONTACT PAGE */
router.get('/contact', async (req, res) => {
  let user = req.session.user;
  let cartCount = 0;
  let wishCount = 0;
  if (user) {
    cartCount = await userhelpers.getCartCount(user._id)
    wishCount = await userhelpers.getWishCount(user._id)
  }
  res.render('users/contact', { user, cartCount, wishCount })
})

/* LOGOUT */
router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userLoggedIn = false
  res.redirect('/')
})


module.exports = router;