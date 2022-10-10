var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('../app')
const async = require('hbs/lib/async')
const { NetworkContext } = require('twilio/lib/rest/supersim/v1/network')
// const { Promise } = require('mongodb')
const objectId = require('mongodb').ObjectId


module.exports = {
    adminLogin : (data)=>{
        return new Promise(async(resolve,reject)=>{
            try{
            let loginStatus = false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION)
                .findOne({email : data.Email})
            if (admin) {
                bcrypt.compare(data.Password, admin.password).then((status) => {
                    if (status) {
                        console.log("login success")
                        response.status = true
                        response.admin = admin
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
        }catch(error){
            reject(error)
        }
        })
    },
    addCategory: (data) => {
        return new Promise((resolve, reject) => {
            let obj = {
                name: data.category
            }
            console.log(obj)
            db.get().collection(collection.CATEGORY_COLLECTION)
                .insertOne(obj).then((response) => {
                    console.log(response)
                    resolve(response)
                })
        })

    },
    getCategories : ()=>{
        return new Promise(async(resolve,reject)=>{
            try{
            let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            console.log("cat:",categories)
            resolve(categories)
            }catch(error){
                reject(error)
            }
        })
    },
    getCategoryDetails :(catId)=>{
        return new Promise(async(resolve,reject)=>{
            let catDetails = await db.get().collection(collection.CATEGORY_COLLECTION)
            .findOne({_id:objectId(catId)})
            // console.log(catDetails)
            resolve(catDetails)
        })
    },
    updateCategory : (catId,data)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION)
            .updateOne({_id:objectId(catId)},
            {
                $set : {
                    name : data
                }
            }).then((response)=>{
                console.log(response)
                resolve()
            })
        })
    },
    deleteCategory : (catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION)
            .deleteOne({_id:objectId(catId)}).then((response)=>{
                console.log(response)
                resolve()
            })
        })
    },
    addBrand : (data)=>{
        return new Promise((resolve,reject)=>{
            // console.log("brand data:",data)
            let brand = {
                name : data.brand
            }
            console.log(brand)
            db.get().collection(collection.BRAND_COLLECTION).insertOne(brand)
            .then((response)=>{
                console.log(response)
                resolve()
            })
        })
    },
    getBrands : ()=>{
        return new Promise(async(resolve,reject)=>{
            try{
            let brands = await db.get().collection(collection.BRAND_COLLECTION).find().toArray()
            console.log(brands)
            resolve(brands)
            }catch(error){
                reject(error)
            }
        })
    },
    getBrandDetails : (brandId)=>{
        return new Promise(async(resolve,reject)=>{
            let brandDetails = await db.get().collection(collection.BRAND_COLLECTION)
            .findOne({_id:objectId(brandId)})
            // console.log(brandDetails)
            resolve(brandDetails)
        })
    },
    updateBrand : (brandId,brandName)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BRAND_COLLECTION)
            .updateOne({_id:objectId(brandId)},
            {
                $set : {name : brandName}
            }).then((response)=>{
                console.log(response)
                resolve()
            })
        })
    },
    deleteBrand : (brandId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BRAND_COLLECTION)
            .deleteOne({_id:objectId(brandId)}).then((response)=>{
                console.log(response)
                resolve()
            })
        })
    },
    getTotalOrdersCount : ()=>{
        return new Promise(async(resolve,reject)=>{
            try{
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
            .find({status:"placed"}).toArray()
            console.log(orders.length)
            resolve(orders.length)
            }catch(error){
                reject(error)
            }
        })
    },
    getTotalCustomersCount : ()=>{
        return new Promise(async(resolve,reject)=>{
            try{
            let customers = await db.get().collection(collection.USER_COLLECTION)
            .find().toArray()
            console.log(customers.length)
            resolve(customers.length)
            }catch(error){
                reject(error)
            }
        })
    },
    getTotalProductsCount : ()=>{
        return new Promise(async(resolve,reject)=>{
            try{
            let products = await db.get().collection(collection.PRODUCT_COLLECTION)
            .find().toArray()
            console.log(products.length)
            resolve(products.length)
            }catch(error){
                reject(error)
            }
        })
    },
    getTotalRevenue : ()=>{
        return new Promise(async(resolve,reject)=>{
            try{
            let revenue = await db.get().collection(collection.ORDER_COLLECTION)
            .aggregate([
                {
                    $match : {
                        status : "placed"
                    }
                },
                {
                    $group : {
                        _id : null,
                        totalRevenue : {
                            $sum : "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            console.log(revenue[0].totalRevenue)
            resolve(revenue[0].totalRevenue)
        }catch(error){
            reject(error)
        }
        })
    },
    getTotalCodRevenue : ()=>{
        return new Promise(async(resolve,reject)=>{
            try{
            let revenue = await db.get().collection(collection.ORDER_COLLECTION)
            .aggregate([
                {
                    $match : {
                        status : "placed"
                    }
                },
                {
                    $match : {
                        paymentMethod : "COD"
                    }
                },
                {
                    $group : {
                        _id : null,
                        totalRevenue : {
                            $sum : "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            console.log(revenue)
            if(revenue.length>0){
            resolve(revenue[0].totalRevenue)
            }else{
                resolve(0)
            }
        }catch(error){
            reject(error)
        }
        })
    },
    getTotalOnlineRevenue : ()=>{
        return new Promise(async(resolve,reject)=>{
            try{
            let revenue = await db.get().collection(collection.ORDER_COLLECTION)
            .aggregate([
                {
                    $match : {
                        status : "placed"
                    }
                },
                {
                    $match : {
                        paymentMethod : "ONLINE"
                    }
                },
                {
                    $group : {
                        _id : null,
                        totalRevenue : {
                            $sum : "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            console.log("rev",revenue.length)
            if(revenue.length>0){
            resolve(revenue[0].totalRevenue)
            }else{
                resolve(0)
            }
        }catch(error){
            reject(error)
        }
        })
    },
    getStatus : ()=>{
        let orderStatus = []
        return new Promise(async(resolve,reject)=>{
            try{
            let pendingProducts = await db.get().collection(collection.ORDER_COLLECTION)
            .aggregate([
                {
                    $match : {status : 'placed'}
                },
                {
                    $unwind : '$products'
                },
                {
                    $match : {'products.deliveryStatus' : 'pending'}
                }
            ]).toArray()
            console.log(pendingProducts.length);
            orderStatus.push(pendingProducts.length)
            console.log(orderStatus)

            let shippedProducts = await db.get().collection(collection.ORDER_COLLECTION)
            .aggregate([
                {
                    $match : {status : 'placed'}
                },
                {
                    $unwind : '$products'
                },
                {
                    $match : {'products.deliveryStatus' : 'Shipped'}
                }
            ]).toArray()
            console.log(shippedProducts.length);
            orderStatus.push(shippedProducts.length)
            console.log(orderStatus)

            let deliveredProducts = await db.get().collection(collection.ORDER_COLLECTION)
            .aggregate([
                {
                    $match : {status : 'placed'}
                },
                {
                    $unwind : '$products'
                },
                {
                    $match : {'products.deliveryStatus' : 'Delivered'}
                }
            ]).toArray()
            console.log(deliveredProducts);
            orderStatus.push(deliveredProducts.length)
            console.log(orderStatus)

            let cancelledProducts = await db.get().collection(collection.ORDER_COLLECTION)
            .aggregate([
                {
                    $match : {status : 'pending'}
                },
                {
                    $unwind : '$products'
                }
            ]).toArray()
            console.log(cancelledProducts.length);
            orderStatus.push(cancelledProducts.length)
            console.log(orderStatus)
            resolve(orderStatus)
            }catch(error){
                reject(error)
            }
        })
    },
    blockUser : (userId)=>{
        return new Promise((resolve,reject)=>{
            console.log(userId)
            db.get().collection(collection.USER_COLLECTION)
            .updateOne(
                {
                    _id : objectId(userId)
                },
                {
                    $set : {
                        Blocked : true
                    }
                }
            ).then((response)=>{
                console.log(response)
                resolve(response)
            })
        })
    },
    unblockUser : (userId)=>{
        return new Promise((resolve,reject)=>{
            console.log(userId);
        db.get().collection(collection.USER_COLLECTION)
        .updateOne(
            {
                _id : objectId(userId)
            },
            {
                $set : {
                    Blocked : false
                }
            }
        ).then((response)=>{
            console.log(response)
            resolve(response)
        })
        })
    }
}