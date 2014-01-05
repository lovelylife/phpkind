
var http = require("http");
var fs = require('fs');
var request = require('request');
//var jar = request.jar();
var url = require('url');
var querystring = require('querystring');
var num = 0;
var orignal_headers = {
  "Content-Type": "text/html; charset=utf-8", 
  "Access-Control-Allow-Origin": "http://wayixia.com",
  "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",  
  "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,OPTIONS",
  "Access-Control-Allow-Credentials": true 
};

function parse_cookies (req) {
    var list = {},
        rc = req.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = unescape(parts.join('='));
    });

    return list;
}


function echo(res, data) {
  var headers = orignal_headers;
  headers['Content-Length'] = data.length;
  res.writeHead(200, headers);
  res.write(data);
  res.end();
}

function echo_json(res, header, data, extra) {
  var object = {};
  object.header = header || null;
  object.data   = data || null;
  object.extra  = extra || null
  var str = JSON.stringify(object);
  echo(res, str);
}

function http_process(req, response, data_from_agent) {
  // submit to web
  var object = JSON.parse(decodeURIComponent(data_from_agent));
  var forward_cookie = req.headers.cookie;
  var image_cookie = object.data.img.cookie;
  // remove the image cookie
  delete object.data.img.cookie; 
  
  console.log("http_process called " + object.data.img.srcUrl + ", user-agent: "+req.headers['user-agent']);
  var url = "http://wayixia.com/index.php?app=wayixia&mod=api&action=wa-image&inajax=true";
  var senddata = 'postdata='+encodeURIComponent(encodeURIComponent(JSON.stringify(object)));
  request(
    {
      url : url,
      method : "POST",
      headers: {
        "content-type" : "application/x-www-form-urlencoded",
        "Cookie" : forward_cookie,
        "User-Agent" : "wayixia node server",
      },
      body : senddata, 
    }, 
    // handler response
    function(error, res, body) {
       if(!error && res.statusCode==200) {
         console.log("route request to wayixia web server");
         try {
	   var json_response = JSON.parse(decodeURIComponent(body));
           // start wa image and save to disk
	   var get_image_options = {
             url : object.data.img.srcUrl, 
             headers : {
               "Cookie" : image_cookie,
      	       "Referer" : object.data.img.referer,
      	       "User-Agent" : req.headers['user-agent'],  
             } 
           };
           console.log(json_response);
	   echo(response, body);
	   return;
           var r = request(get_image_options, function(err, res, body) {
             if(!err && res.statusCode == 200) {
             } else {
               echo(response, "statuscode: "+ res.statusCode);
             } 
	   }).pipe(fs.createWriteStream("D:\\t"+(num++)+".jpg"));
         } catch(e) {
           console.log(err);
           echo_json(response, -1, err.message, null);
         }
       } else {
         console.log(err);
         echo_json(response, -1, err.message, null);
       }
    }
  );

  /*
    } else {
      echo(response, "statuscode: "+ res.statusCode);
    }
  // get image options  
  var get_image_options = {
    url : object.data.img.srcUrl, //"http://wayixia.com/index.php?app=wayixia&mod=api&action=wa-image&inajax=true",
    headers : {
        "Cookie" : object.data.img.cookie,
       	"Referer" : object.data.img.referer,
       	"User-Agent" : req.headers['user-agent'], //"Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36" 
      }, 
  };

  console.log("test");

  // get image and save file
  request(get_image_options, function(err, res, body) {
    console.log(res.statusCode);
    if(!err && res.statusCode == 200) {
      console.log(forward_cookie);
      // route to web api 
      delete object.data.img.cookie; 
      var url = "http://wayixia.com/index.php?app=wayixia&mod=api&action=wa-image&inajax=true";
      var senddata = 'postdata='+encodeURIComponent(encodeURIComponent(JSON.stringify(object)));
      request(
        { url : url,
          method : "POST",
	  headers: {
	    "content-type" : "application/x-www-form-urlencoded",
            "Cookie" : forward_cookie,
	    "User-Agent" : "wayixia node server",
	  },
          body : senddata, 
        }, function(error, res, body) {
           if(!error && res.statusCode==200) {
             console.log("route request to wayixia web server");
             echo(response, body);  
	   } else {
	     console.log(err);
	     echo(response, "{\"header\": 0}");
	   }
        }
      );
    } else {
      echo(response, "statuscode: "+ res.statusCode);
    }
  }).pipe(fs.createWriteStream("D:\\t"+(num++)+".jpg"));
  */
}

var Q = {
  dispatch: function(req, res) {
    var env = url.parse(req.url);
    switch(env.pathname) {
    case '/getimage':
      this.getimage(req, res);
      break;
    default:
      echo(res, "no supported");
      res.end();
    }
  },

  getimage: function(req, res) {
    console.log('getimage call.');    
    var postdata = '';
    req.setEncoding('utf8');
    req.addListener('data', function(chunk) {
      console.log('ondata');
      postdata += chunk.toString();
    });

    req.addListener('end', function() {
      try {
        console.log('onend');
        var qs = querystring.parse(postdata); 
        console.log(qs.postdata);
        http_process(req, res, qs.postdata);
      } catch(e) {
        console.log(e);
        echo(res, e.message);
      }
    });
  },
};


var server = http.createServer(function(req, res) {   
  console.log('new request');
  //console.log(req.headers.cookie);
  //echo(res, "{\"header\":0, \"data\": null, \"extra\": null}");
  Q.dispatch(req, res);
}).on('connection', function(socket) {
  socket.setNoDelay(true);
}).listen(8080);

console.log('Server is listening to http://localhost/ on port 8080бн');

