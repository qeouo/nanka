"use strict"
var Engine = (function(){

var customMaterial = new Ono3d.Material();
	var Engine={};
	var ret = Engine;
	var HEIGHT=512,WIDTH=960;
	ret.HEIGHT = HEIGHT;
	ret.WIDTH= WIDTH;
	var gl;
	var onoPhy=null;
	var bdf;
	var bdfimage=null;
	var soundbuffer=null;
	var bufTexture;
	ret.goClass=[];
	ret.go=[];

ret.defObj= (function(){
	//オブジェクトのベースクラス
	var defObj = function(){};
	var ret = defObj;
	ret.prototype.init=function(){};
	ret.prototype.move=function(){};
	ret.prototype.draw=function(){};
	ret.prototype.drawShadow=function(){
		this.draw();
	};
	ret.prototype.hit=function(){};
	ret.prototype.delete=function(){};
	ret.prototype.drawhud=function(){};
	return ret;

})();

	var obj3d=null,field=null;
	var objMan;

	var i;
	var pad =new Vec2();
	ret.pad = pad;
	ret.probs = new Collider();

	var averageTexture; //光量計算用

	//オブジェクトマネージャ
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
				c=Engine.defObj;
			}
			var obj = null;
			if(this.pool.length>0){
				obj = this.pool[this.pool.length-1];
				if(obj.stat<0){
					//クールタイムなのは無視
					obj=null;
				}
			}
			if(!obj){
				//プールからとってこれない場合は何個か追加する
				for(var i=0;i<16;i++){
					this.pool.push(new Obj());
				}
			}
			//プールからオブジェクトを移動
			obj = this.pool.pop();
			this.objs.push(obj);

			if(this.objs.length>1024){
				//不本意
				alert("objs>1024!");
			}

			//初期値セット
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

			//IDセット
			obj.id=this.id;
			this.id++;

			obj.__proto__=c.prototype;

			obj.init();

			return obj;
			
		}
		ret.prototype.deleteObj=function(obj){
			for(var i=0;i<this.objs.length;i++){
				if(obj === this.objs[i]){
					//クールタイムを取る
					obj.stat=-10;
					//プールに移動
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
	
	//hud描画用
	var blit = function(tex,x,y,w,h,u,v,u2,v2){
			Ono3d.drawCopy(tex.glTexture,x,y,w*2,h*2
							,u/tex.width,(v+v2)/tex.height,u2/tex.width,-v2/tex.height);
	}
	
	//カメラ
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
		//画面描画関数

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
		var field=Engine.field;
		if(field){
			if(field.scenes.length>0){
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

		globalParam.outline_bold=0;
		globalParam.outline_color="000000";
		globalParam.lightColor1="808080";
		globalParam.lightColor2="808080";;
		globalParam.lightThreshold1=0.;
		globalParam.lightThreshold2=1.;
		globalParam.physics=1;
		globalParam.physics_=0;
		globalParam.smoothing=0;
		globalParam.stereomode=0;
		globalParam.stereoVolume=1;
		globalParam.step=1;
		globalParam.fps=60;
		globalParam.scene=0;
		globalParam.shadow=1;
		globalParam.model="./f1.o3o";
		globalParam.materialMode = false;
	//カスタムマテリアル
		globalParam.baseColor= "ffffff";
		globalParam.metallic= 0;
		globalParam.metalColor= "ffffff";
		globalParam.roughness= 0;
		globalParam.subRoughness= 0;
		globalParam.frenel = 0;
		globalParam.opacity= 1.0;
		globalParam.ior= 1.1;
		globalParam.cNormal= 1.0;
		globalParam.emi= 0.0;

		globalParam.debugMenu= 0;
		globalParam.shader= 0;

	//カメラ露光
		globalParam.autoExposure=1;
		globalParam.exposure_level=0.18;
		globalParam.exposure_upper=1;
		globalParam.exposure_bloom=0.1;
		
		globalParam.source=0;
		globalParam.target=0;
		globalParam.reference=0;
		globalParam.actionAlpha=0;

		
	
	
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
		//描画関数
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
//			cMat.texture_slots=[];
//			if(globalParam.cTexture>=0){
//				var texture_slot = new O3o.Texture_slot();
//
//				cMat.texture_slots.push(texture_slot);
//				texture_slot.texture = customTextures[globalParam.cTexture];
//			}
//			if(globalParam.cBump>=0){
//				var texture_slot = new O3o.Texture_slot();
//
//				cMat.texture_slots.push(texture_slot);
//				texture_slot.texture = customBumps[globalParam.cBump];
//				texture_slot.normal= globalParam.cNormal;
//			}
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
		//var env = ono3d.env2Texture;
		//gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		//ono3d.setViewport(0,0,WIDTH,HEIGHT);
		//Ono3d.drawCopy(env,0,0,1,1);

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
	ret.start = function(){
		
		var url=location.search.substring(1,location.search.length)
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
		Util.setFps(globalParam.fps,mainloop);
		Util.fpsman();

		if(this.userInit){
			this.userInit();
		}

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


		bufTexture=Ono3d.createTexture(1024,1024);
		gl.bindTexture(gl.TEXTURE_2D, bufTexture.glTexture);
	
		onoPhy = new OnoPhy();
		ret.onoPhy = onoPhy;
		ret.objMan = objMan = new ObjMan();
		
		Rastgl.ono3d = ono3d;

		inittime=Date.now();

		span=document.getElementById("cons");

		

		Util.loadJs("../engine/assetmanager.js");
		Util.loadJs("../engine/o3o.js",function(){

			O3o.setOno3d(ono3d)
			ono3d.init(canvas,ctx);
			ono3d.rendercanvas=canvas;
		});

	return ret;

})();
