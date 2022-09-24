var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectId
const async = require('hbs/lib/async')
const { response } = require('../app')
const { ObjectId } = require('mongodb')
module.exports = {
    addproduct : (product,callback)=>{
        console.log(product)
        db.get().collection('product').insertOne(product).then((data)=>{
            //console.log(data.insertedId)
            callback(data.insertedId)
        })
    },
    getAllproducts : ()=>{
        return new Promise(async(resolve,reject)=>{
            let products =await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            //console.log(products)
            resolve(products)
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
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)})
            .then((response)=>{
                //console.log(response)
                resolve(response)
            })
            

        })
    },
    updateProduct : (prodId,prodDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(prodId)},
            {$set:{
                   Name : prodDetails.Name,
                   Catagory : prodDetails.Catagory,
                   brand : prodDetails.brand,
                   Stoke : prodDetails.Stoke,
                   Price : prodDetails.Price,
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
    }
}