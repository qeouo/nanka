Hdrpaint.modifier["gradient"] = (function(){
	var Gradient = function(){
		Layer.apply(this);
		this.color0=new Vec4();
		this.color1=new Vec4();
		Vec4.set(this.color0,0,0,0,1);
		Vec4.set(this.color1,1,1,1,1);
	};
	var ret = Gradient;
	inherits(ret,Layer);

	ret.prototype.typename="gradient";


	var _width;
	ret.prototype.beforeReflect=function(){
		_width = 1/this.size[0];
		
	}
	ret.prototype.reflect=function(img,area){
		var layer = this;
		var offx = -this.position[0] + img.offsetx;
		var offy = -this.position[1] + img.offsety;
		img.scan(function(ret,idx,x,y){layer.getPixel(ret,idx,x+img.offsetx,y+img.offsety);},area[0]-img.offsetx
				,area[1]-img.offsety,area[2],area[3]);
	}

	ret.prototype.getPixel = function(ret,idx,x,y){
		var b = Math.max(0,Math.min(x*_width,1));
		var a = 1-b;
		ret[idx+0] = this.color0[0] * a + this.color1[0] * b;
		ret[idx+1] = this.color0[1] * a + this.color1[1] * b;
		ret[idx+2] = this.color0[2] * a + this.color1[2] * b;
		ret[idx+3] = this.color0[3] * a + this.color1[3] * b;
	}

	return ret;
})();
