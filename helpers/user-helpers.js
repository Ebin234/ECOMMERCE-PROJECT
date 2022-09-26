var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const async = require('hbs/lib/async')
const { response } = require('../app')
const { promiseCallback } = require('express-fileupload/lib/utilities')
const objectId = require('mongodb').ObjectId
const moment = require('moment')
const Razorpay = require('razorpay')
// const { options } = require('../routes/admin')
const { resolve } = require('path')

var instance = new Razorpay({
    key_id: 'rzp_test_9WR1WMwomrKaJa',
    key_secret: 'h2iHzZE8IZM1tSnhdkb6pOuc',
  });

module.exports = {
    dosignup: (userdata) => {
        return new Promise(async (resolve, reject) => {
            // console.log(userdata)
            let d = new Date()
            let date = moment(d).format('YYYY-MM-DD');
            let time = moment(d).format('HH:MM:SS')
            userdata.Password = await bcrypt.hash(userdata.Password, 10)
            let userObj = {
                Name : userdata.Name,
                Email : userdata.Email,
                Mobile : userdata.Mobile,
                Date : date,
                Time : time,
                Password : userdata.Password
            }
            console.log("userObj:",userObj)
            db.get().collection(collection.USER_COLLECTION).insertOne(userObj)
                .then((data) => {
                    resolve(data.insertedId)
                })
        })
    },
    dologin: (userdata) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION)
                .findOne({ Email: userdata.Email })
            if (user) {
                bcrypt.compare(userdata.Password, user.Password).then((status) => {
                    if (status) {
                        console.log("login success")
                        response.status = true
                        response.user = user
                        resolve(response)
                    } else {
                        console.log("login failed")
                        resolve({ status: false })
                    }
                })
            } else {
                console.log("login failed")
                resolve({ status: false })
            }
        })
    },
    addToCart: (prodId, userId) => {
        return new Promise(async (resolve, reject) => {
            let prodObj = {
                item : objectId(prodId),
                quantity : 1
            }
            let userCart = await db.get().collection(collection.CART_COLLECTION)
                .findOne({ user: objectId(userId) })
            if (userCart) {
                let prodExist = userCart.products.findIndex(product => product.item == prodId)
                console.log(prodExist)
                if(prodExist != -1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:objectId(userId),'products.item': objectId(prodId)},
                    {
                        $inc : {'products.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve()
                    })
                }else{
                 db.get().collection(collection.CART_COLLECTION)
                     .updateOne({ user: objectId(userId) }, {
                         $push: { products:prodObj }
                     }).then(() => {
                         resolve()
                     })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj)
                    .then(() => {
                        resolve()
                    })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartProducts = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                 },
                 {
                    $unwind:'$products'
                 },
                 {
                    $project : {
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                 },
                 {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                 },
                 {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                 },
                 {
                    $addFields:{
                        totalPrice:{$multiply:['$quantity',{$toInt:'$product.Price'}]},
                        // subtotalId:'$product._id'
                    }
                 }
                 //{
                //     $lookup: {
                //         from: collection.PRODUCT_COLLECTION,
                //         let: { proList: '$products' },
                //         pipeline: [
                //             {
                //                 $match: {
                //                     $expr: {
                //                         $in: ['$_id', "$$proList"]
                //                     }
                //                 }
                //             }
                //         ],
                //         as: 'cartItems'
                //     }
                // }

            ]).toArray()
            console.log("cart:",cartProducts)
            resolve(cartProducts)
        })
    },
    getProductSubtotal : (prodId)=>{
        return new Promise(async(resolve,reject)=>{
            // console.log("prodId:",prodId)
           let totalPrice = await db.get().collection(collection.CART_COLLECTION)
            .aggregate([
                {
                    $match:{'products.item' : objectId(prodId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project : {
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                 },
                 {
                    $match : {item:objectId(prodId)}
                 },
                 {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'productDetails'
                    }
                 },
                 {
                    $unwind: '$productDetails'
                 },
                 {
                    $addFields:{
                        totalPrice:{$multiply:['$quantity',{$toInt:'$productDetails.Price'}]}
                    }
                 },
                 {
                    $project:{
                        totalPrice:1
                    }
                 }
                //  {
                //     $project:{
                //         item:1,
                //         quantity:1,
                //         productDetails:{$arrayElemAt:['$product',0]}
                //     }
                //  }
            ]).toArray()

            // console.log("subtotal:",totalPrice[0].totalPrice)
            resolve(totalPrice[0].totalPrice)
        })
    },
    getCartCount : (userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count = 0;
           let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user : objectId(userId)})
           console.log(cart)
           if(cart){
           count = cart.products.length
           console.log(count)
           }
           resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
        console.log(details)
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }
              ).then((response)=>{
                console.log(response)
                resolve({removeProduct:true})
              })
            }else{
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:objectId(details.cart),'products.item': objectId(details.product)},
            {
                $inc : {'products.$.quantity':details.count}
             }
            ).then((response)=>{
                console.log(response)
                resolve({status:true})
            })
        }
        })
    },
    getTotalAmount : (userId)=>{
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                 },
                 {
                    $unwind:'$products'
                 },
                 {
                    $project : {
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                 },
                 {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                 },
                 {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        // _id:'$totalPrice',
                        // total:{$sum:'$totalPrice'}
                        // totalPrice:{$multiply:['$quantity',{$toInt:'$product.Price'}]},
                        total:{$sum:{$multiply:['$quantity',{$toInt:'$product.Price'}]}
                        }
                    }
                }
                // {
                //     $addFields:{
                //         totalPrice:{$multiply:['$quantity',{$toInt:'$product.Price'}]}
                //     }
                //  },
            ]).toArray()
            console.log("total:",total)
           resolve(total[0].total)
        })
    },
    getCartProductsList : (userId)=>{
        return new Promise(async(resolve,reject)=>{
          let cart = await db.get().collection(collection.CART_COLLECTION)
            .findOne({user:objectId(userId)})
            resolve(cart.products)
        })
    },
    placeOrder : (order,products,total)=>{
        return new Promise((resolve,reject)=>{
            console.log(order,products,total)
            let status = order['payment-method'] ==='COD'?'placed':'pending'
            let d = new Date()
            let date = moment(d).format('YYYY-MM-DD');
            let time = moment(d).format('HH:MM:SS')
            //console.log(status)
            let orderObj = {
                deliveryDetails : {
                    fullName : order.Name,
                    address : order.address,
                    city : order.city,
                    state : order.state,
                    pincode : order.pincode,
                    mobile : order.mobile
                },
                userId : objectId(order.userId),
                paymentMethod : order['payment-method'],
                products : products,
                totalAmount : total,
                status : status,
                date : date,
                time : time
            }
           // console.log('orderObj',orderObj)

           db.get().collection(collection.ORDER_COLLECTION)
           .insertOne(orderObj).then((response)=>{
            db.get().collection(collection.CART_COLLECTION)
            .deleteOne({user:objectId(order.userId)})
            //console.log(response.insertedId)
            resolve(response.insertedId)
           })
        })
    },
    getUserOrders : (userId)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(userId)
            let orders =await db.get().collection(collection.ORDER_COLLECTION)
            .find({userId:objectId(userId)}).sort({date:-1,time:-1}).toArray()
            console.log(orders)
            resolve(orders)
        })
    },
    getOrderProductsDetails : (orderId)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(orderId)
            let orderItems =await db.get().collection(collection.ORDER_COLLECTION)
            .aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:"$products"
                },
                {
                    $lookup:{
                        from: collection.PRODUCT_COLLECTION,
                        localField: "products.item",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                {
                    $unwind: "$productDetails"
                },
                {
                    $project: {
                        deliveryDetails: 1,
                        productName: "$productDetails.Name",
                        catagory: "$productDetails.Catagory",
                        date: 1,
                        time: 1,
                        status: 1,
                        price: "$productDetails.Price",
                        quantity: "$products.quantity",
                        product: "$products.item",
                        brand: "$productDetails.brand"
                    }
                }
            ]).toArray()
            //console.log(orderItems)
            resolve(orderItems)
        })
    },
    generateRazorpay: (orderId,total)=>{
        return new Promise((resolve,reject)=>{
            console.log(orderId)
            var options = {
                amount: total*100,
                currency: "INR",
                receipt: ""+orderId
            };
            instance.orders.create(options,function(err, order){
                if(err){
                    console.log("err:",err)
                }else{
                    console.log("new order:",order);
                    resolve(order)
                }
              })
        })
    },
    verifyPayment : (details)=>{
        return new Promise((resolve,reject)=>{
            console.log("details:",details)
            const crypto = require('crypto')
            let body = details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']
            var expectedSignature = crypto.createHmac('sha256', 'h2iHzZE8IZM1tSnhdkb6pOuc')
             .update(body.toString())
             .digest('hex');

             console.log("sig recieved :",details['payment[razorpay_signature]']);
             console.log("sig generated :",expectedSignature);
             if(expectedSignature===details['payment[razorpay_signature]']){
                resolve()
             }else{
                reject()
             }
        })
    },
    changePaymentStatus : (orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    getDiscount : (code,total)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(code,total)
            let discountRate = await db.get().collection(collection.COUPON_COLLECTION)
            .aggregate([
                {
                    $match:{name:code}
                },
            ]).toArray()
            console.log("output:",discountRate[0].name)
            let discount = parseFloat(discountRate[0].discount)
            //console.log(typeof discount)
            // console.log(discount)
            let newTotal = { total : total - ((total*discount)/100),
            code : discountRate[0].name
        }
             console.log("out:",newTotal)
             resolve(newTotal)
        })
    },
    getAllUsers : ()=>{
        return new Promise(async(resolve,reject)=>{
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            // console.log(users)
            resolve(users)
        })
    },
    updateUserDetails : (userId,details)=>{
        return new Promise((resolve,reject)=>{
            console.log(details)
            db.get().collection(collection.USER_COLLECTION)
            .updateOne({_id:objectId(userId)},
            {
                $set : {
                    Name : details.Name,
                    Email : details.Email,
                    Address : details.Address,
                    Pincode : details.Pincode,
                    Username : details.Username,
                    Mobile : details.Mobile,
                    State : details.State,
                    District : details.District
                }
            }).then((response)=>{
                // console.log(response)
                resolve()
            })
        })
    },
    getUserDetails : (userId)=>{
        return new Promise(async(resolve,reject)=>{
            let userDetails = await db.get().collection(collection.USER_COLLECTION)
            .findOne({_id:objectId(userId)})
            console.log(userDetails)
            resolve(userDetails)
        })
    },
    changePassword : (userId,details) =>{
        return new Promise(async(resolve,reject)=>{
            // details.old_password = await bcrypt.hash(details.old_password, 10)
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
            console.log(details)
            bcrypt.compare(details.old_password, user.Password).then(async(response)=>{
                console.log('respo:',response)
                if(response){
                    let newPassword = await bcrypt.hash(details.new_password, 10)
                    db.get().collection(collection.USER_COLLECTION)
                    .updateOne({_id:objectId(userId)},
                    {
                        $set : {
                            Password : newPassword
                        }
                    }).then((response)=>{
                        console.log(response)
                        resolve({response:true})
                    })
                }else{
                    resolve({response:false})
                }
            })
        })
    }
}