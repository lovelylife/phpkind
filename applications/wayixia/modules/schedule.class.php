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

  function users() {
    $db = &$this->App()->db();
    $sql = "select U.uid, U.name, U.description, count(A.id) as num_albums, U.uid as num_images, group_concat(A.id) as data_albums ";
    $sql.= "from ##__users_albums A right join ##__users U on U.uid=A.uid ";
    $sql.= "group by U.uid ";
    $sql.= "order by U.uid desc; ";

    $rs = array();
    if(!$db->get_results($sql, $rs))
      trigger_error($db->get_error(), E_USER_ERROR);
    if(!empty($rs)) {
      $len = count($rs);
      $insert_values = "";
      for($i=0; $i < $len; $i++) {
        $object = &$rs[$i];
	$num_images = 0;
	$albums = $this->get_images($object['data_albums'], $num_images);
	$object['data_albums'] = (json_encode($albums));
	$object['num_images'] = $num_images;
 	$value = $this->get_array_values($object);
        $insert_values .= "('".implode("','", $value)."'),";
      }

      $update_fields = $this->get_update($rs[0]);
      $insert_keys   = $this->get_keys($rs[0]);
      $insert_values = substr($insert_values, 0, -1);
      $update = $this->get_insert_sql("nosql_users_recommend", $insert_keys, $insert_values);
      $update .= $values." ON DUPLICATE KEY UPDATE ".$update_fields.";";
      #echo $update;
      if(!$db->execute($update)) 
        trigger_error($db->get_error(), E_USER_ERROR);
      echo "ok";
    } else {
      echo "no images";
    }
  }

  function albums() {
    $db = &$this->App()->db();
    // update recommend user count data
    $sql = "select A.id as album_id, A.name as album_name, A.description as album_description, A.uid, ";
    $sql.= "count(I.id) as num_images, group_concat(I.id) as data_images, ";
    $sql.= "U.name as uname ";
    $sql.= "from ch_users_images I ";
    $sql.= "right join ch_users_albums A on A.id=I.album_id ";
    $sql.= "left join ##__users U on U.uid=A.uid ";
    $sql.= "group by A.id;";
    $rs = array();
    if(!$db->get_results($sql, $rs)) 
      trigger_error($db->get_error(), E_USER_ERROR);

    if(!empty($rs)) {
      $insert_values = "";
      $len = count($rs);
      for($i=0; $i < $len; $i++) {
        $object = &$rs[$i];
        $object['data_images'] = json_encode( array_slice($this->get_resources($object['data_images']), 0, 9) );
        $value = $this->get_array_values($object);
        $insert_values .= "('".implode("','", $value)."'),";
      }
      $update_fields = $this->get_update($rs[0]);
      $insert_keys   = $this->get_keys($rs[0]);
      $insert_values = substr($insert_values, 0, -1);
      $update = $this->get_insert_sql("nosql_albums_recommend", $insert_keys, $insert_values);
      $update .= $values." ON DUPLICATE KEY UPDATE ".$update_fields.";";
      #echo $update;
      if(!$db->execute($update)) {
        trigger_error($db->get_error(), E_USER_ERROR);
      }
      echo "ok";
    } else {
      echo "no albums";
    }
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



  /* functions  */
  function get_images($albums, &$num_images) {
    $num_images = 0;
    if(empty($albums)) 
      return array();
    $db = &$this->App()->db();
    $sql = "select I.album_id, A.name as album_name, count(I.id) as num_images, group_concat(I.id) as data_images ";
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
    if(empty($images))
      return array();    
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

