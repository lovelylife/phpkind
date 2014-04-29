<?php

class CLASS_MODULE_USER extends CLASS_MODULE {

  function __construct() { parent::__construct(); }

  function CLASS_MODULE_USER() { $this->__construct(); }

  function doMain($action) {
    
    $not_need_login = array(
      'register','do-register', 'login', 'regular-login', 'vcode', 'forgetpwd', 'change-pwd'
    );

    if(!in_array($action, $not_need_login)) {      
      $this->App()->check_user_logon(true);
    } else {
      if($this->App()->check_user_logon(false)) {
        $this->App()->goto_url("您已经登录过，3秒自动回到首页!", $this->App()->getUrlApp(), 3000);
        return;
      }
    }

    switch($action) 
    {
    case 'home':
      $this->home();
      break;
    
    case 'detail':
      $this->detail();
      break;

    case 'avatar':
      $this->avatar();
      break;

    case 'register':
      $this->register();
      break;

    case 'do-register':
      $this->do_register();
      break;

    case 'login':
      $this->login('user.login');
      break;

    case 'regular-login':
      $this->login('user.login.regular');
      break;

    case 'vcode':
      $this->vcode();
      break;
        
    case 'forgetpwd':
      $this->forget_password();
      break;

    case 'change-pwd':
      $this->change_password();
      break;
    
    case 'logout':
      $this->logout();
      break;

    case 'avatar-upload-panel':
      $this->avatar_upload_panel();
      break;
    default:
      parent::doMain($action);
    }
  }

  function home() {
    $theApp = &$this->App();

    $user_key = $theApp->get_user_info('user-key');
    $user_name = $theApp->get_user_info('name');
    $uid = $theApp->get_user_info('uid');
    if(empty($user_key)) {
      header('Location:'.$theApp->getUrlApp());
      return;
    }

    $t = new CLASS_TEMPLATES($this->App());
    $t->load('user.home');

    $t->push('lastlogin_time', $theApp->get_user_info('lastlogin_time'));
    $t->push('username', $user_name);


    // 获取画集封面
    $album_front_dir = $this->App()->getAppRoot().$this->Config('site.front_cover_dir').'/'.$uid;
    createfolders($album_front_dir);

    // 获取画集列表
    $sql_albums_list = $theApp->get_albums_sql($uid);
    $albums_list = array();
    $theApp->db()->get_results($sql_albums_list." order by id desc;", $albums_list);
    
    if(empty($albums_list)) {
      $t->push('images_data', '[]');
    } else {
      $t->push('images_data', json_encode($albums_list));
    }
    $t->push('albums_num', count($albums_list)+1);
    $t->display();
  }

  function detail() {
    // 用户设置
    $theApp = &$this->App();
    $uid = $theApp->get_user_info('uid');

    $sql = "select uid, name, gender, bothday, description ";
    $sql.= "from ##__users ";
    $sql.= "where `uid`='{$uid}' limit 0, 1;";

    $user_info = $this->App()->db()->get_row($sql);
    if(empty($user_info)) {
      trigger_error('user is not exists.', E_USER_ERROR);
    }
    $t = new CLASS_TEMPLATES($this->App());
    $t->load('user.detail');

    $t->push('lastlogin_time', $theApp->get_user_info('lastlogin_time'));
    $t->dump2template($user_info);

    // render page
    $t->display();
  }

  function avatar() {
    // 用户头像设置
    $theApp = &$this->App();

    $user_key = $theApp->get_user_info('user-key');
    $user_id = $theApp->get_user_info('uid');
    if(empty($user_key)) {
      header('Location:'.$theApp->getUrlApp());
      return;
    }

    $t = new CLASS_TEMPLATES($this->App());
    $t->load('user.avatar');
    $t->push('lastlogin_time', $theApp->get_user_info('lastlogin_time'));
    $t->push('uid', $user_id);
    $t->display();
  }

  function avatar_upload_panel() {
    // default page
    $user_id = $this->App()->get_user_info('uid');
    $t = new CLASS_TEMPLATES($this->App());
    $t->load('user.avatar.upload');
    $t->push('uid', $user_id); 
    
    if(isset($_GET['doupload'])) {
      $result = 'ok';
      // filters
      $media_type = $_FILES['user_file']['type'];
      $filters = array('image/jpeg'
                   ,'image/pjpeg'
                   ,'image/jpg'
                   ,'image/gif'
                   ,'image/x-png'
                   ,'image/bmp');
      // check mime type
      if(in_array($media_type, $filters)) {
        // check image size
        $size = getimagesize($_FILES['user_file']['tmp_name']);
        $size_bytes = $_FILES['user_file']['size'];
        if($size[0] >= 200 && $size[1] >= 200 && $size_bytes < (2048*1024)) {
          // get avatar_file_name
          $avatar_file_name = $this->Config('site.avatar').'/orignal.'.$user_id;
          createfolders($this->App()->getAppRoot().$this->Config('site.avatar'));
          // get file
          if (move_uploaded_file(
            $_FILES['user_file']['tmp_name'],
            $this->App()->getAppRoot().$avatar_file_name)) 
          {
            
            $t->push('filename', $avatar_file_name);
          } else {
            $result = "Possible file upload attack!";
          }
        } else {
          $result = 'image size is not acceptable, width>=200 and height > 200';
        }
      } else {
        // unacceptable file type;
        $result = 'unacceptable file type('.$media_type.').';
      }
      
      $t->push('result', $result);
    }

    $t->display();
  }

  /**
   * 检测链接是否是SSL连接
   * @return bool
   */
  function is_SSL(){
    if (!isset($_SERVER['HTTPS']))
      return FALSE;
    if ($_SERVER['HTTPS'] === 1){  //Apache
      return TRUE;
    } else if ($_SERVER['HTTPS'] === 'on') { //IIS
      return TRUE;
    } elseif ($_SERVER['SERVER_PORT'] == 443) { //其他
      return TRUE;
    }
    return FALSE;
  }

  function login($tpl) {
    // 已经登录
    if($this->App()->check_user_logon(false)) {
      $this->App()->goto_url("您已经登录... 3秒后自动返回<a href=\"".$this->App()->getUrlApp()."\">首页</a>", $this->App()->getUrlApp(), 3000);
      return;
    }     
      
    /* todo
    // 检查SSL
    if(!$this->is_ssl()) {
      $https = "https://".$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI'];        header('location: '. $https);
      return;
    }
    */

    $t = new CLASS_TEMPLATES($this->App());

    $login_type = $_GET['logintype'];
    $refer_url = $_SERVER['HTTP_REFERER'];
    if(!empty($_GET['refer'])) {
        $refer_url = $_GET['refer'];
    }
    // sina weibo login
    include_once(_QROOT.'/tp/phpweibosdk/saetv2.ex.class.php' );
    $sina_weibo_callback = $this->Config('openapi.sinaweibo.callback').'&logintype='.$login_type.'&refer='.$refer_url;
    $o = new SaeTOAuthV2( 
      $this->Config('openapi.sinaweibo.WB_AKEY') , 
      $this->Config('openapi.sinaweibo.WB_SKEY') );
    $code_url = $o->getAuthorizeURL($sina_weibo_callback);
    // sina weibo api
    $t->push('sina_weibo_url', $code_url);

    // QQ ////////////////////////////////////////////////////////////
    include_once(_QROOT.'/tp/phpqqsdk/qq.sdk.class.php');
    $qq_callback = $this->Config('openapi.qq.callback').'&logintype='.$login_type.'&refer='.$refer_url;
    $o_qq = new Oauth2();
    $qq_login_url = $o_qq->get_authorized_url(
       $this->Config('openapi.qq.appid'), 
       $this->Config('openapi.qq.scope'), 
       $qq_callback
    );

    $t->push('qq_login_url', $qq_login_url);

    // refer url
    $t->push('refer', urlencode($refer_url));

    // show page
    $t->render($tpl);
  }

  function logout() {
    //$refer_url = $_SERVER['HTTP_REFERER'];
    $refer_url = $this->App()->getUrlApp();
    $this->do_logout_proc();    
    header("location:{$refer_url}");
  }

///////////////// ajax //////////////////////////////////////////////////////

  function doAjax($action) {
    switch($action) {
    case 'do-login':
      $this->do_login();
      break;

    case 'do-login-nc':
      $this->do_login_nc();
      break;

    case 'do-logout':
      $this->do_logout();
      break;

    case 'do-logout-nc':
      $this->do_logout_nc();
      break;

    case 'check-username':
      if(name_is_valid($_GET['username'])) {
        if($this->user_exists($_GET['username']))
          $this->errmsg('用户名已经注册');
      } else {
        $this->errmsg('用户名输入不合法');
      }
      break;
    case 'check-email':
      if($this->email_exists($_GET['email'])) {
        $this->errmsg('邮件地址已经被使用');
      }
      break;
    case 'check-vcode':
      $this->check_vcode();
      break;
    case 'do-forgot-pwd':
      $this->do_forget_password();
      break;

    case 'do-change-pwd':
      $this->do_change_password();
      break;

    case 'do-check-login':
      $this->do_check_login();
      break;

    case 'do-save-avatar':
      $this->do_save_avatar();
      break;
    case 'do-save-detail':
      $this->do_save_detail();
      break;
    }
  }


  function do_login() {
    $theApp = &$this->App();
    $user_key = $theApp->get_user_info('user-key');
    // 重复登录
    if($user_key && session_id() == $user_key) {
      $this->AjaxHeader(-1);
      return;
    }

    $endpoint = $_GET['endpoint'];
    if(empty($endpoint)) {
      $endpoint = 'browser';
    }
    $data = &$_POST['data'];
    $username = $data['name'];
    $pwd = $data['pwd'];
    $nid = $data['nid'];
    if(empty($username) || empty($pwd)) {
      $this->AjaxHeader(-2);
      // $this->errmsg('用户名或密码为空');
      return;
    }

    $pwd = md5($pwd);
    $sql = "select uid, name, email, lastlogin_time, lastlogin_ip from ##__users ";
    $sql.= "where `name`='{$username}' and `pwd`='{$pwd}' limit 0,1;";
    $db = &$this->App()->db();
    $userinfo = $db->get_row($sql);

    if(empty($userinfo)) {
      $this->AjaxHeader(-3);
      return;
    }
    // update fields
    $login_ip = getip();

    // update user login info
    $db->execute("update ##__users set `lastlogin_ip` = {$login_ip} where `name`='{$username}' limit 0,1;");

    // initialize user info 
    $theApp->set_user_info('user-key', session_id());
    
    foreach($userinfo as $key => $value ) {
      $theApp->set_user_info($key, $value);
    }

    // insert oauth 
    //$oauth = ""
  }

  function do_login_nc() {
    $theApp = &$this->App();
    $user_key = $theApp->get_user_info('user-key');
    // 未登录
    if(empty($user_key) || session_id() != $user_key) {
      $this->AjaxHeader(-1);
      return;
    }
    
    $endpoint = $_GET['endpoint'];
    if(empty($endpoint)) {
      $endpoint = 'browser';
    }
    $data = &$_POST['data'];
    $nid = $data['nid'];
    // update user login info
    $fields = array(
      'uid' => $theApp->get_user_info('uid'),
      'login_ip' => getip(),
      'nid' => $nid,
      'endpoint' => $endpoint, 
    );

    $add_login_sql = $theApp->db()->insertSQL('login_users', $fields);
    $theApp->db()->execute($add_login_sql." ON DUPLICATE KEY UPDATE `nid`='{$nid}'");

    $theApp->set_user_info('nid', $nid);
  }

  function register() {
     try {
       $t = new CLASS_TEMPLATES($this->App());
       $t->render('user.register');
     } catch(Exception $e) {
       print_r($e);
     }
  }

  function do_register() {
    // print_r($_POST);
    $username = $_POST['username'];
    $pwd = $_POST['password'];
    $repwd = $_POST['repassword'];
    $email = $_POST['email'];
    $vcode = strtolower($_POST['vcode']);
    // db instance
    $db = &$this->App()->db();
    // print_r($db);
    $errmsg = "恭喜您 {$username}，注册成功";
    try {
      // 用户名是否为空
      if(empty($username)) {
        throw new Exception('用户名输入不能为空');
      } else if(!name_is_valid($username)) {
            throw new Exception('用户名输入不合法');
      } else {
        if($this->user_exists($username)) {
          throw new Exception('用户名已经注册');
        }
      }

      if(empty($pwd) || empty($repwd) || $pwd != $repwd) {
        throw new Exception('输入密码不正确或为空');
      }

      if(empty($email)) {
        throw new Exception('邮箱地址不正确或为空');
      } else {
        if($this->email_exists($email)) {
          throw new Exception('邮件地址已经被使用');
        }
      }
      // vcode 
      if(strtolower($_SESSION['VCODE']) != $vcode) {
        throw new Exception('验证码输入错误');
      }

      $fields = array(
        'name' => $username,
        'pwd' => md5($pwd),
        'email' => $email,
      );
      $sql = $db->insertSQL('users', $fields);
      $result = $db->execute($sql);
      // error
      if(!$result)
        trigger_error($db->get_error(), E_USER_ERROR);
    } catch(Exception $e) {
      $errmsg = $e->getMessage();
    }

    // 显示注册成功页面
    $t = new CLASS_TEMPLATES($this->App());
    $t->push('resultmsg', $errmsg);
    $t->render('user.register.completed');
  }

  function do_logout_proc() {
    $this->App()->clear_user_info();
    // sinaweibo end_session
    if(isset($_SESSION['open_token'])) {
      $open_type = $_SESSION['open_type'];
      switch($open_type) {
      case 'sinaweibo':
        {
    include_once(_QROOT.'/tp/phpweibosdk/saetv2.ex.class.php' );
          $client = new SaeTClientV2( 
            $this->Config('openapi.sinaweibo.WB_AKEY') , 
            $this->Config('openapi.sinaweibo.WB_SKEY') ,
            $_SESSION['open_token'] 
          );

          $msg = $client->oauth->post("https://api.weibo.com/2/account/end_session.json");
  }
        break;
      } 
      unset($_SESSION['open_token']);
    }
  }

  function do_logout() {
    // 先退出NC
    $this->do_logout_nc();
    // 清理环境
    $this->do_logout_proc();
  }

  function do_logout_nc() {
    $nid = $this->App()->get_user_info('nid');
    $db = &$this->App()->db();
    $delete_nc = "DELETE FROM ##__login_users";
    $delete_nc.= " WHERE `nid`='{$nid}' and `uid` ={$uid} and `endpoint`='client';";
    $db->execute($delete_nc);
  }

  function forget_password() {
    try {
        $t = new CLASS_TEMPLATES($this->App());
    $t->push('authkey', $_GET['authkey']);
        $t->render('user.pwd.forget');
      } catch(Exception $e) {
        print_r($e);
      }
  }

  function do_forget_password() {
    $data = &$_POST['data'];
    $username = $data['name'];
    $email = $data['email'];
    if(empty($username) || empty($email)) {
      $this->errmsg('用户名和邮箱不能为空');
      return;
    }
    $db = &$this->App()->db();
    // 检查邮件和用户名是否匹配和存在
    $sql = "select uid from ##__users where `name`='{$username}' and `email`='{$email}' limit 0, 1;";
    $rs = array();
    if(!$db->get_results($sql, $rs)) {
      trigger_error($db->get_error(), E_USER_ERROR);
    }

    if(empty($rs)) {
      $this->errmsg("用户不存在或者邮箱输入错误!");
      return;
    }

    // 插入一条密码找回记录，并发送邮件到该邮箱
    // 生成key
    $fields = array(
      'name' => $username,
      'email'=> $email,
      'authkey' => getserialid(64)
    );
      
    $sql = $db->insertSQL('users_forgetpwd', $fields);
    $result = $db->execute($sql);
    // error
    if(!$result) {
      trigger_error($db->get_error()."\n".$sql, E_USER_ERROR);
    }

    // 删除以前的所有请求，使之无效
    $sql_clear_old = "DELETE FROM `##__users_forgetpwd` WHERE `email` = '{$email}' and `createtime` < CURRENT_TIMESTAMP();";

    if(!$db->execute($sql_clear_old)) {
      trigger_error($db->get_error()."\n".$sql_clear_old, E_USER_ERROR);
    }

    // 发送邮件
    // read mail reset pwd template
    $t = new CLASS_TEMPLATES($this->App());
    $t->push('username', $username);
    $t->push('key', $fields['authkey']);
      $mail_context = $t->parse('mail.reset.pwd');
      
      $mail=array(
        'to'=>$email, 
        'subject'=>'[挖一下] 密码重置邮件 ',
	'content'=>$mail_context);
      $err = ''; 
      if(!$this->send_mail($mail, $err)) {
        $this->errmsg('邮件发送失败('.$err.').');
        return;
      }

      // print sucess
      $short_email = substr($email, 0, 5)."******";
      $this->AjaxData("<h3>密码重置邮件已经发送到邮箱 <font color=red>{$short_email}</font> ，请注意查收!</h3>");
  }

  function reset_password() {
    try {
        $t = new CLASS_TEMPLATES($this->App());
    $t->push('authkey', $_GET['authkey']);
        $t->render('user.pwd.reset');
      } catch(Exception $e) {
        print_r($e);
      }
  }

  function check_authkey($username, $authkey) {
    $sql = "select name from ##__users_forgetpwd where ";
    $sql .= " `name`='{$username}' and `authkey`='{$authkey}' and `createtime` > date_add(CURRENT_TIMESTAMP(),interval -1 day) limit 0,1;";

    $db = &$this->App()->db();
    $rs = array();
    if(!$db->get_results($sql, $rs)) {
     return false;
    }

    return !empty($rs);
  }

  // 邮箱验证码
  function change_password() {
    try {
    $t = new CLASS_TEMPLATES($this->App());

      $username = $_GET['u'];
    $authkey  = $_GET['authkey'];
    $isvalid = $this->check_authkey($username, $authkey);
    $t->push('valid', $isvalid?'true':'false');
        
        $t->render('user.pwd.change');
      } catch(Exception $e) {
        print_r($e);
      }
  }

  function do_change_password() {
      $data =&$_POST['data'];
    $authkey = $data['authkey'];
    $username = $data['username'];
    $pwd = $data['pwd'];
    $repwd = $data['repwd'];
    if(empty($authkey)) {
      $this->AjaxHeader(-1);
    return;
    }

    if(empty($username)) {
      $this->AjaxHeader(-2);
    return;
    }

    if(empty($pwd) || empty($repwd)) {
      $this->AjaxHeader(-3);
    return;
    }

    if($pwd != $repwd) {
      $this->AjaxHeader(-4);
    return;
    }

    if(!name_is_valid($username)) {
      $this->AjaxHeader(-5);
    }

      $db = &$this->App()->db();

      // 24小时之内可以修改密码
      if(!$this->check_authkey($username, $authkey)) {
      $this->AjaxHeader(-6);
    return;
    }

      // 修改密码
    $md5_pwd = md5($pwd);
    $sql_set_pwd = "UPDATE `##__users` SET `pwd` = '{$md5_pwd}' WHERE `name` = '{$username}';";
    if(!$db->execute($sql_set_pwd)) {
      trigger_error($db->get_error(), E_USER_ERROR);
    }

    // 删除重置密码记录
      // 删除以前的所有请求，使之无效
    $sql_clear_old = "DELETE FROM `##__users_forgetpwd` WHERE `name` = '{$username}' and `authkey`='{$authkey}';";

    if(!$db->execute($sql_clear_old)) {
      trigger_error($db->get_error(), E_USER_ERROR);
    }
  }

  function vcode() {
    include(_KROOT.'/vcode.class.php');
    $image = new VCode('100','36','4');    //图片长度、宽度、字符个数
      $image->outImg();
      $_SESSION['VCODE'] = $image->checkcode; //存贮验证码到 $_SESSION 中
  }

  function check_vcode() {
    $vcode = strtolower($_GET['vcode']);
    if(empty($vcode)) {
      $this->errmsg('请输入验证码');
    } else {
      if(strtolower($_SESSION['VCODE']) != $vcode) {
        $this->errmsg('验证码输入不正确');
      }
    }
  }

  function user_exists($username) {
      $db = &$this->App()->db();
    // 检查用户是否存在
    $sql = "select uid from ##__users where `name`='{$username}' limit 0,1;";
    
    $rs = array();
    if(!$db->get_results($sql, $rs)) {
      trigger_error($db->get_error(), E_USER_ERROR);
    }
    return !(empty($rs));
  }

  function email_exists($email) {
    $db = &$this->App()->db();
    // 检查用户是否存在
    $sql = "select uid from ##__users where `email`='{$email}' limit 0,1;";
    
    $rs = array();
    if(!$db->get_results($sql, $rs)) {
      trigger_error($db->get_error(), E_USER_ERROR);
    }

    return !(empty($rs));
  }

  function send_mail($mail, &$err) {
    $mailcfg = array();
    $mailcfg['server'] = $this->Config('email.smtpserver');
    $mailcfg['port'] = '25'; 
    $mailcfg['auth'] = ($this->Config('email.auth')==1)?1:0; 
    $mailcfg['from'] = $this->Config('email.from'); 
    $mailcfg['auth_username'] = $this->Config('email.user'); 
    $mailcfg['auth_password'] = $this->Config('email.pwd'); 
    $smtp_instance=new smtp($mailcfg); 
    if(!$smtp_instance->send($mail)){
      $err = $smtp_instance->get_error();
      return false;
    }

    return true;
  }

  function do_check_login() {
    $theApp = &$this->App();
    $user_key = $theApp->get_user_info('user-key');
    // 已经登录
    if($user_key && session_id() == $user_key) {
      $this->AjaxData(1);
      return;
    }
    // 未登录
    $this->AjaxData(0);
  }

  function do_save_avatar() {
    $theApp = &$this->App();
    $user_key = $theApp->get_user_info('user-key');
    // 重复登录
    if(empty($user_key) || session_id() != $user_key) {
      $this->errmsg('sorry! you not login.');
      return;
    }
    // save avatar
    // 92, 48
    $data = &$_POST['data'];
    $img = $data['img'];
    if(empty($img)) {
      $this->errmsg('invalid image parameter!');
      return;
    }

    $clip_rect = $data['cliprect'];
    $select_rect = $data['selectrect'];

    $clip_left = $clip_rect['left'];
    $clip_top = $clip_rect['top'];
    $clip_width = $clip_rect['right'] - $clip_left;
    $clip_height = $clip_rect['bottom'] - $clip_top;

    if(!($clip_width >= 0 
      && $clip_height >= 0))
    {
      $this->errmsg('invalid main rect()'. json_encode($main_rect));
      return;
    }

    if(!($select_rect['width'] > 0 
      && $select_rect['height'] > 0))
    {
      $this->errmsg('invalid select rect(empty rect)'. json_encode($select_rect));
      return;
    }

    $user_id = $this->App()->get_user_info('uid');
    $config_avatar = $this->Config('site.avatar');
    $avatar_file_name = $config_avatar.'/'.$data['img'];
    $avatar_dir = $this->App()->getAppRoot();
    // load orignal image, according to main rect  create the full image;
    if(!file_exists($avatar_dir.$avatar_file_name)) {
      $this->errmsg('invalid avatar image. hack action!'. $avatar_file_name);
      return;
    }

    $avatar_image = new QImage();
    if(!$avatar_image->load($avatar_dir.$avatar_file_name)) {
      $this->errmsg('invalid image file.');
      return;
    }

    $avatar_92_filename = $avatar_dir.$config_avatar.'/user92.'.$user_id.'.jpg';
    $avatar_48_filename = $avatar_dir.$config_avatar.'/user48.'.$user_id.'.jpg';
    
    $clip_image = new QImage();
    $clip_image->create($select_rect['width'], $select_rect['height']);
    $clip_image->fill(0xff, 0xff, 0xff);

    $clip_image->copyfrom($avatar_image, 
      0, 0, $clip_left, $clip_top, $clip_width, $clip_height);

    $avatar92_image =$clip_image->resize(92, 92);
    $avatar48_image =$clip_image->resize(48, 48);
    $avatar92_image->saveas($avatar_92_filename);
    $avatar48_image->saveas($avatar_48_filename);

    $clip_image->destroy();
    $avatar92_image->destroy();
    $avatar48_image->destroy();
  }

  function do_save_detail() {
    $theApp = &$this->App();
    $user_key = $theApp->get_user_info('user-key');
    if(empty($user_key) || session_id() != $user_key) {
      $this->errmsg('sorry! you not login.');
      return;
    }

    // 保存用户信息
    $data = &$_POST['data'];
    $uid = intval($data['uid'], 10);
    #$name = $data['name'];
    $gender = intval($data['gender'], 10);
    $bothday = $data['bothday'];
    $description = $data['description'];
    
    if($uid != $theApp->get_user_info('uid')) {
      $this->errmsg('不能修改其他用户信息，是否已经使用其他账号登陆');
      return;
    }

    if(strlen($description) > 64) {
      $this->errmsg('签名字数不能超过64!');
      return;
    }

    if(!($gender == 0 || $gender == 1)) {
      $this->errmsg('性别错误，难道是？');
      return;
    }

    if(!preg_match("/\d{4}-\d{2}-\d{2}/", $bothday)) {
      $this->errmsg('生日格式不正确');
      return;
    }

    $fields = array(
    #  'name' => $name,
      'gender' => $gender,
      'bothday' => $bothday,
      'description' => htmlspecialchars(addslashes($description)),
    );

    $db = &$this->App()->db();
    $update_detail_sql = $db->updateSQL('users', $fields);
    $update_detail_sql.= " where `uid`='{$uid}';";
    if(!$db->execute($update_detail_sql)) {
      $this->errmsg($db->get_error());
      return;
    }
  }
}

?>
