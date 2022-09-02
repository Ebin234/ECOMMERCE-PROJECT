var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  const product=[{
    name:"iphone 12",
    catagory:"mobile",
    description:"this is a good phone"

  }]
  res.render('admin/view-products',{product ,admin:true})
});

module.exports = router;
