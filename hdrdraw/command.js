
var copyImg= function(dst,dst_x,dst_y,src,src_x,src_y,src_w,src_h){
	var dst_data = dst.data;
	var dst_width = dst.width;
	var src_data = src.data;
	var src_width = src.width;
	var dst_idx = 0;
	var src_idx = 0;
	for(var yi=0;yi<src_h;yi++){
		dst_idx = (yi + dst_y) * dst_width + dst_x<<2;
		src_idx = (yi + src_y) * src_width + src_x<<2;
		for(var xi=0;xi<src_w;xi++){
			dst_data[dst_idx+0] = src_data[src_idx+0];
			dst_data[dst_idx+1] = src_data[src_idx+1];
			dst_data[dst_idx+2] = src_data[src_idx+2];
			dst_data[dst_idx+3] = src_data[src_idx+3];
			dst_idx+=4;
			src_idx+=4;
		}

	}
}
var Command = (function(){
	var  Command = function(){};
	var ret = Command;

var createDif=function(layer,left,top,width,height){
	//更新領域の古い情報を保存
	var img = new Img(width,height);
	copyImg(img,0,0,layer.img,left,top,width,height);
	var dif={};
	dif.img=img;
	dif.x=left;
	dif.y=top;
	dif.layer=layer;
	return dif;

}
	var fillStack=[];
	var joined_r,joined_g,joined_b,joined_a;
	var target_r,target_g,target_b,target_a;
	var refresh_left,refresh_top,refresh_bottom,refresh_right;
	var fillCheck = function(target_data,joined_data,idx){
		return (joined_r===joined_data[idx]
		&& joined_g===joined_data[idx+1]
		&& joined_b===joined_data[idx+2]
		&& joined_a===joined_data[idx+3]
		&& target_r===target_data[idx]
		&& target_g===target_data[idx+1]
		&& target_b===target_data[idx+2]
		&& target_a===target_data[idx+3]);
	}
	var fillSub=function(target,y,left,right){
		var ref_data=joined_img.data;
		var target_data=target.data;
		var mode=0;

		//左の端を探す
		var xi = left;
		var yidx = target.width*y<<2;
		for(;xi>=0;xi--){
			var idx2 = yidx + (xi<<2);
			if(fillCheck(target_data,ref_data,idx2)){
				if(mode===0){
					mode=1;
				}
			}else{
				break;
			}
		}
		if(mode===1){
			fillStack.push(y);
			fillStack.push(xi+1);
		}

		for(var xi=left;xi<right;xi++){
			var idx2 = yidx + (xi<<2);
			if(fillCheck(target_data,ref_data,idx2)){
				if(mode===0){
					fillStack.push(y);
					fillStack.push(xi);
					mode=1;
				}
			}else{
				if(mode===1){
					fillStack.push(xi);
					mode=0;
				}
			}
		}

		//右端
		if(mode===1){
			var xi = right-1;
			for(;xi<target.width;xi++){
				var idx2 = yidx + (xi<<2);
				if(fillCheck(target_data,ref_data,idx2)){
				}else{
					break;
				}
			}
			fillStack.push(xi);
		}
	}

	ret.fill=function(layer,point_x,point_y,col){
		fillStack=[];
		var x = point_x|0;
		var y = point_y|0;
		refresh_top=y;
		refresh_bottom=y;
		refresh_left=x;
		refresh_right=x;


		var target= layer.img;
		var idx = y*joined_img.width+x<<2;
		joined_r=joined_img.data[idx];
		joined_g=joined_img.data[idx+1];
		joined_b=joined_img.data[idx+2];
		joined_a=joined_img.data[idx+3];
		target_r=target.data[idx];
		target_g=target.data[idx+1];
		target_b=target.data[idx+2];
		target_a=target.data[idx+3];
		var draw_r =col[0];
		var draw_g =col[1];
		var draw_b =col[2];
		var draw_a =col[3];

		var ref_data = joined_img.data;
		var target_data = target.data;
		if(    target_r === draw_r
			&& target_g === draw_g
			&& target_b === draw_b
			&& target_a === draw_a){
			return;
		}

		var old_img = new Img(target.width,target.height);
		copyImg(old_img,0,0,target,0,0,target.width,target.height);

			//左右の端を探す
			var yidx = target.width*y<<2;
			var idx = yidx + (x<<2);
			var left=x;
			for(;left>=0;left--){
				var idx2 = yidx + (left<<2);
				if(fillCheck(target_data,ref_data,idx2)){
				}else{
					left+=1;
					break;
				}
			}
			var right=x;
			for(;right<target.width;right++){
				var idx2 = yidx + (right<<2);
				if(fillCheck(target_data,ref_data,idx2)){
				}else{
					break;
				}
			}
		fillStack.push(y);
		fillStack.push(left);
		fillStack.push(right);
		
		while(1){
			if(fillStack.length===0){
				break;
			}
			right = fillStack.pop();
			left = fillStack.pop();
			var yi = fillStack.pop();
			//fillFunc(img,x,y);

			//塗りつぶし
			var yidx = target.width*yi<<2;
			for(var xi=left;xi<right;xi++){
				idx = yidx + (xi<<2);
				target_data[idx]=draw_r;
				target_data[idx+1]=draw_g;
				target_data[idx+2]=draw_b;
				target_data[idx+3]=draw_a;
			}

			if(yi>0){
				fillSub(target,yi-1,left,right);
			}
			if(yi<target.height-1){
				fillSub(target,yi+1,left,right);
			}
			refresh_left=Math.min(refresh_left,left);
			refresh_top=Math.min(refresh_top,yi);
			refresh_bottom=Math.max(refresh_bottom,yi+1);
			refresh_right=Math.max(refresh_right,right);
		}

		var width = refresh_right-refresh_left;
		var height= refresh_bottom -refresh_top;

		var log = History.createLog("fill",{"x":point_x,"y":point_y,"color":new Float32Array(col),"layer":layer},"fill("+ point_x +","+point_y+")");
		if(log){
			var layer_img= layer.img;
			layer.img = old_img;
			var dif=createDif(layer,refresh_left,refresh_top,width,height);
			layer.img=layer_img;
			log.difs.push(dif);
		}

		refreshMain(0,refresh_left,refresh_top,refresh_right-refresh_left,refresh_bottom-refresh_top);
		refreshLayer(layer,true);
	}


	ret.pen=function(layer,pen_log,bold,col){
		for(var li=0;li<pen_log.length-1;li++){
			Command.drawLine(layer,pen_log[li],pen_log[li+1],bold,col);
		}
		refreshLayer(layer,true);

	}
	var vec2 =new Vec2();
	var side = new Vec2();
	var dist = new Vec2();
	var clamp=function(value,min,max){
		return Math.min(max,Math.max(min,value));
	}
	ret.drawLine=function(layer,old_p,new_p,bold,col){
		var img= layer.img;
		var data = layer.img.data;
		vec2[0] = new_p[0];
		vec2[1] = new_p[1];

		var left = Math.min(vec2[0],old_p[0]);
		var right= Math.max(vec2[0],old_p[0])+1;
		var top= Math.min(vec2[1],old_p[1]);
		var bottom= Math.max(vec2[1],old_p[1])+1;
		
		left = Math.floor(clamp(left-bold,0,img.width));
		right= Math.ceil(clamp(right+bold,0,img.width));
		top= Math.floor(clamp(top-bold,0,img.height));
		bottom=Math.ceil(clamp(bottom+bold,0,img.height));


		if(pen_log){
			//差分ログ作成
			var command = pen_log;
			var dif=createDif(layer,left,top,right-left,bottom-top);
			if(!command.difs){
				command.difs=[];
			}
			command.difs.push(dif);
		}


		Vec2.sub(vec2,old_p,vec2);
		var l = Vec2.scalar2(vec2);
		if(l!==0){
			Vec2.mul(vec2,vec2,1/l);
		}else{
			Vec2.set(vec2,0,0);
		}
		Vec2.set(side,vec2[1],-vec2[0]);
		Vec2.norm(side);

		var r=col[0];
		var g=col[1];
		var b=col[2];
		var a=col[3];
		for(var dy=top;dy<bottom;dy++){
			for(var dx=left;dx<right;dx++){
				var idx = dy*layer.img.width+ dx<<2;
				dist[0]=dx-new_p[0];
				dist[1]=dy-new_p[1];
				if(Math.abs(Vec2.dot(dist,side))>bold){
					continue;
				}
				l = Vec2.dot(vec2,dist);
				if(l<=0){
					if(Vec2.scalar2(dist)>bold*bold){
						continue;
					}
				}
				if(l>=1){
					dist[0]=dx-old_p[0];
					dist[1]=dy-old_p[1];
					
					if(Vec2.scalar2(dist)>bold*bold){
						continue;
					}
				}
				data[idx+0]=r;
				data[idx+1]=g;
				data[idx+2]=b;
				data[idx+3]=a;
			}
		}

		if(right-left>0 && bottom-top>0){
			//再描画
			refreshMain(0,left,top,right-left,bottom-top);
		}
	}

	return ret;
})();
