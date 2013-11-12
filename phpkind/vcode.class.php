<?php
/**
* @version 1.0
* @author   Ben
* @date 2008-1-30
* @email jinmaodao116@163.com
* @��֤���ļ���
* 
//Ϊһ��ͼ�������ɫ
int function imagecolorallocate(resource image, int red, int green, int blue) 

//��һ���β����
bool function imagefilledrectangle(resource image, int x1, int y1, int x2, int y2, int color) 

//��һ������
bool function imagerectangle(resource image, int x1, int y1, int x2, int y2, int col)

//��һ����һ����  
bool function imagesetpixel(resource image, int x, int y, int color)   

*/

class VCode {
	var $width,$height,$codenum;
	//��������֤��
	var $checkcode; 
	//��֤��ͼƬ     
	var $checkimage;   
	//�������� 
	var $disturbColor = ''; 

	// ����������ȣ��߶ȣ��ַ�������
	function __construct($width='80',$height='20',$codenum='4')	{
	   $this->width=$width;
	   $this->height=$height;
	   $this->codenum=$codenum;
	}
	function outImg() {
	   //���ͷ
	   $this->outFileHeader();
	   //������֤��
	   $this->createCode();
	
	   //����ͼƬ
	   $this->createImage();
	   //���ø�������
	   $this->setDisturbColor();
	   //��ͼƬ��д��֤��
	   $this->writeCheckCodeToImage();
	   imagepng($this->checkimage);
	   imagedestroy($this->checkimage);
	}

	// @brief ���ͷ
	function outFileHeader()  {
	   header ("Content-type: image/png");
	}

	// ������֤��
	function createCode() {
	   $this->checkcode = strtoupper(substr(md5(rand()),0,$this->codenum));
	}
	
	// ������֤��ͼƬ
	function createImage() {
	   $this->checkimage = @imagecreate($this->width,$this->height);
	   $back = imagecolorallocate($this->checkimage,255,255,255); 
	   $border = imagecolorallocate($this->checkimage,0,0,0); 
	   
	   // ��ɫ��
	   imagefilledrectangle($this->checkimage,0,0,$this->width - 1,$this->height - 1,$back); 
	   // ��ɫ�߿�
	   imagerectangle($this->checkimage,0,0,$this->width - 1,$this->height - 1,$border);   
	}
	
	// ����ͼƬ�ĸ������� 
	function setDisturbColor() {
		for ($i=0;$i<=200;$i++) {
		    $this->disturbColor = imagecolorallocate(
				$this->checkimage, 
				rand(0,255), 
				rand(0,255), 
				rand(0,255)
			);
		    imagesetpixel($this->checkimage,
			rand(2,128),rand(2,38),
			$this->disturbColor);
		}
	}

	// ����֤��ͼƬ�����������֤��
	function writeCheckCodeToImage() {
		for ($i=0;$i<=$this->codenum;$i++) {
		    $bg_color = imagecolorallocate(
				$this->checkimage, 
				rand(0,255),
				rand(0,128), 
				rand(0,255)
			);
		    $x = floor($this->width/$this->codenum)*$i;
		    $y = rand(0,$this->height-15);
		    imagechar(
				$this->checkimage, 
				rand(5,8), 
				$x, $y, 
				$this->checkcode[$i], $bg_color
			);
		}
	}
	
	function __destruct() {
	   unset($this->width,$this->height,$this->codenum);
	}
}

/*
$image = new ValidationCode('130','30','6');    //ͼƬ���ȡ���ȡ��ַ�����
$image->outImg();

$_SESSION['VFCODE'] = $image->checkcode; //������֤�뵽 $_SESSION ��
*/