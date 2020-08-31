//現在選択状態にあるブラシ
var selected_brush=null;

//全ブラシ
var brushes=[];

//現在のブラシID 作るたびインクリメントされる
var brush_id_count=0;

var Brush=(function(){
//ブラシ
	var Brush = function(){
		this.name="";
		this.color_effect=[1,1,1,1];
		this.weight=4.0;
		this.softness=0.0;
		this.overlap=0;
		this.alpha=1.0;
		this.antialias=0;
		this.weight_pressure_effect=0;
		this.alpha_pressure_effect=0;
		this.stroke_correction=0;
		this.stroke_interpolation=1;
		this.shortcut='';
		this.div=[];
	};
	var ret = Brush;

ret.create=function(){
	var brush_template= document.getElementById("brush_template");
	var brush = new Brush();

	var brush_div = brush_template.children[0].cloneNode(true);

	brush_div.addEventListener("click",brusheselect);
	brush.div=brush_div;

	brush.id=brush_id_count;
	brush_id_count++;
	brushes.push(brush);

	//現在の内容でアクティブブラシを更新
	var inputs=brush_inputs;

	for(var i=0;i<brush_inputs.length;i++){
		var input = brush_inputs[i];
		switch(input.id){
		default:
			var member = input.id.replace("brush_","");
			if(member in brush){
				if(input.getAttribute("type")==="checkbox"){
					brush[member] = input.checked;
				}else{
					brush[member]=input.value;
				}
			}
		}
	}

	brush.name ="brush"+("0000"+brush.id).slice(-4);
	refreshBrush(brush);
	refreshBrush();
	selectBrush(brush);

	return brush;

}

ret.update=function(){
	//現在の内容でアクティブブラシを更新
	var inputs=brush_inputs;
	var brush = selected_brush;

	for(var i=0;i<brush_inputs.length;i++){
		var input = brush_inputs[i];
		switch(input.id){
		default:
			var member = input.id.replace("brush_","");
			if(member in brush){
				if(input.getAttribute("type")==="checkbox"){
					brush[member] = input.checked;
				}else{
					brush[member]=input.value;
				}
			}
		}
	}

	brush.div.querySelector("img").src =  document.getElementById("pen_preview").src ;

	refreshBrush(brush);
	}
	Brush.delete=function(){
		var num = brushes.indexOf(selected_brush);
		brushes.splice(num,1);

		refreshBrush();
	}

	ret.setParam=function(param){
		param.color = new Float32Array(doc.draw_col);
		param.color_effect = new Float32Array([1.0,1.0,1.0,1.0]);
		param.weight=parseFloat(inputs["weight"].value);
		param.softness=parseFloat(inputs["softness"].value);

		param.overlap=inputs["brush_overlap"].value;
		param.pressure_effect_flgs= 
 			  (1 * inputs["weight_pressure_effect"].checked)
			| (2 * inputs["alpha_pressure_effect"].checked);
		param.stroke_interpolation = inputs["stroke_interpolation"].checked;

	}

	return ret;
})();

var getBrushFromDiv=function(div){
	var result_brush = null;
	return brushes.find(function(a){
		return (a.div===div);});
}
var brush_inputs=[];
var onload=function(){
	brush_inputs = Array.prototype.slice.call(document.getElementById("brush_param").getElementsByTagName("input"));
	brush_inputs = brush_inputs.concat(Array.prototype.slice.call(document.getElementById("brush_param").getElementsByTagName("select")));

}
window.addEventListener("load",onload);
var refreshActiveBrushParam = function(){
}
var selectBrush=function(target_brush){
	//アクティブブラシ変更
	selected_brush=target_brush;
	for(var bi=0;bi<brushes.length;bi++){
		var brush = brushes[bi];

		if(target_brush !== brush){
			//アクティブブラシ以外の表示を非アクティブにする
			brush.div.classList.remove("active");
		}else{
			brush.div.classList.add("active");
		}
	}

	//アクティブブラシパラメータ更新
	var brush= target_brush;
	if(!brush){
		return;
	}
	for(var i=0;i<brush_inputs.length;i++){
		var input = brush_inputs[i];
		switch(input.id){
		default:
			var member = input.id.replace("brush_","");
			if(member in brush){
				if(input.getAttribute("type")==="checkbox"){
					input.checked=brush[member];
				}else{
					input.value=brush[member];
				}
				Util.fireEvent(input,"input");
			}
		}
	}
	
	refreshpen_flg=true;

}
var brusheselect= function(e){
//ブラシー一覧クリック時、クリックされたものをアクティブ化する

	var brush=getBrushFromDiv(e.currentTarget);

	selectBrush(brush);

	e.stopPropagation();

}

//ドラッグ＆ドロップによるブラシ順編集
var drag_brush=null;
function DragStart(event) {
	//ドラッグ開始
	drag_brush= getBrushFromDiv(event.currentTarget);
//     event.dataTransfer.setData("text", drag_brush.id);
	 selectBrush(drag_brush);

	event.stopPropagation();
}
function dragover_handler(event) {
 event.preventDefault();
 event.dataTransfer.dropEffect = "move";
}	

function DragEnter(event) {
	//ドラッグ移動時
	var drop_brush = getBrushFromDiv(event.currentTarget);

	event.stopPropagation();
	if(drag_brush=== drop_brush){
		//自分自身の場合は無視
		return;
	}

	var num = brushes.indexOf(drag_brush);
	brushes.splice(num,1);

	num= brushes.indexOf(drop_brush);
	layers.splice(num,0,drag_brush);
}


var refreshBrush= function(brush){
	if(!brush){
		var container = document.getElementById("brushes_container");
		//子ブラシセット
		while (container.firstChild)container.removeChild(container.firstChild);
		for(var li=0;li<brushes.length;li++){
			container.appendChild(brushes[li].div);
		}


	}else{
		var div= brush.div.getElementsByClassName("name")[0];
		div.innerHTML=brush.shortcut + ":"  + brush.name;
		var span = brush.div.getElementsByClassName("attributes")[0];
		var txt="";
		span.innerHTML = txt;

	}




}

