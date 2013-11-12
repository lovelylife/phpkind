<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_MODULE_SERVICE extends CLASS_MODULE {

    public function __construct() {
	    parent::__construct();
    }

    public function CLASS_MODULE_SERVICE() { 
	    $this->__construct(); 
	}

    //  不支持UI界面，只支持ajax请求
    function doAjax($action) {
		// ajax data
		$data = &$_POST['data'];

		// ajax action
		switch($action) {
		case 'top100':
			$result = $this->top100();
			$this->AjaxData($result);
			break;
		case 'songurl':
			$result = $this->songurl();
			$this->AjaxData($result);
			break;
		case 'search':
			$result = $this->search();
			$this->AjaxData($result);
		default:
			$this->errmsg('unsupported action.');       
        }
    }

    function index() {
        //! 启动默认首页
        try {
            $t = new CLASS_TEMPLATES($this->App());
            $t->render('index');
        } catch(Exception $e) {
           print_r($e);
        }
    }

    function top100() {
        $result = array();
        $urltop="http://list.mp3.baidu.com/top/top100.html";
        $input=file_get_contents($urltop);
        preg_match_all("/<a class=\"play(\s+bold)?\".+?>(.*?)<\/a>/isS",gbk2utf($input),$a);
	    //print_r($a);
        $arrName = &$a[2];
        $len = count($arrName);
        for($i=0; $i<$len;$i++) {
            $name = $a[2][$i];
            if(strlen($name) >= 3 && substr($name, strlen($name)-3, 3) == "...") {
                //echo $name."\n";  
		        // get full name
		        // preg_match_all("/title\s*=\s*\"([^\"]*)\"/isS", $a[0][$i], $out);
		        preg_match_all("/title\s*=\s*('|\")([^'\"]*)/isS", $a[0][$i], $out);
		        //print_r($out);   
		        $name = $out[2][0];
	        }
	        // printf($name."\n");
	        array_push($result, $name);
        }

        return $result;
    }

	function baidu_songurl() {
		$song_name = urlencode(utf2gbk($_GET['w']));
		$url = "http://box.zhangmen.baidu.com/x?op=12&count=1&mtype=2&title={$song_name}$$$&url=&listenreelect=0&.r=0.5733585120495725";
		
		$input=file_get_contents($urltop);

		echo $input;
		return ($input);
	}

    function songurl() {
		$song_name = urlencode(utf2gbk($_GET['name']));

        $result = array();
        $urltop="http://cgi.music.soso.com/fcgi-bin/m.q?w=$song_name&source=1&t=0";
		//echo $song_name."\r\n";
		//echo $urltop;
        $input=file_get_contents($urltop);
		$input = gbk2utf($input);
		//echo $input;
        preg_match_all('/<td class="data">(.*?)<\/td>/isS', $input, $a);
	    //print_r($a);
        $arrName = &$a[1];
        $len = count($arrName);
		
        for($i=0; $i<$len;$i++) {
			$array_item = array();
            $item = $arrName[$i];
	        $out = split("[@]", $item);
			if(empty($out)) {
				continue;
			}

			$array_urls = array();
			$array_item['songname'] = $out[2];
			$array_item['thumb'] = $out[4];
			$array_item['artist'] = $out[6];

		    //print_r($out); 
			$url_string = $out[16];
			//preg_match_all('/[^\|]*\|{1,2}|/isS', $url_string, $urls);
			$urls = split('[|;]', $url_string);
			//print_r($urls);
			foreach($urls as $key => $url) {
				//echo $key;
				if(!empty($url)) {
					$pos = strpos($url, "://");
					//echo $url.":".$pos."\r\n\r\n";
					if($pos) {
						if($url[1] == 'I') {
							array_push($array_urls, substr($url, 2, strlen($url)-2));
						} else {
							array_push($array_urls, $url);
						}
					}
				}
			}
			$array_item['urls'] = $array_urls;
			//print_r($array_item);
	        array_push($result, $array_item);
        }
		//print_r($result);
        return $result;
    }
}

?>
