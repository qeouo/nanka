
import Hdrpaint from "../hdrpaint.js";
import Layer from "../layer.js";
import CommandBase from "./commandbase.js";
class Clear extends CommandBase{
	func(){
		//全クリア

		var param = this.param;
		var layer = Layer.findById(param.layer_id);
		var layer_img= layer.img;
		var range = param.range;
		if(!range){
			range={};
			range.x = 0;
			range.y = 0;
			range.w = layer_img.width;
			range.h = layer_img.height;
		}
		if(!this.undo_data){
			var undo_data ={};
			this.undo_data=undo_data;
			var dif=Hdrpaint.createDif(layer,range.x,range.y,range.w,range.h);
			undo_data.difs=[];
			undo_data.difs.push(dif);
		}
		layer_img.clear(range.x,range.y,range.w,range.h);
		layer.refreshImg();
	}
};
Hdrpaint.commandObjs["clear"] = Clear;
