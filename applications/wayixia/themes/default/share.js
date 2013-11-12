
function enum_pictures() {
	var len = document.images.length;
	var output = '';
  var count = 0;
	var accept_images = {};
	for(var i=0; i < len ; i++) {
    var img = document.images[i];
    if(img.src=='' || accept_images[img.src]) 
		{
      continue;
		}


    if(img.width < 100 || img.height < 100) {
      continue;
    }

		output += document.images[i].src+'||';
    count++;
    if(count >= 1) 
      break;
  }

  return output;
}

function share2sina() {
	var json = {
    url:location.href,
    type:'3',
    count:'1', /**是否显示分享数，1显示(可选)*/
    appkey:'59191755', /**您申请的应用appkey,显示分享来源(可选)*/
    title: document.title, /**分享的文字内容(可选，默认为所在页面的title)*/
    pic: enum_pictures(), /**分享图片的路径(可选)*/
    ralateUid:'', /**关联用户的UID，分享微博会@该用户(可选)*/
    language:'zh_cn', /**设置语言，zh_cn|zh_tw(可选)*/
    dpc:1
  }

  
  window.open("http://service.weibo.com/share/share.php?url=" + json.url + "&appkey=" + json.appkey + "&title=" + json.title + "&pic=" + json.pic + "&ralateUid=" + json.ralateUid + "&language=" + json.language, "_blank", "width=615,height=505")
}