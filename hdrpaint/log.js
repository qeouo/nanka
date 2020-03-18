var Log = (function(){
	//ログ制御
	
	var Log = function(){};
	var ret = Log;

	var log_id=0;

	var CommandLog=ret.CommandLog = function(){
		this.command="";
		this.param={};
		this.undo_data=null;
	}
	var command_logs=[];
	var undo_max=10; //undo情報最大保持ステップ数
	var command_log_cursor=-1; //現在のログ位置(undo redoで移動する)

	var enable_log=false; //trueのときコマンドログ作成
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
		//コマンドログとヒストリをすべて削除
		log_id=0;

		var options = inputs["history"].options;
		for(var i=options.length;i--;){
			inputs["history"].removeChild(options[i]);
		}
		command_logs=[];
		command_log_cursor=-1;
	}

	ret.moveLog=function(n){
		//指定された番号のコマンドログが実行された状態にする
		Log.disableLog();
		for(;command_log_cursor<n;){
			command_log_cursor++
			var log = command_logs[command_log_cursor];
			redo(log);
		}

		for(;command_log_cursor>n;){
			var log = command_logs[command_log_cursor];
			if(!log.undo_data){
				break;
			}
			undo(log);
			command_log_cursor--;
		}
		

		Log.enableLog();
	}

	ret.redo=function(){
		//リドゥ

		var option_index = inputs["history"].selectedIndex;
		var options = inputs["history"].options;
		if(option_index === options.length-1){
			return;
		}	
		option_index++;
		var option = options[option_index];
		inputs["history"].selectedIndex = option_index;

		Log.moveLog(parseInt(option.value));

	}

	ret.undo=function(){
		//アンドゥ

		var option_index = inputs["history"].selectedIndex;
		var options = inputs["history"].options;
		if(option_index === 0){
			return;
		}	
		option_index--;
		var option = options[option_index];
		inputs["history"].selectedIndex = option_index;

		Log.moveLog(parseInt(option.value));

	}
	var redo=Log.redo_=function(log){
		//コマンドログからコマンドを実行する
		Log.disableLog();

		var param = log.param;
		var layer_id= param.layer_id;
		var layer = layers.find(function(a){return a.id===layer_id;});
		switch(log.command){
		case "pen":
			Command.pen(layer,param.points,param.weight,param.color,layer.mask_alpha,param.pressure_mask);
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
		case "resizeCanvas":
			Command.resizeCanvas(param.width,param.height);
			break;
		case "resizeLayer":
			Command.resizeLayer(layer,param.width,param.height);
			break;
		default:
			Command[log.command](log);
			break;
		}


		Log.enableLog();
	}
	var undo= Log.undo_=function(log){
		//コマンドログのundo情報より状態を戻す
		//
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
		case "changeLayerAttribute":
			Command.changeLayerAttribute(layer,log.param.name,undo_data.before);
			break;
		case "resizeCanvas":
			Command.resizeCanvas(undo_data.width,undo_data.height);
			break;
		case "resizeLayer":
			Command.resizeLayer(layer,undo_data.width,undo_data.height);
			break;
		default:
			Command[log.command](log,true);
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

	ret.createLog_=function(command,param,undo_data){
		var log = null;

		if(command_log_cursor>=0){
			var current_log=command_logs[command_log_cursor];
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
		if(!log){
			log=new CommandLog();
			log.id=log_id;
			log_id++;
			Log.appendLog(log);
		}

		log.command=command;
		
		if(param){
			log.param=param;
		}
		if(undo_data){
			log.undo_data = undo_data;
		}
		
		return log;
	}
	ret.appendOption=function(){
		//ヒストリ追加
		
		var options = inputs["history"].options;

		//現在のカーソル以降で一番小さいoptionを探す
		var option=null;
		var idx=options.length;
		for(;idx--;){
			if(options[idx].value<command_log_cursor){
				break;
			}
			option = options[idx];
		}
		idx++;

		for(var oi=options.length-1;oi>idx;oi--){
			//カーソル以降のoptionを1こ残して削除
			inputs["history"].removeChild(options[oi]);
		}


		if(!option){
			//optionがない場合は新規追加
			option = document.createElement("option");
			inputs["history"].appendChild(option);
		}

		var log = command_logs[command_log_cursor];
		option.value = command_log_cursor;

		//optionのテキストをセット
		var param_txt="";
		var param= log.param;
		var keys=Object.keys(param);
		for(var ki=0;ki<keys.length;ki++){
			var key = keys[ki];
			if(ki){
				param_txt+=",";
			}
			param_txt+=param[key];
		}
		var label="" + ("0000" + log.id).substr(-4) + "| " 
			+ log.command+"("+param_txt+")";
		Util.setText(option, label);

		//選択状態にする
		inputs["history"].selectedIndex=options.length-1;
		
		if(options.length>undo_max){
			//アンドゥ制限超えた部分を無効化
			var old_option = options[options.length-undo_max];
			var old_log = command_logs[old_option.value];
			old_option.setAttribute("disabled","disabled");
			old_log.undo_data=null;
		}


		return option;

	}
	ret.appendLog=function(log){
		command_log_cursor++;

		//カーソル以降のヒストリ削除
		command_logs.splice(command_log_cursor,command_logs.length-(command_log_cursor));

		command_logs.push(log);

	}
	ret.createLog=function(command,param,undo_data){
		if(!enable_log){
			return null;
		}
		var log = Log.createLog_(command,param,undo_data);
		Log.appendOption();


		return log;
	}

	return ret;
})();
