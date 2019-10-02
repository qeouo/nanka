Engine.goClass.field= (function(){
	var ono3d = Engine.ono3d;
	var onoPhy=Engine.onoPhy;
	var objMan=Engine.objMan;
	var fieldpath="f1.o3o";
	var GoField =function(){};
	var ret = GoField;
	var initFlg=false;
	inherits(ret,Engine.defObj);
	ret.prototype.init=function(){

		Engine.field =O3o.load(globalParam.model,function(o3o){

		});
	}
	ret.prototype.move=function(){
		var obj3d=Engine.field;
		var obj = this;
		var phyObjs = obj.phyObjs;
		if(obj3d.scenes.length===0){
			return;
		}
		
		 //変換マトリクス初期化
		ono3d.setTargetMatrix(0);
		ono3d.loadIdentity();

		var scene= obj3d.scenes[0];
		O3o.setFrame(obj3d,scene,this.t/60.0*60.0); //アニメーション処理



		if(phyObjs && globalParam.physics){
			//物理シミュ有効の場合は物理オブジェクトにアニメーション結果を反映させる
			for(var i=0;i<phyObjs.length;i++){
				var phyObj = phyObjs[i];
				//物理オブジェクトにアニメーション結果を反映
				//(前回の物理シミュ無効の場合は強制反映する)
				O3o.movePhyObj(phyObj,phyObj.parent
					,1.0/globalParam.fps
					,!globalParam.physics_);
			}
		}

		//特殊
		var phyObj = phyObjs.find(function(o){return o.name==="convexhull";});
		if(phyObj){
			var v=new Vec3(0,-1,0);
			phyObj.refreshCollision();
			var nearest=999999;
			var target=null;
			for(var i=0;i<phyObjs.length;i++){
				if(phyObj === phyObjs[i]){
					continue;
				}
				if(!phyObjs[i].collision){
					continue;
				}
			phyObjs[i].refreshCollision();
				if(!AABB.aabbCast(v,phyObj.collision.aabb,phyObjs[i].collision.aabb)){
					continue;
				}
				var a=Collider.convexCast(v,phyObj.collision,phyObjs[i].collision);
				if(a>0 && a<nearest){
					nearest=a;
					target=phyObjs[i];
				}
			}
			if(target){
				Vec3.madd(phyObj.location,phyObj.location,v,nearest);
				//phyObj.calcPre();
			}
		}


		for(var i=0;i<phyObjs.length;i++){
			var phyObj = phyObjs[i];
			var aabb;
			if(phyObj.type===OnoPhy.CLOTH){
				aabb = phyObj.aabb;
			}else{
				aabb = phyObj.collision.aabb;
			}
			if(aabb.max[1]<-10){
				O3o.movePhyObj(phyObj,phyObj.parent,0,true);
			}
		}
	}
	var cuboidcol = new Collider.Cuboid;
	var col = new Collider.Sphere();

	ret.prototype.draw2=function(){
		var phyObjs = this.phyObjs;

		ono3d.setTargetMatrix(0)
		ono3d.loadIdentity();

		ono3d.rf=0;

		var field = Engine.field;
		if(field){
			if(field.scenes.length>0){
				var objects = field.scenes[0].objects;
				for(var i=0;i<objects.length;i++){
					if(objects[i].hide_render
					|| !objects[i].static){
						continue;
					}

					var obj=objects[i];

					var env = null;
					obj.staticFaces=O3o.drawObjectStatic(obj,null,env);
					
				}
			}
		}
	}
	ret.prototype.draw=function(){
		var phyObjs = this.phyObjs;

		ono3d.setTargetMatrix(0)
		ono3d.loadIdentity();
		//ono3d.rotate(-Math.PI*0.5,1,0,0)

		ono3d.rf=0;
		var field=Engine.field;
		var camera=Engine.camera;

		var m43 = Mat43.poolAlloc();
		if(field){
			if(field.scenes.length>0){
				var objects = field.scenes[0].objects;
				for(var i=0;i<objects.length;i++){
					if(objects[i].hide_render){
						continue;
					}
					if(objects[i].staticFaces){
						O3o.drawStaticFaces(objects[i].staticFaces);
						continue;
					}
					var b =objects[i].bound_box;
					Mat43.setInit(m43);
					m43[0]=(b[3] - b[0])*0.5;
					m43[4]=(b[4] - b[1])*0.5;
					m43[8]=(b[5] - b[2])*0.5;
					m43[9]=b[0]+m43[0];
					m43[10]=b[1]+m43[4];
					m43[11]=b[2]+m43[8];
					var phyObj = null;
					if(globalParam.physics){
						phyObj= phyObjs.find(function(a){return a.name===this;},objects[i].name);
					}

					var obj=objects[i];

					if(phyObj){
						Mat43.dot(cuboidcol.matrix,phyObj.matrix,m43);
					}else{
						Mat43.dot(m43,objects[i].mixedmatrix,m43);
						Mat43.dotMat44Mat43(cuboidcol.matrix,ono3d.worldMatrix,m43);
					}
					cuboidcol.refresh();
					var l = 1;
					if(AABB.hitCheck(camera.cameracol.aabb,cuboidcol.aabb)){
						//l=-1;
						l = Collider.checkHit(camera.cameracol,cuboidcol);
					}
					var l2 = 1;
					if(globalParam.shadow){
						if(AABB.hitCheck(camera.cameracol2.aabb,cuboidcol.aabb)){
							//l2=-1;
							l2 = Collider.checkHit(camera.cameracol2,cuboidcol);
						}
					}
					if(l>0 && l2>0){
						continue;
					}
					ono3d.rf&=~Ono3d.RF_OUTLINE;
					if(globalParam.outline_bold){
						ono3d.lineWidth=globalParam.outline_bold;
						ono3d.rf|=Ono3d.RF_OUTLINE;
						Util.hex2rgb(ono3d.lineColor,globalParam.outline_color);
					}

					var bane = Engine.go.main.bane;
					if(bane){
						if(bane.con2.name == objects[i].name){
							ono3d.lineWidth=1;
							ono3d.rf|=Ono3d.RF_OUTLINE;
							Vec4.set(ono3d.lineColor,1,4,1,0);
						}
					}

					Mat43.setInit(col.matrix);
					Mat43.mul(col.matrix,col.matrix,0);
					col.matrix[9]=objects[i].location[0];
					col.matrix[10]=objects[i].location[2];
					col.matrix[11]=-objects[i].location[1];
					col.refresh();


					var probs = Engine.probs;
					var l =probs.checkHitAll(col)
					var env = null;
					if(probs.hitListIndex>0){
						env = ono3d.environments[1];
					}
					if(globalParam.physics){
						O3o.drawObject(objects[i],phyObjs,env);
					}else{
						O3o.drawObject(objects[i],null,env);
					}
				}
			}
		}
		Mat43.poolFree(1);
	}
	return ret;
})();
