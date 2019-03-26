// *********************
// Decentralized Storage System
// Sarjil Saurabh Sagar Krunal
// Final Year Project
// *********************
var express             = require('express'),
  app                   = express(),
  session               = require('express-session'),
  passport              = require('passport'),
  flash                 = require('connect-flash'),
  LocalStrategy         = require('passport-local'),
  passportLocalMongoose = require('passport-local-mongoose'),
  bodyParser            = require('body-parser'),
  User                  = require('./models/user'),
  async                 = require('async'),
  nodemailer            = require('nodemailer'),
  crypto                = require('crypto'),
  // Files                 = require('./models/files'),
  mongoose              = require('mongoose'),
  fileUpload            = require('express-fileupload'),
  fs                    = require("fs");

//ipfs implementation

var ipfsClient = require('ipfs-http-client');
var ipfs       = ipfsClient('localhost','5001',{protocol:'http'});


mongoose.connect('mongodb://localhost/DecentralizedStorage', {useNewUrlParser: true});

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static('public'));
app.use(session({
  secret           : "Blockchiain Decentralized Storage System",
  resave           : false,
  saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//index page
app.get('/',isLoggedIn, function(req,res){
  User.findOne({username:req.user.username},function(err,data){
    if(err){
        res.redirect('/login');
    }
    else{
      res.render('index',{files:data.files,_id:req.user._id,name:data.name});
    }
  });
});

//login page
app.get('/login',function(req,res){
  res.render('login',{error:req.flash("error"),success:req.flash("success")});
});

app.post('/login',passport.authenticate('local',{
  successRedirect : '/',
  failureFlash    : {type:"error",message  :"Incorrect Credentials "},
  failureRedirect : '/login'
}),function(req,res){
});

//signUp page
app.get('/signUp',function(req,res){
  res.render('signUp',{error:req.flash("error")});
});
//signUp logic
app.post('/signUp',function(req,res){
  User.register(new User(
    {
      name : req.body.name,
      username : req.body.username,
    }
  ),req.body.password,function(err,user){
    if(err){
      req.flash("error",err.message);
      return res.redirect('/signUp');
    }
    passport.authenticate("local")(req,res,function(){
      // console.log('Executed');
      res.redirect('/');
    });
  });
});

//logout
app.get('/logout',function(req,res){
  req.logout();
  req.flash("success","Logged out successfully!");
  res.redirect('/login');
});

// forgot password
app.get('/forgot', function(req, res) {
  res.render('forgot',{error:req.flash("error"),success:req.flash("success")});
});

app.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ username: req.body.username }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'maheshbhaibc@gmail.com',
          pass: 'sasasakru'
        }
      });
      var mailOptions = {
        to: user.username,
        from: 'maheshbhaibc@gmail.com',
        subject: 'Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.username + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

app.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

app.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          });
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'maheshbhaibc@gmail.com',
          pass: 'sasasakru'
        }
      });
      var mailOptions = {
        to: user.username,
        from: 'maheshbhaibc@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.username + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/login');
  });
});
//ipfs implementation
app.post('/upload', function(req, res) {
  if (Object.keys(req.files).length == 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.file,
      name       = sampleFile.name,
      type       = sampleFile.mimetype,
      path       = "public/"+name;
  // Use the mv() method to place the file somewhere on your server
  console.log(typeof sampleFile.mimetype,type);
  sampleFile.mv('public/'+name, function(err) {
    if (err)
      return res.status(500).send(err);
      ipfs.addFromFs(path, { recursive: false },
      (err, result) => {
      if (err) { throw err }

      User.findOne({username:req.user.username},function(err,addFiles){
        addFiles.files.push({
            name : result[0].path,
            hash : result[0].hash,
            filetype : type,
            size : result[0].size
        });
        addFiles.save();
      });
      fs.unlink(path, function(error) {
          if (error) {
              throw error;
          }
          console.log('Deleted !!');
      });

            console.log('File uploaded');
            res.redirect('/');
    });

  });
});

app.post('/deleteFile/:user_id/file/:file_id',function(req,res){
  let user_id = req.params.user_id,
        file  = req.params.file_id;
  User.findById( user_id,function(err,currentUser){
      if(err){
        console.log(err);
      }else{
        currentUser.files.pull(file);
        currentUser.save();
      }
    });
  res.redirect('/');
});

//error 404
app.get('*',function(req,res){
  res.redirect('/');
});

//middleware login
function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/login');
}

//app running on port
app.listen(8080,function(){
  console.log('Server running on port 8080');
});
