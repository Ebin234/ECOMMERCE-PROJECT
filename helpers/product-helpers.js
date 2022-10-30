var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectId
module.exports = {
    addproduct : (product,callback)=>{
        console.log(product)
        let proObj = {
            Name : product.Name,
                   Category : product.Category,
                   brand : product.brand,
                   Stoke : parseInt(product.Stoke),
                   Price : parseInt(product.Price),
                   Featured : product.Featured,
                   Description1 : product.Description1,
                   Description2 : product.Description2,
                   Description3 : product.Description3,
                   Description4 : product.Description4,
                   Description5 : product.Description5
        }
        console.log(proObj)
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(proObj).then((data)=>{
            //console.log(data.insertedId)
            callback(data.insertedId)
        })
    
    },
    getAllproducts : (page,prodperpage)=>{
        return new Promise(async(resolve,reject)=>{
            try{
            prodperpage = parseInt(prodperpage)
            let products =await db.get().collection(collection.PRODUCT_COLLECTION)
            .find().sort({$natural:-1}).skip(page*prodperpage).limit(prodperpage).toArray()
            console.log(products)
            resolve(products)
            }catch(error){
                reject(error)
            }
        })
    },
    getFeaturedProducts : (limit)=>{
        return new Promise(async(resolve,reject)=>{
            let featuredProducts = await db.get().collection(collection.PRODUCT_COLLECTION)
            .find({Featured : "Yes"}).sort({$natural:-1}).limit(limit).toArray()
            console.log(featuredProducts)
            resolve(featuredProducts)
        })
    },
    getNewProducts : ()=>{
        return new Promise(async(resolve,reject)=>{
            let newProducts = await db.get().collection(collection.PRODUCT_COLLECTION)
            .find().sort({$natural:-1}).limit(8).toArray()
            console.log(newProducts)
            resolve(newProducts)
        })
    },
    getNewArrivalProducts : ()=>{
        return new Promise(async(resolve,reject)=>{
            let newProducts = await db.get().collection(collection.PRODUCT_COLLECTION)
            .find().sort({$natural:-1}).limit(20).toArray()
            console.log(newProducts)
            resolve(newProducts)
        })
    },
    deleteProduct : (prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(prodId)}).then((response)=>{
                //console.log(response)
                resolve(response)
            })
        })
    },
    getProductDetails : (prodId)=>{
        return new Promise((resolve,reject)=>{
            try{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)})
            .then((response)=>{
                // console.log(response)
                resolve(response)
            
            })
        }catch(error){
            reject(error)
        }
            

        })
    },
    updateProduct : (prodId,prodDetails)=>{
        return new Promise((resolve,reject)=>{
            try{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(prodId)},
            {$set:{
                   Name : prodDetails.Name,
                   Category : prodDetails.Category,
                   brand : prodDetails.brand,
                   Stoke : parseInt(prodDetails.Stoke) ,
                   Price : parseInt(prodDetails.Price),
                   Featured : prodDetails.Featured,
                   Description1 : prodDetails.Description1,
                   Description2 : prodDetails.Description2,
                   Description3 : prodDetails.Description3,
                   Description4 : prodDetails.Description4,
                   Description5 : prodDetails.Description5
                }
            }).then(()=>{
                //console.log(response)
                resolve()
            })
        }catch(error){
            reject(error)
        }
        })
    },
    createCoupon:(details)=>{
        return new Promise((resolve,reject)=>{
            //console.log(details)
            let discountCoupon = {
                name:details.Name,
                code:details.Code,
                discount:details.Discount
            }
            //console.log(discountCoupon)
            db.get().collection(collection.COUPON_COLLECTION)
            .insertOne(discountCoupon).then((response)=>{
                //console.log("res:",response)
                resolve()
            })
        })
    },
    getAllCoupons:()=>{
        return new Promise(async(resolve,reject)=>{
            let coupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            resolve(coupons)
        })
    },
    getCouponDetails : (couponId)=>{
        return new Promise(async(resolve,reject)=>{
            let couponDetails = await db.get().collection(collection.COUPON_COLLECTION)
            .findOne({_id:objectId(couponId)})
            // console.log("coupon:",couponDetails)
            resolve(couponDetails)
        })
    },
    updateCoupon : (couponId,details)=>{
        return new Promise((resolve,reject)=>{
            console.log(couponId)
            console.log(details)
            db.get().collection(collection.COUPON_COLLECTION)
            .updateOne({_id:objectId(couponId)},
            {
                $set:{
                    name:details.Name,
                    code:details.Code,
                    discount:details.Discount

                }
            }).then(()=>{
                resolve()
            })
        })
    },
    deleteCoupon : (couponId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION)
            .deleteOne({_id:objectId(couponId)}).then(()=>{
                resolve()
            })
        })
    },
    getAllUsers : ()=>{
        return new Promise(async(resolve,reject)=>{
            console.log("hi")
        })
    },
    getOrders : ()=>{
        return new Promise(async(resolve,reject)=>{
            try{
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
            .aggregate([
                {
                    $match:{}
                },
                {
                    $unwind : '$products'
                },
                {
                    $lookup : {
                        from : collection.PRODUCT_COLLECTION,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                {
                    $unwind : '$productDetails'
                },
                {
                    $lookup : {
                        from: collection.USER_COLLECTION,
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userDetails'
                    }
                },
                {
                    $unwind : '$userDetails'
                },
                {
                    $sort : { date:-1,time:-1}
                }
            ]).toArray()
            console.log(orders)
            resolve(orders)
        }catch(error){
            reject(error)
        }
        })
    },
    changeDeliveryStatus : (orderId,prodId,paymentStatus)=>{
        return new Promise((resolve,reject)=>{
            try{
            console.log(orderId,prodId,paymentStatus)
           db.get().collection(collection.ORDER_COLLECTION)
            .updateOne(
                {
                    _id : objectId(orderId),
                    products : { $elemMatch : {item : objectId(prodId)}}
                },
                {
                    $set : { "products.$.deliveryStatus": paymentStatus}
                }).then((response)=>{
                    // console.log(response)
                    resolve(response)
                })
            }catch(error){
                reject(error)
            }
        })
    }
}
