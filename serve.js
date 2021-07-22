var http = require('http');
var fs = require('fs');
 
http.createServer((req,res)=>{
  //data.json为自定义的json文件
  fs.readFile('zh_cn.json',(err, data)=>{
    //必须添加这些头部信息，允许跨域请求
    res.writeHead(200,{
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "X-Requested-With"
    })
    if(err){
      res.write("server error")
    }
    else{
      res.write(data);
    }
    res.end();
  });
}).listen(3000)