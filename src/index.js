// require('dotenv').config()
// import mongoose from "mongoose";
// import {DB_NAME} from "./constants.js";
    import dotenv from "dotenv";
    dotenv.config({ path: "./.env" });

    import connectDB from "./db/index.js";

    connectDB()

    .then(()=>{
        app.listen(process.env.PORT||8000,()=>{
            console.log(`Server is running on port ${process.env.PORT||8000}`)
        })
    })
    .catch((err)=>{
        console.log("mongodb connection failed",err);
    })


/*

import express from "express";
import dotenv from "dotenv";
const app=express();

(async()=>{
    try{
       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
       app.on("error",(error)=>{
        console.log("Error connecting to MongoDB");
        throw error
       });
       app.listen(process.PORT,()=>{
        console.log(`Server is running on port ${process.env.PORT}`)
       });
        
    }
    catch(error){
        console.log("Error connecting to MongoDB",error);
        throw error;
    }
})()
    */
