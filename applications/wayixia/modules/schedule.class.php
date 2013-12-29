<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_MODULE_SCHEDULE extends CLASS_MODULE {

  function __construct() { parent::__construct(); }

  function CLASS_MODULE_SCHEDULE() { $this->__construct(); }

  function doMain($action) {
    if(method_exists($this, $action)) {
      return call_user_method($action, $this);
    } else {
      return parent::doMain($action);
    }
  }

  function images2() {
    $t = new CLASS_TEMPLATES($this->App());
    $t->load('recommend.user');

    $sql = "select * from ##__nosql_users_recommend order by num_images desc limit 0, 100;";
    $users_list = array();
    $this->App()->db()->get_results($sql, $users_list);

    if(empty($users_list)) {
      $t->push('users', '[]');
    } else {
      $t->push('users', json_encode($users_list));
    }
    $t->display(); 
  }

  function images3() {
    $t = new CLASS_TEMPLATES($this->App());
    $t->load('recommend.album');

    // 获取画集列表
    $sql_albums_list = "SELECT * "
    . "FROM ##__nosql_albums_recommend "
    . " where num_images > 8 limit 0, 50;";
    $albums_list = array();
    $this->App()->db()->get_results($sql_albums_list, $albums_list);
    #echo $sql_albums_list;
    #print_r($albums_list[0]); 
    #$str = stripslashes($albums_list[0]['data_images']);
    #$o = json_decode($str, true);
    #echo $str;
    #print_r($o);
    $len = count($albums_list);
    for($i=0; $i < $len; $i++) {
      $albums_list[$i]['data_images'] = stripslashes($albums_list[$i]['data_images']);
    }
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

  function get_insert_sql($table, $keys, $values) {
    $sql = "INSERT INTO `##__{$table}` ({$keys}) VALUES $values";
    return $sql;
  }

  function get_keys($record) 
  {
    $keys = array_keys($record); 
    return "`".implode("`,`", $keys)."`";
  }

  function get_array_values($arr) {
    $values = array_values($arr);
    $len = count($values);
    for($i=0; $i < $len; $i++) {
      $values[$i] = addslashes($values[$i]);
    }

    return $values;
  }

  function images() {
    $db = &$this->App()->db();
    $sql = "select A.id as album_id, A.name as album_name, A.uid, ";
    $sql.= "I.id, I.from_host, I.from_url, I.title, ";
    $sql.= "R.src, R.width, R.height, R.server, R.file_name, R.file_type, R.file_size, R.creator_uid, ";
    $sql.= "U.name as uname  ";
    $sql.= "from ##__images_resource R, ##__users U, ##__users_images I, ##__users_albums A ";
    $sql.= "where R.id=I.res_id and A.uid=U.uid and A.id=I.album_id ";
    $sql.= ";";
    $rs = array();
    if(!$db->get_results($sql, $rs))
      trigger_error($db->get_error(), E_USER_ERROR);
     
    if(!empty($rs)) {
      $insert_values = "";
      $len = count($rs);
      for($i=0; $i < $len; $i++) {
        $object = &$rs[$i];
        $value = $this->get_array_values($object);
        $insert_values .= "('".implode("','", $value)."'),";
      }
      $update_fields = $this->get_update($rs[0]);
      $insert_keys   = $this->get_keys($rs[0]);
      $insert_values = substr($insert_values, 0, -1);
      $update = $this->get_insert_sql("nosql_pins", $insert_keys, $insert_values);
      $update .= " ON DUPLICATE KEY UPDATE ".$update_fields.";";
      #$update = addslashes($update);
      if(!$db->execute($update)) {
        trigger_error($db->get_error(), E_USER_ERROR);
      }
      echo "ok";
    } else {
      echo "no";
    }
  }

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
      $db->execute($update);
    } else {
      echo "no images";
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
        $object = &$rs[$i];
        $object['data_images'] = $this->get_resources($object['data_images']);
        if($i < 3) {       
          array_push($r, $object);
	}
        $num_images += intval($rs[$i]['num_images'], 10);
      }
    }

    return $r;
  }

  function get_resources($images) {
    $db = &$this->App()->db();
    $sql = "select R.server, R.file_name, R.width, R.height, I.id as id, I.from_host, I.title ";
    $sql.= "from ##__images_resource R, ##__users_images I ";
    $sql.= "where I.res_id=R.id and I.album_id>0 and I.id IN ({$images}) ";
    $sql.= "order by I.id DESC";
    
    //echo $sql;
    $rs = array();
    $db->get_results($sql, $rs);

    return $rs;
  }

}


?>

