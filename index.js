const io=require("socket.io")(5000,{
    cors:{
        origin:"*"
    }
})
let users=[]
const chat=io.of("/chat")
chat.on("connection",socket=>{
    const id=socket.handshake.query.id
    socket.join(id)
    users.push(id)
    socket.on("send",msg=>{
        socket.broadcast.to(msg.to).emit("recevie",{message:msg.message,from:msg.from,to:msg.to})
    })
    socket.on("search",info=>{
        const back=users.filter(user=>user===info.search)
        if(back.length>0)
        {
            if(back[0]!==info.id)
            socket.emit("search-back",back)
        }
    })
    socket.on('disconnect', ()=> {socket.leave(id);});
})
