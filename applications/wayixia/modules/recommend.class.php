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

    $sql = "select * from ##__nosql_users_recommend limit 0, 100;";
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

  function get_update($arr) {
    $str = "";    
    foreach($arr as $key => $value) {
      $str .= $key . "=VALUES(".$key."),";
    }
    $str = substr($str,0,-1);
    
    return $str;
  }

  function get_value($arr) {}

  function schedule() {
    $db = &$this->App()->db();
    // update recommend user count data
    $sql = "select U.uid, U.name, U.description, count(A.id) as num_albums, U.uid as num_images, group_concat(A.id) as data_albums ";
    $sql.= "from ##__users_albums A right join ##__users U on U.uid=A.uid ";
    $sql.= "group by U.uid ";
    $sql.= "order by U.uid desc; ";

    $rs = array();
    if(!$db->get_results($sql, $rs))
      trigger_error($db->get_error(), E_USER_ERROR);
    if(!empty($rs)) {
      $len = count($rs);
      $values = "";
      $fields_update = $this->get_update($rs[0]);
      for($i=1; $i < $len; $i++) {
        $user_object = &$rs[$i];
	#print_r($user_object);
	$num_images = 0;
	$albums = $this->get_images($user_object['data_albums'], $num_images);
	$user_object['data_albums'] = addslashes(json_encode($albums));
	$user_object['num_images'] = $num_images;
	$value = array_values($user_object);
        $values .= ",('".implode("','", $value)."')";
      }
      $num_images = 0;
      $albums = $this->get_images($rs[0]['data_albums'], $num_images);
      $rs[0]['data_albums'] = addslashes(json_encode($albums));
      $rs[0]['num_images'] = $num_images;

      $update = $db->insertSQL("nosql_users_recommend", $rs[0]);
      $update .= $values." ON DUPLICATE KEY UPDATE ".$fields_update.";";
      //echo $update;
      $db->execute($update);
    }
  }

  function get_images($albums, &$num_images) {
    $num_images = 0;
    $db = &$this->App()->db();
    $sql = "select I.album_id, A.albumname, count(I.id) as num_images, group_concat(I.id) as data_images ";
    $sql.= "from ##__users_images I left join ##__users_albums A on A.id=I.album_id ";
    $sql.= "where I.album_id>0 and I.album_id IN ({$albums}) ";
    $sql.= "group by I.album_id ";
    $sql.= "order by num_images desc;";

    $rs = array();
    $db->get_results($sql, $rs);
    
    $r = array();
    if(!empty($rs)) {
      $len = count($rs);
      for($i=0; $i < $len; $i++) {
        if($i < 3) {       
          array_push($r, $rs[$i]);
	}
        $num_images += intval($rs[$i]['num_images'], 10);
      }
    }

    return $r;
  }
}


?>
