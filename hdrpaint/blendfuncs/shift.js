Hdrpaint.blendfuncs["shift"] = (function(){
	var ret_pixel = new Vec4();
	var bufimg = new Img(1024,1024);
	var ret = function(img,layer,left2,top2,right2,bottom2){
		var img_width = img.width;
		var layer_img_width = layer.img.width;
		var layer_x = layer.position[0];
		var layer_y = layer.position[1];

		bufimg.width = img.width;
		bufimg.height = img.height;
		Img.copy(bufimg,0,0,img,0,0,img.width,img.height);
		var img_data = img.data;

		for(var yi=top2;yi<=bottom2;yi++){
			var idx = yi * img_width + left2 << 2;
			var max = yi * img_width + right2 << 2;
			var xi = left2;
			for(;idx<=max;idx+=4){
				func(ret_pixel,layer,xi,yi,bufimg);
				img_data[idx] = ret_pixel[0];
				img_data[idx+1] = ret_pixel[1];
				img_data[idx+2] = ret_pixel[2];
				img_data[idx+3] = ret_pixel[3];
				xi++;
			}
		}
	}
	var func= function(ret_pixel,layer,x,y,img){
		var src = layer.img.data;
		var s_idx = layer.img.getIndex(x+layer.position[0],y+layer.position[1])<<2;
		var sx = src[s_idx+0]-0.5;
		var sy = src[s_idx+1]-0.5;
		var sz = src[s_idx+2]-0.5;

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
	ret.flg=1;
	return ret;
})();
