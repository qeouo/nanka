
import Img from "../lib/img.js";
import {Vec3,Vec4,Mat33} from "../lib/vector.js";
import Slider from "../lib/slider.js";
import Hdrpaint from "../hdrpaint.js";
import Layer from "../layer.js";
var backimg = new Img(128,1);

	var points=new Array();
	for(var i=0;i<4;i++){
		var point = {};
		point.color = new Vec4();
		point.pos = 0.0;
		points.push(point);
	}
	var width,height;
	var mat33 = new Mat33();
	var _mat33 = new Mat33();
class Gradient extends Layer{
	constructor(){
		super();
		for(var i=0;i<4;i++){
			var nam = "col"+i;
			this[nam]="0,0,0,1";
			this[nam+"pos"]=1;
		}
		this["col1"]="1,1,1,1";
		this.col0pos=0;
		this.col1pos=1;
		this.radius=0;
	};

	showDivParam(){

		var layer = this;
		layer.beforeReflect();
		mat33[0]=1/128;
		mat33[1]=1;
		width=64;
		height=0;
		backimg.scan(function(ret,idx,x,y){layer.getPixel(ret,idx,x,y);});
		layer.dom.style.backgroundImage = "url(" + backimg.toDataURL() + "),url(./back.png)";

		return "";
	}

	beforeReflect(){

		for(var i=0;i<4;i++){
			var nam = "col"+i;
			var a = this[nam].split(",");
			points[i].color[0] = 0;
			points[i].color[1] = 0;
			points[i].color[2] = 0;
			points[i].color[3] = 0;
			if(a.length===4){
				points[i].color[0] = Number(a[0]);
				points[i].color[1] = Number(a[1]);
				points[i].color[2] = Number(a[2]);
				points[i].color[3] = Number(a[3]);
			}
			points[i].pos = this[nam+"pos"];
		}

		points.sort(function(a,b){return a.pos - b.pos;});
		for(var i=1;i<4;i++){
			points[i]._r = points[i].pos-points[i-1].pos;
			if(points[i]._r){
				points[i]._r=1.0/points[i]._r;
			}
		}

		var parent= this.parent;
		if(parent){
			width=parent.size[0]>>1;
			height=parent.size[1]>>1;

			Mat33.rotate(mat33,this.radius*Math.PI/180,0,0,1);
			Mat33.set(_mat33,1/parent.size[0],0,0,0,1/parent.size[1],0,0,0,1);
			Mat33.dot(mat33,mat33,_mat33);
		}
		
	}
	reflect(img,area){
		var layer = this;
		var offx = -this.position[0] + img.offsetx;
		var offy = -this.position[1] + img.offsety;
		img.scan(function(ret,idx,x,y){layer.getPixel(ret,idx,x+offx,y+offy);}
			,area[0]-img.offsetx
			,area[1]-img.offsety,area[2],area[3]);
	}

	getPixel(ret,idx,x,y){
		var b = mat33[0]* (x-width) + mat33[1]*(y - height)+0.5;
		b = Math.max(0,Math.min(b,1));
		var i=1;
		for(;i<3;i++){
			if(b<=points[i].pos){
				break;
			}
		}

		b = (b - points[i-1].pos) * points[i]._r;
		b = Math.max(0,Math.min(b,1));

		var color0 = points[i-1].color;
		var color1 = points[i].color;

		var a = 1-b;
		ret[idx+0] = color0[0] * a + color1[0] * b;
		ret[idx+1] = color0[1] * a + color1[1] * b;
		ret[idx+2] = color0[2] * a + color1[2] * b;
		ret[idx+3] = color0[3] * a + color1[3] * b;
	}

}
	var html = `
		角度:<input class="slider modifier_scale" title="radius" value="0" min="0" max="360"><br>

		<div class="modifier_gradient ">
		R,G,B,A pos<br>
		<ul>
		<li>
		<input type="text" class="col colorpickerhdr" title="col0">
		<input class="slider pos" title="col0pos" min="0" max="1">
		</li>

		<li>
		<input type="text" class="col colorpickerhdr" title="col1">
		<input class="slider pos" title="col1pos" min="0" max="1">
		</li>

		<li>
		<input type="text" class="col colorpickerhdr" title="col2">
		<input class="slider pos" title="col2pos" min="0" max="1">
		</li>

		<li>
		<input type="text" class="col colorpickerhdr" title="col3">
		<input class="slider pos" title="col3pos" min="0" max="1">
		</li>
		</ul>

		</div>
		`;
	Hdrpaint.registModifier(Gradient,"gradient",html);
	Slider.init();
