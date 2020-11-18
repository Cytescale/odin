'use strict';
var mysql = require('mysql');
const express = require('express');
const fs = require('fs');
var qs = require('querystring')
const app = express();
const server_setting = require('./server_setting').setting;
const odinbaase_config_data = require('./config/odinbase_config').data;
var con = null;
var bodyParser = require('body-parser')
var flash             = require('connect-flash');
var crypto            = require('crypto');
var passport          = require('passport');
var LocalStrategy     = require('passport-local').Strategy;
var  session              = require('express-session');
const jwt = require('jsonwebtoken');
const ExtractJWT = require('passport-jwt').ExtractJwt;

var config = require('./env.json')[process.env.NODE_ENV || 'development'];
//var BetterMemoryStore = require('session-memory-store')(sess);

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated())
    return next();
    res.redirect('http://localhost:3000/login');
}

class server_entry{
  constructor(){
  }
  
  init(){
    //var store = new BetterMemoryStore({ expires: 60 * 60 * 1000, debug: true });
    con = mysql.createConnection(odinbaase_config_data);
    if(con!=null){
    con.connect((err)=>{
      if (err) {
        console.error("ERROR CAUSED 100");
        throw err;
      }else{
        console.log("Connected!");
      }
    });
    }
    else{
      console.error("DATABASE CONNECTION FAILED");
    }



    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(session({ secret: 'keyboard cat',resave: true, saveUninitialized:true}));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    


    
    passport.use('local', new LocalStrategy({
      usernameField: 'uname',
      passwordField: 'pass',
      passReqToCallback: true
    } ,
     function (req, username, password, done)
     {
        console.log("START CHECK ON "+username);

          if(!username || !password ) 
          {
             return done(103, false, req.flash('message','All fields are required.')); 
          }
          var salt = '7fa73b47df808d36c5fe328546ddef8b9011b2c6';
          con.query("select * from login where uname = ?", [username], function(err, rows)
          {
            if (err) return done(true,req.flash('message',err));
           //checkPP
             if(!rows.length)
             { 
               return done(true, false, req.flash('message','Invalid username or password.')); 
              }
            salt = salt+''+password;
            var encPassword = crypto.createHash('sha1').update(salt).digest('hex');
            var dbPassword  = rows[0].pass;
            if(!(dbPassword == password))
            {
                console.log("PASS DIDNT MATCH");
                return done(true, false, req.flash('message','Invalid username or password.'));
             }
            return done(false, rows[0]);
          });
        }
    ));
    passport.serializeUser(function(user, done){
      done(null, user.id);
    });

    passport.deserializeUser(function(id, done){
      con.query("select * from login where id = "+ id, function (err, rows){
          done(err, rows[0]);
      });
  });

    app.get('/', (req, res) => {
      res.send("SERVER RESPONSE");
    });


    app.get('/isAuth',isAuthenticated, function(req, res, next) { 
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
  
    });

    app.get('/getdata',(req,res)=>{
      con.query("SELECT * FROM login",(err, result, fields)=>{
        if (err) throw err;
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.send(result[0]).status(200);
      });
      
    });
  
    app.post('/loginattempt',(req, res, next)=>{
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Credentials','true');
        console.log("BODY"+JSON.stringify(req.body));
      passport.authenticate('local', (err, user, info)=>{        
        if (err===false) {    
          console.log("err"+err)     
          res.send(JSON.stringify({errcode:err,user:null,message:'login error'}));
          return next(err);
        }
        if (!user) { 
          console.log("user false"+err)     
          return res.send(JSON.stringify({errcode:err,user:null,message:'login fail'}));
        }
        req.logIn(user, (err)=>{
          if (err) {
            return next(err);
            }
            const token = jwt.sign({id:user.id}, 'TOP_SECRET');
          return res.send(JSON.stringify({errcode:false,user:token,message:'login success'}));
        });
      })(req, res, next);
    });

 



    app.listen(server_setting.PORT, () => {
      console.log('Server Running on port'+server_setting.PORT);
    });
  }

}

process.on("SIGINT",()=>{
  console.warn("PROCESS AT END");
});
process.once('SIGUSR2', function () {
  gracefulShutdown(function () {
    process.kill(process.pid, 'SIGUSR2');
  });
  console.warn("GRACE SHUTDOWN");
});
process.on('exit', function(code) {
  console.warn('About to exit with code:', code);
});


new server_entry().init();
