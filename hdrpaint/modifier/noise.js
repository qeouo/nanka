Hdrpaint.modifier["noise"] = (function(){
		var ret = new Vec4();
	var Noisegen= function(){};
	var ret = Noisegen;

	var scale = 1/8;
	var octave = 1;
	var _total = 1.0/(1.0 - 1.0/(1<<octave));
	var betsu = true;
	var z = 0;
	ret.getPixel = function(ret,x,y){
		var r=0;
		var scale2 = scale;
		if(betsu){
			for(var n=0;n<3;n++){
				r = 0;
				for(var i=0;i<octave;i++){
					scale2 =(1<<i)*scale;
					r += Noise.perlinnoise(x*scale2+i*0.123+n*0.345
							,y*scale2+i*0.123+n*0.345
							,z*scale2+i*0.123+n*0.345+ n*5) / (2<<i);
				}
				r *=_total;

				ret[n] = r;
			}
		}else{
			for(var i=0;i<octave;i++){
				scale2 =(1<<i)*scale;
				r += Noise.perlinnoise(x*scale2+i*0.123
						,y*scale2+i*0.123,z*scale2+i*0.123) / (2<<i);
			}
			r *=_total;

			ret[0] = r;
			ret[1] = r;
			ret[2] = r;
		}

		ret[3] = 1;
	}


	var html = `			スケール:<input type="text" class="modifier_scale" value="32"><br>
			オクターブ数:<input type="text" class="modifier_octabe" value="2"><br>
			Z(seed):<input type="text" class="modifier_z" value="0"><br>
			rgb別:<input type="checkbox" class="modifier_betsu"><br>
		`;
	Hdrpaint.addModifierControl("noise",html);

	return ret;
})();

