
var Layer=(function(){
//レイヤ
	var Layer = function(){
		this.name="";
		this.display = true;
		this.power=0.0;
		this.alpha=1.0;
		this.blendfunc="normal";
		this.div=null;
		this.img=null;
		this.mask_alpha=0;
		this.position =new Vec2();

		this.type=0; //1なら階層レイヤ
		this.layers=null; //子供レイヤ
	};
	var ret = Layer;
	return ret;
})();

var funcs=[];
funcs["normal"] = function(dst,dst_idx,src,src_idx,alpha,power){
	var src_alpha=src[src_idx+3]*alpha;
	var dst_r = (1 - src_alpha);
	var src_r = power*src_alpha;

	dst[dst_idx+0]=dst[dst_idx+0] * dst_r +  src[src_idx+0]*src_r;
	dst[dst_idx+1]=dst[dst_idx+1] * dst_r +  src[src_idx+1]*src_r;
	dst[dst_idx+2]=dst[dst_idx+2] * dst_r +  src[src_idx+2]*src_r;
	dst[dst_idx+3]=dst[dst_idx+3] * dst_r +  src_alpha;
}
funcs["mul"] = function(dst,dst_idx,src,src_idx,alpha,power){
	var src_alpha=src[src_idx+3]*alpha;
	var dst_r = (1-src_alpha);
	var src_r = power*src_alpha;

	dst[dst_idx+0]=dst[dst_idx+0] * (dst_r +  src[src_idx+0]*src_r);
	dst[dst_idx+1]=dst[dst_idx+1] * (dst_r +  src[src_idx+1]*src_r);
	dst[dst_idx+2]=dst[dst_idx+2] * (dst_r +  src[src_idx+2]*src_r);
}
funcs["transmit"] = function(dst,dst_idx,src,src_idx,alpha,power){
	var src_alpha=src[src_idx+3]*alpha;
	var dst_r = (1-src_alpha);
	var src_r = power*src_alpha;

	dst[dst_idx+0]=dst[dst_idx+0] * dst_r * src[src_idx+0]+  src[src_idx+0]*src_r;
	dst[dst_idx+1]=dst[dst_idx+1] * dst_r * src[src_idx+1]+  src[src_idx+1]*src_r;
	dst[dst_idx+2]=dst[dst_idx+2] * dst_r * src[src_idx+2]+  src[src_idx+2]*src_r;
	dst[dst_idx+3]=dst[dst_idx+3] * dst_r +  src_alpha;
}
funcs["add"] = function(dst,dst_idx,src,src_idx,alpha,power){
	var src_alpha=src[src_idx+3]*alpha;
	var dst_r = (1-src_alpha);
	var src_r = power*src_alpha;

	dst[dst_idx+0]=dst[dst_idx+0]  + src[src_idx+0]*src_r;
	dst[dst_idx+1]=dst[dst_idx+1]  + src[src_idx+1]*src_r;
	dst[dst_idx+2]=dst[dst_idx+2]  + src[src_idx+2]*src_r;
}

funcs["sub"] = function(dst,dst_idx,src,src_idx,alpha,power){
	var src_alpha=src[src_idx+3]*alpha;
	var dst_r = (1-src_alpha);
	var src_r = power*alpha;

	dst[dst_idx+0]=dst[dst_idx+0]  - src[src_idx+0]*src_r;
	dst[dst_idx+1]=dst[dst_idx+1]  - src[src_idx+1]*src_r;
	dst[dst_idx+2]=dst[dst_idx+2]  - src[src_idx+2]*src_r;
}
Layer.prototype.composite=function(left,top,right,bottom){

	var layers=this.layers;
	if(!layers){
		return;
	}
	var img = this.img;
	var img_data = img.data;
	var img_width = img.width;
	
		for(var yi=top;yi<bottom;yi++){
			var idx = yi * img_width + left << 2;
			var max = yi * img_width + right << 2;
			for(;idx<max;idx+=4){
				img_data[idx+0]=0;
				img_data[idx+1]=0;
				img_data[idx+2]=0;
				img_data[idx+3]=0;
			}
		}

	for(var li=0;li<layers.length;li++){
		var layer = layers[li];

		if(!layer.img){
			continue;
		}

		//子グループレイヤを更新
		layer.update_flg=1;
		if(layer.type==1 && layer.update_flg){
			layer.composite(left,top,right,bottom);
			layer.update_flg=0;
		}

		if(!layer.display){
			//非表示の場合スルー
			continue;
		}

		var layer_img_data = layer.img.data;
		var layer_alpha=layer.alpha;
		var layer_power=Math.pow(2,layer.power);
		var layer_img_width = layer.img.width;
		var func = funcs[layer.blendfunc];
		var layer_position_x= layer.position[0];
		var layer_position_y= layer.position[1];

		//レイヤごとのクランプ
		var left2 = Math.max(left,layer.position[0]);
		var top2 = Math.max(top,layer.position[1]);
		var right2 = Math.min(layer.img.width + layer_position_x ,right);
		var bottom2 = Math.min(layer.img.height + layer_position_y ,bottom);

		for(var yi=top2;yi<bottom2;yi++){
			var idx = yi * img_width + left2 << 2;
			var max = yi * img_width + right2 << 2;
			var idx2 = (yi-layer_position_y) * layer_img_width + left2 - layer_position_x << 2;
			for(;idx<max;idx+=4){
				func(img_data,idx,layer_img_data,idx2,layer_alpha,layer_power);
				idx2+=4;
			}
		}
		
	}
	

}


var thumbnail_ctx,thumbnail_canvas;
var _layers=[];
var layers=_layers;
var root_layer=null;
var selected_layer = null;
var layers_container;
var layer_id_count=0;

var getLayerNum=function(div){
	//divからレイヤー番号取得
	return layers.findIndex(function(l){return l.div===div;});
}


var selectLayer=function(target_layer){
	//アクティブレイヤ変更
	
	selected_layer=target_layer;
	for(var li=0;li<layers.length;li++){
		var layer=layers[li];
		if(target_layer !== layer){
			//アクティブレイヤ以外の表示を非アクティブにする
			layer.div.classList.remove("active_layer");
		}else{
			layer.div.classList.add("active_layer");
		}
	}

	refreshActiveLayerParam();

}
var layerSelect= function(e){
//レイヤー一覧クリック時、クリックされたものをアクティブ化する

	var num=getLayerNum(e.currentTarget);

	selectLayer(layers[num]);

	e.stopPropagation();

}

//ドラッグ＆ドロップによるレイヤ順編集
var drag_div=null;
var dragTarget=null;
function DragStart(event) {
	//ドラッグ開始
	var num = getLayerNum(event.currentTarget);
	if(num<0)return;
     event.dataTransfer.setData("text", num);
	dragTarget=layers[num];
	 drag_div=event.currentTarget;
	 selectLayer(layers[num]);
}
function dragover_handler(event) {
 event.preventDefault();
 event.dataTransfer.dropEffect = "move";
}	
//function Drop(event) {
function DragEnter(event) {
	//ドロップ時
    var drag = parseInt(event.dataTransfer.getData("text"));
	drag = dragTarget;
	var layer=dragTarget;//layers[drag];
	var drag_div = layer.div;
	var drop = getLayerNum(event.currentTarget);

	var layers_container = document.getElementById("layers_container");

//	if(event.offsetY<32){
//		drop++;
//	}
//	if(drop>drag){
//		drop--;
//	}


	Command.executeCommand("moveLayer",{"layer_id":layer.id,"position":drop});
}
function dragend(event) {
}


	Layer.findLayer=function(layer_id){
		var cb = function(parent_layer,id){
			var layers = parent_layer.layers;
			for(var i=0;i<layers.length;i++){
				if(layers[i].id == id){
					return layers[i];
				}
				if(layers[i].type === 1){
					var res = cb(layers[i]);
					if(res){
						return res;
					}
				}
			}
			return null;
		}
		if(root_layer.id == layer_id){
			return root_layer;
		}
		return cb(root_layer,layer_id);
	}
	Layer.getParentLayer = function(target_layer){
		var cb = function(parent_layer){
			var layers = parent_layer.layers;
			for(var i=0;i<layers.length;i++){
				if(layers[i] == target_layer){
					return parent_layer;
				}
				if(layers[i].type === 1){
					var res = cb(layers[i]);
					if(res){
						return res;
					}
				}
			}
			return null;
		}
		var res = cb(root_layer,target_layer);
		if(!res){
			res = root_layer;
		}
		return res;
	}


var removeLayer=function(idx){
	var layer=layers[idx];
	layer.div.classList.remove("active_layer");
	layers[idx].div.parentNode.removeChild(layer.div);
	layers.splice(idx,1);
}
var appendLayer=function(root,idx,layer){
	_layers.push(layer);
	var layers = root.layers;
	layers.splice(idx,0,layer);

	var layers_container = document.getElementById("layers_container");
	if(root !== root_layer){
		layers_container = root.div.getElementsByClassName("children")[0];
	}
	for(var li=layers.length;li--;){
		layers_container.appendChild(layers[li].div);
	}
	refreshLayer(layer);
	refreshLayerThumbnail(layer);
	refreshMain();
}
var createLayer=function(img,composite_flg){
	if( typeof idx=== 'undefined'){
		idx=layers.length;
	}
	if(idx<0){
		idx=layers.length;
	}
	var layer_template= document.getElementById("layer_template");
	var layer = new Layer();

	if(composite_flg){
		//グループレイヤの場合
		layer.type=1;
		layer.layers=[];
	}

	var layer_div = layer_template.children[0].cloneNode(true);
	if(layer.type == 1){
		layer_div.classList.add("group");
	}

	layer_div.addEventListener("click",layerSelect);
	layer.div=layer_div;

	layer.img=img;

	layer.id=layer_id_count;
	layer_id_count++;
	layer.name ="layer"+("0000"+layer.id).slice(-4);

	if(img){
		refreshLayerThumbnail(layer);
	}
	refreshLayer(layer);

	return layer;

}

