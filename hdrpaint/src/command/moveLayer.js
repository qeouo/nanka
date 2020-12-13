//レイヤ位置移動
import Hdrpaint from "../hdrpaint.js";
import Layer from "../layer.js";
import CommandBase from "./commandbase.js";

class MoveLayer extends CommandBase{
	undo(){
		this.func(true);
	}
	func(undo_flg){

		var param = this.param;
		var layer = Layer.findById(param.layer_id);
//		var now_parent_layer= Layer.findParent(layer);
		var now_parent_layer= layer.parent;
		var layers =now_parent_layer.children;
		var next_parent_layer = param.parent_layer_id;
		var position = param.position;
		var layer_num = layers.indexOf(layer);

		if(undo_flg){
			position = this.undo_data.before;
			next_parent_layer= this.undo_data.before_parent;
		}
		next_parent_layer = Layer.findById(next_parent_layer);
		
		if(position<0|| next_parent_layer.children.length < position){
			return;
		}	
		if(layer_num === position && now_parent_layer === next_parent_layer){
			return;
		}	

		now_parent_layer.children.splice(layer_num,1);
		now_parent_layer.bubbleComposite();

		var layers_container = layer.dom.parentNode;

		next_parent_layer.append(position,layer);

		if(!this.undo_data){
			this.undo_data = {"before":layer_num,"before_parent":now_parent_layer.id};
		}
	}
};
MoveLayer.prototype.name="moveLayer";
Hdrpaint.commandObjs["moveLayer"] = MoveLayer;
