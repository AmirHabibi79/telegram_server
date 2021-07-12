function start(port,db){
    const fs=require("fs")
    const path=require("path")
    const express=require("express")
    const app=express()
    const multer=require("multer")
    const argon2=require("argon2")
    const sharp=require("sharp")
    const profileFilter = (req, file, cb) => {
        if (file.mimetype.startsWith("image")) {
          cb(null, true);
        } else {
          cb("Please upload only images.", false);
        }
      };
    const uploadProfile=multer({storage:multer.memoryStorage(),fileFilter:profileFilter})
    app.use((req,res,next)=>{
        res.set("Access-Control-Allow-Origin",req.headers.origin)
        res.set("Access-Control-Allow-Credentials",true)
        res.set("Access-Control-Allow-Headers","content-type")
        res.set("Access-Control-Allow-Methods","GET,POST,DELETE,PUT")
        next()
    })

    const formatDataforUserRegister=(data)=>{
        if(Array.isArray(data)){
            const formatData={
                name:data[0],
                family:data[1],
                password:data[2],
                userid:data[3],
                phone:data[4],
                profilepic:data[5],
                conversations:data[6],
                contacts:data[7]
            }
            return formatData
        }
        else{
            const formatData={
                name:data.name,
                family:data.family,
                password:data.password,
                userid:data.userid,
                phone:data.phone,
                profilepic:data.profilepic,
                conversations:data.conversations,
                contacts:data.contacts
            }
            return formatData
        }
    }
    const getconversations=async(user)=>{
        const conversations=[]
       await Promise.all(user.conversations.map(async(c)=>{
            const conversation=await db.get(db.conversationmodel,{id:c})
            let member=await Promise.all(conversation[0].members.filter(m=>m.toString() !== user._id.toString()))
            member=await db.get(db.usermodel,{_id:member[0]},{__v:0,password:0,conversations:0,contacts:0})
            const result={conversationid:c,messages:conversation[0].messages,name:member[0].name,family:member[0].family,phone:"0"+member[0].phone.toString(),profilepic:member[0].profilepic,userid:member[0].userid,selected:false,id:member[0]._id}
            conversations.push(result)
        }))
        return conversations
    }
    app.use(express.static("public"))

    app.post("/signup",uploadProfile.single("profile"),async(req,res)=>{
        const hashpass= req.body.password ? req.body.password.length>=8 ? await argon2.hash(req.body.password) : req.body.password : undefined
        const data=formatDataforUserRegister([
            req.body.name,
            req.body.family,
            hashpass,
            req.body.userid,
            req.body.phone,
            "",
            [],
            []
        ])
        if(await db.exist(db.usermodel,{phone:data.phone})){
            res.status(400).json({errors:[{msg:"phoneNumber is taken",path:"phone"}]})
            return
        }
        if(await db.exist(db.usermodel,{userid:data.userid})){
            res.status(400).json({errors:[{msg:"userid is taken",path:"userid"}]})
            return
        }
            let FileAddres=""
            let newFilename=""
            if(req.file){
            newFilename=Date.now()+req.file.originalname
            FileAddres=req.protocol + '://' + req.get('host')+"/"+"profile/"+newFilename
            }
            if(data.phone)
            if(isNaN(data.phone)){
                res.status(400).json({errors:[{msg:"phoneNumber must be in correct format",path:"phone"}]})
                return
            }
            data.profilepic=FileAddres
            const newUser=await db.insert(db.usermodel,data)
            if(newUser.errors){
                res.status(400).json(newUser)
            }
            else{
                if(newFilename !==""){
                    if (!fs.existsSync(path.join(__dirname,"/public"))){
                        fs.mkdirSync(path.join(__dirname,"/public"));
                        fs.mkdirSync(path.join(__dirname,"/public","/profile"))
                    }
                   const file= await sharp(req.file.buffer)
                    .resize(512,512,{
                        fit:"cover"
                    })
                    
                    .toFormat("jpeg")
                    .jpeg({ quality: 100 })
                    .toBuffer()
                   await fs.writeFileSync(path.join(__dirname ,"/public/profile/",newFilename),file,()=>{})
                }
                delete data.password 
                delete data.conversations 
                delete data.contacts 
                data.id=newUser._id
                data.phone=data.phone
                res.status(200).json(data)
            }

      

    })
    
    app.post("/login",express.json(),async(req,res)=>{
        const {info,password}=req.body
        if(!info && !password){
            res.status(400).json({errors:[{msg:"path info is required",path:"info"},{msg:"path password is required",path:"password"}]})
            return
        }
        if(!info){
            res.status(400).json({errors:[{msg:"path info is required",path:"info"}]})
            return
        }
        if(!password){
            res.status(400).json({errors:[{msg:"path password is required",path:"password"}]})
            return
        }
        if(isNaN(info)){
            const user=await db.get(db.usermodel,{userid:info},{__v:0})
            if(user.length===0){
                res.status(400).json({errors:[{msg:"user not found",path:"info"}]})
                return
            }
            const unhashpass=await argon2.verify(user[0].password,password)
            if(unhashpass){
                const conversations=await getconversations(user[0])
                const data=formatDataforUserRegister(user[0])
                delete data.password
                data.id=user[0]._id
                data.conversations=conversations
                data.phone="0"+data.phone.toString()
                res.send(data)
            }
            else{
                res.status(400).json({errors:[{msg:"password is not correct",path:"password"}]})
                return
            }
        }
        else{
            const user=await db.get(db.usermodel,{phone:info},{__v:0})
            if(user.length===0){
                res.status(400).json({errors:[{msg:"user not found",path:"info"}]})
                return
            }
            const unhashpass=await argon2.verify(user[0].password,password)
            if(unhashpass){
                const conversations=await getconversations(user[0])
                const data=formatDataforUserRegister(user[0])
                delete data.password
                data.id=user[0]._id
                data.conversations=conversations
                data.phone="0"+data.phone.toString()
                res.send(data)
            }
            else{
                res.status(400).json({errors:[{msg:"password is not correct",path:"password"}]})
                return
            }
        }
    })

    app.listen(port,()=>{
        console.log("http connected on port :",port)
    })








}

module.exports=(port,db)=>start(port,db)