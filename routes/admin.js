var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
  const product=[{
    name:"iphone 12",
    catagory:"mobile",
    description:"this is a good phone"

  }]
  res.render('admin/view-products',{product ,admin:true})
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
module.exports = router;
