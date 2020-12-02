
import Util from "./lib/util.js";
import Img from "./lib/img.js";
import Layer from "./layer.js";
import CommandLog from "./commandlog.js";
import {Vec4} from "./lib/vector.js";

window.inputs=[];
window.doc ={};
window.pen_log=null;
window.pen_func=null;

window.bloomed_img=null;
window.bloom_img=null;
window.preview=null;
window.preview_ctx=null;
window.preview_ctx_imagedata=null;

//現在選択状態にあるブラシ
window.selected_brush=null;
window.Command = {};
window.commandObjs={};

//全ブラシ
window.brushes=[];

class Hdrpaint {
	static color=new Vec4();

	static getPosition(){
		var data={};
		if(!selected_layer){
			data.parent_layer_id = root_layer.id;
			data.parent_layer = root_layer;
			data.position = root_layer.length;
		}else{
			if(selected_layer.children && selected_layer.div.classList.contains("open")){
				data.parent_layer_id = selected_layer.id;
				data.parent_layer = selected_layer;
				data.position = selected_layer.length;
			}else{
				data.parent_layer_id = selected_layer.parent.id;
				data.parent_layer = selected_layer.parent;
				data.position = selected_layer.parent.children.indexOf(selected_layer)+1;
			}
		}
		return data;
	}

	static loadImageFile_(file){
		var data = Hdrpaint.getPosition();
		var fu =function(img){
			var log =Hdrpaint.executeCommand("loadImage",{"img":img,"file":file.name
				,"parent_layer_id":data.parent_layer_id,"position":data.position});
		}
	 	if(/.*exr$/.test(file.name)){
			Img.loadExr(file,0,fu);
	 	}else if(/^image\//.test(file.type)){
			Img.loadImg(file,0,fu);
	 	}
	}

	static createDif(layer,left,top,width,height){
		//更新領域の古い情報を保存
		var img = new Img(width,height);
		Img.copy(img,0,0,layer.img,left,top,width,height);
		var dif={};
		dif.img=img;
		dif.x=left;
		dif.y=top;
		return dif;
	}

	static removeLayer(layer){
		var parent_layer = layer.parent;
		var layers = parent_layer.children;
		var idx = layers.indexOf(layer);

		layers.splice(idx,1);
		if(layer == selected_layer){
			if(parent_layer.children.length>0){
				if(parent_layer.children.length<=idx){
					idx= parent_layer.children.length-1;
				}
				
				parent_layer.children[idx].select();
			}
		}
		parent_layer.refreshDiv();
		parent_layer.bubbleComposite();
	}

	static onlyExecute= function(command,param){
		if(param.layer_id && command !=="changeLayerAttribute"){
			var layer = Layer.findById(param.layer_id);
			if(layer){
				if(layer.lock || !layer.display){
					return;
				}
			}
		}
	
		var log ={"param":param};

		command = Command[command];
		if(command.execute){
			command.execute(log);
		}else{
			command(log);
		}
	}
	static executeCommand(command,param,flg){

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
		if(commandObjs[log.command]){
			log.obj = new commandObjs[log.command]();
			log.obj.param = param;
			log.obj.func();
		}else{
			var command = Command[log.command];
			if(command.execute){
				command.execute(log);
			}else{
				command(log);
			}
		}
		return log;
	}

//ブレンドファンクション
	static blendfuncs={};

	static blendfuncsname= [ "normal"
		,"mul"
		,"add"
		,"sub"
		,"transmit"
	];

//モデファイア
	static modifier={};
	static modifiername= [ "grayscale",
		"shift"
		,"blur"
		,"gradient"
		,"gradientmap"
		,"noise"
	];


	static init(){
	var area = document.querySelector("#modifier_area");
	for(var i=0;i<this.modifiername.length;i++){
		var name  = this.modifiername[i];
		//Util.loadJs("../modifier/" + name +".js");

		var input= document.createElement("input");
		input.type="button";
		input.title=name;
		input.value=name;
		area.appendChild(input);
	}
	}


	static addFilter(id,name){

		var a= document.createElement("a");
		a.id=id;
		Util.setText(a,name);
		a.setAttribute("href","#");
		var area = document.getElementById("additional");
		area.appendChild( a);
		
	}
	static addDialog= function(id,html){
		var div= document.createElement("div");
		div.id=id;
		div.style.display="none";
		div.classList.add("area");
		div.classList.add("dialog");
		div.insertAdjacentHTML('beforeend',html);

		var dialog_parent= document.querySelector(".dialog_parent");
		dialog_parent.appendChild(div);
	}
	static showDialog(id){
		document.getElementById(id).style.display="inline";
		document.querySelector(".dialog_parent").style.display="flex";
	}
	static closeDialog(){
		var parent= document.querySelector(".dialog_parent")
		parent.style.display="none";
		for(var i=0;i<parent.children.length;i++){
			parent.children[i].style.display="none";
		 }
	}



	static registModifier = (mod,name,html)=>{
		mod.prototype.typename=name;

		this.modifier[name] = mod;

		
		var div= document.createElement("div");
		div.id="div_"+name;
		div.classList.add("modifier_param");
		div.insertAdjacentHTML('beforeend',html);

		var dialog_parent= document.querySelector("#modifier_param_area");
		dialog_parent.appendChild(div);
	}


static undo(){
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


}
Hdrpaint.init();

export default Hdrpaint;

