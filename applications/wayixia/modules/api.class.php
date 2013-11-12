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

  function preview() {
    // useralbums
    $sql = "SELECT id as value, albumname as text FROM  `##__users_albums`";
    $user_name = $this->App()->get_user_info('name');
    if(!empty($user_name)) {
      $sql .= " where `uname`='{$user_name}'";
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

  function xdm() {
    $t = new CLASS_TEMPLATES($this->App());
    $t->render('plugin.xdm');
  }

  function quick_get() {
    // 快速挖图
    
  }

  function add_image() {
    $client_data = &$_POST['data'];
    $img_info = &$client_data['img'];
    $this->add_image_($img_info);
  }

  function public_image() {
    $client_data = &$_POST['data'];
    $task = &$client_data['task'];
    if(empty($task)) {
      $this->errmsg('invalid task');
      return;
    }
    $img_info = $task['img'];
    $this->add_image_($img_info);
  }

  function add_image_($img_info) {
    // $_SESSION['user-key'];
    $theApp = &$this->App();
    $user_key = $theApp->get_user_info('user-key');
    // 重复登录
    if(!$user_key || empty($user_key)) {
      $this->AjaxHeader(-2); // 未登录
      $this->AjaxData('请先登录！');
      return;
    }

	$img_title = $img_info['title'];
	$page_url = $img_info['pageUrl'];
    $img_src = $img_info['srcUrl'];
	$img_width = intval($img_info['width'],10);
	$img_height = intval($img_info['height'],10);
	$album_id = $img_info['albumid'];
	//$from_protocol = $img_info['from_protocol'];
	//$from_domain = $img_info['from_domain'];
    //$from_page = $img_info['from_page'];
	if(!isset($img_info['albumid'])) {
	  // 待分类图
	  $album_id = 0;
	}

	// 解析url
	// $url = 'http://username:password@hostname/path?arg=value#anchor';
	$url = parse_url($page_url);
	$from_protocol = $url['scheme'];
	$user_info = '';
	if(isset($url['user'])) {
		$user_info .= $url['user'];
	}

	if(isset($url['pass'])) {
		$user_info .= ':'.$url['pass'];
	}
		
	$from_domain = $url['host'];
	if(isset($url['port'])) {
		$from_domain .= ':'.$url['port'];
	}

	if(!empty($user_info)) {
		$from_domain = $user_info.'@'.$from_domain;
	}

    $from_page = $url['path'];
	if(isset($url['query'])) { //.'?'.$url[''].$url['from_page'];
      $from_page .= '?'.$url['query'];
    }

	if(isset($url['fragment'])) {
		$from_page .= '#'.$url['fragment'];
	}

    //if(!is_int($img_width) || $img_width < 1 || $img_width > 5000 ) {
	//	$this->errmsg("image width(:$img_width) range(1-5000) is invalid.");
	//	return;
	//}

	//if(!is_int($img_height) || $img_height < 1 || $img_height > 5000 ) {
	//	$this->errmsg("image height(:$img_height) range(1-5000) is invalid.");
	//	return;
	//}

	$db = &$this->App()->db();
	// check image exists
	$sql_check_image_exists = "select src, id from ##__images_resource where `src`='{$img_src}' limit 0,1;";

	$img = $db->get_row($sql_check_image_exists);
	$resource_id = 0;
	// images_resource
	if(empty($img)) {
		// get remote image
      $save_path = _IPATH.$this->Config('site.images_dir');
      createfolders(_BIND_ROOT.$save_path);
      $file_name = $this->uuid();
      $image_data;
      $result_code = $this->get_remote_image(
      $img_src, $img_info['cookie'], $img_info['referrer'], $image_data);

      if(0 != $result_code) {	  
        $this->errmsg('get image error, code:'.$result_code);
        return;
      }
    
      // write image to disk
      $cache_url = $save_path.'/'.$file_name;
      $f = @fopen(_BIND_ROOT.$cache_url,'wb+');
      if(!$f){
        $this->errmsg('server error, save file error!');
        return;
      }
      $fw = @fwrite($f, $image_data);
      @fclose($f);
			// save thumb
			$thumb_path = $this->Config('site.thumb_images_dir');
			createfolders(_BIND_ROOT.$thumb_path);
      // create thumb folders if not exists
			$thumb_image =  new SimpleImage;
      $thumb_image->load(_BIND_ROOT.$cache_url);
      $img_width = $thumb_image->getWidth();
      $img_height = $thumb_image->getHeight();
	  $thumb_image->resizeToWidth(192);
	  $thumb_image->save(_BIND_ROOT.$thumb_path.'/'.$file_name);

	  // insert into resource table
	  $fields = array(
				'src' => $img_src,
				'file_name' => $file_name,
				'width' => $img_width,
				'height' => $img_height,
				'uname' => $theApp->get_user_info('name')
	  );

	  $sql = $db->insertSQL('images_resource', $fields);
	  $result = $db->execute($sql);
      $resource_id = $db->get_insert_id();

	  if(!$result) 
	    $this->errmsg($db->get_error());
	  } else {
		$resource_id = $img['id'];
		$sql_check_duplicate = "select resource_id from ##__users_images where resource_id = '{$resource_id}' and `from_protocol`='{$from_protocol}' and `from_domain`='{$from_domain}' and `from_page`='{$from_page}' limit 0,1;";

		$result = $db->get_row($sql_check_duplicate);
		if(!empty($result)) {
		  $this->errmsg('该图片已经挖过了，不需要重复挖.');
			return;
		}		
	  }

	  // users_images
	  $fields = array(
		'resource_id' => $resource_id,
		'album_id' => $album_id,
		'uname' => $theApp->get_user_info('name'),
		'title' => $img_title,
        'from_protocol' => $from_protocol,
		'from_domain' => $from_domain,
		'from_page' => $from_page,
      );

	  $sql = $db->insertSQL('users_images', $fields);
	  $result = $db->execute($sql);
      if(!$result) {
	    $this->errmsg($db->get_error());
	  }
    
	// get nid to notify client
	$user_id = $theApp->get_user_info('uid');
	$get_nid_sql = "select `nid` from ##__login_users where `uid`={$user_id} and `endpoint`='client' limit 0, 1;";

	$login_info = $db->get_row($get_nid_sql);
    if(empty($login_info) || empty($login_info['nid'])) {
	  // no nid found
	} else {
	  $params = array('imgid' => $resource_id);
	  $this->notify($login_info['nid'], $params);
	}
  }

  function uuid() {
    return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),
        mt_rand( 0, 0x0fff ) | 0x4000,
        mt_rand( 0, 0x3fff ) | 0x8000,
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ) );
  }

  function get_remote_image($url, $cookie, $referer, &$output) {
    //$ran = rand(1, 255);
    //$ran1 = rand(1, 255);
    //$ran2 = rand(1, 255);
    //$ran3 = rand(60, 255);
    //$ran3 = str_replace(array('192', '172', '127'), '', $ran3);
    //$ip = "$ran3.$ran2.$ran1.$ran";
    //$headerArr = array("CLIENT-IP:$ip", "X-FORWARDED-FOR:$ip");
    //$cookieJar = tempnam(_IROOT . './cookie', 'cookie.txt');
	$user_agent = $_SERVER["HTTP_USER_AGENT"];
	// "Mozilla/5.0 (Windows; U; Windows NT 5.1; zh-CN; rv:1.9.2.8) Gecko/20100722 Firefox/3.6.8"
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

    //curl_setopt($curl, CURLOPT_COOKIEJAR, $cookieJar);//curl_setopt($curl, CURLOPT_COOKIEFILE, $cookieJar);
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
    $user_name = $theApp->get_user_info('name');
    // 重复登录
    if(!$user_key || empty($user_key)) {
      $this->AjaxHeader(-2); // 未登录
      $this->AjaxData('请先登录！');
      return;
    }

    // 获取画集列表
    $sql = $theApp->get_albums_sql($user_name);
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
    $user_name = $theApp->get_user_info('name');
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

    $thumbdir = "http://".$_SERVER['SERVER_NAME'].$this->Config("site.thumb_images_dir");
    $imagedir ="http://".$_SERVER['SERVER_NAME'].$this->Config("site.images_dir");
    $db = &$this->App()->db();

    // 获取指定画集图像列表
    // images data
    $sql = "select R.file_name, R.file_size, R.file_type, R.width, R.height, U.id as id, U.from_domain, U.title, U.agent, U.create_date from ##__images_resource AS R, ##__users_images AS U where U.resource_id=R.id and U.album_id='{$album_id}' and U.uname='{$user_name}'  order by U.id DESC";

    // $this->errmsg($sql);
    // return;
    $images = array();
    $db->get_results($sql, $images);
    $this->AjaxData($images);
	  $this->AjaxExtra(array(
      'imagedir' => $imagedir,
      'thumbdir' => $thumbdir
	  ));
  }

  // add album
  function add_album() {
    $theApp = &$this->App();
    $user_key = $theApp->get_user_info('user-key');
    $user_name = $theApp->get_user_info('name');
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
				'uname' => $user_name,
				'albumname' => $album_name,
				'classname' => $album_class,
				'description'=>$description,
		);
		$sql = $db->insertSQL('users_albums', $fields);
    
    $result = $db->execute($sql);
    if(!$result) 
      $this->errmsg($db->get_error());

    $this->AjaxData($db->get_insert_id());
  }

  function notify($nid, $params) {
    $rpc_client = new QRPC("wayixia.com", 5555);
	$data = array('nid'=>$nid);
	$data['params'] = $params;
    $res = $rpc_client->call('qnotify_service', 'call', $data);
    //print_r($res);
    //$body = $res->body();
    //echo "$p0+$p1=".$body['data'];

  }
}

?>
