var mongoose = require('mongoose'),
    passportLocalMongoose = require('passport-local-mongoose');

var userSchema = new mongoose.Schema({
  name : String,
  username : String,
  password : String,
  files :[{
    name : String,
    hash : String,
    size : Number
  }]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User',userSchema);
