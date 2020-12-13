
import Hdrpaint from "../hdrpaint.js";
import CommandBase from "./commandbase.js";
import Layer from "../layer.js";
class Clear extends CommandBase{
	func(){
		//全クリア

		var param = this.param;
		var layer = Layer.findById(param.layer_id);
		if(!this.undo_data){
			var undo_data ={};
			this.undo_data=undo_data;
			var layer_img= layer.img;
			var dif=Hdrpaint.createDif(layer,0,0,layer_img.width,layer_img.height);
			layer.img=layer_img;
			undo_data.difs=[];
			undo_data.difs.push(dif);
		}
		layer.img.data.fill(0);
		layer.refreshImg();
	}
};
Hdrpaint.commandObjs["clear"] = Clear;
