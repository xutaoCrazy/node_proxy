/* 引入express框架 */
const express = require('express');
const moment = require('moment');
var mysql  = require('mysql');  
var uuid = require('node-uuid');
var mime = require('mime');
var url = require('url');
let fs = require('fs');
let path = require('path');
var request = require('request');
const cheerio = require("cheerio");
const axios = require("axios");
const koaRequest = require('koa2-request')               

// let obj = require('/Users/zhangahong/zcs_projects/service-platfrom-admin/src/lang/zh.js');
// import {tableJson} from '/Users/zhangahong/zcs_projects/service-platfrom-admin/src/lang/zh.js';

const mysqlTable='languageback'

const translate = require('google-translate-api');

// console.log(tableJson);

var connection = mysql.createConnection({     
  host     : '172.16.1.230',       
  // host     : '192.168.3.21',       
  user     : 'root',              
  password : 'xutao9478abc',       
  port: '3306',                   
  database: 'cloudhealth' ,
  timezone:"SYSTEM"
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
  connection.query(`SELECT * FROM ${mysqlTable} WHERE cn='${parseObj.query.text}'`,function(error,results,fileds){
    if(error) throw error;
    res.writeHead(200,{"Content-Type":"text/json;chartset=utf-8"})
    if(results.length>0){  //判断 能出来数据不；  能查出来数据  判断有没有翻译
      debugger;
      if(!results[0].en){
        koaRequest({
          method: 'get',
          uri: 'http://fanyi.youdao.com/translate',
          qs: {
            doctype:'json',
            type:'AUTO',
            i:results[0].cn
          },
          json: true//设置返回的数据为json
      },function (error, response, body) {
        if (!error && response.statusCode == 200) {
         var text=body.translateResult[0][0].tgt
         var sql = `UPDATE ${mysqlTable} SET en = '${text} 'WHERE  keyid='${results[0].key}'`;
         connection.query(sql,function(error,results,fileds){
           if(error) throw error;
           var sql = `SELECT * FROM ${mysqlTable} WHERE cn='${results[0].cn}'`;
           connection.query(sql,function(error,results,fileds){
             res.end(JSON.stringify({
               code: 200,
               message: '成功',
               data: {
                 list: results
               }
             }))
           })
         })
        }
      })
      }else{
        res.end(JSON.stringify({
        code: 200,
        message: '成功',
        data: {
          list: results
        }}))
      }
    }else{ 
      var a=new  Date()
      a.getTime()
      koaRequest({
        method: 'get',
        uri: 'http://fanyi.youdao.com/translate',
        qs: {
          doctype:'json',
          type:'AUTO',
          i:parseObj.query.text
        },
        json: true//设置返回的数据为json
    },function (error, response, body) {
      var b=new  Date();
      b.getTime();
      c=b-a
      console.log(c,'翻译开始')
      if (!error && response.statusCode == 200) {
        var textEn=body.translateResult[0][0].tgt
        var items=uuid.v1().replace(/-/g,"")
        var uuid4 = uuid.v4();
        var text=parseObj.query.text;
        var jsonArr={}
        jsonArr.key=items;
        jsonArr.html="{{$t('"+items+"'/*"+text+"*/)}}";
        jsonArr.vm="$t('"+items+"'/*"+text+"*/)";
        jsonArr.fn="this.$t('"+items+"'/*"+text+"*/)";
        jsonArr.cn=text;
        jsonArr.keyid=items;
        jsonArr.en=textEn;
        jsonArr.id=uuid4.toString().replace(/-/g,"")
        jsonArr.createtime=moment().format('YYYY-MM-DD HH:mm:ss')
        connection.query(`INSERT INTO ${mysqlTable} SET  ?`,jsonArr,function(error,results,fileds){
          if(error) throw error;
          var sql = `SELECT * FROM ${mysqlTable} WHERE cn='${parseObj.query.text}'`;
          connection.query(sql,function(error,results,fileds){
            var d=new  Date();
            d.getTime();
            var f=d-b
            console.log(f,'查询完成')
            res.end(JSON.stringify({
              code: 200,
              message: '成功',
              data: {
                list: results
              }
            }))
          })
        })
      }
    })
    }
  })

})

app.get('/api/loadListTable', (req, res) => {   //查询所有的接口
  var parseObj = url.parse(req.url, true);
  try {
    connection.query(`SELECT * FROM ${mysqlTable}`,function(error,results,fileds){
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
  }catch (err){
    console.log("error:" + err);
  }
 
})

app.get('/api/exportfile', (req, res) => {   //导出接口
  var parseObj = url.parse(req.url, true);
  var mysql ='SELECT * FROM language WHERE  createtime between "2021-05-31 00:00:00" and "2099-05-28 23:59:59"'
  // if(parseObj.query){
  //   var mysql='SELECT * FROM language ' 
  // }
  connection.query(mysql,function(error,results,fileds){
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

app.get('/api/getlist', (req, res) => {   //保存一个的接口
  var parseObj = url.parse(req.url, true);
  var uuid4 = uuid.v4();
  parseObj.query.id=uuid4.toString().replace(/-/g,"")
  parseObj.query.createtime=moment().format('YYYY-MM-DD HH:mm:ss')
  connection.query(`INSERT INTO ${mysqlTable} SET  ?`,parseObj.query,function(error,results,fileds){
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

app.get('/api/updatelist', (req, res) => {   //更新语句  汉语翻译英语
  debugger;
  var parseObj = url.parse(req.url, true);
    var sql = `UPDATE ${mysqlTable} SET en = '${parseObj.query.en} 'WHERE  keyid='${parseObj.query.key}'`;
    console.log(sql);
    connection.query(sql,function(error,results,fileds){
      if(error) throw error;
      var sql = `SELECT * FROM ${mysqlTable} WHERE cn='${parseObj.query.cn}'`;
      connection.query(sql,function(error,results,fileds){
        res.end(JSON.stringify({
          code: 200,
          message: '成功',
          data: {
            list: results
          }
        }))
      })
    })
})


app.post('/api/inserlist', (req, res) => {   //首次导入数据接口
  var parseObj = req.body.data
  console.log()
  for(let i=0;i<parseObj.length;i++){
    var uuid4 = uuid.v4();
    parseObj[i].id=uuid4.toString().replace(/-/g,"")
    parseObj[i].createtime=moment().format('YYYY-MM-DD HH:mm:ss')
    connection.query(`INSERT INTO ${mysqlTable} SET  ?`,parseObj[i],function(error,results,fileds){
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

app.get('/api/download', function(req, res){  // 下载接口
      console.log(2222)
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

// try {
//   connection.query(`SELECT * FROM ${mysqlTable}`,function(error,results,fileds){
//     if(error) throw error;
//     console.log(results);
//     for(let i=0;i<results.length;i++){
//       var sql = `UPDATE ${mysqlTable} SET keyid = '${results[i].key} 'WHERE  id='${results[i].id}'`;
//       console.log(sql);
//       connection.query(sql,function(error,results,fileds){
//         if(error) throw error;
//         console.log(results)
//       })
//     }
//   })
// } catch (error) {
  
// }


var a=new  Date()
a.getTime()
// translate('你好多大的', {to: 'en'}).then(res => {
//   console.log(res.text);
  // var b=new  Date();
  // b.getTime();
  // c=b-a
  // console.log(c,'时间啊')
// }).catch(err => {
//   console.error(err);
// });
// axios.get('http://fanyi.youdao.com/translate',{params:pa}).then(response =>{
//   console.log(response.config);
// })

var a= async function (){
  var a=new  Date()
a.getTime()
  koaRequest({
      method: 'get',
      uri: 'http://fanyi.youdao.com/translate',
      qs: {
        doctype:'json',
        type:'AUTO',
        i:'明天去哪'
      },
      json: true//设置返回的数据为json
  },function (error, response, body) {
     var b=new  Date();
  b.getTime();
  c=b-a
  console.log(c,'时间啊')
    if (!error && response.statusCode == 200) {
     console.log(body.translateResult[0][0].tgt) 
    }
  })

}

// a();

/* 监听端口 */
app.listen(3000, () => {
  console.log('listen:3000');
})


 