
var selected_brush=null;
var brushes=[];
var brush_id_count=0;
var Brush=(function(){
//ブラシ
	var Brush = function(){
		this.name="";
		this.color_effect=[1,1,1,1];
		this.weight=4.0;
		this.softness=0.0;
		this.overlap=0;
		this.pressure_efect_flgs=1;
		this.stroke_correction=0;
		this.stroke_interpolation=1;
		this.div=[];
	};
	var ret = Brush;

	return ret;
})();

getBrushFromDiv=function(div){
	var result_brush = null;
	return brushes.find(function(a){
		return (a.div==div);});
}

var brush_inputs=[];
var onload=function(){
	brush_inputs = Array.prototype.slice.call(document.getElementById("brush_param").getElementsByTagName("input"));
	brush_inputs = brush_inputs.concat(Array.prototype.slice.call(document.getElementById("brush_param").getElementsByTagName("select")));

	var inputs=brush_inputs;
	for(var i=0;i<inputs.length;i++){
		var input = inputs[i];
		var f = function(e){
			if(!selected_brush){
	  			return;
	  		}
			var input = e.target;
			var brush= selected_brush;
			var member = e.target.id.replace("brush_","");
			if(input.getAttribute("type")==="checkbox"){
				brush[member]=input.checked;
			}else{
				brush[member]=input.value;
			}
		}

		input.addEventListener("change",f);
	}
}
window.addEventListener("load",onload);
var refreshActiveBrushParam = function(){
	//アクティブブラシパラメータ更新
	var brush= selected_brush;
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

	refreshActiveBrushParam();
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

	Command.executeCommand("moveBrush",{"brush_id":drag_brush.id
		,"parent_brush_id":parent_brush.id,"position":position});

	var num = brushes.indexOf(drag_brush);
	brushes.splice(num,1);

	num= brushes.indexOf(drop_brush);
	layers.splice(num,0,drag_brush);
}

var createBrush=function(){
	var brush_template= document.getElementById("brush_template");
	var brush = new Brush();


	var brush_div = brush_template.children[0].cloneNode(true);
	if(brush.type == 1){
		brush_div.classList.add("group");
	}

	brush_div.addEventListener("click",brusheselect);
	brush.div=brush_div;

	brush.id=brush_id_count;
	brush_id_count++;
	brush.name ="brush"+("0000"+brush.id).slice(-4);

	refreshBrush(brush);

	return brush;

}

var refreshBrush= function(brush){
	if(!brush){
		var container = document.getElementById("brushes_container");
		//子ブラシセット
		while (container.firstChild)container.removeChild(container.firstChild);
		for(var li=brushes.length;li--;){
			container.appendChild(brushes[li].div);
		}


	}else{
		var div= brush.div.getElementsByClassName("name")[0];
		div.innerHTML=brush.name;
		var span = brush.div.getElementsByClassName("attributes")[0];
		var txt="";
		span.innerHTML = txt;

	}

	if(brush === selected_brush){
		refreshActiveBrushParam();
	}



}

