-- MySQL Administrator dump 1.4
--
-- ------------------------------------------------------
-- Server version	5.0.51a-community-nt


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO,MYSQL323' */;


--
-- Create schema wayixia
--

CREATE DATABASE IF NOT EXISTS wayixia;
USE wayixia;

--
-- Definition of table `cdb_admin`
--

DROP TABLE IF EXISTS `cdb_admin`;
CREATE TABLE `cdb_admin` (
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
) TYPE=MyISAM;

--
-- Dumping data for table `cdb_admin`
--

/*!40000 ALTER TABLE `cdb_admin` DISABLE KEYS */;
/*!40000 ALTER TABLE `cdb_admin` ENABLE KEYS */;


--
-- Definition of table `cdb_images`
--

DROP TABLE IF EXISTS `cdb_images`;
CREATE TABLE `cdb_images` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `owner` int(10) NOT NULL,
  `title` varchar(255) NOT NULL,
  `img_src` varchar(255) NOT NULL,
  `site_url` varchar(255) NOT NULL,
  `wcount` int(8) NOT NULL,
  `status` varchar(32) NOT NULL,
  `create_time` timestamp NOT NULL,
  PRIMARY KEY  (`id`)
) TYPE=InnoDB;

--
-- Dumping data for table `cdb_images`
--

/*!40000 ALTER TABLE `cdb_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `cdb_images` ENABLE KEYS */;


--
-- Definition of table `cdb_usergroup`
--

DROP TABLE IF EXISTS `cdb_usergroup`;
CREATE TABLE `cdb_usergroup` (
  `group_id` int(4) NOT NULL auto_increment COMMENT '用户组ID',
  `group_name` varchar(32) NOT NULL COMMENT '用户组名称',
  `rights` text COMMENT '权限集合',
  PRIMARY KEY  (`group_id`,`group_name`)
) TYPE=MyISAM AUTO_INCREMENT=2;

--
-- Dumping data for table `cdb_usergroup`
--

/*!40000 ALTER TABLE `cdb_usergroup` DISABLE KEYS */;
INSERT INTO `cdb_usergroup` (`group_id`,`group_name`,`rights`) VALUES 
 (1,'系统管理员','00,02,03,04,05,06,07,08,09,10,11,12,14,15,17,18,19,20,21,22,23,24');
/*!40000 ALTER TABLE `cdb_usergroup` ENABLE KEYS */;




/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
