Engine.goClass["field"]= (function(){
	var ono3d = Engine.ono3d;
	var onoPhy=Engine.onoPhy;
	var fieldpath="f1.o3o?10";
	var GoField =function(){};
	var gl = globalParam.gl;
	var ret = GoField;
	var initFlg=false;
	inherits(ret,Engine.defObj);
	var o3o;
	ret.prototype.init=function(){

		o3o=O3o.load(fieldpath,function(o3o){ });
		this.o3o=o3o;
	}
	ret.prototype.move=function(){
		var camera = Engine.camera;
		var obj = this;
		var phyObjs = obj.phyObjs;
		if(o3o.scenes.length===0){
			return;
		}
		if(!initFlg){
			if(Util.getLoadingCount() > 0){
				return;
			}
			var t=this;
			initFlg=true;

			ono3d.setTargetMatrix(0);
			ono3d.loadIdentity();

			var scene = o3o.scenes[0];

			Engine.skyTexture=scene.world.envTexture;

			//物理シミュオブジェクトの設定
			var instance = o3o.createInstance();
			this.instance =instance;
			o3o.scenes[0].setFrame(0); //アニメーション処理
			this.instance.calcMatrix(1.0/globalParam.fps,true);
			for(var i=0;i<this.instance.objectInstances.length;i++){
				var oi=this.instance.objectInstances[i];
				if(oi.phyObj){
					oi.phyObj.collision.groups=1|4;
				}
			}
			this.instance.joinPhyObj(onoPhy);


			var object = scene.objects.find(function(o){return o.name==="_border";});
			var collision= O3o.createCollision(object);
			Mat43.copy(collision.matrix,this.instance.objectInstances["_border"].matrix);
			collision.groups = 1;
			collision.callbackFunc=function(col1,col2,pos1,pos2){
				if(col2.name==="jiki"){
					//画面外侵入時
					//reset();
				}
			}
			t.collisions=[];
			t.collisions.push(collision);
			
			object = scene.objects.find(function(o){return o.name==="_goal";});
			collision= O3o.createCollision(object);
			collision.groups = 1;
			collision.callbackFunc=function(col1,col2,pos1,pos2){
				//if(!col2.parent)return;
				//if(col2.parent.name!=="jiki"){
				//	return;
				//}
				//onoPhy.collider.deleteCollision(col1);
				//if(stage<stages.length-1){
				//	objMan.createObj(GoMsg);
				//}else{
				//	objMan.createObj(GoMsg2);
				//}
			}
			t.collisions.push(collision);
			for(var i=0;i<t.collisions.length;i++){
				onoPhy.collider.addCollision(t.collisions[i]);
			}
			
			ono3d.environments_index=1;

			O3o.setEnvironments(scene); //光源セット

			var lightSource= null;

			lightSource = ono3d.environments[0].sun
			if(lightSource){
				camera.calcCollision(camera.cameracol2,lightSource.viewmatrix);
			}


			var objMan = this.scene.objMan;

			//カメラ反映等
			ono3d.push();
			Engine.go["jiki"]=objMan.createObj(Engine.goClass["jiki"]);
			ono3d.pop();
			var goCamera = Engine.go["camera"];
			Vec3.copy(camera.p,goCamera.p)
			Vec3.copy(camera.a,goCamera.a)
			Vec3.set(camera.a,0,Math.PI,0)


			//環境マップ
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			ono3d.environments[0].envTexture = ono3d.createEnv(null,0,0,0,Engine.drawSub);

			Engine.createSHcoeff(0,0,0,Engine.drawSub);
			var u8 = new Uint8Array(9*4);
			gl.readPixels(0, 0, 9, 1, gl.RGBA, gl.UNSIGNED_BYTE, u8);
			var ratio = 1/(255*16*16*Math.PI*4);
			var x = (i%7)*9;
			var y= (i/7|0);
			var ii = y*64+x;
			var shcoef=[];
			var d = new Vec4();
			for(var j=0;j<9;j++){
				d[0] = u8[(j)*4+0];
				d[1] = u8[(j)*4+1];
				d[2] = u8[(j)*4+2];
				d[3] = u8[(j)*4+3];
				var e = [0,0,0];//new Vec3();
				Ono3d.unpackFloat(e,d);
				e[0]=e[0]*ratio;
				e[1]=e[1]*ratio;
				e[2]=e[2]*ratio;
				shcoef.push(e);
			}
			SH.mulA(shcoef);


			ono3d.clear();
			ono3d.loadIdentity()
			ono3d.rf=0;
			this.move();
			this.draw2();
			//ono3d.render(camera.p);
			//ono3d.setStatic();

			//リフレクションプローブ処理
			var probs = new Collider();
			for(var i=0;i<scene.objects.length;i++){
				var object = scene.objects[i];
    			if(object.type!="LIGHT_PROBE"){ continue; }
				
				var collision= new Collider.Cuboid;
				Mat43.dotMat44Mat43(collision.matrix
						,ono3d.worldMatrix,this.instance.objectInstances[i].matrix);
				for(var i=0;i<9;i++){
					collision.matrix[i]*=object.data.distance;
				}
				collision.refresh();
				probs.addCollision(collision);

				//環境追加
				var environment=ono3d.environments[ono3d.environments_index]
				environment.collision=collision;
				ono3d.environments_index++;
				environment.name=object.name;
				environment.envTexture= ono3d.createEnv(null
						,collision.matrix[9]
						,collision.matrix[10]
						,collision.matrix[11]
						,Engine.drawSub);
				environment.sun=ono3d.environments[0].sun;
				environment.area=ono3d.environments[0].area;
			}
			probs.sortList();
			Engine.probs=probs;

			var lightprobe=instance.objectInstances["LightProbe"];
			if(lightprobe){
				if(lightprobe.object.data.shcoefs.length===0){
					lightprobe =null;
				}
			}
			if(lightprobe){

				var lightProbe = lightprobe.createLightProbe(true);
				ono3d.environments[0].lightProbe = lightProbe;
				//for(var i=0;i<8;i++){
				//	lightProbe.shcoefs.push(shcoef);
				//}

			}else{
				var points=[];
				var shcoefs=[];
				var MAX=1000;
				for(var i=0;i<8;i++){
					p=new Vec3();
					Vec3.set(p,((i&1)*2-1)*MAX,(((i&2)>>1)*2-1)*MAX,(((i&4)>>2)*2-1)*MAX);
					points.push(p);
				}
				for(var i=0;i<8;i++){
					shcoefs.push(shcoef);
				}
				var lightProbe = Engine.createLightProbe(points,shcoefs);
				ono3d.environments[0].lightProbe = lightProbe;

			}
			Engine.goClass["main"].reset();

		}
		
		 //変換マトリクス初期化
		ono3d.setTargetMatrix(0);
		ono3d.loadIdentity();

		var scene= o3o.scenes[0];
		scene.setFrame(this.t/60.0*24); //アニメーション処理
		this.instance.calcMatrix(1.0/globalParam.fps);

	}

	ret.prototype.draw2=function(){
		var instance=this.instance;

		ono3d.setTargetMatrix(0)
		ono3d.loadIdentity();

		ono3d.rf=0;

		var field = o3o;
		if(field){
			if(field.scenes.length>0){
				var objects = field.scenes[0].objects;

				for(var i=0;i<objects.length;i++){
					if(objects[i].hide_render
					|| !objects[i].static){
						continue;
					}
					var objectInstance= this.instance.objectInstances[objects[i].idx];

					var obj=objects[i];

					var env = null;
					obj.staticFaces=objectInstance.drawStatic(env);
					
				}
			}
		}
	}
	var cuboidcol = new Collider.Cuboid;
	ret.prototype.draw=function(){
		if(!this.instance){
			return;
		}

		ono3d.setTargetMatrix(0)
		ono3d.loadIdentity();


		var objects = this.instance.o3o.scenes[0].objects;
		for(var i=0;i<objects.length;i++){
			if(objects[i].hide_render){
				continue;
			}

			var instance = this.instance.objectInstances[objects[i].idx];
			instance.draw();
		}
		
	}
	return ret;
})();
