var express = require('express');
const async = require('hbs/lib/async');
const { response } = require('../app');
const mailConnection = require('../config/mailConnection');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const userhelpers = require('../helpers/user-helpers')
const twilioHelpers = require('../helpers/twilio_helpers')
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
  productHelpers.getAllproducts().then((products) => {
    res.render('users/home-page', { products, user, cartCount, wishCount });
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

router.post('/login', (req, res) => {
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
  res.render('users/signup', { "userErr": req.session.userExist })
  req.session.userExist = false
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
          res.redirect('/signup')
        }
      })
      // req.session.userExist = false
      // res.json(response)
    }
    // userhelpers.dosignup(req.body).then((response) => {
    //   console.log(response)
    //   req.session.user = response
    //   req.session.userLoggedIn = true
    //   res.redirect('/')
  })
})

router.get('/otp', (req, res) => {
  res.render('users/otp')
})

router.post('/otp', (req, res) => {
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
      }
    })
})

router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userLoggedIn = false
  res.redirect('/')
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
  //console.log(userId)
  //console.log(prodId)
  userhelpers.addToCart(prodId, userId).then(() => {
    // res.redirect('/')
    res.json({ cartAdded: true })
  })
})

router.get('/allProducts', async (req, res) => {
  let user = req.session.user
  let cartCount = 0;
  let wishCount = 0;
  if (user) {
    cartCount = await userhelpers.getCartCount(user._id)
    wishCount = await userhelpers.getWishCount(user._id)
  }
  productFilter = await productHelpers.getAllproducts()

  // res.render('users/viewProducts',{products,user,cartCount,wishCount})
  res.redirect('/shope')

})

router.get('/product/:id', async (req, res) => {
  let prodId = req.params.id
  let product = await productHelpers.getProductDetails(prodId)
  console.log(product)

  res.render('users/single-product', { product })
})

router.get('/about', (req, res) => {
  res.render('users/about')
})

router.get('/contact', (req, res) => {
  res.render('users/contact')
})

router.post('/change-product-quantity', (req, res, next) => {
  console.log(req.body)
  userhelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userhelpers.getTotalAmount(req.body.user)
    response.subTotal = await userhelpers.getProductSubtotal(req.body.product)
    //console.log(cartProducts)
    //response.subtotal = cartProducts.totalPrice
    //console.log("subtotal:",subTotal)
    console.log(response)
    res.json(response)
  })
})

router.get('/checkout', verifyLogin, async (req, res) => {
  user = req.session.user
  let total = await userhelpers.getTotalAmount(user._id)
  res.render('users/checkout', { total, user })

})

router.get('/checkout/:id', (req, res) => {
  let total = req.params.id
  let user = req.session.user
  console.log("total:", total)
  res.render('users/checkout', { total, user })
})

router.post('/checkout', async (req, res) => {
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
  }).catch((err) => {
    console.log(err)
    res.json({ status: false, errmsg: '' })
  })
})

router.get('/order-success', (req, res) => {
  res.render('users/order-success', { user: req.session.user })
})

router.get('/view-orders', async (req, res) => {
  let orders = await userhelpers.getUserOrders(req.session.user._id)
  console.log(orders)
  res.render('users/orders', { user: req.session.user, orders })
})

router.get('/view-order-products/:id', async (req, res) => {
  let orderId = req.params.id
  console.log(orderId)
  let orderItems = await userhelpers.getOrderProductsDetails(orderId)
  console.log("orderItems :", orderItems)
  res.render('users/view-order-details', { user: req.session.user, orderItems })
})
// router.get('/orders',async(req,res)=>{
//   let orders = await userhelpers.getUserOrders(req.session.user._id)
//   res.render('users/order-details',{user:req.session.user,orders})
// })

router.post('/apply-coupon', async (req, res) => {
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
})

router.get('/profile', async (req, res) => {
  let userId = req.session.user._id
  let userDetails = await userhelpers.getUserDetails(userId)
  res.render('users/profile-page', { userDetails })
})


router.get('/edit-profile', async (req, res) => {
  let userId = req.session.user._id
  let userDetails = await userhelpers.getUserDetails(userId)
  res.render('users/profile-edit-page', { userDetails })
})

router.post('/edit-profile', (req, res) => {
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
})

router.get('/change-password', (req, res) => {
  res.render('users/change-password')
})

router.post('/change-password', (req, res) => {
  console.log(req.body)
  let userId = req.session.user._id
  userhelpers.changePassword(userId, req.body).then((response) => {
    console.log("res:", response)
    res.json(response)
  })
})

router.get('/add-to-wishlist/:id', (req, res) => {
  let prodId = req.params.id
  let userId = req.session.user._id
  console.log(prodId)
  userhelpers.addToWishlist(userId, prodId).then((response) => {
    res.json(response)
  })
})

router.get('/wishlist', async (req, res) => {
  let userId = req.session.user._id
  let products = await userhelpers.getWishlistProducts(userId)
  res.render('users/wishlist', { products, user: req.session.user._id })
})

router.post('/remove-wishlist-product', (req, res) => {
  console.log(req.body)
  userhelpers.removeWishlistProduct(req.body).then((response) => {
    res.json(response)
  })
})

router.post('/search-product', async (req, res) => {
  console.log(req.body)
  searchProducts = await userhelpers.searchProducts(req.body)
  // console.log(resolve.search)
  // res.json(resolve.search)
  res.json(searchProducts)
})

router.get('/shope', async (req, res) => {
  console.log("searchproducts:", searchProducts)
  let user = req.session.user
  let cartCount = 0;
  let wishCount = 0;
  if (user) {
    cartCount = await userhelpers.getCartCount(user._id)
    wishCount = await userhelpers.getWishCount(user._id)
  }
  if (searchProducts) {
    productFilter = searchProducts;
    res.render('users/viewProducts', { productFilter, cartCount, wishCount, user })
    searchProducts = null
  } else {
    res.render('users/viewProducts', { productFilter, cartCount, wishCount, user })
  }

})

router.post('/product-filter', async (req, res) => {
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


})

router.get('/invoice/:id', async (req, res) => {
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
  res.render('users/invoice', { invoiceDeliveryData, invoiceProductsData, total })
})


// router.post('/invoice',async(req,res)=>{
//   let orderId = req.body.orderId
//   console.log(orderId)
//   let invoiceDeliveryData = await userhelpers.getInvoiceDeliveryData(orderId)
//   let invoiceProductsData = await userhelpers.getInvoiceProductsData(orderId)





//    res.json()
// })


module.exports = router;
