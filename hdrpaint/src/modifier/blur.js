
import Slider from "../lib/slider.js";
import Hdrpaint from "../hdrpaint.js";
import Layer from "../layer.js";

Hdrpaint.registModifier(
	class extends Layer{
	constructor(){
		super();
		this.scale=16;
	};

	showDivParam(){
		return "blursize:"+this.scale;
	}

	before(area){
		var size = Math.ceil(this.scale)*2;
		area[0]-=size;
		area[1]-=size;
		area[2]+=size<<1;
		area[3]+=size<<1;
	}

	reflect(img,composite_area){
		var scale = Math.ceil(this.scale);

		composite_area[0]+=scale;
		composite_area[1]+=scale;
		composite_area[2]-=scale<<1;
		composite_area[3]-=scale<<1;
		var x = Math.max(0,composite_area[0]-img.offsetx);
		var y = Math.max(0,composite_area[1]-img.offsety);
		var x1 = Math.min(img.width,composite_area[2]+x);
		var y1 = Math.min(img.height,composite_area[3]+y);
		img.gauss(scale>>1,scale,x,y,x1-x,y1-y);
		
	}

}
	,"blur"
	,`ぼかし半径:<input class="slider modifier_scale" title="scale" step="1" min="1" max="128"><br>`
);

Slider.init();


