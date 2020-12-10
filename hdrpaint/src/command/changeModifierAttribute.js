
import Hdrpaint from "../hdrpaint.js";
//モディファイアパラメータ変更
var Command = Hdrpaint.Command;
Command["changeModifierAttribute"] = (function(){
	return function(log,undo_flg){
		var param = log.param;
		var name = param.name;
		var value = param.value;
		var layer = Layer.findById(param.layer_id);

		if(undo_flg){
			value = log.undo_data.value;
		}
		if(!log.undo_data){
			log.undo_data = {"value" :layer[name]};
		}
		layer[name] = value;

		layer.refreshDiv();
		layer.parent.bubbleComposite();
	}
})();
