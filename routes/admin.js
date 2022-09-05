var express = require('express');
const async = require('hbs/lib/async');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelpers.getAllproducts().then((products)=>{
    console.log(products)
    res.render('admin/view-products',{products ,admin:true})
  })
});

router.get('/add-product',(req,res)=>{
  res.render('admin/add-product')
})

router.post('/add-product',(req,res)=>{
  //console.log(req.body)
  //console.log(req.files.image)
  productHelpers.addproduct(req.body,(insertedId)=>{
   // console.log(insertedId)
   let image = req.files.image
   image.mv('./public/product-images/'+insertedId+'.jpg',(err,done)=>{
    if(!err){
      res.render('admin/add-product')
    }else{
      console.log(err)
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
  prodId = req.params.id
  let product = await productHelpers.getProductDetails(prodId)
  //console.log(product)
  res.render('admin/edit-product',{product})
})

router.post('/edit-product/:id',(req,res)=>{
  prodId = req.params.id
  productHelpers.updateProduct(prodId,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.image){
      let image = req.files.image
      image.mv('./public/product-images/'+prodId+'.jpg')
    }
  })
})

module.exports = router;
