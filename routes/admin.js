var express = require('express');
const async = require('hbs/lib/async');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
const path = require('path');
const fs = require('fs');

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelpers.getAllproducts().then((products)=>{
    console.log(products)
    res.render('admin/all-products',{products ,admin:true})
  })
});


router.get('/add-product',(req,res)=>{
  res.render('admin/add-product2',{admin:true})
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
  res.render('admin/editproduct1',{product})
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

router.get('/allproducts',(req,res)=>{
  productHelpers.getAllproducts().then((products)=>{
    console.log(products)
    res.render('admin/all-products',{products,admin:true})
  })
  
})

router.get('/create-coupon',(req,res)=>{
  res.render('admin/create-coupon')
})

module.exports = router;
