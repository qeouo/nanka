
var layers=[];
var selected_layer = null;
var layers_container;
var layer_id=0;
var getLayerNum=function(div){
	//divからレイヤー番号取得
	return layers.findIndex(function(l){return l.div===div;});
}

var refreshLayer = function(layer,thumb){
	//レイヤサムネイル更新
	if(thumb){
		layer.img.createThumbnail(thumbnail_ctx);
		var layer_img=layer.div.getElementsByTagName("img")[0];
		layer_img.src=thumbnail_canvas.toDataURL("image/png");
	}

	var div= layer.div.getElementsByTagName("div")[0];
	div.innerHTML=layer.name;
	var span = layer.div.getElementsByTagName("span")[0];
	var txt="";
	for(var i=1;i<layerValues.length;i++){
		var member = layerValues[i];
		txt +=  member +": ";
		if(!isNaN(layer[member])){
			txt += parseFloat(layer[member]).toFixed(4);
		}else{
			txt += layer[member];
		}
	 	txt+="<br>" ;
	}
	 if(!layer.display){
		layer.div.classList.add("disable_layer");
	 }else{
		layer.div.classList.remove("disable_layer");
	 }

	span.innerHTML = txt;

	if(selected_layer===layer){
		var layer_inputs = Array.prototype.slice.call(document.getElementById("layer_param").getElementsByTagName("input"));
		layer_inputs = layer_inputs.concat(Array.prototype.slice.call(document.getElementById("layer_param").getElementsByTagName("select")));
		for(var i=0;i<layer_inputs.length;i++){
			var input = layer_inputs[i];
			var member = input.id.replace("layer_","");
			if(member in layer){
				if(input.getAttribute("type")==="checkbox"){
					input.checked=layer[member];
				}else{
					input.value=layer[member];
				}
				Util.fireEvent(input,"input");
			}
		}
	}
	

}

var layerSelect= function(e){
//レイヤー一覧クリック時、クリックされたものをアクティブ化する
	for(var li=0;li<layers.length;li++){
	  var layer=layers[li];
	  if(this === layer.div){
		//パラメータ変更による再描画を一時的に無効にする
		refreshoff=true;

	  	selected_layer=layer;
	var layer_inputs = Array.prototype.slice.call(document.getElementById("layer_param").getElementsByTagName("input"));
	layer_inputs = layer_inputs.concat(Array.prototype.slice.call(document.getElementById("layer_param").getElementsByTagName("select")));
		for(var i=0;i<layer_inputs.length;i++){
			var input = layer_inputs[i];
			var member = input.id.replace("layer_","");
			if(member in layer){
	  			if(input.getAttribute("type")==="checkbox"){
	  				input.checked=layer[member];
				}else{
					input.value=layer[member];
				}
				Util.fireEvent(input,"input");
	   		}
		}

		layer.div.classList.add("active_layer");
		refreshoff=false;
	  }else{
		layer.div.classList.remove("active_layer");
	  }
	}

}

var createNewLayer=function(e){
	//新規レイヤーを作成
	var width=document.getElementById("width").value;
	var height=document.getElementById("height").value;
	
	if(isNaN(width) || isNaN(height) || width ==="" || height===""){
		width=preview.width;
		height=preview.height;
	}
	var img = new Img(width,height);
	var idx= layers.indexOf(selected_layer)+1;
	
	var layer=Command.createLayer(img,idx);

	refreshLayer(layer,true);
	refreshMain(0);

}
function DragStart(event) {
     event.dataTransfer.setData("text", getLayerNum(event.currentTarget));
}
function dragover_handler(ev) {
 ev.preventDefault();
 ev.dataTransfer.dropEffect = "move";
}	
function Drop(event) {
    var drag = event.dataTransfer.getData("text");
	var drag_div = layers[drag].div;
	if(drag_div === event.currentTarget){
		return;
	}
	var layer=layers[drag];
	layers.splice(drag,1);
	var drop = getLayerNum(event.currentTarget);
	var drop_div = layers[drop].div;

	var layers_container = document.getElementById("layers_container");
	if(event.offsetY<32){
		layers_container.insertBefore(drag_div,drop_div);
		layers.splice(drop+1,0,layer);
	}else{
		layers_container.insertBefore(drag_div,drop_div.nextSibling);
		layers.splice(drop,0,layer);
	}
	refreshMain(0);

}

	Command.createLayer=function(img,idx){
		if( typeof idx=== 'undefined'){
			idx=layers.length;
		}
		if(idx<0){
			idx=layers.length;
		}
		var layer_template= document.getElementById("layer_template");
		var layer = new Layer();
		var layer_div = layer_template.children[0].cloneNode(true);
		layer_div.addEventListener("click",layerSelect);
		layer.div=layer_div;

		

		layer.img=img;

		if(img.width>=preview.width || img.height>=preview.height){
			//開いた画像がキャンバスより大きい場合は広げる
			preview.width=Math.max(img.width,preview.width);
			preview.height=Math.max(img.height,preview.height);
			resetCanvas(preview.width,preview.height);
		}


		if(!selected_layer){
			Util.fireEvent(layer_div,"click");
		}

		layers.splice(idx,0,layer);

		var layers_container = document.getElementById("layers_container");
		for(var li=layers.length;li--;){
			layers_container.appendChild(layers[li].div);
		}



		layer.id=layer_id;
		layer_id++;
		layer.name ="layer"+("0000"+layer.id).slice(-4);
		History.createLog("createLayer",{"layer":layer,"idx":idx},"createLayer ⇒ "+layer.name);
		 return layer;

	}

 //レイヤ削除
Command.deleteLayer=function(layer){
	var li=layers.indexOf(layer);
	 if(li<0){
		 return;
	 }
	 

	layers.splice(li,1);
	layer.div.parentNode.removeChild(layer.div);
	layer.div.classList.remove("active_layer");

	createLog("deleteLayer",{"layer":layer,"idx":li});

	if(layer === selected_layer){
		li = Math.max(li-1,0);
		if(layers.length){
			selected_layer = layers[li]
			Util.fireEvent(selected_layer.div,"click");
		}
	}else{
		selected_layer = null;
	}
	refreshMain();
}

Command.changeLayerAttribute=function(layer,name,value){
	var flg = true;
	if(History.isEnableLog()){
		var log =History.getCurrent();
		if(log){
			if(log.param.layer === layer
				&& log.param.name === name){
				log.param.after = value;
				log.label = "layer"+layer.id + "."+name + "=" + value;
				log.label="[" + ("0000" + log.id).slice(-4) + "]" + log.label;
				Util.setText(log.option, log.label);
				flg = false;
			}
		}
	}

	if(flg){
		History.createLog("changeLayerAttribute",{"layer":layer,"name":name,"before":layer[name],"after":value},"layer"+layer.id + "."+name + "=" + value);
	}
	layer[name] = value;

	refreshLayer(layer);
	refreshMain(0);

}
