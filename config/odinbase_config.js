"use strict";
const fsd =  require('fs');
const server_setting = require('../server_setting');
const data = { 
    host: "odinbase-do-user-8276304-0.b.db.ondigitalocean.com",
    user: "doadmin",
    password: "v6u1fippv3d9n9k0",
    port:"25060",
    database:"odinbase",
    ca : fsd.readFileSync(server_setting.setting.BASE_PATH+"/certi/odinbase_db_1.crt")
  }

module.exports.data = data;
