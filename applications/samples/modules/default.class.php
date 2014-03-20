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
    $this->index();
  }

  function doAjax($action) {
    // ajax data
    $ajax_data = &$this->request['data'];

    // ajax action
    switch($action) {
    case 'action1':
      $this->AjaxData('your ajax request is ok.');
      break;
    }
  }

  function index() {
    try {
      $t = new CLASS_TEMPLATES($this->App());
      $t->load('index');
      $t->push('test_select', 3);
      //$tag = $t->tag('test_select');

      //$sql="SELECT  `uname` as value ,  `email` as text FROM  `dede_member` where `email` !='' ";
      #$sql = "select `id` as text, `url` as value from c_table_3";
      //$this->App()->db()->get_results($sql, $rs);

      // array data
      $mydata = array(
        array('value'=>'v1', 'text'=>'text1', ),
        array('value'=>'v2', 'text'=>'text2', ),
        array('value'=>'v3', 'text'=>'text3', ),
        array('value'=>'v4', 'text'=>'text4', ),
      );
      $t->push_data('mydata', $mydata);
      $t->display();
    } catch(Exception $e) {
      print_r($e);
    }
  }
  function getfile($url){
    $content = file_get_contents($url);
    if(FALSE == $content) {
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
