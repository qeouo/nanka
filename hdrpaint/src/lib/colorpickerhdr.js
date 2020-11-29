import {Vec3,Vec4} from "./vector.js"
import Slider from "./slider.js";
import Util from "./util.js";
import Img from "./img.js";
import ColorSelector from "./colorselector.js";

//カラーピッカーHDR
var safe=0;
var rgb = new Vec3();
var parentInput=null;//カラーピッカーが表示されている親コントロール

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


var parentUpdate=()=>{

	parentInput.value = R_txt.value
		+", " +G_txt.value
		+", " +B_txt.value
		+", " +A_txt.value;
	Util.fireEvent(parentInput,"change");

	updateTextArea(parentInput);
}


var colorselector = new ColorSelector();
var div = colorselector.div;
div.classList.add("colorpickerhdr_form");

colorselector.changeCallback=function(){
	if(!parentInput){
		return;
	}
	parentInput.value = this.R_txt.value
		+", " +this.G_txt.value
		+", " +this.B_txt.value
		+", " +this.A_txt.value;
	Util.fireEvent(parentInput,"change");

	updateTextArea(parentInput);
}
document.body.appendChild(div);

export default class ColorpickerHDR{

	constructor(){}
	static init(){

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

				colorselector.R_txt.value = cols[0];
				colorselector.G_txt.value = cols[1];
				colorselector.B_txt.value = cols[2];
				colorselector.A_txt.value = cols[3];

				colorselector.changeColor();

				safe=1;

			});
			node.addEventListener("input",function(evt){
				//内容変更時、背景色とカーソルをリフレッシュする
				updateTextArea(this);
			});
			
		}
	}
};
window.addEventListener("load",ColorpickerHDR.init,false);
