
import {Vec2} from "../lib/vector.js";
import CommandBase from "./commandbase.js";
import Hdrpaint from "../hdrpaint.js";
import Layer from "../layer.js";
var commandObjs = Hdrpaint.commandObjs;
class CreateModifier extends CommandBase{
	constructor(){
		super();
	}
	static name ="createmodifier";

	undo(){
		var undo_data=this.undo_data;
		var layer = undo_data.layer;
		Hdrpaint.removeLayer(layer);
		return;
	}
	func(){
		var param = this.param;
		var src_layer= param.src_layer;
		var n= param.position;

		var layer;
		if(!this.undo_data){
			layer = Hdrpaint.createModifier(param.modifier);
			Vec2.set(layer.size,param.width,param.height);

			this.undo_data={"layer":layer};
		}else{
			layer = this.undo_data.layer;
		}
		var parentLayer = Layer.findById(param.parent_layer_id);

		parentLayer.append(n,layer);
		Hdrpaint.select(layer);

		return layer;
	}

}
commandObjs["createmodifier"] = CreateModifier;
