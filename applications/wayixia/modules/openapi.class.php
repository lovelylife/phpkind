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
        
  //  $this->bind_register($info); 
  //  return;
    switch($action) {
    case 'sinaweibo':
      $this->sinaweibo();
      break;
    case 'qq':
      $this->qq();
      break;
    default:
      parent::doMain($action);
    }
  }

  function doAjax($action) {
    switch($action) {
    case 'do-bind-register':
      $this->do_bind_register();
      break;
    default:
      parent::doAjax($action);
    }
  } 

  function sinaweibo() {
    // get open id
    try {
      $openapi = $this->get_sinaweibo_open_id(); 
      if(empty($openapi)) 
        throw new Exception("authorize failed!");
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
    
    try {
      if (!isset($_GET['code']))
        throw new Exception("invalid code");      
      
      $token = array();
      $keys  = array();
      $keys['code'] = $_GET['code'];
      $keys['redirect_uri'] = $this->Config('openapi.sinaweibo.callback');
      try {
        $token = $o->getAccessToken( 'code', $keys ) ;
      } catch (OAuthException $e) {
        throw new Exception($e->getMessage());    
      }
    
      if ($token) {
        // write token to session
        $this->set_open_cookie($token['access_token']);
        $_SESSION['open_type'] = 'sinaweibo'; 
        // get open api information
	$client = new SaeTClientV2( 
          $this->Config('openapi.sinaweibo.WB_AKEY') , 
          $this->Config('openapi.sinaweibo.WB_SKEY') ,
          $token['access_token'] 
        );
	
	$uid = $client->get_uid();
	if(!isset($uid['uid'])) {
          throw new Exception("open api [get_uid] error");
	}
	
        $openapi_uid = $uid['uid'];
        $user_message = $client->show_user_by_id($openapi_uid); //根据ID获取用户等基本信息
        if(!isset($user_message['name'])) {
	  throw new Exception("open api error");
	}
	$nickname = $user_message['name'];
	$openapi_info['id'] = 'sinaweibo-'.$openapi_uid;
	$openapi_info['name'] = $user_message['name'];
      }
    } catch(Exception $e) {
      $openapi_info = array();
    }

    return $openapi_info;
  }

  function qq() {
    // get open id
    try {
      $openapi = $this->get_qq_open_id(); 
      if(empty($openapi)) 
        throw new Exception("authorize failed!");
      $this->login_openapi($openapi['id'], $openapi['name']);
    } catch(Exception $e) {
       $this->App()->goto_url("登录失败...<a href='javascript:history.back();'/>返回</a>", $_GET['refer'], -1 );
    }
  }

  function get_qq_open_id() {
    $openapi_info = array();
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
      $this->set_open_cookie($token);
      $_SESSION['open_type'] = 'qq';
      $client = new QClient($appid, $openapi_uid, $token);
      $ret = $client->get_user_info();
      if($ret['ret'] == 0)
        $openapi_info['name'] = $ret['nickname'];
      $openapi_info['id'] = 'tq-'.$openapi_uid;
    }
    
    return $openapi_info;
  }
 
  function login_openapi($open_id, $name) {
    try {
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
    	  if(0 != $this->login_wayixia($wayixia_uid)) {
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
        $env['name'] = $name;
        $env['open_id'] = $open_id;
        $env['refer'] = $_GET['refer'];
        $evn['login_type'] = $_GET['t'];
        $this->bind_register($env);
      }
    } catch(Exception $e) {
       $this->App()->goto_url("登录失败(".$e->getMessage().")...<a href='javascript:history.back();'/>返回</a>", $refer, -1 );
    }
  }

  function bind_openapi($uid, $open_id) 
  {
    if(empty($open_id))
      return false;

    // db instance
    $db = &$this->App()->db();
    $fields = array(
      'uid' => $uid,
      'open_id'=> $open_id,
    );
    
    $sql = $db->insertSQL('users_openapi', $fields);
    if(!$db->execute($sql))
      trigger_error($db->get_error(), E_USER_ERROR);

    return true;
  }

  // 登录wayixia系统
  function login_wayixia($wayixia_uid) 
  {
    $db = &$this->App()->db();
    $sql  = "select uid, name, email, lastlogin_time, lastlogin_ip ";
    $sql .= "from ##__users ";
    $sql .= "where `uid`={$wayixia_uid} limit 0,1;";
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
      //print_r($info);    
      $t = new CLASS_TEMPLATES($this->App());
      $t->dump2template($info);
      $t->render('openapi.bind.register');
    } catch(Exception $e) {
      print_r($e);
    }
  }
  
  function do_bind_register() {
    $data = &$_POST['data'];  
    $refer = $data['refer'];
    $open_id = $data['open_id'];
    $login_type = $data['login_type'];
    $name = $data['name'];
    $sex  = intval($data['sex'], 10);
    // check session
    $vertify_data = $this->get_open_cookie();
    if(empty($vertify_data) || empty($open_id)) {
      $this->errmsg("还没有登录开放平台!");
      return;
    }

    if(empty($name)) {
      $this->errmsg("昵称不能为空");
      return;
    }
    
    if(!name_is_valid($name)) {
      $this->errmsg("昵称格式不正确（格式：数字字母中文和下划线，长度必须大于6）");
      return;
    }

    $db = &$this->App()->db();

    // 创建挖一下用户
    // 绑定open_id新创建的挖一下账号
    $fields = array(
      'name' => $name,
      'pwd' => '',
    );
    $create_user_sql = $db->insertSQL('users', $fields);
    // error
    if(!$db->execute($create_user_sql))
      trigger_error($db->get_error(), E_USER_ERROR);

    // 绑定openapi
    $new_wayixia_uid = $wayixia_uid = $db->get_insert_id();
    $this->bind_openapi($new_wayixia_uid, $open_id);
    $result = $this->login_wayixia($new_wayixia_uid);
    if(0 != $result) {
      $this->errmsg("创建账号失败(code: ".$result.")");
      return;
    }
  }      

  function set_open_cookie($v) {
    $_SESSION['open_token'] = $v;
    //setcookie('open_id', $v, time()+3600, '', '.wayixia.com');
  }

  function get_open_cookie() {
    return $_SESSION['open_token'];
  }

}

?>
