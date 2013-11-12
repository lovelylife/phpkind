<?php
return array(
	// 数据库配置列表
	'dbs' => array(
		// 默认数据库
		'default' => array(
			'type' => 'mysql',
			'host' => 'host',
			'user' => 'root',
			'pwd'  => '',
			'dbname' => 'cdmusic',
			'lang' => '',
			'prefix'=> 'cdb_'
		),
	),
		
	// 网站
	'site' => array(
		'superuid' => '',
		'category_static' => false,
		'name' => 'qlibs',
		'index' => 'index',
	),

	// 水印部分 WATER
	'water' => array(
		'enable' => true,
		// 图片大小WIDTH(宽),HEIGHT(高)
		// 设置为0为不限
		'width' => 23,
		'height'=> 23,
		// 文字
		// 添加文字水印
		'text'	=> 'http://qlibs.com',
		// 文字大小
		// 水印文字的大小
		'textsize'=>13,
		// 文字颜色
		// 水印文字的颜色
		'color' => '#FF0000',
		// 水印位置
		// 根据选择将水印加入的相应的位置
		'position'=> 9
	),

	'upload' => array(
		'dir' => '/upload',
		'images' => '/image',
		'attachments' => '/attach',
		'filters' => 'jpg,jpeg,gif,png,rar,zip,doc,xls',
	),
);

?>
