const router = require('express').Router();
let Token = require('../models/token.model');

function pluszero(num){
  let zeroed
 if(num<10){
   zeroed = "0"+num
 } else{
   zeroed = num
 }
 return String(zeroed)
}

function GetTime(){
  let today = new Date();
  let month = (today.getMonth()+1)
  month = pluszero(month)
  let date = today.getDate();
  date = pluszero(date)
  let latest = today.getFullYear()+month+date
  let latestmonday = Number(latest)
  if(today.getDay()>1){ 
    latestmonday = Number(latest) - (today.getDay()-1)
  } else if(today.getDay()===0){
    latestmonday = Number(latest) - 6
  }
  let latesthour = String(today.getHours())+String(today.getMinutes())+String(today.getSeconds())+String(today.getMilliseconds())
  return ([Number(latest),latestmonday,Number(latesthour)])
}

router.route('/').get((req, res) => {
  Token.find()
    .then(() => res.json("Please specify a user"))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/addtoken').post((req, res) => {
  const username = req.body.username;
  const token = [req.body.token];
  const time = GetTime()
  const lastday = time[0]
  const lastmonday = time[1]
  const lasthour = time[2]
  const newToken = new Token({username,token,lastday,lastmonday,lasthour});

  newToken.save()
    .then(() =>{
      res.json('Token added!')
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/:id').delete((req, res) => {
  Token.findByIdAndDelete(req.params.id)
    .then(() => res.json('Token deleted.'))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/check').post((req, res) => {
  Token.findOne({token: req.body.token})
    .then(user => {
      if(user===null) res.json("fail")
      else {
        let time = GetTime()
        let newmonday = false
        Token.updateOne({token:req.body.token},{latesthour: {time:time[2],page:req.body.page}}).then(()=>{
          if(user.latestmonday<time[1]){newmonday=true}
          if(user.latest<time[0]){
            Token.updateOne({token: req.body.token},{latest: time[0], latestmonday: time[1]})
            .then(()=>res.json([user,true,newmonday,time[2]]))
            .catch(err => res.status(400).json('Error: ' + err));
          } else{
            res.json([user,false,false,time[2]])
          }
        })
      }
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/checkold').post((req, res) => {
  console.log("User "+req.body.username+" Logged In")
  Token.findOne({username: req.body.username})
    .then(user => {
      let time = GetTime()
      if(user.latest<time){
        Token.updateOne({username: req.body.username},{"$set":{latest: time[0],latestmonday: time[1],token: req.body.token}})
        .then(()=>res.json(true))
      }else{
        Token.updateOne({username: req.body.username},{"$set":{token: req.body.token}})
        .then(()=>res.json(false))
      }
    })
    .catch(()=>{
      const username = req.body.username;
      const token = req.body.token;
      const latests = GetTime()
      const latest = latests[0]
      const latestmonday= latests[1]
      const latesthour = latests[2]
      const newToken = new Token({username,token,latest,latestmonday,latesthour});

      newToken.save()
        .then(() =>res.json(false))
        .catch(err => {res.status(400).json('Error: ' + err);console.log(err)});
    });
});

router.route('/checkUpdate').post((req, res) => {
  Token.findOne({username: req.body.username}).then(user=>res.json(user)).catch(err=>console.log("fail"))
})


module.exports = router;