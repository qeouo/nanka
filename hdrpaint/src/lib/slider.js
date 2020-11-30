import Util from "./util.js"

var drag_target=null;

//ドラッグ時処理
var drag=function(evt){
	if(!evt){ evt = window.event; }
	if(!(e.buttons&1)){
		drag_target=null;
	}
	if(!drag_target){
		return;
	}

	var left = evt.clientX;
	var rect = slider.getBoundingClientRect();
	var width = input.offsetWidth / 2 * 0;
	var value = Math.round(left - rect.left- width);
	value/=slider.clientWidth;
	value=Math.max(Math.min(value,1),0);
	value=value * (slider.max-slider.min) + slider.min;
	setValue(value);
	//output.value = value;
	Util.fireEvent(output,"change")
	return false;
};
	down=(e)=>{
		var hsv = this.hsv;
		var rgb = this.rgb;
		switch(this.drag_from){
		case 1:
			var rect = this.sv_img.getBoundingClientRect();
			hsv[2]=e.clientX- rect.left;
			hsv[1]=e.clientY- rect.top;
			hsv[2]/=img.width;
			hsv[1]/=img.height;
			hsv[1]=1-hsv[1];
			hsv[1]=Math.min(Math.max(hsv[1],0),1);
			hsv[2]=Math.min(Math.max(hsv[2],0),1);
			break;
		case 2:
			var rect = this.h_img.getBoundingClientRect();
			hsv[0]=e.clientY- rect.top;
			hsv[0]=hsv[0]/this.h_img.height;
			hsv[0]=Math.min(Math.max(hsv[0],0),1);

			this.redrawSv();
			break;
		default:
			return;
		}

		this.setCursor(hsv);
		var vi = Math.pow(2,Number(this.Vi_txt.value));

		Util.hsv2rgb(rgb,hsv);

		this.R_txt.value = (rgb[0]*vi).toFixed(3);
		this.G_txt.value = (rgb[1]*vi).toFixed(3);
		this.B_txt.value = (rgb[2]*vi).toFixed(3);

		if(this.changeCallback){
			this.changeCallback();
		}
	}


var createDiv=function(slider){
	//対象のノードオブジェクトをスライダに置き換える
	var dragging = false; //ドラッグ状態

	var html =`
		<input type="text"  class="js-text">
		<div class="js-slider3">
			<span class="js-slider2"></span>
			<input type="button"  class="tumami">
		</div>
	`;

	//テキストエリア+スライダー
	var div=document.createElement("span");
	div.setAttribute("class","js-slider");


	div.insertAdjacentHTML('beforeend',html);

	var output=div.querySelector('.js-text');
	//溝
	slider.max=1.;
	slider.min=0.;
	var mizo=div.querySelector('.js-slider2');

	var input =div.querySelector('.tumami');
	var setValue = function (value){
		if(slider.step){
			value = Math.ceil(value/slider.step)*slider.step;
		}
		output.value = value;
		value = (value - slider.min)/(slider.max-slider.min)
		var max=slider.offsetWidth;
		var w = input.offsetWidth;
		if(w==0)w=15;
		if(max==0)max=100;
		input.style.left = (value*max - w/2) + 'px';
		//input.style.top = (-input.offsetHeight/2+2) + 'px';
	};
	
	//ドラッグ開始
	input.addEventListener("pointerdown",function(evt){drag_target=this;});

	//デフォルト処理無効
	input.addEventListener("touchmove",function(evt){ evt.preventDefault();});

	//クリック時ツマミ移動
	mizo.addEventListener("click",drag,false);

	//値直接変更時にツマミ反映
	//mizo.addEventListener("input",function(evt){setValue(evt.target.value);});

	setValue(output.value);

	return div;
}

var replace= function(node,div){
	//対象のノードオブジェクトをスライダに置き換える
	var id=node.id;
	var dragging = false; //ドラッグ状態

	//var div=createDiv();

	node.parentNode.replaceChild(div,node);
	var input = div.querySelector(".js-text");
	node.setAttribute("class","js-text");
	div.replaceChild(node,input);
	//input.id=node.id;
};


export default class Slider{
	//スライダーコントロール
	constructor(){
		this.min=0;
		this.max=0;
		this.step=0;
		this.node=createDiv(this);
	}
	static init=function(dom){
		if(!dom){
			dom = document;
		}

		var e = dom.querySelectorAll('input.slider');
		for(var i=0; i<e.length; i+=1) {
			var node=e[i];
			var slider = new Slider();
			replace(node,slider.node);
			
		}
	}
}
window.addEventListener("load",function(e){Slider.init();},false);
