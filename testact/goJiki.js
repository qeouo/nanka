	var GoJiki = (function(){
		var groundNormal = new Vec3();
		var groundVelocity = new Vec3();
		var obj3d;
		var ono3d = Testact.ono3d;
		var motionT=0;
		var GoJiki =function(){
		};
		var ret = GoJiki;
		inherits(ret,defObj);

		ret.prototype.init = function(){
			var obj = this;

			var t=this;
			obj3d = Testact.assetload(obj3d,"human.o3o",function(obj3d){
				var o3o= obj3d;
				for(var i=0;i<obj3d.objects.length;i++){
					var object=obj3d.objects[i];
				}

				sourceArmature= new O3o.PoseArmature(obj3d.objectsN["アーマチュア"].data);
				referenceArmature= new O3o.PoseArmature(obj3d.objectsN["アーマチュア"].data);

				ono3d.setTargetMatrix(0);
				ono3d.loadIdentity();
				ono3d.rotate(-Math.PI*0.5,1,0,0) //blenderはzが上なのでyが上になるように補正
				ono3d.translate(obj.p[0],obj.p[1],obj.p[2]);
				t.phyObjs= O3o.createPhyObjs(o3o.scenes[0],Testact.onoPhy);
				var phyObj = t.phyObjs[0];
				Vec3.copy(phyObj.location,t.p);
				Mat33.set(phyObj.inertiaTensorBase,1,0,0,0,1,0,0,0,1);
				Mat33.mul(phyObj.inertiaTensorBase,phyObj.inertiaTensorBase,99999999);

				phyObj.collision.groups|=3;
				phyObj.collision.callbackFunc=function(col1,col2,pos1,pos2){
					if(col2.name==="border"){
						reset();
						return;
					}
					if(!col2.parent){
						return;
					}
					var vec3 = Vec3.poolAlloc();
					Vec3.sub(vec3,pos2,pos1);
					Vec3.norm(vec3);
					if(vec3[1]>0.8){
						t.ground=true;//接地フラグ
						Vec3.copy(groundNormal,vec3);//接触点角度
						//接触点速度
						var phyObj = col2.parent;
						phyObj.calcVelocity(groundVelocity,pos1);

					}
					Vec3.poolFree(1);
				};
			});
			Vec4.fromRotVector(this.rotq,-Math.PI*0.5,1,0,0);
		}
		ret.prototype.move=function(){
			var obj = this;
			if(obj3d.scenes.length===0){
				return;
			}
			var phyObj = this.phyObjs[0];
			Vec3.copy(this.p,phyObj.location);

			var vec = Vec3.poolAlloc();
			var mat43 = Mat43.poolAlloc();
			vec[0]=Testact.pad[0];
			vec[2]=Testact.pad[1];
			vec[1]=0;
			var l = Vec3.scalar(vec);
			Mat43.fromRotVector(mat43,Testact.camera.a[1]-Math.PI,0,1,0)
			Mat43.dotVec3(vec,mat43,vec);

			if(vec[0]*vec[0] + vec[2]*vec[2]){
				var r = Math.atan2(vec[0],vec[2]);
				var q = Vec4.poolAlloc();
				Vec4.fromRotVector(this.rotq,-Math.PI*0.5,1,0,0);
				Vec4.fromRotVector(q,r,0,1,0);
				Vec4.qdot(this.rotq,q,this.rotq);
				Vec4.poolFree(1);
			}
			Vec4.copy(phyObj.rotq,this.rotq);

			var v2 = Vec3.poolAlloc();
			if(this.ground){
				Vec3.cross(vec,groundNormal,vec);
				Vec3.cross(vec,vec,groundNormal);
				Vec3.norm(vec);

				Vec3.mul(vec,vec,4*l);
				Vec3.sub(v2,phyObj.v,groundVelocity);
				Vec3.sub(v2,vec,v2);
				Vec3.mul(vec,v2,0.1);


			}else{
				Vec3.mul(vec,vec,0.05);
			}
			Vec3.poolFree(1);
			vec[1]=0;

			if(Util.keyflag[4]==1 && !Util.keyflagOld[4] && this.ground){
				vec[1]=6;
			}
			Vec3.add(phyObj.v,phyObj.v,vec);

			Mat43.poolFree(1);
			Vec3.poolFree(1);


			var l = phyObj.v[0]*phyObj.v[0] + phyObj.v[2]*phyObj.v[2];
			if(l>0.1 && this.ground){
				motionT+=16;
			}	

			this.ground=false;//接地フラグ
		}
		ret.prototype.draw=function(){

			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity();
			ono3d.rotate(-Math.PI*0.5,1,0,0)

			ono3d.rf=0;
			ono3d.lineWidth=1.2;
			ono3d.rf|=Ono3d.RF_OUTLINE;
			if(obj3d.scenes.length){
				var phyObj = this.phyObjs[0];

				var oldT = motionT/1000;
				var T = motionT/1000;
				var d = (T|0) - (oldT|0)

				var dst = obj3d.objectsN["アーマチュア"].poseArmature;
				sourceArmature.reset();
				referenceArmature.reset();

				sourceArmature.setAction(obj3d.actions[1],motionT/1000.0*24);
				referenceArmature.setAction(obj3d.actions[2],motionT/1000.0*24);
			
				var vec3 = Vec3.poolAlloc();
				Vec3.set(vec3,0,0,0);
				if(this.ground){
					var vec4 = Vec4.poolAlloc();
					Vec4.qmul(vec4,phyObj.rotq,-1);
					Vec3.sub(vec3,phyObj.v,groundVelocity);
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
				Mat43.fromLSR(m,phyObj.location,phyObj.scale,phyObj.rotq);
				Mat44.dotMat43(ono3d.worldMatrix,ono3d.worldMatrix,m);


				var e =obj3d.objectsN["jiki"];
				Mat43.getInv(m,e.mixedmatrix);
				Mat44.dotMat43(ono3d.worldMatrix,ono3d.worldMatrix,m);
				O3o.drawObject(obj3d.objectsN["human"]);
				Mat43.poolFree(1);

			}
		}
		return ret;
		//return defObj(obj,msg,param);
	})();
