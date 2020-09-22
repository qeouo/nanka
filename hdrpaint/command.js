
var PenPoint=function(){
	this.pos=new Vec2();
	this.pressure=1;
}
var Command = (function(){
	var  Command = function(){};
	var ret = Command;

	ret.onlyExecute= function(command,param){
		if(param.layer_id && command !=="changeLayerAttribute"){
			var layer = Layer.findById(param.layer_id);
			if(layer){
				if(layer.lock || !layer.display){
					return;
				}
			}
		}
	
		var log ={"param":param};
		Command[command](log);
	}
	ret.executeCommand = function(command,param,flg){

		if(param.layer_id && command !=="changeLayerAttribute" && command!=="moveLayer"){
			var layer = Layer.findById(param.layer_id);
			if(layer){
				if(layer.lock || !layer.display){
					return null;
				}
			}
		}

		var log = CommandLog.createLog(command,param,flg);
		CommandLog.appendOption();
		Command[log.command](log);
		return log;
	}

	var createDif=function(layer,left,top,width,height){
		//更新領域の古い情報を保存
		var img = new Img(width,height);
		Img.copy(img,0,0,layer.img,left,top,width,height);
		var dif={};
		dif.img=img;
		dif.x=left;
		dif.y=top;
		return dif;
	}

	ret.createDif = createDif;

	ret.pen=function(log,undo_flg){
		//ペン描画
		if(undo_flg){
			return;
		}
		var param = log.param;
		var layer = Layer.findById(param.layer_id);
		var points = param.points;

			painted_mask.fill(0);

		for(var li=1;li<points.length;li++){
			Command.drawHermitian(log,li);
		}
	}

	ret.eraser=function(log,undo_flg){
		//消しゴム描画
		ret.pen(log,undo_flg);
	}

	ret.drawHermitian = (function(){
		var A = new Vec2(),B= new Vec2(),C= new Vec2(),D=new Vec2();
		var q0=new Vec2();
		var q1=new Vec2();
		var _p = [];
		var MAX=32;
		for(var i=0;i<MAX;i++){
			_p.push(new PenPoint());
		}
		var clamp=function(value,min,max){
			return Math.min(max,Math.max(min,value));
		}
		return function(pen_log,n){
			var param=pen_log.param;
			var points = param.points;
			var layer = Layer.findById(param.layer_id);
			if(!layer){
				layer = param.layer;
			}
			var img= layer.img;


			var point0=points[n-1];
			var point1=points[n];
			var p0=point0.pos;
			var p1=point1.pos;
			var param = pen_log.param;


			//補間するための係数を求める
			if(n>=2 ){
				Vec2.sub(A,p0,points[n-2].pos);
				var l1 = Vec2.scalar(A);
				Vec2.sub(B,p1,p0);
				var l2 = Vec2.scalar(B);
				if(l1+l2>0){
					Vec2.mul(q0,A,  (l2/(l1+l2)));
					Vec2.madd(q0,q0,B, (l1/(l1+l2)));
				}
				
			}else{
				Vec2.sub(q0,p1,p0);
			}
			if(n+ 1<points.length) {
				Vec2.sub(A,p1,p0);
				var l1 = Vec2.scalar(A);
				Vec2.sub(B,points[n+1].pos,p1);
				var l2 = Vec2.scalar(B);
				if(l1+l2>0){
					Vec2.mul(q1,A, (l2/(l1+l2)));
					Vec2.madd(q1,q1,B, (l1/(l1+l2)));
				}

			}else{
				Vec2.sub(q1,p1,p0);
				Vec2.madd(q1,q1,q0,-0.5);
			}

			Vec2.copy(D,p0);

			Vec2.copy(C,q0);
			
			Vec2.madd(A,q1,p1,-2);
			Vec2.add(A,A,q0);
			Vec2.madd(A,A,p0,2);

			Vec2.sub(B,p1,A);
			Vec2.sub(B,B,q0);
			Vec2.sub(B,B,p0);


			var dp = point1.pressure - point0.pressure;
			var len = Vec2.len(p1,p0);
			var devide= clamp((len/4)|0,1,MAX-1);

			if(!param.stroke_interpolation){
				//補間しない
				devide=1;
			}
			var _devide=1/devide;

			var wei = param.weight*0.5;
			if(param.pressure_effect_flgs & 1){
				wei *=Math.max(point0.pressure,point1.pressure);
			}
			var left   = img.width;
			var right  = 0;
			var top    = img.height;
			var bottom = 0;

			for(var i=0;i<devide+1;i++){
				var p=_p[i];

				var dt = i*_devide;
				Vec2.mul (p.pos,  A,dt*dt*dt);
				Vec2.madd(p.pos,p.pos,B,dt*dt);
				Vec2.madd(p.pos,p.pos,C,dt);
				Vec2.add (p.pos,p.pos,D);

				p.pressure=point0.pressure + dp*dt;

//				Vec2.sub(p.pos,p.pos,layer.position);

				left   = Math.min(p.pos[0],left);
				right  = Math.max(p.pos[0],right);
				top    = Math.min(p.pos[1],top);
				bottom = Math.max(p.pos[1],bottom);
				
			}

			left = Math.floor(clamp(left -wei,0,img.width-1));
			right= Math.ceil(clamp(right + wei,0,img.width-1));
			top= Math.floor(clamp(top -wei,0,img.height-1));
			bottom=Math.ceil(clamp(bottom + wei,0,img.height-1));

			if(pen_log){
				//差分ログ作成
				var log = pen_log;
				if(!log.undo_data){
					log.undo_data={"difs":[]};
				}
				if(log.undo_data.difs.length<n){
					var dif=createDif(layer,left,top,right-left+1,bottom-top+1);
					log.undo_data.difs.push(dif);
				}
			}

			for(var i=0;i<devide;i++){
				drawPen(layer.img,_p[i],_p[i+1],param);
			}

			//再描画
			layer.refreshImg(left,top,right-left+1,bottom-top+1);

		}
	})();


	Command.loadImageFile_=function(file,n){
		var position = n;
		var fu =function(img){
			var log =Command.executeCommand("loadImageFile",{"file":file.name,"position":position,"img":img});
		}
	 	if(/.*exr$/.test(file.name)){
			Img.loadExr(file,0,fu);
	 	}else if(/^image\//.test(file.type)){
			Img.loadImg(file,0,fu);
	 	}
	}

	var removeNewLayer = function(layer){
		var parent_layer = Layer.findParent(layer);
		var layers = parent_layer.children;
		var idx = layers.indexOf(layer);
		layers.splice(idx,1);
		layer.div.classList.remove("active_layer");
		
		//layer_id_count--;
		if(selected_layer===layer){
			if(idx>0)idx-=1;
			if(layers.length>0){
				layers[idx].select();
			}else{
				Layer.select(null);
			}
				
		}
		parent_layer.refreshDiv();
		parent_layer.refreshImg();
	}
	Command.createNewCompositeLayer=function(log,undo_flg){
		Command.createNewLayer(log,undo_flg);
	}
	Command.createNewLayer=function(log,undo_flg){
		var param = log.param;
		var width = param.width;
		var height= param.height;
		var n= param.position;

		var layer;
		if(undo_flg){
			removeNewLayer(log.undo_data.layer);
			return;
		}
		if(!log.undo_data){
			var img = new Img(width,height);
			var data = img.data;
			for(var i=0;i<data.length;i+=4){
				data[i+0]= 1;
				data[i+1]= 1;
				data[i+2]= 1;
				data[i+3]= 0;
			}

			layer =Layer.create(img,param.composite_flg);
			log.undo_data={"layer":layer};
		}else{
			layer = log.undo_data.layer;
		}
		var parentLayer = Layer.findById(param.parent);

		parentLayer.append(n,layer);
		Layer.select(layer);

		return layer;

	}


	Command.moveLayer=function(log,undo_flg){

		var param = log.param;
		var layer = Layer.findById(param.layer_id);
		var now_parent_layer= Layer.findParent(layer);
		var layers =now_parent_layer.children;
		var next_parent_layer = param.parent_layer_id;
		var position = param.position;
		var layer_num = layers.indexOf(layer);

		if(undo_flg){
			position = log.undo_data.before;
			next_parent_layer= log.undo_data.before_parent;
		}
		next_parent_layer = Layer.findById(next_parent_layer);
		
		if(position<0|| layers.length < position){
			return;
		}	
		if(layer_num === position && now_parent_layer === next_parent_layer){
			return;
		}	

		now_parent_layer.children.splice(layer_num,1);
		now_parent_layer.bubbleComposite();

		var layers_container = layer.div.parentNode;

		next_parent_layer.append(position,layer);

		if(!log.undo_data){
			log.undo_data = {"before":layer_num,"before_parent":now_parent_layer.id};
		}
	}


	Command.changeLayerAttribute=function(log,undo_flg){
		var param = log.param;
		var name = param.name;
		var value = param.value;
		var layer = Layer.findById(param.layer_id);

		if(undo_flg){
			value = log.undo_data.value;
		}
		if(!log.undo_data){
			log.undo_data = {"value" :layer[name]};
		}
		layer[name] = value;

		layer.refreshDiv();
		layer.refreshImg();
	}

	Command.loadImageFile=function(log,undo_flg){
		var param = log.param;
		var n  = param.position;
		var img = log.param.img;
		var file  = param.file;

		var pos_layer = Layer.findById(n);
		var parent_layer = pos_layer;
		if(pos_layer.type === 1){
			parent_layer = pos_layer;
			n = parent_layer.children.length;
		}else{
			parent_layer = Layer.findParent(pos_layer);
			n = parent_layer.children.indexOf(pos_layer)+1;
		}


		var layer;
		if(undo_flg){
			removeNewLayer(log.undo_data.layer);
			return;
		}
		if(!log.undo_data){
			log.param.img=null;
			layer=Layer.create(img);
			log.undo_data={"layer":layer};
		}else{
			layer=log.undo_data.layer;
		}
		parent_layer.append(n,layer);

		//layer.img=img;
		layer.name = file;

		layer.refreshDiv();
		Layer.select(layer);
		layer.registRefreshThumbnail();

		return layer;
	}

	var flgdata=[];
	Command.resizeCanvas=function(log,undo_flg){
		var width = log.param.width;
		var height = log.param.height;
		var old_width=preview.width;
		var old_height=preview.height;

		if(undo_flg){
			width = log.undo_data.width;
			height = log.undo_data.height;
		}
		if(!log.undo_data){
			log.undo_data = {"width":old_width,"height":old_height};
		}

		preview.width=width;
		preview.height=height

		preview_ctx_imagedata=preview_ctx.createImageData(width,height);
		horizon_img = new Img(width,height);
		bloomed_img = new Img(width,height);
		bloom_img = new Img(width,height);

		root_layer.img=new Img(width,height);

		inputs["canvas_width"].value = root_layer.img.width;
		inputs["canvas_height"].value = root_layer.img.height;

		root_layer.composite();
	}


	Command.composite=function(log,undo_flg){
		//グループレイヤの子レイヤをすべて結合して通常レイヤにする

		var param = log.param;

		if(undo_flg){
			var undo_data=log.undo_data;
			var layer = undo_data.layer;
			layer.children = undo_data.children;
			layer.type=1;
			layer.refreshDiv();
			return;
		}
		var layer = Layer.findById(param.layer_id);

		//差分ログ作成
		if(!log.undo_data){
			log.undo_data={"layer":layer,"children":layer.children};
		}
		layer.type=0;
		layer.children=[];

		layer.refreshDiv();
		//layer.refreshImg();
	}
	Command.joinLayer=function(log,undo_flg){
		//レイヤ結合

		var param = log.param;

		if(undo_flg){
			var undo_data=log.undo_data;
			//width=log.undo_data.width;
			//height=log.undo_data.height;
			removeNewLayer(undo_data.layer);
			root_layer.append(undo_data.position,undo_data.layerA);
			root_layer.append(undo_data.positionB,undo_data.layerB);
			return;
		}

		var layer;
		var layerA = Layer.findById(param.layer_id);
		var layerB = Layer.findById(param.layer_id2);
		var parent_layer = Layer.findParent(layerA);
		var layers = parent_layer.children;
		var ls=[layerA,layerB];

		if(!log.undo_data){

			var x=Math.min(layerA.position[0] ,layerB.position[0]);
			var y=Math.min(layerA.position[1] ,layerB.position[1]);
			var right = Math.max(layerA.position[0]+layerA.img.width,layerB.position[0]+layerB.img.width);
			var bottom = Math.max(layerA.position[1]+layerA.img.height,layerB.position[1]+layerB.img.height);
			var width  = right-x;
			var height= bottom-y;
			var position = layers.indexOf(layerA);
			var position2 = layers.indexOf(layerB);
			log.undo_data={"layerA":layerA,"position":position,"layerB":layerB,"positionB":position2};

			var img = new Img(width,height);
			layer =Layer.create(img,1);
			layer.position[0]=x;
			layer.position[1]=y;
			layer.append(0,layerB);
			Vec2.sub(layerB.position,layerB.position,layer.position);
			Vec2.sub(layerA.position,layerA.position,layer.position);
			layer.append(1,layerA);
			layer.composite();
			layer.type=0;
			layer.children=[];


//			//レイヤ合成
//			for(var li=0;li<ls.length;li++){
//				var layer = ls[li];
//
//				var layer_img_data = layer.img.data;
//				var layer_alpha=layer.alpha;
//				var layer_power=Math.pow(2,layer.power);
//				var layer_img_width = layer.img.width;
//				var func = funcs["normal"];
//				var layer_position_x= layer.position[0] -x;
//				var layer_position_y= layer.position[1] -y;
//
//				//レイヤごとのクランプ
//				var left2 = Math.max(0,layer.position[0]);
//				var top2 = Math.max(0,layer.position[1]);
//				var right2 = Math.min(layer.img.width + layer_position_x ,width);
//				var bottom2 = Math.min(layer.img.height + layer_position_y ,height);
//
//				for(var yi=top2;yi<bottom2;yi++){
//					var idx = yi * width + left2 << 2;
//					var max = yi * width + right2 << 2;
//					var idx2 = (yi-layer_position_y) * layer_img_width + left2 - layer_position_x << 2;
//					for(;idx<max;idx+=4){
//						func(img.data,idx,layer_img_data,idx2,layer_alpha,layer_power);
//						idx2+=4;
//					}
//				}
//			}
			layer.name=layerA.name + "+" + layerB.name;

			log.undo_data.layer=layer;
		}else{
			layer = log.undo_data.layer;
		}
		for(var li=0;li<ls.length;li++){
			var n=layers.indexOf(ls[li]);
			layers.splice(n,1);
		}

		parent_layer.append(n,layer);
		layer.refreshDiv();
		parent_layer.refreshDiv();

		refreshMain(0,layer.position[0],layer.position[1],layer.img.width,layer.img.height);

		Layer.select(layer);

	}
	Command.resizeLayer=function(log,undo_flg){

		var param = log.param;

		if(param.layer_id===-1){
			//全レイヤ一括の場合バッチ化
			var logs =[];
			var layers = Layer.layerArray();
			for(var li=0;li<layers.length;li++){
				var layer = layers[li];
				var _log = new CommandLog();
				_log.command="resizeLayer";
				_log.param={"layer_id":layer.id,"width":param.width,"height":param.height};
				logs.push(_log);
			}
			log.command="multiCommand";
			log.param={"logs":logs};

			Command[log.command](log);
			return;
		}

		var layer = Layer.findById(param.layer_id);
		var img = layer.img;
		if(!img){
			return;
		}
		var old_width=img.width;
		var old_height=img.height;
		var width  = param.width;
		var height= param.height;

		if(undo_flg){
			width=log.undo_data.width;
			height=log.undo_data.height;
		}
		
		//差分ログ作成
		if(!log.undo_data){
			log.undo_data = {"width":old_width,"height":old_height};
			var dx = old_width-width;
			var dy = old_height-height;
			log.undo_data.difs=[];
			
			var dif;
			if(dx>0){
				dif=createDif(layer,width,0,dx,old_height);
				log.undo_data.difs.push(dif);
			}
			if(dy>0){
				dif=createDif(layer,0,height,old_width,dy);
				log.undo_data.difs.push(dif);
			}
		}
		var old_img = img;

		layer.img=new Img(width,height);
		Img.copy(layer.img,0,0,old_img,0,0,old_img.width,old_img.height);
		layer.refreshDiv();
		layer.registRefreshThumbnail();
		layer.parent.bubbleComposite();
	}

	Command.multiCommand=function(_log,undo_flg){
		var logs = _log.param.logs
		if(undo_flg){
			for(var li=logs.length;li--;){
				var log = logs[li];
				Command[log.command](log,true);

				var difs = log.undo_data.difs;
				if(difs){
					//画像戻す
					var param = log.param;
					var layer_id= param.layer_id;
					var layer = Layer.findById(param.layer_id);

					for(var di=difs.length;di--;){
						var dif = difs[di];
						Img.copy(layer.img,dif.x,dif.y,dif.img,0,0,dif.img.width,dif.img.height);
					}
				}
			}
		}else{
			if(!_log.undo_data){
				_log.undo_data={};
			}
			for(var li=0;li<logs.length;li++){
				var log = logs[li];
				Command[log.command](log);
			}
		}

	}
	Command.deleteLayer=function(log,undo_flg){

		if(undo_flg){
			var layer = log.undo_data.layer;
			var idx = log.undo_data.position;
			var parent_layer = Layer.findById(log.undo_data.parent);

			parent_layer.append(idx,layer);
			return;
		}
		var layer_id = log.param.layer_id;

		var layer = Layer.findById(layer_id);
		var parent_layer = Layer.findParent(layer);
		if(parent_layer){
			var layers = parent_layer.children;
			var idx=  layers.indexOf(layer);

			if(!log.undo_data){
				log.undo_data ={"layer":layer,"position":idx,"parent":parent_layer.id};
			}

			//レイヤ削除
			 if(idx<0){
				 return;
			 }
			 

			layers.splice(idx,1);
			layer.div.classList.remove("active_layer");
			parent_layer.refreshDiv();


			if(layer === selected_layer){
				idx = Math.max(idx-1,0);
				if(layers.length){
					Layer.select(layers[idx]);
				}
			}else{
				Layer.select(null);
			}
		}
		if(parent_layer){
			parent_layer.bubbleComposite();
		}
	}
	return ret;
})();
	var clamp=function(value,min,max){
		return Math.min(max,Math.max(min,value));
	}

	var vec2 =new Vec2();
	var side = new Vec2();
	var dist = new Vec2();

	var brush_blend=function(dst,idx,pressure,dist,flg,weight,param){
		var alpha_mask = param.alpha_mask;
		var color = param.color;
		var sa = color[3] * param.alpha; 
		if(param.eraser){
			sa = param.alpha;
		}
		if(param.alpha_pressure_effect){
			sa *= pressure;
		}
		var l = Vec2.scalar(dist);
		if(param.softness){
			sa = sa  * Math.min(1,( weight - (weight*l))/(weight*param.softness));
		}else{
			if(param.antialias){
				sa = sa  * Math.min(1,( weight - (weight*l)));
			}	
		}
		if(param.eraser){
			if(param.overlap===2){
				dst[idx+3]=(1-sa) * (1-param.alpha);
			return;
			}
		}

		if(param.overlap===2){
			dst[idx+0] =  color[0] ;
			dst[idx+1] =  color[1] ;
			dst[idx+2] =  color[2] ;
			if(!alpha_mask){
				dst[idx+3] =  sa ;
			}
			return;
		}

		if(param.overlap==0){
			if(flg[idx>>2]>=sa){
				return;
			}
			var olda =flg[idx>>2];
			flg[idx>>2]=sa;
			sa = (sa - olda)/(1-olda);
		}
		if(param.eraser){
			dst[idx+3] = dst[idx+3] * (1-sa) + 0* sa;
			return;
		}

		var da = dst[idx+3]*(1-sa);
		if(!alpha_mask){
			dst[idx+3] = da + sa;
		}

		if( dst[idx+3] && !param.eraser){
			var rr = 1/dst[idx+3];
			da*=rr;
			sa*=rr;
			dst[idx+0] += (dst[idx+0] * (-1+da) + color[0] * sa);
			dst[idx+1] += (dst[idx+1] * (-1+da) + color[1] * sa);
			dst[idx+2] += (dst[idx+2] * (-1+da) + color[2] * sa);
		}
	}
	var drawPen=function(img,point0,point1,param){
		var weight = param.weight;
		var pressure_mask = param.pressure_effect_flgs;
		var softness= param.softness;
		//描画
		var img_data = img.data;
	
		weight*=0.5;

		var weight_pressure_effect = pressure_mask&1;
		var alpha_pressure_effect = (pressure_mask&2)>>1;
		var pos1 = point1.pos;
		var pos0 = point0.pos;

		var pressure_0=point0.pressure;
		var d_pressure=point1.pressure - point0.pressure;

		var weight_0pow2 = weight  *( ( pressure_0 - 1)*weight_pressure_effect + 1);
		var weight_1pow2 = weight  *( (d_pressure + pressure_0 - 1)*weight_pressure_effect + 1);
		var max_weight = Math.max(weight_0pow2,weight_1pow2);
		var weight_0pow2 = weight_0pow2 * weight_0pow2;
		var weight_1pow2 = weight_1pow2 * weight_1pow2;

		var left = Math.min(pos1[0],pos0[0]);
		var right= Math.max(pos1[0],pos0[0])+1;
		var top= Math.min(pos1[1],pos0[1]);
		var bottom= Math.max(pos1[1],pos0[1])+1;
		
		left = Math.floor(clamp(left-max_weight,0,img.width));
		right= Math.ceil(clamp(right+max_weight,0,img.width));
		top= Math.floor(clamp(top-max_weight,0,img.height));
		bottom=Math.ceil(clamp(bottom+max_weight,0,img.height));

		Vec2.sub(vec2,pos1,pos0);
		var l = Vec2.scalar2(vec2);
		if(l!==0){
			Vec2.mul(vec2,vec2,1/l);
		}else{
			Vec2.set(vec2,0,0);
		}
		Vec2.set(side,vec2[1],-vec2[0]);
		Vec2.norm(side);


		drawfunc=brush_blend;
		for(var dy=top;dy<bottom;dy++){
			for(var dx=left;dx<right;dx++){
				dist[0]=dx-pos0[0]+0.5;
				dist[1]=dy-pos0[1]+0.5;
				var dp = Vec2.dot(vec2,dist);
				var l=0;
				var l2=0;
				var local_pressure=0;
				if(dp<=0){
					//始点より前
					
					if(Vec2.scalar2(dist)>=weight_0pow2){
						continue;
					}
					dp=0;
					l = Vec2.scalar(dist);
					local_pressure = d_pressure * dp + pressure_0 ;
					local_weight = weight  *( (local_pressure - 1)*weight_pressure_effect + 1);
				}else if(dp>=1){
					//終端より後

					dist[0]=dx-pos1[0]+0.5;
					dist[1]=dy-pos1[1]+0.5;
					
					if(Vec2.scalar2(dist)>=weight_1pow2){
						continue;
					}
					dp=1;
					l = Vec2.scalar(dist);
					local_pressure = d_pressure * dp + pressure_0 ;
					local_weight = weight  *( (local_pressure - 1)*weight_pressure_effect + 1);
				}else{
					//線半ば
					
					local_pressure = d_pressure * dp + pressure_0 ;
					local_weight = weight  *( (local_pressure - 1)*weight_pressure_effect + 1);
					l = Vec2.dot(dist,side);
					if(l*l>=local_weight*local_weight){
						//線幅より外の場合
						continue;
					}
					Vec2.mul(dist,side,l);
					l=Math.abs(l);
				}
				var idx = dy*img.width+ dx|0;

				Vec2.mul(dist,dist,1/local_weight);
				drawfunc(img_data,idx<<2,local_pressure,dist,painted_mask,local_weight,param);
			}
		}

	}

