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
			var log =Command.executeCommand("loadImageFile",{"img":img,"file":file.name
				,"parent":data.parent_layer_id,"position":data.position});
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

		if(layer == selected_layer){
			if(parent_layer.children.length>1){
				if(parent_layer.children.length<=idx){
					idx--;
				}
				
				parent_layer.children[idx].select();
			}
		}
		layers.splice(idx,1);
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
		if(log.command === "joinLayer"){
			log.obj = new CommandJoinLayer();
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
		,"loadImageFile"
		,"moveLayer"
		,"multiCommand"
		,"resizeCanvas"
		,"resizeLayer"
		,"translate"
	];

	for(var i=0;i<commands.length;i++){
		Util.loadJs("./command/" + commands[i] +".js");
	}
