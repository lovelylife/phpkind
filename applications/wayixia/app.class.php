<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_WAYIXIA_APPLICATION extends CLASS_APPLICATION {
    
  function __construct($args) {
    parent::__construct($args);
  }
    
  function CLASS_WAYIXIA_APPLICATION($args) {
    $this->__construct($args);
  }
  
  function appMain($args) {    
    parent::appMain($args);
  }

  function moduleCallback($module) {
    if(isdebug()) {
      $data = array('get' => $_GET, 'post'=> $_POST);
      $db = &$this->db();
      $fields = array(
	  'referer' => $_SERVER['HTTP_REFERER'],
	  'ip' => getip(),
          'app' => $this->getAppName(),
          'module' => $this->getModule(),
          'action' => $this->getAction(),
          'data' => json_encode($data),
      );

      $sql = $db->insertSQL('system_count', $fields);
      if(!$db->execute($sql)) {
         trigger_error($db->get_error(), E_USER_DEFINED);
      }
    }
  }

    // read login user info
  function get_user_info($key) {
    if(empty($key) || !isset($_SESSION['user'])) {
      return false;
    }

    return $_SESSION['user'][$key];
  }

  function set_user_info($key, $value) {
    if(empty($key))
      return false;

    if(!isset($_SESSION['user'])) 
      $_SESSION['user'] = array();

    $_SESSION['user'][$key] = $value;
    return true;
  }

  function clear_user_info() {
    $_SESSION['user'] = array();
  }

  function check_user_logon($need_redirect = true) {

    $user_key = $this->get_user_info('user-key');
    $user_name = $this->get_user_info('name');
    // 登录
    if(empty($user_key) || empty($user_name)) {
      if($need_redirect) {
        $_HTTP['reffer'];
        header("Content-type: text/html; charset=utf-8"); 
        $goto_url = $this->getUrlApp()
          ."&mod=user&action=login&t=2&refer="
          .urlencode($_SERVER["HTTP_REFERER"]);
        echo "<script> top.location.href=\"{$goto_url}\"; </script>";
        exit();
        //header("location: {$goto_url};");
      } else {
        return false;
      }
    }

    return true;
  }

  function goto_url($message, $url, $t) {    
    header('Content-Type: text/html; charset=UTF-8');
    $output  = $message;
    if($t > 0) {
      $output .= "<script>setTimeout(function() { location.href='{$url}';}, {$t}) </script>";
    }

    echo $output;
  }

  // 查询指定用户的信息 id, uname, nickname
  function specify_user_info($uname) {
    $sql = "select uid AS user_id, name AS user_name, nickname AS user_nickname ";
    $sql.= "from ##__users where `name`='{$uname}' limit 0,1;";
    return $this->db()->get_row($sql);
  }

  function get_albums_sql($user_name) {
    if(empty($user_name)) 
      trigger_error("paramter is invalid", E_USER_ERROR);

	$path = '';
	//if(isdebug()) {
		$path = "http://".$_SERVER['SERVER_NAME'].$this->Config("site.thumb_images_dir");
	//}

	$sql_albums_list = "SELECT A.id AS album_id, A.albumname AS album_name, CONCAT('{$path}','/',R.file_name) AS file_name, MAX( I.id ) AS id\n"
    . "FROM ##__users_albums AS A\n"
    . "left JOIN ##__users_images AS I ON A.id=I.album_id\n"
    . "left JOIN ##__images_resource AS R ON R.id=I.resource_id\n"
    . "where A.uname='{$user_name}'\n"
    . "GROUP BY A.id";

	return $sql_albums_list;
  }
}

?>
