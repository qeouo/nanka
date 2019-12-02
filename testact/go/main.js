Engine.goClass["main"]= (function(){
	var stage =0;
	var stages=[
		"f1.o3o&1"
		,"f2.o3o"
		,"f3.o3o"
		,"f4.o3o"
		,"f5.o3o"
	]
	var GoMain=function(){};
	var ret = GoMain;
	inherits(ret,Engine.defObj);
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

	var init=true;
	ret.prototype.move=function(){

		if(init){
			init=false;
			var select = document.getElementById("cTexture");
			var option;
			//soundbuffer = WebAudio.loadSound('se.mp3');

			

			document.getElementById("autoExposure").addEventListener("change"
				,function(evt){
					var control = document.getElementById("exposure_setting");
					var inputs = Array.prototype.slice.call(control.getElementsByTagName("input"));

					for(var i=0;i<inputs.length;i++){
						var element = inputs[i];
						if(this.checked){
							element.setAttribute("disabled","disabled");
						}else{
							element.removeAttribute("disabled");
						}
					}
			});
		
			var control = document.getElementById("control");
			var inputs = Array.prototype.slice.call(control.getElementsByTagName("input"));
			var selects= Array.prototype.slice.call(control.getElementsByTagName("select"));
			
			inputs = inputs.concat(selects);

			for(var i=0;i<inputs.length;i++){
				var element = inputs[i];
				var tag = element.id;
				if(!tag)continue;

				element.title = tag;
				if(element.className=="colorpicker"){
					element.value=globalParam[tag];
					element.addEventListener("change",function(evt){globalParam[evt.target.id] = this.value},false);
				}else if(element.type=="checkbox"){
					element.checked=Boolean(globalParam[tag]);
					element.addEventListener("change",function(evt){globalParam[evt.target.id] = this.checked},false);
				}else if(element.type==="text" || element.tagName ==="SELECT"){
					element.value=globalParam[tag];
					element.addEventListener("change",function(evt){globalParam[evt.target.id] = parseFloat(this.value)},false);
					if(!element.value){
						continue;
					}
				}else if(element.type==="radio"){
					var name = element.name;
					if(element.value === ""+globalParam[name]){
						element.checked=1;
					}else{
						element.checked=0;
					}
					element.addEventListener("change",function(evt){globalParam[evt.target.name] = parseFloat(this.value)},false);
					if(!element.checked){
						continue;
					}
				}
				Util.fireEvent(element,"change");
			}
		}
	}
	ret.prototype.next = function(){
		stage++;
		if(stages.length<=stage){
			return;
		}
		var objMan = this.scene.objMan;

		for(var i=objMan.objs.length;i--;){
			if(this == objMan.objs[i])continue;
			objMan.deleteObj(objMan.objs[i]);
		}
		//fieldpath=stages[stage];
		//if(globalParam.stage){
		//	fieldpath=globalParam.stage;
		//}


		Engine.onoPhy.init();
		Engine.go["field"]=objMan.createObj(Engine.goClass["field"]);
		Engine.go["camera"]= objMan.createObj(Engine.goClass["camera"]);

	}
	ret.prototype.delete=function(){
	}
	
	var reset = ret.reset=function(){
		var goJiki = Engine.go["jiki"];
		var ono3d = Engine.ono3d;
		var o3o = Engine.go["field"].o3o;
		var instance = Engine.go["field"].instance;
		ono3d.setTargetMatrix(0);
		ono3d.loadIdentity();

		var start = o3o.objects.find(function(o){return o.name==="_start";});
		Mat44.dotVec3(goJiki.p,ono3d.worldMatrix,start.location);
		var m = Mat44.poolAlloc();
		Mat44.setInit(m);
		Mat44.dotMat43(m,m,instance.objectInstances[start.idx].matrix);
		Mat44.dot(m,ono3d.worldMatrix,m);
		Vec4.fromMat44(goJiki.rotq,m);

		Mat44.poolFree(1);


		var goCamera = Engine.go["camera"];
		goCamera.a[1]=start.rotation[1];
		Vec3.copy(goCamera.p,goJiki.p);

	}
	return ret;

	})();
