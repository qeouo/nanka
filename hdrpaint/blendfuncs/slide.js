Hdrpaint.blendfuncs["slide"] = function(dst,d_idx,src,s_idx,alpha,power,layer,dst2){
	//var src_alpha=src[s_idx+3]*alpha;
	//var dst_r = (1-src_alpha);
	//var src_r = power*src_alpha;
	var x = src[s_idx+0]-0.5;
	var y = src[s_idx+1]-0.5;
	var z = src[s_idx+2]-0.5;

	var pow = power*10;
	x = x* pow|0;
	y = y* pow|0;
	z = z* pow|0;

	var d_idx2 = d_idx + ((x + y*layer.img.width)<<2);
	dst[d_idx+0]=dst2.data[d_idx2+0] ;
	dst[d_idx+1]=dst2.data[d_idx2+1] ;
	dst[d_idx+2]=dst2.data[d_idx2+2] ;
	dst[d_idx+3]=dst2.data[d_idx2+3] ;
}
