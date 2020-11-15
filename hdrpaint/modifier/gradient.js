Hdrpaint.modifier["gradient"] = (function(){
	var Gradient = function(){
		Layer.apply(this);
		for(var i=0;i<3;i++){
			var nam = "col"+i;
			this[nam+"r"]=0;
			this[nam+"g"]=0;
			this[nam+"b"]=0;
			this[nam+"a"]=1;
			this[nam+"pos"]=1;
		}
		this.col0pos=0;
		this.col1r=1;
		this.col1g=1;
		this.col1b=1;

	};
	var ret = Gradient;
	inherits(ret,Layer);

	ret.prototype.typename="gradient";


	var color0=new Vec4();
	var color1=new Vec4();
	Vec4.set(color0,0,0,0,1);
	Vec4.set(color1,1,1,1,1);
	var _width;
	ret.prototype.beforeReflect=function(){
		_width = 1/this.size[0];
		
	}
	ret.prototype.reflect=function(img,area){
		var layer = this;
		var offx = -this.position[0] + img.offsetx;
		var offy = -this.position[1] + img.offsety;
		img.scan(function(ret,idx,x,y){layer.getPixel(ret,idx,x+img.offsetx,y+img.offsety);},area[0]-img.offsetx
				,area[1]-img.offsety,area[2],area[3]);
	}

	ret.prototype.getPixel = function(ret,idx,x,y){
		var b = Math.max(0,Math.min(x*_width,1));
		var i=1;
		for(;i<3;i++){
			var nam = "col"+i;
			if(b<=this[nam+"pos"]){
				b = b - this["col"+(i-1)+"pos"];
				b = b/(this["col"+i+"pos"] -this["col"+(i-1)+"pos"]);
				nam = "col"+(i-1);
				Vec4.set(color0
						,this[nam+"r"]
						,this[nam+"g"]
						,this[nam+"b"]
						,this[nam+"a"]);
				nam = "col"+i;
				Vec4.set(color1
						,this[nam+"r"]
						,this[nam+"g"]
						,this[nam+"b"]
						,this[nam+"a"]);
				break;
			}
		}


		var a = 1-b;
		ret[idx+0] = color0[0] * a + color1[0] * b;
		ret[idx+1] = color0[1] * a + color1[1] * b;
		ret[idx+2] = color0[2] * a + color1[2] * b;
		ret[idx+3] = color0[3] * a + color1[3] * b;
	}


	var html = `
		<div class="modifier_gradient">
		R G B A pos<br>
		<input type="text" title="col0r">
		<input type="text" title="col0g">
		<input type="text" title="col0b">
		<input type="text" title="col0a">
		<input type="text" title="col0pos"><br>

		<input type="text" title="col1r">
		<input type="text" title="col1g">
		<input type="text" title="col1b">
		<input type="text" title="col1a">
		<input type="text" title="col1pos"><br>

		<input type="text" title="col2r">
		<input type="text" title="col2g">
		<input type="text" title="col2b">
		<input type="text" title="col2a">
		<input type="text" title="col2pos"><br>
		</div>
		`;
	Hdrpaint.addModifierControl(ret.prototype.typename,html);
	return ret;
})();
