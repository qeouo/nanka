//レイヤ新規作成
import Hdrpaint from "../hdrpaint.js";
import Img from "../lib/img.js";
import Layer from "../layer.js";
var Command = Hdrpaint.Command;
Command["createNewLayer"] = (function(){
	return function(log,undo_flg){
		var param = log.param;
		var width = param.width;
		var height= param.height;
		var n= param.position;

		var layer;
		if(undo_flg){
			Hdrpaint.removeLayer(log.undo_data.layer);
			return;
		}
		if(!log.undo_data){
			var img = new Img(width,height);
			var data = img.data;
			for(var i=0;i<data.length;i+=4){
				data[i+0]= 1;
				data[i+1]= 1;
				data[i+2]= 1;
				data[i+3]= 0;
			}

			layer =Hdrpaint.createLayer(img,param.composite_flg);
			log.undo_data={"layer":layer};
		}else{
			layer = log.undo_data.layer;
		}
		var parentLayer = Layer.findById(param.parent);

		parentLayer.append(n,layer);

		Hdrpaint.select(layer);

		return layer;

	}
})();

Command["createNewCompositeLayer"]=(function(){
	return function(log,undo_flg){
		Command.createNewLayer(log,undo_flg);
	}
})();
