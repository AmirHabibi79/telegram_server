const mongoose=require("mongoose")

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Path name is required"],
    },
    family:{
        type:String,
        required:[true,"Path family is required"],
    },
    password:{
        type:String,
        required:[true,"Path password is required"],
        minLength:[8,"password must contains 8 letters"],
    },
    phone:{
        type:Number,
        required:[true,"Path phoneNumber is required"],
        validate:{
            validator:function(e){
                const phone="0"+e.toString()
                return phone.length===11
            },
            message:"phoneNumber must be correct format"
        }
    },
    userid:{
        type:String,
        required:[true,"Path userid is required"],
        minLength:[6,"userid must contains 6 letters"],
    },
    conversations:{
        type:Array,
        default:[],
    },
    contacts:{
        type:Array,
        default:[],
    },
    profilepic:{
        type:String,
        default:"",
    }
})
module.exports=mongoose.model("Users",userSchema)