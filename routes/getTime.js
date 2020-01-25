function pluszero(num){
    let zeroed
    if(num<10){
        zeroed = "0"+num
    } else {
        zeroed = num
    }
    return String(zeroed)
}

module.exports = function getTime(){
    let today = new Date();
    let minute = today.getMinutes()
    let hour = today.getHours()
    let month = (today.getMonth()+1)
    let date = today.getDate();
    let day = month+"/"+date
    let sum =hour*60+minute
    minute = pluszero(minute)
    let time = hour+":"+minute
    let tooday = String(today.getFullYear())+"/"+month+"/"+date
    hour = pluszero(hour)
    month = pluszero(month)
    date = pluszero(date)
    let second = today.getSeconds();
    second = pluszero(second)
    let latest = Number(String(today.getFullYear())+month+date+hour+minute+second)
    let result = {date:day,fulldate:tooday,last:latest,time:time,sum:sum}
    return result
}