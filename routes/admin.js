var express = require('express');
const async = require('hbs/lib/async');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
const adminHelpers = require('../helpers/admin-helpers')
const mailConnection = require('../config/mailConnection');
const path = require('path');
const fs = require('fs');
const { Router } = require('express');
const { response } = require('../app');

const verifyAdminLogin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next()
  } else {
    res.redirect('/admin/login')
  }
}

/* GET users listing. */
router.get('/',verifyAdminLogin, async function(req, res, next) {
  let admin = req.session.admin
  console.log(admin)
  let totalRevenue = 0
   let totalOrders = await adminHelpers.getTotalOrdersCount()
   let totalCustomers = await adminHelpers.getTotalCustomersCount()
   let totalProducts = await adminHelpers.getTotalProductsCount()
   if(totalOrders.length > 0 ){
    totalRevenue = await adminHelpers.getTotalRevenue()
  }
    res.render('admin/admin-Dashboard',{totalOrders,totalCustomers,totalProducts,totalRevenue,admin, adminHeader:true})
  // })
});

router.get('/login',(req,res)=>{
  if (req.session.adminLoggedIn) {
    res.redirect('/admin')
  } else {
    res.render('admin/login', { "adminLoginErr": req.session.adminLoginErr })
    req.session.adminLoginErr = false
  }
})

router.post('/login',(req,res)=>{
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
})

router.get('/logout', (req, res) => {
  req.session.admin = null
  req.session.adminLoggedIn = false
  res.redirect('/admin/login')
})

router.get('/products-details',(req,res)=>{
  productHelpers.getAllproducts().then((products)=>{
    console.log(products)
  res.render('admin/products-details',{products,adminHeader:true})
  })
})


router.get('/add-product',async(req,res)=>{
  let catagories = await adminHelpers.getCategories()
  let brands = await adminHelpers.getBrands()
  res.render('admin/add-product',{brands,catagories, adminHeader:true})
})

// router.get('/add-product2',(req,res)=>{
//   res.render('admin/add-product2',{admin:true})
// })

// router.post('/add-product',(req,res)=>{
//   //console.log(req.body)
//   //console.log(req.files.image)
//   productHelpers.addproduct(req.body,(insertedId)=>{
//    // console.log(insertedId)
//    let image = req.files.image
//    image.mv('./public/product-images/'+insertedId+'.jpg',(err,done)=>{
//     if(!err){
//       res.render('admin/add-product')
//     }else{
//       console.log(err)
//     }
//    })
    
//   })
// })

router.post('/add-product',(req,res)=>{
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
        console.log(err)
      }else{
        subImage1.mv('./public/images/product-images/'+insertedId+'/1'+insertedId+'.jpg',(err,done)=>{
          if(err){
            console.log(err)
          }else{
            subImage2.mv('./public/images/product-images/'+insertedId+'/2'+insertedId+'.jpg',(err,done)=>{
              if(err){
                console.log(err)
              }else{
                subImage3.mv('./public/images/product-images/'+insertedId+'/3'+insertedId+'.jpg',(err,done)=>{
                  if(!err){
                    res.redirect('/admin/products-details')
                  }else{
                    console.log(err)
                  }
                })
              }
            })
          }
        })
      }
    })
    
  })
})

router.get('/delete-product/:id',(req,res)=>{
  const prodId = req.params.id
  //console.log(proId)
  productHelpers.deleteProduct(prodId).then((response)=>{
    //console.log(response)
    res.redirect('/admin/products-details')
  })
})

router.get('/edit-product/:id',async(req,res)=>{
  const prodId = req.params.id
  let product = await productHelpers.getProductDetails(prodId)
  let catagories = await adminHelpers.getCategories()
  let brands = await adminHelpers.getBrands()
  //console.log(product)
  res.render('admin/edit-product',{brands,catagories,product,adminHeader:true})
})

router.post('/edit-product1/:id',(req,res)=>{
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
})


router.get('/create-coupon',(req,res)=>{
  res.render('admin/create-coupon',{adminHeader:true})
})

router.post('/create-coupon',(req,res)=>{
    console.log(req.body);
  productHelpers.createCoupon(req.body).then(()=>{
    res.redirect('/admin')
  })
})


router.get('/coupons',async(req,res)=>{
  let coupons = await productHelpers.getAllCoupons() 
  console.log(coupons);
  res.render('admin/coupon-details',{coupons,adminHeader:true})
})

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

router.get('/delete-coupon/:id',(req,res)=>{
  let couponId = req.params.id
  productHelpers.deleteCoupon(couponId).then(()=>{
    res.redirect('/admin/coupons')
  })
})

router.get('/users-details',async(req,res)=>{
  let users = await userHelpers.getAllUsers()
  console.log(users)
  res.render('admin/users-details',{users,adminHeader:true})
})

router.get('/view-categories',async(req,res)=>{
  let categories = await adminHelpers.getCategories()
  res.render('admin/view-categories',{categories, adminHeader:true})
})

router.post('/add-category',(req,res)=>{
  console.log("body:",req.body)
  adminHelpers.addCategory(req.body).then((response)=>{
    res.json({added:true})
  })
})

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

router.get('/delete-category/:id',(req,res)=>{
  let catId = req.params.id
  console.log(catId)
  adminHelpers.deleteCategory(catId).then(()=>{
    res.redirect('/admin/view-categories')
  })
})

router.get('/view-brands',async(req,res)=>{
  let brands = await adminHelpers.getBrands()
  res.render('admin/view-brands',{brands,adminHeader:true})
})

router.post('/add-brand',(req,res)=>{
  // console.log(req.body)
  adminHelpers.addBrand(req.body).then(()=>{
    res.json({brand:true})
  })
})

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

router.get('/delete-brand/:id',(req,res)=>{
  let brandId = req.params.id
  console.log(brandId)
  adminHelpers.deleteBrand(brandId).then(()=>{
    res.redirect('/admin/view-brands')
  })
})

router.get('/view-orders',async(req,res)=>{
  let orders = await productHelpers.getOrders()
  console.log("allOrders:",orders)
  
  res.render('admin/view-orders',{orders,adminHeader:true})
})

router.post('/change-delivery-status',(req,res)=>{
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
  
})

router.post('/block-user',(req,res)=>{
  // console.log(req.body);
  adminHelpers.blockUser(req.body.userId).then((response)=>{
    res.json({blocked : true})
  })
})

router.post('/unblock-user',(req,res)=>{
  // console.log(req.body);
  adminHelpers.unblockUser(req.body.userId).then((response)=>{
    res.json({unblocked : true})
  })
})


module.exports = router;
