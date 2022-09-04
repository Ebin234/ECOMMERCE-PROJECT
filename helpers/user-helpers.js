var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const async = require('hbs/lib/async')

module.exports = {
    dosignup : (userdata)=>{
        return new Promise(async(resolve,reject)=>{
            userdata.Password = await bcrypt.hash(userdata.Password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userdata)
            .then((data)=>{
                resolve(data.insertedId)
            })
        })
    },
    dologin : (userdata)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION)
            .findOne({Email : userdata.Email})
            if(user){
                bcrypt.compare(userdata.Password,user.Password).then((status)=>{
                    if(status){
                        console.log("login success")
                    }else{
                        console.log("login failed")
                    }
                })
            }else{
                console.log("login failed")
            }
        })
    }
}