
import {Vec2} from "../lib/vector.js"
import Img from "../lib/img.js";
import Hdrpaint from "../hdrpaint.js";
import CommandBase from "./commandbase.js";
import Layer from "../layer.js";

class ResizeCanvas extends CommandBase{
	undo(){
		this.func(true);
		
	}
	func(undo_flg){
		var param  =this.param;
		var width = param.width;
		var height = param.height;
		var old_width=preview.width;
		var old_height=preview.height;

		if(undo_flg){
			width = this.undo_data.width;
			height = this.undo_data.height;
		}
		if(!this.undo_data){
			this.undo_data = {"width":old_width,"height":old_height};
		}

		preview.width=width;
		preview.height=height

		preview_ctx_imagedata=preview_ctx.createImageData(width,height);
		bloomed_img = new Img(width,height);
		bloom_img = new Img(width,height);

		root_layer.width=width;
		root_layer.height=height;
		root_layer.img=new Img(width,height);

		Vec2.set(root_layer.size,width,height);

		inputs["canvas_width"].value = root_layer.img.width;
		inputs["canvas_height"].value = root_layer.img.height;

		root_layer.composite();
	}
};
Hdrpaint.commandObjs["resizeCanvas"] = ResizeCanvas;
