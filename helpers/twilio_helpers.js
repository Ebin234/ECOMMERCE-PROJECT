const twilio = require('twilio')(process.env.TWILIO_ACCOUNTSID,process.env.TWILIO_AUTHTOKEN)

module.exports = {
    sendOtp : (mobile)=>{
        return new Promise((resolve,reject)=>{
            let response = {}
            twilio.verify.services(process.env.TWILIO_SERVICEID)
            .verifications.create({
                to: `+91${mobile}` ,
                channel : "sms"
            }).then((response)=>{
                response.send = true
                console.log("otpresponse:",response)
                resolve(response)
            })
            .catch(error => resolve(error))
        })
    },
    verifyOtp : (mobile,verifycode)=>{
        return new Promise((resolve,reject)=>{
            twilio.verify.services(process.env.TWILIO_SERVICEID)
            .verificationChecks.create({
                to: `+91${mobile}` ,
                code : verifycode
            }).then((response)=>{
                console.log("otp response:",response)
                resolve(response)
            })
        })
    }
}