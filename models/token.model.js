const mongoose = require('mongoose')
const Schema = mongoose.Schema


const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        trim: true,
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    latest: {
        type: Number,
        required: true
    },
    latestmonday:{
        type: Number,
        required: true
    },
    latesthour:{
        type: Object,
        required: true
    }
}, {
    timestamps: true
})

const Token = mongoose.model('Tokens', userSchema)

module.exports = Token