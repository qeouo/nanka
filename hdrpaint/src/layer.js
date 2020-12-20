"use strict"
import {Vec2,Vec4} from "./lib/vector.js"
import Img from "./lib/img.js";
import Redraw from "./redraw.js";
import Hdrpaint from "./hdrpaint.js";
import Util from "./lib/util.js";

let stackThumbnail=[];
let composite_img = new Img(512,512);
let composite_area = new Vec4();
var drag_layer=null;

	var refreshThumbnail=function(){
		if(Layer.enableRefreshThumbnail){
			var layer = stackThumbnail.shift();
			layer.refreshThumbnail();
		}
		if(stackThumbnail.length>0){
			window.requestAnimationFrame(function(e){
				refreshThumbnail();
			});
		}
	}

	var getLayerFromDiv = function(div){
		var result_layer = null;
		Layer.eachLayers(function(layer){
			if(layer.dom == div){
				result_layer = layer;

				return true;
			}

		});
		return result_layer;
	}
//レイヤサムネイル作成用
var thumbnail_img = new Img(64,64,1);

	var click = function(e){
	//レイヤー一覧クリック時、クリックされたものをアクティブ化する
		var layer=getLayerFromDiv(e.currentTarget);
		Hdrpaint.select(layer);
		e.stopPropagation();
	}

	//ドラッグ＆ドロップによるレイヤ順編集
	var DragStart = function(event) {
		//ドラッグ開始
		drag_layer= getLayerFromDiv(event.currentTarget);
	//     event.dataTransfer.setData("text", drag_layer.id);
		 drag_layer.select;

		event.stopPropagation();
	}
	var DragOver = function (event) {
	 event.preventDefault();
	// event.dataTransfer.dropEffect = "move";
	}	

	var DragEnter = function(event) {
		//ドラッグ移動時
		var drop_layer = getLayerFromDiv(event.currentTarget.parentNode);

		if(!drop_layer){
			return;
		}

		event.stopPropagation();
		if(drag_layer=== drop_layer){
			//自分自身の場合は無視
			return;
		}

		if(drag_layer.type !==0){
			//グループレイヤドラッグ時は、自身の子になるかチェックし、その場合は無視
			var flg = false;
			Layer.bubble_func(drop_layer,
				function(layer){
					if(layer === drag_layer){
						flg=true;
						return true;
					}
				}
			);
			if(flg){
				return;
			}
		}

		var parent_layer = drop_layer.parent;//Layer.findParent(drop_layer);
		var position= parent_layer.children.indexOf(drop_layer);
		var now_position= parent_layer.children.indexOf(drag_layer);
		if(now_position <0){
			position++;
		}

		Hdrpaint.executeCommand("moveLayer",{"layer_id":drag_layer.id
			,"parent_layer_id":parent_layer.id,"position":position});
	}

	var DragEnterChild = function(event) {
		//ドラッグ移動時
		var drop_layer = getLayerFromDiv(event.currentTarget);
		
		event.stopPropagation();

		var drag = parseInt(event.dataTransfer.getData("text"));
		var parent_layer= getLayerFromDiv(event.currentTarget.parentNode);


		if(drag_layer.type !==0){
			//グループレイヤドラッグ時は、自身の子になるかチェックし、その場合は無視
			var flg = false;
			Layer.bubble_func(parent_layer,
				function(layer){
					if(layer === drag_layer){
						flg=true;
						return true;
					}
				}
			);
			if(flg){
				return;
			}
		}

		var position= 0;

		Hdrpaint.executeCommand("moveLayer",{"layer_id":drag_layer.id
			,"parent_layer_id":parent_layer.id,"position":position});
	}

	var opencloseClick=function(e){
		var layer= getLayerFromDiv(event.target.parentNode);
		layer.dom.classList.toggle("open");
		e.preventDefault();
		return false;
	}
	

export default class Layer{
//レイヤ
	constructor(){
		this.name="";
		this.display = true;
		this.lock = false;
		this.power=0.0;
		this.alpha=1.0;
		this.blendfunc="normal";
		this.modifier="layer";
		this.div=null;
		this.img=null;
		this.mask_alpha=0;
		this.position =new Vec2();
		this.size=new Vec2();
		this.modifier_param={};

		this.type=0; //1なら階層レイヤ
		this.children=null; //子供レイヤ


		var html=`
				<a href="#" class="openclosebutton">
				</a>
				<div class="layer_dragenter" > </div>
				<div class="thumbnailouter" >
					<img class="thumbnail" >
				</div>
				<div class="name"></div>
				<div class="layer_attributes"></div>
				<div class="children"></div>
			`;

		var dom =document.createElement("div");
		dom.insertAdjacentHTML('beforeend',html);
		dom.classList.add("layer");
		dom.classList.add("open");
		dom.setAttribute("draggable","true");
		dom.addEventListener("dragstart",DragStart);
		dom.addEventListener("dragover",DragOver);
		dom.addEventListener("click",click);
		dom.querySelector(".openclosebutton").addEventListener("click",opencloseClick);
		dom.querySelector(".layer_dragenter").addEventListener("dragenter",DragEnter);
		dom.querySelector(".children").addEventListener("dragenter",DragEnterChild);

		this.dom = dom;

	};

	static enableRefreshThumbnail=true;

	//レイヤ合成開始前処理
	before(area){};

	//レイヤ合成直前処理
	beforeReflect(){};

	//レイヤ合成処理
	reflect (img,x,y,w,h){
		var x = Math.max(img.offsetx,composite_area[0]);
		var y = Math.max(img.offsety,composite_area[1]);
		var x1 = Math.min(img.width+img.offsetx,composite_area[2]+composite_area[0]);
		var y1 = Math.min(img.height+img.offsety,composite_area[3]+composite_area[1]);
		var layer = this;
		var img_data = img.data;
		var img_width = img.width;
		var layer_img_data = layer.img.data;
		var layer_alpha=layer.alpha;
		var layer_power=Math.pow(2,layer.power);
		var layer_img_width = layer.img.width;
		var func = Hdrpaint.blendfuncs[layer.blendfunc];
		var layer_position_x= layer.position[0];
		var layer_position_y= layer.position[1];

		//レイヤのクランプ
		var left2 = Math.max(x,layer.position[0]);
		var top2 = Math.max(y,layer.position[1]);
		var right2 = Math.min(layer.img.width + layer_position_x ,x1);
		var bottom2 = Math.min(layer.img.height + layer_position_y ,y1);

		for(var yi=top2;yi<bottom2;yi++){
			var idx = (yi-img.offsety) * img_width + left2  - img.offsetx << 2;
			var max = (yi-img.offsety) * img_width + right2 - img.offsetx << 2;
			var idx2 = (yi-layer_position_y) * layer_img_width + left2 - layer_position_x << 2;
			var xi = left2;
			for(;idx<max;idx+=4){
				func(img_data,idx,layer_img_data,idx2,layer_alpha,layer_power);
				idx2+=4;
				xi++;
			}
		}
			
	};

	//レイヤ合成
	composite(left,top,right,bottom){
		var layers=this.children;


		var pow=0;
		if(typeof left === 'undefined'){
			left=0;
			top=0;
			right = this.img.width-1;
			bottom= this.img.height-1;
		}

		if(this.type !==1){
			return;
		}

		var width = right-left+1;
		var height = bottom-top+1;


		Vec4.set(composite_area,left,top,width,height);
		for(var li=layers.length;li--;){
			var layer = layers[li];
			if(!layer.display ){
				//非表示の場合スルー
				continue;
			}
			layer.before(composite_area);
			
		}


		left = Math.max(0,composite_area[0]);
		top= Math.max(0,composite_area[1]);
		right= Math.min(this.img.width,composite_area[2]+ left);
		bottom= Math.min(this.img.height,composite_area[3]+ top);
		if(composite_img.data.length<((right-left)*(bottom-top)<<2)){
			composite_img = new Img(right-left,bottom-top);
		}
		composite_img.offsetx= left;
		composite_img.offsety= top;
		composite_img.width= right-left;
		composite_img.height= bottom-top;


		if(this === root_layer){
			var bg = Hdrpaint.doc.background_color;
			composite_img.fill(bg[0],bg[1],bg[2],bg[3],0,0,composite_img.width,composite_img.height);
		}else{
			composite_img.clear(0,0,composite_img.width,composite_img.height);
		}
		
		for(var li=0;li<layers.length;li++){
			var layer = layers[li];
			if(!layer.display ){
				//非表示の場合スルー
				continue;
			}
			layer.beforeReflect();
			layer.reflect(composite_img,composite_area);
			
		}

		var x0 = composite_area[0];
		var x1 = composite_area[0]+composite_area[2];
		var y0 = composite_area[1];
		var y1 = composite_area[1]+composite_area[3];
		x0=Math.max(0,x0);
		y0=Math.max(0,y0);
		x1=Math.min(this.img.width,x1);
		y1=Math.min(this.img.height,y1);
		Vec4.set(composite_area,x0,y0,x1-x0,y1-y0);
		Img.copy(this.img
			,composite_area[0] 
			, composite_area[1]
			,composite_img
			, -composite_img.offsetx +composite_area[0]
			, -composite_img.offsety +composite_area[1]
			, composite_area[2] 
			, composite_area[3] 
		);

		if(this === root_layer){
			//ルートレイヤの場合はプレビュー更新
			Redraw.refreshPreview(0,composite_area[0],composite_area[1],composite_area[2],composite_area[3]);
		}else{
			//通常レイヤの場合はサムネ更新
			this.registRefreshThumbnail();
		}
	}


	getPixel(ret,idx,x,y){
		if(!this.img){
			return;
		}

		if(x<0 || y<0 || x>=this.img.width || y>=this.img.height){
			return ret;
		}
		if(y === undefined){
			y= x;
			x = idx;
			idx = 0;
		}
		if(this.img.data){
			var data = this.img.data;
			var idx2 = this.img.getIndex(x,y)<<2;
			ret[idx+0] = data[idx2];
			ret[idx+1] = data[idx2+1];
			ret[idx+2] = data[idx2+2];
			ret[idx+3] = data[idx2+3];
		}
		
		return ret;
	}


	static bubble_func(layer,f){
		//親に伝搬する処理
		f(layer);
		//var parent_layer= Layer.findParent(layer);
		var parent_layer=layer.parent;

		if(parent_layer){
			Layer.bubble_func(parent_layer,f);
		}

	}


	static eachLayers(f){
		if(!root_layer){
			return;
		}
		var cb = function(layer){
			if(f(layer)){
				return true;
			}
			if(layer.type === 0){
				return false;
			}
			var layers = layer.children;
			if(layers){
				for(var i=0;i<layers.length;i++){
					if(cb(layers[i])){
						return true;
					}
				}
			}
			return false;
		}
		return cb(root_layer);
	}

	static findById(layer_id){
		var result_layer = null;
		Layer.eachLayers(function(layer){
			if(layer.id== layer_id){
				result_layer = layer;

				return true;
			}

		});
		return result_layer;
	}


	static layerArray(){
		var layers=[];
		Layer.eachLayers(function(layer){
			layers.push(layer);
		});
		return layers;

	}



	refreshImg(x,y,w,h){
		var layer = this;

		var left = 0;
		var right = layer.img.width-1;
		var top = 0;
		var bottom = layer.img.height-1;
		
		if( typeof w !== 'undefined'){
			//更新領域設定、はみ出している場合はクランプする
			left=Math.max(left,x);
			right=Math.min(right,x+w-1);
			top=Math.max(top,y);
			bottom=Math.min(bottom,y+h-1);
		}
		left=Math.floor(left);
		right=Math.ceil(right);
		top=Math.floor(top);
		bottom=Math.ceil(bottom);
		var width=right-left+1;
		var height=bottom-top+1;

		if(layer.parent){
			if(typeof w === 'undefined'){
				layer.parent.bubbleComposite();

			}else{
				layer.parent.bubbleComposite(left+layer.position[0]
					,top + layer.position[1]
					,right -left +1
					,bottom -top +1);
			}
		}
		this.registRefreshThumbnail();
	}
	bubbleComposite(x,y,w,h){

		if(typeof x === 'undefined'){
			x = 0;
			y = 0;
			w = this.size[0];
			h = this.size[1];
		}

		var left = x;
		var top= y;
		var right = x+w-1;
		var bottom = y+h-1;

		left = Math.max(0,left);
		top = Math.max(0,top);
		if(this.img){
			right = Math.min(this.img.width-1,right);
			bottom = Math.min(this.img.height-1,bottom);
		}
		left=Math.floor(left);
		right=Math.ceil(right);
		top=Math.floor(top);
		bottom=Math.ceil(bottom);

		if(left == right || top == bottom){
			return;
		}

		if(this.type===2){
			if(this.parent){
				this.parent.bubbleComposite(left+this.position[0]
					,top + this.position[1]
					,right-left+1
					,bottom-top+1);
			}
			return;
		}
		if(typeof x === 'undefined'){
			this.composite();
		}else{
			this.composite(left,top,right,bottom);
		}
		if(this.parent){
			this.parent.bubbleComposite(left+this.position[0]
				,top + this.position[1]
				,right-left+1
				,bottom-top+1);
		}
	}
	showDivParam(){
		var layer = this;
		var txt="";
		txt += "offset:["+layer.position[0]+","+layer.position[1] +"]"
			+ "size:[" + layer.size[0]+ "," + layer.size[1]+"]<br>";
		
		layer.power=Number(layer.power);
		txt += "pow:"+layer.power.toFixed(2)+"";
		layer.alpha=Number(layer.alpha);
		txt += "α:"+layer.alpha.toFixed(2)+"<br>";
			
		return txt;

	}
	refreshDiv(){
		var layer = this;
		var layers_container = null;

		if(layer === root_layer){
			layers_container = document.getElementById("layers_container");
		}else{
			//layer.dom.className="layer";
			if(selected_layer === layer){
				layer.dom.classList.add("active");
			}else{
				layer.dom.classList.remove("active");
			}

			if(layer.type===0 || !layer.children){
				layer.dom.classList.remove("group");
			}else{
				layer.dom.classList.add("group");
			}
			var div= layer.dom.getElementsByClassName("name")[0];
			var name=layer.name;
			if(!this.display){
				name +="(非表示)";
				layer.dom.classList.add("invisible");
			}else{
				layer.dom.classList.remove("invisible");
			}
			if(this.lock){
				name +="(lock)";
				layer.dom.classList.add("lock");
			}else{
				layer.dom.classList.remove("lock");
			}
			if(this.mask_alpha){
				name +="(αlock)";
			}
			div.innerHTML=name;
			
			var span = layer.dom.getElementsByClassName("layer_attributes")[0];
			var txt="";
			if(layer.type === 2){
				txt += "modifier:"+layer.modifier+"<br>";
			}else{
				txt += "func:"+layer.blendfunc +"<br>";
			}
			txt+=layer.showDivParam();
			

			span.innerHTML = txt;

			layers_container = layer.dom.getElementsByClassName("children")[0];

		}


		//子レイヤ設定
		while (layers_container.firstChild) layers_container.removeChild(layers_container.firstChild);
		if(layer.children){
			for(var li=layer.children.length;li--;){
				layers_container.appendChild(layer.children[li].dom);
			}
		}


		if(layer === selected_layer){
			Hdrpaint.refreshActiveLayerParam();
		}

	}

	append(idx,layer){
		var layers = this.children;
		layers.splice(idx,0,layer);

		layer.parent = this;

		this.refreshDiv();
		//refreshMain();
		this.bubbleComposite();
	}

	refreshThumbnail(){
		//レイヤサムネイル更新
		var layer=this;
		if(!layer.img){
			return;
		}
		if(!layer.img.data){
			return;
		}
		var img = layer.img;
		var img_data=img.data;

		var layer_img=layer.dom.getElementsByTagName("img")[0];

		var can = img.toCanvas();
		var ctx = Img.ctx;
		var xr = img.width/64;
		var yr = img.height/64;
		var r=xr;
		if(xr<yr){
			r = yr;
			layer_img.style.width="auto";
			layer_img.style.height="100%";
		}else{
			layer_img.style.width="100%";
			layer_img.style.height="auto";
		}
		var newx = img.width/r|0;
		var newy = img.height/r|0;
		thumbnail_img.clear(0,0,newx,newy);
		var data = img.data;
		var dst_data = thumbnail_img.data;
		var sum=new Vec4();
		var _255 = 1/255;
		var ev = Number(inputs["ev"].value);
		var ev2  = Math.pow(2,-ev)*255;
		var rr255 = 255/(r*r);
		for(var yi=0;yi<newy;yi++){
			for(var xi=0;xi<newx;xi++){
				Vec4.set(sum,0,0,0,0);
				for(var yii=0;yii<r;yii++){
					for(var xii=0;xii<r;xii++){
						var idx = img.getIndex(xi*r+xii|0,yi*r+yii|0)<<2;
						var alpha = data[idx+3];
						sum[0]+=data[idx+0]*alpha;
						sum[1]+=data[idx+1]*alpha;
						sum[2]+=data[idx+2]*alpha;
						sum[3]+=alpha;
					}
				}
				var idx = thumbnail_img.getIndex(xi,yi)<<2;
				var _r = ev2/sum[3];
				dst_data[idx]=sum[0]*_r;
				dst_data[idx+1]=sum[1]*_r;
				dst_data[idx+2]=sum[2]*_r;
				dst_data[idx+3]=sum[3]*rr255;
			}
		}
		thumbnail_img.width=newx;
		thumbnail_img.height=newy;
		thumbnail_img.width=64;
		thumbnail_img.height=64;

		thumbnail_img.toBlob((blob)=>{
			URL.revokeObjectURL(layer_img.src);
			layer_img.src = URL.createObjectURL(blob);
		});

	}


	getAbsolutePosition(p){
		Vec2.set(p,0,0);

		Layer.bubble_func(this,function(layer){
			Vec2.add(p,p,layer.position);
		});
	}
	select(){
		Hdrpaint.select(this);

	}



	registRefreshThumbnail(){
		if(stackThumbnail.indexOf(this)>=0){
			return;
		}
		stackThumbnail.push(this);

		if(stackThumbnail.length===1){
			window.requestAnimationFrame(function(e){
				refreshThumbnail();
			});
		}
	}
	



};

Layer.prototype.typename="normal_layer";
