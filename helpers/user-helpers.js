var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const async = require('hbs/lib/async')
const { response } = require('../app')
const { promiseCallback } = require('express-fileupload/lib/utilities')
const objectId = require('mongodb').ObjectId
const moment = require('moment')
const Razorpay = require('razorpay')
const { options } = require('../routes/admin')

var instance = new Razorpay({
    key_id: 'rzp_test_9WR1WMwomrKaJa',
    key_secret: 'h2iHzZE8IZM1tSnhdkb6pOuc',
  });

module.exports = {
    dosignup: (userdata) => {
        return new Promise(async (resolve, reject) => {
            userdata.Password = await bcrypt.hash(userdata.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userdata)
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
                        totalPrice:{$multiply:['$quantity',{$toInt:'$product.Price'}]}
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
            console.log(cartProducts)
            resolve(cartProducts)
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
                        total:{$sum:{$multiply:['$quantity',{$toInt:'$product.Price'}]}
                        }
                    }
                }
            ]).toArray()
            console.log(total[0].total)
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
                amount: total,
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
                resolve
             }else{
                reject()
             }
        })
    }
}