'use strict';
var mysql = require('mysql');
const express = require('express');
const fs = require('fs');
const app = express();
const server_setting = require('./server_setting').setting;
const odinbaase_config_data = require('./config/odinbase_config').data;


var con = null;

class server_entry{
  constructor(){
  }
  init(){
    con = mysql.createConnection(odinbaase_config_data);
    if(con!=null){

    con.connect((err)=>{
      if (err) {
        console.error("ERROR CAUSED 100");
        throw err;
      }else{
        console.log("Connected!");
        con.query("SELECT * FROM login",(err, result, fields)=>{
          if (err) throw err;
          console.log(result[0]);
        });
      }
    });
    }
    else{
      console.error("DATABASE CONNECTION FAILED");
    }

    app.get('/', (req, res) => {
      res.send("SERVER RESPONSE");
    });

    app.get('/getdata',(req,res)=>{
      con.query("SELECT * FROM login",(err, result, fields)=>{
        if (err) throw err;
        console.log("ASKED DATA"+result[0]);
        res.send(result[0]).status(200);
      });
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
