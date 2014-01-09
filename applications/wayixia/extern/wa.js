
var config = require('./config');
var http = require("http");
var fs = require('fs');
var request = require('request');
var imagesize = require('imagesize');
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

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
 });
}


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
  console.log("echo: \n" + data);

  var headers = orignal_headers;
  headers['Content-Length'] = data.length;
  res.writeHead(200, headers);
  res.write(data, 'utf8');
  res.end();
}

function echo_json(res, header, data, extra) {
  var object = {};
  object.header = header|| 0;
  object.data   = data || null;
  object.extra  = extra || null;
  // buffer ÏÝÚå
  var str = new Buffer(JSON.stringify(object));
  echo(res, str);
}

function get_remote_image(img, callback) {
  console.log('wa image(url:'+img.src+')');
  var options = {
    url : img.src, 
    headers : {
      "Cookie"  : img.cookie,
      "Referer" : img.referer,
      "User-Agent" : img.agent, //req.headers['user-agent'],  
    } 
  };
  
  var file_name = config.server.path + "/" + img.filename +".jpg";
  var stream = fs.createWriteStream(file_name);  
  var r = request(options, function(err, res, body) {
    if(!err && res.statusCode == 200) {
      var read_stream = fs.createReadStream(file_name);
      imagesize(read_stream, function (err2, result) {
        if (!err2) {
          console.log(result); // {type, width, height}
        } else {
	  console.log(err2);
	}
      })
      
      callback.onsuccess();
    } else {
      callback.onerror(err, res);
    } 
  }).pipe(stream); 
}

function wa_image(img, api_cookie, callback) {
  var object = {header: 0, data: {}, extra: null};
  object.img = img;
  var senddata = 'postdata='+encodeURIComponent(encodeURIComponent(JSON.stringify(object)));
  var options = {
    url : config.api.wa_image,
    method : "POST",
    headers: {
      "content-type" : "application/x-www-form-urlencoded",
      "Cookie" : api_cookie,
      "User-Agent" : "wayixia node server",
    },
    body : senddata, 
  };

  request(options,  function(err, res, body) {
    try
    {
    
    if(!err && res.statusCode == 200) {
      var r = JSON.parse(decodeURIComponent(body));
      callback.onsuccess(r); 
    } else {
      throw false;
    }

    } catch(e) {
      callback.onerror(err, res);
    }
  });    
}


function check_wa_image(img, api_cookie, callback) {
  var object = {header: 0, data: img, extra: null};
  var senddata = 'postdata='+encodeURIComponent(encodeURIComponent(JSON.stringify(object)));
  var options = {
    url : config.api.check_wa_image,
    method : "POST",
    headers: {
      "content-type" : "application/x-www-form-urlencoded",
      "Cookie" : api_cookie,
      "User-Agent" : "wayixia node server",
    },
    body : senddata, 
  };

  request(options,  function(err, res, body) {
    try
    {

    if(!err && res.statusCode == 200) {
      console.log("check image result:"+body);
      var r = JSON.parse(decodeURIComponent(body));
      if(r.header !=0) {
        // web server api failed
        callback.onfailed(r);
      } else {
        if(r.data.res_id <= 0) {
	  callback.onwa();
        } else {
	  callback.onsuccess();
	}
      }
    } else {
      throw false;
    }

    } catch(e) {
      callback.onerror(err, res);
    }
  });    
}

function http_process(req, response, data_from_agent) {
  // submit to web
  var object = JSON.parse(decodeURIComponent(data_from_agent));
  var data = object.data;
  var wayixia_api_cookie = req.headers.cookie;
  var image_cookie = object.data.img.cookie;

  // check wa image
  check_wa_image(
    {
      src : object.data.img.srcUrl,
      url : object.data.img.pageUrl, 
      title: object.data.img.title,
      album_id: object.data.img.album_id
    }, wayixia_api_cookie, {
      onfailed: function(r) {}
      , onerror : function(err, res) {}
      , onsuccess : function() {}
      , onwa: function() {
        console.log("need get remote image"); 
        var file_name = uuid();
        // start get image 
        get_remote_image(
          {
            src : object.data.img.srcUrl,
            cookie: image_cookie,
            referer: object.data.img.referer||object.data.img.pageUrl,
            agent: req.headers['user-agent'],
            filename: file_name,
          },
	  {
	    onsuccess: function() {
              console.log('get remote image ok!'); 
	      var wa_image_options = {
	        src: object.data.img.srcUrl,
	        url: object.data.img.pageUrl,
	      };  
                  
              wa_image(wa_image_options, wayixia_api_cookie, {
                onsuccess: function(r) {
                  console.log("wa image ok! with code: " + r.header);
	          echo_json(response, r.header, r.data, r.extra);			
	        },
	        onerror: function(err, res) {
                  console.log("wa image ok!" + res.statusCode);
                  echo_json(response, -1, null, null);
                }
              });
	    },
	    onerror: function(err, res) {
              console.log(res.statusCode);
              echo_json(response, -1, null, null);
            }
          }
	);
      } 
    }
  ); // end check wa image

  return;

  console.log(object.data.img);
  var img = {
    src : object.data.img.srcUrl,
    cookie: image_cookie,
    referer: object.data.img.referer||object.data.img.pageUrl,
    agent: req.headers['user-agent'],
    filename: uuid(),
  };
  
  // start get image 
  wa_image(img, function(ok, res) {
    if(ok) {
      console.log('wa_image ok!') 	    
      var senddata = 'postdata='+encodeURIComponent(encodeURIComponent(JSON.stringify(object)));
      // get image ok!
      var options = {
        url : config.api,
        method : "POST",
        headers: {
          "content-type" : "application/x-www-form-urlencoded",
          "Cookie" : wayixia_api_cookie,
          "User-Agent" : "wayixia node server",
        },
        body : senddata, 
      };

      request(options,  function(error, res, body) {
        if(!error && res.statusCode==200) {
          console.log("route request to wayixia web server, body:"+body);
          echo(response, body);
	  return;
	  //try {
	    var json_response = JSON.parse(decodeURIComponent(body));
            // start wa image and save to disk
            var header = json_response.header;
	    if(header == 0) {
	    } else {
	    } 
         //} catch(e) {
         //  console.log(e);
         //  echo_json(response, -1, e.message, null);
         //}
        } else {
          console.log(err);
          echo_json(response, -1, err.message, null);
        }
      });    
    } else {
      // get image failed
      console.log(res.statusCode);
      echo_json(response, -1, null, null);
    }
  })

  console.log("http_process called " + object.data.img.srcUrl + ", user-agent: "+req.headers['user-agent']);
  var senddata = 'postdata='+encodeURIComponent(encodeURIComponent(JSON.stringify(object)));
  request(
    {
      url : config.api,
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
         console.log("route request to wayixia web server, body:"+body);
         //try {
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
           
	   var header = json_response.header;
	   if(header == 0) {
	     var r = request(get_image_options, function(err, res, body) {
               if(!err && res.statusCode == 200) {
		 echo_json(response, 0, null, null);
               } else {
                 echo_json(response, -1, "statuscode: "+ res.statusCode, null);
               } 
	     }).pipe(fs.createWriteStream(config.server.path + json_response.data+".jpg")); 
	   } else {
	     echo_json(response, json_response.header, json_response.data, null);
	   } 
         //} catch(e) {
         //  console.log(e);
         //  echo_json(response, -1, e.message, null);
         //}
       } else {
         console.log(err);
         echo_json(response, -1, err.message, null);
       }
    }
  );
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
        //console.log(qs.postdata);
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
  Q.dispatch(req, res);
}).on('connection', function(socket) {
  socket.setNoDelay(true);
}).listen(8080);

console.log('Server is listening to http://localhost/ on port 8080¡­');

