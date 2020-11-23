
var CommandBase = (function(){
	var CommandBase = function(){
		this.param={};
		this.undo_data=null;
	}
	var ret = CommandBase;
	ret.prototype.undo=function(){};
	ret.prototype.func=function(){};
	ret.prototype.undo_default=function(){
		var difs = this.undo_data.difs;
		if(difs){
			//画像戻す
			var param = this.param;
			var layer_id= param.layer_id;
			var layer = Layer.findById(layer_id);

			for(var di=difs.length;di--;){
				var dif = difs[di];
				Img.copy(layer.img,dif.x,dif.y,dif.img,0,0,dif.img.width,dif.img.height);
				layer.refreshImg(dif.x,dif.y,dif.img.width,dif.img.height);
			}
		}
	}

	return ret;
})();
export default CommandBase;
