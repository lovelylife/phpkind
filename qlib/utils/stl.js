
/*--------------------------------------------------------------------------------
 $ basic  type list definition
----------------------------------------------------------------------------------*/
//列表节点结构
var __NODE = Q.extend({
	next : null,
	prev : null,
	key  : null,
	construct : function(key) { this.key = key; }
});

var __LIST = Q.extend({
	head : null,	// 链表的头部
	tail : null,	// 链表尾部
	current: null,
	length : 0,
	construct : function(){
		this.head = null;
		this.tail = null;
		this.current = null;
	},
	
	begin :    function() {	return this.head; },	// not head	use as STL
	end :      function() {	return null	},
	len :      function() {	return this.length;	},
	item :     function() {	return this.current.key; },
	moveNext : function() {	this.current = this.current.next;	},
	movePrev : function(){	this.current = this.current.prev;	},
	
	push : function(key){
		var node = new __NODE(key);

    if(!this.head) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      node.prev = this.tail;
      this.tail = node;
    }

		this.length++;
	},
	
  remove : function(key){
		var node = this.find(key);
		if( node == null ){	return false;	}
		this.removeNode(node);
	},
	
	removeNode : function(node) {
    if(node == this.head) {
      this.head = node.next;
    } 

    if(node == this.tail) {
      this.tail = node.prev;
    }
    
    delete node;
		this.length--;
	},
	
	clear : function(){
		for(var node = this.begin(); node != this.end(); node = node.next){
			this.removeNode(node);
		}
	},
	
	find : function(key){
		for(var node = this.begin(); node != this.end(); node = node.next){
			if( node.key == key )	return node;
		}
		return null;
	},
	
	toString : function(){
		var i = 0;
		var str = "";
		for(var node = this.begin(); node != this.end(); node = node.next){
			str += "Node["+i+"]: " + node.key + "\n";
			i++;
		}
		return str;
	}
});


var STRUCT_HASMAP = Q.extend({
	base : null,
	length : 0,
	dataIndex : 0,
	construct : function() {
		this.base = new Object();
	},
	
	each : function(callback) {
		if(typeof callback != 'function') {
			return;
		}
		for(var key in this.base) {
			if(callback(this.base[key], key) == 0) { break; }
		}
	},
	
	item : function(key) {
		return this.base[key];
	},
	
	add    : function(key, value) {
		this.base[key] = value;
		this.length++;
	},
	
	remove : function(key) {
		//alert('is have')
		if(!this.has(key)) { return; }
		//alert('yes')
		delete this.base[key];
		this.length--;
	},
	
	clear : function() {
		var _this = this;
		_this.each(function(item, key){
			_this.remove(key);
		});
		this.length = 0;
	},
	
	push : function(value) {
		this.base[this.dataIndex] = value;
		this.length++;
		this.dataIndex++;
	},
	
	pop : function() {
		var re = this.base[this.dataIndex];
		delete this.base[this.dataIndex];
		this.length--;
		return re;
	},
	
	find : function(value) {
		var vkey = null;
		this.each(function(item, key){
			if(item == value) {
				vkey = key;
				return 0;
			}
		});
		return vkey;
	},
	
	has : function(key) {
		return !(typeof this.base[key] == 'undefined');
	}
});
