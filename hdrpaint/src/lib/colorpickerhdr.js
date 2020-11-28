import {Vec3,Vec4} from "./vector.js"
import Slider from "./slider.js";
import Util from "./util.js";
import Img from "./img.js";

//カラーピッカーHDR

var div;
var sv_img;
var h_img;
var h_cursor;
var s_cursor;
var v_cursor;
var R_txt;
var G_txt;
var B_txt;
var A_txt;
var Vi_txt;

var drag_from=0;
var safe=0;
var rgb=new Vec3();
var hsv=new Vec3();
var parentInput=null;//カラーピッカーが表示されている親コントロール
var hsv = new Vec3();
var col = new Vec3();
var col_org = new Vec3();
var img = new Img(128,128,Img.FORMAT_UINT8);

var updateTextArea=function(textArea){
	//テキストの内容を背景色にセット

	var sp = textArea.value.split(",");
	rgb[0]=Number(sp[0]);
	rgb[1]=Number(sp[1]);
	rgb[2]=Number(sp[2]);

//	var max = Math.max(Math.max(rgb[0],Math.max(rgb[1],rgb[2])),1);
//
//	Vec3.mul(rgb,rgb,1/max);

	textArea.style.backgroundColor= "rgb(" + rgb[0]*255+","+rgb[1]*255+"," + rgb[2]*255 +")"
	textArea.style.color=(0.3*rgb[0]+0.6*rgb[1]+0.1*rgb[2]<0.5)?"white":"black";
}

var redrawSv=function(){
	var idx=0;


	col[0]=hsv[0];
	col[1]=1;
	col[2]=1;
	Util.hsv2rgb(col_org,col);
	var data=img.data;
	var alpha = Number(A_txt.value)*255;
	for(var yi=0;yi<img.height;yi++){
		var yf = yi/img.height;
		col[0]=(1-col_org[0])*yf+col_org[0];
		col[1]=(1-col_org[1])*yf+col_org[1];
		col[2]=(1-col_org[2])*yf+col_org[2];
		Vec3.mul(col,col,255/img.width);
		for(var xi=0;xi<img.width;xi++){
			data[idx]= col[0]*xi;
			data[idx+1]=col[1]*xi;
			data[idx+2]=col[2]*xi;
			data[idx+3]=alpha;
			
			idx+=4;
		}
	}
	sv_img.src = img.toDataURL();
	
}
var changeColor=function(){
	rgb[0]=Number(R_txt.value);
	rgb[1]=Number(G_txt.value);
	rgb[2]=Number(B_txt.value);

	var max = Math.max(Math.max(rgb[0],Math.max(rgb[1],rgb[2])),1);
	Vec3.mul(col,rgb,1/max);

	Util.rgb2hsv(hsv,col);

	redrawSv();
	setCursor(hsv);

	Vi_txt.value=Math.log2(max);
}

var parentUpdate=()=>{
	parentInput.value = R_txt.value
		+", " +G_txt.value
		+", " +B_txt.value
		+", " +A_txt.value;
	Util.fireEvent(parentInput,"change");

	updateTextArea(parentInput);
}
var down=function(e){
	if(!(e.buttons&1)){
		drag_from=0;
		safe=0;
	}
	switch(drag_from){
	case 1:
		var rect = sv_img.getBoundingClientRect();
		hsv[2]=e.clientX- rect.left;
		hsv[1]=e.clientY- rect.top;
		hsv[2]/=img.width;
		hsv[1]/=img.height;
		hsv[1]=1-hsv[1];
		hsv[1]=Math.min(Math.max(hsv[1],0),1);
		hsv[2]=Math.min(Math.max(hsv[2],0),1);
		break;
	case 2:
		var rect = h_img.getBoundingClientRect();
		hsv[0]=e.clientY- rect.top;
		hsv[0]=hsv[0]/h_img.height;
		hsv[0]=Math.min(Math.max(hsv[0],0),1);

		redrawSv();
		break;
	default:
		return;
	}

	setCursor(hsv);
	var vi = Math.pow(2,Number(Vi_txt.value));

	Util.hsv2rgb(rgb,hsv);

	R_txt.value = (rgb[0]*vi).toFixed(3);
	G_txt.value = (rgb[1]*vi).toFixed(3);
	B_txt.value = (rgb[2]*vi).toFixed(3);


	parentUpdate();
	

}
var setRGB=function(col){
	Vec3.copy(rgb,col);
	Util.rgb2hsv(hsv,rgb);
	setCursor(hsv);
}

var	setCursor=function(hsv){
	h_cursor.style.top=hsv[0]*127-1+"px";
	s_cursor.style.top=(1-hsv[1])*127-1+"px";
	v_cursor.style.left=hsv[2]*127-1+"px";
}

export default class ColorpickerHDR{

	constructor(){}
	static init(){
	var html = `
			<div id="colorpickerhdr"  onselectstart="return false;">
				<div class="divMain">
					<div style="position:relative;display:inline-block;">
						<img id="cphdr_sv_img" width="128" height="128" draggable="false">
						<div id="cphdr_s_cursor" class="cursor"></div>
						<div id="cphdr_v_cursor" class="cursor"></div>
					</div>
					<div style="position:relative;display:inline-block;">
						<img id="cphdr_h_img" width="8" height="128" draggable="false">
						<div id="cphdr_h_cursor" class="cursor" ></div>
					</div>
				</div>
				<div class="color_status" style="float:left;">
					<ul>
					<li class="red">R<input type="text" id="cphdr_R_txt" value="0.8" /></li>
					<li class="green">G<input type="text" id="cphdr_G_txt" value="0.2"/></li>
					<li class="blue">B<input type="text" id="cphdr_B_txt" value="0.2"/></li>
					</ul>
				</div>
				<div style="clear:both;">
					明るさ<input class="slider" id="cphdr_Vi_txt" min="-10" max="10" value="0" step="0.01"/>
				</div>
				A<input class="slider" id="cphdr_A_txt" max="1" value="1" step="0.001"/>
			</div>
		`;

		//var div= document.createElement("div");
		//div.id="div_colorpickerhdr";
		document.body.insertAdjacentHTML('beforeend',html);


		div = document.querySelector("#colorpickerhdr");
		sv_img = document.querySelector("#cphdr_sv_img");
		h_img = document.querySelector("#cphdr_h_img");
		h_cursor = document.querySelector("#cphdr_h_cursor");
		s_cursor = document.querySelector("#cphdr_s_cursor");
		v_cursor = document.querySelector("#cphdr_v_cursor");
		R_txt= document.querySelector("#cphdr_R_txt");
		G_txt= document.querySelector("#cphdr_G_txt");
		B_txt= document.querySelector("#cphdr_B_txt");
		Vi_txt= document.querySelector("#cphdr_Vi_txt");
		A_txt= document.querySelector("#cphdr_A_txt");
		Slider.init(div);

		//div.parentNode.removeChild(div);

		div.style.position="absolute";
		div.style.display="none";
		redrawSv(0);

		var data = img.data;
		var idx=0;
		for(var yi=0;yi<128;yi++){
			col[0]=yi/128;
			col[1]=1;
			col[2]=1;
			Util.hsv2rgb(col,col);
			col[0]=(col[0]*255)|0;
			col[1]=(col[1]*255)|0;
			col[2]=(col[2]*255)|0;
			idx = img.getIndex(0,yi)<<2;
			for(var xi=0;xi<8;xi++){
				data[idx]=col[0];
				data[idx+1]=col[1];
				data[idx+2]=col[2];
				data[idx+3]=255;
				idx+=4;
			}
		}
		h_img.src = img.toDataURL("image/png",1.0,0,0,8,128);

		Vec3.set(col,1,1,1);
		setRGB(col);

	div.querySelector(".color_status").addEventListener("change",()=>{
		changeColor();
		parentUpdate();
		}
	);
	A_txt.addEventListener("change",()=>{
		changeColor();
		parentUpdate();
		}
	);
	Vi_txt.addEventListener("change",function(){
		var vi = Math.pow(2,Number(Vi_txt.value));
		Util.hsv2rgb(col,hsv);
		R_txt.value=(col[0]*vi).toFixed(3);
		G_txt.value=(col[1]*vi).toFixed(3);
		B_txt.value=(col[2]*vi).toFixed(3);
		parentUpdate();

	});
	sv_img.parentNode.addEventListener("pointerdown",(e)=>{
		drag_from=1;
		down(e);
	});
	
	h_img.parentNode.addEventListener("pointerdown",(e)=>{
		drag_from=2;
		down(e);
	});

	window.addEventListener("pointermove",down);

		//ページ読み込み時に className="colorpicker"のinputタグを対象に
		//カラーピッカーコントロール対応させる
		var e = document.getElementsByClassName('colorpickerhdr');

			div.addEventListener("pointerdown",function(evt){
				safe=1;

			});
			window.addEventListener("pointerdown",function(evt){
				if(!safe){
					div.style.display="none";
				}
				safe=0;
			});
		for(var i=0; i<e.length; i+=1) {
			var node=e[i];
			
			node.addEventListener("click",function(evt){

				//クリック時、カラーピッカーを表示
				parentInput=this;
				div.style.display="block";

				var rect = this.getBoundingClientRect();
				div.style.left=rect.left + window.pageXOffset+"px";
				div.style.top=rect.top+rect.height  +window.pageYOffset +"px";


				var cols = evt.currentTarget.value.split(",");

				R_txt.value = cols[0];
				G_txt.value = cols[1];
				B_txt.value = cols[2];
				A_txt.value = cols[3];

				changeColor();

				safe=1;

			});
			node.addEventListener("input",function(evt){
				//内容変更時、背景色とカーソルをリフレッシュする
				updateTextArea(this);
				//setCursor(this.value);
			});
			
		}
	}
};
window.addEventListener("load",ColorpickerHDR.init,false);
