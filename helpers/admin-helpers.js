var db = require('../config/connection')
var collection = require('../config/collections')
const { response } = require('../app')
var objectId = require('mongodb').ObjectId


module.exports = {
    addCategory : (data)=>{
        let obj = {
            name : data.category
        }
        console.log(obj)
        db.get().collection(collection.CATEGORY_COLLECTION)
        .insertOne(obj).then((response)=>{
            console.log(response)
        })
    }
}