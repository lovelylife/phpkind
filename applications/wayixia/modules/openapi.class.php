<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

//@todo test include 
include_once(_IROOT.'/phpweibosdk/saetv2.ex.class.php' );
include_once(_IROOT.'/phpqqsdk/qq.sdk.class.php' );

class CLASS_MODULE_OPENAPI extends CLASS_MODULE {

  public function __construct() {  parent::__construct(); }
  public function CLASS_MODULE_OPENAPI() { $this->__construct(); }
  
  function doMain($action) {
    switch($action) {
    case 'sinaweibo':
      $this->sinaweibo();
      break;
    case 'sinaweibolist':
      $this->sinaweibolist();
      break;
    case 'qq':
      $this->qq();
      break;
    default:
      parent::doMain($action);
    }
  }

  function sinaweibo() {
    // get open id
    try {
      $openapi = $this->get_sinaweibo_open_id(); 
      if(empty($openapi)) {
        throw new Exception("authorize failed!");
      }

      $this->login_openapi($openapi['id'], $openapi['name']);
    } catch(Exception $e) {
       $this->App()->goto_url("登录失败...<a href='javascript:history.back();'/>返回</a>", $_GET['refer'], -1 );
    }
  
  }

  function get_sinaweibo_open_id() {
    $openapi_info = array();
    $o = new SaeTOAuthV2( 
      $this->Config('openapi.sinaweibo.WB_AKEY') , 
      $this->Config('openapi.sinaweibo.WB_SKEY')
    );
    
    try
    {
      if (!isset($_GET['code']))
        throw new Exception("invalid code");      
      
      $token = array();
      $keys = array();
      $keys['code'] = $_GET['code'];
      $keys['redirect_uri'] = $this->Config('openapi.sinaweibo.callback');
      try {
        $token = $o->getAccessToken( 'code', $keys ) ;
      } catch (OAuthException $e) {
        throw new Exception($e->getMessage());    
      }
    
      if ($token) {
        $_SESSION['sinaweibo_token'] = $token;
	setcookie( 'weibojs_'.$o->client_id, http_build_query($token) );

	$client = new SaeTClientV2( 
          $this->Config('openapi.sinaweibo.WB_AKEY') , 
          $this->Config('openapi.sinaweibo.WB_SKEY') ,
          $_SESSION['sinaweibo_token']['access_token'] 
        );
	
	$uid_get = $client->get_uid();
	print_r($uid_get);
        $openapi_uid = $uid_get['uid'];
        $user_message = $client->show_user_by_id( $openapi_uid); //根据ID获取用户等基本信息
        $nickname = $user_message['name'];
        // 开发接口对应的id
        $open_id = 'sinaweibo-'.$openapi_uid;
        $openapi_info['id'] = $open_id;
	$openapi_info['name'] = $nickname;
      }
    } catch(Exception $e) {
      $openapi_info = array();
    }

    return $openapi_info;
  }

  
  function login_openapi($openapi) {
    try
    {
        $open_id = $openapi['id'];
	$name    = $openapi['name'];
        // 检查openapi授权的用户是否已经在wayixia上注册过
        // 如果未注册过，注册openapi到wayixia且同时登录wayixia系统
        // 否则检测当前已经登录
        $wayixia_uid = $this->get_wayixia_uid($open_id);
        if($wayixia_uid > 0) {
      
          // 如果已经注册，再检测是否是当前已登录wayixia账号
          $need_login = true;
          if($this->App()->check_user_logon(false)) {
            $current_wayixia_uid = $this->App()->get_user_info('uid');
	    if($current_wayixia_uid != $wayixia_uid) {
              $this->App()->clear_user_info();
	    } else {
	      $need_login = false;
	    }
	  }
	  if($need_login) {
    	    if(!$this->login_wayixia($wayixia_uid, $open_id)) {
	      throw new Exception("login failed");
	    }
	  }

          $refer = $_GET['refer'];
          $login_type = intval($_GET['t'], 10);
          //echo $refer;
          if(1 != $login_type)
            $this->App()->goto_url("登录成功...", $refer, 3000);
          else 
            $this->App()->goto_url("<script>alert('登录成功...');window.close()</script>", $refer, 3000);
        } else {
          // openapi register panel
          $env = array();
          $env['name'] = $nickname;
	  $env['open_id'] = $open_id;
	  $env['refer'] = $_GET['refer'];
	  $evn['login_type'] = $_GET['t'];
          $this->bind_register($env);
          echo "bind_register";
	}
      }
    } catch(Exception $e) {
       $this->App()->goto_url("登录失败...<a href='javascript:history.back();'/>返回</a>", $refer, -1 );
    }
  }

  function qq() {
    $appid = $this->Config('openapi.qq.appid');
    $o_qq = new Oauth2();
    $token = $o_qq->get_access_token(
      $appid, 
      $this->Config('openapi.qq.appkey'),
      $_GET['code'],
      $_GET['refer']
    );

    $openapi_uid = $o_qq->get_open_id($token);
    if ($token) {
      $_SESSION['qq_token'] = array('access_token'=>$token);
      $_SESSION['qq_token']['open_id'] = $openapi_uid;
      $client = new QClient($appid, $openapi_uid, $token);
      $ret = $client->get_user_info();
      $nickname = "unamed";
      if($ret['ret'] == 0) 
      $nickname = $ret['nickname'];
      $openapi_type = 'tq';
      
      // db instance
      $db = $this->App()->db();
      
      // open id for wayixia
      $open_id = 'tq-'.$openapi_uid;

      // 检查openapi授权的用户是否已经在wayixia上注册过
      // 如果未注册过，注册openapi到wayixia且同时登录wayixia系统
      // 否则检测当前已经登录
      $wayixia_uid = $this->get_wayixia_uid($openid);
      if($wayixia_uid >= 0) {
        // 如果已经注册，再检测是否是当前已登录wayixia账号
        if($this->App()->check_user_logon(false)) {
          $this->App()->clear_user_info();
        }
      } else {
        /*
        // 创建wayixia用户
        $fields = array(
          'name' => 'tq-'.$openapi_uid,
          'nickname' => $nickname,
          'pwd' => '',
          'email' => '',
        );
        $create_user_sql = $db->insertSQL('users', $fields);
        // error
        if(!$db->execute($create_user_sql))
          trigger_error($db->get_error(), E_USER_ERROR);

        // 绑定openapi
        $new_wayixia_uid = $wayixia_uid = $db->get_insert_id();
        $this->bind_openapi($new_wayixia_uid, $openapi_type, $openapi_uid);
        */
        // open api register panel
        $env = array();
        $env['name'] = $nickname;
        $evn['open_id'] = $open_id;
        $this->bind_register($env);
        return;
      }
      
      // 加载登录信息
      $code = $this->login_wayixia_user($wayixia_uid, $openapi_type, $openapi_uid);
      if($code < 0)
      {
        trigger_error('login failed. code: '.$code, E_USER_ERROR);
      }
      $refer = $_GET['refer'];
      $login_type = intval($_GET['t'], 10);
      //echo $refer;
      if(1 != $login_type)
        $this->App()->goto_url("登录成功...", $refer, 3000);
      else 
        $this->App()->goto_url("<script>alert('登录成功...');window.close()</script>", $refer, 3000);
    } else {
      $this->App()->goto_url("登录失败...<a href='javascript:history.back();'/>返回</a>", $refer, -1 );
    }
    
    return $result;
  }

/*
  // test code
  function sinaweibolist() {
    try {
      $client = new SaeTClientV2( 
        $this->Config('openapi.sinaweibo.WB_AKEY') , 
        $this->Config('openapi.sinaweibo.WB_SKEY') ,
        $_SESSION['sinaweibo_token']['access_token'] 
      );
      
      $ms  = $client->home_timeline(); // done
      $uid_get = $client->get_uid();
      $uid = $uid_get['uid'];
      $user_message = $client->show_user_by_id( $uid);//根据ID获取用户等基本信息
      //if(isset)
      print_r($user_message);      
      $t = new CLASS_TEMPLATES($this->App());
      $t->load('weibo.test');
      $t->push_data('weiblist', $ms['statuses']);
      $t->display();
    } catch(Exception $e) {
      print_r($e);
    }
  }
*/

  function bind_openapi($uid, $open_id) 
  {
    if(empty($open_id))
      return false;

    // db instance
    $db = &$this->App()->db();
    $openapi_fields = array(
      'uid' => $uid,
      'open_id'=> $open_id,
    );
    
    $sql = $db->insertSQL('users_openapi', $openapi_fields);
    if(!$db->execute($create_openapi_sql))
      trigger_error($db->get_error(), E_USER_ERROR);

    return true;
  }

  // 登录wayixia系统
  function login_wayixia_user($wayixia_uid) 
  {
    $db = &$this->App()->db();
    $sql  = "select uid, name, email, lastlogin_time, lastlogin_ip, nickname ";
    $sql .= "from ##__users ";
    $sql .= "where `uid`='{$wayixia_uid}' limit 0,1;";
    $user_info = $db->get_row($sql);

    if(empty($user_info))
      return -1;
    
    // update fields
    $login_ip = getip();
    // update user login info
    $db->execute("update ##__users set `lastlogin_ip` = {$login_ip} where `id`='{$wayixia_uid}';");

    // initialize user info 
    $this->App()->set_user_info('user-key', session_id());
    
    foreach($user_info as $key => $value ) {
      $this->App()->set_user_info($key, $value);
    }

    return 0;
  }

  // 获取wayixia_uid
  function get_wayixia_uid($open_id) {
    $db = &$this->App()->db();
    $sql = "select uid from ##__users_openapi where `open_id`='{$open_id}' limit 0,1;";

    $openapi_row = $db->get_row($sql);
    if(!empty($openapi_row)) 
      return $openapi_row['uid'];

    return -1;
  }

  function bind_register($info) {
    try {
      print_r($info);    
      $t = new CLASS_TEMPLATES($this->App());
      $t->dump2template($info);
      $t->render('openapi.bind.register');
    } catch(Exception $e) {
      print_r($e);
    }
  }
}

?>
