<?php
if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_MODULE_ALBUM extends CLASS_MODULE {

  public function __construct() {  parent::__construct(); }
  public function CLASS_MODULE_ALBUM() { $this->__construct(); }
  
  function doMain($action) {
    // check login
    $this->App()->check_user_logon();

    switch($action) {
		case 'edit':
			$this->edit_panel();
		  break;
		case 'index':
		default:
			$this->index();
			break;
		}
  }

  function index() {
    $uid = $this->App()->get_user_info('uid');
    $t = new CLASS_TEMPLATES($this->App());
    $t->load('user.album');

    $db = &$this->App()->db();
    $album_id = intval($_GET['id'], 10);
    if($album_id != 0) {
      // get albums info
      $sql_get_album = "select * from ##__users_albums where id='{$album_id}' order by create_time desc limit 0, 1;";

      $album_info = $db->get_row($sql_get_album);
      if(empty($album_info)) {
        die('invalid album');
      }
    } else {
      $album_info = array(
        'albumname' => '待分类',
        'id' => 0
      );
    }
    
    $t->dump2template($album_info);

    // images data
    $sql = "select R.file_name, R.width, R.height, U.id as id, U.from_host, U.title, U.agent, U.create_date from ##__images_resource AS R, ##__users_images AS U where U.res_id=R.id and U.album_id={$album_id} and U.uid={$uid} order by U.id DESC";
    $images = array();

    $db->get_results($sql, $images);

    if(empty($images)) {
      $t->push('images_data', '[]');
    } else {
      $t->push('images_data', json_encode($images));
    }

    $t->push('username', $user_name);

		$sql = "SELECT id as value, albumname as text FROM  `##__users_albums`";
	  $sql .= " where `uid`={$uid}";
		$albums = array();
		$db->get_results($sql, $albums);
		$t->push_data('useralbums', $albums);

		$t->display();
  }

	function edit_panel() {
	  $t = new CLASS_TEMPLATES($this->App());
		$t->load('user.album.settings');

		$db = &$this->App()->db();
		$album_id = intval($_GET['id'], 10);
		if($album_id != 0) {
		  // get albums info
		  $sql_get_album = "select * from ##__users_albums where id='{$album_id}' limit 0, 1;";
		  $album_info = $db->get_row($sql_get_album);
		  if(empty($album_info)) 
		    die('invalid album');
		} else {
		  $album_info = array(
			  'albumname' => '待分类',
				'id' => 0
			);
		}

		$t->dump2template($album_info);
		$user_name = $this->App()->get_user_info('name');
    $t->push_data('username', $user_name);
		$t->display();
	}

//////////////////////// ajax ///////////////////////////////

  function doAjax($action) {
    $theApp = &$this->App();
    if(!$theApp->check_user_logon(false)) {
      $this->AjaxHeader(-2); // 未登录
      $this->AjaxData('not logon');
      return;
	  }

    switch($action) {
    case 'create-new':
      $this->edit(false);
      break;
    case 'edit':
      $this->edit(true);
      break;
    case 'delete':
      $this->delete_album();
      break;
    case 'move':
      $this->move();
      break;
    }
  }

  function edit($is_edit) {
		
		$data = &$_POST['data'];
		$album_name = $data['album_name'];
    if(empty($album_name) || !eregi("^[^\/\\:\*\?,\",<>\¦]+$", $album_name)) {
			$this->AjaxHeader(-2);
		  $this->AjaxData('画集名称非法！'.$album_name);
			return;
		}

		$album_class = $data['album_class'];
		$description = $data['description'];
    $album_id = intval($data['id'],10);

    $uid = $this->App()->get_user_info('uid');
    if($this->album_is_duplicate($album_id, $uid, $album_name)) {
      $this->errmsg("已经存在重复名称的画集!");
      return;
    }
		$db = $this->App()->db();

		if($is_edit) {			
			if($album_id == 0) {
			  $this->AjaxHeader(-3);
		    $this->AjaxData('system album is not update');
			}
		  
			$sql = "UPDATE ##__users_albums set `albumname`='{$album_name}',`classname`='{$album_class}',`description`='{$description}' where `id`='{$album_id}'";
      $result = $db->execute($sql);
		} else {
			$fields = array(
				'uid' => $this->App()->get_user_info('uid'),
				'albumname' => $album_name,
				'classname' => $album_class,
				'description'=>$description,
			);    
		  $sql = $db->insertSQL('users_albums', $fields);
      $result = $db->execute($sql);
      $album_id = $db->get_insert_id();
		}		
    
    if(!$result) 
      $this->errmsg($db->get_error());
    
    $this->App()->notify($is_edit?'album_update':'album_new', 
      array('album_id' => $album_id, 'album_name' => $album_name) );
  }

  function delete_album() {
    $uid = $this->App()->get_user_info('uid');
    $data = &$_POST['data'];
    $album_id = intval($data['id'], 10);
    if($album_id == 0) {
      $this->errmsg('system album is not be deleted!');
      return;
    }

    if(!$this->album_is_empty($album_id, $uid)) {
      $this->errmsg('album is not empty, need delete all images of this album!');
      return;
    }

    if(!$this->album_is_exists($album_id)) {
      $this->errmsg('album is not exists or you have no access!');
      return;
    }
    
    // 删除前先备份
    $this->backup_delete_album($album_id);
    // 开始删除数据
    
    // 删除分类
    $sql = "delete from ##__users_albums where `id`='{$album_id}' and `uid`={$uid};";
    $this->App()->db()->execute($sql);
    
    // 删除图片
    $sql_delete_images = "delete from ##__users_images where `album_id`='{$album_id}' and `uid`={$uid};";
    $this->App()->db()->execute($sql_delete_images);
    $this->App()->notify('album_delete', array('album_id' => $album_id));
  }

  function move() {
    $data = &$_POST['data'];
    $pictures = json_decode(&$data['pictures']);
    //print_r($pictures);
    if(!is_array($pictures) || empty($pictures)) {
      $this->errmsg('invalid parameter: pictures');
      return;
    }

    $album_id = intval($data['album_id'], 10);
    if($album_id < 0 || !$this->album_is_exists($album_id)) {
      $this->errmsg('invalid parameter: album_id');
      return;
    }

    $db = &$this->App()->db();
    $ids = implode('\',\'', $pictures);
    $uid = $this->App()->get_user_info('uid');
    $sql = "update ##__users_images set `album_id`='{$album_id}' where `uid`={$uid} and `id` in ('{$ids}')";

    $db->execute($sql);

    $this->App()->notify('image_move', array(
        'album_id' => $album_id,
        'images' => $pictures));
  }

  function album_is_exists($album_id) {
    $album_id = intval($album_id, 10);
    if($album_id == 0) 
      return true;

    $uid = $this->App()->get_user_info('uid');
    $db = &$this->App()->db();
    $sql = "select id from ##__users_albums where `id`='{$album_id}' and `uid`={$uid} limit 0, 1;";

    $album_info = $db->get_row($sql);
    return (!empty($album_info));
  }

  function album_is_duplicate($album_id, $uid, $album_name) {
     $db = &$this->App()->db();
     $sql="select id from ##__users_albums where `uid`={$uid} and `albumname`='{$album_name}'";
     if($album_id != 0)
       $sql.=" and `id` !={$album_id}";

     $sql.=" limit 0,1;";
     $rs = $db->get_row($sql);

     //echo $sql;

     return (!empty($rs));
  }

  function album_is_empty($album_id, $uid) {
    $uid = $this->App()->get_user_info('uid');
    $db = &$this->App()->db();
    $sql = "select id from ##__users_images where `album_id`='{$album_id}' and `uid`={$uid} limit 0, 1;";

    $rs = $db->get_row($sql);

    return empty($rs);
  }

  function backup_delete_album($album_id) {
    $tablename = "##__users_images";
    $album_id = intval($album_id, 10);
    $db = &$this->App()->db();
    $sql = "select * from {$tablename} where `album_id`='{$album_id}'";
    $rs = array();
    $db->get_results($sql, $rs);
		$bakfilename = $this->App()->getAppRoot().$this->App()->getDataPath()."/deleted_album_{$album_id}_".rndstr(16).".txt";

		if(!file_exists($bakfilename)) {
				createfolders(dirname($bakfilename));
		}

    // write album info
    $album_info = $db->get_row("select * from ##__users_albums where `id`='{$album_id}'");

		$bakStr = $db->insertSQL("##__users_albums", $album_info, false);
    $bakStr = str_replace("\n","\\n",str_replace("\r","\\r",$bakStr))."\r\n";
    foreach($rs as $item) {
      //正常情况
				$line = $db->insertSQL($tablename, $item, false);
			  $bakStr .= str_replace("\n","\\n",str_replace("\r","\\r",$line))."\r\n";
    }

    if( $bakStr != "" ) {
				$fp = fopen($bakfilename,"w");
				fwrite($fp, $bakStr);
				fclose($fp);
		}
  }
}

?>
