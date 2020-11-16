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
		this.col1a=0;
		this.radius=0;

	};
	var ret = Gradient;
	inherits(ret,Layer);

	ret.prototype.typename="gradient";


	var points=new Array();
	for(var i=0;i<3;i++){
		var point = new Array(5);
		point.color = new Vec4();
		point.pos = 0.0;
		points.push(point);
	}
	var _width;
	var mat33 = new Mat33();
	var _mat33 = new Mat33();
	ret.prototype.beforeReflect=function(){
		//_width = 1/this.size[0];

		for(var i=0;i<3;i++){
			var nam = "col"+i;
			points[i].color[0] = this[nam+"r"];
			points[i].color[1] = this[nam+"g"];
			points[i].color[2] = this[nam+"b"];
			points[i].color[3] = this[nam+"a"];
			points[i].pos = this[nam+"pos"];
		}
		for(var i=1;i<3;i++){
			points[i]._r = points[i].pos-points[i-1].pos;
			if(points[i]._r){
				points[i]._r=1.0/points[i]._r;
			}
		}

		Mat33.rotate(mat33,this.radius*Math.PI/180,0,0,1);
		Mat33.set(_mat33,1/this.size[0],0,0,0,1/this.size[1],0,0,0,1);
		Mat33.dot(mat33,mat33,_mat33);
		
	}
	ret.prototype.reflect=function(img,area){
		var layer = this;
		var offx = -this.position[0] + img.offsetx;
		var offy = -this.position[1] + img.offsety;
		img.scan(function(ret,idx,x,y){layer.getPixel(ret,idx,x+offx,y+offy);}
			,area[0]-img.offsetx
			,area[1]-img.offsety,area[2],area[3]);
	}

	var vec3 = new Vec3();
	ret.prototype.getPixel = function(ret,idx,x,y){
		//Vec3.set(vec3,x-(this.width>>1),y-(this.height>>1),1);
		//Mat33.dotVec3(vec3,mat33,vec3);
		var b = mat33[0]* (x-(this.size[0]>>1)) + mat33[1]*(y - (this.size[1]>>1))+0.5;
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


	var html = `
		角度:<input class="slider modifier_scale" title="radius" value="0" min="0" max="360"><br>

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
	Slider.init();
	return ret;
})();
