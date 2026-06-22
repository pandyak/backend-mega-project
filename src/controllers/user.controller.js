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

const registerUser = asyncHandler(async (req, res, next) => {

   return res.status(200).json({
      message: "ok"
   });

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

export { registerUser, loginUser };