/* 引入express框架 */
const express = require('express');
const moment = require('moment');
var mysql  = require('mysql');  
var uuid = require('node-uuid');
var mime = require('mime');
var url = require('url');
let fs = require('fs');
let path = require('path');


 
var connection = mysql.createConnection({     
  host     : '172.16.1.85',       
  user     : 'root',              
  password : 'xutao9478abc',       
  port: '3306',                   
  database: 'cloudhealth' 
}); 

connection.connect();

const app = express();
/* 引入cors */
const cors = require('cors');
app.use(cors());
/* 引入body-parser */
const bodyParser = require('body-parser');
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json({limit: '1000000000000mbmb'}));
app.use(bodyParser.urlencoded({limit: '1000000000000mb', extended: true}));

app.all('*', function (req, res, next) {
  if (!req.get('Origin')) return next();
  // use "*" here to accept any origin
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
  // res.set('Access-Control-Allow-Max-Age', 3600);
  if ('OPTIONS' == req.method) return res.send(200);
  next();
});

app.get('/', (req, res) => {
  res.send('<p style="color:red">服务已启动</p>');
})

app.get('/api/list', (req, res) => {   //查询接口
  var parseObj = url.parse(req.url, true);
  connection.query(`SELECT * FROM language WHERE cn='${parseObj.query.text}'`,function(error,results,fileds){
    if(error) throw error;
    res.writeHead(200,{"Content-Type":"text/json;chartset=utf-8"})
    res.end(JSON.stringify({
      code: 200,
      message: '成功',
      data: {
        list: results
      }
    }))
  })
})

app.get('/api/exportfile', (req, res) => {   //导出接口
  var parseObj = url.parse(req.url, true);
  var mysql ='SELECT * FROM language'
  if(parseObj.query){
    var mysql='SELECT * FROM language ' 
  }
  connection.query('SELECT * FROM language',function(error,results,fileds){
    if(error) throw error;
      if(results.length>0){
        var jsonCN={}
        var jsonEN={}
        results.map(item=>{
          jsonCN[item.key]=item.cn
          jsonEN[item.key]=item.en
        })
        let textCN = JSON.stringify(jsonCN,null,'\t')
        let fileCN = path.join(__dirname, 'zh_cn.json');
        fs.writeFile(fileCN, textCN, function (err) {
           if (err) {
               console.log(err);
           } else {
              res.writeHead(200,{"Content-Type":"text/json;chartset=utf-8"})
              res.end(fileCN)
            
           }
        });
        
        let textEN = JSON.stringify(jsonEN,null,'\t')
        let fileEN = path.join(__dirname, 'zh_en.json');
        fs.writeFile(fileEN, textEN, function (err) {
           if (err) {
               console.log(err);
           } else {
              
           }
        });
       
      }
     
    
  })
})

app.get('/api/getlist', (req, res) => {   //保存接口
  var parseObj = url.parse(req.url, true);
  var uuid4 = uuid.v4();
  parseObj.query.id=uuid4.toString().replace("-","")
  parseObj.query.createtime=moment().format('YYYY-MM-DD HH:mm:ss')
  connection.query('INSERT INTO language SET  ?',parseObj.query,function(error,results,fileds){
    if(error) throw error;
    res.writeHead(200,{"Content-Type":"text/json;chartset=utf-8"})
    res.end(JSON.stringify({
      code: 200,
      message: '成功',
      data: {
        list: parseObj.query
      }
    }))
  })
})

app.get('/api/updatelist', (req, res) => {   //更新语句
  var parseObj = url.parse(req.url, true);
  let sql = `UPDATE language SET en = '${parseObj.query.en}'WHERE key = '${parseObj.query.key}'`;
  connection.query(sql,function(error,results,fileds){
    if(error) throw error;
    res.writeHead(200,{"Content-Type":"text/json;chartset=utf-8"})
    res.end(JSON.stringify({
      code: 200,
      message: '成功',
      data: {
        list: parseObj.query
      }
    }))
  })
})


app.post('/api/inserlist', (req, res) => {   //添加批量数据接口
  
  var parseObj = req.body.data
  console.log()
  for(let i=0;i<parseObj.length;i++){
    var uuid4 = uuid.v4();
    parseObj[i].id=uuid4.toString().replace("-","")
    parseObj[i].createtime=moment().format('YYYY-MM-DD HH:mm:ss')
    connection.query('INSERT INTO language SET  ?',parseObj[i],function(error,results,fileds){
      if(error) throw error;
    })
  }
  res.writeHead(200,{"Content-Type":"text/json;chartset=utf-8"})
  res.end(JSON.stringify({
    code: 200,
    message: '成功',
    data: {
      list: []
    }
  }))
})

app.get('/api/download', function(req, res){
       var  currFile = path.join(__dirname,'zh_cn.json');
       fs.exists(currFile,function(exist) {
        if(exist){
            res.set({
                "Content-type":"application/octet-stream",
                "Content-Disposition":"attachment;filename=zh_cn"
            });
            fReadStream = fs.createReadStream(currFile);
            fReadStream.on("data",function(chunk){res.write(chunk,"binary")});
            fReadStream.on("end",function () {
                res.end();
            });
        }else{
            res.set("Content-type","text/html");
            res.send("file not exist!");
            res.end();
        }
      });
});



/* 监听端口 */
app.listen(3000, () => {
  console.log('listen:3000');
})


 
// connection.end();