
Hdrpaint.modifier["grayscale"] = (function(){
	var GrayScale= function(){
		Layer.apply(this);
		this.scale=128;
		this.octave=1;
		this.betsu=false;
		this.func="perlin";
		this.children=null;
	};
	var ret = GrayScale;
	inherits(ret,Layer);

	var img;
	var img_data;
	ret.prototype.beforeReflect=function(){
		
	}
	ret.prototype.reflect=function(_img,composite_area){
		this.beforeReflect();

		 img = _img;
		 img_data = img.data;

		var x = Math.max(0,composite_area[0]);
		var y = Math.max(0,composite_area[1]);
		var x1 = Math.min(this.parent.size[0],composite_area[2]+x);
		var y1 = Math.min(this.parent.size[1],composite_area[3]+y);

		var layer= this;
		img.scan(layer.getPixel,x-img.offsetx,y-img.offsety,x1-x,y1-y);
	}

	ret.prototype.getPixel = function(ret,idx,x,y){
		if(y == undefined){
			y = x;
			x = idx;
			idx=0;
		}
		var idx = img.getIndex(x,y)<<2;
		var total = img_data[idx]+ img_data[idx+1] + img_data[idx+2];
		total *=0.33333;
		ret[idx+0] = total;
		ret[idx+1] = total;
		ret[idx+2] = total;
		ret[idx+3] = img_data[idx+3];
	}
	return GrayScale;
})();
