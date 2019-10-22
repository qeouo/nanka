Engine.goClass.main= (function(){
	var GoMain=function(){};
	var ret = GoMain;
	inherits(ret,Engine.defObj);
	var objMan = Engine.objMan;
	var ono3d = Engine.ono3d;
	var onoPhy = Engine.onoPhy;
	var camera = Engine.camera;
	var gl = globalParam.gl;
	var WIDTH = Engine.WIDTH;
	var HEIGHT = Engine.HEIGHT;
	var o3o;

	ret.prototype.init=function(){

		for(var i=objMan.objs.length;i--;){
			if(this == objMan.objs[i])continue;
			objMan.deleteObj(objMan.objs[i]);
		}

		this.initFlg=false;
		Engine.onoPhy.init();

		o3o =AssetManager.o3o(globalParam.model);
		Engine.go.camera= objMan.createObj(Engine.goClass.camera);

		this.bane = null;
	
	}
	ret.prototype.move=function(){

		var bane = this.bane;
		if(!this.initFlg && o3o.scenes.length>0){
			if(Util.getLoadingCount() > 0){
				return;
			}
			this.initFlg=true;
			Engine.go.field=objMan.createObj(Engine.goClass.field);
			var t = Engine.go.field;

			var scene= o3o.scenes[0];
			Engine.skyTexture = scene.world.envTexture;

			scene.setFrame(0); //アニメーション処理
			instance = o3o.createInstance(); //インスタンス作成
			Engine.go.field.instance=instance;
			instance.calcMatrix(0,true);
			globalParam.instance=instance;

			ono3d.setTargetMatrix(0);
			ono3d.loadIdentity();

			instance.joinPhyObj(onoPhy);



			var scene = o3o.scenes[0];


			ono3d.environments_index=1;

			O3o.setEnvironments(scene); //光源セット


			//0番目の光源セットをコントロールに反映
			var env = ono3d.environments[0];
			for(var i=0;i<2;i++){
				var ol = [env.sun,env.area][i];
				var el = document.getElementById("lightColor"+(i+1));
				el.value = Util.rgb(ol.color[0],ol.color[1],ol.color[2]).slice(1);
				Util.fireEvent(el,"change");
			}

			var goCamera = Engine.go.camera;

			var co=  scene.objects.find(function(a){ return a.name==this; },"Camera");
			if(co){
				co = instance.objectInstances[co.idx];
				goCamera.p[0]=co.matrix[9];
				goCamera.p[1]=co.matrix[10];
				goCamera.p[2]=co.matrix[11];
				Mat44.dotVec3(goCamera.p,ono3d.worldMatrix,goCamera.p);
				goCamera.a[0]=co.matrix[3];
				goCamera.a[1]=co.matrix[4];
				goCamera.a[2]=co.matrix[5];
				Mat44.dotVec3(goCamera.a,ono3d.worldMatrix,goCamera.a);
				goCamera.target[0] = goCamera.p[0] - goCamera.a[0]* goCamera.p[2]/goCamera.a[2];
				goCamera.target[1] =  goCamera.p[1] - goCamera.a[1]* goCamera.p[2]/goCamera.a[2];
				goCamera.target[2] = 0;

				goCamera.cameralen=Math.abs(goCamera.p[2]);

				Engine.goClass.camera.homingCamera(goCamera.a,goCamera.target,goCamera.p);
				
			}

			Vec3.copy(camera.p,goCamera.p)
			Vec3.copy(camera.a,goCamera.a)


			goCamera.move();
			camera.calcMatrix();
			camera.calcCollision(camera.cameracol);
			var poses= camera.cameracol.poses;

//			Vec3.set(poses[0],-1,-1,-1);
//			Vec3.set(poses[1],-1,-1,1);
//			Vec3.set(poses[2],-1,1,-1,);
//			Vec3.set(poses[3],-1,1,1);
//			Vec3.set(poses[4],1,-1,-1);
//			Vec3.set(poses[5],1,-1,1);
//			Vec3.set(poses[6],1,1,-1,);
//			Vec3.set(poses[7],1,1,1);
//			for(var i=0;i<poses.length;i++){
//				Vec3.mul(poses[i],poses[i],10000);
//
//			}

			camera.cameracol.refresh();
			var lightSource= null;


			lightSource = ono3d.environments[0].sun
			if(lightSource){
				camera.calcCollision(camera.cameracol2,lightSource.viewmatrix);
			}

			ono3d.clear();

			//環境マップ
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			ono3d.environments[0].envTexture = ono3d.createEnv(null,0,0,0,Engine.drawSub);
			ono3d.setNearFar(0.01,100.0);
			ono3d.clear();
			var goField = Engine.go.field;
			goField.draw2();
			ono3d.render(camera.p);
			ono3d.setStatic();

			
			ono3d.lightThreshold1=globalParam.lightThreshold1;
			ono3d.lightThreshold2=globalParam.lightThreshold2;


			var lightprobe=o3o.objects.find(function(e){return e.name==="LightProbe"});
			if(lightprobe){
				instance.objectInstances[lightprobe.idx].createLightProbe(ono3d);
				//O3o.createLightProbe(ono3d,lightprobe)
			}

			
		}
		var mat44 = Mat44.poolAlloc();
		var vec4 = Vec4.poolAlloc();
		var cursorr = Vec2.poolAlloc();

		cursorr[0] =Util.cursorX/WIDTH*2-1;
		cursorr[1] =Util.cursorY/HEIGHT*2-1;
		if(globalParam.stereomode!=0){
			cursorr[0]*=2;
			if(cursorr[0]<0){
				cursorr[0]+=1;

				ono3d.projectionMatrix[12]=globalParam.stereo;
				Mat44.dot(ono3d.pvMatrix,ono3d.projectionMatrix,ono3d.viewMatrix);
			}else{
				cursorr[0]-=1;
			}
		}
		if(Util.pressCount == 1){
			var p0 = Vec3.poolAlloc();
			var p1 = Vec3.poolAlloc();
			var bV2 = Vec3.poolAlloc();

			Mat44.getInv(mat44,ono3d.pvMatrix);
			Vec4.set(vec4,cursorr[0],-cursorr[1],-1,1);
			Vec4.mul(vec4,vec4,ono3d.znear);
			Mat44.dotVec4(vec4,mat44,vec4);
			Vec3.set(p0,vec4[0],vec4[1],vec4[2]);

			Vec4.set(vec4,cursorr[0],-cursorr[1],1,1);
			Vec4.mul(vec4,vec4,ono3d.zfar);
			Mat44.dotVec4(vec4,mat44,vec4);
			Vec3.set(p1,vec4[0],vec4[1],vec4[2]);

			tsukamiZ= 1;
			var targetPhyObj = null;
			var res2={};
			var goField = Engine.go.field;

			var instance =globalParam.instance;
			var phyObjs = goField.phyObjs;
			for(var i=0;i<instance.objectInstances.length;i++){
				var phyObj = instance.objectInstances[i].phyObj;
				if(!phyObj)continue;
				if(phyObj.type===OnoPhy.CLOTH){
					var res={};
					var z = phyObj.rayCast(res,p0,p1);
					if(z>0){
						if(z<tsukamiZ){
							tsukamiZ = z;
							res2.face=res.face;
							res2.p1=res.p1;
							res2.p2=res.p2;
							res2.p3=res.p3;
							targetPhyObj = phyObj;
						}
					}

				}else{
					if(phyObj.fix){
						continue;
					}
					var collision= phyObj.collision;
					if(!collision){
						continue;
						
					}
					var z = collision.rayCast(p0,p1);
					if(z>0){
						if(z<tsukamiZ){
							tsukamiZ = z;
							targetPhyObj = collision.parent;
						}
					}
				}
			}
			if(targetPhyObj){
				bane = onoPhy.createSpring();
				bane.con1 = null;
				bane.defaultLength=0;
				bane.f=50*targetPhyObj.mass;
				bane.c=1*targetPhyObj.mass;

				Vec3.sub(bV2,p1,p0);
				Vec3.madd(bV2,p0,bV2,tsukamiZ);

				if(targetPhyObj.type===OnoPhy.CLOTH){
					bane.con2=targetPhyObj.getPhyFace(res2.p1,res2.p2,res2.p3,res2.face,bV2);
					Vec3.set(bane.con2Pos,0,0,0);
				}else{
					bane.con2 = targetPhyObj;
					var im=Mat43.poolAlloc();
					Mat43.getInv(im,targetPhyObj.matrix);
					Mat43.dotVec3(bane.con2Pos,im,bV2);
					Mat43.poolFree(1);
				}

			}
			Vec3.poolFree(3);
		}

		if(bane){
			if(!Util.pressOn){
				if(bane.con2.type===OnoPhy.FACE){
					OnoPhy.Cloth.disablePhyFace.push(bane.con2);
				}
				onoPhy.deleteSpring(bane);
				bane= null;

			}else{
				Mat44.getInv(mat44,ono3d.pvMatrix);
		
				var w=(tsukamiZ*(ono3d.zfar-ono3d.znear)+ono3d.znear);
				var z =  -ono3d.projectionMatrix[10] + ono3d.projectionMatrix[14]/w;
				Vec4.set(vec4,cursorr[0],-cursorr[1],z,1);
				Vec4.mul(vec4,vec4,w);
				Mat44.dotVec4(vec4,mat44,vec4);
				Vec3.copy(bane.p0,vec4);

				if(Util.pressCount==1){
					Vec3.copy(bane._p0,vec4);
				}
			}
			
		}
		this.bane = bane;
		Vec4.poolFree(1);
		Vec2.poolFree(1);
		Mat44.poolFree(1);
	}
	ret.prototype.delete=function(){
	}
	
	return ret;
})();
