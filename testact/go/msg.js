Testact.goClass["msg"]= (function(){
	var GoMsg=function(){};
	var ret = GoMsg;
	inherits(ret,Testact.defObj);
	ret.prototype.init=function(){
	}
	ret.prototype.move=function(){
	if(this.t>60){
		GoMain.prototype.next.call(goMain);
	}
}
	var txt="STAGE CLEAR!!";
	ret.prototype.drawhud = function(){
		if(bdfimage){
			var width=txt.length*4;
			var height=12+1;
			var scale=4;
			gl.enable(gl.BLEND);
			gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE);
			blit(bdfimage,0,0,scale*width/WIDTH,scale*height/(WIDTH*ono3d.persy/ono3d.persx)
						,0,0,width,height);
		}
	}
   return ret;
})();
