//ƒŒƒCƒ„íœ
Command["deleteLayer"] = (function(){
	return function(log,undo_flg){

		if(undo_flg){
			var layer = log.undo_data.layer;
			var idx = log.undo_data.position;
			var parent_layer = Layer.findById(log.undo_data.parent);

			parent_layer.append(idx,layer);
			return;
		}
		var layer_id = log.param.layer_id;

		var layer = Layer.findById(layer_id);
		var parent_layer = Layer.findParent(layer);
		if(parent_layer){
			var layers = parent_layer.children;
			var idx=  layers.indexOf(layer);

			if(!log.undo_data){
				log.undo_data ={"layer":layer,"position":idx,"parent":parent_layer.id};
			}

			//ƒŒƒCƒ„íœ
			 if(idx<0){
				 return;
			 }
			if(layer === selected_layer){
				if(layers.length>0){
					Layer.select(layers[Math.max(idx-1,0)]);
				}else{
					Layer.select(null);
				}
			}
			 

			layers.splice(idx,1);
			layer.div.classList.remove("active_layer");
			parent_layer.refreshDiv();


		}
		if(parent_layer){
			parent_layer.bubbleComposite();
		}
	}
})();
