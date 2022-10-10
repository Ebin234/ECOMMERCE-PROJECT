var express = require('express');
const async = require('hbs/lib/async');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
const adminHelpers = require('../helpers/admin-helpers')
const mailConnection = require('../config/mailConnection');
const path = require('path');
const fs = require('fs');

const verifyAdminLogin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next()
  } else {
    res.redirect('/admin/login')
  }
}

/* GET ADMIN HOME PAGE */
router.get('/',verifyAdminLogin, async function(req, res, next) {
  let admin = req.session.admin
  try{
  const datas = await Promise.all([
    await adminHelpers.getTotalOrdersCount(),
    await adminHelpers.getTotalCustomersCount(),
    await adminHelpers.getTotalProductsCount(),
    await adminHelpers.getStatus()
  ])
  let totalRevenue = 0
  let totalCodRevenue = 0
  let totalOnlineRevenue = 0
   if(datas[0] > 0 ){
    totalRevenue = await adminHelpers.getTotalRevenue()
    totalCodRevenue = await adminHelpers.getTotalCodRevenue()
    totalOnlineRevenue = await adminHelpers.getTotalOnlineRevenue()
  }
    res.render('admin/admin-Dashboard',{
      orderStatus: datas[3],
      totalOnlineRevenue,
      totalCodRevenue,
      totalOrders: datas[0],
      totalCustomers: datas[1],
      totalProducts: datas[2],
      totalRevenue,
      admin, adminHeader:true})
    }catch(error){
      next(error)
    }
});

/* ADMIN LOGIN PAGE */
router.get('/login',(req,res)=>{
  if (req.session.adminLoggedIn) {
    res.redirect('/admin')
  } else {
    res.render('admin/login', { "adminLoginErr": req.session.adminLoginErr })
    req.session.adminLoginErr = false
  }
})

router.post('/login',(req,res,next)=>{
  try{
  console.log((req.body));
  adminHelpers.adminLogin(req.body).then((response)=>{
    if (response.status) {
      req.session.admin = response.admin
      req.session.adminLoggedIn = true
      res.redirect('/admin')
    } else {
      req.session.adminLoginErr = true
      res.redirect('/admin/login')
    }
  })
}catch(error){
  next(error)
}
})

/* ADD PRODUCT PAGE */
router.get('/add-product',verifyAdminLogin,async(req,res)=>{
  try{
  let catagories = await adminHelpers.getCategories()
  let brands = await adminHelpers.getBrands()
  res.render('admin/add-product',{brands,catagories, adminHeader:true})
  }catch(error){
    next(error)
  }
})

router.post('/add-product',(req,res,next)=>{
  try{
  // console.log(req.body);
  // console.log(req.files.image)
  productHelpers.addproduct(req.body,(insertedId)=>{
    console.log(insertedId)
    fs.mkdir(path.join('./public/images/product-images/',''+insertedId),{},(err)=>{
      if(err) throw err
    })
    let mainImage = req.files.image[0]
    let subImage1 = req.files.image[1]
    let subImage2 = req.files.image[2]
    let subImage3 = req.files.image[3]
    mainImage.mv('./public/images/product-images/'+insertedId+'/0'+insertedId+'.jpg',(err,done)=>{
      if(err){
        throw err
      }else{
        subImage1.mv('./public/images/product-images/'+insertedId+'/1'+insertedId+'.jpg',(err,done)=>{
          if(err){
            throw err
          }else{
            subImage2.mv('./public/images/product-images/'+insertedId+'/2'+insertedId+'.jpg',(err,done)=>{
              if(err){
                throw err
              }else{
                subImage3.mv('./public/images/product-images/'+insertedId+'/3'+insertedId+'.jpg',(err,done)=>{
                  if(!err){
                    res.redirect('/admin/products-details')
                  }else{
                    throw err
                  }
                })
              }
            })
          }
        })
      }
    })
    
  })
}catch(err){
  next(err)
}
})

/* PRODUCT DETAILS PAGE */
router.get('/products-details',verifyAdminLogin,(req,res,next)=>{
  try{
  productHelpers.getAllproducts().then((products)=>{
    console.log(products)
  res.render('admin/products-details',{products,adminHeader:true})
  })
}catch(error){
  next(error)
}
})

/* EDIT PRODUCT PAGE */
router.get('/edit-product/:id',async(req,res,next)=>{
  try{
  const prodId = req.params.id
  let product = await productHelpers.getProductDetails(prodId)
  let catagories = await adminHelpers.getCategories()
  let brands = await adminHelpers.getBrands()
  //console.log(product)
  res.render('admin/edit-product',{brands,catagories,product,adminHeader:true})
  }catch(error){
    next(error)
  }
})

router.post('/edit-product1/:id',(req,res,next)=>{
  try{
  prodId = req.params.id
  // console.log(req.body)
  // console.log(req.files)
   productHelpers.updateProduct(prodId,req.body).then(()=>{
     res.redirect('/admin/products-details')
     if(req.files){
      let mainImage = req.files.image[0]
      let subImage1 = req.files.image[1]
      let subImage2 = req.files.image[2]
      let subImage3 = req.files.image[3]
      //  image.mv('./public/product-images/'+prodId+'.jpg')
      mainImage.mv('./public/images/product-images/'+prodId+'/0'+prodId+'.jpg')
      subImage1.mv('./public/images/product-images/'+prodId+'/1'+prodId+'.jpg')
      subImage2.mv('./public/images/product-images/'+prodId+'/2'+prodId+'.jpg')
      subImage3.mv('./public/images/product-images/'+prodId+'/3'+prodId+'.jpg')
     }
   })
  }catch(error){
    next(error)
  }
})

/* DELETE PRODUCT */
router.get('/delete-product/:id',(req,res)=>{
  const prodId = req.params.id
  //console.log(proId)
  productHelpers.deleteProduct(prodId).then((response)=>{
    //console.log(response)
    res.redirect('/admin/products-details')
  })
})

/* USERS DETAILS PAGE */
router.get('/users-details',verifyAdminLogin,async(req,res)=>{
  let users = await userHelpers.getAllUsers()
  console.log(users)
  res.render('admin/users-details',{users,adminHeader:true})
})

/* USER BLOCK */
router.post('/block-user',(req,res)=>{
  // console.log(req.body);
  adminHelpers.blockUser(req.body.userId).then((response)=>{
    res.json({blocked : true})
  })
})

/* USER UNBLOCK */
router.post('/unblock-user',(req,res)=>{
  // console.log(req.body);
  adminHelpers.unblockUser(req.body.userId).then((response)=>{
   res.json({unblocked : true})
  })
})

/* COUPONS PAGE */
router.get('/coupons',verifyAdminLogin,async(req,res)=>{
  let coupons = await productHelpers.getAllCoupons() 
  console.log(coupons);
  res.render('admin/coupon-details',{coupons,adminHeader:true})
})

/* CREATE COUPON */
router.get('/create-coupon',verifyAdminLogin,(req,res)=>{
  res.render('admin/create-coupon',{adminHeader:true})
})

router.post('/create-coupon',(req,res)=>{
    console.log(req.body);
  productHelpers.createCoupon(req.body).then(()=>{
    res.redirect('/admin')
  })
})

/* EDIT COUPON */
router.get('/edit-coupon/:id',async(req,res)=>{
  couponId = req.params.id
  console.log(couponId)
  let couponDetails = await productHelpers.getCouponDetails(couponId)
  console.log(couponDetails)
  res.render('admin/edit-coupon',{couponDetails,adminHeader:true})
})

router.post('/edit-coupon/:id',(req,res)=>{
  let couponId = req.params.id
  // console.log("couponId:",couponId,"data:",req.body)
  productHelpers.updateCoupon(couponId,req.body).then(()=>{
    res.redirect('/admin/coupons')
  })
})

/* DELETE COUPON */
router.get('/delete-coupon/:id',(req,res)=>{
  let couponId = req.params.id
  productHelpers.deleteCoupon(couponId).then(()=>{
    res.redirect('/admin/coupons')
  })
})

/* VIEW CATEGORIES PAGE */
router.get('/view-categories',verifyAdminLogin,async(req,res)=>{
  let categories = await adminHelpers.getCategories()
  res.render('admin/view-categories',{categories, adminHeader:true})
})

/* ADD CATEGORY */
router.post('/add-category',(req,res)=>{
  console.log("body:",req.body)
  adminHelpers.addCategory(req.body).then((response)=>{
    res.json({added:true})
  })
})

/* EDIT CATEGORY */
router.get('/edit-category/:id',async(req,res)=>{
  let catId = req.params.id
  console.log("catId",catId)
  let catDetails = await adminHelpers.getCategoryDetails(catId)
  console.log("catDetails:",catDetails.name)
  res.json(catDetails.name)
})

router.post('/edit-category',(req,res)=>{
  // console.log("edited data:",req.body)
  let data = req.body.newCategory
  let catId = req.body.catId
  console.log("data:",data,"catId:",catId)
  adminHelpers.updateCategory(catId,data).then(()=>{
    res.json({updated:true})
  })
})

/* DELETE CATEGORY */
router.get('/delete-category/:id',(req,res)=>{
  let catId = req.params.id
  console.log(catId)
  adminHelpers.deleteCategory(catId).then(()=>{
    res.redirect('/admin/view-categories')
  })
})

/* BRANDS PAGE */
router.get('/view-brands',verifyAdminLogin,async(req,res)=>{
  let brands = await adminHelpers.getBrands()
  res.render('admin/view-brands',{brands,adminHeader:true})
})

/* ADD BRAND */
router.post('/add-brand',(req,res)=>{
  // console.log(req.body)
  adminHelpers.addBrand(req.body).then(()=>{
    res.json({brand:true})
  })
})

/* EDIT BRAND */
router.get('/edit-brand/:id',async(req,res)=>{
  let brandId = req.params.id
  console.log("brandId:",brandId)
  let brandDetails = await adminHelpers.getBrandDetails(brandId) 
  console.log("brandData:",brandDetails)
  res.json(brandDetails.name)
})

router.post('/edit-brand',(req,res)=>{
  // console.log(req.body)
  let data = req.body.newBrand
  let brandId = req.body.brandId
  console.log("data:",data,"brandId:",brandId)
  adminHelpers.updateBrand(brandId,data).then(()=>{
    res.json({brandUpdated:true})
  })
})

/* DELETE BRAND */
router.get('/delete-brand/:id',(req,res)=>{
  let brandId = req.params.id
  console.log(brandId)
  adminHelpers.deleteBrand(brandId).then(()=>{
    res.redirect('/admin/view-brands')
  })
})

/* ORDER DETAILS PAGE */
router.get('/view-orders',verifyAdminLogin,async(req,res,next)=>{
  try{
  let orders = await productHelpers.getOrders()
  console.log("allOrders:",orders)
  res.render('admin/view-orders',{orders,adminHeader:true})
  }catch(error){
    next(error)
  }
})

/* CHANGE DELIVERY STATUS */
router.post('/change-delivery-status',(req,res,next)=>{
  try{
  console.log(req.body)
  let deliveryStatus = req.body.data
  let prodId = req.body.prodId
  let orderId =req.body.orderId
  let userEmail = req.body.userEmail
  console.log(deliveryStatus,prodId,orderId,userEmail)
  productHelpers.changeDeliveryStatus(orderId,prodId,deliveryStatus).then(async(response)=>{
    console.log(response)
    await mailConnection.statusMail(userEmail,deliveryStatus)
    res.json({updated:true})
  })
}catch(error){
  next(error)
}
})

/* ADMIN LOGOUT */
router.get('/logout', (req, res) => {
  req.session.admin = null
  req.session.adminLoggedIn = false
  res.redirect('/admin/login')
})

module.exports = router;