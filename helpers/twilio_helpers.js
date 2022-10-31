const twilio = require('twilio')("ACb5c4534ef70c46fe65c406b86118d0d2","f696223e9c5156bf556e06b814d0cf4e")
// process.env.TWILIO_AUTHTOKEN

module.exports = {
    sendOtp : (mobile)=>{
        return new Promise((resolve,reject)=>{
            console.log(mobile)
            let response = {}
            twilio.verify.services("VA7d74874803e6297118560be05d563ce4")
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
            twilio.verify.services("VA7d74874803e6297118560be05d563ce4")
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