
import Hdrpaint from "../hdrpaint.js";
import Layer from "../layer.js";
import CommandBase from "./commandbase.js";
class TranslateLayer extends CommandBase{

	undo(){
		this.param.x*=-1;
		this.param.y*=-1;
		this.func();
		this.param.x*=-1;
		this.param.y*=-1;
	}
	func(){
		var param = this.param;
		var layer = Layer.findById(param.layer_id);

		var x = param.x;
		var y = param.y;

		if(!this.undo_data){
			this.undo_data={};
		}

		if(!layer){
			//レイヤ指定無しの場合はルート直下のレイヤすべてを移動
			var layers = root_layer.children;
			for(var li=0;li<layers.length;li++){
				var l = layers[li];
				l.position[0]+=x;
				l.position[1]+=y;
				if(isNaN(l.position[0])){
					l.position[0]=0;
				}
				if(isNaN(l.position[1])){
					l.position[1]=0;
				}
				l.refreshDiv();

			}
			root_layer.composite();
		}else{
			layer.position[0]+=x;
			layer.position[1]+=y;
			if(isNaN(layer.position[0])){
				layer.position[0]=0;
			}
			if(isNaN(layer.position[1])){
				layer.position[1]=0;
			}
			layer.refreshDiv();
			layer.refreshImg();
		}
	}
};
Hdrpaint.commandObjs["translateLayer"] = TranslateLayer;
