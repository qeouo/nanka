
import Hdrpaint from "../hdrpaint.js";
import Layer from "../layer.js";
var clip=function(v,min,max){
	return Math.max(min,Math.min(max,v));
}
class ColorMap extends Layer{
	constructor(){
		super();
		this.effect=4;
		this.children=[];
		this.gradtype="0";
	};
	showDivParam(){
		return "gradtype:"+this.gradtype;
	}

	beforeReflect(){
		if(this.children.length<1){
			return;
		}
		this.children[0].beforeReflect();
	}

	reflect(img,composite_area){

		var x = Math.max(0,composite_area[0]);
		var y = Math.max(0,composite_area[1]);
		var x1 = Math.min(this.parent.size[0],composite_area[2]+x);
		var y1 = Math.min(this.parent.size[1],composite_area[3]+y);
		var layer = this;


		var offx =  img.offsetx;
		var offy =  img.offsety;
		img.scan(function(r,idx,x,y){layer.getPixel(r,idx,x +offx,y+offy);} ,x-img.offsetx,y-img.offsety,x1-x,y1-y);
	}

	getPixel(ret_pixel,idx,x,y){
		if(this.children.length<1){
			return;
		}
		if(y===undefined){
			y= x;
			x= idx;
			idx =0;
		}
		var total;
		if(this.gradtype==="0"){
			total = (ret_pixel[idx]+ ret_pixel[idx+1] + ret_pixel[idx+2])*0.33333;
		}else{
			total = ret_pixel[idx+3];
		}
		total = clip(total,0,1);

		var a = ret_pixel[idx+3];
		var child = this.children[0];
		child.getPixel(ret_pixel,idx,total*(child.size[0]-1),0);
	}
};
var html = `
		<input type="radio" name="gradtype" title="gradtype" value="0"/>明るさで判定
		<input type="radio" name="gradtype" title="gradtype" value="1"/>アルファ値で判定
	`;
ColorMap.prototype.name="colormap";
Hdrpaint.registModifier(ColorMap,"colormap",html);
