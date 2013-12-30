

var login_iframe = null;
var login_ok = false;

function gotologin(url) {
  if(login_ok) {
    alert('你已经登录了');
    return;
  }
  var pos = Q.absPosition(Q.$('user-title-bar'));
  if(!login_iframe) {
    login_iframe = document.createElement('iframe');
    document.body.appendChild(login_iframe);
    login_iframe.src = url;
    login_iframe.setAttribute('style', 'position:fixed !important;display:block;border:0px !important;')
    login_iframe.style.width = 500 + 'px';
    login_iframe.style.height = 240 + 'px';
    login_iframe.style.WebkitBoxShadow = "5px 5px 20px rgba(0,0,0,0.5)";

    login_iframe.style.top = -240 + 'px';
    login_iframe.style.display = '';
    var left = (document.body.clientWidth - 500 ) / 2;
    login_iframe.style.left = left+'px';
  // var top =  (document.body.clientHeight - wndNode.nHeight ) / 2;
  }
  
  //try {
    (new Q.Animate({
      tween: 'Cubic',
      ease: 'easyIn',
      max: pos.top+pos.height,
      begin: -60,
      duration: 5,
      bind : function(x) {
        login_iframe.style.top = x+'px';
      }
    })).play();
  //} catch (e) {
  //  alert(e);
  //}


  Q.addEvent(window, 'scroll', 
    function() {
    var pos = Q.absPosition(login_iframe);
    if(pos.top <= getScrollTop()) {
      //console.log(pos.top);
      login_iframe.className = 'main_in_wrapper floating';
    } else {
      login_iframe.className = 'main_in_wrapper';
    }
  }
  , false)
}

function click_deactivate() {
  if (login_iframe) {
    document.body.removeChild(login_iframe);
    login_iframe = null;
  }
}

function user_login_ok() {
  login_ok = true;
}

function user_logout_ok() {
  login_ok = false;
}

function follow_album(api, album_id) {
  Q.Ajax({
    command: api,
    data: {'album_id': album_id},
    oncomplete: function(xmlhttp) {
      //try {
        var resp = Q.json_decode(xmlhttp.responseText);
        if(resp.header == 0) {
	  alert('关注成功');  
	} else if(resp.header == -2) {
          gotologin('http://wayixia.com/index.php?app=wayixia&mod=user&action=login');
	} else {
	  alert('error code: ' + resp.header + '\nmessage: ' + resp.data);
	}
      
      //} catch(e) {
      //  alert(xmlhttp.responseText + "\n\n" + e); 
      //}
    },
    onerror: function(xmlhttp) {
      alert(xmlhttp); 
    }
  });
}

