Engine.goClass["jiki"]= (function(){
	var ono3d = Engine.ono3d;
	var onoPhy=Engine.onoPhy;
	var groundNormal = new Vec3();
	var groundVelocity = new Vec3();
	var poJiki = null;
	var coJump = null;
	var obj3d;
	var motionT=0;
	var armature=null;
	var jiki =null;
	var human=null;
	var metalball=null;
	var jumpC;

	var GoJiki =function(){};
	var ret = GoJiki;
	inherits(ret,Engine.defObj);

	var hash=[];
	ret.prototype.init = function(){
		var obj = this;
		Vec4.fromRotVector(this.rotq,-Math.PI*0.5,1,0,0);

		var t=this;
		obj3d = AssetManager.o3o("human.o3o?7",function(obj3d){
			var o3o= obj3d;

			for(var i=0;i<obj3d.objects.length;i++){
				hash[obj3d.objects[i].name]=obj3d.objects[i];
			}

			armature=obj3d.objects.find(function(o){return o.name==="アーマチュア";});
			jiki =obj3d.objects.find(function(o){return o.name==="jiki";});
			metalball=obj3d.objects.find(function(o){return o.name==="metalball";});
			jumpC = obj3d.objects.find(function(o){return o.name === "_jumpCollision";});

			sourceArmature= new O3o.Pose(armature.data);
			referenceArmature= new O3o.Pose(armature.data);

			ono3d.setTargetMatrix(0);
			ono3d.loadIdentity();
			ono3d.translate(obj.p[0],obj.p[1],obj.p[2]);
			t.instance= o3o.createInstance();
			t.instance.joinPhyObj(onoPhy);

			jiki=t.instance.objectInstances[jiki.idx];


			t.collisions=[];
			t.collisions.push(O3o.createCollision(jumpC));
			jumpC=t.instance.objectInstances[jumpC.idx];

			t.collisions["preJump"]=O3o.createCollision(hash["_preJump"]);
			t.collisions["preJumpSpace"]=O3o.createCollision(hash["_preJumpSpace"]);

			for(var i=0;i<obj3d.objects.length;i++){
				t.instance.objectInstances[obj3d.objects[i].name]=t.instance.objectInstances[i];
			}

			poJiki = jiki.phyObj;
			Vec3.copy(poJiki.location,t.p);
			Mat33.set(poJiki.inertiaTensorBase,1,0,0,0,1,0,0,0,1);
			Mat33.mul(poJiki.inertiaTensorBase,poJiki.inertiaTensorBase,99999999);

			t.instance.calcMatrix(1.0/globalParam.fps,0,true);
			t.phyObj = poJiki;


			poJiki.collision.groups|=3;
			poJiki.collision.callbackFunc=function(col1,col2,pos1,pos2){
				if(col2.parent){
					//物理オブジェクトの場合
					var vec3 = Vec3.poolAlloc();
					Vec3.sub(vec3,pos2,pos1);
					Vec3.norm(vec3);
					if(vec3[1]>0.8){
						//垂直方向に接地した場合
						Vec3.copy(groundNormal,vec3);//接触法線
						//接触点速度
						var phyObj = col2.parent;
						phyObj.calcVelocity(groundVelocity,pos1);
						var vec32 = Vec3.poolAlloc();
						Vec3.sub(vec32,poJiki.v,groundVelocity);

						if(Vec3.dot(vec3,vec32)<0.1){
							t.ground=true;//接地フラグ
						}
						Vec3.poolFree(1);

					}
					Vec3.poolFree(1);
				}
			};
		});
	}
	ret.prototype.move=function(){
		if(obj3d.scenes.length===0){
			return;
		}
		Vec3.copy(this.p,poJiki.location);

		var vec = Vec3.poolAlloc();
		var mat43 = Mat43.poolAlloc();

		//歩行方向
		vec[0]=Engine.pad[0];
		vec[2]=Engine.pad[1];
		vec[1]=0;
		var l = Vec3.scalar(vec);
		Mat43.fromRotVector(mat43,Engine.camera.a[1]-Math.PI,0,1,0)
		Mat43.dotVec3(vec,mat43,vec);

		if(vec[0]*vec[0] + vec[2]*vec[2]){
			//歩行方向に向かせる
			var r = Math.atan2(vec[0],vec[2]);
			var q = Vec4.poolAlloc();
			Vec4.fromRotVector(this.rotq,r,0,1,0);
			Vec4.poolFree(1);
		}
		Vec4.copy(poJiki.rotq,this.rotq); //キャラの向きを物理オブジェクトに反映

		var v2 = Vec3.poolAlloc();
		if(this.ground){
			//接地時歩行させる
			//地面に並行な方向を算出
			Vec3.cross(vec,groundNormal,vec);
			Vec3.cross(vec,vec,groundNormal);
			Vec3.norm(vec);

			Vec3.mul(vec,vec,4*l);//加速力
			Vec3.sub(v2,poJiki.v,groundVelocity);//減速力
			Vec3.sub(v2,vec,v2);
			Vec3.mul(vec,v2,0.1);


		}else{
			Vec3.mul(vec,vec,0.05); //空気減速
		}
		Vec3.poolFree(1);

		vec[1]=0;
		var jump=false;

		if(this.ground){
			var jumpCollision= this.collisions.find(function(o){return o.name ==="_jumpCollision"});
			var onoPhy = Engine.onoPhy;
			if(jumpCollision ){
				Mat43.copy(jumpCollision.matrix,jumpC.matrix);
				jumpCollision.refresh();

				var list = onoPhy.collider.checkHitAll(jumpCollision);
				jump=true;
				for(var i=0;i<onoPhy.collider.hitListIndex;i++){
					if(list[i].col2.name !=="jiki"){
						jump=false;
						break;
					}
				}
			}
		//	{
		//		Mat43.copy(this.collisions["preJump"].matrix,this.instance.objectInstances["_preJump"].matrix);
		//		this.collisions["preJump"].refresh();

		//		var list = onoPhy.collider.checkHitAll(this.collisions["preJump"]);
		//		jump=false;
		//		for(var i=0;i<onoPhy.collider.hitListIndex;i++){
		//			if(list[i].col2.name !=="jiki"){
		//				jump=true;
		//			}
		//		}
		//	}
			if(Util.keyflag[4]==1 && !Util.keyflagOld[4]){
				jump=true;
			}
		}
		if(jump){
				//ジャンプ力
			vec[1]=5;
		}

		Vec3.add(poJiki.v,poJiki.v,vec);//加速力足す

		Mat43.poolFree(1);
		Vec3.poolFree(1);

		//歩行時アニメーションさせる
		var l = poJiki.v[0]*poJiki.v[0] + poJiki.v[2]*poJiki.v[2];
		if(l>0.1 && this.ground){
			motionT+=16;
		}	

		this.ground=false;//接地フラグリセット
	}
	var col = new Collider.Sphere();
	col.bold=1
	
	ret.prototype.draw=function(){

		ono3d.setTargetMatrix(0)
		ono3d.loadIdentity();
		//ono3d.rotate(-Math.PI*0.5,1,0,0)

		ono3d.rf=0;
		ono3d.lineWidth=1.2;
		ono3d.rf|=Ono3d.RF_OUTLINE;
		if(obj3d.scenes.length){

			var oldT = motionT/1000;
			var T = motionT/1000;
			var d = (T|0) - (oldT|0)

			var dst = armature.pose;
			sourceArmature.reset();
			referenceArmature.reset();

			sourceArmature.setAction(obj3d.actions[1],motionT/1000.0*24);
			referenceArmature.setAction(obj3d.actions[2],motionT/1000.0*24);
		
			var vec3 = Vec3.poolAlloc();
			Vec3.set(vec3,0,0,0);
			if(this.ground){
				var vec4 = Vec4.poolAlloc();
				Vec4.qmul(vec4,poJiki.rotq,-1);
				Vec3.sub(vec3,poJiki.v,groundVelocity);
				Vec4.rotVec3(vec3,vec4,vec3);
				Vec4.poolFree(1);
			}



			dst.setAction(obj3d.actions[0],0);
			O3o.Pose.sub(sourceArmature,sourceArmature,dst);
			O3o.Pose.sub(referenceArmature,referenceArmature,dst);
			O3o.Pose.mul(sourceArmature,sourceArmature,vec3[2]*0.3);
			O3o.Pose.mul(referenceArmature,referenceArmature,vec3[0]*0.3);
			O3o.Pose.add(dst,referenceArmature,dst);
			O3o.Pose.add(dst,sourceArmature,dst);

			this.instance.calcMatrix(1.0/globalParam.fps);

			Vec3.poolFree(1);
			ono3d.setTargetMatrix(0);

			ono3d.loadIdentity();
			var m = Mat43.poolAlloc();


			Mat43.copy(col.matrix,poJiki.matrix);
			col.refresh();

			var l = Engine.probs.checkHitAll(col);

			var env = null;
			var env2 = null;
			var a = 0;
			if(Engine.probs.hitListIndex>0){
				var ans1 = Vec3.poolAlloc();
				var ans2 = Vec3.poolAlloc();
				a = Collider.calcClosest(ans1,ans2,l[0].col1,l[0].col2);
				a = Math.min(-a,1.0);
				var env=ono3d.environments[0];
				var env2=ono3d.environments[1];
				Vec3.poolFree(2);
			}else{
			}
			var objects = this.instance.o3o.scenes[0].objects;
			for(var i=0;i<objects.length;i++){
//				if(objects[i].hide_render){
//					continue;
//				}

				var instance = this.instance.objectInstances[objects[i].idx];
				instance.draw(env,env2,a);
			}

			


			//jumpC.draw(env);
			Mat43.poolFree(1);

		}
	}
	return ret;
	//return defObj(obj,msg,param);
})();
