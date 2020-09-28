Hdrpaint.blendfuncs["shift"] = function(dst,d_idx,src,s_idx,alpha,power,x,y,dstlayer,srclayer,dst2){
	//var src_alpha=src[s_idx+3]*alpha;
	//var dst_r = (1-src_alpha);
	//var src_r = power*src_alpha;
	var sx = src[s_idx+0]-0.5;
	var sy = src[s_idx+1]-0.5;
	var sz = src[s_idx+2]-0.5;

	var pow = power*10;
	sx = sx* pow|0;
	sy = sy* pow|0;
	sz = sz* pow|0;

	var d_idx2 = dst2.getIndexLoop(x+sx,y+sy)<<2;

	dst[d_idx+0]=dst2.data[d_idx2+0] ;
	dst[d_idx+1]=dst2.data[d_idx2+1] ;
	dst[d_idx+2]=dst2.data[d_idx2+2] ;
	dst[d_idx+3]=dst2.data[d_idx2+3] ;
}
