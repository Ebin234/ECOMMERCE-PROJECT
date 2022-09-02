var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

  const product=[{
    name:"iphone 12",
    catagory:"mobile",
    description:"this is a good phone"

  }]
  res.render('index', { product,});
});

module.exports = router;
