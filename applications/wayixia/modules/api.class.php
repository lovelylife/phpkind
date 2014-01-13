<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_MODULE_API extends CLASS_MODULE {

  public function __construct() {
    parent::__construct();
  }

  public function CLASS_MODULE_API() { $this->__construct(); }
	
  function doMain($action) {
    switch($action) {
    case 'preview':
      $this->preview();
      break;
    case 'xdm':
      $this->xdm();
      break;
    default:
      parent::doMain($action);
    }
  }

  function preview() {
    // useralbums
    $sql = "SELECT id as value, name as text FROM  `##__users_albums`";
    $uid = $this->App()->get_user_info('uid');
    if(!empty($uid)) {
      $sql .= " where `uid`='{$uid}'";
    }
    $albums = array();
    if(!$this->App()->db()->get_results($sql, $albums)) {
      //trigger_error('nodata', E_USER_ERROR);
    }

    $t = new CLASS_TEMPLATES($this->App());
    $t->load('plugin.chrome');
    
    $t->push_data('useralbums', $albums);
    $t->display();
  }

  // cross control
  function xdm() {
    $t = new CLASS_TEMPLATES($this->App());
    $t->render('plugin.xdm');
  }
 
  function doAjax($action) {
    switch($action) {
    case 'wayixia':
      $this->wayixia();
      break;
    case 'get-album-list':
      $this->get_album_list();
      break;
    case 'get-album-image-list':
      $this->get_album_image_list();
      break;
    case 'add-album':
      $this->add_album();
      break;

    // api for nodejs to get remote image 
    case 'check-wa-image':
      $this->check_wa_image();
      break;
    case 'wa-image':
      $this->wa_image();
      break;      
    // end api for nodejs to get remote image 

    default:
      parent::doAjax($action);
    }
  }

  // dig an image
  function wayixia() {
    $theApp = &$this->App();
    $user_key = $theApp->get_user_info('user-key');
    $uid = $theApp->get_user_info('uid');
    if(!$user_key || empty($user_key)) {
      $this->AjaxHeader(-2); // not login
      $this->AjaxData('you must login!');
      return;
    }
  
    $pins_id = intval($_GET['id'], 10);
    
    $db = $this->App()->db();
    $sql = "select * from ##__users_images where id={$pins_id} limit 0,1;";
    $row = $db->get_row($sql);
    if(empty($row)) {
      $this->errmsg('图片已经被删除或者不存在!');
      return;
    }

    $sql_c = "select I.id ";
    $sql_c .= "from ##__users_images I, ##__users_albums A ";
    $sql_c .= "where (A.id=I.album_id or I.album_id=-{$uid}) and A.uid=$uid and (I.from_id={$pins_id} or I.id={$pins_id}) ";
    $sql_c .= "limit 0,1;";
    $check_row = $db->get_row($sql_c);
    if(!empty($check_row)) {
      $this->errmsg('这张图片您已经挖过了哦!');
      return;
    }

    // remote auto key
    unset($row['id']);
    unset($row['create_date']);
    
    $row['from_id'] = $pins_id;
    $row['album_id'] = -$uid;
    
    $sql2 = $db->InsertSQL('users_images', $row);
    if(!$db->execute($sql2)) {
      $this->errmsg($db->get_error());
      return;
    }
  }

  // 检查资源是否存在
  function check_wa_image() {
    $theApp = &$this->App();
    $user_key = $theApp->get_user_info('user-key');
    $uid = $theApp->get_user_info('uid');
    if(!$user_key || empty($user_key)) {
      $this->AjaxHeader(-2); // not login
      $this->AjaxData('you must login!');
      return;
    }

    $db = &$this->App()->db();
    // Ajax 数据
    $data = $_POST['data'];
    $image_src  = $data['src'];
    $image_url = $data['url'];
    $image_title   = $data['title'];
    $album_id = intval($img['album_id'], 10);
    if($album_id <= 0) $album_id = -$uid;
    
    $res_id = 0;
    // 检查是否存在图片资源
    $sql_resource = "select id, file_type, file_name from ##__images_resource where `src`='{$image_src}' limit 0,1;";
    $resource = $db->get_row($sql_resource);
    if(empty($resource)) {
      // 不存在， 可以挖取图片
      $res_id = 0; 
    } else {
      $res_id = $resource['id']; 
      // 资源已经存在，检测来源网页是否重复
      $sql = "select I.id ";
      $sql.= "from ##__users_images I, ##__users_albums A ";
      $sql.= "where (I.album_id = A.id or I.album_id=-{$uid}) and I.res_id={$res_id} and I.from_url='{$image_url}' and A.uid={$uid} ";
      $sql.= "limit 0,1;";
      $image = $db->get_row($sql);
      if(empty($image)) {
        $result = $this->insert_image($res_id, $image_title, $album_id, $image_url);
        if($result !=0) {
          $this->errmsg("挖一下失败![imgcode: {$result}]");
          return;
	}
      } else {
        $this->AjaxHeader(-100);
	$this->AjaxData('已经挖过该图片了哦!');
	return;
      }
    }
    
    $this->AjaxData(array('res_id' => $res_id)); 
  }

  function wa_image() {
    $theApp = &$this->App();
    $user_key = $theApp->get_user_info('user-key');
    $uid = $theApp->get_user_info('uid');
    if(!$user_key || empty($user_key)) {
      $this->AjaxHeader(-2); // not login
      $this->AjaxData('you must login!');
      return;
    }

    $data = &$_POST['data'];
    // 图片 
    $img = &$data['img'];    
    $res_id = intval($data['res_id'], 10);
    $server = &$data['server'];
    if($res_id <= 0) {
      // have the resource
      $res_id = $this->insert_resource(
         $img['src'], $server, $uid, 
         $img['file_name'], $img['file_type'], $img['file_size'], 
	 $img['file_width'], $img['file_height']
      ); 
      if($res_id < 0) {
        $this->errmsg("挖一下失败![rescode: {$res_id}]");
        $this->AjaxExtra($data);
        return;
      } 
    }

    $album_id = intval($img['album_id'], 10);
    if($album_id <= 0) {
      $album_id = -$uid;
    }
    $result = $this->insert_image($res_id, $img['title'], $album_id, $img['from_url']);
    if($result !=0) {
      $this->errmsg("挖一下失败![imgcode: {$result}]");
      return;
    }
  }

  // functions
  function insert_image($res_id, $title, $album_id, $from_url) {
    $db = $this->App()->db();
    if($res_id <= 0) {
      return -1;
    }
    $url = parse_url($from_url);	  
    // insert into users_images
    $fields = array(
      'res_id'    => $res_id,
      'album_id'  => $album_id,
      'title'     => $title,
      'from_host' => $url['host'],
      'from_url'  => $from_url,
    );

    $sql = $db->insertSQL('users_images', $fields);
    $result = $db->execute($sql);

  
  }

  // insert into resource table
  function insert_resource($src, $server, $uid, $file_name, $file_type, $file_size, $file_width, $file_height) {
    $db = $this->App()->db();
    if(empty($src) || empty($server) || empty($uid)) {
      return -1;
    }
 
    if(empty($file_name) 
      // || empty($file_type) 
      || empty($file_size) 
      || empty($file_width) 
      || empty($file_height)) 
    {
      return -2;
    }

    $fields = array(
      'src'       => $src,
      'server'    => $server,
      'file_name' => $file_name,
      'file_type' => $file_type,
      'file_size' => $file_size,
      'width'     => $file_width,
      'height'    => $file_height,
      'creator_uid' => $uid
    );
    
      
    $sql = $db->insertSQL('images_resource', $fields);
    $result = $db->execute($sql);
    if(!$result) 
      return -1;

    return $db->get_insert_id();
  }

  function get_album_list() {
    $theApp = &$this->App();
    $user_key = $theApp->get_user_info('user-key');
    $user_id = $theApp->get_user_info('uid');
    // 重复登录
    if(!$user_key || empty($user_key)) {
      $this->AjaxHeader(-2); // 未登录
      $this->AjaxData('请先登录！');
      return;
    }

    // 获取画集列表
    $sql = $theApp->get_albums_sql($user_id);
    $db = &$this->App()->db();

    $rs = array();
    if(!$db->get_results($sql, $rs)) {
      trigger_error($db->get_error(), E_USER_ERROR);
      return;
    }

    $this->AjaxData($rs);
  }

  function get_album_image_list() {
    $theApp = &$this->App();
    $user_key = $theApp->get_user_info('user-key');
    $uid = $theApp->get_user_info('uid');
    // 重复登录
    if(!$user_key || empty($user_key)) {
      $this->AjaxHeader(-2); // 未登录
      $this->AjaxData('请先登录！');
      return;
    }
  
    $data = &$_POST['data'];
    if(!isset($data['id'])) {
      $this->AjaxData(array());
      return;
    }

    $album_id = intval($data['id'], 10);
    $db = &$this->App()->db();

    // 获取指定画集图像列表
    // images data
    $sql ="select R.server,R.file_name,R.file_type,R.file_size,R.width,R.height,
    I.id as id, I.album_id, I.from_host, I.title, I.agent, I.create_date ";
    $sql.=" from ##__users_images AS I, ##__images_resource AS R, ##__users_albums A ";
    $sql.=" where I.res_id=R.id and I.album_id={$album_id} and A.id=I.album_id and A.uid={$uid} ";
    $sql.=" order by I.id DESC";

    $rc4 = new Crypt_RC4();
    $rc4 -> setKey($this->Config('rc4key'));
    $images = array();
    $db->get_results($sql, $images);

    $len = count($images);
    for($i = 0; $i < $len; $i++)
      $images[$i]['sign'] = $rc4->encrypt($images[$i]['file_name']);

    $this->AjaxData($images);
  }

  // add album
  function add_album() {
    $theApp = &$this->App();
    $user_key = $theApp->get_user_info('user-key');
    $user_id = $theApp->get_user_info('uid');
    // 重复登录
    if(!$user_key || empty($user_key)) {
      $this->AjaxHeader(-2); // 未登录
      $this->AjaxData('请先登录！');
      return;
    }

    $data = &$_POST['data'];    
    $task_data = $data['task'];
    $album_name = $task_data['title'];
    if(empty($album_name)) {
      $this->errmsg('name is empty');
      return;
    }

    $db = $this->App()->db();
    $fields = array(
      'uid' => $user_id,
      'name' => $album_name,
      'classname' => $album_class,
      'description'=>$description,
    );
    $sql = $db->insertSQL('users_albums', $fields);
    $result = $db->execute($sql);
    if(!$result) 
      $this->errmsg($db->get_error());

    $this->AjaxData($db->get_insert_id());
  }
}  // class CLASS_MODULE_API

?>
