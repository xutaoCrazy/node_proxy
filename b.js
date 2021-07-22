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
const csv = require('csv')   
const readline = require('readline');
// const proJson = require('pro.json')    
           

// let obj = require('/Users/zhangahong/zcs_projects/service-platfrom-admin/src/lang/zh.js');
// import {tableJson} from '/Users/zhangahong/zcs_projects/service-platfrom-admin/src/lang/zh.js';

const mysqlTable='train_list'

const translate = require('google-translate-api');

// console.log(tableJson);

var connection = mysql.createConnection({     
  // host     : '172.16.1.230',       
  host     : '172.16.1.230',       
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






var a= async function (){
  koaRequest({
      method: 'get',
      uri: 'https://kyfw.12306.cn/otn/resources/js/framework/station_name.js',
      json: true//设置返回的数据为json
  },function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var dataList=body;
        dataList=dataList.split('@')
        var a=new  Date()
        a.getTime()
        for(var i=1;i<dataList.length;i++) {
          var dataListSplit=dataList[i].split('|')
          var queryJSON={};
          queryJSON.id=i;
          queryJSON.origin_info=dataList[i];
          queryJSON.station_no=dataListSplit[5];
          queryJSON.station_abbr=dataListSplit[0];
          queryJSON.station_name=dataListSplit[1];
          queryJSON.station_telecode=dataListSplit[2];
          queryJSON.ch_pinyin=dataListSplit[3];
          queryJSON.simp_pinyin=dataListSplit[4];
          queryJSON.update_time=moment().format('YYYY-MM-DD HH:mm:ss');
          connection.query(`INSERT INTO ${mysqlTable} SET  ?`,queryJSON,function(error,results,fileds){
            if(error) throw error;
          })
        }
        var b=new  Date();
        b.getTime();
        c=b-a
        console.log(c,'时间啊')
      }
    })

}
// a();

var c =function(){
  var a=new  Date()
  a.getTime()
  koaRequest({
    method: 'get',
    uri: 'https://kyfw.12306.cn/otn/resources/js/query/train_list.js?scriptVersion=1.0',
    json: true//设置返回的数据为json
  },function (error, response, body) {
    var b=new  Date()
    b.getTime();
      c=b-a
      console.log(c,'时间啊')
   
    if (!error && response.statusCode == 200) {
      var  train_data=body;
      // console.log(body);
      var list=train_data.split('=')[1];
      var f=JSON.parse(list);
      var v=1;
      var exportArr=[];
      for(var item in  f){
        var listArr=f[item]
        for(var g in listArr){
          var listArrCode=listArr[g]
          for(var i=0;i<listArrCode.length;i++){
            var jsonArr={};
            var aJSOn=[];
            jsonArr.id=v++;
            aJSOn.push(jsonArr.id);
            // console.log(v);
            var code= listArrCode[i].station_train_code
            var codeName=code.split('(')[1].split(')');
            jsonArr.station_train_code=code
            aJSOn.push(code)
            jsonArr.train_no=listArrCode[i].train_no
            aJSOn.push(listArrCode[i].train_no)
            jsonArr.train_date=item
            aJSOn.push(item)
            jsonArr.train_type=g
            aJSOn.push(g)
            jsonArr.train_sn=code.split('(')[0]
            aJSOn.push(code.split('(')[0])
            jsonArr.between_station=codeName[0];
            aJSOn.push(codeName[0])
            jsonArr.from_station=codeName[0].split('-')[0];
            aJSOn.push(codeName[0].split('-')[0])
            jsonArr.to_station=codeName[0].split('-')[1];
            aJSOn.push(codeName[0].split('-')[1])
            // exportArr.push(jsonArr);
            // if(v < 500000){
              exportArr.push(aJSOn)
            // }
            
            // connection.query(`INSERT INTO ${mysqlTable} SET  ?`,jsonArr,function(error,results,fileds){
            //   if(error) throw error;
            //   setTimeout(()=>{
            //     console.log(jsonArr)
            //   },1000)
            // })
          }
        }
      }
      var sql = "INSERT INTO train_list(id, station_train_code, train_no, train_date, train_type, train_sn, between_station, from_station, to_station) VALUES ?";
      connection.query(sql,[exportArr],function(error,results,fileds){
        if(error) throw error;
        console.log('成功了')
      })
      // let textCN = JSON.stringify(exportArr,null,'\t')
      // let fileCN = path.join(__dirname, 'zh_cn.json');
      // fs.writeFile(fileCN, textCN, function (err) {
      //      if (err) {
      //          console.log(err);
      //      } else {
            
      //      }
      // });
     
    }
  })
}
// c();


var d=function(){
  koaRequest({
    method: 'get',
    // uri: 'https://tianqiapi.com/api?version=v6&appid=21863634&appsecret=KaCHSn81',
    // url:'http://wthrcdn.etouch.cn/weather_mini?citykey=101280101',
  //  url:'http://icard.ylapi.cn/id_card/query.u?uid=11690&appkey=bd23d5db4c3db40b2859f50696c22953&idnumber=610427199407085437',
   url:'http://area.ylapi.cn/ad_area/division_de.u?uid=11690&appkey=de16871c570e23f22eb8293d85bf2f22&parentId=620000000000',
    json: true//设置返回的数据为json
  },function (error, response, body) {
    console.log(body)
  })
  
}
// d()


// 

//读取内容
// fs.readFile('xt1.json','utf8',(err,datastr)=>{
//   // code, name, areaCode, cityCode, provinceCode, cityName, provinceName, areaName
//   datastr=JSON.parse(datastr);

//   // var sql = "INSERT INTO streat(code, name, areaCode, cityCode, provinceCode, cityName, provinceName, areaName) VALUES ?";
//   // connection.query(sql,[datastr],function(error,results,fileds){
//   //   if(error) throw error;
//   //   console.log('更新完成')
//   // })
//   return false;

//   var pro=fs.readFileSync('pro.json','utf8')
//   var city=fs.readFileSync('city.json','utf8')
//   var area=fs.readFileSync('area.json','utf8')
//   pro=JSON.parse(pro);
//   city=JSON.parse(city);
//   area=JSON.parse(area);
//   var  JsonArr=[];
//   for(var i=0;i<datastr.length;i++){
//     var arr1=[];
//     arr1.push(datastr[i].code)
//     arr1.push(datastr[i].name)
//     arr1.push(datastr[i].areaCode)
//     arr1.push(datastr[i].cityCode)
//     arr1.push(datastr[i].provinceCode)
//     for(var j=0;j<city.length;j++){
//       if(datastr[i].cityCode==city[j].code){
//         arr1.push(city[j].name);
//       }
//     }
//     for(var j=0;j<pro.length;j++){
//       if(datastr[i].provinceCode==pro[j].code){
//         arr1.push(pro[j].name);
//       }
//     }
    
//     for(var j=0;j<area.length;j++){
//       if(datastr[i].areaCode==area[j].code){
//         arr1.push(area[j].name);
//       }
//     }
//     console.log(arr1)
//     JsonArr.push(arr1)
//   }
//   let textCN = JSON.stringify(JsonArr,null,'\t')
//   let fileCN = path.join(__dirname, 'xt1.json');
//   fs.writeFile(fileCN, textCN, function (err) {
//      
//   });
  
  
  
  
// })
  
koaRequest({
  
  method: 'get',
  uri: 'http://v.juhe.cn/jztk/query',
  qs: {
    subject:4,
    model:'c2',
    testType:"order",
    key:'9f1975e54a928280e8f75bd599f75fca'
  },
  json: true//设置返回的数据为json
},function (error, response, body) {
if (!error && response.statusCode == 200) {
    var stationsJSON=body
  var jkArr=[];
  for(var i=0;i<stationsJSON.result.length;i++){
    var model=[];
    for(item in stationsJSON.result[i]){
      model.push(stationsJSON.result[i][item])
    };
    model.push('4');
    model.push('c2');
    jkArr.push(model);
  }
  // var sql = "INSERT INTO jk(id, question, answer, item1, item2, item3, item4, explains, url, subject, model) VALUES ?";
  // connection.query(sql,[jkArr],function(error,results,fileds){
  //   if(error) throw error;
  //   console.log('更新完成')
  // })
}
})
  
  
  
// fs.readFile('jkyidiantong.json','utf8',(err,datastr)=>{
//   var stationsJSON=JSON.parse(datastr)
//   var jkArr=[];
//   for(var i=0;i<stationsJSON.result.length;i++){
//     var model=[];
//     for(item in stationsJSON.result[i]){
//       model.push(stationsJSON.result[i][item])
//     };
//     model.push('1');
//     model.push('b1');
//     jkArr.push(model);
//   }
//   // var sql = "INSERT INTO jk(id, question, answer, item1, item2, item3, item4, explains, url, subject, model) VALUES ?";
//   // connection.query(sql,[jkArr],function(error,results,fileds){
//   //   if(error) throw error;
//   //   console.log('更新完成')
//   // })
//   return false;
// })
  
  
  
  
  


/* 监听端口 */
app.listen(4000, () => {
  console.log('listen:3000');
})


 
