<?php
return array(
	// ���ݿ������б�
	'dbs' => array(
		// Ĭ�����ݿ�
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
		
	// ��վ
	'site' => array(
		'superuid' => '',
		'category_static' => false,
		'name' => 'qlibs',
		'index' => 'index',
	),

	// ˮӡ���� WATER
	'water' => array(
		'enable' => true,
		// ͼƬ��СWIDTH(��),HEIGHT(��)
		// ����Ϊ0Ϊ����
		'width' => 23,
		'height'=> 23,
		// ����
		// �������ˮӡ
		'text'	=> 'http://qlibs.com',
		// ���ִ�С
		// ˮӡ���ֵĴ�С
		'textsize'=>13,
		// ������ɫ
		// ˮӡ���ֵ���ɫ
		'color' => '#FF0000',
		// ˮӡλ��
		// ����ѡ��ˮӡ�������Ӧ��λ��
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
