var CommandBase = (function(){
	var CommandBase = function(){
		this.param={};
		this.undo_data=null;
	}
	var ret = CommandBase;
	ret.prototype.undo=function(){};
	ret.prototype.func=function(){};
	return ret;
})();
var CommandJoinLayer = (function(){
	var JoinLayer= function(){
		CommandBase.apply(this);
	}
	var ret = JoinLayer;
	inherits(ret,CommandBase);

	ret.prototype.undo = function(){
		var undo_data=this.undo_data;
		var layer = undo_data.layer;
		var parent_layer = layer.parent;
		Hdrpaint.removeLayer(layer);
		parent_layer.append(undo_data.position,undo_data.layerA);
		parent_layer.append(undo_data.positionB,undo_data.layerB);
		return;
	}
	ret.prototype.func=function(){
		var param = this.param;
		var layer;
		var layerA = Layer.findById(param.layer_id);
		var layerB = Layer.findById(param.layer_id2);
		var parent_layer = layerA.parent;
		var layers = parent_layer.children;
		var ls=[layerA,layerB];

		if(!this.undo_data){

			//２つのレイヤが収まるサイズのグループレイヤを作成
			var x=Math.min(layerA.position[0] ,layerB.position[0]);
			var y=Math.min(layerA.position[1] ,layerB.position[1]);
			var right = Math.max(layerA.position[0]+layerA.img.width,layerB.position[0]+layerB.img.width);
			var bottom = Math.max(layerA.position[1]+layerA.img.height,layerB.position[1]+layerB.img.height);
			var width  = right-x;
			var height= bottom-y;
			var position = layers.indexOf(layerA);
			var position2 = layers.indexOf(layerB);
			var img = new Img(width,height);
			layer =Layer.create(img,1);
			layer.position[0]=x;
			layer.position[1]=y;
			layer.name=layerA.name + "," + layerB.name;

			//２つのレイヤを子レイヤとしてセット
			layer.append(0,layerB);
			layer.append(1,layerA);
			Vec2.sub(layerB.position,layerB.position,layer.position);
			Vec2.sub(layerA.position,layerA.position,layer.position);

			//結合
			layer.composite();
			layer.type=0;
			layer.children=[];

			Vec2.add(layerB.position,layerB.position,layer.position);
			Vec2.add(layerA.position,layerA.position,layer.position);

			layer.refreshDiv();
			this.undo_data={"layerA":layerA,"position":position,"layerB":layerB,"positionB":position2,"layer":layer};
		}else{
			layer = this.layer;
		}


		//結合元レイヤを削除
		for(var li=0;li<ls.length;li++){
			var n=layers.indexOf(ls[li]);
			layers.splice(n,1);
		}

		//結合したレイヤを挿入
		parent_layer.append(n,layer);
		layer.select();
	}

	return ret;
})();
//レイヤ結合
Command["joinLayer"] = (function(){
	return function(log,undo_flg){

		var param = log.param;

		if(undo_flg){
			var undo_data=log.undo_data;
			var layer = undo_data.layer;
			var parent_layer = layer.parent;
			Hdrpaint.removeLayer(layer);
			parent_layer.append(undo_data.position,undo_data.layerA);
			parent_layer.append(undo_data.positionB,undo_data.layerB);
			return;
		}

		var layer;
		var layerA = Layer.findById(param.layer_id);
		var layerB = Layer.findById(param.layer_id2);
		var parent_layer = layerA.parent;
		var layers = parent_layer.children;
		var ls=[layerA,layerB];

		if(!log.undo_data){

			//２つのレイヤが収まるサイズのグループレイヤを作成
			var x=Math.min(layerA.position[0] ,layerB.position[0]);
			var y=Math.min(layerA.position[1] ,layerB.position[1]);
			var right = Math.max(layerA.position[0]+layerA.img.width,layerB.position[0]+layerB.img.width);
			var bottom = Math.max(layerA.position[1]+layerA.img.height,layerB.position[1]+layerB.img.height);
			var width  = right-x;
			var height= bottom-y;
			var position = layers.indexOf(layerA);
			var position2 = layers.indexOf(layerB);
			var img = new Img(width,height);
			layer =Layer.create(img,1);
			layer.position[0]=x;
			layer.position[1]=y;
			layer.name=layerA.name + "," + layerB.name;

			//２つのレイヤを子レイヤとしてセット
			layer.append(0,layerB);
			layer.append(1,layerA);
			Vec2.sub(layerB.position,layerB.position,layer.position);
			Vec2.sub(layerA.position,layerA.position,layer.position);

			//結合
			layer.composite();
			layer.type=0;
			layer.children=[];

			Vec2.add(layerB.position,layerB.position,layer.position);
			Vec2.add(layerA.position,layerA.position,layer.position);

			layer.refreshDiv();
			log.undo_data={"layerA":layerA,"position":position,"layerB":layerB,"positionB":position2,"layer":layer};
		}else{
			layer = log.undo_data.layer;
		}


		//結合元レイヤを削除
		for(var li=0;li<ls.length;li++){
			var n=layers.indexOf(ls[li]);
			layers.splice(n,1);
		}

		//結合したレイヤを挿入
		parent_layer.append(n,layer);
		layer.select();

	}

})();
