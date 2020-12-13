//レイヤ新規作成
import Hdrpaint from "../hdrpaint.js";
import Img from "../lib/img.js";
import Layer from "../layer.js";
import CommandBase from "./commandbase.js";

class CreateNewLayer extends CommandBase{
	undo(){
		Hdrpaint.removeLayer(this.undo_data.layer);
		return;
	}
	func(){
		var param = this.param;
		var width = param.width;
		var height= param.height;
		var n= param.position;

		var layer;
		if(!this.undo_data){
			var img = new Img(width,height);
			var data = img.data;
			for(var i=0;i<data.length;i+=4){
				data[i+0]= 1;
				data[i+1]= 1;
				data[i+2]= 1;
				data[i+3]= 0;
			}

			layer =Hdrpaint.createLayer(img,param.composite_flg);
			this.undo_data={"layer":layer};
		}else{
			layer = this.undo_data.layer;
		}
		var parentLayer = Layer.findById(param.parent);

		parentLayer.append(n,layer);

		Hdrpaint.select(layer);

		return layer;

	}
};
CreateNewLayer.prototype.name="createNewLayer";

class CreateNewCompositeLayer extends CreateNewLayer{}
CreateNewCompositeLayer.prototype.name="createNewCompositeLayer";

Hdrpaint.commandObjs["createNewLayer"] = CreateNewLayer;
Hdrpaint.commandObjs["createNewCompositeLayer"] = CreateNewCompositeLayer;
