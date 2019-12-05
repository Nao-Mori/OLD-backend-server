const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const http = require('https')
//const MongoClient = require('mongodb').MongoClient;

require('dotenv').config()

const app = express()
const port = process.env.PORT || 443;

app.use(cors())
app.use(express.json())

const uri = "mongodb+srv://Naodayo:naodayo1@cluster0-aptbv.mongodb.net/test?retryWrites=true&w=majority"
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true})

const connection = mongoose.connection
connection.once('open', ()=>{
    console.log("MongoDB database connection established successfully")
})


//const uri = "mongodb+srv://Naodayo:naodayo1@cluster0-aptbv.mongodb.net/test?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true });
// client.connect(() => {
//   const collection = client.db("test").collection("users");
//   console.log(collection)
//   // perform actions on the collection object
//   client.close();
// });

const usersRouter = require('./routes/users')
const tokensRouter = require('./routes/tokens')
const friendsRouter = require('./routes/friends')
//const adminRouter = require('./routes/admin')

app.use('/users', usersRouter)
app.use('/tokens', tokensRouter)
app.use('/friends', friendsRouter)
//app.use('/admin', adminRouter)


const server = http.createServer(app);

server.listen(port, ()=>{
    console.log('Server is running on port: ' + port)
})