<?php
if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class hash_decrpt {
  static $hash_table = array();

  function decode($encode_buffer) {
    $decode_buffer;
    
  }

  function encode($decode_buffer) {
    $encode_buffer;
  }
}

function myxor($string, $key = '') {
 if('' == $string) return '';
 if('' == $key) $key = 'dfsfasfasjhk';
 $len1 = strlen($string);
 $len2 = strlen($key);
 if($len1 > $len2) $key = str_repeat($key, ceil($len1 / $len2));
 return $string ^ $key;
}

class CLASS_MODULE_DIMG extends CLASS_MODULE {

  

  public function __construct() {  parent::__construct(); }
  public function CLASS_MODULE_DIMG() { $this->__construct(); }
  
  function doMain($action) {
    
    /*
    $s = '007022b0-c338-4e92-b460-e47421d34f70';
    $s = str_replace('-', '', $s);
    $se = 'f0b44536784158fb6c7b8e3b9673098a9ece661a56bdf3775cbe85f5c4eca36e9306a59b';
    $rc4 = new Crypt_RC4();
    $rc4 -> setKey($this->Config('rc4key'));
    echo $x = $rc4->encrypt($s);
    echo '<br />';
    echo $rc4->decrypt( $x) ;
    return;
    */
    
    $this->sign();
  }

  function sign() {
    $sign = $_GET['sign'];
    $rc4 = new Crypt_RC4();
    $rc4 -> setKey($this->Config('rc4key'));
    $sign_decode = $rc4->decrypt( $sign ) ;

    $image_dir = _IPATH.$this->Config('site.images_dir');
    $img_path = _BIND_ROOT. $image_dir. '/' . $sign_decode;
	$info = getimagesize($img_path);

	header('Content-Type: '. $info['mime']);
	header('Content-Length: '.filesize($img_path));
	echo file_get_contents($img_path);
	ob_clean();
	flush();
  }
}

?>