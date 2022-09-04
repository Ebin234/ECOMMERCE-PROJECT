var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const async = require('hbs/lib/async')

module.exports = {
    dosignup : (userdata)=>{
        return new Promise(async(resolve,reject)=>{
            userdata.password = await bcrypt.hash(userdata.password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userdata)
            .then((data)=>{
                resolve(data.insertedId)
            })
        })
    }
}