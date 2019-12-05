const mongoose = require('mongoose')

const Schema = mongoose.Schema

const bcrypt = require('bcrypt-nodejs');

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
    },
    info: {
        type: Object,
        required: true,
    },
    disname: {
        type: String,
        required: true,
    },
    point: {
      type: Object,
      required: true,
    },
    quest:{
      type: Array,
      required: true
    },
    status:{
      type: String,
      required: true
    },
    hours:{
      type: Object,
      required: true
    },
    items:{
      type: Object,
      required: true
    },
    tasks:{
      type: Array,
      required: true
    },
    history:{
      type: Array,
      required: true
    },
    friends:{
      type: Array,
      required: true
    },
    trash:{
      type: String,
      required: true
    },
    users:{
      type: Array,
      required: false
    }
}, {
    timestamps: true
})

userSchema.pre('save', function(next) {
    // get access to the user model
    const user = this;
  
    // generate a salt then run callback
    bcrypt.genSalt(10, function(err, salt) {
      if (err) { return next(err); }
  
      // hash (encrypt) our password using the salt
      bcrypt.hash(user.password, salt, null, function(err, hash) {
        if (err) { return next(err); }
  
        // overwrite plain text password with encrypted password
        user.password = hash;
        next();
      });
    });
  });
  
  userSchema.methods.comparePassword = function(candidatePassword, callback) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if (err) { return callback(err); }
  
      callback(null, isMatch);
    });
  }

const User = mongoose.model('User', userSchema)

module.exports = User