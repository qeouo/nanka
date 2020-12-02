"use strict"

import {Vec2,Vec3,Vec4} from "./lib/vector.js"
import Hdrpaint from "./hdrpaint.js";
import Slider from "./lib/slider.js";
import Geono from "./lib/geono.js";
import Img from "./lib/img.js";
import CommandLog from "./commandlog.js";
import FileManager from "./file.js";
import Redraw from "./redraw.js";
import PenFunc from "./penfunc.js";
import Brush from "./brush.js";
import PenPoint from "./penpoint.js"
import Layer from "./layer.js";
import Util from "./lib/util.js";
import ColorPickerHDR from "./lib/colorpickerhdr.js";
import ColorSelector from "./lib/colorselector.js";

window.painted_mask=new Float32Array(1024*1024);
window.root_layer=null;
window.selected_layer = null;

import {} from "./command/brush.js"
import {} from "./command/changeLayerAttribute.js"
import {} from "./command/changeModifierAttribute.js"
import {} from "./command/clear.js"
import {} from "./command/composite.js"
import {} from "./command/createNewLayer.js"
import {} from "./command/copylayer.js"
import {} from "./command/createmodifier.js"
import {} from "./command/deleteLayer.js"
import {} from "./command/fill.js"
import {} from "./command/joinLayer.js"
import {} from "./command/loadImage.js"
import {} from "./command/moveLayer.js"
import {} from "./command/multiCommand.js"
import {} from "./command/resizeCanvas.js"
import {} from "./command/resizeLayer.js"
import {} from "./command/translate.js"

import {} from "./blendfuncs/normal.js";
import {} from "./blendfuncs/mul.js";
import {} from "./blendfuncs/add.js";
import {} from "./blendfuncs/sub.js";
import {} from "./blendfuncs/transmit.js";

import {} from "./modifier/grayscale.js";
import {} from "./modifier/shift.js";
import {} from "./modifier/blur.js";
import {} from "./modifier/gradient.js";
import {} from "./modifier/gradientmap.js";
import {} from "./modifier/noise.js";

Hdrpaint.inputs=inputs;
doc.draw_col=new Vec4();
doc.scale=100;
doc.canvas_pos=new Vec2();
doc.cursor_pos=new Vec2();

window.createModifier=function(e){
	if(e.target.value ===""){return;}
	var modifier = e.target.value;
	//新規モディファイア
	var data = Hdrpaint.getPosition();
	
	Hdrpaint.executeCommand("createmodifier",{"modifier":modifier,"parent_layer_id":data.parent_layer.id,"position":data.position
		,"width":data.parent_layer.size[0],"height":data.parent_layer.size[1]});
}

window.copylayer=function(e){
	//レイヤコピー

	var data =Hdrpaint.getPosition();
	
	Hdrpaint.executeCommand("copylayer",{"position":data.position,"parent":data.parent_layer.id,"src_layer_id":selected_layer.id});
}
window.createNewCompositeLayer=function(e){
	//新規コンポジットレイヤを作成
	var data = Hdrpaint.getPosition();
	var width= preview.width;
	var height= preview.height;
	
	Hdrpaint.executeCommand("createNewCompositeLayer",{"parent":data.parent_layer.id,"position":data.position,"width":width,"height":height,"composite_flg":1});

}

window.redo=function(){
	//リドゥ

	var option_index = inputs["history"].selectedIndex;
	var options = inputs["history"].options;
	if(option_index === options.length-1){
		return;
	}	
	option_index++;
	var option = options[option_index];
	inputs["history"].selectedIndex = option_index;

	CommandLog.moveLog(parseInt(option.value));

}

window.undo = function(){
	//アンドゥ

	var option_index = inputs["history"].selectedIndex;
	var options = inputs["history"].options;
	if(option_index === 0){
		return;
	}	
	var option = options[option_index-1];
	if(option.disabled){
		return;
	}
	option_index--;
	inputs["history"].selectedIndex = option_index;

	CommandLog.moveLog(parseInt(option.value));

}

window.createNewLayer=function(e){
	//新規レイヤを作成

	var data = Hdrpaint.getPosition();

	var width= data.parent_layer.size[0];
	var height= data.parent_layer.size[1];
	
	Hdrpaint.executeCommand("createNewLayer",{"position":data.position,"parent":data.parent_layer.id,"width":width,"height":height});
}

var canvas_field;

	//最初に全コントロールを配列に入れる
	var elements= Array.prototype.slice.call(document.getElementsByTagName("input"));
	elements = elements.concat(Array.prototype.slice.call(document.getElementsByTagName("select")));
	for(var i=0;i<elements.length;i++){
		var input = elements[i];
		var id= input.getAttribute("id");
		inputs[id]= elements[i];
	}


	var getPos=function(e){
		var rect = preview.getBoundingClientRect();
		doc.cursor_pos[0] =(e.clientX- rect.left)-1;
		doc.cursor_pos[1] = (e.clientY- rect.top)-1;
		
		doc.cursor_pos[0]*=100/doc.scale;
		doc.cursor_pos[1]*=100/doc.scale;
		
	}
var onloadfunc=function(e){

	if(Util.getLoadingCount()>0){
		window.setTimeout(onloadfunc,1000);
		return;
	}


	preview=  document.getElementById('preview');
	preview_ctx =  preview.getContext('2d')
	preview_ctx_imagedata=preview_ctx.createImageData(preview.width,preview.height);

	window.addEventListener("beforeunload",function(event){ 
		if(CommandLog.command_logs.length>1){
			event.returnValue = '移動前に表示する確認のメッセージ';
			return false;
		}
		return true;
	});

	//blendfuncセット
	var layer_blendfunc = document.querySelector("#layer_blendfunc");
	 while(layer_blendfunc.firstChild){
	 	layer_blendfunc.removeChild(layer_blendfunc.firstChild);
	 }
	for(var i=0;i<Hdrpaint.blendfuncsname.length;i++){
		var name = Hdrpaint.blendfuncsname[i];
		var option = document.createElement("option");
		option.value = name;
		Util.setText(option,name);
		layer_blendfunc.appendChild(option);
	}

		

	//ダイアログ閉じる処理
	//document.querySelector(".dialog_parent").addEventListener("click",function(e){
	//	if(this !== e.target)return false;
	//	Hdrpaint.closeDialog();
	//});


	var keys=Object.keys(inputs);
	for(var i=0;i<keys.length;i++){
		var key = keys[i];
		var input = inputs[key];
		if(input.getAttribute("title") ===null){
			input.setAttribute("title",key);
		}
	}

	
	var rag=null;

	var absolute=new Vec2();
	var drawfunc =function(e){
		//描画関数
		
		var x =doc.cursor_pos[0];
		var y = doc.cursor_pos[1];

		if((e.buttons & 2) || (inputs["color_picker"].checked)){
			//カラーピッカー
			var img= root_layer.img;
			if(inputs["selected_layer_only"].checked){
				img= selected_layer.img;
			}
			if(x<0 || x>=img.width || y<0 || y>img.height){
			}else{
				var data = img.data;

				var idx=((y|0)*img.width+(x|0))*4;


				inputs["color_R"].value=data[idx];
				inputs["color_G"].value=data[idx+1];
				inputs["color_B"].value=data[idx+2];
				inputs["color_A"].value=data[idx+3];
				Util.fireEvent(inputs["color_A"],"input");

				changeColor(null);
			}
			return;
		}

		if(!pen_log){
			return;
		}

		if(inputs["pen"].checked){
			//ペンのとき
			if(!pen_log)return;

			var point=new PenPoint();
			//selected_layer.getAbsolutePosition(absolute);
			//point.pos[0]= x - absolute[0];
			//point.pos[1]= y - absolute[1];
			point.pos[0]= x;
			point.pos[1]= y;
			if(e.buttons&1){
				if(e.pointerType === "mouse"){
					point.pressure=1;
				}else{
					point.pressure=e.pressure;
				}
			}else{
				point.pressure=0;
			}	
			var points= pen_log.param.points;

			//今回座標をパスに追加
			point.time=Date.now();

			points.push(point);
			if(inputs["stroke_correction"].checked){
				if(points.length>=3 && pen_func.idx <points.length-2){
					var buf=new Vec2();
					Vec2.sub(buf,points[points.length-2].pos,points[points.length-3].pos);
					var a=Vec2.scalar(buf);
					if(a>20){
						Vec2.norm(buf);
						Vec2.mul(buf,buf,a-20);
					}
					Vec2.add(points[points.length-2].pos,points[points.length-3].pos,buf);
				}
			}

			if(!(e.buttons&1)){

				//描画前ポイントを補正
					var points = pen_log.param.points;
				if(pen_func.idx +1<points.length){
					var len = points.length - (pen_func.idx + 1) ;
					var a = points[pen_func.idx].pressure;
					var b = points[points.length-1].pressure;
					for(var pi=pen_func.idx+1;pi<points.length;pi++){
						var r = ((pi-pen_func.idx)/len);
						points[pi].pressure = a + (b-a) * r;
					}
				}
			}

			if(!(e.buttons&1)){
				pen_func.end();
				point.pressure=0;
				pen_log=null;
			}	

		pen_func.actualDraw();

			
		}else if(inputs["translate"].checked) {
			//移動のとき
			if((e.buttons & 1) && pen_log){
				var oldx =pen_log.param.x;
				var oldy =pen_log.param.y;
				x = (x|0) - drag_start[0];
				y = (y|0) - drag_start[1];
				

				//一旦元の座標に戻してから再度移動させる
				//Command[pen_log.command](pen_log,true);

				pen_log.param.x=x-oldx;
				pen_log.param.y=y-oldy;
				Command[pen_log.command](pen_log);
				pen_log.param.x=x;
				pen_log.param.y=y;

				pen_log.refreshLabel();
				//CommandLog.appendOption();
				
			}

			if(!(e.buttons&1)){
				pen_log=null;
			}
		}
	};


	
	window.addEventListener("pointerup",function(e){
		getPos(e);
		if(pen_log){
			drawfunc(e);
			e.preventDefault();
		}

		Layer.enableRefreshThumbnail = true;
	});
	document.querySelector("#canvas_field").addEventListener("pointermove",function(e){
		getPos(e);
		Redraw.refreshPreviewStatus(e);
		if(e.buttons){
			drawfunc(e);
			e.preventDefault();
		}
	});

	preview.addEventListener("contextmenu",function(e){
		event.preventDefault();
	},false);
	
	var drag_start=new Vec2();

	preview.addEventListener("pointerdown",function(e){
		getPos(e);
		var x =doc.cursor_pos[0];
		var y = doc.cursor_pos[1];
		drag_start[0]= x;
		drag_start[1]= y;

		Layer.enableRefreshThumbnail = false;

		if(selected_layer===null){
			return;
		}



		if(inputs["fill"].checked && (e.buttons &1)){
			if(selected_layer.type === 1){
				return;
			}
			//塗りつぶし

			var joined_img = root_layer.img;
			if(x<0 || x>=joined_img.width || y<0 || y>=joined_img.height){
				//範囲外は無視
				return;
			}
			var layer = selected_layer;
			//selected_layer.getAbsolutePosition(absolute);
			//x -= absolute[0];
			//y -= absolute[1];
			if(x<0 || x>=layer.img.width || y<0 || y>=layer.img.height){
				//範囲外は無視
				return;
			}
			var color = new Float32Array(4);
			Vec4.copy(color,Hdrpaint.color);
			var flg_active_layer_only = inputs["selected_layer_only"].checked;
			Hdrpaint.executeCommand("fill",{"layer_id":selected_layer.id,"x":x,"y":y,"color":color,"is_layer":flg_active_layer_only});

		}else if(inputs["translate"].checked && (e.buttons &1) ){
			//レイヤ位置移動
			drag_start[0]= x | 0;
			drag_start[1]= y | 0;
			var layer_id=-1;//全レイヤ移動
			var flg_active_layer_only = inputs["selected_layer_only"].checked;
			if(flg_active_layer_only){
				//アクティブレイヤ
				layer_id=selected_layer.id;
			}
			pen_log = Hdrpaint.executeCommand("translateLayer",{"layer_id":layer_id,"x":0,"y":0} ,{"x":selected_layer.position[0],"y":selected_layer.position[1]},1);


		}else if((inputs["pen"].checked) && (e.buttons &1) ){
			//ペンもしくは消しゴム

			if(selected_layer.type !== 0){
				//通常レイヤ以外は無効
				return;
			}

			if(selected_layer.mask_alpha
			&& inputs["eraser"].checked){
				//アルファマスクありで消しゴムの場合無視
				return;
			}


			//ペン状態取得

			var param={};
			Brush.setParam(param);
			param.alpha_mask = selected_layer.mask_alpha;
			param.points=[];
			param.layer_id = selected_layer.id;
			pen_log = Hdrpaint.executeCommand("brush",param);
			if(pen_log){
				pen_func= new PenFunc();
				pen_func.pen_log=pen_log;
				if(inputs["stroke_correction"].checked){
					pen_func.ragtime=40;
				}else{
					pen_func.ragtime=18;
				}

				drawfunc(e);
			}
		}

		drawfunc(e);


	},false);

    inputs["history"].addEventListener('change', function(event){
		var index = this.selectedIndex;
		var option = this.options[index];
		CommandLog.moveLog(parseInt(option.value));
	});

	var ctrlkey;
	document.addEventListener('keyup',function(event){
		if(event.keyCode ==17){
			ctrlkey = false;
		}
		switch(event.keyCode){
		case 81://q
			if(old_tool){
				old_tool.checked=true;
				old_tool=null;
			}
			break;
		//case 32://space
		case 87://w
			//flg_active_layer_only=false;
			inputs["selected_layer_only"].checked=false;
			Redraw.refreshPreview(1);
		}
	});

	var old_tool=null;
	document.addEventListener('keydown', function(event){

		if(event.ctrlKey){
			ctrlkey = true;
		}

		//キーショートカット
		if(event.target.tagName==="INPUT"){
			if(event.target.type==="text"){
				return;
			}
		}
		for(var bi=0;bi<brushes.length;bi++){
			var brush = brushes[bi];
			if(!brush.shortcut)continue;
			var shortcut = brush.shortcut.toUpperCase().charCodeAt(0);
			if(shortcut === event.keyCode){
				brush.select();
				return;
			}
		}

		switch(event.keyCode){
		case 70://f
			inputs["fill"].checked=true;
			refreshTab("tools");
			break;
		case 84://t
			inputs["translate"].checked=true;
			refreshTab("tools");
			break;
		case 81://q
			if(!old_tool){
				old_tool  = document.querySelector("input[name='tool']:checked");
			}
			inputs["color_picker"].checked=true;
			break;
		case 82://r
			Redraw.compositeAll();
			break;
		//case 69://e
		//	inputs["weight"].value=parseFloat(inputs["weight"].value)-1;
		//	Util.fireEvent(inputs["weight"],"change");
		//	break;
		//case 82://r
		//	inputs["weight"].value=parseFloat(inputs["weight"].value)+1;
		//	Util.fireEvent(inputs["weight"],"change");
		//	break;
		case 90:
			if(event.ctrlKey){
				if (event.shiftKey) {
					//リドゥ
					redo();

				}else{
					//アンドゥ
					Hdrpaint.undo();
				}
			}
			event.preventDefault();
			break;
		case 46://delete
			if(selected_layer.type===1){
				break;
			}
			Hdrpaint.executeCommand("clear",{"layer_id":selected_layer.id});
			break;
		//case 32://space
		case 87://w
			//if(!flg_active_layer_only){
			//	flg_active_layer_only=true;
			//	event.preventDefault();
			//	refreshPreview(1);
			//}
			inputs["selected_layer_only"].checked=true;
			Redraw.refreshPreview(1);
			break;
		}
    });




	document.getElementById("post_effect").addEventListener("change",function(e){

		//refreshColor();
		if(e.target.id==="bloom_power"){
			Redraw.refreshPreview(1);
		}
		if(e.target.id==="ch_bloom" || e.target.id==="bloom_size"){
			Redraw.refreshPreview(0);
		}
		if(e.target.id==="ch_gamma" || e.target.id==="gamma" || e.target.id==="ev"){
			Redraw.refreshPreview(2);
			Layer.eachLayers(function(layer){
				//refresh_thumbnail.push(layer);
				layer.registRefreshThumbnail();
			});
		}
		
	  });
	document.getElementById("tools").addEventListener("change",function(e){
		refreshTab("tools");
	});


	var resizeCanvas=function(){
		var width = parseInt(inputs["canvas_width"].value);
		var height= parseInt(inputs["canvas_height"].value);
		Hdrpaint.executeCommand("resizeCanvas",{"width":width,"height":height});
	}
	inputs["canvas_width"].addEventListener("change",resizeCanvas);
	inputs["canvas_height"].addEventListener("change",resizeCanvas);
	inputs["btn_resize_layer"].addEventListener("click",function(e){
		var width = parseInt(preview.width);
		var height= parseInt(preview.height);
		Hdrpaint.executeCommand("resizeLayer",{"layer_id":selected_layer.id,"width":width,"height":height});

	});
	inputs["btn_resize_layers"].addEventListener("click",function(e){
		var width = parseInt(preview.width);
		var height= parseInt(preview.height);
		Hdrpaint.executeCommand("resizeLayer",{"layer_id":-1,"width":width,"height":height});

	});
	inputs["open_layer"].addEventListener("change",function(e){
		var file=this.files[0];
		
		if(file){
			Hdrpaint.loadImageFile_(file);
		}
		this.value=null;

	});


	document.getElementById("open_hpd").addEventListener("click",function(e){
		var file_hpd = inputs['file_hpd'];
		file_hpd.onchange=function(){
			var file = file_hpd.files[0];

			FileManager.loadHpd(file);
	//		Util.loadBinary(file,function(buffer){
	//			loadHpd(buffer);
	//			var log =CommandLog.createLog("loadDocumentFile",{"file":file.name});
	//			CommandLog.appendOption(log);
	//		});
			file_hpd.value=null;
		};
		file_hpd.click();
		e.preventDefault();
		return false;
	});

	document.getElementById("add_brush").addEventListener("click",function(e){
		var file_hpd = inputs['file_hpd'];
		file_hpd.onchange=function(){
			var file = file_hpd.files[0];

			Util.loadBinary(file,function(buffer){
				addBrush(buffer);
			});
			file_hpd.value=null;
		};
		file_hpd.click();
		e.preventDefault();
		return false;
	});

	inputs["down_layer"].addEventListener("click",function(e){
		if(!selected_layer){
			return;
		}
		var parent_layer =  selected_layer.parent;
		var layers = parent_layer.children;
		var position = layers.indexOf(selected_layer);
		if(position<=0){return;}
		Hdrpaint.executeCommand("moveLayer",{"layer_id":selected_layer.id,"parent_layer_id":parent_layer.id,"position":position-1});
	});
	inputs["up_layer"].addEventListener("click",function(e){
		var parent_layer =  selected_layer.parent;
		var layers = parent_layer.children;
		var position = layers.indexOf(selected_layer);
		if(position+1>=layers.length){return;}
		Hdrpaint.executeCommand("moveLayer",{"layer_id":selected_layer.id,"parent_layer_id":parent_layer.id,"position":position+1});
	});

	//レイヤ結合ボタン押下時
	inputs["join_layer"].addEventListener("click",function(e){
		if(selected_layer.type===1){
			Hdrpaint.executeCommand("composite"
				,{"layer_id":selected_layer.id});
			return;
		}
		var parent_layer = selected_layer.parent;
		var position = parent_layer.children.indexOf(selected_layer);

		if(position===0){
			return;
		}

		if(parent_layer.children[position-1].type===1){
			return;
		}

		var id2= parent_layer.children[position-1].id;
		Hdrpaint.executeCommand("joinLayer",{"layer_id":id2,"layer_id2":selected_layer.id});
	});

	inputs["delete_layer"].addEventListener("click",function(e){
		Hdrpaint.executeCommand("deleteLayer",{"layer_id":selected_layer.id});
	});

	var oldpos=new Vec2();
	canvas_field = document.getElementById("canvas_field");
	canvas_field.addEventListener( "pointerdown", function(e){
		if(e.buttons&4){
			oldpos[0]=e.pageX;
			oldpos[1]=e.pageY;
			e.preventDefault();
		}
	});
	document.getElementById("canvas_field").addEventListener( "pointermove", function(e){
		if(e.buttons&4){
			//中ボタンドラッグでキャンバス移動
			//c.scrollLeft-=e.pageX-oldpos[0];
			//c.scrollTop-=e.pageY-oldpos[1];

			doc.canvas_pos[0]+=(e.pageX-oldpos[0]);
			doc.canvas_pos[1]+=(e.pageY-oldpos[1]);

			var c=document.getElementById("canvas_field");
			var spacer=document.getElementById("spcaer");
			if(doc.canvas_pos[0]<0){
				c.scrollLeft-=doc.canvas_pos[0];
				doc.canvas_pos[0]=0;
			}
			if(doc.canvas_pos[1]<0){
				doc.canvas_pos[1]=0;
			}

			preview.style.left = doc.canvas_pos[0] + "px";
			preview.style.top = doc.canvas_pos[1] + "px";

			oldpos[0]=e.pageX;
			oldpos[1]=e.pageY;
			
		}
	});
	document.getElementById("canvas_area").addEventListener( "wheel", function(e){
		if(!e.ctrlKey){
			return;
		}
		var add=0;
		e.preventDefault();
		if(e.buttons&4){
			return;
		}
		if(event.deltaY>0){
			if(doc.scale<=100){
				doc.scale/=2;
			}else{
				doc.scale-=100;
			}
			
		}else{
			if(doc.scale<=100){
				doc.scale*=2;
			}else{
				doc.scale+=100;
			}
			
		}
		if(doc.scale<25){
			doc.scale=25;
		}
		if(doc.scale>2000){
			doc.scale=2000;
		}
		if(doc.scale>100){
			preview.style.imageRendering="pixelated";
		}else{
			preview.style.imageRendering="auto";
		}
		var cx = canvas_field.scrollX+canvas_field.clientWidth/2;
		var cy = canvas_field.scrollY+canvas_field.clientHeight/2;
		preview.style.width = (preview.width* doc.scale/100 ) + "px";
		preview.style.height= (preview.height*doc.scale/100) + "px";

		refreshPreviewStatus(e);

	}) ;

    var a = document.getElementById("save_hpd");
	a.addEventListener("contextmenu",FileManager.saveHpd);
	a.addEventListener("click",FileManager.saveHpd);
	

    a = document.getElementById("save_ldr");
	a.addEventListener("contextmenu",FileManager.saveLdr);
	a.addEventListener("click",FileManager.saveLdr);

    a = document.getElementById("save_hdr");
	a.addEventListener("contextmenu",FileManager.saveHdr);
	a.addEventListener("click",FileManager.saveHdr);


	var url=location.search.substring(1,location.search.length)
	var args=url.split("&")

	Vec4.set(doc.draw_col,0.8,0.2,0.2,1);

	for(i=args.length;i--;){
		var arg=args[i].split("=")
		if(arg.length >1){
			var name = arg[0];
			if(!isNaN(arg[1]) && arg[1]!=""){
				if(arg[1].length>1 && arg[1].indexOf(0) =="0"){
					globalParam[name] = arg[1]
				}else{
					globalParam[name] = +arg[1]
				}
			}else{
				globalParam[name] = arg[1]
			}
		}
		if(inputs.hasOwnProperty(name)){
			if((inputs[name].type=="checkbox" || inputs[name].type=="radio") && globalParam[name]){
				inputs[name].checked=true;
			}else{
				inputs[name].value = globalParam[name];
			}
			Util.fireEvent(inputs[name],"input");
		}
	}



	if(globalParam.hasOwnProperty("file")){

		//パラメタ渡されてる場合はそれ開く

		FileManager.loadHpd(globalParam.file);
		//Util.loadBinary(globalParam.file,function(buffer){
		//	loadHpd(buffer);
		//});
	}else{
		root_layer = Layer.create(new Img(1,1),1);
		//Hdrpaint.executeCommand("resizeLayer",{"layer_id":root_layer.id,"width":512,"height":512});

		Hdrpaint.executeCommand("resizeCanvas",{"width":512,"height":512});
		Hdrpaint.executeCommand("createNewLayer",{"position":0,"parent":root_layer.id,"width":preview.width,"height":preview.height});

		var canvas_area=document.querySelector("#canvas_area");
		var canvas_field=document.querySelector("#canvas_field");

		doc.canvas_pos[0]=(canvas_field.clientWidth-512)>>1;
		doc.canvas_pos[1]=(canvas_field.clientHeight-512)>>1;
		
		preview.style.left = doc.canvas_pos[0] + "px";
		preview.style.top = doc.canvas_pos[1] + "px";

		var layer = root_layer.children[0];
		var img_data = layer.img.data;
		for(var i=0;i<img_data.length;i++){
			img_data[i]=1;
		}
		layer.name="background"
		layer.refreshDiv();
		layer.registRefreshThumbnail();

		CommandLog.reset();

		Hdrpaint.executeCommand("createNewLayer",{"position":1,"parent":root_layer.id,"width":preview.width,"height":preview.height});
		layer = root_layer.children[1];
		layer.name="default"
		layer.refreshDiv();
		layer.registRefreshThumbnail();

		root_layer.refreshDiv();
		//refreshTab("tools");
	}

	Brush.init();
	Layer.init();
	var brush = Brush.create();
	var brush1 = brush;
	brush.name="ペン"
	brush.shortcut="a";
	brush.weight_pressure_effect=true;
	brush.stroke_correction=true;
	brush.weight=5;
	brushes.push(brush);
	brush.refresh();

	brush = Brush.create();
	brush.name="消しゴム"
	brush.eraser=true;
	brush.shortcut="s";
	brush.weight=10;
	brushes.push(brush);
	brush.refresh();
	Brush.refreshBrush();

	brush1.select();

}

	var selectorhdr = new ColorSelector();
	document.querySelector("#color_selector").appendChild(selectorhdr.div);
	selectorhdr.changeCallback= function(){

		Hdrpaint.color[0]= Number(this.R_txt.value);
		Hdrpaint.color[1]= Number(this.G_txt.value);
		Hdrpaint.color[2]= Number(this.B_txt.value);
		Hdrpaint.color[3]= Number(this.A_txt.value);

		Brush.refreshPreview();
	}

	Vec4.set(Hdrpaint.color,1,0.5,0.5,1);

	selectorhdr.setColor(Hdrpaint.color);



var refreshTab = function(target_id){
	var tool_radios = document.getElementById(target_id).getElementsByTagName("input");
	for(var i=0;i<tool_radios.length;i++){
		var input = tool_radios[i];
		var div=document.getElementById("tab_"+input.id);
		if(!div)continue;
		if(input.checked){
			div.style.display="inline-block";
			}else{
			div.style.display="none";
		}
	}
}
window.refreshTab=refreshTab;
document.body.onload=onloadfunc;
