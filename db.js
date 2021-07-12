const mongoose=require("mongoose")
const user=require("./modules/user")
const conversation=require("./modules/conversation")
function geterros(err){
    const errors=err.errors
    const errs={errors:Object.values(errors).map(msg=>{return {msg:msg.properties.message,path:msg.properties.path}})}
    return errs
}
class DB{
    usermodel=user
    conversationmodel=conversation
    constructor(db_path){
        mongoose.connect(db_path,{useNewUrlParser: true,useUnifiedTopology: true},(err)=>{
            if(err)
            {
                throw new Error(err)
            }
            console.log("connected to db")
        })
    }
   async insert(model,data){
        try{
           const newValue= await model.create(data)
            return newValue
        }catch(err){
            return geterros(err)
        }
    }
   async get(model,key,filter){
    try{
        const newValue= await model.find(key).select(filter)
         return newValue
     }catch(err){
         return geterros(err)
     }
   }
   async exist(model,data){
       if(Array.isArray(data)){
           let results=[]
           await Promise.all(data.map(async(dd)=>{
            try{
                const count= await model.countDocuments(dd)
                results.push(count>0 ? true : false)
            }
            catch(err){
                return geterros(err)
            }
           }))
           return results
       }
       else{
        try{
            const count= await model.countDocuments(data)
            return count>0 ? true : false
        }
        catch(err){
            return geterros(err)
        }
       }
    }
   async update(model,field,update){
        const updated=await model.update(field,update)
        return updated
    }
    isobjectid(id){
        return mongoose.Types.ObjectId.isValid(id)
    }
}

module.exports=(db_path)=>new DB(db_path)