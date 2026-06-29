

const dotenv = require('dotenv').config();
const express = require("express");
const pm2 = require("pm2");
const path = require("path");
const app = express();

const port = process.env.SERVER_PORT;

app.use(express.static(path.join(__dirname, "../client")));


app.listen(port, function(){
    console.log("Running server on port:", port)
})