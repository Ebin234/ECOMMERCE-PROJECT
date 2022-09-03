var db = require('../config/connection')
var collection = require('../config/collections')
const async = require('hbs/lib/async')
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
    }
}