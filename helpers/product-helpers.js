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
            console.log(data.insertedId)
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
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(prodId)})
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
            {$set:{Name : prodDetails.Name,
                   Catagory : prodDetails.Catagory,
                   Price : prodDetails.Price,
                   Description : prodDetails.Description}
            }).then(()=>{
                //console.log(response)
                resolve()
            })
        })
    }
}