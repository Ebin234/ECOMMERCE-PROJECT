var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const async = require('hbs/lib/async')
const objectId = require('mongodb').ObjectId

module.exports = {
    dosignup: (userdata) => {
        return new Promise(async (resolve, reject) => {
            userdata.Password = await bcrypt.hash(userdata.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userdata)
                .then((data) => {
                    resolve(data.insertedId)
                })
        })
    },
    dologin: (userdata) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION)
                .findOne({ Email: userdata.Email })
            if (user) {
                bcrypt.compare(userdata.Password, user.Password).then((status) => {
                    if (status) {
                        console.log("login success")
                        response.status = true
                        response.user = user
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
        })
    },
    addToCart: (prodId, userId) => {
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION)
                .findOne({ user: objectId(userId) })
            if (userCart) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ user: objectId(userId) }, {
                        $push: { products: objectId(prodId) }
                    }).then(() => {
                        resolve()
                    })
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [objectId(prodId)]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj)
                    .then(() => {
                        resolve()
                    })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartProducts = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        let: { proList: '$products' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ['$_id', "$$proList"]
                                    }
                                }
                            }
                        ],
                        as: 'cartItems'
                    }
                }

            ]).toArray()
            //console.log(cartProducts[0].cartItems)
            resolve(cartProducts[0].cartItems)
        })
    }
}