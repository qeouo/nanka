//レイヤ削除
import Hdrpaint from "../hdrpaint.js";
import CommandBase from "./commandbase.js";
import Layer from "../layer.js";
class DeleteLayer extends CommandBase{
	undo(){
		var layer = this.undo_data.layer;
		var idx = this.undo_data.position;
		var parent_layer = Layer.findById(this.undo_data.parent);

		parent_layer.append(idx,layer);
		layer.select();
	}
	func(){

		var layer_id = this.param.layer_id;

		var layer = Layer.findById(layer_id);
		var parent_layer = layer.parent;
		if(parent_layer){
			var layers = parent_layer.children;
			var idx=  layers.indexOf(layer);

			if(!this.undo_data){
				this.undo_data ={"layer":layer,"position":idx,"parent":parent_layer.id};
			}

			var index = layers.indexOf(layer);
			//レイヤ削除
			Hdrpaint.removeLayer(layer);
			if(layer === selected_layer){
				if(layers.length===0){
					parent_layer.select();
				}else{
					if(index<layers.length){
						layers[index].select();
					}else{
						layers[layers.length-1].select();
					}
				}
			}

		}
		if(parent_layer){
			parent_layer.bubbleComposite();
		}
	}
};

Hdrpaint.commandObjs["deleteLayer"]= DeleteLayer;
