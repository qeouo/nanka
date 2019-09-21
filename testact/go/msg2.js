Engine.goClass["msg2"]= (function(){
	var GoMsg2=function(){};
	var ret = GoMsg2;
	inherits(ret,Engine.defObj);
	ret.prototype.init=function(){
	}
	ret.prototype.move=function(){
		if(this.t>60){
		}
	}
	var txt2="ALL CLEAR!!";
	ret.prototype.drawhud = function(){
		if(bdfimage){
			var width=txt2.length*4;
			var height=12+1;
			var scale=4;
			gl.enable(gl.BLEND);
			gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE);

			blit(bdfimage,0,0,scale*width/WIDTH,scale*height/(WIDTH*ono3d.persy/ono3d.persx)
						,0,height,width,height);
		}
	}
	return ret;
})();
