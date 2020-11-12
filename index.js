'use strict';
var mysql = require('mysql');
const express = require('express');
const fs = require('fs');
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
var cors  = require('cors');
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
    } , function (req, username, password, done){
        console.log("START CHECK ON"+username);
          if(!username || !password ) { return done(103, false, req.flash('message','All fields are required.')); }
          var salt = '7fa73b47df808d36c5fe328546ddef8b9011b2c6';
          con.query("select * from login where uname = ?", [username], function(err, rows){
              console.log(err); console.log(rows);
            if (err) return done(104,req.flash('message',err));
            if(!rows.length){ return done(102, false, req.flash('message','Invalid username or password.')); }
            salt = salt+''+password;
            var encPassword = crypto.createHash('sha1').update(salt).digest('hex');
            var dbPassword  = rows[0].pass;
            if(!(dbPassword == password)){
                console.log("PASS DIDNT MATCH");
                return done(101, false, req.flash('message','Invalid username or password.'));
             }
            return done(200, rows[0]);
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
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
      console.log("LOGIN REQUEST GOT");
      console.log("BODY"+req.body.pass);
      passport.authenticate('local', (err, user, info)=>{        
        if (err) {         
          console.log("LOGIN ERROR RESPONSE "+err);
          return res.send("RESPONSE"+err);
          //return next(err); 
        }
        if (!user) { 
          console.log("LOGIN ERROR RESPONSE NO USER"+err);
          return res.send("RESPONSE"+err);; 
        }
        req.logIn(user, (err)=>{
          if (err) {
              console.log("LOGIN ERROR LOG IN AATTMP "+err);
             return next(err); 
            }
            console.log("LOGIN DONE");
          return res.send(202);;
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
