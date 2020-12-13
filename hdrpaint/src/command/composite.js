//レイヤ結合
import Hdrpaint from "../hdrpaint.js";
import CommandBase from "./commandbase.js";
import Layer from "../layer.js";
class Composite extends CommandBase{
	undo(){
		var undo_data=this.undo_data;
		var layer = undo_data.layer;
		layer.children = undo_data.children;
		layer.type=1;
		layer.refreshDiv();
	}
	func(){
		//グループレイヤの子レイヤをすべて結合して通常レイヤにする
		var param = this.param;

		var layer = Layer.findById(param.layer_id);

		//差分ログ作成
		if(!this.undo_data){
			this.undo_data={"layer":layer,"children":layer.children};
		}
		layer.type=0;
		layer.children=null;

		layer.refreshDiv();
	}
};
Composite.prototype.name="composite";
Hdrpaint.commandObjs["composite"] = Composite;
