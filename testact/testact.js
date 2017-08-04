"use strict"
var Testact=(function(){
	var ret={};
	var HEIGHT=480,WIDTH=720;
	var obj3d;
	var PI=Math.PI;
	var OBJSLENGTH=1024;
	var i;
	var gl;
	var onoPhy=null;
	var objs=[];
	var sky=null;
	var envtexes=null;
	var shadowTexture;
	var bufTexture;
	var emiTexture;
	var customTextures=[];
	var customBumps=[];
	var bdf;
	var bdfimage=null;
	var o3oField;
	var iroiro;
	var tsukamiTarget= null;
	var tsukamiZ= -1;
	var soundbuffer=null;

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
	var fieldObj=function(obj,msg,param){
		var obj3d=o3oField;
		switch(msg){
		case MSG_MOVE:
			if(obj3d.scenes.length===0){
				break;
			}
			var scene=obj3d.scenes[0];


			break;

		case MSG_DRAW:
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()

			ono3d.rotate(-PI*0.5,1,0,0)
			if(obj3d){
				if(obj3d.scenes.length>0){

					O3o.drawScene(obj3d,0,obj.t*24/globalParam.fps,null);

				}
			}
			break;
		}
		return defObj(obj,msg,param);
	}
	var mainObj=function(obj,msg,param){
		var phyObjs = obj.phyObjs;
		switch(msg){
		case MSG_CREATE:
			obj.phyObjs= null;
			Vec3.set(obj.p,0,15,-9);
			break;
		case MSG_MOVE:
		
			
			if(obj3d.scenes.length===0){
				break;
			}
			var scene= obj3d.scenes[globalParam.scene];
			if(phyObjs===null){


				if(obj3d.scenes.length>0){
					phyObjs=new Array();
					obj.phyObjs= phyObjs;
					ono3d.setTargetMatrix(1)
					ono3d.loadIdentity()
					ono3d.setTargetMatrix(0)
					ono3d.loadIdentity()
					ono3d.rotate(-PI*0.5,1,0,0);
					O3o.setFrame(obj3d,scene,0);
					for(i=0;i<scene.objects.length;i++){
						var phyobj=O3o.createPhyObj(scene.objects[i],onoPhy);
						if(phyobj){
						
							//O3o.movePhyObj(scene,phyobj,1);
							Vec3.copy(phyobj.location,obj.p);

							phyObjs.push(phyobj);
							phyobj.mass*=phyobj.scale[0]* phyobj.scale[1]* phyobj.scale[2];
							phyobj.dfriction=0.5;
							Vec3.set(phyobj.v,0,0,0);
							Vec3.set(phyobj.location,-4,6,0);

							OnoPhy.setPhyObjData(phyobj);
						}
					}
					globalParam.physics_=true;
				}
			}
			//O3o.setFrame(obj3d,scene,(obj.t+1)*24/30);
			ono3d.setTargetMatrix(1)
			ono3d.loadIdentity()
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity();
			ono3d.translate(obj.p[0],obj.p[1],obj.p[2]);
			ono3d.rotate(-PI*0.5,1,0,0)
			O3o.setFrame(obj3d,scene,timer/1000.0*24);
			if(phyObjs && globalParam.physics){
				var objects = scene.objects;
				var flg = 0;

				if(!globalParam.physics_){
					flg = 1;
					globalParam.physics_=true;
				}
				for(var i=0;i<phyObjs.length;i++){
					var phyName=phyObjs[i].name;
					for(var j=0;j<objects.length;j++){
						if(phyName===objects[j].name){
							O3o.movePhyObj(objects[j],phyObjs[i],flg);
							break;
						}
					}
				}

			}else{
				globalParam.physics_=false;
			}
			

			
			phyObjs[0].a[0]+=(Util.keyflag[2+obj.id*8]-Util.keyflag[0+obj.id*8])*phyObjs[0].mass*4;
			phyObjs[0].a[2]+=(Util.keyflag[3+obj.id*8]-Util.keyflag[1+obj.id*8])*phyObjs[0].mass*4;
			
			
			if(Util.keyflag[4+obj.id*8] &&  !Util.keyflagOld[4+obj.id*8]){
				phyObjs[0].v[1]=2;
				phyObjs[0].location[1]+=0.04;
			
			}
			
			obj.p[0] = phyObjs[0].matrix[12];
			obj.p[1] = phyObjs[0].matrix[13];
			obj.p[2] = phyObjs[0].matrix[14];
			if(phyObjs[0].location[1]<-10){
				var phyobj=phyObjs[0];

				Vec3.set(phyobj.location,0,15,-9);
				Vec3.set(phyobj.scale,0.1+Math.random()*2
						,0.1+Math.random()*2
						,0.1+Math.random()*2
						);
				phyobj.mass=phyobj.scale[0]* phyobj.scale[1]* phyobj.scale[2]*1;
				phyobj.imoment=phyobj.mass*2/5*Vec3.dot(phyobj.scale,phyobj.scale);
				phyobj.damper=10*phyobj.mass;
				phyobj.adamper=10*phyobj.imoment;
				phyobj.penalty=phyobj.mass*100;
				Vec3.set(phyobj.v,0,0,0);
				Vec3.set(phyobj.location,-4,6,0);
				phyobj.dfriction=0.7;
				phyobj.sfriction=phyobj.dfriction*1.1;

				OnoPhy.calcObj(phyobj);
			}
			break;

		case MSG_DRAW:
			ono3d.rf=0;
			if(globalParam.outlineWidth>0.){
				ono3d.lineWidth=globalParam.outlineWidth;
				ono3d.rf=Ono3d.RF_OUTLINE;
				Util.hex2rgb(ono3d.lineColor,globalParam.outlineColor);
			}
			if(tsukamiTarget){
				if(tsukamiTarget.con2 == obj.phyObjs[0]){
					ono3d.lineWidth=1;
					ono3d.rf=Ono3d.RF_OUTLINE;
					Vec4.set(ono3d.lineColor,1,4,1,0);
				}
			}
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()
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
		globalParam.lightColor1="808080";
		globalParam.lightColor2="808080";;
		globalParam.lightThreshold1=0.;
		globalParam.lightThreshold2=1.;
		globalParam.physics=1;
		globalParam.smoothing=0;
		globalParam.stereomode=0;
		globalParam.stereoVolume=1;
		globalParam.step2=2;
		globalParam.fps=30;
		globalParam.scene=0;
		globalParam.shadow=1;
		globalParam.model="./sphere.o3o";
		globalParam.materialMode = false;
		globalParam.cColor= "ffffff";
		globalParam.cReflection= 0;
		globalParam.cReflectionColor= "ffffff";
		globalParam.cRoughness= 0;
		globalParam.frenel = 0;
		globalParam.cAlpha= 1.0;
		globalParam.cRefraction = 1.1;
		globalParam.cNormal= 1.0;
		globalParam.cEmi= 0.0;

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
	
	var mobj=createObj(mainObj);
	mobj.id=0;

//	var mobj2=createObj(mainObj);
//	mobj2.id=1;
//	mobj2.p[0]=-4;
	
	var fieldObj=createObj(fieldObj);
	var camera=createObj(defObj);
	var camera2=createObj(defObj);
	var camerazoom=0.577;
	var span;
	var oldTime = 0;
	var mseccount=0;
	var framecount=0;
	var vec3=new Vec3();
	var vec4=new Vec4();
	var inittime=0;
	var timer=0;
	var mat44 = new Mat44;
	var mainloop=function(){
		var nowTime = Date.now()
		timer=nowTime-inittime;
		
		var obj;

		if(obj3d == null){
			return;
		}
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

		for(var j=0;j<globalParam.step2;j++){
			for(i=0;i<OBJSLENGTH;i++){
				if(objs[i].stat!==STAT_ENABLE)continue;
				objs[i].func(objs[i],MSG_MOVE,0);
			}
			if(globalParam.physics){
				onoPhy.calc(1.0/globalParam.fps/globalParam.step2,1);
			}
		}

		//camera3.p[0]=0;
		//camera2.p[1]=15;
		//camera2.p[2]=15;
		//camera2.p[0]=(Util.cursorX-WIDTH)/WIDTH*8;
		//camera2.p[1]=-(Util.cursorY-HEIGHT)/HEIGHT*6;
		//camera2.p[2]=40-Math.pow((Util.cursorX-WIDTH)/WIDTH,2)*2;

		iroiro="";
		if(Util.pressOn && !tsukamiTarget){
			camera2.a[1]+=(-(Util.cursorX-Util.oldcursorX)/WIDTH);
			camera2.a[0]+=((Util.cursorY-Util.oldcursorY)/HEIGHT);

		}
		camera2.a[0] =Math.min(camera2.a[0],Math.PI/2);
		camera2.a[0] =Math.max(camera2.a[0],-Math.PI/2);
		camera2.p[2]=Math.cos(camera2.a[0]);
		camera2.p[1]=Math.sin(camera2.a[0]);
		camera2.p[0]=Math.sin(camera2.a[1])*camera2.p[2];
		camera2.p[2]=Math.cos(camera2.a[1])*camera2.p[2];
		Vec3.mul(camera2.p,camera2.p,10);
		camera2.p[1]+=2;

		camera.p[0]+=(camera2.p[0]-camera.p[0])*0.1
		camera.p[1]+=(camera2.p[1]-camera.p[1])*0.1
		camera.p[2]+=(camera2.p[2]-camera.p[2])*0.1
		vec3[0]=0
		vec3[1]=2
		vec3[2]=0
		homingCamera(camera.a,vec3,camera.p);

		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat!==STAT_ENABLE)continue;
			objs[i].t++;
			objs[i].frame++;
		}

		ono3d.setTargetMatrix(1)
		ono3d.loadIdentity()
		

		//ono3d.scale(camerazoom,camerazoom,1)
		ono3d.rotate(-camera.a[2],0,0,1)
		ono3d.rotate(-camera.a[0],1,0,0)
		ono3d.rotate(-camera.a[1]+Math.PI,0,1,0)
		ono3d.translate(-camera.p[0],-camera.p[1],-camera.p[2])
		ono3d.setAov(camerazoom);

		var cursorr = new Vec2();
		cursorr[0] =Util.cursorX/WIDTH*2-1;
		cursorr[1] =Util.cursorY/HEIGHT*2-1;
		if(globalParam.stereomode!=0){
			cursorr[0]*=2;
			if(cursorr[0]<0){
				cursorr[0]+=1;
			}else{
				cursorr[0]-=1;
			}
		}
		if(Util.pressCount == 1){
			var p0 =new Vec3();
			var p1 =new Vec3();
			WebAudio.playSound(soundbuffer);

			Mat44.getInv(mat44,ono3d.pvMat);
			Vec4.set(vec4,cursorr[0],-cursorr[1],-1,1);
			Mat44.dotMat44Vec4(vec4,mat44,vec4);
			Vec3.set(p0,vec4[0],vec4[1],vec4[2]);

			Vec4.set(vec4,cursorr[0],-cursorr[1],1,1);
			Vec4.mul(vec4,vec4,80);
			Mat44.dotMat44Vec4(vec4,mat44,vec4);
			Vec3.set(p1,vec4[0],vec4[1],vec4[2]);

			tsukamiTarget = null;
			for(var i=0;i<onoPhy.phyObjs.length;i++){
				var phyObj = onoPhy.phyObjs[i];
				if(phyObj.fix){
					continue;
				}
				var flg = false;
				switch (phyObj.type){
				case OnoPhy.CUBOID:
					if(OnoPhy.CUBOID_LINE(p0,p1,phyObj)){
						flg=true;
					}	
					break;
				case OnoPhy.SPHERE:
					if(OnoPhy.SPHERE_LINE(p0,p1,phyObj)){
						flg=true;
					}
					break;
				}
				if(flg){
					tsukamiTarget = onoPhy.createSpring();
					tsukamiTarget.con1 = null;
					tsukamiTarget.con2 = phyObj;
					tsukamiZ = OnoPhy.result;
					tsukamiTarget.size[0]=1;
					tsukamiTarget.scale[0]=0;
					tsukamiTarget.penalty=40;
					tsukamiTarget.damper=40;

					Vec3.sub(p1,p1,p0);
					Vec3.muladd(p1,p0,p1,tsukamiZ);
					Mat43.dotMat43Vec3(tsukamiTarget.con2Pos,phyObj.imatrix,p1);
					break;
				}
			}
		}

		if(tsukamiTarget){
			if(!Util.pressOn){
				onoPhy.deletePhyObject(tsukamiTarget);
				tsukamiTarget = null;

			}else{
				Mat44.getInv(mat44,ono3d.pvMat);
		
				var w=(tsukamiZ*79+1);
				var z =  -ono3d.projectionMat[10] + ono3d.projectionMat[14]/w;
				Vec4.set(vec4,cursorr[0],-cursorr[1],z,1);
				Vec4.mul(vec4,vec4,w);
				Mat44.dotMat44Vec4(vec4,mat44,vec4);
				Vec3.copy(tsukamiTarget.p0,vec4);
				
	//			Vec3.sub(vec4,vec4,tsukamiTarget.location);
	//			Vec3.mul(vec4,vec4,40);
	//			Vec3.add(tsukamiTarget.a,tsukamiTarget.a,vec4);
			}
			
		}

		ono3d.rf=0;
		ono3d.lineWidth=1.0;
//		if(globalParam.outlineWidth>0.){
//			ono3d.lineWidth=globalParam.outlineWidth;
//			ono3d.rf=Ono3d.RF_OUTLINE;
//			Util.hex2rgb(ono3d.outlineColor,globalParam.outlineColor);
//		}
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
		cMat.emt=globalParam.cEmi;
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
			texture_slot.normal= globalParam.cNormal;
		}

		O3o.useCustomMaterial = globalParam.cMaterial;

		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat!==STAT_ENABLE)continue;
			ono3d.push();
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()
			ono3d.rf=0;
			objs[i].func(objs[i],MSG_DRAW,0);
			ono3d.setTargetMatrix(1)
			ono3d.pop();
		}

//シャドウマップ描画
		gl.bindFramebuffer(gl.FRAMEBUFFER,Rastgl.frameBuffer);
		gl.viewport(0,0,1024,1024);
		gl.depthMask(true);
		gl.clearColor(1., 1., 1.,1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		if(globalParam.shadow){
			gl.enable(gl.DEPTH_TEST);
			
			ono3d.setOrtho(20.0,20.0,1.0,100.0)
			var lightSource = ono3d.lightSources[0]
			Mat43.setInit(lightSource.matrix);
			Mat43.getRotVector(lightSource.matrix,lightSource.angle);
			Mat43.setInit(mat44);
			mat44[12]=-lightSource.pos[0]
			mat44[13]=-lightSource.pos[1]
			mat44[14]=-lightSource.pos[2]

			Mat43.dot(lightSource.matrix,lightSource.matrix,mat44);
			Mat44.dotMat44Mat43(ono3d.pvMat,ono3d.projectionMat,lightSource.matrix);
			
			Shadow.draw(ono3d);
		}
		gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
		gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,1024,1024);
		
		globalParam.stereo=-globalParam.stereoVolume * globalParam.stereomode*0.7;

//遠景描画
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.BLEND);
		gl.depthMask(true);
		gl.viewport(0,0,1024,1024);
		gl.clearColor(0.0,0.0,0.0,0.0);
		gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);
		gl.depthMask(false);
		gl.colorMask(true,true,true,true);
		gl.disable(gl.BLEND);
		if(sky.gltexture){
			if(globalParam.stereomode==0){
				ono3d.setPers(0.577,HEIGHT/WIDTH);
				gl.viewport(0,0,WIDTH,HEIGHT);
				Env.env(envtexes[1]);
			}else{
				ono3d.setPers(0.577,HEIGHT/WIDTH*2);
				gl.viewport(0,0,WIDTH/2,HEIGHT);
				Env.env(envtexes[1]);
				gl.viewport(WIDTH/2,0,WIDTH/2,HEIGHT);
				Env.env(envtexes[1]);
				
			}
		}

		gl.viewport(0,0,WIDTH,HEIGHT);
//オブジェクト描画
		gl.depthMask(true);
		gl.enable(gl.DEPTH_TEST);
		ono3d.setViewport(0,0,WIDTH,HEIGHT);

		if(envtexes){
			MainShader.draw(ono3d,shadowTexture,envtexes,camera.p,globalParam.frenel);
		}
		Plain.draw(ono3d);
		gl.finish();
		
//描画結果を別フレームバッファにコピー
		gl.depthMask(false);
		gl.disable(gl.DEPTH_TEST);
		gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
		gl.clearColor(0.0,0.0,0.0,0.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindTexture(gl.TEXTURE_2D, Rastgl.fTexture);
		gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,WIDTH,HEIGHT);

//メインのバッファのアルファ値を1にする
		gl.viewport(0,0,WIDTH,HEIGHT);
		gl.colorMask(false,false,false,true);
		gl.clearColor(0.0,0.0,0.0,1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.colorMask(true,true,true,true);

//疑似HDRぼかし
		gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
		gl.viewport(0,0,WIDTH+1.0,HEIGHT);
		gl.depthMask(false);
		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.blendFuncSeparate(gl.CONSTANT_ALPHA,gl.DST_ALPHA,gl.ZERO,gl.ZERO);
		gl.blendColor(0,0,0,0.7);
		Rastgl.copyframe(emiTexture,0,0,WIDTH/1024,HEIGHT/1024);
		gl.disable(gl.BLEND);
		gl.bindTexture(gl.TEXTURE_2D, emiTexture);
		gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,WIDTH,HEIGHT);
		Gauss.filter(emiTexture,emiTexture,100,2.0/1024,1024.0);
//表画面に合成
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0,0,WIDTH,HEIGHT);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE,gl.ONE);
		Rastgl.copyframe(emiTexture,0,0,WIDTH/1024,HEIGHT/1024);

//		if(bdfimage){
//			gl.enable(gl.BLEND);
//			gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE);
//			Rastgl.stereoDraw(ono3d,function(){
//				var vec = new Vec4();
//				Vec4.set(vec,0,9,0,1);
//				Mat44.dotMat44Vec4(vec,ono3d.projectionMat,vec);
//				Rastgl.copyframe(bdfimage.gltexture,vec[0]/vec[3],vec[1]/vec[3],0.3,-0.3*ono3d.persx/ono3d.persy,0,0,0.6,0.6);
//			});
//		}
		ono3d.clear();
		gl.finish();

		mseccount += (Date.now() - nowTime)
		framecount++
		if(nowTime-oldTime > 1000){
			var mspf=0;
			var fps = framecount*1000/(nowTime-oldTime)
			if(framecount!==0)mspf = mseccount/framecount
			
			Util.setText(span,fps.toFixed(2) + "fps " + mspf.toFixed(2) + "msec" +"," +iroiro)
	
			framecount = 0
			mseccount=0
			oldTime = nowTime
		}
	}
	var parentnode = (function (scripts) {
		return scripts[scripts.length - 1].parentNode;
	}) (document.scripts || document.getElementsByTagName('script'));


	ret.loadModel=function(){
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
	ret.changeScene=function(){
		//onoPhy.phyObjs = [];
		//for(var i=0;i<phyObjs;i++){
		//	for(var j=0;j<onoPhp.phyObjs;j++){
		//		if(onoPhy.phyObjs[j]===phyObjs[i]){
		//			onoPhy.phyObjs[j].splice(j,1);
		//			break;
		//		}
		//	}
		//}
		//phyObjs=null;
		//globalParam.physics_=false;
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
		o3oField=O3o.load("field.o3o",function(o3o){
			var scene=o3o.scenes[0];
			ono3d.setTargetMatrix(1)
			ono3d.loadIdentity()
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()
			ono3d.rotate(-PI*0.5,1,0,0);
			O3o.setFrame(o3o,scene,0);
			for(i=0;i<scene.objects.length;i++){
				O3o.createPhyObj(scene.objects[i],onoPhy);
			}
		});
		soundbuffer = WebAudio.loadSound('se.mp3');
		sky = Ono3d.loadCubemap("skybox.jpg",function(image){
			var envsize=16;

			var envs=[0.1,0.2,0.4,0.8,1.0];
			gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
			envtexes=[];
			envtexes.push(0);
			envtexes.push(image.gltexture);
			

			envsize=image.images[0].width;
			envsize=16;
			var envsizeorg=envsize;
			var ii=1;
			var fazy=Math.atan2(envsizeorg/envsize,envsizeorg*0.5)/(Math.PI*0.5)*2.0;
			for(var i=0;i<envs.length;i++){
				//envsize=envsize>>1;
				var tex = gl.createTexture();
				gl.bindTexture(gl.TEXTURE_CUBE_MAP,tex);
			
				//envs[i]=Math.atan2(ii,envsizeorg*0.5)/(Math.PI*0.5);
				//ii*=2;

				Rough.draw(tex,image.gltexture,envs[i],envsizeorg,envsizeorg);
				var tex2 = gl.createTexture();
				gl.bindTexture(gl.TEXTURE_CUBE_MAP,tex2);
				Rough.draw(tex2,tex,fazy,envsize,envsize);
				envtexes.push(envs[i]);
				envtexes.push(tex2);

			}
			
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			emiTexture = Rastgl.createTexture(null,1024,1024);

			bdf = Bdf.load("../lib/k8x12.bdf",null,function(){
				bdfimage = Bdf.render("abcABC!?",bdf,false);
				bdfimage.gltexture = Rastgl.createTexture(bdfimage);

				gl.bindTexture(gl.TEXTURE_2D,bdfimage.gltexture);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
				gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
				gl.viewport(0,0,1024,1024);
				gl.clearColor(.8,0.2,0.6,0.0);
				gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);
				gl.viewport(0,0,512,512);
				gl.enable(gl.BLEND);
				gl.blendFuncSeparate(gl.ZERO,gl.ONE,gl.ONE,gl.ONE);
				Rastgl.copyframe(bdfimage.gltexture,0,0,1/8,1/8);
				Rastgl.copyframe(bdfimage.gltexture,-2/512,0,1/8,1/8);
				Rastgl.copyframe(bdfimage.gltexture,-1/512,1/512,1/8,1/8);
				Rastgl.copyframe(bdfimage.gltexture,-0/512,1/512,1/8,1/8);
				Rastgl.copyframe(bdfimage.gltexture,-2/512,1/512,1/8,1/8);
				Rastgl.copyframe(bdfimage.gltexture,0/512,-1/512,1/8,1/8);
				Rastgl.copyframe(bdfimage.gltexture,-2/512,-1/512,1/8,1/8);
				Rastgl.copyframe(bdfimage.gltexture,-1/512,-1/512,1/8,1/8);
				Rastgl.copyframe(bdfimage.gltexture,-1/512,0,1/8,1/8);
				gl.bindTexture(gl.TEXTURE_2D,Rastgl.fTexture2);
				gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,1024,1024);
				gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE);
				Gauss.filter(Rastgl.fTexture2,Rastgl.fTexture2,100,1.0/1024,1024.0);
				gl.enable(gl.BLEND);
				gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE);
				Rastgl.copyframe(bdfimage.gltexture,-1/512,0,1/8,1/8);
				gl.bindTexture(gl.TEXTURE_2D,bdfimage.gltexture);
				gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,512,512);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

			});
		});
		
		Util.setFps(globalParam.fps,mainloop);
		Util.fpsman();
	
		var checkbox=document.getElementById("notstereo");
		if(globalParam.stereomode==-1){
			checkbox=document.getElementById("parallel");
		}else if(globalParam.stereomode==1){
			checkbox=document.getElementById("cross");
		}
		checkbox.checked=1;
			

		document.getElementById("scene").value=globalParam.scene;

		var tags=["smoothing"
			,"lightColor1"
			,"lightColor2"
			,"lightThreshold1"
			,"lightThreshold2"
			,"physics"
			,"outlineWidth"
			,"outlineColor"
			,"stereoVolume"
			,"shadow"
			,"frenel"
			,"cMaterial"
			,"cColor"
			,"cAlpha"
			,"cEmi"
			,"cRefraction"
			,"cReflection"
			,"cReflectionColor"
			,"cRoughness"
			,"cTexture"
			,"cBump"
			,"cNormal"

		];
		for(var i=0;i<tags.length;i++){
			(function(tag){
				var element = document.getElementById(tag);
				if(element.className=="colorpicker"){
					element.value=globalParam[tag];
					element.addEventListener("change",function(evt){globalParam[tag] = this.value},false);
				}else if(element.type=="checkbox"){
					element.checked=Boolean(globalParam[tag]);
					element.addEventListener("change",function(evt){globalParam[tag] = this.checked},false);
				}else{
					element.value=globalParam[tag];
					element.addEventListener("change",function(evt){globalParam[tag] = parseFloat(this.value)},false);
				}
				Util.fireEvent(element,"change");
			})(tags[i]);
		}

		var userAgent = window.navigator.userAgent.toLowerCase();
		if (navigator.platform.indexOf("Win") != -1) {
			globalParam.windows=true;
		}else{
			globalParam.windows=false;
		}

	}
		var div=document.createElement("div");
		parentnode.appendChild(div);
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
		gl.clearColor(0.0,0.0,0.0,1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
	
		shadowTexture=Rastgl.createTexture(null,1024,1024);
		gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		bufTexture=Rastgl.createTexture(null,1024,1024);
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
		
	var homingCamera=function(angle,target,camera){
		var dx=target[0]-camera[0]
		var dy=target[1]-camera[1]
		var dz=target[2]-camera[2]
		angle[0]=Math.atan2(dy,Math.sqrt(dz*dz+dx*dx));
		angle[1]=Math.atan2(dx,dz);
		angle[2]=0;
		
	}

	return ret;
})()
