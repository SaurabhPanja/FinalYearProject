var mongoose = require('mongoose'),
    passportLocalMongoose = require('passport-local-mongoose');

var userSchema = new mongoose.Schema({
  name : String,
  username : String,
  password : String,
  resetPasswordToken : String,
  resetPasswordExpires: Date,
  files :[{
    name : String,
    hash : String,
    filetype : String,
    size : Number
  }]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User',userSchema);
