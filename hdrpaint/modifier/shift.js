Hdrpaint.modifier["shift"] = (function(){
	var ret_pixel = new Vec4();
	var bufimg = new Img(1024,1024);

	var Shift= function(dst,src,x,y,w,h){
		if(src.children.length==0){
			return;
		}
		var img = dst.img;
		var img_data = img.data;
		bufimg.width = dst.size[0];
		bufimg.height = dst.size[1];
		Img.copy(bufimg,0,0,img,0,0,img.width,img.height);


		for(var yi=0;yi<h;yi++){
			idx = img.getIndex(x,yi+y)<<2;
			for(var xi=0;xi<w;xi++){

				func(ret_pixel,src,xi+x,yi+y,bufimg);

				img_data[idx] = ret_pixel[0];
				img_data[idx+1] = ret_pixel[1];
				img_data[idx+2] = ret_pixel[2];
				img_data[idx+3] = ret_pixel[3];
				idx+=4;
			}
		}
	}
	var ret = Shift;

	var func= function(ret_pixel,layer,x,y,img){

		var pixel = layer.children[0].getPixel(x,y);
		var sx = pixel[0]-0.5;
		var sy = pixel[1]-0.5;
		var sz = pixel[2]-0.5;

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
