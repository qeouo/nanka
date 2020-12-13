import Layer from "../layer.js";
import Img from "../lib/img.js";

export default class CommandBase{
	constructor(){	
		this.param={};
		this.undo_data=null;
	}

	undo(){
		//アンドゥ処理
		var difs = this.undo_data.difs;
		if(difs){
			//画像戻す
			var param = this.param;
			var layer_id= param.layer_id;
			var layer = Layer.findById(layer_id);

			for(var di=difs.length;di--;){
				var dif = difs[di];
				Img.copy(layer.img,dif.x,dif.y,dif.img,0,0,dif.img.width,dif.img.height);
				layer.refreshImg(dif.x,dif.y,dif.img.width,dif.img.height);
			}
		}
	};
	func(){
		//メイン処理
	};

	toString(){
		var param_txt="";
		var param= this.param;
		var keys=Object.keys(param);
		for(var ki=0;ki<keys.length;ki++){
			var key = keys[ki];
			if(ki){
				param_txt+=",";
			}
			param_txt+=param[key];
		}
		return  this.name +"("+param_txt+")";

	}
};
CommandBase.prototype.name="command";
