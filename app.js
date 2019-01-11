// *********************
// Saurabh Panja panjasaurabh@gmail.com
// *********************
var express             = require('express'),
  app                   = express(),
  session               = require('express-session'),
  passport              = require('passport'),
  LocalStrategy         = require('passport-local'),
  passportLocalMongoose = require('passport-local-mongoose'),
  bodyParser            = require('body-parser'),
  User                  = require('./models/user'),
  mongoose              = require('mongoose');

mongoose.connect('mongodb://localhost/DecentralizedStorage', {useNewUrlParser: true});

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: "Blockchiain Decentralized Storage System",
  resave : false,
  saveUninitialize : false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//index page
app.get('/',isLoggedIn, function(req,res){
  res.render('index');
});

//login page
app.get('/login',function(req,res){
  res.render('login');
});

app.post('/login',passport.authenticate('local',{
  successRedirect : '/',
  failureRedirect : '/login'
}),function(req,res){
});

//signUp page
app.get('/signUp',function(req,res){
  res.render('signUp');
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
      console.log(err);
      return res.render('signUp');
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
  res.redirect('/login');
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
