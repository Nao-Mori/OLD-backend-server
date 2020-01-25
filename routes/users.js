const router = require('express').Router();
let User = require('../models/user.model');
const gt = require("./getTime.js")
const bcrypt = require('bcrypt-nodejs');

var listeners = {}
function active (username) {
  if(listeners[username]===undefined) listeners[username]={online:false,tm:undefined}
  if(!listeners[username].online) {
    User.updateOne({username: "ranking","users.username":username},{"users.$.online":true})
    .then(()=>{console.log(username+ " came online");})
    .catch(err => res.status(400).json('Error: ' + err));
  }
  listeners[username].online=true
  clearTimeout(listeners[username].tm)
  listeners[username].tm=setTimeout(()=>{
    User.updateOne(
      {username: "ranking","users.username":username},
      {"users.$.online":false}
    ).then(()=>{
      listeners[username].online=false
      console.log(username+" went offline")
    })
  },120000)
}

var workers = {}
function worktimer (username) {
  if(!workers[username]) workers[username] = {start:gt().time, end:undefined,count:0,rest:0,int:undefined,temp:0}
  if(workers[username].int) clearInterval(workers[username].int)
  workers[username].int=setInterval(()=>{
    workers[username].count++
  },1000)
}

function breaktimer (username) {
  clearInterval(workers[username].int)
  workers[username].temp=0
  workers[username].int = setInterval(()=>{
    workers[username].rest++
    workers[username].temp++
  },1000)
}

router.route('/').get((req,res) => {
  User.findOne({username: "admin"})
    .then(() => res.json(true))
    .catch(() => res.json(false));
});

router.route('/demodata').get((req,res) => {
  User.findOne({username: "demo"})
    .then(user => res.json(user))
    .catch(() => res.json(false));
});

router.route('/add').post((req, res) => {
  let = firsttask="abed2a58cdfb9eddbeb086a64a93a3908e470f436de87decc239affe9a60f409052c6ac53fed6c9c22667ca7dae2b0050444e0919a3fe124e14ae5b673f571d68b5c2678538edb459f1930828f18589e04507d1a6c7397264569"
  const username = req.body.username;
  const password = req.body.password;
  const info = {dob: req.body.dob,language:"en",region:"de",payinfo:"none"};
  const disname= req.body.disname;
  const point = {coin:0,gem:0,exp:[0,0],rank:1,total:0,progress:0}
  const quest = [{login: 1,work: 0,hours: 0,hours2:0,review: 0},{rest: 0,rest2:0,fav: 1}]
  const status = "before"
  const hours = {work: {start: [], end:[]},rest:[],resttime:0}
  const items ={cards:[{name: "Boi", hp: 1200, ap: 200,ap2:400,cost:1,buff:0,equip:1}], buffs:[{name: "Health Potion",fname: "Common", power: 100, type: "HP"}],deck:[]}
  const tasks =[{task:firsttask, done: false}]
  const history = [{hours: 0,quality:"Great!",message: "None",date: "Start"}]
  const trash = "delete"
  const friends =["admin"]

  const newUser = new User({username,password,info,disname, point,quest,status,hours,items,tasks,history,friends,trash});

  newUser.save()
    .then(() => {
      User.updateOne({username:"ranking"},{"$push":{users: {username:req.body.username,disname:req.body.disname,message:"Hello, I'm using Motimanager",rank:1,icon:"Boi"}}})
      .then(()=>res.json("User Added!"))
      .catch(err=>res.status(400).json('Error: ' + err))
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/getranking').post((req, res) => {
  User.findOne({username: "ranking"})
    .then(data => {
      let rank
      let profile
      let friends = req.body.friends
      let friends_data = []
      for(let i=0;i<data.users.length;i++){
        if(req.body.username===data.users[i].username) profile = data.users[i]
        for(let x=0;x<friends.length;x++){
          if(data.users[i].username===friends[x]) {
            friends_data.push(data.users[i])
          }
        }
      }
      let all = data.users.sort((a,b) => (a.rank > b.rank) ? -1 : ((b.rank > a.rank) ? 1 : 0))
      for(let i=0;i<all.length;i++){
        if(all[i].username===req.body.username){
          rank = i+1
          all[i].you = true
        }
      }
      let top = all.splice(0,5)
      for(let i=0;i<top.length;i++){
        top[i] = { disname:top[i].disname, rank:top[i].rank, icon: top[i].icon }
      }
      res.json({top:top, rank: rank, friends: friends_data, profile: profile})
    }).catch(err => console.log(err));
});

router.route('/getfriends').post((req, res) => {
  User.findOne({username: "ranking"})
    .then(data => {
      let friends = req.body.friends
      let friends_data = []
      for(let i=0;i<data.users.length;i++){
        for(let x=0;x<friends.length;x++){
          if(data.users[i].username===friends[x]) friends_data.push(data.users[i])
        }
      }
      res.json(friends_data)
    }).catch(err => res.status(400).json('Error: ' + err));
});

router.route('/check').post((req, res) => {
  User.findOne({username: req.body.username})
    .then(user =>{
      if(user===null) res.json("none")
      else res.json(user.disname)
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/getdata').post((req, res) => {
  active(req.body.username)
  User.findOne({username: req.body.username})
    .then(user =>{
      let username = req.body.username
      let data = user
      data.password = "private"
      if(workers[username]) {
        data.hours = {work:workers[username].count,rest:workers[username].rest,start:workers[username].start,end:workers[username].end,temp:workers[username].temp}
      }
      res.json(data)
    })
    .catch(err => console.log(err));
});

router.route('/login').post((req, res) => {
  User.findOne({username: req.body.username})
    .then(user =>{
      if(!user) {
        res.json("none")
      }
      else {
        bcrypt.compare(req.body.password, user.password, (err, isMatch)=> {
          if(err||!isMatch) {
            res.json("none")
          }
          else res.json("ok")
        })
      }
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/open').post((req, res) => {
  active(req.body.username)
  res.json("updating")
});

router.route('/close').post((req, res) => {
  User.updateOne(
    {username: "ranking","users.username":req.body.username},
    {"users.$.online":false}
  ).then(()=>{res.json("Closed");console.log("went offline")}).catch(err => res.status(400).json('Error: ' + err));
});

router.route('/reset').post((req, res) => {
  active(req.body.username)
  if(workers[req.body.username]!==undefined) clearInterval(workers[req.body.username].int)
  workers[req.body.username]=undefined
  const quest2 =[{login: 1,work: 0,hours: 0,hours2:0,review: 0},{rest: 0,rest2: 0, fav: 0}]
  User.updateOne({username: req.body.username},{"$set":{"point.exp": [3,1], status: "before", quest: quest2, hours:{work:{start:[],end:[]},rest:[],resttime:0}}})
    .then(() => {
      if(req.body.monday){
        User.updateOne({username: req.body.username},{"$set":{"quest.1":{rest:0,rest2:0,fav:1}}}).then(()=>res.json("Reset!").catch(err => res.status(400).json('Error: ' + err)))
      } else res.json("Reset!")
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/taskadd').post((req, res) => {
  active(req.body.username)
  User.updateOne(
    { username: req.body.username}, 
    { "$push": {"tasks": {task: req.body.task,done: false}}}
  )
    .then(user => {res.json(user)})
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/taskdone').post((req, res) => {
  active(req.body.username)
  let taskid = "tasks."+req.body.num+".done"
  User.updateOne(
    { username: req.body.username}, 
    { "$set": {[taskid]: req.body.value}}
  )
    .then(user => res.json(user))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/taskedit').post((req, res) => {
  active(req.body.username)
  User.updateOne(
    { username: req.body.username}, 
    { "$set": {[req.body.place] : {task:req.body.task, done:false}}}
  )
    .then(() => res.json("Edited!"))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/taskdelete').post((req, res) => {
  active(req.body.username)
  let pos = "tasks."+req.body.pos
  User.updateOne(
    { username: req.body.username}, 
    { "$set": { [pos]: "delete" } }
  )
    .then(()=>{
      User.updateOne(
        {username: req.body.username},
        {"$pull":{tasks: "delete" }}
      ).then(user=>res.json(user)).catch(err => res.status(400).json('Error: ' + err))
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/taskmove').post((req, res) => {
  active(req.body.username)
  User.updateOne(
    { username: req.body.username}, 
    { "$set": {tasks: req.body.tasks}}
  )
    .then(() => res.json("Moved"))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/work').post((req, res) => {
  active(req.body.username)
  let username=req.body.username
  switch(req.body.work){
    case "work":  
      worktimer(req.body.username)
      break
    case "rest":
      breaktimer(req.body.username)
      break
    case "finish": {
      workers[username].end = gt().time
      clearInterval(workers[username].tm)
      break
    }
    default: break
  }
  let ob = {rest:workers[username].rest,count:workers[username].count}
  User.updateOne(
    { username: req.body.username}, 
    { status: req.body.work}
  ).then(()=>res.json(ob))
});

router.route('/dayoff').post((req, res) => {
  User.updateOne(
    { username: req.body.username}, 
    { "$set": {"quest.1.rest": 1, status: "reviewed"}}
  )
    .then(() => res.json("Took a dayoff"))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/review').post((req, res) => {
  active(req.body.username)
  let messe=null
  if(req.body.message!==""){
    messe = req.body.message
    messequest = 1
  }
  let hourquest = 0
  let hourquest2 = 0
  if(req.body.hours>=3) hourquest = 1
  if(req.body.hours>=6) hourquest2 = 1

  let newpoint = req.body.coins + req.body.hours*200

  User.updateOne(
    { username: req.body.username}, 
    { "$set": {"quest.0.review": 1, "quest.0.hours": hourquest,"quest.0.hours2": hourquest2, status: "reviewed", "point.coin": newpoint, "point.total":req.body.total},
      "$push":{history: {message: messe, quality: req.body.grade, hours: req.body.hours, date: gt().date}}}
  )
    .then(() => {
      if(req.body.historylength===10){
        User.updateOne({username: req.body.username},{"$pop":{history: -1}}).then(()=>res.json(req.body.hours*200))
      }else{res.json(req.body.hours*200)}
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/claim').post((req, res) => {
  active(req.body.username)
  let place = "quest."+req.body.quest
  User.updateOne(
    { username: req.body.username}, 
    { "$set": {[place]: 2, "point.coin": req.body.coin,"point.gem":req.body.gem}}
  )
    .then(() => res.json("Claimed"))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/buy').post((req, res) => {
  active(req.body.username)
  if(req.body.prize.name==="20 Gems"||req.body.prize.name==="2 Gems"){
    User.updateOne(
      { username: req.body.username}, 
      { "$set": {"point.coin": req.body.coin,"point.gem": req.body.gem}}
    ).then(() =>res.json("Got Gem")).catch(err => res.status(400).json('Error: ' + err));
  } else{
    User.updateOne(
      { username: req.body.username}, 
      { "$set": {"point.coin": req.body.coin,"point.gem": req.body.gem},"$push":{[req.body.locate]:req.body.prize}}
    ).then(() =>res.json("Got Item")).catch(err => res.status(400).json('Error: ' + err));
  }
});

router.route('/cardEquip').post((req, res) => {
  active(req.body.username)
  User.updateOne(
    { username: req.body.username}, 
    { "$set": {"items.cards": req.body.cards}}
    )
    .then(() => res.json("Equipped"))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/itemdelete').post((req, res) => {
  active(req.body.username)
  User.updateOne(
    { username: req.body.username}, 
    {"items.cards": req.body.cards,"items.buffs": req.body.buffs,"point.gem":req.body.gem}
    )
    .then(() => res.json("Deleted"))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/itemcombine').post((req, res) => {
  active(req.body.username)
  User.updateOne(
    { username: req.body.username}, 
    {"items.cards":req.body.cards,"items.buffs":req.body.buffs,"point.gem":req.body.gem}
  ).then(()=>res.json("Combined!"))
});

router.route('/gameWin').post((req, res) => {
  active(req.body.username)
  User.updateOne(
    { username: "ranking", "users.username":req.body.username}, 
    {"users.$.rank":req.body.rank}
  ).then(() => {
      User.updateOne(
        {username:req.body.username},
        {"$set": {"point.rank": req.body.rank,"point.coin":req.body.coin}}
      ).then(user=>res.json(user)).catch(err=>res.status(400).json("Error: "+err))
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/addFriend').post((req, res) => {
  active(req.body.username)
  User.updateOne(
    { username: req.body.owner}, 
    { "$push": {friends: req.body.username}}
  ).then(() => {
    User.updateOne(
      { username: req.body.username}, 
      { "$push": {friends: req.body.owner}}
    ).then(()=>res.json("Friend Added!")).catch(err => res.status(400).json('Error: ' + err));
  }).catch(err => res.status(400).json('Error: ' + err));
});

router.route('/edit_account').post((req, res) => {
  active(req.body.username)
  User.updateOne(
    { username: req.body.username}, 
    { info : req.body.data}
  )
    .then(() => res.json("Changed"))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/edit_profile').post((req, res) => {
  active(req.body.username)
  User.updateOne(
    { username: "ranking", "users.username":req.body.username}, 
    {"users.$":req.body.content}
  ).then(()=>res.json("Edited"))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/gameStart').post((req, res) => {
  active(req.body.username)
  User.updateOne(
    { username: req.body.username}, 
    {"point.exp":req.body.exp}
  ).then(()=>res.json("Start"))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/gameDone').post((req, res) => {
  active(req.body.username)
  User.updateOne(
    { username: req.body.username}, 
    {"point.coin": req.body.coin, "point.rank": req.body.rank}
  ).then(()=>{
    User.updateOne(
      { username: "ranking", "users.username": req.body.username}, 
      {"users.$.rank": req.body.rank}
    ).then(()=>res.json("Done"))
      .catch(err => res.status(400).json('Error: ' + err));
  })
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;