<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_MODULE_DEFAULT extends CLASS_MODULE {

	public function __construct() { parent::__construct();  }
	public function CLASS_MODULE_DEFAULT() { $this->__construct(); }

  function doMain($action) {
    switch($action) {
    case 'display':
      $this->display();
      break;
    case 'display-album':
      $this->display_album();
      break;
    case 'display-domain':
      $this->display_domain();
      break;
    case 'display-all':
      $this->display_all();
      break;
    case 'download':
      $this->download();
      break;
    default:
      $this->index();
    }
  }

  function index() {
    try {
      $db = &$this->App()->db();
      $tag = $_GET['tag'];

      $sql = "select ";
      $sql.= "R.file_name, R.width, R.height, U.id as id, U.from_host, U.title ";
      $sql.= " from ##__images_resource AS R, ##__users_images AS U ";
	  $sql.= " where U.res_id=R.id and U.album_id!=0 ";
	  // where condition
	  if(!empty($tag))
		$sql.=" and U.album_id in (select id from ##__users_albums where `classname`='{$tag}') ";

	  $sql.=" order by U.id DESC ";


      $page_size = 50;
      $totalsize = $this->App()->db()->query_count($sql);

      $cfg = array(
        "totalsize" => $totalsize,
        "pagesize" => $page_size,
        "pagekey" => "p",
        "html" => true,
        "tpl" => "/index/".urlencode($tag)."/{pid}",
      );

			// 实例化分页类,初始化构造函数中的总条目数和每页显示条目数
      $pager = new CLASS_PAGE($cfg);
      
      $sql .= $pager->getSQLPage();

      $rs = array();
      $db->get_results($sql, $rs);

      $t = new CLASS_TEMPLATES($this->App());
      if(empty($rs)) {
        $t->push('images_data', '[]');
      } else {
        $t->push('images_data', json_encode($rs));
      } 

      $t->push('tag', $tag);
      $t->push('pager', $pager->__toString());

      // 显示界面
      $t->render('index');
    } catch(Exception $e) {
      print_r($e);
    }
  }

  function display() {
    //$id = intval($_GET['id'], 10);
    $id = intval($_GET['id'], 10);
    $sql = "select * from ##__images_resource AS R, ##__users_images AS U where  R.id=U.res_id and U.album_id>0 and U.id={$id} limit 0,1;";
    $db = &$this->App()->db();
    $image = $db->get_row($sql);
    if(empty($image)) {
      trigger_error('image is invalid or deleted', E_USER_ERROR);
    }

    $t = new CLASS_TEMPLATES($this->App());
    $t->dump2template($image);

    // domain
    $from_host = $image['from_host'];
    $from_host_images_sql = "select * from ##__images_resource AS R, ##__users_images AS I where  R.id=I.res_id and I.album_id>0 and I.from_host='{$from_host}' limit 0, 8;";

    $from_host_images = array();
    $db->get_results($from_host_images_sql, $from_host_images);
    $t->push_data('domain_images', $from_host_images);

    // get album images
    $album_id = intval($image['album_id'], 10);
    $get_album_images_sql = "select * from ##__images_resource AS R, ##__users_images AS U where  R.id=U.res_id and U.album_id={$album_id} limit 0, 8;";
    $album_images = array();
    $db->get_results($get_album_images_sql, $album_images);
    $t->push_data('album_images', $album_images);
    //print_r($thumb_images);

    // get album info
    $get_album_info_sql = "select UA.albumname, U.nickname from ##__users_albums as UA, ##__users AS U where UA.id='{$album_id}' and UA.uid=U.uid limit 0,1;";
    $album_info = $db->get_row($get_album_info_sql);
    if(empty($album_info)) {
      $album_info = array(
        'albumname' => '待分类专辑',
      );
    }

    // 取前一张和后一张图片
    $sql_preview_next = "SELECT CASE WHEN SIGN(id-'$id')>0 THEN 'next' ELSE 'prev' END AS description, CASE WHEN SIGN(id-'$id')>0 THEN MIN(id) WHEN SIGN(id-'$id')<0 THEN MAX(id) END AS id FROM ##__users_images WHERE album_id={$album_id} and id <> '$id' GROUP BY SIGN(id - '$id') ORDER BY SIGN('$id' - id );";

    $ids = array();
    $db->get_results($sql_preview_next, $ids);
    for($i=0; $i < count($ids); $i++) {
      $t->push($ids[$i]['description'], '<a href="'._IPATH.'/is/'.$ids[$i]['id'].'" class="'.$ids[$i]['description'].' x "></a>');
    }
    //print_r($ids);
    //print_r($album_info);
    $t->dump2template($album_info);

    $t->render('display');
  }

  function display_album() {
    $t = new CLASS_TEMPLATES($this->App());
    $db = &$this->App()->db();
    $album_id = intval($_GET['aid'], 10);
    
	  // get album info
    $get_album_info_sql = "select A.albumname, U.nickname, U.name as uname, U.uid as uid from ##__users_albums as A, ##__users AS U where A.id={$album_id} and A.uid=U.uid limit 0,1;";
    $album_info = $db->get_row($get_album_info_sql);
    //print_r($album_info);
    if(empty($album_info)) {
      trigger_error('album is not exists.', E_USER_ERROR);
    }

    $uid = intval($album_info['uid'], 10);
    $t->dump2template($album_info);

	  // album list
	  $get_albums_list = "select * from ##__users_albums where `uid`={$uid};";
	  $albums = array();
	  $db->get_results($get_albums_list, $albums);

	  //print_r($albums);
	  $t->push_data('albums_data', $albums);
	  $t->push('info_height', 320+(count($albums)+3)*35);

    // images data
    $sql = "select R.file_name, R.width, R.height, I.id as id, I.from_host, I.title from ##__images_resource AS R, ##__users_images AS I where I.res_id=R.id and I.album_id>0 and I.album_id='{$album_id}' and I.uid={$uid}  order by I.id DESC";

    $images = array();
    $db->get_results($sql, $images);
    //print_r($images);

    if(empty($images)) {
      $t->push('images_data', '[]');
    } else {
      $t->push('images_data', json_encode($images));
    }

    $t->render('display.album');
  }

  function display_all() {
    $t = new CLASS_TEMPLATES($this->App());
    $db = &$this->App()->db();
    $uname = $_GET['u'];
    $specify_user_info = $this->App()->specify_user_info($uname);
    if(empty($specify_user_info)) {
      trigger_error("user {$uname} is not exists", E_USER_ERROR);
    }
    $t->dump2template($specify_user_info);

    // images data
    $sql = "select R.file_name, R.width, R.height, U.id as id, U.from_domain, U.title from ##__images_resource AS R, ##__users_images AS U where U.resource_id=R.id and U.album_id>0 and U.uname='{$uname}' order by U.id DESC";
    $images = array();
    $db->get_results($sql, $images);

    if(empty($images)) {
      $t->push('images_data', '[]');
    } else {
      $t->push('images_data', json_encode($images));
    }

    // albums list


    $t->render('display.all');
  }

  function display_domain() {
    $t = new CLASS_TEMPLATES($this->App());
    $db = &$this->App()->db();
    $from_host = $_GET['d'];
    if(empty($from_host)) 
      trigger_error("invalid host", E_USER_ERROR);

    // images data
    $sql = "select R.file_name, R.width, R.height, U.id as id, U.from_host, U.title from ##__images_resource AS R, ##__users_images AS U where U.res_id=R.id and U.album_id>0 and U.from_host='{$from_host}' order by U.id DESC";
    $images = array();
    $db->get_results($sql, $images);

    if(empty($images)) {
      $t->push('images_data', '[]');
    } else {
      $t->push('images_data', json_encode($images));
    }

	$t->push('from_host', $from_host);

    $t->render('display.domain');
  }

  function download() {
    try {
      $t = new CLASS_TEMPLATES($this->App());
      $t->render('plugin.download');
    } catch(Exception $e) {
      print_r($e);
    }
  }
}

?>
