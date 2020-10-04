Hdrpaint.modifier["shift"] = (function(){
	var ret_pixel = new Vec4();
	var bufimg = new Img(1024,1024);
	var Shift = new function() {};
	var ret = Shift;
	var layer;
	ret.init  = function(dst,src,x,y,w,h){
		if(src.children.length==0){
			return true;
		}
		layer = src;
		var img = dst.img;
		var img_data = img.data;
		bufimg.width = dst.size[0];
		bufimg.height = dst.size[1];
		Img.copy(bufimg,0,0,img,0,0,img.width,img.height);

	}

	ret.getPixel = function(ret_pixel,x,y){
	var img = bufimg;

		layer.children[0].getPixel(ret_pixel,x,y);
		var sx = ret_pixel[0]-0.5;
		var sy = ret_pixel[1]-0.5;
		var sz = ret_pixel[2]-0.5;

		var pow = layer.power*10;
		sx = sx* pow|0;
		sy = sy* pow|0;
		sz = sz* pow|0;

		var d_idx2 = img.getIndexLoop(x+sx,y+sy)<<2;

		ret_pixel[0]=img.data[d_idx2+0] ;
		ret_pixel[1]=img.data[d_idx2+1] ;
		ret_pixel[2]=img.data[d_idx2+2] ;
		ret_pixel[3]=img.data[d_idx2+3] ;
	}
	return ret;
})();
