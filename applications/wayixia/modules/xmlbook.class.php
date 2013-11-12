<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class xmlbook {
  // members
  var $file_name_ = '';
  var $xml_document = null;

  // constructors
  function __construct() { }
  function xmlbook() { $this->__construct(); }

  // read/write file methods
  function load($file_name) {
    $this->xml_document = new DOMDocument();
    if(!$this->xml_document->load($file_name)) {
	  // trigger_error('load document error.', E_USER_ERROR);
	  return false;
	}

	$this->file_name_ = $file_name;
	return true;
  }
  function save() {}
  function save_as($file_name) {}

  // 遍历
  function trav($visitor) {
    // root element
	$root_node = $this->xml_document->documentElement;
	if(!$root_node) {
	  trigger_error('invalid document error.', E_USER_ERROR);
	}

    $visitor->push($root_node);
	$pages_node = xmlbook::get_attribute_node($root_node, 'PAGES');
	$this->trav_($pages_node, $visitor);
	$visitor->pop($root_node);
  }

  function trav_($pages_node, $visitor) {
	if($pages_node && $pages_node->nodeType == 1 
		&& $pages_node->nodeName == 'PAGES') 
	{
	  $b = false;
	  $temp_page_node = $pages_node->firstChild;
	  while($temp_page_node) {
		if(($temp_page_node->nodeType==1)&&($temp_page_node->nodeName=='PAGE'))
		{
		  $b = true;
		  break;
		}
        $temp_page_node = $temp_page_node->nextSibling;
	  }

	  if($b && $visitor) {
	    $visitor->push($pages_node);
	  }
	  
	  $page_node = $pages_node->firstChild;
	  while($page_node) {
		// echo "\n####".$page_node->nodeType.$page_node->nodeName;
		if($page_node->nodeType == 1 && $page_node->nodeName=='PAGE') {
          if($visitor) {
            $visitor->push($page_node);
			$visitor->visit($page_node);
		  }

          $sub_pages = xmlbook::get_attribute_node($page_node, 'PAGES');
	      $this->trav_($sub_pages, $visitor);

		  if($visitor) $visitor->pop($page_node);
		}
        
	    $page_node = $page_node->nextSibling;
	  }

	  if($b && $visitor) {
	    $visitor->pop($pages_node);
	  }
	}
  }

  static function get_attribute($node, $attr_name) {
	  $return_node = xmlbook::get_attribute_node($node, $attr_name);
	  if(!$return_node) return '';
	  return $return_node->nodeValue;
  }

  static function get_attribute_node($node, $attr_name) {
    if($node->nodeType != 1) {
	  return null;
	}
       
    if($node->nodeName=='PAGE' || $node->nodeName == 'XMLBOOK') {
	    $child = $node->firstChild;
	    while($child) {
	      if($child->nodeName == $attr_name && $child->nodeType == 1) {
		    return $child;
		  }
		  $child = $child->nextSibling;
	    }
	}  

	return null;
  }
}


interface IFunctor_Travers {
  public function push($node);
  public function visit($node);
  public function pop($node);
}

// get document tree
class GetArchiveTree implements IFunctor_Travers {
  public function push($node) {
	if($node->nodeName == 'PAGES') {
	  $this->html.="\r\n<ul>\r\n";
	} else if($node->nodeName == 'PAGE') {
	  $this->html.="<li>";
	}

	array_push($this->stack, $node);
  }

  public function visit($node) {
    $title = xmlbook::get_attribute($node, 'TITLE');
    $this->html.= "<a href=\"#\">".$title."</a>";
  }

  public function pop($node) {
	if($node->nodeName == 'PAGES') {
	  $this->html.="</ul>\r\n";
	} else if($node->nodeName == 'PAGE') {
	  $this->html.="</li>\r\n";
	}
    
	array_pop($this->stack);
	//if(empty($this->stack)) {
	//  echo $this->html;
	//}
  }

  function __toString() {
    return $this->html;
  }

  var $html;
  var $stack = array();
}

// create html file
class CreateHtmlFile implements IFunctor_Travers {

  function __construct($context) {
    $this->context = $context['context'];
	$this->tpl = $context['article_tpl'];
	$this->document_dir = $context['document_dir'];
  }

  function CreateHtmlFile($context) {
    $this->__construct($context);
  }

  public function push($node) {
    
  }

  public function visit($node) {
	
    $title = (xmlbook::get_attribute($node, 'TITLE'));
	// parse template file
	// article content buffer
	$article_content = (xmlbook::get_attribute($node, 'CONTEXT'));
    // template buffer
	$this->context['content'] = $article_content;
    $content = preg_replace_callback(
	  "/\[\[(\w+)\]\]/is", 
      array($this, 'replace_callback'),
	  $this->tpl
	);

	$this->write_html_file($this->document_dir.'/'.utf2gbk($title).'.html', $content);
	echo $title."\r\n";
  }

  public function replace_callback($matches) {
	// print_r($matches);
    return $this->context[$matches[1]];
  }

  public function pop($node) {
    
  }

  function write_html_file($file_name, $html_body) {
     $f = @fopen($file_name, 'w+');
	 if($f) {
	   fwrite($f, $html_body, strlen($html_body));
	   fclose($f);
	   return true;
	 }

	 return false;
  }

  var $context;
  var $document_dir;
  var $tpl;
}

class CLASS_MODULE_XMLBOOK extends CLASS_MODULE {

    function __construct() { parent::__construct();  }

    function CLASS_MODULE_XMLBOOK() { $this->__construct(); }

    function doMain($action) {
		// document root
	    $this->document_path = $this->App()->getAppRoot().'/data';
		$this->document_output_dir = _IROOT.'/docs';
		$file_name = $_GET['f'];
		if(empty($file_name)) {
		  trigger_error('file name is invalid.', E_USER_ERROR);
		}

		$this->document_output_dir .= '/'.str_replace('/','-',$file_name);
		// echo $this->document_output_dir;
		createfolders($this->document_output_dir);

		// print($this->document_path);
		switch($action) {
		case 'edit':
			$this->edit();
			break;
		case 'display':
			$this->display();
			break;

		case 'generate':
          $this->generate();
		  break;

		default:
			$this->index();
		}		
    }

  function doAjax($action) {
	// document root
	$this->document_path = $this->App()->getAppRoot().'/data';
	// ajax data
	$ajax_data = &$_POST['data'];

    $p = $this->App()->getAPPS('qlib');
	$p = _BIND_ROOT . $p . '/php/config.php';
	if(file_exists($p)) {
	  $arr = require($p);
	  $this->RootDir = utf2gbk($arr[$_GET['cfg']]);
	  if(!file_exists($this->RootDir)) {
		$this->errmsg('无效的配置文件: '.$this->RootDir);
	  }
	} else {
	  $this->errmsg('无效的配置文件: '.$p);
	}
	// ajax action
	switch($action) {
	  case 'read':
		$this->read();
		break;
	  case 'create':
		$this->create();
	    break;
	  case 'save':
		$this->save();
		break;
    }
  }

	function index() {
	  try {
          $t = new CLASS_TEMPLATES($this->App());
          //$t->push('images_data', json_encode($rs));
          echo $t->parse('mail.reset.pwd');
      } catch(Exception $e) {
           print_r($e);
      }
	}

  function generate() {
	// generate
	$file_name = $_GET['f'];
    if(empty($file_name)) {
	  // invalid file name
	  trigger_error('invalid file name.', E_USER_ERROR);
	}

	  // echo "generating...\r\n";
    $file = $this->document_path.''.$file_name;
    $xml_book = new xmlbook();
    if(!$xml_book->load($file)) {
	  trigger_error('load document error.', E_USER_ERROR);
	}

	// output
	// echo $this->document_output_dir;
    // xmlbook.template.output
    $t = new CLASS_TEMPLATES($this->App());
    $tpl = $t->parse('xmlbook.template.output');
	//echo $tpl;

    $get_archive = new GetArchiveTree();
	$xml_book->trav($get_archive);
	$document_tree = $get_archive->__toString();
	$context = array
	(
	  'document_dir' => $this->document_output_dir,
	  'article_tpl' => $tpl,
	  'context' => array(
	    'document_tree' => $document_tree
	  )
	);
      
	$create_html_file = new CreateHtmlFile($context);
	$xml_book->trav($create_html_file);
  }

  function edit() {
    // 获取QLib的配置
    $t = new CLASS_TEMPLATES($this->App());
	require(_IROOT.'/editor/fckeditor.php');
    // create fckeditor
	$sBasePath = _IPATH."/editor/";
	$oFCKeditor = new FCKeditor('FCKeditor1') ;
	$oFCKeditor->BasePath	= $sBasePath ;
	$oFCKeditor->Config['SkinPath'] = $sBasePath . 'editor/skins/' . htmlspecialchars('office2003') . '/' ;
	$oFCKeditor->Config['LinkBrowser'] = false ;
	$oFCKeditor->Config['ImageBrowser'] = false ;
	$oFCKeditor->Config['FlashBrowser'] = false ;
	$oFCKeditor->Config['LinkUpload'] = false ;
	$oFCKeditor->Config['ImageUpload'] = false ;
	$oFCKeditor->Config['FlashUpload'] = false ;
	// 设置工具条
	$oFCKeditor->ToolbarSet = 'XmlBook';
	$oFCKeditor->Height	= '100%';
	$oFCKeditor->Value		= '欢迎使用XMLBOOK' ;
	$t->push('editor', $oFCKeditor->CreateHtml());
	echo $t->parse('xmlbook.editor');
  }

  function read() {
	$data = &$this->request['data'];
	$fName = $data['fName'];

	if($fName[0] != '/' || $fName[0] != '\\') {
		$fPath = $this->RootDir.'/'.$fName;
	} else {
		$fPath = $this->RootDir.$fName;
	}

	$fPath = utf2gbk($fPath);
	if(is_dir($fPath) || (!file_exists($fPath))) {
		$this->errmsg('文件不存在!'.$fPath);
		return;
	}

	// 读取文件
	$xmlDoc = new DOMDocument("1.0", "utf-8");
	if(!$xmlDoc->load($fPath)) {
		$this->errmsg('文件不存在或者不是XML文件');
		return;
	}

	$this->AjaxData($xmlDoc->saveXML());
  }

  function save() {
	$data = $_POST['data'];
	
	$fName = $data['fName'];
	$a = substr($fName, 0, 1);
	if($a != '/' || $a != '\\') {
		$fPath = $this->RootDir.'/'.$fName;
	} else {
		$fPath = $this->RootDir.$fName;
	}
	$fPath = utf2gbk($fPath);
	$fXMLData = $data['fData'];
	$xmlDoc = new DOMDocument("1.0", "utf-8");
	$xmlDoc->loadXML($fXMLData);
	if(!$xmlDoc->save($fPath)) {
		$this->errmsg('创建文件失败，权限不足!');
	}
  }
}

?>
