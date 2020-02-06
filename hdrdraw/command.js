
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
		var yidx = joined_img.width*y <<2;
		var mode=0;
		for(var xi=left;xi<right;xi++){
			var idx2 = yidx + (xi<<2);
			if(fillCheck(target_data,ref_data,idx2)){
				if(mode===0){
					fillStack.push(xi);
					fillStack.push(y);
					mode=1;
				}
			}else{
				mode=0;
			}
		}
	}

	ret.fill=function(layer,x,y,col){
		fillStack=[];
		refresh_top=y;
		refresh_bottom=y;
		refresh_left=x;
		refresh_right=x;
		fillStack.push(x);
		fillStack.push(y);
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
		
		while(1){
			if(fillStack.length===0){
				break;
			}
			y = fillStack.pop();
			x = fillStack.pop();
			//fillFunc(img,x,y);

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
			for(var xi=left;xi<right;xi++){
				idx = yidx + (xi<<2);
				target_data[idx]=draw_r;
				target_data[idx+1]=draw_g;
				target_data[idx+2]=draw_b;
				target_data[idx+3]=draw_a;
			}

			if(y>0){
				fillSub(target,y-1,left,right);
			}
			if(y<target.height-1){
				fillSub(target,y+1,left,right);
			}
			refresh_left=Math.min(refresh_left,left);
			refresh_top=Math.min(refresh_top,y);
			refresh_bottom=Math.max(refresh_bottom,y+1);
			refresh_right=Math.max(refresh_right,right);
		}

		var width = refresh_right-refresh_left;
		var height= refresh_bottom -refresh_top;

		var log = History.createLog("fill",{"x":x,"y":y,"color":col,"layer":layer});
		if(log){
			var layer_img= layer.img;
			layer.img = old_img;
			var dif=createDif(layer,refresh_left,refresh_top,width,height);
			layer.img=layer_img;
			log.difs.push(dif);
		}

		refreshMain(0,refresh_left,refresh_top,refresh_right-refresh_left,refresh_bottom-refresh_top);
	}


	ret.pen=function(layer,pen_log,bold,col){
		for(var li=0;li<pen_log.length-1;li++){
			Command.drawLine(layer,pen_log[li],pen_log[li+1],bold,col);
		}
	}
	var vec2 =new Vec2();
	var side = new Vec2();
	var dist = new Vec2();
	ret.drawLine=function(layer,old_p,new_p,bold,col){
		var layer = selected_layer;
		var img= layer.img;
		var data = layer.img.data;
		vec2[0] = new_p[0];
		vec2[1] = new_p[1];

		var left = Math.min(vec2[0],old_p[0]);
		var right= Math.max(vec2[0],old_p[0])+1;
		var top= Math.min(vec2[1],old_p[1]);
		var bottom= Math.max(vec2[1],old_p[1])+1;
		
		left = Math.max(left-bold,0);
		right= Math.min(right+bold,img.width);
		top= Math.max(top-bold,0);
		bottom=Math.min(bottom+bold,img.height);


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

 //レイヤ削除
ret.deleteLayer=function(layer){
	var li=layers.indexOf(layer);
	 if(li<0){
		 return;
	 }
	 

	layers.splice(li,1);
	layer.div.parentNode.removeChild(layer.div);
	layer.div.classList.remove("active_layer");

	createLog("deleteLayer",{"layer":layer,"idx":li});

	if(layer === selected_layer){
		li = Math.max(li-1,0);
		if(layers.length){
			selected_layer = layers[li]
			Util.fireEvent(selected_layer.div,"click");
		}
	}else{
		selected_layer = null;
	}


	refreshMain();
}
	ret.createLayer=function(img,idx){
		if( typeof idx=== 'undefined'){
			idx=layers.length;
		}
		if(idx<0){
			idx=layers.length;
		}
		var layer_template= document.getElementById("layer_template");
		var layer = new Layer();
		var layer_div = layer_template.children[0].cloneNode(true);
		layer_div.addEventListener("click",layerSelect);
		layer.div=layer_div;

		

		layer.img=img;

		if(canvas.width<img.width || canvas.height<img.height){
			//開いた画像がキャンバスより大きい場合は広げる
			if(canvas.width<img.width){
				canvas.width=img.width;
				preview.width=img.width;
			}
			if(canvas.height<img.height){
				canvas.height=img.height;
				preview.height=img.height;
			}
			ctx_imagedata=ctx.createImageData(canvas.width,canvas.height);
			joined_img = new Img(canvas.width,canvas.height);
			horizon_img = new Img(canvas.width,canvas.height);
			bloomed_img= new Img(canvas.width,canvas.height);
			bloom_img = new Img(canvas.width,canvas.height); 

		}
		layer.name ="new_layer";


		if(!selected_layer){
			Util.fireEvent(layer_div,"click");
		}

		layers.splice(idx,0,layer);

		var layers_container = document.getElementById("layers_container");
		for(var li=layers.length;li--;){
			layers_container.appendChild(layers[li].div);
		}



		History.createLog("createLayer",{"layer":layer,"idx":idx});
		 return layer;

	}
	return ret;
})();
