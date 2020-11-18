Hdrpaint.modifier["gradientmap"] = (function(){
	var Gradientmap= function(){
		Layer.apply(this);
		this.effect=4;
		this.children=[];
	};
	var ret = Gradientmap;
	ret.typename="gradientmap";
	inherits(ret,Layer);

	ret.prototype.beforeReflect= function(){
		if(this.children.length<1){
			return;
		}
		this.children[0].beforeReflect();
	}

	ret.prototype.reflect=function(img,composite_area){

		var x = Math.max(0,composite_area[0]);
		var y = Math.max(0,composite_area[1]);
		var x1 = Math.min(this.parent.size[0],composite_area[2]+x);
		var y1 = Math.min(this.parent.size[1],composite_area[3]+y);
		var layer = this;


		var offx =  img.offsetx;
		var offy =  img.offsety;
		img.scan(function(r,idx,x,y){layer.getPixel(r,idx,x +offx,y+offy);} ,x-img.offsetx,y-img.offsety,x1-x,y1-y);
	}

	var clip=function(v,min,max){
		return Math.max(min,Math.min(max,v));
	}
	ret.prototype.getPixel = function(ret_pixel,idx,x,y){
		if(this.children.length<1){
			return;
		}
		if(y===undefined){
			y= x;
			x= idx;
			idx =0;
		}
		var total = ret_pixel[idx]+ ret_pixel[idx+1] + ret_pixel[idx+2];
		total *=0.33333;
		total = clip(total,0,1);
			
		var child = this.children[0];
		child.getPixel(ret_pixel,idx,total*(child.size[0]-1),0);
}

	var html = `
		`;
	Hdrpaint.addModifierControl(ret.typename,html);
	return ret;
})();
