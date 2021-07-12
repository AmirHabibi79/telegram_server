const mongoose=require("mongoose")

const conversationSchema=new mongoose.Schema({
    members:Array,
    messages:Array,
    id:String
})
module.exports=mongoose.model("conversations",conversationSchema)