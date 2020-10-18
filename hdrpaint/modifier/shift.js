Hdrpaint.modifier["shift"] = (function(){
	var Shift= function(){
		Layer.apply(this);
		this.scale=128;
		this.octave=1;
		this.betsu=false;
		this.func="simplex";
		this.children=[];
	};
	var ret = Shift;
	inherits(ret,Layer);

	var ret_pixel = new Vec4();
	var bufimg = new Img(1024,1024);
	var layer;
	ret.prototype.init  = function(x,y,w,h){
		dst = this.parent;
		var img = dst.img;
		var img_data = img.data;
		bufimg.width = dst.size[0];
		bufimg.height = dst.size[1];
		Img.copy(bufimg,0,0,img,0,0,img.width,img.height);

		if(this.children.length>=1){
			this.children[0].init();
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

			var pow = this.power*10;
			sx = sx* pow|0;
			sy = sy* pow|0;
			//sz = sz* pow|0;
		}

		var d_idx2 = img.getIndexLoop(x+sx,y+sy)<<2;

		ret_pixel[0]=img.data[d_idx2+0] ;
		ret_pixel[1]=img.data[d_idx2+1] ;
		ret_pixel[2]=img.data[d_idx2+2] ;
		ret_pixel[3]=img.data[d_idx2+3] ;
	}

	var html = `
			スケール:<input type="text" class="modifier_power" title="power" value="1">
		`;
	Hdrpaint.addModifierControl("shift",html);
	return ret;
})();
