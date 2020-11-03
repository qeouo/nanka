Hdrpaint.modifier["gauss"] = (function(){
	var gaussgen= function(){
		Layer.apply(this);
		this.scale=16;
		this.cache={};
		this.cache.horizon_img= new Img(1024,1024);
	};
	var ret = gaussgen;
	inherits(ret,Layer);

	ret.prototype.typename="gauss";

	var src;

	ret.prototype.before=function(area){
		area[0]-=this.scale*2;
		area[1]-=this.scale*2;
		area[2]+=this.scale*4;
		area[3]+=this.scale*4;
	}

	ret.prototype.init=function(img,composite_area){

		composite_area[0]+=this.scale;
		composite_area[1]+=this.scale;
		composite_area[2]-=this.scale*2;
		composite_area[3]-=this.scale*2;
		var x = composite_area[0];
		var y = composite_area[1];
		var w = composite_area[2];
		var h = composite_area[3];
		src = img;
		var scale = this.scale;
		var horizon_img = this.cache.horizon_img;
		if(horizon_img.data.width*horizon_img.data.height
			< src.data.width * src.data.height){
			horizon_img = this.cache.horizon_img = new Img(src.data.width,src.data.height);
			
		}
		horizon_img.width=src.width;
		horizon_img.height=src.height;
		this.gauss(scale,scale,-img.offsetx+x,-img.offsety+y,w,h);
		
	}
	ret.prototype.getPixel = function(ret,x,y){
		var a =src.getIndex(x,y)<<2;
		ret[0] = src.data[a];
		ret[1] = src.data[a+1];
		ret[2] = src.data[a+2];
		ret[3] = src.data[a+3];
		
	}

	var add=function(dst,src,idx,idx2,idx3,r){
		var a2 = src[idx2+3];
		var a3 = src[idx3+3];
		dst[idx+0]+=(src[idx2+0]*a2 +src[idx3+0]*a3)*r;
		dst[idx+1]+=(src[idx2+1]*a2 +src[idx3+1]*a3)*r;
		dst[idx+2]+=(src[idx2+2]*a2 +src[idx3+2]*a3)*r;
		dst[idx+3]+=(a2 +a3)*r;
	}
	var mul=function(dst,idx){
		var a = dst[idx+3];
		if(a===0 || a===1){
			return;
		}
		a=1/a;
		dst[idx+0]*=a;
		dst[idx+1]*=a;
		dst[idx+2]*=a;
	}
ret.prototype.gauss=function(d,size,left,top,w,h){
	var MAX = size|0;
	var horizon_img = this.cache.horizon_img;
	var dst= horizon_img;
	var right = left+w-1;
	var bottom= top+h+1;
	

	//係数作成
	var weight = new Array(MAX);
	var t = 0.0;
	for(var i = 0; i < weight.length; i++){
		var r = 1.0 +  i;
		var we = Math.exp(- (r * r) / (2*d*10.0));
		weight[i] = we;
		if(i > 0){we *= 2.0;}
		t += we;
	}
	for(i = 0; i < weight.length; i++){
		weight[i] /= t;
	}

	var height = src.height;
	var width = src.width;
	var data = src.data;
	var dstdata = dst.data;
	//横ぼかし
	var top2 = Math.max(0,top-size);
	var bottom2 = Math.min(src.height,bottom+size+1);
	for(var y=top2;y<bottom2;y++){
		var yidx= y * width;
		var x = left;
		var idx = yidx + left <<2;
		var max = yidx + right+1 <<2;
		var r = weight[0];
		for(;idx<max;idx+=4){
			var a =data[idx+3]*r;
			dstdata[idx+0]=data[idx+0]*a;
			dstdata[idx+1]=data[idx+1]*a;
			dstdata[idx+2]=data[idx+2]*a;
			dstdata[idx+3]=a;
		}
		max = Math.min(MAX,right+1);
		for(;x<max;x++){
	 		var idx= yidx + x <<2;
			for(var i=1;i<MAX;i++){
	 			var idx2= yidx + Math.max(x -i,0) <<2;
	 			var idx3= yidx + Math.min(x +i,width-1) <<2;
				var r = weight[i];
				add(dstdata,data,idx,idx2,idx3,r);
			}
		}

		max = Math.min(width-MAX,right+1);
		for(;x<max;x++){
	 		var idx= yidx + x <<2;
	  		for(var i=1;i<MAX;i++){
				add(dstdata,data,idx,idx+(i<<2),idx-(i<<2),weight[i]);
			}
		}
		var max = Math.min(right+1,width);
		for(;x<max;x++){
	 		var idx= yidx + x <<2;
			for(var i=1;i<MAX;i++){
	 			var idx2= yidx + Math.max(x -i,0) <<2;
	 			var idx3= yidx + Math.min(x +i,width-1) <<2;
				var r = weight[i];
				add(dstdata,data,idx,idx2,idx3,r);
			}
		}

		idx = yidx + left <<2;
		max = yidx + right+1 <<2;
		for(;idx<max;idx+=4){
			mul(dstdata,idx);
		}
	}

	//縦ぼかし
	data = dst.data;
	dstdata = src.data;

	for(var x=left;x<right+1;x++){

		var idx = top*width + x<<2;
		var max = (bottom+1)*width+ x<<2;
		var r = weight[0];
		for(;idx<max;idx+=width*4){
			var a =data[idx+3]*r;
			dstdata[idx+0]=data[idx+0]*a;
			dstdata[idx+1]=data[idx+1]*a;
			dstdata[idx+2]=data[idx+2]*a;
			dstdata[idx+3]=a;
		}
	
		y=top
		max = Math.min(MAX,bottom+1);
		for(;y<max;y++){
	 		idx= y * width + x <<2;

			for(var i=1;i<MAX;i++){
	 			var idx2= Math.max(y-i,0) *width+ x  <<2;
	 			var idx3= Math.min(y+i,height-1)*width+x <<2;
				var r = weight[i];
				add(dstdata,data,idx,idx2,idx3,r);
			}
		 }
		max = Math.min(height-MAX,bottom+1);
		for(;y<max;y++){
	 		idx= y * width + x <<2;

			for(var i=1;i<MAX;i++){
	 			var idx2= (y-i) *width+ x  <<2;
	 			var idx3= (y+i)*width+x <<2;
				var r = weight[i];
				add(dstdata,data,idx,idx2,idx3,r);
			}
		}

		max = Math.min(height,bottom+1);
		for(;y<max;y++){
	 		idx= y * width + x <<2;

			for(var i=1;i<MAX;i++){
	 			var idx2= Math.max(y-i,0) *width+ x  <<2;
	 			var idx3= Math.min(y+i,height-1)*width+x <<2;
				var r = weight[i];
				add(dstdata,data,idx,idx2,idx3,r);
			}
		}

		var idx = top*width + x<<2;
		var max = (bottom+1)*width+ x<<2;
		for(;idx<max;idx+=width*4){
			mul(dstdata,idx);
		}
	 }

}

	var html = `
			ぼかし半径:<input class="slider modifier_scale" title="scale" value="32" min="1" max="128"><br>
		`;
	Hdrpaint.addModifierControl("gauss",html);
	Slider.init();

	return ret;
})();

