	var GoJiki = (function(){
		var ono3d = Testact.ono3d;
		var groundNormal = new Vec3();
		var groundVelocity = new Vec3();
		var poJiki = null;
		var coJump = null;
		var obj3d;
		var motionT=0;
		var armature=null;
		var e =null;
		var human=null;
		var jumpC;

		var GoJiki =function(){};
		var ret = GoJiki;
		inherits(ret,defObj);

		ret.prototype.init = function(){
			var obj = this;
			Vec4.fromRotVector(this.rotq,-Math.PI*0.5,1,0,0);

			var t=this;
			obj3d = Testact.assetload(obj3d,"human.o3o",function(obj3d){
				var o3o= obj3d;
				for(var i=0;i<obj3d.objects.length;i++){
					var object=obj3d.objects[i];
				}

				armature=obj3d.objects.find(function(o){return o.name==="アーマチュア";});
				e =obj3d.objects.find(function(o){return o.name==="jiki";});
				human=obj3d.objects.find(function(o){return o.name==="human";});
				jumpC = obj3d.objects.find(function(o){return o.name === "_jumpCollision";});

				sourceArmature= new O3o.PoseArmature(armature.data);
				referenceArmature= new O3o.PoseArmature(armature.data);

				ono3d.setTargetMatrix(0);
				ono3d.loadIdentity();
				ono3d.rotate(-Math.PI*0.5,1,0,0) //blenderはzが上なのでyが上になるように補正
				ono3d.translate(obj.p[0],obj.p[1],obj.p[2]);
				t.phyObjs= O3o.createPhyObjs(o3o.scenes[0],Testact.onoPhy);
				t.collisions= O3o.createCollisions(o3o.scenes[0]);
				poJiki = t.phyObjs.find(function(o){return o.name ==="jiki"});
				Vec3.copy(poJiki.location,t.p);
				Mat33.set(poJiki.inertiaTensorBase,1,0,0,0,1,0,0,0,1);
				Mat33.mul(poJiki.inertiaTensorBase,poJiki.inertiaTensorBase,99999999);

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
			vec[0]=Testact.pad[0];
			vec[2]=Testact.pad[1];
			vec[1]=0;
			var l = Vec3.scalar(vec);
			Mat43.fromRotVector(mat43,Testact.camera.a[1]-Math.PI,0,1,0)
			Mat43.dotVec3(vec,mat43,vec);

			if(vec[0]*vec[0] + vec[2]*vec[2]){
				//歩行方向に向かせる
				var r = Math.atan2(vec[0],vec[2]);
				var q = Vec4.poolAlloc();
				Vec4.fromRotVector(this.rotq,-Math.PI*0.5,1,0,0);
				Vec4.fromRotVector(q,r,0,1,0);
				Vec4.qdot(this.rotq,q,this.rotq);
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
				if(jumpCollision){

					var m = Mat43.poolAlloc();
					ono3d.setTargetMatrix(0)
					ono3d.loadIdentity();
					Mat43.fromLSR(m,poJiki.location,poJiki.scale,poJiki.rotq);
					Mat44.dotMat43(ono3d.worldMatrix,ono3d.worldMatrix,m);

					Mat43.getInv(m,e.mixedmatrix);
					Mat44.dotMat43(ono3d.worldMatrix,ono3d.worldMatrix,m);
					Mat43.poolFree(1);

					O3o.moveCollision(jumpCollision,jumpC,ono3d)
					var onoPhy = Testact.onoPhy;
					var list = onoPhy.collider.checkHitAll(jumpCollision);
					jump=true;
					for(var i=0;i<onoPhy.collider.hitListIndex;i++){
						if(list[i].col2.name !=="jiki"){
							jump=false;
						}
					}
				}
				if(Util.keyflag[4]==1 && !Util.keyflagOld[4]){
					jump=true;
				}
			}
			if(jump){
					//ジャンプ力
				vec[1]=6;
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
		ret.prototype.draw=function(){

			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity();
			ono3d.rotate(-Math.PI*0.5,1,0,0)

			ono3d.rf=0;
			ono3d.lineWidth=1.2;
			ono3d.rf|=Ono3d.RF_OUTLINE;
			if(obj3d.scenes.length){

				var oldT = motionT/1000;
				var T = motionT/1000;
				var d = (T|0) - (oldT|0)

				var dst = armature.poseArmature;
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
				O3o.PoseArmature.sub(sourceArmature,sourceArmature,dst);
				O3o.PoseArmature.sub(referenceArmature,referenceArmature,dst);
				O3o.PoseArmature.mul(sourceArmature,sourceArmature,vec3[1]*0.3);
				O3o.PoseArmature.mul(referenceArmature,referenceArmature,vec3[0]*0.3);
				O3o.PoseArmature.add(dst,referenceArmature,dst);
				O3o.PoseArmature.add(dst,sourceArmature,dst);

				Vec3.poolFree(1);

				ono3d.loadIdentity();
				var m = Mat43.poolAlloc();
				Mat43.fromLSR(m,poJiki.location,poJiki.scale,poJiki.rotq);
				Mat44.dotMat43(ono3d.worldMatrix,ono3d.worldMatrix,m);


				Mat43.getInv(m,e.mixedmatrix);
				Mat44.dotMat43(ono3d.worldMatrix,ono3d.worldMatrix,m);
				O3o.drawObject(human);
	//			O3o.drawObject(e);
				O3o.drawObject(jumpC);
				Mat43.poolFree(1);

			}
		}
		return ret;
		//return defObj(obj,msg,param);
	})();
