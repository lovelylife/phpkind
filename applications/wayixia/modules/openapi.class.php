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
    $o = new SaeTOAuthV2( 
      $this->Config('openapi.sinaweibo.WB_AKEY') , 
      $this->Config('openapi.sinaweibo.WB_SKEY')
    );

    if (isset($_REQUEST['code'])) {
      $keys = array();
      $keys['code'] = $_REQUEST['code'];
      $keys['redirect_uri'] = $this->Config('openapi.sinaweibo.callback');
      try {
        $token = $o->getAccessToken( 'code', $keys ) ;
      } catch (OAuthException $e) {
      }
    }

    if ($token) {
      $_SESSION['sinaweibo_token'] = $token;
      setcookie( 'weibojs_'.$o->client_id, http_build_query($token) );
      // register wayixia user
      /**/
      $client = new SaeTClientV2( 
        $this->Config('openapi.sinaweibo.WB_AKEY') , 
        $this->Config('openapi.sinaweibo.WB_SKEY') ,
        $_SESSION['sinaweibo_token']['access_token'] 
      );

      $uid_get = $client->get_uid();
      $openapi_uid = $uid_get['uid'];
      $user_message = $client->show_user_by_id( $uid); //根据ID获取用户等基本信息
      $nickname = $user_message['name'];
      $openapi_type = 'sinaweibo';
      
      // db instance
      $db = $this->App()->db();

      // 检查openapi授权的用户是否已经在wayixia上注册过
      // 如果未注册过，注册openapi到wayixia且同时登录wayixia系统
      // 否则检测当前已经登录
      $wayixia_uid = $this->get_wayixia_uid($openapi_type, $openapi_uid);
      if($wayixia_uid >= 0) {
        // 如果已经注册，再检测是否是当前已登录wayixia账号
        if($this->App()->check_user_logon(false)) {
          $this->App()->clear_user_info();
        }
      } else {
		/*
        // 创建wayixia用户
        $fields = array(
          'name' => 'sinaweibo-'.$openapi_uid,
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
		// goto openapi register panel
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
      $this->App()->goto_url(
        "登录失败...<a href='javascript:history.back();'/>返回</a>", 
        $refer, -1 );
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

      // 检查openapi授权的用户是否已经在wayixia上注册过
      // 如果未注册过，注册openapi到wayixia且同时登录wayixia系统
      // 否则检测当前已经登录
      $wayixia_uid = $this->get_wayixia_uid($openapi_type, $openapi_uid);
      if($wayixia_uid >= 0) {
        // 如果已经注册，再检测是否是当前已登录wayixia账号
        if($this->App()->check_user_logon(false)) {
          $this->App()->clear_user_info();
        }
      } else {
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
      }
      
      // 加载登录信息
      $code = $this->login_wayixia_user(
        $wayixia_uid, $openapi_type, $openapi_uid);
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
      $this->App()->goto_url(
        "登录失败...<a href='javascript:history.back();'/>返回</a>", 
        $refer, -1 );
    }
    
    return $result;
  }

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

  function bind_openapi($uid, $type, $value) 
  {
    // 数据不能为空/类型不正确
    if(empty($value))
      return false;

    if(!$this->verify_openapi_type($type))
      return false;

    // db instance
    $db = &$this->App()->db();
    $openapi_fields = array(
      'uid' => $uid,
      'type'=> $type,
      'value'=> $value,
    );
    
    $create_openapi_sql = $db->insertSQL('users_openapi', $openapi_fields);
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

  // 检查是否是支持的openapi类型
  function verify_openapi_type($type) {
    $acceptable_type = array('sinaweibo','tq'); // qqweibo, and so on
    return (in_array($type, $acceptable_type));
  }

  // 获取wayixia_uid
  function get_wayixia_uid($type, $value) {
    if(empty($value)  || !$this->verify_openapi_type($type)) 
    {
      return -1;
    }

    $db = &$this->App()->db();
    $check_openapi_exists = "select uid from ##__users_openapi where `type`='{$type}' and `value`='{$value}' limit 0,1;";

    $openapi_row = $db->get_row($check_openapi_exists);
    if(!empty($openapi_row)) 
      return $openapi_row['uid'];

    return -2;
  }
}

?>
