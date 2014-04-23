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
    case 'display-album-list':
      $this->display_album_list();
      break;
    case 'download':
      $this->download();
      break;
    default:
      $this->index();
    }
  }

  function index() {
    $db = &$this->App()->db();
    $tag = $_GET['tag'];

    $sql = "select distinct(file_name), server, file_name, width, height, id, uname as owner, title, DATE_FORMAT(create_time, '%Y-%m-%d') as create_time ";
    $sql.= "from ##__nosql_pins group by file_name ";
    $sql.=" order by id DESC ";
      

    $page_size = 50;
    $count_sql =  "select sum(size) totalsize from ";
    $count_sql.= "(select count(distinct file_name) size from ##__nosql_pins group by file_name) d; ";
      
    $count_row = $this->App()->db()->get_row($count_sql);
    if(empty($count_row)) {
      $totalsize = 0;
    } else {
      $totalsize = $count_row['totalsize'];
    }
    //print_r($count_row);
    $cfg = array(
        "totalsize" => $totalsize,
        "pagesize" => $page_size,
        "pagekey" => "p",
        "html" => true,
        "tpl" => "/index/".urlencode($tag)."{pid}",
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
  }

  function display() {
    $id = intval($_GET['id'], 10);
    
    $sql = "select * from ##__nosql_pins where album_id>0 and id={$id} limit 0,1;";
    $db = &$this->App()->db();
    $image = $db->get_row($sql);
    if(empty($image)) {
      trigger_error('image is invalid or deleted', E_USER_ERROR);
    }
    
    $t = new CLASS_TEMPLATES($this->App());
    $t->dump2template($image);

    // domain
    $from_host = $image['from_host'];
    $from_host_images_sql = "select * from ##__nosql_pins where album_id>0 and from_host='{$from_host}' limit 0, 8;";

    $from_host_images = array();
    $db->get_results($from_host_images_sql, $from_host_images);
    $t->push_data('domain_images', $from_host_images);

    // get album images
    $album_id = intval($image['album_id'], 10);
    $get_album_images_sql = "select * from ##__nosql_pins where album_id={$album_id} limit 0, 8;";
    $album_images = array();
    if(!$db->get_results($get_album_images_sql, $album_images))
      trigger_error($db->get_error(), E_USER_ERROR);

    $t->push_data('album_images', $album_images);

    // 取前一张和后一张图片
    $sql_preview_next = "SELECT ";
    $sql_preview_next.= "CASE WHEN SIGN(id-'$id')>0 THEN 'next' ELSE 'prev' END AS description, ";
    $sql_preview_next.= "CASE WHEN SIGN(id-'$id')>0 THEN MIN(id) WHEN SIGN(id-'$id')<0 THEN MAX(id) END AS id ";
    $sql_preview_next.= "FROM ##__nosql_pins ";
    $sql_preview_next.= "WHERE album_id={$album_id} and id <> '$id' ";
    $sql_preview_next.= "GROUP BY SIGN(id - '$id') ";
    $sql_preview_next.= "ORDER BY SIGN('$id' - id );";

    $ids = array();
    $pins_url = $this->Config('urls.image');
    $db->get_results($sql_preview_next, $ids);
    for($i=0; $i < count($ids); $i++) {
      $t->push($ids[$i]['description'], '<a href="'.$pins_url.'/'.$ids[$i]['id'].'" class="'.$ids[$i]['description'].' x "></a>');
    }
    
    $t->dump2template($album_info);
    // reader page
    $t->render('display');
  }

  function display_album() {
    $t = new CLASS_TEMPLATES($this->App());
    $db = &$this->App()->db();
    $album_id = intval($_GET['aid'], 10);
    
    // get album info
    $get_album_info_sql = "select A.name, U.name as uname, U.uid as uid from ##__users_albums as A, ##__users AS U where A.id={$album_id} and A.uid=U.uid limit 0,1;";
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
    $t->push('info_height', 100+(count($albums)+4)*48);

    // images data
    $sql = "select R.server, R.file_name, R.width, R.height, I.id as id, I.from_host, I.title from ##__images_resource R, ##__users_images I where I.res_id=R.id and I.album_id>0 and I.album_id='{$album_id}' order by I.id DESC";

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

  function display_album_list() {
    $db = &$this->App()->db();
    $uid = intval($_GET['uid'], 10);	  
    $t = new CLASS_TEMPLATES($this->App());
    $t->load('display.albumlist');

    $user_info = $db->get_row("select uid, name as uname from ##__users where uid={$uid} limit 0,1;");
    if(empty($user_info)) {
      $user_name = "无此用户";
    } else {
      $user_name = $user_info['uname'];
    }

    $t->push('uid', $user_info['uid']);
    // 获取画集列表
    $sql_albums_list = "SELECT * "
    . "FROM ##__nosql_albums_recommend "
    . " where num_images > 8 and uid={$uid} limit 0, 50;";
    $albums_list = array();
    $this->App()->db()->get_results($sql_albums_list, $albums_list);
    
    if(empty($albums_list)) {
      $t->push('albums', '[]');
    } else {
      $t->push('albums', json_encode($albums_list));
    }
    $t->push('uname', $user_name);
    // render page
    $t->display();
  }

  function display_all() {
    $t = new CLASS_TEMPLATES($this->App());
    $db = &$this->App()->db();
    $uid = intval($_GET['u'], 10);
    $user_info = $this->App()->query_user_info($uid);
    if(empty($user_info)) {
      trigger_error("user {$uid} is not exists", E_USER_ERROR);
    }
    $t->dump2template($user_info);

    // images data
    $sql = "select server, file_name, width, height, id, from_host, title ";
    $sql.= "from ##__nosql_pins ";
    $sql.= "where uid={$uid} ";
    $sql.= "order by id DESC;";
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
    $sql = "select server, file_name, width, height, id, uid, uname as owner, title ";
    $sql.= "from ##__nosql_pins ";
    $sql.= "where album_id>0 and from_host='{$from_host}' ";
    $sql.= "order by id DESC";

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
