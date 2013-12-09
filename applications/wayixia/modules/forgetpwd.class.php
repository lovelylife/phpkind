<?php
if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_MODULE_FORGETPWD extends CLASS_MODULE {

  function __construct() { parent::__construct(); }

  function CLASS_MODULE_FORGETPWD() { $this->__construct(); }

  function doMain($action) {
    switch($action) 
    {
    case 'forgetpwd':
      $this->forget_password();
      break;

    case 'change-pwd':
      $this->change_password();
      break;
    
    default:
      $this->index();
    }
  }

  function index() {
      try {
        $t = new CLASS_TEMPLATES($this->App());
        $t->render('user.pwd.forget');
      } catch(Exception $e) {
        print_r($e);
      }
  }


///////////////// ajax //////////////////////////////////////////////////////

  function doAjax($action) {
    switch($action) {
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
    case 'do-forgot-pwd':
      $this->do_forget_password();
      break;

    case 'do-change-pwd':
      $this->do_change_password();
      break;
    }
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
    $rs = $db->get_row($sql);

    if(empty($rs)) {
      $this->errmsg("用户不存在或者邮箱输入错误!".$sql);
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
    $mailcfg['auth'] = $this->Config('email.auth')?1:0; 
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
}

?>
