function start(socket_port,db){
    const uuid =require("uuid")
    const io=require("socket.io")(socket_port,{
        cors:{
            origin:"*"
        }
    })
    const chat=io.of("/chat")
     chat.on("connection",async(socket)=>{
        const id=socket.handshake.query.id
        if(!db.isobjectid(id)){
            socket.disconnect()
            return
        }
        if(!await db.exist(db.usermodel,{_id:id})){
            socket.disconnect()
            return
        }
        console.log("someone connected to socket 😉")
        socket.join(id)
        socket.on("send",async(msg)=>{
            const message={message:msg.message,from:msg.from,to:msg.to,time:msg.time}
            let {conversationid}=msg
            if(!await db.exist(db.conversationmodel,{id:conversationid})){
                const data={members:[message.to,message.from],messages:[message],id:conversationid}
                await db.insert(db.conversationmodel,data)
                await db.update(db.usermodel,{$push:{conversations:conversationid}})
                const sender=await db.get(db.usermodel,{_id:message.from},{__v:0,password:0,conversations:0,contacts:0})
                await db.update(db.conversationmodel,{id:conversationid},{$push:{messages:message}})
                socket.broadcast.to(msg.to).emit("recevie",{conversationid,name:sender[0].name,family:sender[0].family,phone:"0"+sender[0].phone.toString(),profilepic:sender[0].profilepic,id:sender[0].id,userid:sender[0].userid,messages:[message]})
                return
            }
            await db.update(db.conversationmodel,{id:conversationid},{$push:{messages:message}})
            socket.broadcast.to(msg.to).emit("recevie",{message:msg.message,from:msg.from,to:msg.to,time:msg.time,conversationid})
        })
        socket.on("search",async(info)=>{
            const search=info.search
            if(search === "")
            return
            const back=await db.get(db.usermodel,{userid:{$regex:'.*'+search+'.*'}},{__v:0,password:0,conversations:0,contacts:0})
            const backfilter=await back.filter(b=>{return b._id.toString() !== info.id.toString()})
            const res=await backfilter.map(bb=>{return {name:bb.name,family:bb.family,phone:"0"+bb.phone.toString(),profilepic:bb.profilepic,userid:bb.userid,id:bb._id,messages:[],conversationid:uuid.v4()}})
            if(res&&res.length>0)
            {
                socket.emit("search-back",res)
            }
        })
        socket.on('disconnect', ()=> {socket.leave(id);});
     })
}

module.exports=(sp,db)=>start(sp,db)