require("dotenv").config()
const DB=require("./db")(process.env.DB)
require("./socket")(process.env.SOCKET_PORT,DB)
require("./http")(process.env.HTTP_PORT,DB)