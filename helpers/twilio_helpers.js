// const { response } = require('../app')

const twilio = require('twilio')(process.env.TWILIO_ACCOUNTSID,process.env.TWILIO_AUTHTOKEN)

module.exports = {
    sendOtp : (mobile)=>{
        return new Promise((resolve,reject)=>{
            twilio.verify.services(process.env.TWILIO_SERVICEID)
            .verifications.create({
                to: `+91${mobile}` ,
                channel : "sms"
            }).then((response)=>{
                // response.send = true
                // console.log("otpresponse:",response)
                resolve(response)
            })
        })
    }
}