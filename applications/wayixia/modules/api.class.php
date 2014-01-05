<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_MODULE_API extends CLASS_MODULE {

  public function __construct() {
    parent::__construct();
  }

  public function CLASS_MODULE_API() { $this->__construct(); }
  
  function doAjax($action) {
    switch($action) {
    case 'wayixia':
      $this->wayixia();
      break;
    case 'wa-image':
      $this->wa_image();
      break;
    case 'wa':
      $this->add_image();
      break;
    case 'public-wa':
      $this->public_image();
      break;
    case 'get-album-list':
      $this->get_album_list();
      break;
    case 'get-album-image-list':
      $this->get_album_image_list();
      break;
    
    // 发布接口
    case 'add-album':
      $this->add_album();
      break;

    default:
      parent::doAjax($action);
    }
  }
  
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

    $sql_check_from_id = "select id from ##__users_images where from_id={$pins_id} limit 0,1;";
    $check_row = $db->get_row($sql_check_from_id);
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

  function wa_image() {
    // this api is use for localhost request
    // check ip
    $server_ip = $_SERVER['SERVER_ADDR'];
    $remote_ip = getip();
    if($server_ip != $remote_ip) {
      $this->errmsg("invalid access");
      return;
    }
    $task = &$_POST['data'];
    $img  = &$task['img'];
    $result = $this->add_image_($img);    
    $this->AjaxData($result);
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

  function add_image() {
    $theApp = &$this->App();
    $user_key = $theApp->get_user_info('user-key');
    $uid = $theApp->get_user_info('uid');
    if(!$user_key || empty($user_key)) {
      $this->AjaxHeader(-2); // not login
      $this->AjaxData('you must login!');
      return;
    }
    
    $client_data = &$_POST['data'];
    $img_info = &$client_data['img'];
    $res = $this->add_image_($uid, $img_info);
    $result = $res['result'];
    if($result != 0) {
      $this->errmsg($res['msg']);
      return;
    }
  }

  function public_image() {
    $theApp = &$this->App();
    $user_key = $theApp->get_user_info('user-key');
    $uid = $theApp->get_user_info('uid');
    if(!$user_key || empty($user_key)) {
      $this->AjaxHeader(-2); // not login
      $this->AjaxData('you must login!');
      return;
    }
    $client_data = &$_POST['data'];
    $task = &$client_data['task'];
    if(empty($task)) {
      $this->errmsg('invalid task');
      return;
    }
    $img_info = $task['img'];
    $res = $this->add_image_($uid, $img_info);
    $result = $res['result'];
    if($result != 0) {
      $this->errmsg($res['msg']);
      return;
    } }

  function add_image_($uid, $img_info) {
    $img_src   = $img_info['srcUrl'];
    $album_id  = -$uid; // 待分类图
    $page_url  = $img_info['pageUrl'];  
    $img_title = $img_info['title'];

    if(isset($img_info['albumid'])) {
      if($theApp->album_is_valid($img_info['albumid'])) {
        $album_id = intval($img_info['albumid'], 10); 
      }   
    }

    //if(!is_int($img_width) || $img_width < 1 || $img_width > 5000 ) {
    //  $this->errmsg("image width(:$img_width) range(1-5000) is invalid.");
    //  return;
    //}

    //if(!is_int($img_height) || $img_height < 1 || $img_height > 5000 ) {
    //  $this->errmsg("image height(:$img_height) range(1-5000) is invalid.");
    //  return;
    //}

    $url = parse_url($page_url);
    $from_host = $url['host'];

    $db = &$this->App()->db();
    $res_id = 0;
    $file_name = '';
    $file_type = '.jpg';
    // according to resources library check image resource exists
    $img_res = $db->get_row("select id, file_type, file_name from ##__images_resource where `src`='{$img_src}' limit 0,1;");

    // images_resource
    if(empty($img_res)) {
      $file_name = $this->uuid();
      /*
      // get remote image
      $result_code = $this->get_remote_image
        ($img_src, $img_info['cookie'] , $img_info['referrer'], $image_data); 

      if(0 != $result_code) {    
        $this->errmsg('get image error, code:'.$result_code);
        return;
      }

      // write image to disk
      if(!$this->save_image_($file_name, $image_data)){
        $this->errmsg('server error, save file error!');
        return;
      }

      // save thumb      
      $info = $this->save_thumb_($file_name);
      $img_width = $info['width'];
      $img_height = $info['height'];
      $file_type = $info['type'];
      */

      /*
      if($info['size'] > (10 * 1024 * 1024) {
        $this->AjaxHeader(-101);
        $this->AjaxData('file is to large, not supported, (0M-10M).');
        return;
      }
      */

      // insert into resource table
      $fields = array(
          'src' => $img_src,
          'server' => $_SERVER['SERVER_NAME'],
          'file_name' => $file_name,
          'file_type' => $file_type,
          'file_size' => $info['size'],
          'width' => $img_width,
          'height' => $img_height,
          'creator_uid' => $uid
      );

      $sql = $db->insertSQL('images_resource', $fields);
      $result = $db->execute($sql);
      $res_id = $db->get_insert_id();

      if(!$result) {
        $this->errmsg($db->get_error());
        return;
      }
    } else {
      $file_name = $img_res['file_name'];
      $file_type = $img_res['file_type'];
      $res_id = $img_res['id'];
      $sql_check_duplicate = 
        "select res_id from ##__users_images where res_id = {$res_id} and `from_host`='{$from_host}' limit 0,1;";

      $result = $db->get_row($sql_check_duplicate);
      if(!empty($result)) {
        $this->AjaxHeader(-100);
        $this->AjaxData('该图片已经挖过了，不需要重复挖.');
        return;
      }    
    }

    // insert into users_images
    $fields = array(
      'res_id'    => $res_id,
      'album_id'  => $album_id,
      'title'     => $img_title,
      'from_host' => $from_host,
      'from_url'  => $page_url,
    );

    $sql = $db->insertSQL('users_images', $fields);
    $result = $db->execute($sql);
    if(!$result) {
      $this->errmsg($db->get_error());
      return;
    }

    /* 
     * disable notify to client
     
    $id = $db->get_insert_id();
    // get nid to notify client
    $rc4 = new Crypt_RC4();
    $rc4 -> setKey($this->Config('rc4key'));
    $params = array(
        'id' => $id,
        'album_id' => $album_id,        
        'file_name' => $file_name,
        'file_type' => $file_type,        
        'server'=> $_SERVER['SERVER_NAME'],
        'sign' => $rc4->encrypt($file_name), 
    );

    $this->App()->notify('image_new', $params);
    */
  }

  function save_image_($file_name, $image_data) {
    $save_file = $this->App()->get_images_dir().'/'.$file_name;
    $f = @fopen($save_file,'wb+');
    if(!$f){
      return false;
    }
    $fw = @fwrite($f, $image_data);
    @fclose($f);

    return true;
  }

  function save_thumb_($file_name) {
    $image_file = $this->App()->get_images_dir().'/'.$file_name;

    $orginal_image =  new SimpleImage;
    $orginal_image->load($image_file);
    $img_width = $orginal_image->getWidth();
    $img_height = $orginal_image->getHeight();
    $img_mime = $orginal_image->getMime();
    $img_size = filesize($image_file);
    $orginal_image->resizeToWidth(192);
    $orginal_image->save($this->App()->get_thumbs_dir().'/'.$file_name);

    return array('width' => $img_width, 
      'height' => $img_height, 
      'type'   => '.'.str_replace('image/', '', $img_mime),
      'size'   => $img_size,
    );
  }

  function uuid() {
    return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),
        mt_rand( 0, 0x0fff ) | 0x4000,
        mt_rand( 0, 0x3fff ) | 0x8000,
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ) );
  }

  function get_remote_image($url, $cookie, $referer, &$output) {
    //$ip = "$ran3.$ran2.$ran1.$ran";
    //$headerArr = array("CLIENT-IP:$ip", "X-FORWARDED-FOR:$ip");
    //$cookieJar = tempnam(_IROOT . './cookie', 'cookie.txt');
    $user_agent = $_SERVER["HTTP_USER_AGENT"];
    // "Mozilla/5.0 (Windows; U; Windows NT 5.1; zh-CN; rv:1.9.2.8) 
    // Gecko/20100722 Firefox/3.6.8"
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'GET');
    curl_setopt($curl, CURLOPT_FAILONERROR, TRUE);
    //curl_setopt($curl, CURLOPT_HTTPHEADER , $headerArr);  //构造IP

    curl_setopt($curl, CURLOPT_USERAGENT, $user_agent);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($curl, CURLOPT_TIMEOUT, 60);   //设定最大访问耗时
    curl_setopt($curl, CURLOPT_FOLLOWLOCATION, TRUE);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);

    if(!empty($cookie))
      curl_setopt($curl, CURLOPT_COOKIE , $cookie);
    if(!empty($referer))
      curl_setopt ($curl, CURLOPT_REFERER, $referer);   //构造来路

    //curl_setopt($curl, CURLOPT_COOKIEJAR, $cookieJar);
    //curl_setopt($curl, CURLOPT_COOKIEFILE, $cookieJar);
    //if ($method == 'post') {
    //  curl_setopt($curl, CURLOPT_POST, 1);
    //  curl_setopt($curl, CURLOPT_POSTFIELDS,$post);
    //}
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false); 
    $output = curl_exec($curl);
    $error_code = 0;
    if(!$output) {
      $output = '';
      $error_code = curl_errno($curl);
    }
    
    curl_close($curl);
    unset($curl);
    return $error_code;
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

}

?>
