Hdrpaint=(function(){
	var Hdrpaint = function(){
	}
	var ret = Hdrpaint;

	ret.getPosition=function(){
		var data={};
		if(!selected_layer){
			data.parent_layer_id = root_layer.id;
			data.position = root_layer.length;
		}else{
			if(selected_layer.type===1){
				data.parent_layer_id = selected_layer.id;
				data.position = selected_layer.length;
			}else{
				data.parent_layer_id = selected_layer.parent.id;
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
		var parent_layer = Layer.findParent(layer);
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
		,"shift"
	];

	for(var i=0;i<ret.blendfuncsname.length;i++){
		var name  = ret.blendfuncsname[i];
		Util.loadJs("./blendfuncs/" + name +".js");
	}

	ret.addFilter = function(id,name){

		var a= document.createElement("a");
		a.id=id;
		Util.setText(a,name);
		a.setAttribute("href","#");
		var area = document.getElementById("additional");
		area.appendChild( a);
		
	}
	ret.addPrompt= function(id,html){
		var div= document.createElement("div");
		div.id=id;
		div.classList.add("area");
		div.classList.add("prompt");
		div.insertAdjacentHTML('beforeend',html);

		var prompt_parent= document.querySelector(".prompt_parent");
		prompt_parent.appendChild(div);
	}
	ret.showPrompt=function(id){
		document.getElementById(id).style.display="inline";
		document.querySelector(".prompt_parent").style.display="flex";
	}
	ret.closePrompt=function(){
		var parent= document.querySelector(".prompt_parent")
		parent.style.display="none";
		for(var i=0;i<parent.children.length;i++){
			parent.children[i].style.display="none";
		 }
	}


	return ret;
})();


var Command = {};

	var commands= [ "brush"
		,"changeLayerAttribute"
		,"clear"
		,"composite"
		,"createNewLayer"
		,"deleteLayer"
		,"fill"
		,"joinLayer"
		,"loadImage"
		,"moveLayer"
		,"multiCommand"
		,"resizeCanvas"
		,"resizeLayer"
		,"translate"
		,"noise"
	];

var commandObjs={};
	for(var i=0;i<commands.length;i++){
		var name = commands[i];
		Util.loadJs("./command/" + commands[i] +".js",function(){
				if(!commandObjs[name])return;
			if(commandObjs[name].filter){

			}

		});
	}
var CommandBase = (function(){
	var CommandBase = function(){
		this.param={};
		this.undo_data=null;
	}
	var ret = CommandBase;
	ret.prototype.undo=function(){};
	ret.prototype.func=function(){};
	ret.prototype.undo_default=function(){
		var difs = this.undo_data.difs;
		if(difs){
			//画像戻す
			var param = this.param;
			var layer_id= param.layer_id;
			var layer = Layer.findById(layer_id);

			for(var di=difs.length;di--;){
				var dif = difs[di];
				Img.copy(layer.img,dif.x,dif.y,dif.img,0,0,dif.img.width,dif.img.height);
			}
		}
	}

	return ret;
})();
