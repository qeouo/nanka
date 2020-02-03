var createLog=function(obj){
	var log={};
	log.obj=obj;

	var option=document.createElement("option");
	option.innerHTML = ""+obj;
	log.option=option;
	command_history.push(log);
	inputs["history"].appendChild(option);
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

	var fill=function(layer,x,y,col){
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

		while(1){
			if(fillStack.length===0){
				break;
			}
			y = fillStack.pop();
			x = fillStack.pop();
			//fillFunc(img,x,y);

			var yidx = target.width*y<<2;
			var idx = yidx + (x<<2);
			var ref_data = joined_img.data;
			var target_data = target.data;
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
			var draw_r =col[0];
			var draw_g =col[1];
			var draw_b =col[2];
			var draw_a =col[3];
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
		refreshMain(0,refresh_left,refresh_top,refresh_right-refresh_left,refresh_bottom-refresh_top);
	}
	var vec2 =new Vec2();
	var side = new Vec2();
	var dist = new Vec2();
	var drawLine=function(layer,old_p,new_p,bold,col){
		var layer = selected_layer;
		var img= layer.img;
		var data = layer.img.data;
		vec2[0] = new_p[0];
		vec2[1] = new_p[1];

		var left = Math.min(vec2[0],old_p[0]);
		var right= Math.max(vec2[0],old_p[0]);
		var top= Math.min(vec2[1],old_p[1]);
		var bottom= Math.max(vec2[1],old_p[1]);
		
		left = Math.max(left-bold,0);
		right= Math.min(right+bold,img.width);
		top= Math.max(top-bold,0);
		bottom=Math.min(bottom+bold,img.height);

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
			//çƒï`âÊ
			refreshMain(0,left,top,right-left,bottom-top);
		}
	}
