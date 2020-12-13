
import Util from "./lib/util.js";
import {Vec2} from "./lib/vector.js"
import Img from "./lib/img.js";
import CommandLog from "./commandlog.js";
import Hdrpaint from "./hdrpaint.js";
import Redraw from "./redraw.js";
import Layer from "./layer.js";
let refresh_flg=false;
let pen_preview_img;
let pen_preview_log;
let brush_inputs=[];
let brush_id_count=0;
	var getBrushFromDiv=function(div){
		var result_brush = null;
		return brushes.find(function(a){
			return (a.dom===div);});
	}
	let refreshpen_flg=true;

var brushselect=function(e){
//ブラシー一覧クリック時、クリックされたものをアクティブ化する

	var brush=getBrushFromDiv(e.currentTarget);

	brush.select();

	e.stopPropagation();

}
	var drag_brush=null;
	var DragStart=function(event) {
		//ドラッグ開始
		drag_brush= getBrushFromDiv(event.currentTarget);
	//     event.dataTransfer.setData("text", drag_brush.id);

		event.stopPropagation();
	}
	//ドラッグ＆ドロップによるブラシ順編集
	var dragover_handler = function(event) {
	 event.preventDefault();
	 event.dataTransfer.dropEffect = "move";
	}	
	var DragEnter =function(event) {
		//ドラッグ移動時
		var drop_brush = getBrushFromDiv(event.currentTarget);

		event.stopPropagation();
		if(drag_brush=== drop_brush){
			//自分自身の場合は無視
			return;
		}

		var num = brushes.indexOf(drag_brush);
		var num2= brushes.indexOf(drop_brush);
		brushes.splice(num,1);

		brushes.splice(num2,0,drag_brush);
		Brush.refreshBrush();
	}
export default class Brush{
//ブラシ
	constructor(){
		this.name="";
		this.color_effect=[1,1,1,1];
		this.weight=3.0;
		this.softness=0.0;
		this.overlap=0;
		this.alpha=1.0;
		this.antialias=0;
		this.eraser=0;
		this.weight_pressure_effect=0;
		this.alpha_pressure_effect=0;
		this.stroke_correction=0;
		this.stroke_interpolation=1;
		this.shortcut='';

		var html=` 
				<img draggable="false">
				<span class="name"></span>
				<div class="attributes"></div>
			`

		var dom =document.createElement("div");
		dom.insertAdjacentHTML('beforeend',html);

		dom.classList.add("brush");
		dom.setAttribute("draggable","true");
		dom.addEventListener("click",brushselect);
		dom.addEventListener("dragstart",DragStart);
		dom.addEventListener("dragover",dragover_handler);
		dom.addEventListener("dragenter",DragEnter);

		this.dom=dom;
	};

	static init(){
		var f = document.getElementById("brush_param");
		brush_inputs = Array.prototype.slice.call(f.getElementsByTagName("input"));
		brush_inputs = brush_inputs.concat(Array.prototype.slice.call(f.getElementsByTagName("select")));

		document.querySelector("#up_brush").addEventListener(
			"click"
			  ,function(){
				var num = brushes.indexOf(selected_brush);
				if(num<=0){ return; }
				brushes.splice(num,1);
				brushes.splice(num-1,0,selected_brush);
				Brush.refreshBrush();
			});
		document.querySelector("#down_brush").addEventListener(
			"click"
			  ,function(){
				var num = brushes.indexOf(selected_brush);
				if(num+1>=brushes.length){ return; }
				brushes.splice(num,1);
				brushes.splice(num+1,0,selected_brush);
				Brush.refreshBrush();
			});
		document.querySelector("#update_brush").addEventListener(
			"click"
			  ,function(){selected_brush.update();});
		document.querySelector("#create_brush").addEventListener(
			"click"
			,function(){
				var brush = Brush.create()
				brushes.push(brush);
				brush.update();
				brush.select();
				Brush.refreshBrush();
			});
		document.querySelector("#delete_brush").addEventListener(
			"click"
			  ,function(){selected_brush.delete();});


		//ブラシプレビュー準備
		pen_preview_log= new Hdrpaint.commandObjs.brush();
		var param = pen_preview_log.param;
		var pen_preview=  document.getElementById('pen_preview');
		pen_preview_img= new Img(pen_preview.width,pen_preview.height);
		param.layer =Hdrpaint.createLayer(pen_preview_img,0);

		var points=[];
		var xs=[-1,-0.7,-0.3,0.3,0.7,1];
		for(var i=0;i<xs.length;i++){
			var x = xs[i];
			var point={"pos":new Vec2(),"pressure":0};
			point.pos[0]=(x*0.8+1)*(pen_preview.width>>>1);
			point.pos[1]=(Math.sin(x*Math.PI)*0.7+1)*(pen_preview.height>>>1);
			point.pressure= 1-(i/(xs.length-1));
			
			points.push(point);
		}
		param.points=points;
		param.color_effect = new Float32Array([1.0,1.0,1.0,1.0]);
		param.undo_data={};


	}
	//削除
	delete (){
		var num = brushes.indexOf(this);
		brushes.splice(num,1);

		if(num>=brushes.length){
			num=brushes.length-1;
		}
		if(num>=0){
			brushes[num].select();
		}
		Brush.refreshBrush();

	}

	//現在のブラシID 作るたびインクリメントされる
	static create(){
		var brush = new Brush();



		brush.id=brush_id_count;
		brush_id_count++;
		//brushes.push(brush);

		brush.name ="brush"+("0000"+brush.id).slice(-4);

		Brush.refreshBrush(brush);
		//refreshBrush();
		//brush.select();

		return brush;

	}
	refresh (){
		Brush.refreshBrush(this);
		Brush.refreshPen(this);
	}

	update(){
		//現在の内容でアクティブブラシを更新
		var inputs=brush_inputs;
		var brush = this;

		for(var i=0;i<brush_inputs.length;i++){
			var input = brush_inputs[i];
			switch(input.id){
			default:
				var member = input.id.replace("brush_","");
				if(member in brush){
					if(input.getAttribute("type")==="checkbox"){
						brush[member] = Number(input.checked);
					}else{
						brush[member]=input.value;
					}
				}
			}
		}

		brush.refresh();
	}
		delete(){
			var num = brushes.indexOf(selected_brush);
			brushes.splice(num,1);

			Brush.refreshBrush();
		}

		static setParam(param){
			//param.color = new Float32Array(doc.draw_col);
			param.color = new Float32Array(4);
			param.color[0] = Hdrpaint.color[0];
			param.color[1] = Hdrpaint.color[1];
			param.color[2] = Hdrpaint.color[2];
			param.color[3] = Hdrpaint.color[3];
			param.weight=Number(inputs["weight"].value);
			param.softness=Number(inputs["softness"].value);
			param.antialias=Number(inputs["brush_antialias"].checked);
			param.eraser = Number(inputs["eraser"].checked);
			param.alpha = inputs["brush_alpha"].value;

			
			param.overlap=parseInt(inputs["brush_overlap"].value);
			param.pressure_effect_flgs= 
				  (1 * Number(inputs["weight_pressure_effect"].checked))
				| (2 * Number(inputs["alpha_pressure_effect"].checked));
			param.alpha_pressure_effect = inputs["alpha_pressure_effect"].checked;
			param.stroke_interpolation = inputs["stroke_interpolation"].checked;

		}

		static refreshPen(brush){
			var param = pen_preview_log.param;
			if(!brush){
				Brush.setParam(param);
			}else{
				param.color = new Float32Array([0,0,0,1]);
				param.weight=parseFloat(brush["weight"]);
				param.softness=parseFloat(brush["softness"]);
				param.antialias=brush.antialias;
				param.alpha = brush.alpha;

				param.eraser = brush.eraser;
				
				param.overlap=parseInt(brush.overlap);
				param.pressure_effect_flgs= 
					  (1 * brush.weight_pressure_effect)
					| (2 * brush.alpha_pressure_effect);
				param.alpha_pressure_effect= 
					brush.alpha_pressure_effect;
				param.stroke_interpolation = brush.stroke_interpolation;
			}

			Hdrpaint.painted_mask.fill(0);
			if(param.eraser){
				//黒でクリア
				var data = pen_preview_img.data;
				var size = data.length;
				for(var i=0;i<size;i+=4){
					data[i]=0;
					data[i+1]=0;
					data[i+2]=0;
					data[i+3]=1;
				}
			}else{
				//透明でクリア
				pen_preview_img.clear();
			}

			var points = pen_preview_log.param.points;
			for(var li=1;li<points.length;li++){
				pen_preview_log.draw(li);
			}
			var dataurl = pen_preview_img.toDataURL();
			if(brush){
				brush.dom.querySelector("img").src = dataurl;
			}else{
				document.getElementById("pen_preview").src=dataurl;
			}


		}


		static refreshPreview (){
			if(!refresh_flg){
				window.requestAnimationFrame(Brush.refreshPreview_);
				refresh_flg=true;
			}
		}
		static refreshPreview_(){
			if(refreshpen_flg){
				Brush.refreshPen();
				refresh_flg=false;
			}
		}

		select(){
			//アクティブブラシ変更
			selected_brush=this;
			for(var bi=0;bi<brushes.length;bi++){
				var brush = brushes[bi];

				if(selected_brush !== brush){
					//アクティブブラシ以外の表示を非アクティブにする
					brush.dom.classList.remove("active");
				}else{
					brush.dom.classList.add("active");
				}
			}

			//アクティブブラシパラメータ更新
			var brush= this;
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

			//ブラシ選択状態にする
			inputs["pen"].checked=true;
			Brush.refreshPreview();
			
		}


	static refreshBrush(brush){
		if(!brush){
			var container = document.getElementById("brushes_container");
			//子ブラシセット
			while (container.firstChild)container.removeChild(container.firstChild);
			for(var li=0;li<brushes.length;li++){
				container.appendChild(brushes[li].dom);
			}


		}else{
			var div= brush.dom.getElementsByClassName("name")[0];
			div.innerHTML="[" + brush.shortcut + "]"  + brush.name;
			var span = brush.dom.getElementsByClassName("attributes")[0];
			var txt="";
			span.innerHTML = txt;

		}
	}




};

