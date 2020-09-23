//レイヤ結合
Command["joinLayer"] = (function(){
	return function(log,undo_flg){

		var param = log.param;

		if(undo_flg){
			var undo_data=log.undo_data;
			removeNewLayer(undo_data.layer);
			root_layer.append(undo_data.position,undo_data.layerA);
			root_layer.append(undo_data.positionB,undo_data.layerB);
			return;
		}

		var layer;
		var layerA = Layer.findById(param.layer_id);
		var layerB = Layer.findById(param.layer_id2);
		var parent_layer = Layer.findParent(layerA);
		var layers = parent_layer.children;
		var ls=[layerA,layerB];

		if(!log.undo_data){

			var x=Math.min(layerA.position[0] ,layerB.position[0]);
			var y=Math.min(layerA.position[1] ,layerB.position[1]);
			var right = Math.max(layerA.position[0]+layerA.img.width,layerB.position[0]+layerB.img.width);
			var bottom = Math.max(layerA.position[1]+layerA.img.height,layerB.position[1]+layerB.img.height);
			var width  = right-x;
			var height= bottom-y;
			var position = layers.indexOf(layerA);
			var position2 = layers.indexOf(layerB);
			log.undo_data={"layerA":layerA,"position":position,"layerB":layerB,"positionB":position2};

			var img = new Img(width,height);
			layer =Layer.create(img,1);
			layer.position[0]=x;
			layer.position[1]=y;
			layer.append(0,layerB);
			Vec2.sub(layerB.position,layerB.position,layer.position);
			Vec2.sub(layerA.position,layerA.position,layer.position);
			layer.append(1,layerA);
			layer.composite();
			layer.type=0;
			layer.children=[];

			layer.name=layerA.name + "+" + layerB.name;

			log.undo_data.layer=layer;
		}else{
			layer = log.undo_data.layer;
		}
		for(var li=0;li<ls.length;li++){
			var n=layers.indexOf(ls[li]);
			layers.splice(n,1);
		}

		parent_layer.append(n,layer);
		layer.refreshDiv();
		parent_layer.refreshDiv();

		Layer.refreshImg();

		Layer.select(layer);

	}

})();
