<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_MODULE_DEFAULT extends CLASS_MODULE {

    public function __construct() {
        parent::__construct();
    }

    public function CLASS_MODULE_DEFAULT() {
        $this->__construct(); 
    }

    function doMain($action) {
      switch( $action) {
      case 'execute-tasks':
        $this->execute_tasks();
        break;
      default:
        $this->index();
      }
    }

    function doAjax($action) {
    // ajax action
      switch($action) {
      case 'getlist':
        $this->getlist();
        break;

      case 'get-zol-images-list':
        $this->get_zol_images_list();
        break;

      case 'get-image-url':
        $this->get_image_url();
        break;

      case 'public-album':
        $this->public_album();
        break;

      default:
        parent::doAjax($action);
      }
    }

    function index() {
        try {
           $t = new CLASS_TEMPLATES($this->App());
           $t->render('index');
        } catch(Exception $e) {
           print_r($e);
        }
    }

    function getlist() {
      $data = &$_POST['data'];
      $url = $data['url'];
      $content = gbk2utf($this->getfile($url));
      $pattern = <<<STR
/<a class="pic" href="([^\"]*?)" target="_blank" hidefocus="true"><img alt="" src="([^\"]*?)" width="208px" height="130px" title = "([^\"]*?)"\/>/
STR;
      $a = parse_url($url);
      preg_match_all($pattern, $content, $matches);
      $db = $this->App()->db();
      $len = count($matches[0]);
      for($i=0; $i < $len; $i++ ) {
        $from_url = $a['scheme']."://".$a['host'].$matches[1][$i];
        $fields = array(
          'from_url'=> $from_url,
          'album_url'=>$matches[2][$i],
          'title'=>$matches[3][$i],
        );
        $sql = $db->insertSQL('album_urls', $fields)." ON DUPLICATE KEY UPDATE from_url=VALUES(from_url)";
        $result = $db->execute($sql);

        if(!$result) {
          $this->errmsg($sql."\n".$db->get_error());
          return;
        }
      }

      $this->AjaxData($len);
    }

	function get_zol_images_list() {
	  $data = &$_POST['data'];
      $url = $data['url'];
      $content = gbk2utf($this->getfile($url));
      $pattern = <<<STR
/<li id="img\d*" class="[^\"]+?"><a href="([^\"]+?)">/
STR;
      $a = parse_url($url);
      preg_match_all($pattern, $content, $matches);
      
      $db = $this->App()->db();
	  $len = count($matches[0]);
	  $arr = array();
      for($i=0; $i < $len; $i++ ) {
        $from_url = $a['scheme']."://".$a['host'].$matches[1][$i];
        $fields = array(
          'from_url'=> $from_url,
        );
        array_push($arr, $from_url);
      }
	  $s = json_encode($arr);
	  $this->AjaxData($arr);
	}

	function get_image_url(){
    $db = $this->App()->db();
	  $data = &$_POST['data'];
	  $urls = $data['urls'];
    $from_url = $data['from_url'];
    $task_id = $this->get_task_id($from_url);
    if($task_id <= 0) {
      $this->errmsg('task'.$from_url.'is error or not exist');
      return;
    }

    $result = array();
	  for($i=0; $i<count($urls); $i++) {
		  $content = gbk2utf($this->getfile($urls[$i]));
		  $pattern = <<<STR
/<img id="bigImg" src="([^\"]+?)" srcs="[^\"]+?" width="960" height="600" alt="">/
STR;
		  preg_match_all($pattern, $content, $matches);
		  $src = $matches[1][0];

      $pattern3 = <<<STR2
/<dd id="tagfbl">\s*<a target="_blank" id="([^\"]+?)" href="([^\"]+?)">\\1<\/a>/
STR2;
		  preg_match_all($pattern3, $content, $matches2);
      //print_r($matches2);
		  $src = str_replace("960x600", $matches2[1][0], $src);
      $a = parse_url($urls[$i]);
      $from = $a['scheme']."://".$a['host'].$matches2[2][0];

		  $pattern2 = <<<STR
/<title>(.*)<\/title>/
STR;
      // title
      preg_match_all($pattern2, $content, $matches);
      $title = $matches[1][0];

      // 写入待发布数据记录
      // record
      $fields = array('imgSrc'=>$src, 'pageUrl'=>$from, 'title'=>$title, 'task_id' => $task_id);

      $sql = $db->insertSQL('prepublic_images', $fields)." ON DUPLICATE KEY UPDATE task_id=VALUES(task_id),title=VALUES(title)";
      $r = $db->execute($sql);

      if(!$r) {
        $this->errmsg($sql."\n".$db->get_error());
        return;
      }

      array_push($result, $fields);
	  }

	  $this->AjaxData($result);
	}

  function get_task_id($url) {
    $db = $this->App()->db();
    $record = $db->get_row("select id from ##__album_urls where `from_url`='{$url}' limit 0,1;");
    if(empty($record)) 
      return 0;

    return $record['id'];
  }

  function public_album() {
    $data = &$_POST['data'];
    $task_data = $data['task'];
    $album_id = intval($task_data['public_id']);
    $task_id = intval($task_data['id']);
    if($album_id <= 0 || $task_id <= 0) {
      $this->errmsg('invalid id or public_id '.json_encode($task_data));
      return;
    }
    
    $sql = "update ##__album_urls set `public_id`='{$album_id}' where `id`='{$task_id}';";
    $this->App()->db()->execute($sql);
  }

  function getfile($url){
		$content = file_get_contents($url);
		if(FALSE == $content){
			if (function_exists('curl_init')) {
				$curl = curl_init();
				curl_setopt($curl, CURLOPT_URL, $url);
				curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (X11; U; Linux i686; zh-CN; rv:1.9.1.2) Gecko/20090729 Firefox/3.5.2 GTB5');
				curl_setopt($curl, CURLOPT_HEADER, 0);
				curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
				$tmpInfo = curl_exec($curl);
				curl_close($curl);
				if(FALSE !== stristr($tmpInfo,"HTTP/1.1 200 OK")){ //正确返回数据
					return $tmpInfo;
				}else{
					return FALSE;
				}
			}else{
				// Non-CURL based version...
				 /*
				  $context =
					array('http' =>
						  array('method' => 'GET',
								'header' => 'Content-type: application/x-www-form-urlencoded'."\r\n".
											'User-Agent: Mozilla/5.0 (X11; U; Linux i686; zh-CN; rv:1.9.1.2) Gecko/20090729 Firefox/3.5.2 GTB5'."\r\n".
											'Content-length: 0'),
								'content' => ""));
				  $contextid=stream_context_create($context);
				  $sock=fopen($url, 'r', false, $contextid);
				  if ($sock) {
					$tmpInfo='';
					while (!feof($sock))
					  $tmpInfo.=fgets($sock, 4096);

					fclose($sock);
					return $tmpInfo;
				  }else{
					return FALSE;
				  }*/
				  return false;
			}
		}else{
			return $content;
		}
	}
}

?>
