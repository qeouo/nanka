Testact.defObj= (function(){
	var defObj = function(){};
	var ret = defObj;
	ret.prototype.init=function(){};
	ret.prototype.move=function(){};
	ret.prototype.draw=function(){};
	ret.prototype.drawShadow=function(){
		this.draw();
	};
	ret.prototype.hit=function(){};
	ret.prototype.delete=function(){};
	ret.prototype.drawhud=function(){};
	return ret;

})();
