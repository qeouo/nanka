
import Util from "./lib/util.js";
import Layer from "./layer.js";

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

var Hdrpaint=(function(){
	var Hdrpaint = function(){
	}
	var ret = Hdrpaint;

	ret.getPosition=function(){
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

	ret.loadImageFile_=function(file){
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

	ret.createDif=function(layer,left,top,width,height){
		//更新領域の古い情報を保存
		var img = new Img(width,height);
		Img.copy(img,0,0,layer.img,left,top,width,height);
		var dif={};
		dif.img=img;
		dif.x=left;
		dif.y=top;
		return dif;
	}

	ret.removeLayer=function(layer){
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

		command = Command[command];
		if(command.execute){
			command.execute(log);
		}else{
			command(log);
		}
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
	ret.blendfuncs={};

	ret.blendfuncsname= [ "normal"
		,"mul"
		,"add"
		,"sub"
		,"transmit"
	];
	for(var i=0;i<ret.blendfuncsname.length;i++){
		var name  = ret.blendfuncsname[i];
//		Util.loadJs("../blendfuncs/" + name +".js");
//		import("./blendfuncs/"+name+".js");
	}

//モデファイア
	ret.modifier={};
	ret.modifiername= [ "grayscale",
		"shift"
		,"blur"
		,"gradient"
		,"gradientmap"
		,"noise"
	];


	var area = document.querySelector("#modifier_area");
	for(var i=0;i<ret.modifiername.length;i++){
		var name  = ret.modifiername[i];
		//Util.loadJs("../modifier/" + name +".js");

		var input= document.createElement("input");
		input.type="button";
		input.title=name;
		input.value=name;
		area.appendChild(input);
	}


	ret.addFilter = function(id,name){

		var a= document.createElement("a");
		a.id=id;
		Util.setText(a,name);
		a.setAttribute("href","#");
		var area = document.getElementById("additional");
		area.appendChild( a);
		
	}
	ret.addDialog= function(id,html){
		var div= document.createElement("div");
		div.id=id;
		div.style.display="none";
		div.classList.add("area");
		div.classList.add("dialog");
		div.insertAdjacentHTML('beforeend',html);

		var dialog_parent= document.querySelector(".dialog_parent");
		dialog_parent.appendChild(div);
	}
	ret.showDialog=function(id){
		document.getElementById(id).style.display="inline";
		document.querySelector(".dialog_parent").style.display="flex";
	}
	ret.closeDialog=function(){
		var parent= document.querySelector(".dialog_parent")
		parent.style.display="none";
		for(var i=0;i<parent.children.length;i++){
			parent.children[i].style.display="none";
		 }
	}


	ret.addModifierControl= function(id,html){
		var div= document.createElement("div");
		div.id="div_"+id;
		div.classList.add("modifier_param");
		div.insertAdjacentHTML('beforeend',html);

		var dialog_parent= document.querySelector("#modifier_param_area");
		dialog_parent.appendChild(div);
	}




ret.undo=function(){
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


	return ret;
})();



//	var commands= [ "brush"
//		,"changeLayerAttribute"
//		,"changeModifierAttribute"
//		,"clear"
//		,"composite"
//		,"createNewLayer"
//		,"copylayer"
//		,"createmodifier"
//		,"deleteLayer"
//		,"fill"
//		,"joinLayer"
//		,"loadImage"
//		,"moveLayer"
//		,"multiCommand"
//		,"resizeCanvas"
//		,"resizeLayer"
//		,"translate"
//	];


//	for(var i=0;i<commands.length;i++){
//		var name = commands[i];
//
//		import("./command/"+name+".js");
//	//	Util.loadJs("../command/" + commands[i] +".js",function(){
//	//			if(!commandObjs[name])return;
//	//		if(commandObjs[name].filter){
//
//	//		}
//
//	//	});
//	}


export default Hdrpaint;

