
var config = require('./config');
var http = require("http");
var fs = require('fs');
var request = require('request');
var imageinfo = require('imageinfo');
var image_magick = require('imagemagick');
var gm = require('gm').subClass({ imageMagick: true });
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

function save_thumb(src, dest, src_width, src_height, dest_width) {
  // resize and remove EXIF profile data
  var width = dest_width;
  var height = (width * src_height) / src_width;
  image_magick.resize({
    srcPath: src,
    dstPath: dest,
    width:   dest_width
  }, function(err, stdout, stderr){
    if (err) throw err;
    console.log('resized kittens.jpg to fit within '+dest_width+'px');
  });
}

function get_remote_image(img, callback) {
  console.log('wa image(url:'+img.src+')');
  var options = {
    url : img.src, 
    headers : {
      "Cookie"  : img.cookie,
      "Referer" : img.referer,
      "User-Agent" : img.agent, //req.headers['user-agent'],  
    },
    encoding: null,  // use binary data 
  };
  
  var file_name = config.server.path + "/" + img.filename;
  var thumb_file_name = config.server.thumb_path + "/" + img.filename;
  var stream = fs.createWriteStream(file_name);  
  var r = request(options, function(err, res, body) {
    if(!err && res.statusCode == 200) {
      console.log("caculate image size");      
      var info = imageinfo(body);
      //console.log(info);
      if(!info) { 
        callback.onerror(err, res);
        fs.unlink(file_name);
      } else {
        info.file_size = body.length;
        callback.onsuccess(info);
        save_thumb(file_name, thumb_file_name, info.width, info.height, 192);
      }
    } else {
      callback.onerror(err, res);
    } 
  }).pipe(fs.createWriteStream(file_name)); 
}

function wa_image(img, api_cookie, callback) {
  var object = {header: 0, data: {}, extra: null};
  object.data = img;
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
   
  //console.log(decodeURIComponent(data_from_agent));
  // submit to web
  var object = JSON.parse(decodeURIComponent(data_from_agent));
  var data = object.data;
  console.log(object.data);
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
      onfailed: function(r) { console.log("check_wa_image onfailed" + JSON.stringify(r)); echo_json(response, r.header, r.data, r.extra);}
      , onerror : function(err, res) { console.log("check_wa_image onerror" + err); echo_json(response, 0, "", ""); }
      , onsuccess : function() { console.log("check_wa_image success"); echo_json(response, 0, "", ""); }
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
      onsuccess: function(info) {
              /*
              type: 'image',
              format: 'JPG',
              mimeType: 'image/jpeg',
              width: 450,
              height: 561 }
              */
              console.log('get remote image ok!'); 
        var wa_image_options = {
          server : config.server.name,
          res_id : 0,
          img : {
                  src: object.data.img.srcUrl,
            title: object.data.img.title,
            album_id: object.data.img.album_id,
            from_url: object.data.img.pageUrl,
            file_name: file_name,
            file_type: info.format || '',
            file_width: info.width || object.data.img.width,
            file_height: info.height || object.data.img.height,
            file_size: info.file_size,  
          }
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
      //console.log('get image process ondata');
      postdata += chunk.toString();
    });

    req.addListener('end', function() {
      try {
        //console.log('get image ' + req.headers.cookie);
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

