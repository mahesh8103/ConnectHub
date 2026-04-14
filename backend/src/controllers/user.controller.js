import User from "../models/user.models.js";
import asyncHandler from "../utils/AsyncHandler.js";

const signup = asyncHandler(async(req , res) =>{
    const {fullName , email, password ,confirmPassword} = req.body;
    if(password!==confirmPassword){
        throw new ApiError(400,"password didn't match");
    }
    if([fullName,email,password,confirmPassword].some((fields)=>fields?.trim()==="")){
      throw new ApiError(400,"all fields are required")
   }
      const existedUser = await User.findOne({
      $or: [{ username },{ email }]
   })
    if (existedUser) {
      throw new ApiError(409,"user with username or email already existed")
    }
})