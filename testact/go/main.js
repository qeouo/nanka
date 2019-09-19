Testact.goClass["main"]= (function(){
	var stage =0;
	var stages=[
		"f1.o3o"
		,"f2.o3o"
		,"f3.o3o"
		,"f4.o3o"
		,"f5.o3o"
	]
	var GoMain=function(){};
	var ret = GoMain;
	inherits(ret,Testact.defObj);
	ret.prototype.init=function(){

	var txt="STAGE CLEAR!!";
	var txt2="ALL CLEAR!!";
		var gl = globalParam.gl;
		bdf = Bdf.load("./k8x12.bdf",null,function(){
			bdfimage = Bdf.render(txt+"\n"+txt2,bdf,false);
			bdfimage.glTexture = Rastgl.createTexture(bdfimage);//512x512

			gl.bindTexture(gl.TEXTURE_2D,bdfimage.glTexture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);//1024x1024
			gl.viewport(0,0,1024,1024);
			gl.clearColor(.8,0.2,0.6,0.0);
			gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);
			gl.enable(gl.BLEND);
			gl.blendFuncSeparate(gl.ZERO,gl.ONE,gl.ONE,gl.ONE);
			var scl=2;//1;//1/8;
			var ss=1/512;
			for(var i=0;i<3;i++){
				for(var j=0;j<3;j++){
					Ono3d.drawCopy(bdfimage,-ss*i,-ss*j,scl,scl);
				}
			}
			gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE);
			gl.enable(gl.BLEND);
			gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE);
			Ono3d.drawCopy(bdfimage,-1*ss,-1*ss,scl,scl);
			gl.bindTexture(gl.TEXTURE_2D,bdfimage.glTexture);
			gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,512,512);

		});

		stage=-1;
		GoMain.prototype.next.call(this);
	
	}
	ret.prototype.next = function(){
		stage++;
		if(stages.length<=stage){
			return;
		}
		var objMan = Testact.objMan;

		for(var i=objMan.objs.length;i--;){
			if(this == objMan.objs[i])continue;
			objMan.deleteObj(objMan.objs[i]);
		}
		//fieldpath=stages[stage];
		//if(globalParam.stage){
		//	fieldpath=globalParam.stage;
		//}


		Testact.onoPhy.init();
		Testact.go["field"]=objMan.createObj(Testact.goClass["field"]);
		Testact.go["camera"]= objMan.createObj(Testact.goClass["camera"]);

	}
	ret.prototype.delete=function(){
	}
	
	return ret;

	})();
