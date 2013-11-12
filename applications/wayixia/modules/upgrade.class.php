<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_MODULE_UPGRADE extends CLASS_MODULE {

	public function __construct() { parent::__construct();  }
	public function CLASS_MODULE_UPGRADE() { $this->__construct(); }

  function doMain($action) {

    $db = $this->App()->db();
    // save thumb
		$sql = "select file_name from ##__images_resource";

		$images = array();
		$db->get_results($sql, $images);
    $images_dir = $this->Config('site.images_dir');
    createfolders(_BIND_ROOT.$images_dir);

		foreach($images as $img) {
      //$this->update_images_file($img['file_name']);
      $file_name = $img['file_name'];
      $image_file_name = _BIND_ROOT.$images_dir.'/'.$file_name;
      //echo $image_file_name;
      if(!is_dir($image_file_name) && file_exists($image_file_name)) {
        $file_size = filesize($image_file_name);
        $ext = $this->get_image_extension($image_file_name);
        echo $ext.":{$file_size}<br>";
        if(!is_bool($file_size) && $file_size > 0) {
          $db->execute("update ##__images_resource set `file_size`='{$file_size}',`file_type`='{$ext}' where `file_name`='{$file_name}';");
        }
      }
		}
	}

	function generator_thumb($file_name) {
		
	  $images_dir = $this->Config('site.thumb_images_dir');
		createfolders(_BIND_ROOT.$images_dir);

		$thumb_file_name = $images_dir.'/'.$file_name;
		if(file_exists(_BIND_ROOT.$thumb_file_name)) {
		  return true;
		}
		$cache_url = $this->Config('site.images_dir').'/'.$file_name;
		$thumb_image =  new SimpleImage;
    if($thumb_image->load(_BIND_ROOT.$cache_url)) {
		  $thumb_image->resizeToWidth(192);
		  $thumb_image->save(_BIND_ROOT.$thumb_file_name);
		}

		return false;
	}

  function update_images_file($file_name) {
    $abs_file_name = _BIND_ROOT.$this->Config('site.images_dir').'/'.$file_name;
    
    if(file_exists($abs_file_name)) {
      //$extension = $this->get_image_extension($abs_file_name);
      //rename($abs_file_name, $abs_file_name.$extension);
      echo $abs_file_name."<br>";
      //$this->App()->db()->execute("update ##__images_resource set `file_name`+='.jpg'");
    }
    //$extension = $this->get_image_extension($abs_file_name);
    //rename($abs_file_name, $abs_file_name.$extension);
    //echo $abs_file_name.$extension."<br>";
  }


  //$file = 'http://static.php.net/www.php.net/images/php.gif';
  //echo get_image_extension($file);
  // Returns '.gif'

  /**
   * Given an image filename, get the file extension.
   *
   * @param $filename
   *   This parameter specifies the file you wish to retrieve information about.
   *   It can reference a local file or (configuration permitting) a remote file
   *   using one of the supported streams.
   * @param $include_dot
   *   Whether to prepend a dot to the extension or not. Default to TRUE.
   * @param $shorter_extensions
   *   Whether to use a shorter extension or not. Default to TRUE.
   * @return 
   *   A string with the extension corresponding to the given image filename, or
   *   FALSE on failure.
   */
  function get_image_extension($filename, $include_dot = true, $shorter_extensions = true) {
    $image_info = @getimagesize($filename);
    if (!$image_info || empty($image_info[2])) {
      return false;
    }

    if (!function_exists('image_type_to_extension')) {
      /**
       * Given an image filename, get the file extension.
       *
       * @param $imagetype
       *   One of the IMAGETYPE_XXX constants.
       * @param $include_dot
       *   Whether to prepend a dot to the extension or not. Default to TRUE.
       * @param $shorter_extensions
       *   Whether to use a shorter extension or not. Default to TRUE.
       * @return
       *   A string with the extension corresponding to the given image type, or
       *   FALSE on failure.
       */
      function image_type_to_extensiona ($imagetype, $include_dot = true) {
        // Note we do not use the IMAGETYPE_XXX constants as these will not be
        // defined if GD is not enabled.
        $extensions = array(
          1  => 'gif',
          2  => 'jpeg',
          3  => 'png',
          4  => 'swf',
          5  => 'psd',
          6  => 'bmp',
          7  => 'tiff',
          8  => 'tiff',
          9  => 'jpc',
          10 => 'jp2',
          11 => 'jpf',
          12 => 'jb2',
          13 => 'swc',
          14 => 'aiff',
          15 => 'wbmp',
          16 => 'xbm',
        );

        // We are expecting an integer between 1 and 16.
        $imagetype = (int)$imagetype;
        if (!$imagetype || !isset($extensions[$imagetype])) {
          return false;
        }

        return ($include_dot ? '.' : '') . $extensions[$imagetype];
      }
    }

    $extension = image_type_to_extension($image_info[2], $include_dot);
    if (!$extension) {
      return false;
    }

    if ($shorter_extensions) {
      $replacements = array(
        'jpeg' => 'jpg',
        'tiff' => 'tif',
      );
      $extension = strtr($extension, $replacements);
    }
    return $extension;
  }
}

?>
