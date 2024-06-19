const express=require("express");
const body_parser=require("body-parser");
const axios=require("axios");
require('dotenv').config();

const app=express().use(body_parser.json());

const token=process.env.TOKEN;
const mytoken=process.env.MYTOKEN;//prasath_token

app.listen(process.env.PORT,()=>{
    console.log("webhook is listening");
});

//to verify the callback url from dashboard side - cloud api side
app.get("/webhook",(req,res)=>{
   let mode=req.query["hub.mode"];
   let challange=req.query["hub.challenge"];
   let token=req.query["hub.verify_token"];


    if(mode && token){

        if(mode==="subscribe" && token===mytoken){
            res.status(200).send(challange);
        }else{
            res.status(403);
        }

    }

});

app.post("/webhook",(req,res)=>{ //i want some 

    let body_param=req.body;

    console.log(JSON.stringify(body_param,null,2));

    if(body_param.object){
        console.log("inside body param");
        if(body_param.entry && 
            body_param.entry[0].changes && 
            body_param.entry[0].changes[0].value.messages && 
            body_param.entry[0].changes[0].value.messages[0]  
            ){
               let phon_no_id=body_param.entry[0].changes[0].value.metadata.phone_number_id;
               let from = body_param.entry[0].changes[0].value.messages[0].from; 
               let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

               console.log("phone number "+phon_no_id);
               console.log("from "+from);
               console.log("boady param "+msg_body);

               axios({
                   method:"POST",
                   url:"https://graph.facebook.com/v13.0/"+phon_no_id+"/messages?access_token="+token,
                   data:{
                       messaging_product:"whatsapp",
                       to:from,
                       text:{
                           body:"Hi.. I'm Prasath, your message is "+msg_body
                       }
                   },
                   headers:{
                       "Content-Type":"application/json"
                   }

               });

               res.sendStatus(200);
            }else{
                res.sendStatus(404);
            }

    }

});

app.get("/",(req,res)=>{
    res.status(200).send("hello this is webhook setup");
});

app.post("/send-message", (req, res) => {
    const phoneNumber = req.body.phoneNumber;
    const messageBody = req.body.message; // Expecting the message body to be sent in the request

    // Ensure the phone number ID is correctly specified (replace 'YOUR_PHONE_NUMBER_ID')
    const phoneNoId = '339788665888060';

    // Check if the message is being sent within the 24-hour window or needs a template
    const sendMessage = () => {
        axios({
            method: "POST",
            url: `https://graph.facebook.com/v13.0/${phoneNoId}/messages?access_token=${token}`,
            data: {
                messaging_product: "whatsapp",
                to: phoneNumber,
                text: {
                    body: messageBody
                }
            },
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            console.log("Message sent successfully:", response.data);
            res.status(200).send("Message sent successfully");
        })
        .catch(error => {
            const errorCode = error.response.data.error.code;
            const errorTitle = error.response.data.error.error_data.details;

            if (errorCode === 131047 && errorTitle.includes('24 hours')) {
                sendTemplateMessage();
            } else {
                console.error("Error sending message:", error.response ? error.response.data : error.message);
                res.status(500).send("Error sending message");
            }
        });
    };

    const sendTemplateMessage = () => {
        axios({
            method: "POST",
            url: `https://graph.facebook.com/v13.0/${phoneNoId}/messages?access_token=${token}`,
            data: {
                messaging_product: "whatsapp",
                to: phoneNumber,
                type: "template",
                template: {
                    name: templateName,
                    language: {
                        code: "en_US"
                    }
                }
            },
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            console.log("Template message sent successfully:", response.data);
            res.status(200).send("Template message sent successfully");
        })
        .catch(error => {
            console.error("Error sending template message:", error.response ? error.response.data : error.message);
            res.status(500).send("Error sending template message");
        });
    };

    sendMessage();
});