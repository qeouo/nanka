
var History = (function(){
	var History = function(){};
	var ret = History;

	var log_id=0;

Log=function(){
	this.command="";
	this.param={};
	this.undo_data=null;
}
var logs=[];
var undo_max=10;
var history_cursor=-1;
var enable_log=false;

ret.disableLog=function(){
	enable_log=false;
}
ret.enableLog=function(){
	enable_log=true;
}
ret.isEnableLog=function(){
	return enable_log;
}
ret.reset=function(){
	log_id=0;

	var options = inputs["history"].options;
	for(var i=options.length;i--;){
		inputs["history"].removeChild(options[i]);
	}
	logs=[];
	history_cursor=-1;
}
ret.setCursor=function(c){
	history_cursor=c;
	inputs["history"].selectedIndex=c;

}

//ret.rest=function(target){
//	if(history_cursor<target){
//		for(;target > history_cursor;){
//			History.redo();
//		}
//	}
//	if(history_cursor>target){
//		for(;target < history_cursor;){
//			if(History.undo()){
//				break;
//			}
//		}
//	}
//}
ret.getCurrent=function(){
	if(history_cursor>=0){
		return logs[history_cursor];
	}else{
		return null;
	};
}
ret.moveHistory=function(n){
	History.disableLog();
	for(;history_cursor<n;){
		history_cursor++
		var log = logs[history_cursor];
		redo(log);
	}

	for(;history_cursor>n;){
		var log = logs[history_cursor];
		if(!log.undo_data){
			break;
		}
		undo(log);
		history_cursor--;
	}
	

	History.enableLog();
}
ret.redo=function(){

	var option_index = inputs["history"].selectedIndex;
	var options = inputs["history"].options;
	if(option_index === options.length-1){
		return;
	}	
	option_index++;
	var option = options[option_index];
	inputs["history"].selectedIndex = option_index;

	History.moveHistory(parseInt(option.value));

}

ret.undo=function(){

	var option_index = inputs["history"].selectedIndex;
	var options = inputs["history"].options;
	if(option_index === 0){
		return;
	}	
	option_index--;
	var option = options[option_index];
	inputs["history"].selectedIndex = option_index;

	History.moveHistory(option.value);

}
var redo=function(log){
	History.disableLog();

	var param = log.param;
	var layer_id= param.layer_id;
	var layer = layers.find(function(a){return a.id===layer_id;});
	switch(log.command){
	case "fill":
		Command.fill(layer,param.x,param.y,param.color,param.is_layer);
		break;
	case "pen":
		Command.pen(layer,param.points,param.weight,param.color,layer.mask_alpha,param.pressure_mask);
		break;
	case "moveLayer":
		Command.moveLayer(layer,log.param.position);
		break;
	case "createNewLayer":
		Command.createNewLayer(param.width,param.height,param.position);
		break;
	case "loadImageFile":
		Command.loadImageFile(log.undo_data.file,param.position);
		break;
	case "deleteLayer":
		Command.deleteLayer(layer);
		break;
	case "changeLayerAttribute":
		Command.changeLayerAttribute(layer,param.name,param.value);
		break;
	case "translateLayer":
		Command.translateLayer(layer,param.x,param.y);
		break;
	case "resizeCanvas":
		Command.resizeCanvas(param.width,param.height);
		break;
	case "resizeLayer":
		Command.resizeLayer(layer,param.width,param.height);
		break;
	}


	History.enableLog();
}
var undo=function(log){
	var undo_data = log.undo_data;

	var param = log.param;
	var layer_id= param.layer_id;
	var layer = layers.find(function(a){return a.id===layer_id;});

	switch(log.command){
	case "createNewLayer":
	case "loadImageFile":
		var idx = layers.indexOf(layer);
		layers.splice(idx,1);
		layer.div.remove();
		layer.div.classList.remove("active_layer");
		
		layer_id_count--;
		if(selected_layer===layer){
			if(idx>0)idx-=1;
			if(layers.length>0){
				selectLayer(layers[idx]);
			}else{
				selectLayer(null);
			}
				
		}
		refreshMain();

		break;
	case "deleteLayer":
		var layer = undo_data.layer;
		var idx = log.param.idx;

		layers.splice(idx,0,layer);

		var layers_container = document.getElementById("layers_container");
		for(var li=layers.length;li--;){
			layers_container.appendChild(layers[li].div);
		}
		refreshMain();
		break;
	case "moveLayer":
		Command.moveLayer(layer,log.undo_data.before);
		break;
	case "changeLayerAttribute":
		Command.changeLayerAttribute(layer,log.param.name,undo_data.before);
		break;
	case "translateLayer":
		Command.translateLayer(layer,-log.param.x,-log.param.y);
		break;
	case "resizeCanvas":
		Command.resizeCanvas(undo_data.width,undo_data.height);
		break;
	case "resizeLayer":
		Command.resizeLayer(layer,undo_data.width,undo_data.height);
		break;
	default:
		break;
	}
	var difs = undo_data.difs;
	if(difs){

		for(var di=difs.length;di--;){
			var dif = difs[di];
			copyImg(layer.img,dif.x,dif.y,dif.img,0,0,dif.img.width,dif.img.height);
		}
		refreshMain();
		refreshLayerThumbnail(layer);
	}
		

	return false;
}

ret.createLog=function(command,param,undo_data){
	if(!enable_log){
		return null;
	}
	var label="";
	var log = null;
	if(history_cursor>=0){
		var current_log=logs[history_cursor];
		if(command === current_log.command){
			if(command === "changeLayerAttribute"){
				if(current_log.param.layer_id === param.layer_id
				&& current_log.param.name === param.name){
					log = current_log;
				}
			}else if(command === "translateLayer"){
				if(current_log.param.layer_id === param.layer_id){
					log = current_log;
				}
			}else if(command === "moveLayer"){
				if(current_log.param.layer_id === param.layer_id){
					log = current_log;
				}
			}
		}
	}

	var options = inputs["history"].options;
	var option_index=0;
	for(var oi =options.length;oi--;){
		if(parseInt(options[oi].value) <= history_cursor){
			option_index = oi;
			break;
		}
	}

	if(!log){
		//ログ情報を作成しヒストリーに追加
		log=new Log();
		log.id=log_id;
		log_id++;
		history_cursor++;
		log.command=command;
	}
	if(param){
		log.param=param;
	}
	if(undo_data){
		log.undo_data = undo_data;
	}
	
	var param_txt="";
	var keys=Object.keys(param);
	for(var ki=0;ki<keys.length;ki++){
		var key = keys[ki];
		if(ki){
			param_txt+=",";
		}
		param_txt+=param[key];
	}
	label = command+"("+param_txt+")";
	
	//カーソル以降のヒストリ削除
	for(var oi =options.length;oi>option_index+1;){
		oi--;
		inputs["history"].removeChild(options[oi]);
	}
	logs.splice(history_cursor,logs.length-(history_cursor));

	//ヒストリ追加
	var option = document.createElement("option");
	option.value = history_cursor;

	var label="" + ("0000" + log.id).substr(-4) + "| " + label;
	Util.setText(option, label);
	inputs["history"].appendChild(option);
	inputs["history"].selectedIndex=options.length-1;

	logs.push(log);


	if(option_index>undo_max){
		//アンドゥ制限超えた部分を無効化
		var old_option = options[option_index-undo_max-1];
		var old_log = logs[old_option.value];
		old_option.setAttribute("disabled","disabled");
		old_log.undo_data=null;
	}
	return log;
}
ret.deleteLog=function(){
	for(var hi=0;hi<history_cursor+1;hi++){

		logs[hi].undo_data=null;
		//inputs["history"].removeChild(logs[hi].option);
	}


	//logs.splice(0,history_cursor+1);
	//history_cursor=-1;
	
}
	return ret;
})();
