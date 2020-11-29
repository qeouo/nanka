
import Img from "../lib/img.js";
import {Vec4} from "../lib/vector.js";
import Hdrpaint from "../hdrpaint.js";
import Layer from "../layer.js";
	var ret_pixel = new Vec4();
	var bufimg = new Img(1024,1024);
	var layer;
	var xmod=1;
	var ymod=1;
	var offx;
	var offy;
	var clip=function(v,min,max){
		return Math.max(min,Math.min(max,v));
	}
class Shift extends Layer{
	constructor(){
		super();
		this.effect=4;
		this.children=[];
	};

	before(area){
		var size = this.effect;
		area[0]-=size;
		area[1]-=size;
		area[2]+=size<<1;
		area[3]+=size<<1;
	}

	beforeReflect= function(){
		offx = 0;
		offy = 0;
		if(this.children.length>=1){
			var child = this.children[0];
			child.beforeReflect();

			offx = -this.position[0] - child.position[0];
			offy = -this.position[1] - child.position[1];
		}
	}

	reflect(img,composite_area){

		var scale=this.effect>>1;

		composite_area[0]+=scale;
		composite_area[1]+=scale;
		composite_area[2]-=scale<<1;
		composite_area[3]-=scale<<1;

		if(bufimg.data.length<img.data.length){
			bufimg=new Img(img.width,img.height);
		}
		bufimg.width = img.width;
		bufimg.height = img.height;
		bufimg.offsetx= img.offsetx;
		bufimg.offsety= img.offsety;
		Img.copy(bufimg,0,0,img,0,0,img.width,img.height);


		this.beforeReflect();


		var x = Math.max(0,composite_area[0]);
		var y = Math.max(0,composite_area[1]);
		var x1 = Math.min(this.parent.size[0],composite_area[2]+x);
		var y1 = Math.min(this.parent.size[1],composite_area[3]+y);

		var imgdata = img.data;

		for(var j=y;j<y1;j++){
			var idx = img.getIndex(x-img.offsetx,j-img.offsety)<<2;
			for(var i=x;i<x1;i++){
				this.getPixel(ret_pixel,i,j);
				imgdata[idx+0]=ret_pixel[0];
				imgdata[idx+1]=ret_pixel[1];
				imgdata[idx+2]=ret_pixel[2];
				imgdata[idx+3]=ret_pixel[3];
				idx+=4;
				
			}
		}
	}

	getPixel(ret_pixel,x,y){
		var img = bufimg;

		var sx = 0;
		var sy = 0;
		if(this.children.length>=1){
			var child = this.children[0];
			child.getPixel(ret_pixel,x+offx,y+offy);
			sx = ret_pixel[0]-0.5;
			sy = ret_pixel[1]-0.5;
			//sz = ret_pixel[2]-0.5;

			var pow = this.effect;
			sx = sx * pow|0;
			sy = sy * pow|0;
			//sz = sz* pow|0;
		}

		var d_idx2 = img.getIndex(clip(x+sx-img.offsetx,0,img.width-1),clip(y+sy-img.offsety,0,img.height-1))<<2;

		ret_pixel[0]=img.data[d_idx2+0] ;
		ret_pixel[1]=img.data[d_idx2+1] ;
		ret_pixel[2]=img.data[d_idx2+2] ;
		ret_pixel[3]=img.data[d_idx2+3] ;
	}

}
	var html = `
			影響度:<input type="text" class="slider modifier_effect" title="effect" value="0.5" min="0" max="100">
		`;
	Hdrpaint.registModifier(Shift,"shift",html);
