"use strict"
var Test3d=(function(){
	var ret={};
	var HEIGHT=480,WIDTH=360
	var obj3d;
	var PI=Math.PI;
	var OBJSLENGTH=1024;
	var i;
	var gl;
	var onoPhy=null;
	var objs=[];
	var sky=null;
	var envtexes=null;
	var phyObjs=null;
	var shadowTexture;
	var customTextures=[];
	var customBumps=[];

	var STAT_EMPTY=0
		,STAT_ENABLE=1
		,STAT_CREATE=2

		,TYPE_EFFECT=i=0
		
		,MSG_CREATE=++i
		,MSG_MOVE=++i
		,MSG_DRAW=++i
		;
	
	var Obj = function(){
		this.p=new Vec3();
		this.scale=new Vec3();
		this.angle=0;
		this.v=new Vec3();
		this.a=new Vec3();
		this.pos2=new Vec3();
		this.stat=STAT_EMPTY;
		this.type=0;
		this.hp=1;
		this.t=0;
		this.hitareas=[];
		this.matrix=new Mat43();
	}	
	var createObj = function(func){
		for(i=0;i<OBJSLENGTH;i++){
			var obj=objs[i];
			if(obj.stat!==STAT_EMPTY)continue;
			obj.func=func;
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
			obj.type=TYPE_EFFECT;
			obj.func(obj,MSG_CREATE,0);
			return obj;
		}
		return null;
	}
	var deleteObj=function(obj){
		obj.stat=-10;
	}
	
	for(i=0;i<OBJSLENGTH;i++){
		var obj=new Obj();
		obj.num=i;
		objs.push(obj);
	}
	var defObj=function(obj,msg,param){
		switch(msg){
		case MSG_CREATE:
			break;
		case MSG_MOVE:
			break;
		case MSG_DRAW:
			break;
		case MSG_HIT:
			obj.hp--;
			break;
		case MSG_FRAMEOUT:
			deleteObj(obj);
			break;
		}
		return;
	}
	var mainObj=function(obj,msg,param){
		switch(msg){
		case MSG_MOVE:
			if(obj3d.scenes.length===0){
				break;
			}
			var scene= obj3d.scenes[globalParam.scene];
			if(phyObjs===null){
				onoPhy.phyObjs = [];


				if(obj3d.scenes.length>0){
					phyObjs=new Array();
					for(i=0;i<scene.objects.length;i++){
						var phyobj=O3o.createPhyObjs(scene.objects[i],onoPhy);
						if(phyobj){
							phyObjs.push(phyobj);
						}
					}
				}
			}
			//O3o.setFrame(obj3d,scene,(obj.t+1)*24/30);
			O3o.setFrame(obj3d,scene,timer/1000.0*24);
			if(phyObjs && globalParam.physics){
				ono3d.setTargetMatrix(1)
				ono3d.loadIdentity()
				ono3d.setTargetMatrix(0)
				ono3d.loadIdentity()
				ono3d.rotate(-PI*0.5,1,0,0)

				if(!globalParam.physics_){
					
					O3o.initPhyObjs(scene,phyObjs);
					globalParam.physics_=true;
				}
				globalParam.physics_=globalParam.physics;

				O3o.movePhyObjs(scene,(obj.t+1)*24/globalParam.fps,phyObjs)
			}else{
				globalParam.physics_=false;
			}

			break;

		case MSG_DRAW:
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()

			ono3d.rotate(-PI*0.5,1,0,0)
			if(obj3d){
				if(obj3d.scenes.length>0){
					if(globalParam.physics){
						O3o.drawScene(obj3d,globalParam.scene,obj.t*24/globalParam.fps,phyObjs);
					}else{
						O3o.drawScene(obj3d,globalParam.scene,obj.t*24/globalParam.fps,null);
					}
				}
			}
			break;
		}
		return defObj(obj,msg,param);
	}
		var url=location.search.substring(1,location.search.length)
		globalParam.outlineWidth=0;
		globalParam.outlineColor="000000";
		globalParam.lightColor1="ffffff";
		globalParam.lightColor2="808080";;
		globalParam.lightThreshold1=0.5;
		globalParam.lightThreshold2=0.6;
		globalParam.physics=1;
		globalParam.smoothing=1;
		globalParam.stereomode=0;
		globalParam.stereoVolume=1;
		globalParam.step2=1;
		globalParam.fps=30;
		globalParam.scene=0;
		globalParam.shadow=0;
		globalParam.model="./raara.o3o";
		globalParam.materialMode = false;
		globalParam.cColor= "ffffff";
		globalParam.cReflection= 0;
		globalParam.cReflectionColor= "ffffff";
		globalParam.cRoughness= 0;
		globalParam.frenel = 0;
		globalParam.cAlpha= 1.0;
		globalParam.cRefraction = 1.1;

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
	
	var mainObj=createObj(mainObj);
	var camera=createObj(defObj);
	var camera2=createObj(defObj);
	var camerazoom=1;
	var viewMatrix=new Mat44();
	var span;
	var oldTime = 0;
	var mseccount=0;
	var framecount=0;
	var vec3=new Vec3();
	var inittime=0;
	var timer=0;
	var mainloop=function(){
		var nowTime = Date.now()
		timer=nowTime-inittime;
		
		var obj;

		if(obj3d.objects.length<=0){
			return;
		}
		var i;
		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat===STAT_CREATE){
				objs[i].stat=STAT_ENABLE;
			}
			if(objs[i].stat<0){
				objs[i].stat++;
			}
		}

		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat!==STAT_ENABLE)continue;
			objs[i].func(objs[i],MSG_MOVE,0);
		}
		if(globalParam.physics){
			onoPhy.calc(1.0/globalParam.fps,globalParam.step2);
		}

		vec3[0]=mainObj.p[0]
		vec3[1]=6;//mainObj.p[1];
		vec3[2]=mainObj.p[2]
		camera2.p[0]=(Util.cursorX-WIDTH)/WIDTH*8;
		camera2.p[1]=-(Util.cursorY-HEIGHT)/HEIGHT*6;
		camera2.p[2]=10-Math.pow((Util.cursorX-WIDTH)/WIDTH,2)*2;
		camera.p[0]+=(camera2.p[0]-camera.p[0])*0.1
		camera.p[1]+=(camera2.p[1]-camera.p[1])*0.1
		camera.p[2]+=(camera2.p[2]-camera.p[2])*0.1
		homingCamera(camera.a,vec3,camera.p);

		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat!==STAT_ENABLE)continue;
			objs[i].t++;
			objs[i].frame++;
		}

		ono3d.setTargetMatrix(1)
		ono3d.loadIdentity()
		ono3d.scale(camerazoom,camerazoom,camerazoom)

		ono3d.rotate(-camera.a[2],0,0,1)
		ono3d.rotate(-camera.a[0],1,0,0)
		ono3d.rotate(-camera.a[1],0,1,0)
		ono3d.translate(-camera.p[0],-camera.p[1],-camera.p[2])

		ono3d.rf=0;
		ono3d.lineWidth=1.0;
		if(globalParam.outlineWidth>0.){
			ono3d.lineWidth=globalParam.outlineWidth;
			ono3d.rf=Ono3d.RF_OUTLINE;
			Util.hex2rgb(ono3d.outlineColor,globalParam.outlineColor);
		}
		ono3d.smoothing=globalParam.smoothing;

		var light=ono3d.lightSources[0];
		Util.hex2rgb(light.color,globalParam.lightColor1);

		light=ono3d.lightSources[1];
		Util.hex2rgb(light.color,globalParam.lightColor2);

		ono3d.lightThreshold1=globalParam.lightThreshold1;
		ono3d.lightThreshold2=globalParam.lightThreshold2;

	
		var cMat = O3o.customMaterial;
		var a=new Vec3();
		Util.hex2rgb(a,globalParam.cColor);
		cMat.r=a[0];
		cMat.g=a[1];
		cMat.b=a[2];
		cMat.a=globalParam.cAlpha;
		cMat.reflect=globalParam.cReflection;
		cMat.refract=globalParam.cRefraction;
		cMat.rough=globalParam.cRoughness;
		Util.hex2rgb(cMat.reflectionColor,globalParam.cReflectionColor);
		cMat.texture=globalParam.cRoughness;
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
			texture_slot.normal= 1.0;
		}

		O3o.useCustomMaterial = globalParam.cMaterial;

		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat!==STAT_ENABLE)continue;
			ono3d.push();
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()
			objs[i].func(objs[i],MSG_DRAW,0);
			ono3d.setTargetMatrix(1)
			ono3d.pop();
		}

		gl.depthMask(true);
		//Rastgl.renderShadowmap();
		gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
		Shadow.draw(ono3d);
		gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
		gl.copyTexImage2D(gl.TEXTURE_2D,0,gl.RGBA,0,0,1024,1024,0);
		
		globalParam.stereo=-globalParam.stereoVolume * globalParam.stereomode*0.7;

		ono3d.setPers(0.577,480/360);

		//gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
		gl.clear(gl.DEPTH_BUFFER_BIT);
		if(sky.gltexture){
			if(globalParam.stereomode==0){
				ono3d.setPers(0.577,480/720);
				gl.disable(gl.DEPTH_TEST);
				gl.viewport(0,0,720,480);
				Env.env(sky.gltexture);
			}else{
				ono3d.setPers(0.577,480/360);
				gl.disable(gl.DEPTH_TEST);
				gl.viewport(0,0,360,480);
				Env.env(sky.gltexture);
				gl.viewport(360,0,360,480);
				Env.env(sky.gltexture);
			}
		}
	//		ono3d.render(Util.ctx)
	
	gl.disable(gl.BLEND);
	gl.depthMask(true);
	gl.enable(gl.DEPTH_TEST);
	gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
	//edgeShader.draw(ono3d);
	Plain.draw(ono3d);
	if(envtexes){
		MainShader.draw(ono3d,shadowTexture,envtexes,camera.p,globalParam.frenel);
	}
	//Shade.draw(ono3d,envtexes[envtexes.length-1],shadowTexture);
	//gl.depthMask(false);
//	if(envtexes){
//		Env.drawMrr(ono3d,envtexes,camera.p);
//	}
	//Color.draw(ono3d);
	gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,720,480);

//emi
	gl.clearColor(0.0,0.0,0.0,1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.depthMask(false);
	EmiShader.draw(ono3d);
	ono3d.framebuffer();

	gl.viewport(0,0,720,480);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.disable(gl.BLEND);
	Rastgl.copyframe(shadowTexture,0,0,720/1024,480/1024);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE,gl.ONE);

	Rastgl.copyframe(Rastgl.fTexture,0,0,720/1024,480/1024);
	
	gl.disable(gl.BLEND);
//		Rastgl.copyframe(envtexes[envtexes.length-1],0,0,1,1,1);

		ono3d.clear()
		gl.finish();

		mseccount += (Date.now() - nowTime)
		framecount++
		if(nowTime-oldTime > 1000){
			var mspf=0;
			var fps = framecount*1000/(nowTime-oldTime)
			if(framecount!==0)mspf = mseccount/framecount
			
			Util.setText(span,fps.toFixed(2) + "fps " + mspf.toFixed(2) + "msec")
	
			framecount = 0
			mseccount=0
			oldTime = nowTime
		}
	}
	var parentnode = (function (scripts) {
		return scripts[scripts.length - 1].parentNode;
	}) (document.scripts || document.getElementsByTagName('script'));


	ret.loadModel=function(path){
		globalParam.model=path;
		obj3d=O3o.load(globalParam.model,function(){
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
			document.getElementById("scene").selectedIndex=globalParam.scene;
			Util.fireEvent(document.getElementById("scene"),"change");

		});
		
	}
	ret.start = function(){
		//sky = Rastgl.loadTexture("sky.png");
		var texes = ["tex1.jpg","tex2.jpg"];
		var select = document.getElementById("cTexture");
		var option;
		for(i=0;i<texes.length;i++){
			var texture = new O3o.Texture();
	
			texture.image = Ono3d.loadTexture(texes[i]);
			customTextures.push(texture);

			option = document.createElement('option');
			option.setAttribute('value', i);
			option.innerHTML = texes[i];
			select.appendChild(option);
		}
		document.getElementById("scene").selectedIndex=globalParam.scene;
		Util.fireEvent(document.getElementById("scene"),"change");
		texes = ["bump1.png"];
		select = document.getElementById("cBump");
		for(i=0;i<texes.length;i++){
			var texture = new O3o.Texture();
	
			texture.image = Ono3d.loadBumpTexture(texes[i]);
			customBumps.push(texture);

			option = document.createElement('option');
			option.setAttribute('value', i);
			option.innerHTML = texes[i];
			select.appendChild(option);
		}
		sky = Ono3d.loadCubemap("skybox.jpg",function(image){
			var envsize=128;

			var envs=[0.0,0.2,0.4,0.6,1.0];
			gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
			gl.viewport(0,0,envsize,envsize);
			envtexes=[];
//			envtexes.push(0);
//			envtexes.push(image.gltexture);
			var targets=[
				gl.TEXTURE_CUBE_MAP_POSITIVE_Z
				,gl.TEXTURE_CUBE_MAP_POSITIVE_X
				,gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
				,gl.TEXTURE_CUBE_MAP_NEGATIVE_X
				,gl.TEXTURE_CUBE_MAP_POSITIVE_Y
				,gl.TEXTURE_CUBE_MAP_NEGATIVE_Y
			];
			var matrixes=[
				[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
				,[0,0,-1,0,0,1,0,0,1,0,0,0,0,0,0,1]
				,[-1,0,0,0,0,1,0,0,0,0,-1,0,0,0,0,1]
				,[0,0,1,0,0,1,0,0,-1,0,0,0,0,0,0,1]
				,[1,0,0,0,0,0, 1,0,0,-1,0,0,0,0,0,1]
				,[1,0,0,0,0,0,-1,0,0, 1,0,0,0,0,0,1]
				];
			for(var i=0;i<envs.length;i++){
				var tex = gl.createTexture();
				gl.bindTexture(gl.TEXTURE_CUBE_MAP,tex);
				var ii;
				for(ii=0;ii<6;ii++){
					gl.texImage2D(targets[ii], 0, gl.RGBA, envsize, envsize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
				}
				gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
				gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
				for(ii=0;ii<6;ii++){
					Env.rough(image.gltexture,envs[i],tex,envsize,envsize,matrixes[ii],targets[ii]);
					//gl.copyTexImage2D(targets[ii],0,gl.RGBA,0,0,64,64,0);
				}
				envtexes.push(envs[i]);
				envtexes.push(tex);
			}

//			{
//				gl.viewport(0,0,1024,512);
//				var tex=Rastgl.createTexture(null,1024,512);
//				Env.rough(image.gltexture,1.0,tex,1024,512);
//				gl.bindTexture(gl.TEXTURE_2D, tex);
//				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//				gl.copyTexImage2D(gl.TEXTURE_2D,0,gl.RGBA,0,0,1024,512,0);
//				envtexes.push(1.1);
//				envtexes.push(tex);
//			}
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	//		Util.loadImage("roughness.jpg",1,function(image){
	//			envtexes.push(1.0);
	//			envtexes.push(image.gltexture);
	//		});
		});
		
		Util.setFps(globalParam.fps,mainloop);
		Util.fpsman();

	}
		var div=document.createElement("div");
		parentnode.appendChild(div);
		var canvas =document.createElement("canvas");
		canvas.width=WIDTH;
		canvas.height=HEIGHT;
		parentnode.appendChild(canvas);
		var canvasgl =document.createElement("canvas");
		canvasgl.width=WIDTH*2;
		canvasgl.height=HEIGHT;
		parentnode.appendChild(canvasgl);
		var ctx=canvas.getContext("2d");
		gl = canvasgl.getContext('webgl') || canvasgl.getContext('experimental-webgl');

		Util.init(canvas,document.body);
		var ono3d = new Ono3d()
		O3o.setOno3d(ono3d)
		ono3d.init(canvas,ctx);

		ono3d.rendercanvas=canvas;
		if(gl){
			globalParam.enableGL=true;
		}else{
			globalParam.enableGL=false;
		}
		globalParam.gl=gl;


		if(globalParam.enableGL){
			Rastgl.init(gl,ono3d);
			canvas.style.width="0px";
			canvasgl.style.display="inline";
			Ono3d.setDrawMethod(3);
		}else{
			canvasgl.style.display="none";
			canvas.style.display="inline";
		}

		gl.clearColor(1, 1, 1,1.0);

		shadowTexture=Rastgl.createTexture(null,1024,1024);
		gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		onoPhy = new OnoPhy();

		var light = new ono3d.LightSource()
		light.type =Ono3d.LT_DIRECTION
		Vec3.set(light.angle,-1,-1,-1);
		Vec3.set(light.pos,8,20,8);
		light.power=1
		light.color[0]=1
		light.color[1]=1
		light.color[2]=1
		Vec3.norm(light.angle)
		ono3d.lightSources.push(light)
		light = new ono3d.LightSource()
		light.type =Ono3d.LT_AMBIENT
		light.color[0]=0.2
		light.color[1]=0.2
		light.color[2]=0.2
		ono3d.lightSources.push(light)
		Vec3.set(camera.p,0,6,10)
		Vec3.set(camera.a,0,PI,0)
		inittime=Date.now();

		span=document.getElementById("cons");
	ret.changeScene=function(){
		phyObjs=null;
		globalParam.physics_=false;
	}
	var homingCamera=function(angle,target,camera){
		var dx=target[0]-camera[0]
		var dy=target[1]-camera[1]
		var dz=target[2]-camera[2]
		angle[0]=-Math.atan2(dy,Math.sqrt(dz*dz+dx*dx));
		angle[1]=Math.atan2(dx,dz);
		angle[2]=0;
	}

	ret.loadModel(globalParam.model);
	//ret.start();
	return ret;
})()
