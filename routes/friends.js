const router = require('express').Router();
let Friends = require('../models/friends.model');

function pluszero(num){
  let zeroed
 if(num<10){
   zeroed = "0"+num
 } else{
   zeroed = num
 }
 return zeroed
}

function GetTime(){
  let today = new Date();
  let minute = today.getMinutes()
  let hour = today.getHours()
  let month = (today.getMonth()+1)
  let date = today.getDate();
  minute = pluszero(minute)
  let time = hour+":"+minute
  let tooday = String(today.getFullYear())+"/"+month+"/"+date
  hour = pluszero(hour)
  month = pluszero(month)
  date = pluszero(date)
  let second = today.getSeconds();
  second = pluszero(second)
  let latest = String(today.getFullYear())+month+date+hour+minute+second
  return ([time, Number(latest),tooday])
}


router.route('/').get((req, res) => {
  Friends.find()
    .then(exercises => res.json(exercises))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/create').post((req, res) => {
  const username = req.body.username;
  const chat = req.body.chat;
  const newFriends = new Friends({
    username,
    chat
  });
  newFriends.save()
  .then(() => res.json('Friend list created!'))
  .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/add').post((req, res) => {
  const username = req.body.username;
  const disname = req.body.disname;
  const owner = req.body.owner;
  const ownername = req.body.ownername;
  let pretime = GetTime()
  let time = pretime[0]
  
  Friends.updateOne(
    { username: owner }, { "$push":{"chat": {username : username, chat:[[pretime[2],"C",time,pretime[1]],["You added "+disname+".","S",time,pretime[1]]], read: 1, typing: false}}}
  ).then(()=>{
    Friends.updateOne(
    { username: username},{"$push":{"chat":{ username: owner, chat:[[pretime[2],"C",time,pretime[1]],[ownername+" added you.","S",time,pretime[1]]], read: 1, typing: false}}
    }).then(()=> res.json("Friend Added!")).catch(err => {res.status(400).json('Error: ' + err)})
  }).catch(err => {res.status(400).json('Error: ' + err)})
})

router.route('/send').post((req, res) => {
  const username = req.body.username;
  const owner = req.body.owner;
  const content = req.body.content;
  let last = String(req.body.last)
  last = last.substring(0,8)

  let pretime = GetTime()
  let time = pretime[0]

  let reply1 = [content,"S",time,pretime[1]]
  let sentm = [content,"R",time,pretime[1]]
  let timechange = [pretime[2],"C",time,pretime[1]]
  Friends.findOne({ username: username}
    ).then(user=>{
      let readcount
      for(let i =0; i<user.chat.length;i++){
        if(owner===user.chat[i].username){
          readcount = user.chat[i].read + 1
        }
      }
      if(last!==String(pretime[1]).substring(0,8)){
        Friends.updateOne(
          { username: owner, "chat.username": username}, 
          { "$push": {"chat.$.chat": {"$each":[timechange, reply1] }}}
        ).then(()=>{
          Friends.updateOne(
            { username: username, "chat.username": owner}, 
            { "$push": {"chat.$.chat": {"$each":[timechange, sentm] }},"$set":{"chat.$.read":readcount}}
          ).then(()=>res.json("Sent")).catch(err=>console.log(err))
        }).catch(err => console.log(err));
      } else{
        Friends.updateOne(
          { username: owner, "chat.username": username}, 
          { "$push": {"chat.$.chat": reply1}}
        )
        .then(()=>{Friends.updateOne(
          { username: username, "chat.username": owner}, 
          { "$push": {"chat.$.chat": sentm},"$set":{"chat.$.read":readcount}}
        ).then(()=>res.json("Sent")).catch()
        }).catch(err => res.status(400).json('Error: ' + err));
      }
    }).catch()
});

router.route('/typing').post((req, res) => {
  const username = req.body.username;
  const owner = req.body.owner;
  
  Friends.updateOne(
    { username: username, "chat.username": owner}, 
    { "chat.$.typing": true}
  )
  .then(()=>{
    setTimeout(function(){
      Friends.updateOne(
        { username: username, "chat.username": owner}, 
        { "chat.$.typing": false}
      ).then(() => res.json('Typed!'))
    },3000)
  }
).catch(err => res.status(400).json('Error: ' + err));
});

router.route('/read').post((req, res) => {
  const username = req.body.username;
  const theuser = req.body.theuser;
  
  Friends.updateOne(
    { username: username, "chat.username": theuser}, 
    {"chat.$.read": 0}
  )
  .then(() => res.json('Read!')
).catch(err => res.status(400).json('Error: ' + err));
});

router.route('/bot').post((req, res) => {
  const username = req.body.username;
  const owner = req.body.owner;
  const content = req.body.content;
  let last = String(req.body.last)
  last = last.substring(0,8)

  let pretime = GetTime()
  let timechange = [pretime[2],"C",pretime[0],pretime[1]]
  let sent = [content,"S",pretime[0],pretime[1]]

  let reply =[]
  let c = content.toUpperCase()
  if(c==="HELLO"||c==="HEY"||c==="HI"){
    reply = ["Hello, how can I help you?","R",pretime[0],pretime[1]]
  } else{
    reply = ["Sorry, I don't know how to answer that.", "R",pretime[0],pretime[1]]
  }

  if(last!==String(pretime[1]).substring(0,8)){
    Friends.updateOne(
      { username: owner, "chat.username": username}, 
      { "$push": {"chat.$.chat": {"$each":[timechange,sent,reply]}}}
    )
    .then(() => res.json('Bot Replied')).catch(err => res.status(400).json('Error: ' + err));
  } else{
    Friends.updateOne(
      { username: owner, "chat.username": username}, 
      { "$push": {"chat.$.chat": {"$each":[sent,reply]}}}
    )
    .then(() => res.json('Bot Replied')).catch(err => res.status(400).json('Error: ' + err));
  }
});

router.route('/check').post((req, res) => {
  Friends.findOne({username: req.body.username})
    .then(user => res.json(user))
    .catch(err => res.status(400).json('Error: ' + err));
  });

router.route('/:id').delete((req, res) => {
  Friends.findByIdAndDelete(req.params.id)
    .then(() => res.json('Friends deleted.'))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/update/:id').post((req, res) => {
  Friends.findById(req.params.id)
    .then(friends => {
      friends.username = req.body.username;
      friends.description = req.body.friends;
      friends.save()
        .then(() => res.json('Friends updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;