// import dotenv from "dotenv"
// dotenv.config({
//     path : "./.env"
// }) // dotenv config through package.json

import express from 'express'
import dbConnect from "./db/index.js";
const app = express()



dbConnect()