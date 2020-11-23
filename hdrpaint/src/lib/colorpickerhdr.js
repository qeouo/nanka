
import {Vec3} from "./vector.js"
import Slider from "./slider.js";
	//�J���[�s�b�J�[HDR
	var rgb=new Vec3();
	var hsv=new Vec3();
	var parentInput=null;//�J���[�s�b�J�[���\������Ă���e�R���g���[��
	var dragflg=0;//�J���[�s�b�J�[������ 1��HS 2��V

	var rgb2hex=function(rgb){
		//rgb��16�i���̕�����ɕϊ�
		var r = (0x100|rgb[0]*255).toString(16)
		var g = (0x100|rgb[1]*255).toString(16)
		var b = (0x100|rgb[2]*255).toString(16)
		return r.slice(-2) + g.slice(-2) + b.slice(-2)
	}

	var hex2rgb=function(rgb,hex){
		//16�i���̕������rgb�ɕϊ�
		rgb[0] = parseInt(hex.slice(0,2),16)/255;
		rgb[1] = parseInt(hex.slice(2,4),16)/255;
		rgb[2] = parseInt(hex.slice(4,6),16)/255;
		if(isNaN(rgb[0])){rgb[0]=0};
		if(isNaN(rgb[1])){rgb[1]=0};
		if(isNaN(rgb[2])){rgb[2]=0};
		return rgb;
	}

	var hsv2rgb=function(rgb,hsv){
		//hsv��rgb�ɕϊ�
		var f;
		var i, p, q, t;
		var v = hsv[2];
		var h =hsv[0];
		var s =hsv[1];
		i = (h*6|0) % 6;
		f = h*6-(h*6|0);
		p = v * (1.0 - s );
		q = v * (1.0 - s  * f);
		t = v * (1.0 - s  * (1.0 - f));
		
		switch(i){
			case 0 : rgb[0] = v; rgb[1] = t; rgb[2] = p; break;
			case 1 : rgb[0] = q; rgb[1] = v; rgb[2] = p; break;
			case 2 : rgb[0] = p; rgb[1] = v; rgb[2] = t; break;
			case 3 : rgb[0] = p; rgb[1] = q; rgb[2] = v; break;
			case 4 : rgb[0] = t; rgb[1] = p; rgb[2] = v; break;
			case 5 : rgb[0] = v; rgb[1] = p; rgb[2] = q; break;
		}

		return rgb;
	}

	var rgb2hsv=function(hsv,rgb){
		//rgb��hsv�ɕϊ�
		var max = Math.max(rgb[0], Math.max(rgb[1], rgb[2]));
		var min = Math.min(rgb[0], Math.min(rgb[1], rgb[2]));

		if(max == min){
			hsv[0] = 0;
		} else if(max == rgb[0]){
			hsv[0] = (1/6* (rgb[1] - rgb[2]) / (max - min) + 1);
		} else if(max == rgb[1]){
			hsv[0] = (1/6* (rgb[2] - rgb[0]) / (max - min)) + 2/6;
		} else if(max == rgb[2]){
			hsv[0] = (1/6* (rgb[0] - rgb[1]) / (max - min)) + 4/6;   
		}
		hsv[0]-=hsv[0]|0;

		if(max == 0){
			hsv[1] = 0;
		} else{
			hsv[1] = (max - min) / max;
		}

		hsv[2] = max;
		return hsv;
	}
export default class ColorpickerHDR{

	constructor(){}
	init(){
	var html = `
			<div style="float:left;" onselectstart="return false;">
				<div style="position:relative;display:inline-block;" id="hsv_area">
					<img id="hsv" width="128" height="128" draggable="false">
					<div id="cursor_hsv"></div>
					<div id="cursor2_hsv"></div>
				</div>
				<div style="position:relative;display:inline-block;">
					<img id="hsv2" width="8" height="128" draggable="false">
					<div id="cursor_hsv2" ></div>
				</div>
			</div>
			<div class="color_status" class="float:left;" onchange="{changeColor();}">
				<ul>
				<li class="red">R<input type="text" id="col_R" value="0.8" /></li>
				<li class="green">G<input type="text" id="col_G" value="0.2"/></li>
				<li class="blue">B<input type="text" id="col_B" value="0.2"/></li>
				</ul>
			</div>
			<div style="clear:both;">
				���邳<input class="slider" id="cphdr_lumi" min="-10" max="10" value="0"><br>
			</div>
			A<input class="slider" id="_A" max="1" value="1"/>

		`;

		var div= document.createElement("div");
		div.id="div_colorpickerhdr";
		div.insertAdjacentHTML('beforeend',html);

		Slider.init(div);

		

		var updateTextArea=function(textArea){
			//�e�L�X�g�̓��e��w�i�F�ɃZ�b�g
			textArea.style.backgroundColor="#"+textArea.value;
			hex2rgb(rgb,textArea.value);
			textArea.style.color=(0.3*rgb[0]+0.6*rgb[1]+0.1*rgb[2]<0.5)?"white":"black";
		}

		//�y�[�W�ǂݍ��ݎ��� className="colorpicker"��input�^�O��Ώۂ�
		//�J���[�s�b�J�[�R���g���[���Ή�������
		var e = document.getElementsByClassName('colorpickerhdr');
		for(var i=0; i<e.length; i+=1) {
			var node=e[i];
			node.addEventListener("blur",function(evt){
				//�t�H�[�J�X�A�E�g���A�q�̃J���[�s�b�J�[������
				if(div.parentNode){
					div.parentNode.removeChild(div);
				}
			},false);
			node.addEventListener("click",function(evt){
				//�N���b�N���A�J���[�s�b�J�[���q�Ƃ��Ēǉ�
				parentInput=this;

				this.parentNode.appendChild(div);
				div.style.left=this.offsetLeft+"px";
				div.style.top=this.offsetTop+ this.offsetHeight +"px";

			},false);
			node.addEventListener("input",function(evt){
				//���e�ύX���A�w�i�F�ƃJ�[�\�������t���b�V������
				updateTextArea(this);
				setCursor(this.value);
			},false);
			
		}
	}
};
window.addEventListener("load",ColorpickerHDR.init,false);
