var db = require('../config/connection')
var collection = require('../config/collections')
const { response } = require('../app')
// const { Promise } = require('mongodb')
var objectId = require('mongodb').ObjectId


module.exports = {
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

    }
}