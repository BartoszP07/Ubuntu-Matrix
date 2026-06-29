

const express = require("express");
const pm2 = require("pm2");
const app = express();

const port = process.env.SERVER_PORT;

express.use(express.static("../client"));


app.listen(port, function(){
    console.log("Running server on port:", port)
})