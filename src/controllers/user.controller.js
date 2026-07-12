import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens= async(userId)=>
{
   try{
      const user=await User.findById(userId)

      if(!user){
         throw new apiError(404, "User not found")
      }

      const accessToken=user.generateAccessToken()
      const refreshToken=user.generateRefreshToken()

      user.refreshToken=refreshToken
      await user.save({validateBeforeSave: false})

      return {accessToken,refreshToken}

   }
   catch(error)
   {
      if(error instanceof apiError){
         throw error
      }

      throw new apiError(500,"something went wrong while generating refresh and access tokens")
   }
}

const registerUser = asyncHandler(async (req, res) => {
   //get user details from frontend 
   //validation -not empty 
   //check if user already exists from username or email
   //check for images and check for avatar 
   //upload them to cloudinary,avatar 
   //create user object  -create entry in db 
   //remove password and refresh token from response 
   //check for user creation 
   //return response 

   const {fullname,email,username,password}=req.body
   //  console.log("1. body received:", {fullname, email, username, password})

   // if(fullname==="")
   // {
   //    throw new apiError(400,"fullname is required")
   // }

   if(
      [fullname,email,username,password].some((field)=>field?.trim()==="")
   )
   {
      throw new apiError(400,"all fields are  required")
   }

  const existedUser= await User.findOne({
      $or: [{username},{email}]
   })

   if(existedUser)
   {
      throw new apiError(409,"user with email or username is already exists")
   }

   const avatarLocalPath = req.files?.avatar?.[0]?.path;
   const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
   // console.log("2. file paths:", {avatarLocalPath, coverImageLocalPath})

   if(!avatarLocalPath)
   {
      throw new apiError(400,"avatar file is required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = coverImageLocalPath
      ? await uploadOnCloudinary(coverImageLocalPath)
      : null
   console.log("3. cloudinary response:", {avatar: avatar?.url, coverImage: coverImage?.url})


   if(!avatar)
   {
      throw new apiError(400,"avatar file is required")
   }

   if(!coverImage)
   {

   }

  const user=await User.create({
      fullname,
      avatar:avatar.url,
      coverImage: coverImage?.url||"",
      email,
      password,
      username: username.toLowerCase()
      
   })
      console.log("4. user created:", user._id)

   const createdUser=await User.findById(user._id)
   .select("-password -refreshToken")

   if(!createdUser)
   {
      throw new apiError(500,"something went wrong while registering the user")
   }

   
   return res.status(201).json(
      new apiResponse(201,createdUser,"user registered successfully")
   )
   // return res.status(200).json({
   //    message: "ok"
   // });

});


const loginUser = asyncHandler(async(req,res)=>{

//req body -> data
   //username or email
   //find the user in the database 
   //password check 
   //access and refresh token 
   //send cookie 
const {email, username, password} = req.body ?? {}

if (!req.body || Object.keys(req.body).length === 0) {
   throw new apiError(400, "Request body is required");
}

if(!(username || email)){
throw new apiError(400,"username or email is required")
}

const user = await User.findOne({
$or:[{username},{email}]
})

if(!user){
throw new apiError(404,"User does not exist")
}

const isPasswordValid = await user.isPasswordCorrect(password)

if(!isPasswordValid){
throw new apiError(401,"Invalid password")
}

const {accessToken, refreshToken}
= await generateAccessAndRefreshTokens(user._id)

const loggedInUser = await User.findById(user._id)
.select("-password -refreshToken")

const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
}

return res
.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(
new apiResponse(
200,
{
user: loggedInUser,
accessToken,
refreshToken
},
"User logged in successfully"
)
)
})

const logoutUser=asyncHandler(async(req,res)=>{

   await User.findByIdAndUpdate(req.user._id,
      {
         $unset :{
            refreshToken: ""
         }
      },
      {
         new: true 
      }
      

   )
   const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
}
return res
.status(200)
.clearCookie("accessToken", options)
.clearCookie("refreshToken", options)
.json(
new apiResponse(
200,
null, 
"User logged out successfully"
)
)

   
})


const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken)
    {
      throw new apiError(401,"unauthorized request")
    }

    try{
    const decodedToken=jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,

    )

    const user=await User.findById(decodedToken?._id)
    if(!user)
    {
      throw new apiError(401,"invalid refesh token")
    }

    if(incomingRefreshToken!==user.refreshToken)
    {
      throw new apiError(401,"invalid refresh token or expired refresh token")

    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    }

    const {accessToken, refreshToken: newRefreshToken}=await generateAccessAndRefreshTokens(user._id)

    return res.status(200).cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new apiResponse(
         200,
         {accessToken,refreshToken:newRefreshToken},
         "access and refresh token generted successfully"
         
      )
    )
   }
   catch(error){
      throw new apiError(401,"invalid refresh token or expired refresh token")
   }


    

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
   const {oldPassword,newPassword}=req.body

  const user= await User.findById(req.user._id)
  const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)
   if(!isPasswordCorrect)
   {
      throw new apiError(400,"invalid old password")
   }

   user.password=newPassword
   await user.save({validateBeforeSave:false})
   
   return res.status(200).json(
      new apiResponse(200,{},"password changed successfully")
   )
})

const getCurrentUser=asyncHandler(async(req,res)=>{

   return res.status(200).json(
      new apiResponse(200,req.user,"current user fetched successfully")
   )

})


const updateAccountDetails=asyncHandler(async(req,res)=>{
   const {fullname,email}=req.body

   if(!fullname||!email)
   {
      throw new apiError(400,"fullname and email are required")
   }

   const user= await User.findByIdAndUpdate(req.user._id,
      {
         $set:{
            fullname,
            email
         }
      },
      {new:true}

   ).select("-password")

   return res.status(200)
   .json(new apiResponse(200,user,"user account details updated successfully"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{

   const avatarLocalPath=req.file?.path

   if(!avatarLocalPath)
   {
      throw new apiError(400,"avatar file is required")
   }

   const avatar=await uploadOnCloudinary(avatarLocalPath)

   if(!avatar?.url)
   {
     throw new apiError(400,"error while uploading avatar to cloudinary")  
   }

   const user=await User.findByIdAndUpdate(req.user._id,
      {
         $set:{
            avatar:avatar.url
         }
         
      },
      {new:true}

   ).select("-password")

   return res
   .status(200)
   .json(
      new apiResponse(200,user,"user avatar updated successfully")
   )
})


const updateUserCoverImage=asyncHandler(async(req,res)=>{

   const coverLocalPath=req.file?.path

   if(!coverLocalPath)
   {
      throw new apiError(400,"cover file is missing")
   }

   const coverImage=await uploadOnCloudinary(coverLocalPath)

   if(!coverImage?.url)
   {
     throw new apiError(400,"error while uploading coverImage to cloudinary")  
   }

   const user=await User.findByIdAndUpdate(req.user._id,
      {
         $set:{
            coverImage:coverImage.url
         }
         
      },
      {new:true}

   ).select("-password")

   return res
   .status(200)
   .json(
      new apiResponse(200,user,"user cover image updated successfully")
   )
})

export { registerUser,loginUser,logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,




} ;



