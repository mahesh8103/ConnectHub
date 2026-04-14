import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    fullName:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true,
        unique:true,
        lowercase:true
    },
    password:{
        type:String,
        require:true,

    },
    confirmPassword:{
        type:String,
        require:true,
    },
    
    },
    {
        timestamps:true
    }
);

const user = mongoose.model("User",userSchema);

export default user;

