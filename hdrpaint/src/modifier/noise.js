
import Slider from "../lib/slider.js";
import Layer from "../layer.js";
import Noise from "../lib/noise.js";
import Hdrpaint from "../hdrpaint.js";
	var scale;
	var octave;
	var _total;
	var betsu;
	var z;
	var func;

	var funcs={"perlin":Noise.perlinnoise
		,"simplex":Noise.simplexnoise
		,"value":Noise.valuenoise
	};
class _Noise extends Layer{
	constructor(){
		super();
		this.scale=128;
		this.zoffset=0;
		this.octave=0;
		this.betsu=false;
		this.func="simplex";
		this.children=null;
	};


	beforeReflect(){
		scale = 1/this.scale;
		octave = Number(this.octave);
		_total = 1/((1<<(octave+1))-1);
		betsu = this.betsu;
		func = funcs[this.func];
		z = this.zoffset;
	}
	reflect(img,composite_area){
		var x = composite_area[0];
		var y = composite_area[1];
		var w = composite_area[2];
		var h = composite_area[3];
		
		this.beforeReflect();

		var layer = this;
		var offx = -this.position[0] + img.offsetx;
		var offy = -this.position[1] + img.offsety;
		img.scan(function(r,idx,x,y){layer.calcPixel(r,idx,x +offx,y+offy);} ,x-img.offsetx,y-img.offsety,w,h);
	}

	getPixel(ret,x,y){
		this.calcPixel(ret,0,x,y);
	}
	calcPixel(ret,idx,x,y){
		var r=0;
		var scale2 = scale;
		var pow = 1<<octave;
		var nmax = 1;
		if(betsu){
			nmax=3;
		}
		for(var n=0;n<nmax;n++){
			r = 0;
			for(var i=0;i<octave+1;i++){
				scale2 =(1<<i)*scale;
				r += func(x*scale2+i*0.123+n*0.321
						,y*scale2+i*0.123+n*0.321
						,z*scale2+i*0.123+n) * (1<<(octave-i));
			}
			ret[n+idx] = r * _total;
		}
		if(!betsu){
			ret[1+idx] = ret[0+idx];
			ret[2+idx] = ret[0+idx];
		}

		ret[3+idx] = 1;
	}



};

	var html = `
			func:<select class="modifier_func" title="func">
				<option value="perlin">Perlin</option>
				<option value="simplex">Simplex</option>
				<option value="value">Value</option>
				</select><br>
			スケール:<input class="slider modifier_scale" title="scale" value="32" min="1" max="256"><br>
			オクターブ数:<input class="slider modifier_octabe" title="octave" value="0" min="0" max="10" step="1"><br>
			Z(seed):<input class="slider modifier_z" title="zoffset" max="255"><br>
			rgb別:<input type="checkbox" class="modifier_betsu" title="betsu"><br>
		`;
	Hdrpaint.registModifier(_Noise,"noise",html);
Slider.init();

