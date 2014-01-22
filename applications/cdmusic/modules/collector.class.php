<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_MODULE_COLLECTOR extends CLASS_MODULE {

  public function __construct() {
      parent::__construct();
  }

  public function CLASS_MODULE_COLLECTOR() { 
      $this->__construct(); 
  }

    //  不支持UI界面，只支持ajax请求
  function doAjax($action) {
    // ajax data
    $data = &$this->request['data'];

    // ajax action
    switch($action) {
    case 'song':
      $result = $this->song();
      $this->AjaxData($result);
      break;
    case 'artist':
      $this->artist();
      break;
    case 'album':
      $result = $this->search();
      $this->AjaxData($result);

    case 'lrc':
      $this->getlrc();   
      break;   
    default:
      parent::doAjax($action);      
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

  function song() {
    /*
  <ul class="base-info c6">
    <li>歌手：  
      <span class="author_list" title="凤凰传奇">
      <a hidefocus="true" href="/artist/1490">凤凰传奇</a>  </span>          
    </li>
    <li class="clearfix">所属专辑：<a href="/album/10547618">《我从草原来》</a>
    </li>
    <li>
      发行时间：2010-09-30
    </li>
    <li>
      所属公司：孔雀唱片<br>
    </li>
    <li class="clearfix tag">
      <span class="label">歌曲标签：</span><a class="tag-list" href="/search/tag?key=%E6%B5%81%E8%A1%8C">流行</a><i class="module-line"></i><a class="tag-list" href="/search/tag?key=%E4%B8%AD%E5%9B%BD%E9%A3%8E">中国风</a><i class="module-line"></i><a class="tag-list" href="/search/tag?key=%E7%BD%91%E7%BB%9C%E6%AD%8C%E6%9B%B2">网络歌曲</a><i class="module-line"></i><a class="tag-list" href="/search/tag?key=%E5%8D%8E%E8%AF%AD%E6%B5%81%E8%A1%8C">华语流行</a>        
    </li>  
  </ul>
  */
        
        $result = array();
        $urltop="http://music.baidu.com/song/5966719";
        $input=file_get_contents($urltop);
    //echo $input;
    $reg = "/<ul class=\"base\-info c6\">(.*?)<\/ul>/isS";
    preg_match_all($reg, ($input), $r);
    if(count($r)>1 && count($r[1]) > 0) {
      $str_data = $r[1][0];

      // 获取专辑和歌手id
      preg_match_all("/\"\/(artist|album)\/([0-9]+)\"/isS", $str_data, $rr_artist_album);
    
      print_r($rr_artist_album);
      $artist_id = 0;
      $album_id = 0;
      if(count($rr_artist_album) >= 3) {
        $artist_id = $rr_artist_album[2][0];
        $album_id = $rr_artist_album[2][1];
      }

      echo "\r\nartist-id : ". $artist_id;
      echo "\r\nalbum-id : ". $album_id;
      //echo $datastr;

      $reg_data = "/<li(\s+\w+=\".*?\"\s*)?>(.+?)<\/li>/isS";
      preg_match_all($reg_data, $str_data, $rr);

      //print_r($rr);
      // 分析数据
      $list_data = $rr[2];
      $list_len = count($list_data);
      for($i=0; $i < $list_len; $i++) {
        $s = trim(preg_replace("/(<[^>]+>)|(\s+)/isS", "", $list_data[$i]));
        echo "\r\n".$s;
      }

      echo "\r\n";
    }

    return $result;
  }

  function artist() {
    $id = intval($_GET['id'], 10);
    $artist_map = array(
    'http://music.baidu.com/artist/cn/male',
    'http://music.baidu.com/artist/cn/female',
    'http://music.baidu.com/artist/cn/group',
    'http://music.baidu.com/artist/jpkr/male',
    'http://music.baidu.com/artist/jpkr/female',
    'http://music.baidu.com/artist/jpkr/group',
    'http://music.baidu.com/artist/western/male',
    'http://music.baidu.com/artist/western/female',
    'http://music.baidu.com/artist/western/group',
    'http://music.baidu.com/artist/other',
    );
    if($id<1 || $id>count($artist_map)) {
      $this->errmsg('无效的id参数.');
      return;
    }

    $result = array();
        $urltop = $artist_map[$id-1];
        $input  = file_get_contents($urltop);
    //echo $input;
    $reg    = "/<a href=\"\/artist\/([0-9]+)\"(\s+\w+=\".+?\")*\s*>(.+?)<\/a>/isS";
    preg_match_all($reg, ($input), $r);
    //print_r($r);

    $arrName = &$r[2];
        $len = count($arrName);
        for($i=0; $i<$len;$i++) {
            //$name = $r[2][$i];
        // get full name
        // preg_match_all("/title\s*=\s*\"([^\"]*)\"/isS", $a[0][$i], $out);
        preg_match_all("/title\s*=\s*(['\"]?)([^'\"]+?)\\1/isS", $r[0][$i], $out);
        //print_r($out);   
        $name = $out[2][0];
          //printf($name."\n");
          array_push($result, $name);
        }

    $this->AjaxData($result);
  }

  function baidu_songurl() {
    $song_name = urlencode(utf2gbk($_GET['w']));
    $url = "http://box.zhangmen.baidu.com/x?op=12&count=1&mtype=2&title={$song_name}$$$&url=&listenreelect=0&.r=0.5733585120495725";
    
    $input=file_get_contents($urltop);

    echo $input;
    return ($input);
  }

  function songurl() {
    $song_name = urlencode(utf2gbk($_GET['w']));

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
    return $result;
  }

  function getlrc() {
    $name = urlencode($_GET['name']);
    $singer = urlencode($_GET['singer']);
    $lrc =  "http://box.zhangmen.baidu.com/x?op=12&count=1&title={$name}$${$singer}$$$$";
    $request_buffer = file_get_contents($lrc);
    $parse = new DomDocument;
     
  }
}

?>
