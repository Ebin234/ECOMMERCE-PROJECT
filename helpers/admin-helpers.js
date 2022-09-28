var db = require('../config/connection')
var collection = require('../config/collections')
const { response } = require('../app')
const async = require('hbs/lib/async')
// const { Promise } = require('mongodb')
const objectId = require('mongodb').ObjectId


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

    },
    getCategories : ()=>{
        return new Promise(async(resolve,reject)=>{
            let catagories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            console.log("cat:",catagories)
            resolve(catagories)
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
    }
}