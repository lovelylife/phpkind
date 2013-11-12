<?php

if(!defined('_IPATH')) {
    die('<h3>Forbidden</h3>');
}

class CLASS_XMLBOOK_APPLICATION extends CLASS_APPLICATION {
    
    private $_RIGHTSTABLE;
    private $_USERCONTEXT;
    
    function __construct($args) {
        parent::__construct($args);
    }
    
    function CLASS_XMLBOOK_APPLICATION($args) {
        $this->__construct($args);
    }
    
    function appMain($args) {
        $appRoot = $this->getAppRoot();
        $mod = $_GET['mod'];
        $modfile = $appRoot.'/'.$mod.'.class.php';
        
        if(file_exists($modfile)) {
            //! 加载模块
            require($modfile);
            $class = 'CLASS_'.strtoupper($mod);
            
            if(class_exists($class)) {
                new $class;
                // echo $modfile;
            } else {
                echo $class. ' is not defined.';
            }
        }  else {
            //! 启动默认首页
            $t = new CLASS_TEMPLATES;
            $t->push('title', '首页');
            $t->loadTemplate('index');
            // print_r($t);
            echo $t->__toString();
        }
    }
    
    function& getUserRightsTable() {
        return $this->_RIGHTSTABLE;
    }
}

?>