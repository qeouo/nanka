var img_hsv =(function(){
	var cursor=new Vec2();
	cursor[0]=0.5;
	cursor[1]=0.5;
	var h_cursor=0;
	var img = new Img(128,128,Img.FORMAT_UINT8);
	var img2 = new Img(8,128,Img.FORMAT_UINT8);
	var img_hsv= document.getElementById("img_hsv")
	var img_hsv2= document.getElementById("img_hsv2")
	var obj = {};
	obj.color=new Vec3();
	obj.func=null;

	var col=new Vec3();
	var col_org=new Vec3();
	obj.setRGB=function(rgb){
		Vec3.copy(obj.color,rgb);

		Util.rgb2hsv(col,obj.color);
		h_cursor=col[0];
		cursor[0]=col[2];
		cursor[1]=1-col[1];
		redraw();
	}
	var redraw=obj.redraw=function(){
		var idx=0;
		var reverse=0;
		var reverse2=0;
		var chk_x=(cursor[0]*img.width)|0;
		var chk_y=(cursor[1]*img.height)|0;

		col[0]=h_cursor;
		col[1]=1-cursor[1];
		col[2]=cursor[0];
		Util.hsv2rgb(obj.color,col);

		col[0]=h_cursor;
		col[1]=1;
		col[2]=1;
		Util.hsv2rgb(col_org,col);
		for(var yi=0;yi<img.height;yi++){
			var yf = yi/img.height;
			col[0]=(1-col_org[0])*yf+col_org[0];
			col[1]=(1-col_org[1])*yf+col_org[1];
			col[2]=(1-col_org[2])*yf+col_org[2];
			if(Math.abs(chk_y-yi)==1){
				reverse=1;
			}else{
				reverse=0;
			}
			var data=img.data;
			for(var xi=0;xi<img.width;xi++){
				var xf = xi/img.width;
				reverse2=reverse;
				if(Math.abs(chk_x-xi)==1){
					reverse2=1;
				}
				if(yi==chk_y || xi==chk_x){
					reverse2=0;
				}
				if(reverse2){
					data[idx]=0;
					data[idx+1]=0;
					data[idx+2]=0;
				}else{
					//col[0]=h_cursor;
					//col[1]=1-yf;
					//col[2]=xf;
					//Util.hsv2rgb(col,col);
					data[idx]= col[0]*xf*255;
					data[idx+1]=col[1]*xf*255;
					data[idx+2]=col[2]*xf*255;
					data[idx+3]=255;
				}
				idx+=4;
			}
		}
		img_hsv.src = img.toDataUrl();

		var data = img2.data;
		idx=0;
		var chk = h_cursor*img2.height|0;
		for(var yi=0;yi<img2.height;yi++){
			col[0]=yi/img2.height;
			col[1]=1;
			col[2]=1;
			//if(chk == yi){
			//	col[2]=0;
			//}
			if(chk == yi+1 || chk==yi-1){
				col[2]=0;
			}
			Util.hsv2rgb(col,col);
			col[0]=(col[0]*255)|0;
			col[1]=(col[1]*255)|0;
			col[2]=(col[2]*255)|0;
			for(var xi=0;xi<img2.width;xi++){
				data[(idx<<2)]=col[0];
				data[(idx<<2)+1]=col[1];
				data[(idx<<2)+2]=col[2];
				data[(idx<<2)+3]=255;
				idx++;
			}
		}
		img_hsv2.src = img2.toDataUrl();
	}

	var flg2=0;
	var flg=0;
	var down=function(e){
		if(!(e.buttons&1)){
			flg=0;
			flg2=0;
			return;
		}
		if(flg){
			var rect = img_hsv.getBoundingClientRect();
			cursor[0]=e.clientX- rect.left;
			cursor[1]=e.clientY- rect.top;
			cursor[0]=cursor[0]/img.width;
			cursor[1]=cursor[1]/img.height;
			cursor[0]=Math.min(Math.max(cursor[0],0),1);
			cursor[1]=Math.min(Math.max(cursor[1],0),1);

			redraw();
		}else if( flg2){
			var rect = img_hsv2.getBoundingClientRect();
			h_cursor =e.clientY- rect.top;
			h_cursor=h_cursor/img2.height;
			h_cursor=Math.min(Math.max(h_cursor,0),1);

			redraw();
		}
		if(obj.func){
			obj.func();
		}

	}
	img_hsv.addEventListener("pointerdown",function(e){
		flg=1;
		down(e)
	});
	
	window.addEventListener("pointermove",down);
	img_hsv2.addEventListener("pointerdown",function(e){
			flg2=1;
			down(e);
	});

	return obj;
})();

img_hsv.redraw();

var tab_cs_standard=(function(){
	var obj={};

	obj.setRGB=function(col){
		var color=new Vec3();
		
		var max = Math.max(col[0],Math.max(col[1],col[2]));
		if(max==0){max=1};
		Vec3.mul(color,col,1/max);

		img_hsv.setRGB(color);

		inputs["cs_default_lumi"].value=Math.log2(max);
		Util.fireEvent(inputs["cs_default_lumi"],"input");

	}

	var change_default= function(){
		var lumi = Math.pow(2,parseFloat(inputs["cs_default_lumi"].value));
		doc.draw_col[0] = img_hsv.color[0] * lumi;
		doc.draw_col[1] = img_hsv.color[1] * lumi;
		doc.draw_col[2] = img_hsv.color[2] * lumi;
		doc.draw_col[3] = parseFloat(inputs["color_A"].value);


		changeColor(tab_cs_standard);
	}
	img_hsv.func=change_default;
	document.getElementById("cs_default_lumi").addEventListener("change",change_default);

	return obj;
})();
