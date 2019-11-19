Engine.goClass["jiki"]= (function(){
	var ono3d = Engine.ono3d;
	var onoPhy=Engine.onoPhy;
	var groundNormal = new Vec3();
	var groundVelocity = new Vec3();
	var wallNormal= new Vec3();
	var poJiki = null;
	var o3o;
	var pattern={};

	var GoJiki =function(){};
	var ret = GoJiki;
	inherits(ret,Engine.defObj);

	ret.prototype.init = function(){
		var obj = this;
		Vec4.fromRotVector(this.rotq,-Math.PI*0.5,1,0,0);
		this.pattern=0;
		this.patternT=0;
		this.motionT=0;
		this.matrix=new Mat43();

		var t=this;
		o3o = AssetManager.o3o("human.o3o?a1",function(o3o){

			var armature=o3o.objects["アーマチュア"];

			sourceArmature= new O3o.Pose(armature.data);
			referenceArmature= new O3o.Pose(armature.data);

			ono3d.setTargetMatrix(0);
			ono3d.loadIdentity();
			ono3d.translate(obj.p[0],obj.p[1],obj.p[2]);
			t.instance= o3o.createInstance();
			t.instance.joinPhyObj(onoPhy);

			o3o.objects["jiki"].rigid_body.type="ACTIVE";

			poJiki = t.instance.objectInstances["jiki"].phyObj;
			poJiki.fix=false;
			poJiki.mass=o3o.objects["jiki"].rigid_body.mass;
			poJiki.refreshInertia();
			poJiki.collision.groups=3;
			Vec3.copy(poJiki.location,t.p);
			Mat33.set(poJiki.inertiaTensorBase,1,0,0,0,1,0,0,0,1);
			Mat33.mul(poJiki.inertiaTensorBase,poJiki.inertiaTensorBase,99999999);

			t.instance.calcMatrix(1.0/globalParam.fps,0,true);


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

					if(Math.abs(vec3[1])<0.4){
						//水平方向(壁)に接触した場合
						Vec3.copy(wallNormal,vec3);//接触法線
						t.wall=true;//接地フラグ
					}
					Vec3.poolFree(1);
				}
			};
		});
	}
	ret.prototype.move=function(){
		if(o3o.scenes.length===0){
			return;
		}
		var oInstances= this.instance.objectInstances;
		Vec3.copy(this.p,poJiki.location);

		var vec = Vec3.poolAlloc();
		var pad2= Vec3.poolAlloc();
		var mat43 = Mat43.poolAlloc();

		//歩行方向
		vec[0]=Engine.pad[0];
		vec[2]=Engine.pad[1];
		vec[1]=0;
		var l = Vec3.scalar(vec);
		Mat43.fromRotVector(mat43,Engine.camera.a[1]-Math.PI,0,1,0)
		Mat43.dotVec3(vec,mat43,vec);
		Vec3.copy(pad2,vec);

		var armature=o3o.objects["アーマチュア"];
		var dst = armature.pose;

		ono3d.setTargetMatrix(0);
		ono3d.loadIdentity();

		var v2 = Vec3.poolAlloc();
		switch(this.pattern){
		case 0://歩き
			o3o.objects["jiki"].rigid_body.type="ACTIVE";
			poJiki.fix=false;

			sourceArmature.reset();
			referenceArmature.reset();

			
			var vec3 = Vec3.poolAlloc();
			Vec3.set(vec3,0,0,0);
			var vec4 = Vec4.poolAlloc();
			Vec4.qmul(vec4,poJiki.rotq,-1);
			Vec3.sub(vec3,poJiki.v,groundVelocity);
			Vec4.rotVec3(vec3,vec4,vec3);
			Vec4.poolFree(1);

			sourceArmature.setAction(o3o.actions[1],this.motionT/1000.0*24);
			referenceArmature.setAction(o3o.actions[2],this.motionT/1000.0*24);

			dst.setAction(o3o.actions[0],0);
			O3o.Pose.sub(sourceArmature,sourceArmature,dst);
			O3o.Pose.sub(referenceArmature,referenceArmature,dst);
			O3o.Pose.mul(sourceArmature,sourceArmature,vec3[2]*0.3); //前後移動
			O3o.Pose.mul(referenceArmature,referenceArmature,vec3[0]*0.3);//横移動
			O3o.Pose.add(dst,referenceArmature,dst);
			O3o.Pose.add(dst,sourceArmature,dst);

			this.instance.calcMatrix(1.0/globalParam.fps);
			Vec3.poolFree(1);


			if(this.ground){

			if(vec[0]*vec[0] + vec[2]*vec[2] && Vec3.scalar(pad2)){
				//歩行方向に向かせる
				var r = Math.atan2(vec[0],vec[2]);
				var q = Vec4.poolAlloc();
				Vec4.fromRotVector(poJiki.rotq,r,0,1,0);
				Vec4.poolFree(1);
			}

			//Vec4.copy(poJiki.rotq,this.rotq); //キャラの向きを物理オブジェクトに反映

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

			vec[1]=0;
			var jump=false;

			if(this.ground){
				if(this.wall){
					if(Vec3.dot(pad2,wallNormal)<-0.8){
						jump=true;
					}

				}
				var oInstances= this.instance.objectInstances;
				var jumpC=oInstances["_jumpCollision"];
				if(jumpC){
					var list = jumpC.hitCheck(onoPhy.collider,4);
					if(onoPhy.collider.hitListIndex===0){
						jump=true;
					}
				}
				{
					oInstances["_preJumpA"].hitCheck(onoPhy.collider,4);
					var a = onoPhy.collider.hitListIndex;
					oInstances["_preJumpB"].hitCheck(onoPhy.collider,4);
					var b = onoPhy.collider.hitListIndex;
					oInstances["_preJumpC"].hitCheck(onoPhy.collider,4);
					var c = onoPhy.collider.hitListIndex;
					if(a ===0 && b ===0 && c>0){
						jump=true;
					}
					
				}
				if(Util.keyflag[4]==1 && !Util.keyflagOld[4]){
					jump=true;
				}
			}else{
				var oInstances= this.instance.objectInstances;

				if(this.grapcount>0){
					this.grapcount--;
				}else{
					var collision=oInstances["_wallJump"].getTempCollision(4);
					var aa=Vec3();
					Vec3.set(aa,0,-1,0);
					onoPhy.collider.convexCastAll(collision,aa);

					for(var i=0;i<onoPhy.collider.hitListIndex;i++){
						var len = onoPhy.collider.hitList[i].len;
						if(len>0.1 && len<0.2 && poJiki.v[1]<0){
							this.pattern=1;
							this.patternT=0;
							//崖つかみ状態へ移行

						}
					}
				}
			}
			if(jump){
				//ジャンプ力
				vec[1]=3.5;
			}

			//歩行時アニメーションさせる
			var l = poJiki.v[0]*poJiki.v[0] + poJiki.v[2]*poJiki.v[2];
			if(l>0.1 && this.ground){
				this.motionT+=16;
			}	

			Vec3.add(poJiki.v,poJiki.v,vec);//加速力足す
			break;
		case 2://崖のぼり　
			var frame = this.patternT/60*24;
			dst.setAction(o3o.actions["climb"],frame);
			O3o.addaction(o3o.objects["jiki"],"",o3o.actions["climb_idou"],frame);
			if(this.patternT==1){
				Mat43.copy(this.matrix,poJiki.matrix);
				o3o.objects["jiki"].rigid_body.type="PASSIVE";
				poJiki.fix=true;
				this.instance.calcMatrix(1.0/globalParam.fps);
				Mat43.getInv(oInstances["jiki"].matrix,oInstances["jiki"].matrix);
				Mat43.dot(this.matrix,this.matrix,oInstances["jiki"].matrix);
			}

			ono3d.loadIdentity();
			Mat44.copyMat43(ono3d.worldMatrix,this.matrix);
			this.instance.calcMatrix(1.0/globalParam.fps);

			if(this.patternT>58){
				this.pattern=0;
			}
			break;
		case 1://崖つかみ
			var collision=oInstances["_wallJump"].getTempCollision(4);

			dst.setAction(o3o.actions["climb_side"],this.motionT/1000*24);
			O3o.addaction(o3o.objects["jiki"],"",o3o.actions["climb_idou"],0);
			this.instance.calcMatrix(1.0/globalParam.fps);

			var aa=Vec3();
			Vec3.set(aa,0,-1,0);
			onoPhy.collider.convexCastAll(collision,aa);

			var len=-1;

			this.pattern=0;
			var len2=0;
			for(var i=0;i<onoPhy.collider.hitListIndex;i++){
				len = onoPhy.collider.hitList[i].len;
				if(len>-0 && len<=0.2 && poJiki.v[1]<=0){
					len2=len;
					this.pattern=1;
					//崖つかみ状態を維持

				}
			}
			if(this.pattern!==1){
				//崖つかみ解除
				break;
			}
			poJiki.location[1]+=0.15-len2;
			poJiki.v[1]=0;


			var z=new Vec3();

			Vec3.set(aa,poJiki.matrix[6],poJiki.matrix[7],poJiki.matrix[8]);
			Vec3.norm(aa);
			collision=poJiki.collision;

			onoPhy.collider.convexCastAll(collision,aa);
			var hitList =onoPhy.collider.hitList;
			var min=9999;
			for(var j=0;j<onoPhy.collider.hitListIndex;j++){
				if(hitList[j].len<-1)continue;
				if( hitList[j].len<min){
					min=hitList[j].len;
					Vec3.set(z,hitList[j].pos1[0],hitList[j].pos1[1],hitList[j].pos1[2]);
				}
			}
			if(min<1){
				Vec3.norm(z);
				if(min>0 && min<1){
					Vec3.madd(poJiki.location,poJiki.location,z,-min);
				}
				Vec3.madd(poJiki.v,poJiki.v,z,-Vec3.dot(z,poJiki.v));
				Mat43.fromLSR(poJiki.matrix,poJiki.location,poJiki.scale,poJiki.rotq);
			}

			var r = Math.atan2(z[0],z[2])+Math.PI;
			Vec4.fromRotVector(poJiki.rotq,r,0,1,0);

			var m=poJiki.matrix;
			var sideV = new Vec3();
			Vec3.set(sideV,m[0],m[1],m[2]);
			Vec3.norm(sideV);
			var side = Vec3.dot(sideV,pad2);
			if(Math.abs(side)>0.7){
				if(side<0){
					side=-1;
				}else{
					side=1;
				}
				this.motionT+=16;
					
				side*=0.5;
				Vec3.mul(poJiki.v,sideV,side);
			}else{
				Vec3.madd(poJiki.v,poJiki.v,sideV,-Vec3.dot(sideV,poJiki.v));
			}

			var sideV = new Vec3();
			Vec3.set(sideV,m[6],m[7],m[8]);
			Vec3.norm(sideV);
			if(Vec3.dot(sideV,pad2)<-0.9){
				this.pattern=0;
				this.grapcount=10;
				break;
			}
			if(Vec3.dot(sideV,pad2)>0.9 && this.patternT>4){
				//崖上りに遷移
				this.pattern=2;
				this.patternT=0;
				break;
			}

			



			//Vec3.add(o3o.objects["jiki"].location,this.v,o3o.objects["jiki"].location);

			ono3d.setTargetMatrix(0);
			//Mat44.copyMat43(ono3d.worldMatrix,this.matrix);

			this.instance.calcMatrix(1.0/globalParam.fps);
			poJiki.v[1]=0;
			ono3d.loadIdentity();

		}


		Mat43.poolFree(1);
		Vec3.poolFree(3);


		this.ground=false;//接地フラグリセット
		this.wall=false;//接地フラグリセット

		this.patternT++;


	}
	var col = new Collider.Sphere();
	col.bold=1
	
	ret.prototype.draw=function(){
		if(!this.instance){
			return;
		}

		ono3d.setTargetMatrix(0)
		ono3d.loadIdentity();

		ono3d.rf=0;
		ono3d.lineWidth=1.2;
		ono3d.rf|=Ono3d.RF_OUTLINE;

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

		var objects = this.instance.o3o.objects;
		for(var i=0;i<objects.length;i++){
			if(objects[i].hide_render){
				continue;
			}
			var instance = this.instance.objectInstances[i];
			instance.draw(env,env2,a);
		}

	}
	return ret;
	//return defObj(obj,msg,param);
})();
