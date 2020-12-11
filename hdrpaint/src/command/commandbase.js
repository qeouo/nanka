import Layer from "../layer.js";
import Img from "../lib/img.js";

export default class CommandBase{
	constructor(){	
		this.param={};
		this.undo_data=null;
	}
	undo(){};
	func(){};
	undo_default(){
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
	}
};
