<?php die("access denied!"); /*
DROP TABLE IF EXISTS `{$prefix}admin`;
CREATE TABLE {$prefix}admin (
  `uid` int(8) unsigned NOT NULL auto_increment,
  `uname` varchar(30) NOT NULL,
  `pwd` varchar(64) NOT NULL,
  `nickname` varchar(30) default NULL,
  `rights` text,
  `group_id` int(4) default NULL COMMENT '电子邮件',
  `tel` varchar(16) default NULL COMMENT '联系电话',
  `loginip` varchar(20) default NULL COMMENT '登陆ip',
  `logintime` int(8) default NULL COMMENT '登陆时间',
  `email` varchar(128) default NULL,
  `createtime` int(8) default NULL,
  PRIMARY KEY  (`uid`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `{$prefix}usergroup`;
CREATE TABLE {$prefix}usergroup (
  `group_id` int(4) NOT NULL auto_increment COMMENT '用户组ID',
  `group_name` varchar(32) NOT NULL COMMENT '用户组名称',
  `rights` text COMMENT '权限集合',
  PRIMARY KEY  (`group_id`,`group_name`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

INSERT INTO `{$prefix}usergroup` (`group_id`,`group_name`,`rights`) VALUES('1','系统管理员','00,02,03,04,05,06,07,08,09,10,11,12,14,15,17,18,19,20,21,22,23,24');

DROP TABLE IF EXISTS `{$prefix}singerinfo`;
CREATE TABLE {$prefix}singerinfo (
	id mediumint(8) unsigned NOT NULL auto_increment,
	name varchar(15) NOT NULL default '',
	engName varchar(32) NOT NULL default '',
	trueName varchar(15) NOT NULL default '',
	gender tinyint(1) NOT NULL default '0',
	booldType varchar(3) NOT NULL default '',
	birthday date NOT NULL default '0000-00-00',
	weight int(4) NOT NULL default '0',
	height int(4) NOT NULL default '0',
	education varchar(8) NOT NULL default '',
	constellation varchar(8) NOT NULL default '',
	origin varchar(16) NOT NULL default '',
	letter varchar(1) NOT NULL default '',
	PRIMARY KEY (id)
) TYPE=MyISAM;

DROP TABLE IF EXISTS {$prefix}album;
CREATE TABLE {$prefix}album (
	id mediumint(8) unsigned NOT NULL auto_increment,
	name varchar(32) NOT NULL default '',
	singerid mediumint(8) NOT NULL default '0',
	pubdate date NOT NULL default '0000-00-00',
	description text NOT NULL,
	img varchar(255) NOT NULL default '',
	PRIMARY KEY (id)
) TYPE=MyISAM;

DROP TABLE IF EXISTS {$prefix}lrcs;
CREATE TABLE {$prefix}lrcs  (
	id mediumint(8) unsigned NOT NULL auto_increment,
	songid mediumint(8) NOT NULL default '0',
	updated date NOT NULL default '0000-00-00',
	lrcs text NOT NULL,
	keywords varchar(128) NOT NULL default '',
	PRIMARY KEY (id)
) TYPE=MyISAM;

DROP TABLE IF EXISTS {$prefix}singertype;
CREATE TABLE {$prefix}singertype  (
	id int(4) unsigned NOT NULL auto_increment,
	name varchar(32) NOT NULL default '',
	no varchar(4) NOT NULL default '0000',
	PRIMARY KEY (id)
) TYPE=MyISAM;

INSERT INTO {$prefix}singertype(name, no) VALUES('华人男歌手', '0001'); 
INSERT INTO {$prefix}singertype(name, no) VALUES('华人女歌手', '0002'); 
INSERT INTO {$prefix}singertype(name, no) VALUES('华人组合', '0003'); 
INSERT INTO {$prefix}singertype(name, no) VALUES('日韩男歌手', '0004'); 
INSERT INTO {$prefix}singertype(name, no) VALUES('日韩女歌手', '0005'); 
INSERT INTO {$prefix}singertype(name, no) VALUES('日韩组合', '0006'); 
INSERT INTO {$prefix}singertype(name, no) VALUES('欧美歌手', '0007'); 
INSERT INTO {$prefix}singertype(name, no) VALUES('影视其他', '0008'); 

DROP TABLE IF EXISTS {$prefix}songtype;
CREATE TABLE {$prefix}songtype  (
	id int(4) unsigned NOT NULL auto_increment,
	name varchar(32) NOT NULL default '',
	PRIMARY KEY (id)
) TYPE=MyISAM;

DROP TABLE IF EXISTS {$prefix}urls;
CREATE TABLE {$prefix}urls  (
	id int(4) unsigned NOT NULL auto_increment,
	url varchar(255) NOT NULL default '',
	songid mediumint(8) unsigned NOT NULL default '0',
	PRIMARY KEY (id)
) TYPE=MyISAM;

DROP TABLE IF EXISTS {$prefix}songslib;
CREATE TABLE {$prefix}songslib  (
	id int(4) unsigned NOT NULL auto_increment,
	name varchar(32) NOT NULL default '',
	albumid int(4) NOT NULL default '0',
	singerid mediumint(8) unsigned NOT NULL default '0',
	songtypeid int(4) unsigned NOT NULL default '0',
	lrcid mediumint(8) unsigned NOT NULL default '0',
	letter varchar(1) NOT NULL default 'A',
	hits int(4) unsigned NOT NULL default '0',
	recommend int(4) unsigned NOT NULL default '0',
	songid mediumint(8) unsigned NOT NULL default '0',
	urlid mediumint(8) unsigned NOT NULL default '0',
	PRIMARY KEY (id)
) TYPE=MyISAM;
#*/
?>