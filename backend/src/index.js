import express from 'express'
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import dotenv from 'dotenv'
dotenv.config();

const app = express()
const PORT = process.env.PORT || 5001


connectDB()
.then(
    ()=>{
        app.listen(PORT,()=>{
            console.log(`mongodb connected at ${PORT}!!!`)
        })
    }
)
.catch((err)=>{
     console.log('connection failed!!!',err)
})