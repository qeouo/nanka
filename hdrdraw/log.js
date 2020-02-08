
var History = (function(){
	var History = function(){};
	var ret = History;

	var log_id=0;

var logs=[];
var history_cursor=-1;
var enable_log=true;

ret.disableLog=function(){
	enable_log=false;
}
ret.enableLog=function(){
	enable_log=true;
}
ret.isEnableLog=function(){
	return enable_log;
}

ret.rest=function(target){
	if(history_cursor<target){
		for(;target > history_cursor;){
			History.redo();
		}
	}
	if(history_cursor>target){
		for(;target < history_cursor;){
			History.undo();
		}
	}
}
ret.getCurrent=function(){
	if(history_cursor>=0){
		return logs[history_cursor];
	}else{
		return null;
	};
}
ret.redo=function(){
	if(history_cursor>=logs.length-1){
		//最新状態の場合は無効
		return;
	}
	History.disableLog();
	
	history_cursor++;

	var log = logs[history_cursor];

	var param = log.param;
	switch(log.command){
	case "fill":
		Command.fill(param.layer,param.x,param.y,param.color);
		break;
	case "pen":
		Command.pen(param.layer,param.points,param.bold,param.color);
		break;
	case "createLayer":
		var layer = log.param.layer;
		var idx = log.param.idx;

		layers.splice(idx,0,layer);

		var layers_container = document.getElementById("layers_container");
		for(var li=layers.length;li--;){
			layers_container.appendChild(layers[li].div);
		}
		break;
	case "deleteLayer":
		var layer = log.param.layer;
		var idx = layers.indexOf(layer);
		layers.splice(idx,1);
		layer.div.remove();
		break;
	case "changeLayerAttribute":
		Command.changeLayerAttribute(log.param.layer,log.param.name,log.param.after);
		break;
	}

	inputs["history"].selectedIndex=history_cursor;

	History.enableLog();
}
ret.undo=function(){
	if(history_cursor<0){
		//最古の場合は無効
		return;
	}
	History.disableLog();

	var log = logs[history_cursor];


	switch(log.command){
	case "createLayer":
		var layer = log.param.layer;
		var idx = layers.indexOf(layer);
		layers.splice(idx,1);
		layer.div.remove();
		layer.div.classList.remove("active_layer");

		break;
	case "deleteLayer":
		var layer = log.param.layer;
		var idx = log.param.idx;

		layers.splice(idx,0,layer);

		var layers_container = document.getElementById("layers_container");
		for(var li=layers.length;li--;){
			layers_container.appendChild(layers[li].div);
		}
		break;
	case "changeLayerAttribute":
		Command.changeLayerAttribute(log.param.layer,log.param.name,log.param.before);
		break;
	default:
		for(var di=log.difs.length;di--;){
			var dif = log.difs[di];
			copyImg(dif.layer.img,dif.x,dif.y,dif.img,0,0,dif.img.width,dif.img.height);
		}
		refreshMain();
		break;
	}
		
	history_cursor--;

	inputs["history"].selectedIndex=history_cursor;

	History.enableLog();

}

Log=function(){
	this.command="";
	this.param={};
	this.difs=[];
	
}
ret.createLog=function(command,param,label){
	if(!enable_log){
		return null;
	}
	//ログ情報を作成しヒストリーに追加
	var log=new Log();
	log.command=command;
	log.param=param;
	log.id=log_id;
	log_id++;
	if( typeof label === 'undefined'){
		label = command+"{"+param+"}";
	}
	log.label="[" + ("0000" + log.id).slice(-4) + "]" + label;


	log.option=document.createElement("option");
	Util.setText(log.option, log.label);

	history_cursor++;

	//カーソル以降のヒストリ削除
	var m = logs.length - (history_cursor );
	for(var hi=history_cursor;hi<logs.length;hi++){
		//logs.pop();
		logs[hi].option.remove();
	}
	logs.splice(history_cursor,logs.length-(history_cursor));


	//ヒストリ追加
	logs.push(log);
	inputs["history"].appendChild(log.option);
	inputs["history"].selectedIndex=history_cursor;

	return log;
}
ret.deleteLog=function(){
	for(var hi=0;hi<history_cursor+1;hi++){
		logs[hi].option.remove();
	}
	logs.splice(0,history_cursor+1);
	history_cursor=-1;
	
}
	return ret;
})();
