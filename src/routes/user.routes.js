import { Router } from "express";
import { registerUser, loginUser,logoutUser } from "../controllers/user.controller.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";

const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1

        },
        {
            name:"coverImage",
            maxCount:1

        }
    ]),
    // uploadOnCloudinary.fields([
    //     {
    //         name:"avatar",
    //         macCount:1
    //     },
    //     {
    //         name:"coverImage",
    //         maxCount:1
    //     }
    // ]),
    registerUser)

    router.route("/login").post(
        loginUser
    )


    //secure routes
    router.route("/logout").post(
        verifyJWT,
        logoutUser
    )

router.route("/refresh-token").post(
    refreshAccessToken
)
export default router