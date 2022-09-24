var express = require('express');
const async = require('hbs/lib/async');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
const path = require('path');
const fs = require('fs');
const { Router } = require('express');


/* GET users listing. */
router.get('/', function(req, res, next) {
  // productHelpers.getAllproducts().then((products)=>{
  //   console.log(products)
    res.render('admin/admin-Dashboard',{ admin:true})
  // })
});

router.get('/products-details',(req,res)=>{
  productHelpers.getAllproducts().then((products)=>{
    console.log(products)
  res.render('admin/products-details',{products,admin:true})
  })
})


router.get('/add-product',(req,res)=>{
  res.render('admin/add-product',{admin:true})
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
  //console.log(req.body);
  //console.log(req.files.image)
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
                    res.render('admin/add-product')
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
    res.redirect('/admin')
  })
})

router.get('/edit-product/:id',async(req,res)=>{
  const prodId = req.params.id
  let product = await productHelpers.getProductDetails(prodId)
  //console.log(product)
  res.render('admin/edit-product',{product,admin:true})
})

router.post('/edit-product1/:id',(req,res)=>{
  prodId = req.params.id
  // console.log(req.body)
  // console.log(req.files.image)
   productHelpers.updateProduct(prodId,req.body).then(()=>{
     res.redirect('/admin')
     if(req.files.image){
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
  res.render('admin/create-coupon',{admin:true})
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
  res.render('admin/coupon-details',{coupons,admin:true})
})

router.get('/edit-coupon/:id',async(req,res)=>{
  couponId = req.params.id
  console.log(couponId)
  let couponDetails = await productHelpers.getCouponDetails(couponId)
  console.log(couponDetails)
  res.render('admin/edit-coupon',{couponDetails,admin:true})
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
  res.render('admin/users-details',{users,admin:true})
})

module.exports = router;
