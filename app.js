//jshint esversion:6
require('dotenv').config()

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');

const _ = require("lodash");
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate"); //for using google oth findorcreate method








const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


//USING EXPRESS SESSION
app.use(session({
  secret: 'it is very secret',
  resave: false,
  saveUninitialized: false,
 
}))

//INITIALIZE PASSPORT
app.use(passport.initialize());
//USING PASSPORT TO USE SESSION
app.use(passport.session());





//To Connect the database
// mongoose.connect("mongodb://localhost:27017/blogDB", { useNewUrlParser: true, useUnifiedTopology: true  });

mongoose.connect("mongodb+srv://admin-Nikhil:Nikhil@2001@cluster0.d4duu.mongodb.net/blogDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//To remove Deprication Warning
mongoose.set("useCreateIndex", true);


//To Create the new schema
const blogSchema =new mongoose.Schema(  {
  title: String,
  content: String,
  
});

const userSchema = new mongoose.Schema({
  username:String,
  password:String,
  googleId: String,
})

//USING PASSPORTLOCALMONGOOSE TO GIVE HASHING AND SALTING TO USER PASSWORD
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

  
//To Create a new Model

const blog = new mongoose.model("blog", blogSchema);
const User = new mongoose.model('User',userSchema)

passport.use(User.createStrategy());//FROM PASSPORT-LOCAL-MONGOOSE



//TO CREATE COOKIES
passport.serializeUser(function (user, done) {
  done(null, user);
});

//TO DESTROY COOKIE
passport.deserializeUser(function (user, done) {
  done(null, user);
});


passport.use(new GoogleStrategy({
  clientID:process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/blogic"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));


const homeStartingContent =
  "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent =
  "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent =
  "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";



// const posts = [];


// STARTING ALL THE ROUTES

app.get('/',(req,res)=>{
  res.render('AccountPage')
});

app.get('/register',(req,res)=>{
  res.render('register')
});

app.post("/register", (req, res) => {
  //from passport-local-mongoose module
  //IT WILL CREATE USER ACCOUNT AND AUTHENTICATE USING PASSPORT
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/home");
        });
      }
    }
  );
});

app.get('/login',(req,res)=>{
 res.render('login')
})

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,

  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function (err) {
        if(err){
          res.send('Please Register First')
        }else{
        res.redirect("/home");

        }
      });
    }
  });
});

app.post('/login',
  passport.authenticate('local'),
  function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    res.redirect('/home');
  });

  app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/blogic', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
  });

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });


app.get("/home", (req, res) => {
 if(req.isAuthenticated()){

 
  blog.find({}, function (err, posts) {
    if (!err) {
      res.render("home", {
        StartingContent: homeStartingContent,

        posts: posts,
      });
    }
  });
 }else{
   res.redirect('/login')
 }
});

app.get("/posts/:postName", (req, res) => {
  // let requestedTitle = _.lowerCase(req.params.postName);
  let requestedTitle = req.params.postName;

  blog.findById(requestedTitle, function (err, foundone) {
    if (!err) {
      res.render("post", {
        title: foundone.title,
        content: foundone.content,
      });
    }
  });
  // blog.find({}, function (err, posts) {

  //   if (!err) {
  //     posts.forEach((post) => {
  //       let storedTitle = post._id;
  //       if (requestedTitle === storedTitle) {
  //         res.render("post", {
  //           title: post.title,
  //           content: post.content,
  //         });
  //       }
  //     });
  //   }
  // });
});

app.get("/about", (req, res) => {
  if(req.isAuthenticated()){
  res.render("about", { aboutContent: aboutContent });
    
  }else{
    res.redirect('/login')
  }
});

app.get("/contact", (req, res) => {
  if(req.isAuthenticated){
  res.render("contact", { contactContent: contactContent });

  }else{
    res.redirect('/login')

  }
});

app.get("/compose", (req, res) => {
  if(req.isAuthenticated()){
  res.render("compose");
    
  }else{
    res.redirect('/login')

  }
    
});

app.post("/compose", (req, res) => {
  const blogPost = new blog({
    title: req.body.postTitle,
    content: req.body.postBody,
  });

  blog.findOne({ title: blogPost.title }, function (err, foundOne) {
    if (!err) {
      if (!foundOne) {
        blogPost.save();

        res.redirect("/home");
      } else {
        res.redirect("/home");
      }
    }
  });

  // const post = {
  //   title: req.body.postTitle,
  //   content: req.body.postBody,
  // };
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
