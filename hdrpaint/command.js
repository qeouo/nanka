
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
	var commands= [ "brush"
		,"changeLayerAttribute"
		,"clear"
		,"composite"
		,"createNewLayer"
		,"deleteLayer"
		,"fill"
		,"joinLayer"
		,"moveLayer"
		,"multiCommand"
		,"resizeCanvas"
		,"resizeLayer"
		,"translate"
	];

	for(var i=0;i<commands.length;i++){
		Util.loadJs("./command/" + commands[i] +".js");
	}
	return ret;
})();

