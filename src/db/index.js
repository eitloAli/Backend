import mongoose  from "mongoose";
import { DB_NAME } from "../constants.js";
import express from 'express'
const app = express()

const dbConnect = async () => {
    try {
        const db = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST : ${db.connection.host}`)
        // console.log(db)
    } catch (error) {
        console.error("DB connection is failed", error)
        process.exit(1)
    }
}

export default dbConnect





























/* this approch could be used
;(async () =>  {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log()
        })
    } catch (error) {
        console.error("Error while connecting Database", error)
        throw error
    }
})()

*/