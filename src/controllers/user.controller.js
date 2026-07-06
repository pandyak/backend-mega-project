import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";


const generateAccessAndRefreshTokens= async(userId)=>
{
   try{
      const user=await User.findById(userId)
      const accessToken=user.generateAccessToken()
      const refreshToken=user.generateRefreshToken()

      user.refreshToken=refreshToken
      await user.save({validateBeforeSave: false})

      return {accessToken,refreshToken}

   }
   catch(error)
   {
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

   const avatarLocalPath=req.files?.avatar[0]?.path;
   // const coverImageLocalPath=req.files?.coverImage[0]?.path

   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage)&&req.files.coverImage.length>0)
   {
      coverImageLocalPath=req.files?.coverImage[0].path
   }
   // console.log("2. file paths:", {avatarLocalPath, coverImageLocalPath})

   if(!avatarLocalPath)
   {
      throw new apiError(400,"avatar file is required")
   }

   const avatar=await uploadOnCloudinary(avatarLocalPath)
   const coverImage=await uploadOnCloudinary(coverImageLocalPath)
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
      new apiResponse(200,createdUser,"user registered successfully")
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
const {email, username, password} = req.body

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
httpOnly:true,
secure:true
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
         $set :{
            refreshToken: undefined
         }
      },
      {
         new: true 
      }
      

   )
   const options = {
httpOnly:true,
secure:true
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

export { registerUser,loginUser,logoutUser };