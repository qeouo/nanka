Hdrpaint.modifier["shift"] = (function(){
	var Shift= function(){
		Layer.apply(this);
		this.effect=0;
		this.children=[];
	};
	var ret = Shift;
	inherits(ret,Layer);

	var ret_pixel = new Vec4();
	var bufimg = new Img(1024,1024);
	var layer;
	var xmod=1;
var ymod=1;

	ret.prototype.before=function(area){
		var size = this.effect;
		area[0]-=size;
		area[1]-=size;
		area[2]+=size<<1;
		area[3]+=size<<1;
	}
	ret.prototype.init=function(img,composite_area){

		var scale=this.effect>>1;

		composite_area[0]+=scale;
		composite_area[1]+=scale;
		composite_area[2]-=scale<<1;
		composite_area[3]-=scale<<1;

		if(bufimg.data.length<img.data.length){
			bufimg=new Img(img.width,img.height);
		}
		bufimg.width = img.width;
		bufimg.height = img.height;
		Img.copy(bufimg,0,0,img,0,0,img.width,img.height);

		if(this.children.length>=1){
			this.children[0].init();
		}


		xmod = (1<<Math.ceil(Math.log2(img.width)))-1;
		ymod = (1<<Math.ceil(Math.log2(img.height)))-1;

		var x = composite_area[0];
		var y = composite_area[1];
		var x1 = composite_area[2]+x;
		var y1 = composite_area[3]+y;

		var imgdata = img.data;
		for(var j=y;j<y1;j++){
			var idx = img.getIndex(0-img.offsetx,j-img.offsety);
			for(var i=x;i<x1;i++){
				this.getPixel(ret_pixel,i,j);
				imgdata[0]=ret_pixel[0];
				imgdata[1]=ret_pixel[1];
				imgdata[2]=ret_pixel[2];
				imgdata[3]=ret_pixel[3];
				
			}
		}
	}

	ret.prototype.getPixel = function(ret_pixel,x,y){
		var img = bufimg;

		var sx = 0;
		var sy = 0;
		if(this.children.length>=1){
			this.children[0].getPixel(ret_pixel,x,y);
			sx = ret_pixel[0]-0.5;
			sy = ret_pixel[1]-0.5;
			//sz = ret_pixel[2]-0.5;

			var pow = this.effect;
			sx = sx* pow|0;
			sy = sy* pow|0;
			//sz = sz* pow|0;
		}

		var d_idx2 = img.getIndex(x+sx&xmod,y+sy&ymod)<<2;

		ret_pixel[0]=img.data[d_idx2+0] ;
		ret_pixel[1]=img.data[d_idx2+1] ;
		ret_pixel[2]=img.data[d_idx2+2] ;
		ret_pixel[3]=img.data[d_idx2+3] ;
	}

	var html = `
			影響度:<input type="text" class="slider modifier_effect" title="effect" value="0.5" min="0" max="100">
		`;
	Hdrpaint.addModifierControl("shift",html);
	return ret;
})();
