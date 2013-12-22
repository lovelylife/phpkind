<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_MODULE_RECOMMEND extends CLASS_MODULE {

  function __construct() { parent::__construct(); }

  function CLASS_MODULE_RECOMMEND() { $this->__construct(); }

  function doMain($action) {
    if(method_exists($this, $action)) {
      return call_user_method($action, $this);
    } else {
      return parent::doMain($action);
    }
  }

  function user() {
    $t = new CLASS_TEMPLATES($this->App());
    $t->load('recommend.user');

    $sql = "select uid, name, description from ##__users limit 0, 100;";
    $users_list = array();
    $this->App()->db()->get_results($sql, $users_list);

    if(empty($users_list)) {
      $t->push('users', '[]');
    } else {
      $t->push('users', json_encode($users_list));
    }
    $t->display(); 
  }

  function album() {
    $uid = $this->App()->get_user_info('uid');
    $t = new CLASS_TEMPLATES($this->App());
    $t->load('recommend.album');

    $t->push('username', $user_name);


    // 获取画集封面
    $album_front_dir = _IROOT.$this->Config('site.front_cover_dir').'/'.$uid;
    createfolders($album_front_dir);

    // 获取画集列表
    $sql_albums_list = "SELECT A.id AS album_id, A.albumname AS album_name, CONCAT('{$path}','/',R.file_name) AS file_name, MAX( I.id ) AS id\n"
    . "FROM ##__users_albums AS A\n"
    . "left JOIN ##__users_images AS I ON A.id=I.album_id\n"
    . "left JOIN ##__images_resource AS R ON R.id=I.res_id\n"
    . "GROUP BY A.id";
    $albums_list = array();
    $this->App()->db()->get_results($sql_albums_list, $albums_list);
    
    if(empty($albums_list)) {
      $t->push('albums', '[]');
    } else {
      $t->push('albums', json_encode($albums_list));
    }
    $t->push('albums_num', count($albums_list)+1);
    $t->display();
  }


}


?>
