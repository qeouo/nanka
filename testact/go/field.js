Engine.goClass["field"]= (function(){
	var ono3d = Engine.ono3d;
	var onoPhy=Engine.onoPhy;
	var objMan=Engine.objMan;
	var fieldpath="f1.o3o?4";
	var GoField =function(){};
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
			this.instance = o3o.createInstance();
			this.instance.joinPhyObj(onoPhy);


			var object = scene.objects.find(function(o){return o.name==="_border";});
			var collision= O3o.createCollision(object);
			collision.groups = 1;
			collision.callbackFunc=function(col1,col2,pos1,pos2){
				if(col2.name==="jiki"){
					//画面外侵入時
					reset();
				}
			}
			t.collisions=[];
			t.collisions.push(collision);
			
			object = scene.objects.find(function(o){return o.name==="_goal";});
			collision= O3o.createCollision(object);
			collision.groups = 1;
			collision.callbackFunc=function(col1,col2,pos1,pos2){
				if(!col2.parent)return;
				if(col2.parent.name!=="jiki"){
					return;
				}
				onoPhy.collider.deleteCollision(col1);
				if(stage<stages.length-1){
					objMan.createObj(GoMsg);
				}else{
					objMan.createObj(GoMsg2);
				}
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


			//0番目の光源セットをコントロールに反映
			var env = ono3d.environments[0];
			for(var i=0;i<2;i++){
				var ol = [env.sun,env.area][i];
				var el = document.getElementById("lightColor"+(i+1));
				el.value = Util.rgb(ol.color[0],ol.color[1],ol.color[2]).slice(1);
				Util.fireEvent(el,"change");
			}


			//カメラ反映等
			ono3d.push();
			Engine.go["jiki"]=objMan.createObj(Engine.goClass["jiki"]);
			ono3d.pop();
			var goCamera = Engine.go["camera"];
			Vec3.copy(camera.p,goCamera.p)
			Vec3.copy(camera.a,goCamera.a)
			Vec3.set(camera.a,0,Math.PI,0)


			ono3d.clear();
			var envTexture = ono3d.createEnv(null,0,0,0,Engine.drawSub);
			ono3d.environments[0].envTexture=envTexture;


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



			var lightprobe=o3o.objects.find(function(e){return e.name==="LightProbe"});
			if(lightprobe){
				lightprobe=lightprobe.data;


				var points=[];
				for(var i=0;i<lightprobe.vertices.length;i++){
					var p=new Vec3();
					Mat44.dotVec3(p,ono3d.worldMatrix,lightprobe.vertices[i].pos);
					points.push(p);

				}
				
				var triangles = Delaunay.create(points);
				var bspTree=Bsp.createBspTree(triangles);
			}


			for(var i=0;i<ono3d.environments_index;i++){
				var env = ono3d.environments[i];

				env.lightProbe=scene.world.lightProbe;

				env.bspTree=bspTree;
				env.lightProbeMesh=lightprobe;
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
