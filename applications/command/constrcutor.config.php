<?php
/*-------------------------------------------------------------------
 $ this is a template config file for construct application
 $ of PHPKind system
 $ author: Q(life.qm@gmail.com)
 $ date: 2012-08-02
 $
---------------------------------------------------------------------*/

// key't' is type, true is file, false is folder
// key'name' is app template file or directory name, for construct or repair a new app.
// key'dir' is relative path to the app root.

return array(

// the files below must
array('t'=>true, 'dir'=>'' ,'name'=> 'app.class.php'),
array('t'=>true, 'dir'=>'' ,'name'=> 'app.required.php'),
array('t'=>true, 'dir'=>'' ,'name'=> 'includes.required.php'),
array('t'=>true, 'dir'=>'' ,'name'=> 'config.php'),

// construct directories that is needed.
array('t'=>false, 'dir'=>'' ,'name'=> 'modules', 'createindex'=>true),
array('t'=>false, 'dir'=>'' ,'name'=> 'templates', 'createindex'=>true),
array('t'=>false, 'dir'=>'' ,'name'=> 'themes','createindex'=>true),
array('t'=>false, 'dir'=>'/templates' ,'name'=> 'default','createindex'=>false),
array('t'=>false, 'dir'=>'/themes' ,'name'=> 'default','createindex'=>true),

// construct demo files
array('t'=>true, 'dir'=>'/modules' ,'name'=> 'default.class.php'),
array('t'=>true, 'dir'=>'/templates/default' ,'name'=> 'index.htm'),

);

?>
