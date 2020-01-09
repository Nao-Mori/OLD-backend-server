const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const http = require('http')
const socketIo = require("socket.io");

require('dotenv').config()

const app = express()
const port = process.env.PORT || 8081;

app.use(cors())
app.use(express.json())

const uri = "mongodb+srv://Naodayo:naodayo1@cluster0-aptbv.mongodb.net/test?retryWrites=true&w=majority"
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true}).then(client=>{
  
})

const connection = mongoose.connection
connection.once('open', ()=>{
  console.log("MongoDB database connection established successfully")
})

const usersRouter = require('./routes/users')
const tokensRouter = require('./routes/tokens')
const friendsRouter = require('./routes/friends')

app.use('/users', usersRouter)
app.use('/tokens', tokensRouter)
app.use('/friends', friendsRouter)

const server = http.createServer(app);

const io = socketIo(server);

var users = {}


io.on("connection", socket => {
  socket.on('join', (data, callback) => {
    console.log(data.name+" joined.")
    if(data in users) console.log("exists")
    else {
      users[data.name]=socket
    }
  });


  socket.on('sendMessage', (data, callback) => {
    if(data.target in users) io.to(users[data.target].emit('chat',data.msg)) 
  });
  socket.on("disconnect", () => console.log("Client disconnected"));
});

server.listen(port, ()=>{
  console.log('Server is running on port: ' + port)
})

// var mongo = require('mongodb');

// // var server = new mongo.Server('localhost', 27017, { ssl: true });
// // var db = new mongo.Db('test', server, { w: 1 });
// // var auth = { user: 'Naodayo', pass: 'naodayo1' };

// // db.open(function(err, db) {
// //   if (err) return console.log("error opening", err);

// //   db.authenticate(auth.user, auth.pass, function(err, result) {
// //     if (err) return console.log("error authenticating", err);

// //     console.log("authed?", result);

// //     db.collection('whatever').count(function(err, count) {
// //       if (err) return console.log("error counting", err);

// //       console.log("count", count);
// //       db.close()
// //     });
// //   });
// // });