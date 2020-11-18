Hdrpaint.modifier["blur"] = (function(){
	var blurgen= function(){
		Layer.apply(this);
		this.scale=16;
	};
	var ret = blurgen;
	inherits(ret,Layer);

	ret.prototype.typename="blur";

	ret.prototype.showDivParam= function(){
		return "blursize:"+this.scale;
	}

	ret.prototype.before=function(area){
		var size = Math.ceil(this.scale)*2;
		area[0]-=size;
		area[1]-=size;
		area[2]+=size<<1;
		area[3]+=size<<1;
	}

	ret.prototype.reflect=function(img,composite_area){
		var scale = Math.ceil(this.scale);

		composite_area[0]+=scale;
		composite_area[1]+=scale;
		composite_area[2]-=scale<<1;
		composite_area[3]-=scale<<1;
		var x = Math.max(0,composite_area[0]-img.offsetx);
		var y = Math.max(0,composite_area[1]-img.offsety);
		var x1 = Math.min(img.width,composite_area[2]+x);
		var y1 = Math.min(img.height,composite_area[3]+y);
		img.gauss(scale>>1,scale,x,y,x1-x,y1-y);
		
	}


	var html = `
			ぼかし半径:<input class="slider modifier_scale" title="scale" step="1" min="1" max="128"><br>
		`;
	Hdrpaint.addModifierControl("blur",html);
	Slider.init();

	return ret;
})();

