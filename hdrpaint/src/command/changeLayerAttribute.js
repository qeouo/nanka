
import Layer from "../layer.js";
import Hdrpaint from "../hdrpaint.js";
import CommandBase from "./commandbase.js";
class ChangeLayerAttribute extends CommandBase{
//レイヤパラメータ変更
	undo(){
		this.f(this.undo_data.value);
		
	}
	f(value){
		var param = this.param;
		var name = param.name;
		var layer = Layer.findById(param.layer_id);

		if(!this.undo_data){
			this.undo_data= {value:layer[name]};
		}

		layer[name] = value;
		layer.refreshDiv();
		layer.parent.bubbleComposite();
	}
	func(){
		this.f(this.param.value);

	}
};
ChangeLayerAttribute.prototype.name="changLayerAttirbute";
Hdrpaint.commandObjs["changeLayerAttribute"] = ChangeLayerAttribute;
