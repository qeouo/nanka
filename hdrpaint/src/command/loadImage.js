
import CommandBase from "./commandbase.js";
import Hdrpaint from "../hdrpaint.js";
import Layer from "../layer.js";

var commandObjs = Hdrpaint.commandObjs;
class LoadImage extends CommandBase{
	constructor(){
		super();
	}
	static name ="LoadImage";

	undo(){
		Hdrpaint.removeLayer(this.undo_data.layer);
		return;
	}
	func(){
		var param = this.param;
		var n  = param.position;
		var img = this.param.img;
		var file  = param.file;
		var parent_layer = Layer.findById(param.parent_layer_id);

		var layer;
		if(!this.undo_data){
			param.img=null;
			layer=Hdrpaint.createLayer(img);
			this.undo_data={"layer":layer};
		}else{
			layer = this.undo_data.layer;
		}
		parent_layer.append(param.position,layer);
		
		layer.select();
	}
}

commandObjs["loadImage"]= LoadImage;
