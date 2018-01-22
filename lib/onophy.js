"use strict"
var OnoPhy = (function(){

	var DIMENSION=3; //次元
	var GRAVITY = 9.81; //重力加速度
	var REPETITION_MAX=10; //繰り返しソルバ最大回数
	var PENALTY =400; //押出し係数
	var _dt; //ステップ時間
	var dv = new Vec3();
	var impulse = new Vec3();
	
	var ret = function(){
		this.phyObjs = [];
		this.joints = [];
		this.repetition=0;
		this.hitInfos=[];
		this.collider=new Collider();
	}

	var i=0;
	var SPRING_MESH = ret.SPRING_MESH = i++
		,SPRING = ret.SPRING = i++
		,RIGID= ret.RIGID= i++
	;
	//物体の接触情報
	var HitInfo = (function(){
		var HitInfo = function() {
			this.obj1 = null; //接触物体1
			this.obj2 = null; //接触物体2
			this.pos1org = new Vec3(); //接触位置1
			this.pos2org = new Vec3(); //接触位置2
			this.pos1 = new Vec3(); //接触相対位置1
			this.pos2 = new Vec3(); //接触相対位置2
			this.pos1ex = new Vec3(); //接触相対位置1
			this.pos2ex = new Vec3(); //接触相対位置2

			this.nVec = new Vec3(); //法線方向
			this.nEffic = 0; //法線方向に対する力の影響係数
			this.nImpulse = 0;  //法線方向にかかる力

			this.t1Vec = new Vec3(); //従法線1 /法線方向と垂直な方向
			this.t1Effic= 0; //従法線方向に対する力の影響係数
			this.t1Effic2=new Vec2(); ///従法線1方向に対する力の影響係数
			this.t2Vec = new Vec3(); //従法線2 / 法線と従法線1に垂直な方向
			this.t2Effic= 0; //従法線2方向に対する力の影響係数
			this.t2Effic2=new Vec2(); //従法線2方向に対する力の影響係数
			this.tImpulse = new Vec3(); //従法線1および2(法線以外)の方向にかかる力
			this.inv_tEffic=1.0;

			this.repulsion=0;
			this.restCoe = 0; //2物体間の反発係数
			this.fricCoe = 0; //2物体間の摩擦係数

			this.type;
		}
		var ret = HitInfo;

		ret.prototype.calcConstraint=function(){
			//衝突数ループ
			var hitInfo = this;

			//法線方向
			calcDiffVelocity(dv,hitInfo); //衝突点の速度差
			var old = hitInfo.nImpulse; //現在の撃力
			hitInfo.nImpulse += Vec3.dot(dv, hitInfo.nVec) * hitInfo.nEffic 
				+ hitInfo.repulsion; //速度差から新しい撃力を算出
			if (hitInfo.nImpulse < 0 && hitInfo.type==0) { //撃力が逆になった場合は0にする
				hitInfo.nImpulse = 0;
			}
			Vec3.mul(impulse, hitInfo.nVec, (hitInfo.nImpulse-old));

			addimpulse( hitInfo, impulse); //撃力差分を剛体の速度に反映

				calcDiffVelocity(dv,hitInfo);
			//従法線方向(摩擦力)
			if(hitInfo.type==0){
				calcDiffVelocity(dv,hitInfo);
				var max = hitInfo.nImpulse * hitInfo.fricCoe; //法線撃力から摩擦最大量を算出
				if(dv[0]*dv[0]+dv[1]*dv[1]+dv[2]*dv[2]>0.0001){
					max*=0.9; //静止していない場合はちょっと減らす
				}
				Vec3.copy(bV0,hitInfo.tImpulse); //現在の摩擦力保存
				bV1[0] = Vec3.dot(hitInfo.t1Vec,dv) ; //従法線1方向の速度差
				bV1[1] = Vec3.dot(hitInfo.t2Vec,dv); //従法線2方向の速度差
				//t1方向とt2方向の必要摩擦力を求める
				//x*E1[0] + y*E2[0] = dv[0]
				//x*E1[1] + y*E2[1] = dv[1]
				var x = Vec2.cross(bV1,hitInfo.t1Effic2);
				var y = Vec2.cross(bV1,hitInfo.t2Effic2);
				//var x = Vec3.dot(dv, hitInfo.t1Vec) * hitInfo.t1Effic;
				//var y = Vec3.dot(dv, hitInfo.t2Vec) * hitInfo.t2Effic;
				//t1方向とt2方向の摩擦力を合算
				Vec3.muladd(hitInfo.tImpulse,hitInfo.tImpulse,hitInfo.t1Vec,x);
				Vec3.muladd(hitInfo.tImpulse,hitInfo.tImpulse,hitInfo.t2Vec,y);
				var l =Vec3.scalar(hitInfo.tImpulse);
				if (l > max && hitInfo.type==0) { //摩擦力が最大量を上回る場合は最大量でセーブ
					Vec3.mul(hitInfo.tImpulse,hitInfo.tImpulse,max/l);
				}
				Vec3.sub(impulse, hitInfo.tImpulse,bV0); //摩擦力の差分を算出
				addimpulse( hitInfo, impulse); //摩擦力を速度に反映
			}
		}

		ret.prototype.calcAfter=function(dt){
			//重なり時の押出し
			var hitInfo = this;
			if(hitInfo.counter!=0){
				return;
			}
			Vec3.sub(dv,hitInfo.pos2org,hitInfo.pos1org);
			Vec3.mul(dv,hitInfo.nVec,Vec3.dot(dv,hitInfo.nVec));

			Vec3.mul(impulse, dv, PENALTY*dt*hitInfo.nEffic);
			addimpulse(hitInfo,impulse);
		}

		return ret;
	})();

	var calcEfficM = (function(){
		var R1 = new Mat33;
		var R2 = new Mat33;
		var mat1 = new Mat33;
		var mat2 = new Mat33;
		return function(m,obj1,r1,obj2,r2){
			var r = r1;
			Mat33.set(R1,0,r[2],-r[1],-r[2],0,r[0],r[1],-r[0],0);
			r = r2;
			Mat33.set(R2,0,r[2],-r[1],-r[2],0,r[0],r[1],-r[0],0);

			Mat33.dot(mat1,R1,obj1.inv_inertiaTensor);
			Mat33.dot(mat1,mat1,R1);
			Mat33.dot(mat2,R2,obj2.inv_inertiaTensor);
			Mat33.dot(mat2,mat2,R2);

			Mat33.add(m,mat1,mat2);
			Mat33.mul(m,m,-1);
			var inv_m = obj1.inv_mass + obj2.inv_mass;
			m[0]+=inv_m;
			m[4]+=inv_m;
			m[8]+=inv_m;

			Mat33.getInv(m,m);
		}

	})();

	var LinConstraint = (function(){
		var LinConstraint = function() {
			this.obj1 = null; //接触物体1
			this.obj2 = null; //接触物体2
			this.pos1 = new Vec3(); //接触相対位置1
			this.pos2 = new Vec3(); //接触相対位置2
			this.enables = new Array(3);
			this.effic = new Mat33();
			this.effic_ = new Mat33();
			this.impulse = new Vec3();
			this.linEnable = new Array(3);
			this.vecs =[];
			for(var i=0;i<3;i++){
				this.vecs.push(new Vec3());
			}
		}
		var ret = LinConstraint ;

		var n = new Vec3();
		var n2 = new Vec3();
		var vec1 = new Vec3();
		var vec2 = new Vec3();
		ret.prototype.init=function(obj1,pos1,obj2,pos2,enables,vecs){
			var hitInfo = this;
			if(!obj1 || !obj2){
				return;
			}
			obj1.impFlg=true;
			obj2.impFlg=true;
			hitInfo.obj1=obj1;
			hitInfo.obj2=obj2;

			Vec3.sub(this.pos1,pos1,obj1.location);
			Vec3.sub(this.pos2,pos2,obj2.location);
			
			var count=0;
			var m = this.obj2.rotmat;
			var X,Y;
			for(var i=0;i<3;i++){
				this.enables[i] = enables[i];
				Vec3.copy(this.vecs[i],vecs[i]);
				if(this.enables[i]){
					if(count==0){
						X=this.vecs[i];
					}else{
						Y=this.vecs[i];
					}
					count++;
				}
			}

			calcEfficM(this.effic,obj1,this.pos1,obj2,this.pos2);
			Mat33.getInv(this.effic_,this.effic);

			if(count==1){
				// 位置制限1軸の場合
				// F=(vX/((MX)X)X

				Mat33.dotVec(n,this.effic_,X);
				var b = 1/Vec3.dot(n,X);
				var m = this.effic;
				m[0]=X[0]*X[0]*b;
				m[1]=X[0]*X[1]*b;
				m[2]=X[0]*X[2]*b;
				m[3]=X[1]*X[0]*b;
				m[4]=X[1]*X[1]*b;
				m[5]=X[1]*X[2]*b;
				m[6]=X[2]*X[0]*b;
				m[7]=X[2]*X[1]*b;
				m[8]=X[2]*X[2]*b;
				
			}else if(count==2){
				// 位置制限2軸の場合
				//F = ((vX*MYY-vYMYX)X - (vxMXY-vYMXX)Y) / (MXX*MYY - MXY*MYX) 
				Mat33.dotVec(n,this.effic_,X);
				Mat33.dotVec(n2,this.effic_,Y);
				var mxx=Vec3.dot(n,X);
				var mxy=Vec3.dot(n,Y);
				var myx=Vec3.dot(n2,X);
				var myy=Vec3.dot(n2,Y);

				var denom = 1/ (mxx*myy  - mxy*myx);
				var m = this.effic;
				m[0]=(myy*X[0]*X[0] - myx*Y[0]*X[0] - mxy*X[0]*Y[0] + mxx*Y[0]*Y[0])  *denom;
				m[1]=(myy*X[0]*X[1] - myx*Y[0]*X[1] - mxy*X[0]*Y[1] + mxx*Y[0]*Y[1])  *denom;
				m[2]=(myy*X[0]*X[2] - myx*Y[0]*X[2] - mxy*X[0]*Y[2] + mxx*Y[0]*Y[2])  *denom;
				m[3]=(myy*X[1]*X[0] - myx*Y[1]*X[0] - mxy*X[1]*Y[0] + mxx*Y[1]*Y[0])  *denom;
				m[4]=(myy*X[1]*X[1] - myx*Y[1]*X[1] - mxy*X[1]*Y[1] + mxx*Y[1]*Y[1])  *denom;
				m[5]=(myy*X[1]*X[2] - myx*Y[1]*X[2] - mxy*X[1]*Y[2] + mxx*Y[1]*Y[2])  *denom;
				m[6]=(myy*X[2]*X[0] - myx*Y[2]*X[0] - mxy*X[2]*Y[0] + mxx*Y[2]*Y[0])  *denom;
				m[7]=(myy*X[2]*X[1] - myx*Y[2]*X[1] - mxy*X[2]*Y[1] + mxx*Y[2]*Y[1])  *denom;
				m[8]=(myy*X[2]*X[2] - myx*Y[2]*X[2] - mxy*X[2]*Y[2] + mxx*Y[2]*Y[2])  *denom;
			}else if(count==0){
				Mat33.mul(this.effic,this.effic,0);
			}

			Vec3.set(n,0,0,0);
			for(var i=0;i<3;i++){
				if(this.enables[i]){
					var l=Vec3.dot(this.vecs[i],this.impulse);
				//	if(l>0){
						Vec3.muladd(n,n,this.vecs[i],l);
				//	}
				}	
			}

			//Vec3.mul(this.impulse,this.impulse,0);
			Vec3.copy(this.impulse,n);
			addimpulse(this,this.impulse);

			return hitInfo;

		};

		var old= new Vec3();
		var dv = new Vec3();
		var vec=new Vec3();
		ret.prototype.calcConstraint=function(){
			_calcDiffVelocity(dv,this.obj1,this.obj2,this.pos1,this.pos2); //速度差
			Vec3.copy(old,this.impulse); //前回の撃力
			Mat33.dotVec(vec,this.effic,dv); //必要撃力
			Vec3.add(this.impulse,this.impulse,vec); //撃力に足す

			//逆方向の力は加えない
			var m = this.obj2.rotmat;
			for(var i=0;i<DIMENSION;i++){
				if(this.enables[i]){
					var a = Vec3.dot(this.impulse,this.vecs[i]);
					if(a < 0){
						Vec3.muladd(this.impulse,this.impulse,this.vecs[i],-a);
					}
				}
			}
			Vec3.sub(vec,this.impulse,old); //今回加える撃力
			addimpulse(this,vec);
			
		}

		ret.prototype.calcAfter=function(dt){
			//重なり時の押出し
		}

		return ret;
	})();


	var AngConstraint = (function(){
		var AngConstraint = function() {
			this.obj1 = null; //接触物体1
			this.obj2 = null; //接触物体2

			this.nVec = new Vec3(); //回転軸
			this.I1= 0; //回転軸に対する慣性モーメント
			this.I2= 0;  //
			this.impact=0;
		}
		var ret = AngConstraint;

		ret.prototype.init=function(obj1,obj2,nVec,dr){
			this.obj1=obj1;
			this.obj2=obj2;
			obj1.impFlg=true;
			obj2.impFlg=true;
			if(Vec3.dot(this.nVec,nVec)<0){
				this.impact=0;
			}
			Vec3.copy(this.nVec,nVec);
			this.dr=dr;


			//それぞれに加える
			var axis = this.nVec;
			var obj1 = this.obj1;
			var obj2 = this.obj2;
			//相対回転速度
			//回転軸周りの慣性モーメント
			Mat33.dotVec(bV0,obj1.inertiaTensor,axis);
			var a =  Vec3.dot(bV0,axis);
			Mat33.dotVec(bV0,obj2.inertiaTensor,axis);
			var b =  Vec3.dot(bV0,axis);
			Vec3.mul(bV0,axis,this.impact);
			Vec3.mul(bV1,bV0,1/a);
			Vec3.add(obj1.rotV,obj1.rotV,bV1);
			Vec3.mul(bV1,bV0,-1/b);
			Vec3.add(obj2.rotV,obj2.rotV,bV1);

		}

		ret.prototype.calcConstraint=function(){
			var axis = this.nVec;
			var obj1 = this.obj1;
			var obj2 = this.obj2;
			//対象軸の回転速度を求める
			var a=Vec3.dot(obj1.rotV,axis);
			var b=Vec3.dot(obj2.rotV,axis);
			//相対回転速度
			var d = b-a ;

			//回転軸周りの慣性モーメント
			Mat33.dotVec(bV0,obj1.inertiaTensor,axis);
			a =  Vec3.dot(bV0,axis);
			Mat33.dotVec(bV0,obj2.inertiaTensor,axis);
			b =  Vec3.dot(bV0,axis);

			//必要回転力
			var old = this.impact;
			this.impact += d*(a*b)/(a+b);
			if(this.impact<0){
				this.impact=0;
			}
			Vec3.mul(bV0,axis,this.impact - old);
			
			//それぞれに加える
			Vec3.mul(bV1,bV0,1/a);
			Vec3.add(obj1.rotV,obj1.rotV,bV1);
			Vec3.mul(bV1,bV0,-1/b);
			Vec3.add(obj2.rotV,obj2.rotV,bV1);
		}
		

		ret.prototype.calcAfter=function(dt){
			var obj1 = this.obj1;
			var obj2 = this.obj2;
			var axis = this.nVec;

			//回転軸周りの慣性モーメント
			Mat33.dotVec(bV0,obj1.inertiaTensor,axis);
			var a =  Vec3.dot(bV0,axis);
			Mat33.dotVec(bV0,obj2.inertiaTensor,axis);
			var b =  Vec3.dot(bV0,axis);
			//補正
			//必要回転力
			Vec3.mul(bV0,axis,this.dr*PENALTY*dt*(a*b)/(a+b));
			
			//それぞれに加える
			Vec3.mul(bV1,bV0,1/a);
			Vec3.add(obj1.rotV,obj1.rotV,bV1);
			Vec3.mul(bV1,bV0,-1/b);
			Vec3.add(obj2.rotV,obj2.rotV,bV1);
		}

		return ret;
	})();
	var disableHitInfos=[];
	for(var i=0;i<1024;i++){
		disableHitInfos.push(new HitInfo());
	}

	var PhyObj = (function(){
		var PhyObj = function(){
			//物理オブジェクト
			this.fix=1; //1固定 0挙動計算対象
			this.moveflg=1;
			this.matrix =new Mat43(); //オブジェクトの姿勢等
			this.inv_matrix=new Mat44(); //逆行列
			this.oldmat = new Mat43();
			this.name; //オブジェクト名称
			this.type = RIGID;

			this.mass=1.0; //質量
			this.inertia=new Vec3(); //慣性主軸モーメント
			Vec3.set(this.inertia,99999,99999,99999);
			this.inertiaTensor=new Mat33;
			this.inv_inertiaTensor=new Mat33;
			this.friction=0.2; //摩擦力(動摩擦力)

			this.v = new Vec3(); //速度
			this.oldv = new Vec3(); //速度
			this.a = new Vec3(); //加速度

			this.rotL = new Vec3(); //角運動量
			this.rotV = new Vec3(); //回転速度
			this.oldrotV = new Vec3(); //角運動量(古い)

			this.rotmat=new Mat33(); //回転状態
			this.scale=new Vec3(); //スケール
			this.location=new Vec3(); //位置
			this.inv_restCoe = 1.0/0.2; //反発係数の逆数
			this.inv_fricCoe = 1.0/0.2; //摩擦係数の逆数
			this.inv_mass = 0; //質量の逆数

			this.children=[];
		}
		var ret=PhyObj;
		ret.prototype.calcPre = function(){
			var m=this.matrix;
			var r=this.rotmat;

			//合成行列
			var sx=this.scale[0];
			var sy=this.scale[1];
			var sz=this.scale[2];

			m[0]=r[0]*sx;
			m[1]=r[1]*sx;
			m[2]=r[2]*sx;
			m[3]=0;
			m[4]=r[3]*sy;
			m[5]=r[4]*sy;
			m[6]=r[5]*sy;
			m[7]=0;
			m[8]=r[6]*sz;
			m[9]=r[7]*sz;
			m[10]=r[8]*sz;
			m[11]=0;
			m[12]=this.location[0];
			m[13]=this.location[1];
			m[14]=this.location[2];
			m[15]=1;

			Mat44.getInv(this.inv_matrix,m);

			//現在の傾きと直交慣性モーメントから慣性テンソルを求める
			var i=this.inertia;
			Mat33.getInv(bM,r);
			bM[0]*=i[0];
			bM[1]*=i[1];
			bM[2]*=i[2];
			bM[3]*=i[0];
			bM[4]*=i[1];
			bM[5]*=i[2];
			bM[6]*=i[0];
			bM[7]*=i[1];
			bM[8]*=i[2];
			Mat33.dot(this.inertiaTensor,r,bM);
			Mat33.getInv(this.inv_inertiaTensor,this.inertiaTensor);
			//前ステップの角運動量から角速度を求める
			Mat33.dotVec(this.rotV,this.inv_inertiaTensor,this.rotL);

			//子の計算を行う
			for(var i=0;i<this.children.length;i++){
				var child=this.children[i];
				child.calcPre();
			}
		}
		return PhyObj;
	})();
	var Joint = (function(){
		var Joint = function(){
			this.breaking_threshold=0.0;
			this.disable_collisions=false;
			this.enabled= false;
			this.limit_ang_lower=new Vec3();
			this.limit_ang_upper=new Vec3();
			this.limit_lin_lower=new Vec3();
			this.limit_lin_upper=new Vec3();
			this.motor_ang_max_impulse=1;
			this.motor_ang_target_velocity=1;
			this.motor_lin_max_impulse=1;
			this.motor_lin_target_velocity=1;
			this.object1=null;
			this.object2=null;
			this.spring_damping=new Vec3();
			this.spring_stiffness=new Vec3();
			this.use_breaking=0;
			this.use_limit_ang=new Vec3();
			this.use_limit_lin=new Vec3();
			this.use_motor_ang=0;
			this.use_motor_lin=0;
			this.use_spring_ang=new Vec3();

			this.linConstraint = new LinConstraint();
			this.angConstraint_ = new LinConstraint();
			this.angConstraint_2 = new LinConstraint();

			this.truepos=new Vec3();
			this.jointp=new Vec3();

			this.matrix = new Mat44();
			this.enableLin=new Array(3);
			this.enableAng=new Array(3);
			this.angConstraint =[];
			for(var j=0;j<DIMENSION;j++){
				this.angConstraint.push(new AngConstraint());
			}

			this.angv=new Vec3();
			this.angp=new Vec3();
		}
		var ret = Joint;
		var n = new Vec3();
		var bM = new Mat44();
		var axis = new Vec3();
		var axis2 = new Vec3();
		var axis3 = new Vec3();
		var axis4 = new Vec3();
		var jointp = new Vec3();
		var dp = new Vec3();
		var truepos = new Vec3();
		var rotmat= new Mat33();

		var dv = new Vec3();
		var vec= new Vec3();
		var vecs = [];
		for(var i=0;i<3;i++){
			vecs.push(new Vec3());
		}
		var oldimp = new Vec3();
		ret.prototype.calcPre=function(){
			var joint = this;
			var object1= joint.object1;
			var object2= joint.object2;
			var parent = object1;

			//ジョイント位置
			Mat44.dot(bM,joint.parent.matrix,joint.matrix);
			Vec3.set(jointp,bM[12],bM[13],bM[14]);

			//差
			Vec3.sub(dp,joint.child.location,jointp);
			if(object1 != joint.parent){
				Vec3.mul(dp,dp,-1);
			}

			//位置制限
			var count=0;
			Vec3.set(truepos,0,0,0);
			for(var i=0;i<DIMENSION;i++){
				this.enableLin[i]=0;
				Vec3.set(axis,joint.object1.rotmat[i*3]
					,joint.object1.rotmat[i*3+1]
					,joint.object1.rotmat[i*3+2]);
				Vec3.copy(vecs[i],axis);
				if(joint.use_limit_lin[i]){
					//軸の向き
					var i1=(i+1)%3;
					var i2=(i+2)%3;
					//位置差
					var l = Vec3.dot(axis,dp);
					if(l < joint.limit_lin_lower[i]
					|| l > joint.limit_lin_upper[i]){
						//制限範囲を超えている場合
						if(l< joint.limit_lin_lower[i]){
							l= l - joint.limit_lin_lower[i];
							this.enableLin[i]=-1;
						}else{
							l= l - joint.limit_lin_upper[i];
							this.enableLin[i]=1;
						}
						if(object1 != joint.parent){
							l*=-1;
						}
						if(l<0){
							Vec3.mul(vecs[i],vecs[i],-1);

						}
						Vec3.muladd(truepos,truepos,axis,l);//本来の位置

						count++;

					}
				}
			}

			Vec3.add(truepos,truepos,jointp);

			this.linConstraint.init(this.parent,jointp,this.child,this.child.location,this.enableLin,vecs);


			//角度制限
			var ar =new Array(3);
			ar[0]=0;
			ar[1]=0;
			ar[2]=0;
			for(var i=0;i<DIMENSION;i++){
				this.enableAng[i]=false;
				if(joint.use_limit_ang[i]){
					//軸の向き
					var i1 = (i+1)%3;
					var i2 = (i+2)%3;
					var cM = joint.child.matrix;


					//var m = joint.object2.rotmat;
					if(i==0){
						Vec3.set(axis2,bM[i1*4],bM[i1*4+1],bM[i1*4+2]); //角度判定軸
						Vec3.set(axis,bM[i*4],bM[i*4+1],bM[i*4+2]);//ワールド回転軸
						Vec3.set(axis3,cM[i2*4],cM[i2*4+1],cM[i2*4+2]); //角度判定基準軸
						Vec3.cross(axis4,axis3,axis);//角度判定基準軸x
						Vec3.cross(axis3,axis4,axis);//角度判定基準軸y
						Vec3.cross(axis,axis3,axis4);//ワールド回転軸

						Vec3.cross(vecs[i],axis2,axis);
						Vec3.norm(vecs[i]);

						Vec3.set(axis,cM[8],cM[9],cM[10]);
						Vec3.set(n,bM[0],bM[1],bM[2]);
						Vec3.cross(n,n,axis);
						Vec3.cross(axis,axis,n);
					}else if(i==1){
						Vec3.set(axis2,bM[i2*4],bM[i2*4+1],bM[i2*4+2]); //角度判定軸
						Vec3.set(axis3,cM[i1*4],cM[i1*4+1],cM[i1*4+2]); //角度判定基準軸y
						//Vec3.norm(axis3);
						//Vec3.muladd(axis4,axis2,axis3,-Vec3.dot(axis3,axis2));//x
						Vec3.cross(axis,axis3,axis2);//ワールド回転軸
						Vec3.cross(axis4,axis,axis3);//ワールド回転軸
						//Vec3.cross(axis,axis3,axis4);//ワールド回転軸

						Vec3.cross(vecs[i],axis,axis2);
						Vec3.norm(vecs[i]);
						Vec3.set(n,bM[12],bM[13],bM[14]);
						if(Vec3.dot(n,axis4)<0){
							Vec3.mul(vecs[i],vecs[i],-1);
						}

					}else if(i==2){
						Vec3.set(axis2,bM[i1*4],bM[i1*4+1],bM[i1*4+2]); //角度判定軸
						Vec3.set(axis3,-cM[i2*4],-cM[i2*4+1],-cM[i2*4+2]); //角度判定基準軸y
						Vec3.set(axis4,cM[i1*4],cM[i1*4+1],cM[i1*4+2]); //角度判定基準軸x
						Vec3.cross(axis,axis3,axis4);//ワールド回転軸


						Vec3.cross(vecs[i],axis,axis2);
						Vec3.norm(vecs[i]);


						Vec3.set(axis,cM[8],cM[9],cM[10]);
						Vec3.set(n,bM[0],bM[1],bM[2]);
						Vec3.cross(axis,n,axis);
						Vec3.cross(axis,axis,n);
					}
					Vec3.norm(axis);
					Vec3.norm(axis2);
					Vec3.norm(axis3);
					Vec3.norm(axis4);

					//角度
					var y = Vec3.dot(axis3,axis2);
					var x = Vec3.dot(axis4,axis2);
					var dr = Math.atan2(y,x); //角度


					if(dr < joint.limit_ang_lower[i]
					|| dr > joint.limit_ang_upper[i]){
						//制限範囲を超えている場合
						this.enableAng[i]=true;
						if(dr< joint.limit_ang_lower[i]){
							dr= dr - joint.limit_ang_lower[i];
						}else{
							dr= dr - joint.limit_ang_upper[i];
						}

						if(dr<0){
							Vec3.mul(vecs[i],vecs[i],-1);
							dr*=-1;
							Vec3.mul(axis,axis,-1);
						}


						ar[i]=1;
						joint.angConstraint[i].init(joint.parent,joint.child,axis,dr);

					}
				}
			}
			Vec3.sub(n,jointp,this.parent.location);
			Vec3.set(vec,bM[0],bM[1],bM[2]);
			Vec3.norm(vec);
			Vec3.mul(n,vec,-Vec3.dot(n,vec));
			Vec3.add(dv,jointp,n);
			Vec3.add(n,n,this.child.location);
			var m=ar[0];
			ar[0]=0;
			this.angConstraint_.init(this.child,n,this.parent,dv,ar,vecs);

			ar[0]=m;
			ar[1]=0;
			ar[2]=0;
			Vec3.sub(n,jointp,this.parent.location);
			Vec3.set(vec,bM[0],bM[1],bM[2]);
			Vec3.norm(vec);
			Vec3.muladd(n,n,vec,-Vec3.dot(n,vec));
			Vec3.mul(n,n,-1);
			Vec3.add(dv,jointp,n);
			Vec3.add(n,n,this.child.location);
			this.angConstraint_2.init(this.parent,dv,this.child,n,ar,vecs);

			Vec3.copy(this.truepos,truepos);
			Vec3.copy(this.jointp,jointp);
		}
		ret.prototype.calcConstraint=function(){

			this.linConstraint.calcConstraint();
			this.angConstraint_.calcConstraint();
			this.angConstraint_2.calcConstraint();
			for(var i=0;i<DIMENSION;i++){
				if(this.enableAng[i]){
					this.angConstraint[i].calcConstraint();
				}
			}

		}
		ret.prototype.calcAfter=function(dt){
			//位置補正
			var obj1 = this.linConstraint.obj1;
			var obj2 = this.linConstraint.obj2;
			Vec3.sub(vec,this.truepos,this.jointp);
			Vec3.mul(vec, vec, PENALTY*dt);
			Mat33.dot(vec,this.linConstraint.effic,vec);
			addimpulse(this.linConstraint,vec);
			//Vec3.muladd(obj1.v,obj1.v,vec,obj1.inv_mass);
			//Vec3.muladd(obj2.v,obj2.v,vec,-obj2.inv_mass);


			//角度補正
			for(var i=0;i<DIMENSION;i++){
				if(this.enableAng[i]){
					this.angConstraint[i].calcAfter(dt);
				}
			}
		}
		return ret;
	})();

	var Spring =  function(){
		//ばね
		PhyObj.apply(this);
		this.type = SPRING;
		this.k=1; //ばね定数
		this.c=0; //ダンパ係数
		this.p0 = new Vec3(); //ばね先端1座標
		this.p1 = new Vec3(); //ばね先端2座標
		this._p0 = new Vec3(); //前回の座標
		this._p1 = new Vec3(); //前回の座標
		this.con1Obj = null; //接続オブジェクト1
		this.con1Pos = new Vec3(); //オブジェクト接続座標
		this.con2Obj = null; //接続オブジェクト2
		this.con2Pos = new Vec3(); //オブジェクト接続座標
	}
	inherits(Spring,PhyObj);
	
	var SpringMesh =  (function(){
		var ret=function(vertexsize){
		//ばねメッシュ
		PhyObj.apply(this);
		this.bold=0.1;
		this.type=SPRING_MESH;
		this.fix=0; 
		this.poses =[]; //頂点位置
		this.truepos =[]; //頂点位置
		this.v =[]; //頂点速度
		this.a =[]; //頂点加速度
		this.fixes = [];
		this.joints = []; //エッジ
		this.faces = []; //面
		this.faceAABBs = []; //面
		this.AABB = new AABB();

		this.goalDefault=0; //デフォルトゴール影響度
		this.goalMin=0; //最低ゴール影響度
		this.goalMax=0; //最高ゴール影響度
		this.goal=0; //最高ゴール影響度
		this.goalDamp=0; //ゴール影響ダンパ
		this.goalSpring= 0.1; //ゴール影響ばね定数
		this.edgePull=0; //引きばね定数
		this.edgePush=0; //押しばね定数
		this.edgeDamp=0; //ばねダンパ定数
	}
		inherits(ret,PhyObj);
		return ret;

	})();


	//オブジェクト種類
	var i=1
	
	var bV0 = new Vec3()
	,bV1 = new Vec3()
	,bV2 = new Vec3()
	,bV3 = new Vec3()
	,bV4 = new Vec3()
	,bV5 = new Vec3()
	,bV6 = new Vec3()
	,bM = new Mat43()
	,bM2 = new Mat43()
	


	ret.prototype.createPhyObj= function(){
		var obj =new PhyObj();
		this.phyObjs.push(obj);
		return obj;
	}
	ret.prototype.createJoint= function(){
		var joint =new Joint();
		this.joints.push(joint);
		return joint;
	}
	ret.prototype.deleteJoint= function(joint){
		//ジョイント削除
		var joints=this.joints;
		for(var i=joints.length;i--;){
			if(joints[i]==joint){
				joints.splice(i,1);
				break;
			}
		}
	}

	ret.prototype.createCollision= function(type){
		return this.collider.createCollision(type);
	}
	ret.prototype.createSpring = function(){
			//スプリングオブジェクト作成
			var res=new Spring();
			res.fix=0;
			this.phyObjs.push(res)
			return res
		}
	ret.prototype.createSpringMesh = function(){
			//スプリングメッシュオブジェクト作成
			var obj=new SpringMesh()
			this.phyObjs.push(obj)
			return obj; 
		}
	ret.prototype.createMesh = function(mesh){
		return this.collider.createMesh(mesh);
	}
	ret.prototype.deletePhyObject = function(object){
		//オブジェクト削除
		var phyObjs=this.phyObjs;
		for(var i=phyObjs.length;i--;){
			if(phyObjs[i]==object){
				//コリジョンを削除
				for(var j=0;j<object.children.length;j++){
					this.deleteCollision(object.children[i]);
				}
				phyObjs.splice(i,1);
				break;
			}
		}
	}

	var _registHitInfo = (function(){
		var vec3=new Vec3();
		var vec32=new Vec3();
	})();
	ret.prototype.registHitInfo = (function(){
		var vec3=new Vec3();
		var vec32=new Vec3();
		return function(obj1,pos1,obj2,pos2,hitInfo){
			if(!obj1 || !obj2){
				return;
			}
			var flg=0;
			if(hitInfo){
			flg=1;
			}
	//		var hitInfo=null;

			if(Vec3.len2(pos1,pos2)==0 ){
				return;

			}
			var hitInfos = this.hitInfos;
			Vec3.sub(vec3,pos1,obj1.location);
			Vec3.sub(vec32,pos2,obj2.location);

			var counter=0;
			var idx=-1;
			if(!hitInfo){
				for(var i=0;i<hitInfos.length;i++){
					if(hitInfos[i].type!=0){
						continue;
					}
					if(hitInfos[i].obj1!= obj1|| hitInfos[i].obj2!=obj2){
						continue;
					}

					counter++;
					if(idx<0){
						if(Vec3.len2(hitInfos[i].pos1org,pos1)>0.0001
						&& Vec3.len2(hitInfos[i].pos2org,pos2)>0.0001){
							continue;
						}
						idx=i;

					}
				}	
				if(idx<0){
					hitInfo = disableHitInfos.pop();
					hitInfos.push(hitInfo);
					hitInfo.obj1 = obj1;
					hitInfo.obj2 = obj2;

					hitInfo.nImpulse = 0;
					Vec3.set(hitInfo.tImpulse,0,0,0);
					hitInfo.t2Impulse = 0;

					hitInfo.fricCoe = obj1.friction* obj2.friction; 
					hitInfo.restCoe = obj1.restitution* obj2.restitution;


				}else{
					hitInfo = hitInfos[idx];
					hitInfos.splice(idx,1);
					hitInfos.push(hitInfo);

					counter++;

				}

				if(counter>4){
					for(var i=0;i<hitInfos.length;i++){
						if(hitInfos[i].obj1!= obj1 || hitInfos[i].obj2!=obj2){
							continue;
						}
						disableHitInfos.push(hitInfos[i]);
						hitInfos.splice(i,1);
						break;
					}	
				}
			}
			if(!flg){
			Vec3.copy(hitInfo.pos1,vec3);
			Vec3.copy(hitInfo.pos2,vec32);
			Vec3.copy(hitInfo.pos1org,pos1);
			Vec3.copy(hitInfo.pos2org,pos2);
			}

			//	hitInfo.nImpulse = 0;
			//	Vec3.set(hitInfo.tImpulse,0,0,0);
			//	hitInfo.t2Impulse = 0;

			Mat43.dotMat43Vec3(hitInfo.pos1ex,obj1.inv_matrix,pos1);
			Mat43.dotMat43Vec3(hitInfo.pos2ex,obj2.inv_matrix,pos2);



			if(!flg)
			if(Vec3.len2(pos1,pos2)!=0){
				Vec3.sub(hitInfo.nVec,pos2,pos1);
				Vec3.norm(hitInfo.nVec);
			}


			hitInfo.t1Vec[0] = hitInfo.nVec[1];
			hitInfo.t1Vec[1] = -hitInfo.nVec[2];
			hitInfo.t1Vec[2] = -hitInfo.nVec[0];
			Vec3.cross(hitInfo.t1Vec,hitInfo.t1Vec,hitInfo.nVec);
			Vec3.cross(hitInfo.t2Vec,hitInfo.t1Vec,hitInfo.nVec);
			Vec3.norm(hitInfo.t1Vec);
			Vec3.norm(hitInfo.t2Vec);

			hitInfo.nEffic = calcEffic(hitInfo.nVec, hitInfo);
			hitInfo.t1Effic = calcEffic(hitInfo.t1Vec, hitInfo);
			hitInfo.t2Effic = calcEffic(hitInfo.t2Vec, hitInfo);
			calcEffic2(vec3,hitInfo.t1Vec, hitInfo);
			hitInfo.t2Effic2[0] = Vec3.dot(hitInfo.t1Vec,vec3);
			hitInfo.t2Effic2[1] = Vec3.dot(hitInfo.t2Vec,vec3);
			calcEffic2(vec3,hitInfo.t2Vec, hitInfo);
			hitInfo.t1Effic2[0] = Vec3.dot(hitInfo.t1Vec,vec3);
			hitInfo.t1Effic2[1] = Vec3.dot(hitInfo.t2Vec,vec3);

			var inv=1.0/Vec2.cross(hitInfo.t1Effic2,hitInfo.t2Effic2);
			Vec2.mul(hitInfo.t1Effic2,hitInfo.t1Effic2,-inv);
			Vec2.mul(hitInfo.t2Effic2,hitInfo.t2Effic2,inv);


			hitInfo.counter=0;

			hitInfo.type=0;
			return hitInfo;

		};
	})();

	var calcBuf = new Vec3();
	var calcBuf2 = new Vec3();

	var _calcEffic = function(n, obj1,obj2,pos1,pos2) {
		Vec3.cross(calcBuf, pos1,n);
		Vec3.cross(calcBuf,calcBuf,pos1);
		Mat33.dotVec(calcBuf2,obj1.inv_inertiaTensor,calcBuf);

		Vec3.cross(calcBuf, pos2,n);
		Vec3.cross(calcBuf,calcBuf,pos2);
		Mat33.dotVec(calcBuf,obj2.inv_inertiaTensor,calcBuf);

		Vec3.add(calcBuf2,calcBuf2,calcBuf);
		return 1 / (obj1.inv_mass + obj2.inv_mass + Vec3.dot(n, calcBuf2) );
	}
	var calcEffic = function(n, hitInfo) {
		var obj1 = hitInfo.obj1;
		var obj2 = hitInfo.obj2;
		Vec3.cross(calcBuf, hitInfo.pos1,n);
		Vec3.cross(calcBuf,calcBuf,hitInfo.pos1);
		Mat33.dotVec(calcBuf2,obj1.inv_inertiaTensor,calcBuf);

		Vec3.cross(calcBuf, hitInfo.pos2,n);
		Vec3.cross(calcBuf,calcBuf,hitInfo.pos2);
		Mat33.dotVec(calcBuf,obj2.inv_inertiaTensor,calcBuf);

		Vec3.add(calcBuf2,calcBuf2,calcBuf);
		return 1 / (obj1.inv_mass + obj2.inv_mass + Vec3.dot(n, calcBuf2) );
	}
	var calcEffic2 = function(vec,n, hitInfo) {
		var obj1 = hitInfo.obj1;
		var obj2 = hitInfo.obj2;
		Vec3.cross(calcBuf, hitInfo.pos1,n);
		Vec3.cross(calcBuf,calcBuf,hitInfo.pos1);
		Mat33.dotVec(vec,obj1.inv_inertiaTensor,calcBuf);

		Vec3.cross(calcBuf, hitInfo.pos2,n);
		Vec3.cross(calcBuf,calcBuf,hitInfo.pos2);
		Mat33.dotVec(calcBuf,obj2.inv_inertiaTensor,calcBuf);

		Vec3.add(vec,vec,calcBuf);
		Vec3.add(vec,vec,n,obj1.inv_mass);
		Vec3.add(vec,vec,n,obj2.inv_mass);
	}

	var _calcDiffVelocity = function(dv,obj1,obj2,pos1,pos2){
		Vec3.sub(dv, obj2.v, obj1.v);
		Vec3.cross(calcBuf,obj1.rotV,pos1);
		Vec3.sub(dv,dv,calcBuf);
		Vec3.cross(calcBuf,obj2.rotV,pos2);
		Vec3.add(dv,dv,calcBuf);
	}
	var calcDiffVelocity = function(dv,hitInfo){
		var obj1 = hitInfo.obj1;
		var obj2 = hitInfo.obj2;
		Vec3.sub(dv, obj2.v, obj1.v);
		Vec3.cross(calcBuf,obj1.rotV,hitInfo.pos1);
		Vec3.sub(dv,dv,calcBuf);
		Vec3.cross(calcBuf,obj2.rotV,hitInfo.pos2);
		Vec3.add(dv,dv,calcBuf);
	}

	var addimpulse_ = function(obj,pos,impulse){
		Vec3.muladd(obj.v,obj.v,impulse, obj.inv_mass);
		Vec3.cross(addimpulseBuf,pos,impulse);
		Mat33.dotVec(addimpulseBuf,obj.inv_inertiaTensor,addimpulseBuf);
		Vec3.add(obj.rotV,obj.rotV,addimpulseBuf);
	}
	var addimpulseBuf = new Vec3();
	var addimpulse = function(hitInfo,impulse){
		var obj1 = hitInfo.obj1;
		var obj2 = hitInfo.obj2;

		if(obj1.inv_mass > 0 && !obj1.fix){
			addimpulse_(obj1,hitInfo.pos1,impulse);
		}
		if(obj2.inv_mass > 0 && !obj2.fix){
			Vec3.mul(addimpulseBuf,impulse,-1);
			addimpulse_(obj2,hitInfo.pos2,addimpulseBuf);
		}
	}

	ret.prototype.calc=function(dt){
		_dt=dt;
		var i,j,k
		,obj,obj2
		,x,y,z,nx,ny,nz
		,matrix
		,detdt=1/dt
		,hitInfos = this.hitInfos
		,phyObjs = this.phyObjs;
		

		var ans1=new Vec3();
		var ans2=new Vec3();
		var n=new Vec3();
		var start=Date.now();
		var collisions=this.collisions;

		for(i = phyObjs.length;i--;){
			//判定用行列更新
			obj = phyObjs[i];
			obj.calcPre();
			obj.impFlg=0;
		}

		//オブジェクトの静止判定
		for(var i= phyObjs.length;i--;){
			var phyObj=phyObjs[i];
			var l=Mat43.compare(phyObj.oldmat,phyObj.matrix);
			if(l<=0.000001){
				phyObj.moveflg=0;
			}else{
				phyObj.moveflg=1;
				Mat43.copy(phyObj.oldmat,phyObj.matrix);
			}
		}

		//衝突情報の引き継ぎ判定

		var ans3=new Vec3();
		var ans4=new Vec3();
		var sphere = new Collider.Sphere();
		for(var i=0;i<hitInfos.length;i++){
			var hitInfo = hitInfos[i];

			var obj1=hitInfo.obj1;
			var obj2=hitInfo.obj2;
			//if(!obj1.moveflg && !obj2.moveflg){
			//	continue;
			//}
			if(hitInfo.type!=0){
				hitInfos.splice(i,1);
				disableHitInfos.push(hitInfo);
				i--;
				continue;
			}

			//衝突点の現在位置
			Mat43.dotMat43Vec3(bV0,obj1.matrix,hitInfo.pos1ex);
			Mat43.dotMat43Vec3(bV1,obj2.matrix,hitInfo.pos2ex);

			Vec3.sub(bV2,bV1,bV0);
			Vec3.sub(bV3,hitInfo.pos2org,hitInfo.pos1org);
			var flg=false;
			if(Vec3.dot(bV2,hitInfo.nVec)<=0){
				//衝突点が逆転している場合
				flg=true;
			}

			Vec3.sub(bV2,bV0,hitInfo.pos1org);
			var l =Vec3.dot(bV2,hitInfo.nVec);
			l = Vec3.scalar2(bV2)-l*l;
			if(l>0.001){
				//衝突点1が横移動している場合
				flg=true;
			}

			Vec3.sub(bV2,bV1,hitInfo.pos2org);
			l =Vec3.dot(bV2,hitInfo.nVec);
			l = Vec3.scalar2(bV2)-l*l;
			if(l>0.001){
				//衝突点2が横移動している場合
				flg=true;
			}

			if(flg){
				hitInfos.splice(i,1);
				disableHitInfos.push(hitInfo);
				i--;
			}else{
				this.registHitInfo(obj1,bV0,obj2,bV1,hitInfo);
			}

			hitInfo.counter++;
		}	


		//すべてのコリジョンの衝突判定
		this.collider.All();
		var hitList = this.collider.hitList;
		for(var i=0;hitList[i].col1;i++){
			var hit = hitList[i];
			if(!hit.col1.parent.moveflg && !hit.col2.parent.moveflg){
				continue;
			}
				this.registHitInfo(hit.col1.parent,hit.pos1,hit.col2.parent,hit.pos2);
		}


		var setMatrix=function(phyObj,m){

			Vec3.set(phyObj.location,m[12],m[13],m[14]);
			Vec3.set(phyObj.scale
					,Math.sqrt(m[0]*m[0]+m[1]*m[1]+m[2]*m[2])
					,Math.sqrt(m[4]*m[4]+m[5]*m[5]+m[6]*m[6])
					,Math.sqrt(m[8]*m[8]+m[9]*m[9]+m[10]*m[10]))
			var invx=1/phyObj.scale[0];
			var invy=1/phyObj.scale[1];
			var invz=1/phyObj.scale[2];
			Mat33.set(phyObj.rotmat
			,m[0]*invx
			,m[1]*invx
			,m[2]*invx
			,m[4]*invy
			,m[5]*invy
			,m[6]*invy
			,m[8]*invz
			,m[9]*invz
			,m[10]*invz
			);
			phyObj.calcPre();
		}
			
		var joints = this.joints;
		var n=new Vec3();
		var n2=new Vec3();
		var n3=new Vec3();
		var rotmat=new Mat44();
		for(var i=0;i<joints.length;i++){
			joints[i].calcPre();
		}

		for(var i=0;i<hitInfos.length;i++){
			var hitInfo=hitInfos[i];
			calcDiffVelocity(dv,hitInfo);
			hitInfo.repulsion = Vec3.dot(dv, hitInfo.nVec) * hitInfo.restCoe *hitInfo.nEffic;
		}	
		for(i = phyObjs.length;i--;){
			obj = phyObjs[i];

			if(obj.fix)continue

			if(obj.type==SPRING_MESH){
				this.springmeshMove(obj,dt);
				continue;
			}
			if(obj.type==SPRING){
				springMove(obj);
				continue;
			}
			
			obj.v[1]-=GRAVITY*dt;

		}

		for (var i = 0;i<hitInfos.length; i++) {
			var hitInfo = hitInfos[i];
			Vec3.mul(impulse, hitInfo.nVec, hitInfo.nImpulse );
			Vec3.add(impulse, impulse,  hitInfo.tImpulse );
			addimpulse( hitInfo, impulse);

			var obj1=hitInfo.obj1;
			var obj2=hitInfo.obj2;
			if(!obj1.fix){
				obj1.impFlg=1;
			}
			if(!obj2.fix){
				obj2.impFlg=1;
			}
		}



		start=Date.now();
		var repetition;
		for (repetition = 0; repetition < REPETITION_MAX; repetition++) {
			//繰り返し最大数まで繰り返して撃力を収束させる
			for(i = phyObjs.length;i--;){
				//現在の速度を保存
				var o = phyObjs[i];
				if(!o.impFlg){continue;}
				Vec3.copy(o.oldv,o.v);
				Vec3.copy(o.oldrotV,o.rotV);
			}

			for (var i = 0;i<hitInfos.length; i++) {
				//衝突数ループ
				hitInfos[i].calcConstraint();

			}

			for(var i=0;i<joints.length;i++){
				joints[i].calcConstraint();
			}
			

			//収束チェック
			var sum= 0;
			for(i = phyObjs.length;i--;){
				var o = phyObjs[i];
				if(!o.impFlg){continue;}
				//if(o.fix){continue;}
				var a=0;
				Vec3.sub(dv,o.oldv,o.v);
				a=(dv[0]*dv[0]+dv[1]*dv[1]+dv[2]*dv[2]);
				Vec3.sub(dv,o.oldrotV,o.rotV);
				a+=(dv[0]*dv[0]+dv[1]*dv[1]+dv[2]*dv[2]);

				sum+=a;
				
			}
			if ( sum<= 0.000001) {
				break;
			}
		}
		this.repetition=repetition;
		this.impulseTime=Date.now()-start;


		//重なり時の押出し
		for (var i = 0;i<hitInfos.length; i++) {
			hitInfos[i].calcAfter(dt);
		}
		for (var i = 0;i<joints.length; i++) {
			//重なり時の押出し
			joints[i].calcAfter(dt);
		}

		for(i = phyObjs.length;i--;){
			obj = phyObjs[i]
		
						
			if(obj.type==SPRING_MESH){

				springmeshMove2(obj,dt);
				continue;
			}
			
			if(obj.fix)continue;


			Mat33.dotVec(obj.rotL,obj.inertiaTensor,obj.rotV);

			var l=Vec3.scalar(obj.rotV);
			if(l>0){
				var d=1/l;
				Mat33.getRotMat(bM,l*dt,obj.rotV[0]*d,obj.rotV[1]*d,obj.rotV[2]*d);
				Vec3.mul(obj.rotL,obj.rotL,0.995);
				if(Vec3.scalar2(obj.rotL)<0.0001){
					Vec3.mul(obj.rotL,obj.rotL,0);
				}
				
				Mat33.dot(obj.rotmat,bM,obj.rotmat);
			}


			Vec3.muladd(obj.v,obj.v,obj.a,dt/obj.mass);
			Vec3.mul(obj.v,obj.v,0.998);
			if(Vec3.scalar2(obj.v)<0.0001){
				Vec3.mul(obj.v,obj.v,0);
			}

			Vec3.muladd(obj.location,obj.location,obj.v,dt);
			
			Vec3.set(obj.a,0,0,0);
			


		}
		return;
	}
	ret.prototype.springmeshMove=function(springmesh,dt){
		var detdt=1.0/dt;
		var truepos = springmesh.truepos;
		var velocities = springmesh.v
		var accs=springmesh.a
		var poses=springmesh.poses;
		var fixes=springmesh.fixes;
		var edges=springmesh.joints;

		//頂点の加速度
		for(var j=poses.length;j--;){
			Vec3.set(accs[j],0,0,0);
			Vec3.muladd(accs[j],accs[j],velocities[j],-springmesh.friction);
			accs[j][1]-=GRAVITY*springmesh.mass;
		}
		//頂点間のばね制御
		for(var j=edges.length;j--;){
			var edge=edges[j]
			var p0=edge.v0
			var p1=edge.v1

			if(fixes[p0] && fixes[p1]){
				//両方の頂点が固定の場合は処理不要
				continue;
			}

			//2点間の本来の距離
			var truelen=Vec3.len(truepos[p0],truepos[p1]);
			if(truelen*truelen<0.0001){
				//同位置の場合は処理不要
				continue;
			}

			//2点間の差分ベクトル
			Vec3.sub(bV3,poses[p1],poses[p0]);
1
			//2点間の距離
			var len=Vec3.scalar(bV3);
			if(!len){
				//同位置の場合は処理不要
				continue
			}

			//距離の比率
			len=(len-truelen)*1000;
			if(len<0){
				//縮んでいる場合
				len *= springmesh.edgePush;
			}else if(len>0){
				//伸びている場合
				len *= springmesh.edgePull;
			}

			//ばねの力を両点に加算
			Vec3.norm(bV3);
			Vec3.muladd(accs[p0],accs[p0],bV3,len);
			Vec3.muladd(accs[p1],accs[p1],bV3,-len);

			//両点の速度差分からダンパ力を計算
			Vec3.sub(bV1,velocities[p1],velocities[p0]);
			Vec3.mul(bV0,bV3,(Vec3.dot(bV1,bV3)));
			Vec3.muladd(accs[p0],accs[p0],bV0,springmesh.edgeDamping);
			Vec3.muladd(accs[p1],accs[p1],bV0,-springmesh.edgeDamping);
		}

		var faces = springmesh.faces;
		var aabb = springmesh.AABB;
		var faceAABBs = springmesh.faceAABBs;
		{
			var pos1 = new Vec3();
			var pos2 = new Vec3();
			var pos3 = new Vec3();
			Vec3.set(aabb.min,99999,99999,99999);
			Vec3.mul(aabb.max,aabb.min,-1);
			for(var i=0;i<faces.length;i++){
				var face = faces[i];
				Collider.calcAABB_POLYGON(faceAABBs[i],poses[face[0]],poses[face[1]],poses[face[2]]);
				Geono.addAABB(aabb,aabb,faceAABBs[i]);
			}
			
		};



		var ans1=new Vec3();
		var ans2=new Vec3();
		var n=new Vec3();
		var triangle = new Collider.Triangle();
		var collisions = this.collider.collisions;
		for(var i=0;i<collisions.length;i++){
			var collision=collisions[i];
			if(!Geono.AABB_AABBhit(aabb,collision.AABB)){
				continue;
			}
			if(collision.type==Collider.MESH){
				var mesh=collision.mesh;
				var faceAABBs2 = collision.faceAABBs;
				var triangle2 = new Collider.Triangle();
				var poses2= collision.poses;
				for(var k=0;k<mesh.faces.length;k++){
					var face2 = mesh.faces[k];
					triangle2.v[0]=poses2[face2.idx[0]];
					triangle2.v[1]=poses2[face2.idx[1]];
					triangle2.v[2]=poses2[face2.idx[2]];
					triangle2.AABB = faceAABBs2[k];
					for(var j=0;j<faces.length;j++){
						var face = faces[j];

						if(!Geono.AABB_AABBhit(faceAABBs[j],triangle2.AABB)){
							continue;
						}
						triangle.v[0]=poses[face[0]];
						triangle.v[1]=poses[face[1]];
						triangle.v[2]=poses[face[2]];
						triangle.AABB = faceAABBs[j];

						var l = Collider.calcCLOSEST(ans1,ans2,triangle,triangle2);
						l -=  (springmesh.bold + collision.bold);
						if(l<0 ){
							Vec3.sub(n,ans2,ans1);
							//Vec3.mul(n,n,1-(springmesh.bold+collision.bold)/l);

							Vec3.norm(n);
							Vec3.muladd(ans1,ans1,n,springmesh.bold);
							Vec3.muladd(ans2,ans2,n,-collision.bold);
							Vec3.sub(n,ans2,ans1);

							Vec3.mul(n,n,PENALTY*springmesh.mass);
							Vec3.add(accs[face[0]],accs[face[0]],n);
							Vec3.add(accs[face[1]],accs[face[1]],n);
							Vec3.add(accs[face[2]],accs[face[2]],n);

							exHit(springmesh,velocities[face[0]],ans1,collision.parent,ans2);
							exHit(springmesh,velocities[face[1]],ans1,collision.parent,ans2);
							exHit(springmesh,velocities[face[2]],ans1,collision.parent,ans2);

						}
					}
				}
			}else{
				for(var j=0;j<faces.length;j++){
					var face = faces[j];

					if(!Geono.AABB_AABBhit(faceAABBs[j],collision.AABB)){
						continue;
					}
					triangle.v[0]=poses[face[0]];
					triangle.v[1]=poses[face[1]];
					triangle.v[2]=poses[face[2]];
					triangle.AABB = faceAABBs[j];

					var l = Collider.calcCLOSEST(ans1,ans2,triangle,collision);
					l -= (springmesh.bold + collision.bold);
					if(l<0 ){
						Vec3.sub(n,ans2,ans1);
						//Vec3.mul(n,n,1-(springmesh.bold+collision.bold)/l);
						Vec3.norm(n);
						Vec3.muladd(ans1,ans1,n,springmesh.bold);
						Vec3.muladd(ans2,ans2,n,-collision.bold);
						Vec3.sub(n,ans2,ans1);

						Vec3.mul(n,n,PENALTY*springmesh.mass);

						Vec3.add(accs[face[0]],accs[face[0]],n);
						Vec3.add(accs[face[1]],accs[face[1]],n);
						Vec3.add(accs[face[2]],accs[face[2]],n);
						exHit(springmesh,velocities[face[0]],ans1,collision.parent,ans2);
						exHit(springmesh,velocities[face[1]],ans1,collision.parent,ans2);
						exHit(springmesh,velocities[face[2]],ans1,collision.parent,ans2);

					}
				}
			}
		}
	}
	var exHit = (function(){
		var v=new Vec3();
		var d=new Vec3();
		var ret=function(obj1,obj1v,pos1,obj2,pos2){
			Vec3.set(v,obj2.v[0],obj2.v[1],obj2.v[2]);
			Vec3.sub(d,pos2,pos1);
			Vec3.norm(d);
			var l=Vec3.dot(d,obj2.v)-Vec3.dot(d,obj1v);
			if(l<0){
				l=0;
			}
			Vec3.muladd(obj1v,obj1v,d,l);

			//Vec3.set(velocities[face[0]],collision.parent.v[0],collision.parent.v[1],collision.parent.v[2]);
		}
		return ret;
	})();
	var springmeshMove2=function(mesh,dt){
		var detdt=1/dt;
		var truepos= mesh.truepos;
		var velocities = mesh.v;
		var velocity;
		var accs=mesh.a
		var positions=mesh.poses;
		var fixes=mesh.fixes;
		var edges=mesh.joints;
		
		//元形状補正
		var goalDefault;
		var goal=1.0;
		
		//頂点の移動
		for(var j=positions.length;j--;){
			if(fixes[j] === 0){
				goal = mesh.goalMin;
		//	goal = 0;
			}else{
				goal = mesh.goalDefault;
			}
			if(goal >= 1.0){
				Vec3.sub(bV3,truepos[j],positions[j])
				velocity= velocities[j]
				Vec3.muladd(velocity,velocity,bV3,detdt);
				Vec3.copy(positions[j],truepos[j]);
			}else{
				velocity= velocities[j]

				Vec3.sub(bV3,truepos[j],positions[j])
				Vec3.nrm(bV2,bV3);
		//		Vec3.muladd(positions[j],positions[j],bV3,goal);
				Vec3.mul(bV3,bV3,mesh.goalSpring*500);
				Vec3.muladd(bV3,bV3,bV2,-Vec3.dot(bV2,velocity)*mesh.goalFriction);

				Vec3.sub(bV3,bV3,accs[j]);
				Vec3.muladd(accs[j],accs[j],bV3,goal);
				//Vec3.add(accs[j],accs[j],bV3);

				//Vec3.mul(velocity,velocity,0.95);
				Vec3.muladd(velocity,velocity,accs[j],dt/mesh.mass);
				Vec3.muladd(positions[j],positions[j],velocity,dt);

	//			Vec3.sub(bV3,truepos[j],positions[j])
	//			Vec3.muladd(positions[j],positions[j],bV3,goal);
			}
		}
		
		//両面オブジェクト対応
		for(var j=edges.length;j--;){
			var edge=edges[j]
			var p0=edge.v0
			var p1=edge.v1
			if(fixes[p0] && fixes[p1])continue;
				
			var len2=Vec3.len(truepos[p0],truepos[p1])
				
			if(len2*len2<0.0001){
				Vec3.copy(positions[p1],positions[p0])
				continue;
			}
		}
	}

	var springMove=function(obj){
		var dv=bV0;
		var dp=bV1;
		var n=bV2;
		//接続点
		if(obj.con1){
			Mat43.dotMat43Vec3(obj.p0,obj.con1.matrix,obj.con1Pos);
		}
		if(obj.con2){
			Mat43.dotMat43Vec3(obj.p1,obj.con2.matrix,obj.con2Pos);
		}
		//速度差
		Vec3.sub(dv,obj.p0,obj._p0);
		Vec3.sub(dp,obj.p1,obj._p1);
		Vec3.sub(dv,dv,dp);

		//位置差
		Vec3.sub(dp,obj.p1,obj.p0);
		//バネ長さ
		var defaultLength = obj.scale[0];
		
		//バネのび量
		var l = -defaultLength + Vec3.scalar(dp);
		Vec3.nrm(n,dp);//バネ向き

		Vec3.mul(dp,n,-obj.c*Vec3.dot(dv,n)); //ダンパ力
		Vec3.mul(n,n,l*obj.f); //バネ力
		Vec3.add(n,n,dp); //ダンパ＋バネ
		Vec3.mul(n,n,_dt);


		if(obj.con1){
			Vec3.sub(dp,obj.p0,obj.con1.location);
			addimpulse_(obj.con1,dp,n);
		}
		if(obj.con2){
			Vec3.sub(dp,obj.p1,obj.con2.location);
			Vec3.mul(n,n,-1);
			addimpulse_(obj.con2,dp,n);
		}

		
		Vec3.copy(obj._p0,obj.p0);
		Vec3.copy(obj._p1,obj.p1);
		
	}
	



	ret.setPhyObjData = function(phyobj){
		var type =phyobj.children[0].type;
		var obj =phyobj.parent;
		var sx = obj.bound_box[3]*obj.scale[0];
		var sy = obj.bound_box[4]*obj.scale[1];
		var sz = obj.bound_box[5]*obj.scale[2];
			
		switch(type){
		case Collider.SPHERE:
			var i=phyobj.mass*2/5*(sx*sx+sy*sy+sz*sz);
			Vec3.set(phyobj.inertia,i,i,i);
			break;
		case Collider.CAPSULE:
			var xy=phyobj.mass*((sx*sx+sy*sy)/4 + sz*sz/12);
			var z=phyobj.mass*1/2*(sx*sx+sy*sy);
			Vec3.set(phyobj.inertia,xy,xy,z);
			break;
		case Collider.CUBOID:
			var x=1/3*(sy*sy+sz*sz)*phyobj.mass;
			var y=1/3*(sx*sx+sz*sz)*phyobj.mass;
			var z=1/3*(sx*sx+sy*sy)*phyobj.mass;
			Vec3.set(phyobj.inertia,x,y,z);
			break;
		default:
			var i=phyobj.mass*2/5*(sx*sx+sy*sy+sz*sz);
			Vec3.set(phyobj.inertia,i,i,i);
			break;
		}
		if(phyobj.restitution==0){
			phyobj.restitution=0.00000000000001;
		}
		phyobj.inv_restCoe = 1.0/phyobj.restitution; //反発係数の逆数
		phyobj.inv_fricCoe = 1.0/phyobj.friction;; //摩擦係数の逆数
		phyobj.inv_mass = 1.0/phyobj.mass;

		phyobj.inv_mass = 1.0/phyobj.mass;
		if(phyobj.fix==1){
			phyobj.mass=99999;
			phyobj.inv_mass = 0;
			var i=99999;
			Vec3.set(phyobj.inertia,i,i,i);
		}
	}

	return ret
})()

