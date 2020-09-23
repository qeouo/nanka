//ƒŒƒCƒ„V‹Kì¬
Command["createNewLayer"] = (function(){
	return function(log,undo_flg){
		var param = log.param;
		var width = param.width;
		var height= param.height;
		var n= param.position;

		var layer;
		if(undo_flg){
			//removeNewLayer(log.undo_data.layer);

			layer = log.undo_data.layer;
			var parent_layer = Layer.findParent(layer);
			var layers = parent_layer.children;
			var idx = layers.indexOf(layer);

			if(layer == selected_layer){
				if(parent_layer.children.length>1){
					if(parent_layer.children.length<=idx){
						idx--;
					}
					
					parent_layer.children[idx].select();
				}
			}
			layers.splice(idx,1);
			parent_layer.refreshDiv();
			parent_layer.bubbleComposite();
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

			layer =Layer.create(img,param.composite_flg);
			log.undo_data={"layer":layer};
		}else{
			layer = log.undo_data.layer;
		}
		var parentLayer = Layer.findById(param.parent);

		parentLayer.append(n,layer);
		Layer.select(layer);

		return layer;

	}
})();

Command["createNewCompositeLayer"]=(function(){
	return function(log,undo_flg){
		Command.createNewLayer(log,undo_flg);
	}
})();
