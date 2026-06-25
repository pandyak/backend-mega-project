import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app=express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,

}))

app.use(express.json({
    limit:"16kb"
}))

app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// error handler middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const message = err.message || "Something went wrong"
    
    console.log("ERROR:", err) // shows error in terminal
    
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message
    })
})


//routes
import userRouter from "./routes/user.routes.js"

//route declaration
app.use("/api/v1/users",userRouter)


export {app};