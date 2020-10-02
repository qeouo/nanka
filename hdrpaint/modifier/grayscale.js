Hdrpaint.modifier["grayscale"] = (function(){
	var GrayScale = function(dst,x,y,w,h){
		var img_data = dst.img.data;
		for(var yi=0;yi<h;yi++){
			idx = dst.img.getIndex(x,yi+y)<<2;
			for(var xi = 0;xi<w;xi++){
				var total = img_data[idx]+ img_data[idx+1] + img_data[idx+2];
				total *=0.33333;
				img_data[idx] = total;
				img_data[idx+1] = total;
				img_data[idx+2] = total;
				idx+=4;
			}
		}
	}
	return GrayScale;
})();
