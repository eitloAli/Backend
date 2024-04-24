// import dotenv from "dotenv"
// dotenv.config({
//     path : "./.env"
// }) // dotenv config through package.json

import express from 'express'
import dbConnect from "./db/index.js";
import { app } from './app.js';



dbConnect()
.then(() => {

    app.on("error", (error) => {
        console.log("ERR while connecting APP at Index.js Ali", error)
        throw error
    })

    app.listen(process.env.PORT || 8000, () => {
        console.log("Server s running at port : ", process.env.PORT);
    })
})
.catch((err) => {
    console.log("MONGO DB connection failed !!!", err);
})