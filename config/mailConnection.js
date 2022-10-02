const nodeMailer = require('nodemailer');
// const dotenv = require('dotenv')
// const { options, response } = require('../app');

module.exports = {
    sendMail : (recieverEmail)=>{
        require("dotenv").config()
        // console.log("user:",process.env.NODEMAILER_USER)
            const transporter = nodeMailer.createTransport({
                service:process.env.NODEMAILER_SERVICE,
                auth : {
                    user :process.env.NODEMAILER_USER,
                    pass :process.env.NODEMAILER_PASS,
                },
            });

            const options = {
                from : process.env.NODEMAILER_USER,
                to : recieverEmail,
                subject :'Order Placed' ,
                text : "Your Order Placed Seuccessfully"
            };

            transporter.sendMail(options,function(err,info){
                if(err){
                    console.log(err);
                    return;
                }else{
                    console.log("sent :"+info.response)
                }
            })
    }
}