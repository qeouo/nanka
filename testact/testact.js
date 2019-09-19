"use strict"
var Testact=(function(){
	var ret={};
	var HEIGHT=512,WIDTH=960;
	var gl;
	var onoPhy=null;
	var bdf;
	var bdfimage=null;
	var soundbuffer=null;
	var bufTexture;
	ret.goClass=[];
	ret.go=[];

	var obj3d=null,field=null;
	var goField
		,goCamera
		,goJiki
		,goMain
	;
	var objMan;

	var i;
	var pad =new Vec2();
	ret.pad = pad;
	ret.probs=null;


	var averageTexture;


	var ObjMan= (function(){
		var STAT_EMPTY=0
			,STAT_ENABLE=1
			,STAT_CREATE=2
		;
		var ObjMan=function(){
			this.objs= []; 
			this.pool= []; 
			this.id=0;
		}
		var ret = ObjMan;

		ret.Obj = (function(){
			var Obj = function(){
				this.p=new Vec3();
				this.scale=new Vec3();
				this.rotq = new Vec4();
				this.v=new Vec3();
				this.a=new Vec3();
				this.stat=STAT_EMPTY;
				this.type=0;
				this.hp=1;
				this.t=0;
				this.hitareas=[];
				this.matrix=new Mat43();
				this.phyObjs = [];
			}
			var ret = Obj;

			return ret;
		})();
		var Obj = ret.Obj;

		ret.prototype.createObj = function(c){
			if(!c){
				c=Testact.defObj;
			}
			if(this.pool.length==0){
				for(var i=0;i<16;i++){
					this.pool.push(new Obj());
				}
			}
			var obj = this.pool[this.pool.length-1];
			if(obj.stat<0){
				for(var i=0;i<16;i++){
					this.pool.push(new Obj());
				}
			}
			var obj = this.pool.pop();
			this.objs.push(obj);
			if(this.objs.length>1024){
				alert("objs>1024!");
			}

			Mat43.setInit(obj.matrix);
			obj.parent=null;
			Vec3.set(obj.scale,1,1,1);
			obj.angle=0;
			obj.t=0;
			obj.hp=1;
			obj.stat=STAT_CREATE;
			obj.pattern=0;
			obj.frame=0;
			obj.pos2=new Vec3();
			obj.phyObjs = [];
			obj.func=c;

			obj.id=this.id;

			obj.__proto__=c.prototype;

			obj.init();

			this.id++;
			return obj;
			
		}
		ret.prototype.deleteObj=function(obj){
			var objs = this.objs;
			for(var i=0;i<objs.length;i++){
				if(obj === objs[i]){
					obj.stat=-10;
					this.pool.unshift(objs[i]);
					objs.splice(i,1);
					break;
				}
			}
		}
		ret.prototype.update=function(){
			var objs = this.objs;
			for(var i=0;i<this.objs.length;i++){

				if(objs[i].stat===STAT_CREATE){
					objs[i].stat=STAT_ENABLE;
				}

				if(objs[i].stat===STAT_ENABLE){
					objs[i].t++;
					objs[i].frame++;
				}
			}
			for(var i=0;i<this.pool.length;i++){
				if(this.pool[i].stat<0){
					this.pool[i].stat++;
				}else{
					break;
				}
			}

		}
		
		ret.prototype.move=function(){
			var objs = this.objs;
			for(i=0;i<objs.length;i++){
				if(objs[i].stat!==STAT_ENABLE)continue;
				objs[i].move();
			}
		}

		
		return ret;
	})();
	



	var blit = function(tex,x,y,w,h,u,v,u2,v2){
			Ono3d.drawCopy(tex.glTexture,x,y,w*2,h*2
							,u/tex.width,(v+v2)/tex.height,u2/tex.width,-v2/tex.height);
	}
	


	var Camera= (function(){
		var Camera = function(){
			this.p=new Vec3();
			this.a=new Vec3();
			this.zoom = 0.577;
			this.cameracol=new Collider.ConvexHull();
			this.cameracol2=new Collider.ConvexHull();
			for(var i=0;i<8;i++){
				this.cameracol.poses.push(new Vec3());
				this.cameracol2.poses.push(new Vec3());
			}
		}
		var ret = Camera;
		var scope=[
			[-1,-1,-1]
			,[-1,1,-1]
			,[1,1,-1]
			,[1,-1,-1]
			,[-1,-1,1]
			,[-1,1,1]
			,[1,1,1]
			,[1,-1,1]
		];
		ret.prototype.calcMatrix=function(){
			ono3d.setPers(this.zoom,HEIGHT/WIDTH,0.1,80.0);
			ono3d.setTargetMatrix(1);
			ono3d.loadIdentity();
			ono3d.rotate(-this.a[2],0,0,1);
			ono3d.rotate(-this.a[0],1,0,0);
			ono3d.rotate(-this.a[1]+Math.PI,0,1,0);
			ono3d.translate(-this.p[0],-this.p[1],-this.p[2]);
			ono3d.setAov(this.zoom);
		}
		ret.prototype.calcCollision=function(collision,matrix){
			var im = Mat44.poolAlloc();
			var v4=Vec4.poolAlloc();
			if(!matrix){
				Mat44.dot(im,ono3d.projectionMatrix,ono3d.viewMatrix);
				Mat44.getInv(im,im);
			}else{
				Mat44.getInv(im,matrix);
			}

			for(var i=0;i<8;i++){
				Vec3.copy(v4,scope[i]);
				v4[3]=1;
				if(!matrix){
					if(v4[2]<0){
						Vec4.mul(v4,v4,ono3d.znear);
					}else{
						Vec4.mul(v4,v4,ono3d.zfar);
					}
				}
				Mat44.dotVec4(v4,im,v4);
				Vec3.copy(collision.poses[i],v4);
			}
			collision.refresh();
			Vec4.poolFree(1);
			Mat44.poolFree(1);
		}

		return ret;
	})();
	var camera = new Camera();
	ret.camera = camera;


	var drawSub = ret.drawSub= function(x,y,w,h){

		ono3d.rf=0;
		ono3d.lineWidth=1.0;
		ono3d.smoothing=globalParam.smoothing;

		ono3d.lightThreshold1=globalParam.lightThreshold1;
		ono3d.lightThreshold2=globalParam.lightThreshold2;

//遠景描画
		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.BLEND);
		gl.depthMask(true);
		ono3d.setViewport(x,y,w,h);
		ono3d.getProjectionMatrix(ono3d.projectionMatrix);

		gl.clear(gl.DEPTH_BUFFER_BIT);
		gl.depthMask(false);
		gl.disable(gl.BLEND);
		var field=Testact.field;
		if(field.scenes[0].world.envTexture){
			var skyTexture = field.scenes[0].world.envTexture;
			if(globalParam.stereomode==0){
				ono3d.drawCelestialSphere(skyTexture);
			}else{
				ono3d.setPers(0.577,HEIGHT/WIDTH*2,1,80);
				ono3d.setViewport(0,0,WIDTH/2,HEIGHT);
				ono3d.drawCelestialSphere(skyTexture);
				ono3d.setViewport(WIDTH/2,0,WIDTH/2,HEIGHT);
				ono3d.drawCelestialSphere(skyTexture);
				
			}
		}

		ono3d.setViewport(x,y,w,h);
//オブジェクト描画
		gl.depthMask(true);
		gl.enable(gl.DEPTH_TEST);

		if(globalParam.shader===0){
			if(globalParam.cMaterial){
				ono3d.render(camera.p,customMaterial);
			}else{
				ono3d.render(camera.p);
			}
		}
		
		gl.finish();
	}
	var reset = ret.reset=function(){
		var o3o = this.field;
		var goJiki = this.go["jiki"];
		ono3d.setTargetMatrix(0);
		ono3d.loadIdentity();

		var start = o3o.objects.find(function(o){return o.name==="_start";});
		Mat44.dotVec3(goJiki.p,ono3d.worldMatrix,start.location);
		var m = Mat44.poolAlloc();
		Mat44.setInit(m);
		Mat44.dotMat43(m,m,start.matrix);
		Mat44.dot(m,ono3d.worldMatrix,m);
		Vec4.fromMat44(goJiki.rotq,m);

		Mat44.poolFree(1);

		var goJiki= Testact.go["camera"];
		if(goJiki.phyObjs.length){
			Vec3.copy(goJiki.phyObjs[0].location,goJiki.p);
		}

		var goCamera = Testact.go["camera"];
		goCamera.a[1]=start.rotation[2];
		Vec3.copy(goCamera.p,goJiki.p);

	}

	var sourceArmature=null;
	var referenceArmature=null;


	ret.assetload = function(obj3d,path,func){
		if(obj3d){
			func(obj3d);
			return obj3d;
		}
		return O3o.load(path,func);

	}

		var url=location.search.substring(1,location.search.length)
		globalParam.outline_bold=0;
		globalParam.outline_color="000000";
		globalParam.lightColor1="808080";
		globalParam.lightColor2="808080";;
		globalParam.lightThreshold1=0.;
		globalParam.lightThreshold2=1.;
		globalParam.physics=1;
		globalParam.physics_=0;
		globalParam.smoothing=1;
		globalParam.stereomode=0;
		globalParam.stereoVolume=1;
		globalParam.step=1;
		globalParam.fps=60;
		globalParam.scene=0;
		globalParam.shadow=1;
		globalParam.model="./f1.o3o";
		globalParam.materialMode = false;
		globalParam.cColor= "ffffff";
		globalParam.cReflection= 0;
		globalParam.cReflectionColor= "ffffff";
		globalParam.cRoughness= 0;
		globalParam.cTransRoughness= 0;
		globalParam.frenel = 0;
		globalParam.cAlpha= 1.0;
		globalParam.cRefraction = 1.1;
		globalParam.cNormal= 1.0;
		globalParam.cEmi= 0.0;
		globalParam.shader= 0;

	//カメラ露光
		globalParam.autoExposure=1;
		globalParam.exposure_level=0.5;
		globalParam.exposure_upper=2;
		globalParam.exposure_bloom=0.1;
		
		globalParam.source=0;
		globalParam.target=0;
		globalParam.reference=0;
		globalParam.actionAlpha=0;

		

		var args=url.split("&")

		for(i=args.length;i--;){
			var arg=args[i].split("=")
			if(arg.length >1){
				if(!isNaN(arg[1]) && arg[1]!=""){
					if(arg[1].length>1 && arg[1].indexOf(0) =="0"){
						globalParam[arg[0]] = arg[1]
					}else{
						globalParam[arg[0]] = +arg[1]
					}
				}else{
					globalParam[arg[0]] = arg[1]
				}
			}
		}
	
	
	var physicsTime;
	var span;
	var oldTime = 0;
	var nowTime =0;
	var drawgeometryTime=0;
	var drawrasteriseTime=0;
	var drawTime=0;
	var mseccount=0;
	var framecount=0;
	var inittime=0;
	var afID=0;
	var mainloop=function(){
		var nowTime = Date.now()
		nowTime = Date.now()
		
		var obj;

		pad[0] = Util.padX + (Util.keyflag[2] || Util.keyflag[10])-(Util.keyflag[0] || Util.keyflag[8]);
		pad[1] = Util.padY + (Util.keyflag[3] || Util.keyflag[11])-(Util.keyflag[1] || Util.keyflag[9]);
		var l = Vec2.scalar(pad);
		if(l>1){
			Vec2.norm(pad);
		}
		

		var i;
		objMan.update();

		objMan.move();
		var phytime=0;
		if(globalParam.physics){
			for(var i=0;i<globalParam.step;i++){
				var s=Date.now();
				onoPhy.calc(1.0/globalParam.fps/globalParam.step);
				phytime=Date.now()-s;
			}
			globalParam.physics_=1;
		}


		if(!afID){
			afID = window.requestAnimationFrame(drawFunc);
		}

		mseccount += (Date.now() - nowTime)
		framecount++
		if(nowTime-oldTime > 1000){
			var mspf=0;
			var fps = framecount*1000/(nowTime-oldTime)
			if(framecount!==0)mspf = mseccount/framecount
			
			Util.setText(span,fps.toFixed(2) + "fps " + mspf.toFixed(2) + "ms/frame"
				   +"\nPhyisics " + physicsTime +"ms"
				   +"\n AABB " + onoPhy.collider.aabbTime+"ms (Object " + onoPhy.collider.collisions.length + ")"
				   +"\n Collision " + onoPhy.collider.collisionTime + "ms (Target " + onoPhy.collider.collisionCount+ ")"
				   +"\n Impulse " + onoPhy.impulseTime+"ms (repetition " + onoPhy.repetition +")"
				   +"\nDrawTime " + drawTime +"ms"
				   +"\n geometry " + drawgeometryTime +"ms"
				   +"\n rasterise " + drawrasteriseTime +"ms" 
				   )
	
			framecount = 0
			mseccount=0
			oldTime = nowTime
		}
	}
	var parentnode = (function (scripts) {
		return scripts[scripts.length - 1].parentNode;
	}) (document.scripts || document.getElementsByTagName('script'));

	var drawFunc = function(){
		afID = 0;

		drawTime=Date.now();



		var environment = ono3d.environments[0];
		Util.hex2rgb(environment.sun.color,globalParam.lightColor1)
		Util.hex2rgb(environment.area.color,globalParam.lightColor2)

		if(globalParam.cMaterial){
			var cMat = customMaterial;
			var a=new Vec3();
			Util.hex2rgb(cMat.baseColor,globalParam.baseColor);
			cMat.opacity=globalParam.opacity;
			cMat.emt=globalParam.emi;
			cMat.metallic=globalParam.metallic;
			cMat.ior=globalParam.ior;
			cMat.roughness=globalParam.roughness;
			cMat.subRoughness=globalParam.subRoughness;
			Util.hex2rgb(cMat.metalColor,globalParam.metalColor);
			cMat.texture=globalParam.cTexture;
			cMat.texture_slots=[];
			if(globalParam.cTexture>=0){
				var texture_slot = new O3o.Texture_slot();

				cMat.texture_slots.push(texture_slot);
				texture_slot.texture = customTextures[globalParam.cTexture];
			}
			if(globalParam.cBump>=0){
				var texture_slot = new O3o.Texture_slot();

				cMat.texture_slots.push(texture_slot);
				texture_slot.texture = customBumps[globalParam.cBump];
				texture_slot.normal= globalParam.cNormal;
			}
		}

			
		var start = Date.now();

		camera.calcMatrix();
		camera.calcCollision(camera.cameracol);
		var lightSource= null;

		if(globalParam.shadow){
			lightSource = ono3d.environments[0].sun
			if(lightSource){
				camera.calcCollision(camera.cameracol2,lightSource.viewmatrix);
			}
		}
		for(i=0;i<objMan.objs.length;i++){
			var obj = objMan.objs[i];
			ono3d.setTargetMatrix(1)
			ono3d.push();
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()
			ono3d.rf=0;
			obj.draw();
			ono3d.setTargetMatrix(1)
			ono3d.pop();
		}

		drawgeometryTime=Date.now()-start;

		
		// ステレオ描画設定
		globalParam.stereo=-globalParam.stereoVolume * globalParam.stereomode*0.4;

		start=Date.now();

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.depthMask(true);
		gl.clear(gl.DEPTH_BUFFER_BIT);
		drawSub(0,0,WIDTH,HEIGHT);
		
		//テスト
		//var env = ono3d.environments[1];
		//Ono3d.drawCopy(env.envTexture,0,0,1,1);

		//描画結果をバッファにコピー
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		Ono3d.copyImage(bufTexture,0,0,0,0,WIDTH,HEIGHT);

		//画面平均光度算出
		if(globalParam.autoExposure){
			ono3d.calcExpose(bufTexture,(WIDTH-512)/2.0/1024,0 ,512/1024,HEIGHT/1024);
		}else{
			ono3d.setExpose(globalParam.exposure_level,globalParam.exposure_upper);
		}

		if(globalParam.exposure_bloom ){
			// ブルーム処理
			ono3d.setViewport(0,0,WIDTH,HEIGHT);
			ono3d.bloom(bufTexture,globalParam.exposure_bloom);
			Ono3d.copyImage(bufTexture,0,0,0,0,WIDTH,HEIGHT);
		}


		//トーンマッピング
		ono3d.toneMapping(bufTexture,WIDTH/1024,HEIGHT/1024);
		



		ono3d.clear();

		for(i=0;i<objMan.objs.length;i++){
			//HUD描画
			obj = objMan.objs[i];
			ono3d.setTargetMatrix(1)
			ono3d.push();
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()
			ono3d.rf=0;
			obj.drawhud();
			ono3d.setTargetMatrix(1)
			ono3d.pop();
		}

		//gl.getParameter(gl.VIEWPORT);
		drawrasteriseTime=Date.now()-start;

		drawTime =Date.now()-drawTime;

		mseccount += drawTime;
	}
	ret.loadModel=function(){
		obj3d=O3o.load(globalParam.model,function(){

			for(var i=0;i<obj3d.objects.length;i++){
				var object=obj3d.objects[i];
			}

			var sceneSelect = document.getElementById("scene");
			var option;
			for(var i=0;i<obj3d.scenes.length;i++){
				if(obj3d.scenes[i].name.indexOf("_",0)==0){
					continue;
				}
				option = document.createElement('option');
				option.setAttribute('value', i);
				option.innerHTML = obj3d.scenes[i].name;
				sceneSelect.appendChild(option);
			}
		});
		ret.obj3d = obj3d;
		
	}
	ret.start = function(){
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
		
		Testact.go["main"]= objMan.createObj(Testact.goClass["main"]);

		Util.setFps(globalParam.fps,mainloop);
		Util.fpsman();

	}
		var canvas =document.createElement("canvas");
		canvas.width=WIDTH;
		canvas.height=HEIGHT;
		parentnode.appendChild(canvas);
		var canvasgl =document.createElement("canvas");
		canvasgl.width=WIDTH;
		canvasgl.height=HEIGHT;
		parentnode.appendChild(canvasgl);
		var ctx=canvas.getContext("2d");
		gl = canvasgl.getContext('webgl') || canvasgl.getContext('experimental-webgl');

		Util.enableVirtualPad=true;
		Util.init(canvas,canvasgl,parentnode);

		if(gl){
			globalParam.enableGL=true;
		}else{
			globalParam.enableGL=false;
		}
		globalParam.gl=gl;


		if(globalParam.enableGL){
			Rastgl.init(gl);
			canvas.style.width="0px";
			canvasgl.style.display="inline";
			//Ono3d.setDrawMethod(3);
		}else{
			canvasgl.style.display="none";
			canvas.style.display="inline";
		}
		var ono3d = new Ono3d()
		ret.ono3d = ono3d;
		O3o.setOno3d(ono3d)
		ono3d.init(canvas,ctx);
		ono3d.rendercanvas=canvas;
		Rastgl.ono3d = ono3d;


		bufTexture=Ono3d.createTexture(1024,1024);
		gl.bindTexture(gl.TEXTURE_2D, bufTexture.glTexture);
	
		onoPhy = new OnoPhy();
		ret.onoPhy = onoPhy;
		ret.objMan = objMan = new ObjMan();
		

		inittime=Date.now();

		span=document.getElementById("cons");

		Util.loadJs("./go/defobj.js");
		var gos=["jiki","camera","field","main","msg","msg2"];
		for(var i=0;i<gos.length;i++){
			Util.loadJs("./go/"+ gos[i]+".js");
		}
		
	return ret;
})()
