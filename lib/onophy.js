"use strict"
var OnoPhy = (function(){

	var DIMENSION=3; //次元
	var GRAVITY = 9.81; //重力加速度
	var REPETITION_MAX=10; //繰り返しソルバ最大回数
	var PENALTY =400; //押出し係数
	var _dt; //ステップ時間
	
	var ret = function(){
		this.phyObjs = []; //剛体
		this.springs= []; //ばね
		this.joints = []; //ジョイント
		this.repetition=0; //ソルバ繰り返した回数

		this.collider=new Collider(); //コライダ
		this.hitInfos=[]; //コリジョン接触情報
		this.disableList=new Array(1024); //コリジョン無効リスト
	}

	var i=0;
	var SPRING_MESH = ret.SPRING_MESH = i++
		,RIGID= ret.RIGID= i++
	;

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
			this.restitution= 0; //反発係数

			this.v = new Vec3(); //速度
			this.oldv = new Vec3(); //速度

			this.rotL = new Vec3(); //角運動量
			this.rotV = new Vec3(); //回転速度
			this.oldrotV = new Vec3(); //角運動量(古い)

			this.rotmat=new Mat33(); //回転状態
			this.scale=new Vec3(); //スケール
			this.location=new Vec3(); //位置
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

		var addimpulseBuf =new Vec3();
		ret.prototype.addImpulse = function(pos,impulse){
			//衝撃を与える
			if(this.fix){
				//固定の場合は無視
				return;
			}

			Vec3.muladd(this.v,this.v,impulse, this.inv_mass);
			Vec3.cross(addimpulseBuf,pos,impulse); //並行

			Mat33.dotVec(addimpulseBuf,this.inv_inertiaTensor,addimpulseBuf);
			Vec3.add(this.rotV,this.rotV,addimpulseBuf); //回転
		}

		ret.prototype.addImpulseR = function(impulse){
			//衝撃を与える(回転のみ
			if(this.fix){
				//固定の場合は無視
				return;
			}
			Mat33.dotVec(addimpulseBuf,this.inv_inertiaTensor,impulse);
			Vec3.add(this.rotV,this.rotV,addimpulseBuf);
		}

		ret.prototype.refresh = function(){
			var type = this.children[0].type;
			var obj = this .parent;
			var sx = obj.bound_box[3]*obj.scale[0];
			var sy = obj.bound_box[4]*obj.scale[1];
			var sz = obj.bound_box[5]*obj.scale[2];
				
			switch(type){
			case Collider.SPHERE:
				var a =Math.max(sx,Math.max(sy,sz));
				var i=(2.0/5.0)* this.mass*a*a;
				Vec3.set(this.inertia,i,i,i);
				break;
			case Collider.CAPSULE:
				var a =Math.max(sx,sy);
				var xy=this.mass*(a*a/4.0 + sz*sz/12.0);
				var z=this.mass*1/2*(sx*sx+sy*sy);
				Vec3.set(this.inertia,xy,xy,z);
				break;
			case Collider.CUBOID:
				var x=1/3*(sy*sy+sz*sz)*this.mass;
				var y=1/3*(sx*sx+sz*sz)*this.mass;
				var z=1/3*(sx*sx+sy*sy)*this.mass;
				Vec3.set(this.inertia,x,y,z);
				break;
			default:
				var a =Math.max(sx,Math.max(sy,sz));
				var i=(2.0/5.0)* this.mass*a*a;
				Vec3.set(this.inertia,i,i,i);
				break;
			}

			this.inv_mass = 1.0/this.mass;
			if(this.fix===1){
				this.mass=99999;
				this.inv_mass = 0;
				var i=99999;
				Vec3.set(this.inertia,i,i,i);
			}
		}
		return ret;
	})();

	var Constraint=(function(){
		//拘束クラス
		var Constraint=function(){
			this.obj1 = null; //接触物体1
			this.obj2 = null; //接触物体2
			this.pos1= new Vec3(); //接触位置1
			this.pos2 = new Vec3(); //接触位置2
		}
		var ret=Constraint;

		ret.prototype.calcDiffVelocity = function(dv){
			//二点間の速度差を求める
			_calcDiffVelocity(dv,this.obj1,this.obj2,this.pos1,this.pos2);
		}

		var addimpulseBuf = new Vec3();
		ret.prototype.addImpulse = function(impulse){
			//二点に力を加える
			this.obj1.addImpulse(this.pos1,impulse);
			Vec3.mul(addimpulseBuf,impulse,-1);
			this.obj2.addImpulse(this.pos2,addimpulseBuf);
			
		}
		ret.prototype.addImpulseR = function(impulse){
			//二点に力を加える
			this.obj1.addImpulseR(impulse);
			Vec3.mul(addimpulseBuf,impulse,-1);
			this.obj2.addImpulseR(addimpulseBuf);
			
		}

		return ret;
	})();

	var HitInfo = (function(){
		//物体の接触
		var HitInfo = function() {
			Constraint.apply(this);

			this.pos1org = new Vec3(); //接触位置1
			this.pos2org = new Vec3(); //接触位置2
			this.pos1ex = new Vec3(); //接触相対位置1
			this.pos2ex = new Vec3(); //接触相対位置2

			this.nVec = new Vec3(); //法線方向
			this.nM=new Mat33();
			this.impulse=new Vec3();

			this.t1Vec = new Vec3(); //従法線1 /法線方向と垂直な方向
			this.t2Vec = new Vec3(); //従法線2 / 法線と従法線1に垂直な方向
			this.tM=new Mat33();

			this.repulsion=0;
			this.restCoe = 0; //2物体間の反発係数
			this.fricCoe = 0; //2物体間の摩擦係数

		}
		var ret = HitInfo;
		inherits(ret,Constraint);

		var dv=new Vec3();
		var impulse = new Vec3();
		ret.prototype.calcPre = function(){
			//Vec3.mul(impulse, this.nVec, this.nImpulse );
			//Vec3.mul(this.impulse,this.impulse,0);
			this.addImpulse(this.impulse);

			if(!this.obj1.fix){
				this.obj1.impFlg=1;
			}
			if(!this.obj2.fix){
				this.obj2.impFlg=1;
			}
		}
		var old=new Vec3();
		ret.prototype.calcConstraint=function(){
			//法線方向
			Vec3.copy(old,this.impulse); //前の値
			this.calcDiffVelocity(dv); //衝突点の速度差
			Vec3.muladd(dv,dv,this.nVec,this.repulsion);//反発分
			
			Mat33.dotVec(impulse,this.nM,dv); //今回の必要撃力
			Vec3.add(this.impulse,this.impulse,impulse); //総撃力
			var a = Vec3.dot(this.impulse,this.nVec); //
			if(a<0){ //撃力が逆になった場合は無しにする
				Vec3.muladd(this.impulse,this.impulse,this.nVec,-a);
			}
			Vec3.sub(impulse, this.impulse, old); 
			this.addImpulse(impulse); //撃力差分を剛体の速度に反映

			//従法線方向(摩擦力)
			Vec3.copy(old,this.impulse); //前の値
			this.calcDiffVelocity(dv);
			var n = Vec3.dot(this.impulse,this.nVec);
			Mat33.dotVec(impulse,this.tM,dv); //今回の必要摩擦
			Vec3.add(this.impulse,this.impulse,impulse); //総摩擦力

			var max = n * this.fricCoe; //法線撃力から摩擦最大量を算出
			if(dv[0]*dv[0]+dv[1]*dv[1]+dv[2]*dv[2]>0.0001){
				max*=0.9; //静止していない場合はちょっと減らす
			}
			
			Vec3.muladd(impulse,this.impulse,this.nVec,-n); //摩擦方向の力
			var l =Vec3.scalar2(impulse);
			if (l > max*max) { //摩擦力が最大量を上回る場合は最大量でセーブ
				Vec3.muladd(this.impulse,this.impulse,impulse,max/Math.sqrt(l) - 1);
			}
			Vec3.sub(impulse, this.impulse,old); 
			this.addImpulse(impulse); //差分摩擦力を速度に反映
			
		}

		ret.prototype.calcAfter=function(dt){
			//重なり時の押出し
			var hitInfo = this;
			if(hitInfo.counter!==0){
				return;
			}
			Vec3.sub(dv,hitInfo.pos2org,hitInfo.pos1org);
			//Vec3.mul(dv,hitInfo.nVec,Vec3.dot(dv,hitInfo.nVec));

			Mat33.dotVec(impulse,this.nM,dv); //今回の必要撃力
			Vec3.mul(impulse, impulse, PENALTY*dt);
			//Vec3.add(this.impulse,this.impulse,impulse);
			this.addImpulse(impulse);
		}

		return ret;
	})();

	var disableHitInfos=[];
	for(var i=0;i<1024;i++){
		disableHitInfos.push(new HitInfo());
	}

	var LinConstraint = (function(){
		//並進速度拘束
		var LinConstraint = function() {
			Constraint.apply(this);

			this.effic = new Mat33(); 
			this.impulse = new Vec3(); //オブジェクトに与える力
			this.vecs =[]; //力の方向軸
			this.vecsbuf=[];
			for(var i=0;i<3;i++){
				this.vecsbuf.push(new Vec3());
			}
			this.motorVelocity=0; //モーター
			this.motorMax=0; //モーター最大力
		}
		var ret = LinConstraint ;
		inherits(ret,Constraint);

		var vec=new Vec3();
		ret.prototype.init=function(obj1,pos1,obj2,pos2,vecs){

			this.obj1=obj1;
			this.obj2=obj2;

			Vec3.sub(this.pos1,pos1,obj1.location);
			Vec3.sub(this.pos2,pos2,obj2.location);
			
			this.vecs.splice(0,this.vecs.length);
			for(var i=0;i<vecs.length;i++){
				Vec3.copy(this.vecsbuf[i],vecs[i]);
				this.vecs.push(this.vecsbuf[i]);
			}

			calcEfficM(this.effic,obj1,this.pos1,obj2,this.pos2);
			LinConstraint.restrict(this.effic,this.vecs);


			//前回与えた力のうち、今回の力の方向と同じ成分のみ使う
			Vec3.set(vec,0,0,0);
			for(var i=0;i<this.vecs.length;i++){
				var v=this.vecs[i];
				Vec3.muladd(vec,vec,v,Vec3.dot(v,this.impulse));
			}
			Vec3.copy(this.impulse,vec);
			this.addImpulse(this.impulse);

			return;
		};

		var old= new Vec3();
		ret.prototype.calcConstraint=function(){
			if(this.vecs.length===0){
				return;
			}
			this.calcDiffVelocity(vec); //速度差
			Vec3.muladd(vec,vec,this.vecs[0],this.motorVelocity); //モータ影響

			Vec3.copy(old,this.impulse); //前回の撃力
			Mat33.dotVec(vec,this.effic,vec); //必要撃力
			Vec3.add(this.impulse,this.impulse,vec); //撃力に足す

			//与える力の制限
			for(var i=0;i<this.vecs.length;i++){
				var a = Vec3.dot(this.impulse,this.vecs[i]);
				if(this.motorMax!==0 && i===0){
					//モーター最大力積を超えないようにする
					if(a > this.motorMax){
						Vec3.muladd(this.impulse,this.impulse,this.vecs[i],-(a-this.motorMax));
					}
					if(a < -this.motorMax){
						Vec3.muladd(this.impulse,this.impulse,this.vecs[i],-(a+this.motorMax));
					}
				}else{
					//逆方向の力は加えない
					if(a < 0){
						Vec3.muladd(this.impulse,this.impulse,this.vecs[i],-a);
					}
				}
				

			}

			Vec3.sub(vec,this.impulse,old); //今回加える撃力
			this.addImpulse(vec);
			
			this.calcDiffVelocity(vec)
		}

		var calcEfficM = ret.calcEfficM= (function(){
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
			}
		})();

		ret.restrict = function(m,vecs){
			//制限が有効な軸を考慮する
			if(vecs.length===1){
				// 位置制限1軸の場合
				// F=(vX/((MX)X)X
				var X = vecs[0];
				Mat33.dotVec(vec,m,X);
				var b = 1/Vec3.dot(vec,X);
				m[0]=X[0]*X[0]*b;
				m[1]=X[0]*X[1]*b;
				m[2]=X[0]*X[2]*b;
				m[3]=X[1]*X[0]*b;
				m[4]=X[1]*X[1]*b;
				m[5]=X[1]*X[2]*b;
				m[6]=X[2]*X[0]*b;
				m[7]=X[2]*X[1]*b;
				m[8]=X[2]*X[2]*b;
				
			}else if(vecs.length===2){
				// 位置制限2軸の場合
				//F = ((vX*MYY-vYMYX)X - (vxMXY-vYMXX)Y) / (MXX*MYY - MXY*MYX) 
				var X = vecs[0];
				var Y = vecs[1];
				Mat33.dotVec(vec,m,X);
				var mxx=Vec3.dot(vec,X);
				var mxy=Vec3.dot(vec,Y);
				Mat33.dotVec(vec,m,Y);
				var myx=Vec3.dot(vec,X);
				var myy=Vec3.dot(vec,Y);

				var denom = 1/ (mxx*myy  - mxy*myx);
				m[0]=(myy*X[0]*X[0] - myx*Y[0]*X[0] - mxy*X[0]*Y[0] + mxx*Y[0]*Y[0])  *denom;
				m[1]=(myy*X[0]*X[1] - myx*Y[0]*X[1] - mxy*X[0]*Y[1] + mxx*Y[0]*Y[1])  *denom;
				m[2]=(myy*X[0]*X[2] - myx*Y[0]*X[2] - mxy*X[0]*Y[2] + mxx*Y[0]*Y[2])  *denom;
				m[3]=(myy*X[1]*X[0] - myx*Y[1]*X[0] - mxy*X[1]*Y[0] + mxx*Y[1]*Y[0])  *denom;
				m[4]=(myy*X[1]*X[1] - myx*Y[1]*X[1] - mxy*X[1]*Y[1] + mxx*Y[1]*Y[1])  *denom;
				m[5]=(myy*X[1]*X[2] - myx*Y[1]*X[2] - mxy*X[1]*Y[2] + mxx*Y[1]*Y[2])  *denom;
				m[6]=(myy*X[2]*X[0] - myx*Y[2]*X[0] - mxy*X[2]*Y[0] + mxx*Y[2]*Y[0])  *denom;
				m[7]=(myy*X[2]*X[1] - myx*Y[2]*X[1] - mxy*X[2]*Y[1] + mxx*Y[2]*Y[1])  *denom;
				m[8]=(myy*X[2]*X[2] - myx*Y[2]*X[2] - mxy*X[2]*Y[2] + mxx*Y[2]*Y[2])  *denom;
			}else if(vecs.length===3){
				Mat33.getInv(m,m);
			}else if(vecs.length===0){
				Mat33.mul(m,m,0);
			}

		}
		return ret;
	})();

	var AngConstraint = (function(){
		//回転速度拘束
		var AngConstraint = function() {
			Constraint.apply(this);
			this.effic = new Mat33();
			this.impulse = new Vec3();
			this.vecs =[];
			this.vecsbuf=[];
			for(var i=0;i<3;i++){
				this.vecsbuf.push(new Vec3());
			}
			this.motorVelocity=0;
			this.motorMax=0;
		}
		var ret = AngConstraint;
		inherits(ret,Constraint);

		var vec=new Vec3();
		ret.prototype.init=function(obj1,obj2,vecs){
			this.obj1=obj1;
			this.obj2=obj2;

			this.vecs.splice(0,this.vecs.length);
			for(var i=0;i<vecs.length;i++){
				Vec3.copy(this.vecsbuf[i],vecs[i]);
				this.vecs.push(this.vecsbuf[i]);
				
			}

			Mat33.add(this.effic,obj1.inv_inertiaTensor,obj2.inv_inertiaTensor);
			LinConstraint.restrict(this.effic,this.vecs);

			Vec3.set(vec,0,0,0);
			for(var i=0;i<this.vecs.length;i++){
				var v=this.vecs[i];
				var l=Vec3.dot(this.vecs[i],this.impulse);
				Vec3.muladd(vec,vec,v,Vec3.dot(v,this.impulse));
			}
			Vec3.copy(this.impulse,vec);
			this.addImpulseR(this.impulse);

			return this;

		};

		var old= new Vec3();
		ret.prototype.calcConstraint=function(){
			if(this.vecs.length===0){
				return;
			}
			var obj1=this.obj1;
			var obj2=this.obj2;

			Vec3.sub(vec,obj2.rotV,obj1.rotV); //回転速度差

			Vec3.muladd(vec,vec,this.vecs[0],this.motorVelocity); //モーターの影響
			Vec3.copy(old,this.impulse); //前回の撃力
			Mat33.dotVec(vec,this.effic,vec); //必要撃力
			Vec3.add(this.impulse,this.impulse,vec); //撃力に足す

			//与える力の制限
			for(var i=0;i<this.vecs.length;i++){
				var a = Vec3.dot(this.impulse,this.vecs[i]);
				if(this.motorMax!==0 && i===0){
					//モーター最大力積を超えないようにする
					if(a > this.motorMax){
						Vec3.muladd(this.impulse,this.impulse,this.vecs[i],-(a-this.motorMax));
					}
					if(a < -this.motorMax){
						Vec3.muladd(this.impulse,this.impulse,this.vecs[i],-(a+this.motorMax));
					}
				}else{
					if(a < 0){
						//逆方向の力は加えない
						Vec3.muladd(this.impulse,this.impulse,this.vecs[i],-a);
					}
				}
				
			}
			

			Vec3.sub(vec,this.impulse,old); //今回加える撃力
			this.addImpulseR(vec); //両物体に加える

			//Vec3.sub(vec,obj2.rotV,obj1.rotV);
			
		}


		return ret;
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
			this.spring_damping_ang=new Vec3();
			this.spring_stiffness_ang=new Vec3();
			this.use_breaking=0;
			this.use_limit_ang=new Vec3();
			this.use_limit_lin=new Vec3();
			this.use_motor_ang=0;
			this.use_motor_lin=0;
			this.use_spring=new Vec3();
			this.use_spring_ang=new Vec3();

			this.linConstraint = new LinConstraint();
			this.angConstraint = new AngConstraint();
			this.matrix = new Mat44();

			this.truepos=new Vec3();
			this.truemat=new Mat33();

		}
		var ret = Joint;

		var n = new Vec3();
		var vec= new Vec3();
		var axis = new Vec3();
		var dp = new Vec3();
		var dv = new Vec3();
		var drs= new Vec3();

		var bM = new Mat44();

		var jointp = new Vec3();

		var mat33=new Mat33();
		var rotmat= new Mat33();

		var vecs = [];
		for(var i=0;i<3;i++){
			vecs.push(new Vec3());
		}

		ret.prototype.calcPre=function(){
			var object1= this.object1;
			var object2= this.object2;

			var obj1p;
			var obj2p;

			//ジョイント位置
			Mat44.dot(bM,this.parent.matrix,this.matrix);
			Vec3.set(jointp,bM[12],bM[13],bM[14]);

			if(object1 === this.parent){
				obj1p=jointp;
				obj2p=object2.location;
			}else{
				obj1p=object1.location;
				obj2p=jointp;
			}

			//ジョイント角度
			var obj1m;
			var obj2m;
			for(var i=0;i<3;i++){
				var j=i*4;
				var l = 1/Math.sqrt(bM[j]*bM[j]+bM[j+1]*bM[j+1]+bM[j+2]*bM[j+2]);
				mat33[i*3]=bM[j]*l;
				mat33[i*3+1]=bM[j+1]*l;
				mat33[i*3+2]=bM[j+2]*l;
			}
			if(this.parent===this.object1){
				obj1m= mat33;
				obj2m= this.object2.rotmat;
			}else{
				obj1m = this.object1.rotmat;
				obj2m = mat33;
			}


			this.linConstraint.obj1=object1;
			this.linConstraint.obj2=object2;
			Vec3.sub(this.linConstraint.pos1,obj1p,object1.location);
			Vec3.sub(this.linConstraint.pos2,obj2p,object2.location);
			this.angConstraint.obj1=object1;
			this.angConstraint.obj2=object2;

			//差
			Vec3.sub(dp,obj2p,obj1p); //位置差
			this.linConstraint.calcDiffVelocity(dv);//速度差

			//位置制限
			Vec3.set(this.truepos,0,0,0);
			var vvv=[];
			for(var i=0;i<DIMENSION;i++){
				//ばね
				if(this.use_spring[i]){
					Vec3.set(axis,obj1m[i*3]
						,obj1m[i*3+1]
						,obj1m[i*3+2]);
					Vec3.mul(vec,axis,_dt*Vec3.dot(axis,dp)*this.spring_stiffness[i]);
					Vec3.muladd(vec,vec,axis,_dt*Vec3.dot(axis,dv)*this.spring_damping[i]);
					this.linConstraint.addImpulse(vec);
				}

				//軸
				Vec3.set(axis,obj1m[i*3]
					,obj1m[i*3+1]
					,obj1m[i*3+2]);
				if(this.use_limit_lin[i]){
					//位置差
					var l = Vec3.dot(axis,dp);
					if(l < this.limit_lin_lower[i]
					|| l > this.limit_lin_upper[i]){
						//制限範囲を超えている場合
						if(l< this.limit_lin_lower[i]){
							l= l - this.limit_lin_lower[i];
							l*=-1;
							Vec3.mul(axis,axis,-1);
						}else{
							l= l - this.limit_lin_upper[i];
						}
						Vec3.muladd(this.truepos,this.truepos,axis,l);//本来の位置

				Vec3.copy(vecs[i],axis);
				vvv.push(vecs[i]);

					}
				}
				if(this.use_motor_lin && i===0){
					this.linConstraint.motorVelocity=this.motor_lin_target_velocity;
					this.linConstraint.motorMax=this.motor_lin_max_impulse;
					Vec3.copy(vecs[i],axis);
					vvv.push(vecs[i]);
				}
			}

			Vec3.add(this.truepos,this.truepos,obj2p);

			this.linConstraint.init(object1,obj1p,object2,obj2p,vvv);

			//角度制限
			Mat33.getInv(rotmat,obj1m);
			Mat33.dot(rotmat,rotmat,obj2m); //差分回転行列
			Mat33.getEuler(drs,rotmat); //オイラー角に変換
			Vec3.mul(drs,drs,-1); //逆になる

			Mat33.copy(this.truemat,obj2m);
			var cM = this.child.matrix;
			Vec3.sub(dv,this.object2.rotV,this.object1.rotV);//回転差
			vvv=[];
			for(var i=0;i<DIMENSION;i++){
				//軸の向き
				if(i===0){
					Vec3.set(axis,obj2m[0],obj2m[1],obj2m[2]);
				}else if(i===1){
					Vec3.set(axis,obj1m[6],obj1m[7],obj1m[8]);
					Vec3.set(n,obj2m[0],obj2m[1],obj2m[2]);
					Vec3.cross(axis,axis,n);
				}else if(i===2){
					Vec3.set(axis,obj1m[6],obj1m[7],obj1m[8]);
					Vec3.set(n,obj2m[0],obj2m[1],obj2m[2]);
					Vec3.cross(axis,n,axis);
					Vec3.cross(axis,axis,n);
				}
				Vec3.norm(axis);

				//角度
				var dr = drs[i];
				if(this.use_spring_ang[i]){
					//ばね
					Vec3.mul(vec,axis,-dr*this.spring_stiffness_ang[i]*_dt);//角度差
					Vec3.muladd(vec,vec,axis,Vec3.dot(dv,axis)*this.spring_damping_ang[i]*_dt);
					this.angConstraint.addImpulseR(vec);
				}

				if(this.use_limit_ang[i]){

					if(dr < this.limit_ang_lower[i]
					|| dr > this.limit_ang_upper[i]){
						//制限範囲を超えている場合
						if(dr< this.limit_ang_lower[i]){
							dr= dr - this.limit_ang_lower[i];
						}else{
							dr= dr - this.limit_ang_upper[i];
							dr*=-1;
							Vec3.mul(axis,axis,-1);
						}

						Mat33.getRotMat(rotmat,-dr,axis[0],axis[1],axis[2]);
						Mat33.dot(this.truemat,rotmat,this.truemat);

						Vec3.copy(vecs[i],axis);
						vvv.push(vecs[i]);
					}
				}
				if(this.use_motor_ang && i===0){
					//回転モーター
					this.angConstraint.motorVelocity=this.motor_ang_target_velocity;
					this.angConstraint.motorMax=this.motor_ang_max_impulse;
					Vec3.copy(vecs[i],axis);
					vvv.push(vecs[i]);
				}
			}

			this.angConstraint.init(this.object1,this.object2,vvv);

			if(!object1.fix){
				object1.impFlg=true;
			}
			if(!object2.fix){
				object2.impFlg=true;
			}
		}
		ret.prototype.calcConstraint=function(){
			this.linConstraint.calcConstraint();
			this.angConstraint.calcConstraint();
		}
		ret.prototype.calcAfter=function(dt){
			var obj1 = this.linConstraint.obj1;
			var obj2 = this.linConstraint.obj2;
			var object1=obj1;
			var object2=obj2;
			var obj1p,obj2p;
			//ジョイント位置
			Mat44.dot(bM,this.parent.matrix,this.matrix);
			Vec3.set(jointp,bM[12],bM[13],bM[14]);

			if(object1 === this.parent){
				obj1p=jointp;
				obj2p=object2.location;
			}else{
				obj1p=object1.location;
				obj2p=jointp;
			}

			//ジョイント角度
			var obj1m;
			var obj2m;
			for(var i=0;i<3;i++){
				var j=i*4;
				var l = 1/Math.sqrt(bM[j]*bM[j]+bM[j+1]*bM[j+1]+bM[j+2]*bM[j+2]);
				mat33[i*3]=bM[j]*l;
				mat33[i*3+1]=bM[j+1]*l;
				mat33[i*3+2]=bM[j+2]*l;
			}
			if(this.parent===this.object1){
				obj1m= mat33;
				obj2m= this.object2.rotmat;
			}else{
				obj1m = this.object1.rotmat;
				obj2m = mat33;
			}

			//位置補正
			Vec3.sub(vec,this.truepos,obj2p);
			Mat33.dotVec(vec,this.linConstraint.effic,vec);
			Vec3.mul(vec, vec, PENALTY*dt);
			this.linConstraint.addImpulse(vec);
			//Vec3.mul(vec, vec, 1/(this.parent.inv_mass+this.child.inv_mass));
			//if(!this.parent.fix){
			//	Vec3.muladd(this.parent.v,this.parent.v,vec,this.parent.inv_mass);
			//}
			//if(!this.child.fix){
			//	Vec3.muladd(this.child.v,this.child.v,vec,-this.child.inv_mass);
			//}

			//角度補正
			for(var i=0;i<3;i++){
				var j=i*4;
				var l = 1/Math.sqrt(bM[j]*bM[j]+bM[j+1]*bM[j+1]+bM[j+2]*bM[j+2]);
				mat33[i*3]=bM[j]*l;
				mat33[i*3+1]=bM[j+1]*l;
				mat33[i*3+2]=bM[j+2]*l;
			}
			var obj2m;
			if(this.parent===this.object1){
				obj2m=this.object2.rotmat;
			}else{
				obj2m=mat33;
			}
			Mat33.getInv(rotmat,obj2m);
			Mat33.dot(rotmat,this.truemat,rotmat); //差分回転行列

			Mat33.getRotVec(n,rotmat); //回転行列から回転ベクトルを求める
			Mat33.dotVec(n,this.angConstraint.effic,n); //必要撃力
			Vec3.mul(n,n,PENALTY*dt);
			//Mat33.add(mat33,obj1.inv_inertiaTensor,obj2.inv_inertiaTensor);
			//Mat33.getInv(mat33,mat33);
			//Mat33.dotVec(n,mat33,n); //必要撃力


			var obj1=this.object1;
			var obj2=this.object2;
			if(!obj1.fix){
				Mat33.dotVec(vec,obj1.inv_inertiaTensor,n);
				Vec3.add(obj1.rotV,obj1.rotV,vec);
			}
			if(!obj2.fix){
				Mat33.dotVec(vec,obj2.inv_inertiaTensor,n);
				Vec3.sub(obj2.rotV,obj2.rotV,vec);
			}
			

		}
		return ret;
	})();

	var Spring =  function(){
		//ばね
		this.defaultLength=0; //デフォルト長さ
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

	var bV0 = new Vec3()
	,bV1 = new Vec3()
	,bV2 = new Vec3()
	,bV3 = new Vec3()
	,bM = new Mat43()
	

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
			if(joints[i]===joint){
				joints.splice(i,1);
				break;
			}
		}
	}

	ret.prototype.createCollision= function(type){
		return this.collider.createCollision(type);
	}
	ret.prototype.createConvex= function(mesh){
		return this.collider.createConvex(mesh);
	}
	ret.prototype.createMesh = function(mesh){
		return this.collider.createMesh(mesh);
	}
	ret.prototype.createSpring = function(){
		//スプリングオブジェクト作成
		var res=new Spring();
		this.springs.push(res)
		return res
	}
	ret.prototype.deleteSpring = function(obj){
		//スプリングオブジェクト削除
		var springs=this.springs;
		for(var i=0;i<springs.length;i++){
			if(springs[i]===obj){
				springs.splice(i,1);
				break;
			}
		}
	}
	ret.prototype.createSpringMesh = function(){
		//スプリングメッシュオブジェクト作成
		var obj=new SpringMesh()
		this.phyObjs.push(obj)
		return obj; 
	}
	ret.prototype.deletePhyObject = function(object){
		//オブジェクト削除
		var phyObjs=this.phyObjs;
		for(var i=phyObjs.length;i--;){
			if(phyObjs[i]===object){
				//コリジョンを削除
				for(var j=0;j<object.children.length;j++){
					this.deleteCollision(object.children[i]);
				}
				phyObjs.splice(i,1);
				break;
			}
		}
	}

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

			if(Vec3.len2(pos1,pos2)===0 ){
				return;

			}
			var hitInfos = this.hitInfos;
			Vec3.sub(vec3,pos1,obj1.location);
			Vec3.sub(vec32,pos2,obj2.location);

			var counter=0;
			var idx=-1;
			if(!hitInfo){
				for(var i=0;i<hitInfos.length;i++){
					if(hitInfos[i].obj1!== obj1|| hitInfos[i].obj2!==obj2){
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
					Vec3.set(hitInfo.impulse,0,0,0);
					//Vec3.set(hitInfo.tImpulse,0,0,0);
					//hitInfo.t2Impulse = 0;

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
						if(hitInfos[i].obj1!== obj1 || hitInfos[i].obj2!==obj2){
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



			if(!flg){
				//if(Vec3.len2(pos1,pos2)!==0){
					Vec3.copy(vec3,hitInfo.nVec);
					Vec3.sub(hitInfo.nVec,pos2,pos1);
					Vec3.norm(hitInfo.nVec);

					//前回与えた力のうち、今回の力の方向と同じ成分のみ使う
					Vec3.set(vec3,0,0,0);
					//for(var i=0;i<this.vecs.length;i++){
					var v=hitInfo.nVec;
					Vec3.muladd(vec3,vec3,v,Vec3.dot(v,hitInfo.impulse));
					Vec3.copy(hitInfo.impulse,vec3);
			//}
			}


			hitInfo.t1Vec[0] = hitInfo.nVec[1];
			hitInfo.t1Vec[1] = -hitInfo.nVec[2];
			hitInfo.t1Vec[2] = -hitInfo.nVec[0];
			Vec3.cross(hitInfo.t1Vec,hitInfo.t1Vec,hitInfo.nVec);
			Vec3.cross(hitInfo.t2Vec,hitInfo.t1Vec,hitInfo.nVec);
			Vec3.norm(hitInfo.t1Vec);
			Vec3.norm(hitInfo.t2Vec);

			LinConstraint.calcEfficM(hitInfo.nM,obj1,hitInfo.pos1,obj2,hitInfo.pos2);
			Mat33.copy(hitInfo.tM,hitInfo.nM);
			LinConstraint.restrict(hitInfo.nM,[hitInfo.nVec]);
			LinConstraint.restrict(hitInfo.tM,[hitInfo.t1Vec,hitInfo.t2Vec]);
			//hitInfo.nEffic = calcEffic(hitInfo.nVec, hitInfo);
			//hitInfo.t1Effic = calcEffic(hitInfo.t1Vec, hitInfo);
			//hitInfo.t2Effic = calcEffic(hitInfo.t2Vec, hitInfo);
			//calcEffic2(vec3,hitInfo.t1Vec, hitInfo);
			//hitInfo.t2Effic2[0] = Vec3.dot(hitInfo.t1Vec,vec3);
			//hitInfo.t2Effic2[1] = Vec3.dot(hitInfo.t2Vec,vec3);
			//calcEffic2(vec3,hitInfo.t2Vec, hitInfo);
			//hitInfo.t1Effic2[0] = Vec3.dot(hitInfo.t1Vec,vec3);
			//hitInfo.t1Effic2[1] = Vec3.dot(hitInfo.t2Vec,vec3);
			//var inv=1.0/Vec2.cross(hitInfo.t1Effic2,hitInfo.t2Effic2);
			//Vec2.mul(hitInfo.t1Effic2,hitInfo.t1Effic2,-inv);
			//Vec2.mul(hitInfo.t2Effic2,hitInfo.t2Effic2,inv);


			hitInfo.counter=0;

			return hitInfo;

		};
	})();

	var calcBuf = new Vec3();
	var calcBuf2 = new Vec3();

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


	ret.prototype.calc=function(dt){
		_dt=dt;
		var i,j,k
		,obj,obj2
		,x,y,z,nx,ny,nz
		,matrix
		,detdt=1/dt
		,hitInfos = this.hitInfos
		,phyObjs = this.phyObjs;
		

		var dv=new Vec3();
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


		//ジョイント処理
		var idx=0;
		var joints = this.joints;
		var rotmat=new Mat44();
		for(var i=0;i<joints.length;i++){
			joints[i].calcPre();

			//コリジョン無効
			if(joints[i].disable_collisions){
				var id1=joints[i].object1.children[0].id;
				var id2=joints[i].object2.children[0].id;
				var pairId=-1;
				if(id1<id2){
					pairId = (id1<<16) | id2;
				}else{
					pairId = (id2<<16) | id1;
				}
				this.disableList[idx]=pairId
				idx++;

			}
		}
		this.disableList[idx]=-1;

		//すべてのコリジョンの衝突判定
		this.collider.All(this.disableList);


		var hitList = this.collider.hitList;
		for(var i=0;hitList[i].col1;i++){
			var hit = hitList[i];
			if(!hit.col1.parent.moveflg && !hit.col2.parent.moveflg){
				continue;
			}
			this.registHitInfo(hit.col1.parent,hit.pos1,hit.col2.parent,hit.pos2);
		}
			

		for(i = this.springs.length;i--;){
			obj = this.springs[i];

			springMove(obj);

		}

		for(var i=0;i<hitInfos.length;i++){
			var hitInfo=hitInfos[i];
			hitInfo.calcDiffVelocity(dv);
			hitInfo.repulsion = Vec3.dot(dv, hitInfo.nVec) * hitInfo.restCoe;
		}	
		for(i = phyObjs.length;i--;){
			obj = phyObjs[i];

			if(obj.fix)continue

			if(obj.type===SPRING_MESH){
				this.springmeshMove(obj,dt);
				continue;
			}
			
			obj.v[1]-=GRAVITY*dt;

		}

		for (var i = 0;i<hitInfos.length; i++) {
			//ウォームスタート
			hitInfos[i].calcPre();
		}



		start=Date.now();
		var repetition;
		for (repetition = 0; repetition < REPETITION_MAX; repetition++) {
			//繰り返し最大数まで繰り返して撃力を収束させる
			var impnum=0;
			for(i = phyObjs.length;i--;){
				//現在の速度を保存
				var o = phyObjs[i];
				if(!o.impFlg){continue;}
				Vec3.copy(o.oldv,o.v);
				Vec3.copy(o.oldrotV,o.rotV);
				impnum++;
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
			if ( sum<= 0.000001*impnum) {
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

		var LINDAMP = Math.pow(1.0-0.04,dt);
		var ANGDAMP = Math.pow(1.0-0.1,dt);
		for(i = phyObjs.length;i--;){
			obj = phyObjs[i]
			
			if(obj.type===SPRING_MESH){

				springmeshMove2(obj,dt);
				continue;
			}
			
			if(obj.fix)continue;



			var l=Vec3.scalar(obj.rotV);
			//if(l<0.00001){
			//	Vec3.mul(obj.rotV,obj.rotV,0);
			//}
			Mat33.dotVec(obj.rotL,obj.inertiaTensor,obj.rotV);
			if(l>0){
				var d=1/l;
				Mat33.getRotMat(bM,l*dt,obj.rotV[0]*d,obj.rotV[1]*d,obj.rotV[2]*d);
				Mat33.dot(obj.rotmat,bM,obj.rotmat);
				Vec3.mul(obj.rotL,obj.rotL,ANGDAMP);
			}


			//Vec3.muladd(obj.v,obj.v,obj.a,dt/obj.mass);
			Vec3.mul(obj.v,obj.v,LINDAMP);
			//if(Vec3.scalar2(obj.v)<0.0000001){
			//	Vec3.mul(obj.v,obj.v,0);
			//}

			Vec3.muladd(obj.location,obj.location,obj.v,dt);
			
			//Vec3.set(obj.a,0,0,0);
			


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
			if(collision.type===Collider.MESH){
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
		var defaultLength = obj.defaultLength;
		
		//バネのび量
		var l = -defaultLength + Vec3.scalar(dp);
		Vec3.nrm(n,dp);//バネ向き

		Vec3.mul(dp,n,-obj.c*Vec3.dot(dv,n)); //ダンパ力
		Vec3.mul(n,n,l*obj.f); //バネ力
		Vec3.add(n,n,dp); //ダンパ＋バネ
		Vec3.mul(n,n,_dt);


		if(obj.con1){
			Vec3.sub(dp,obj.p0,obj.con1.location);
			obj.con1.addImpulse(dp,n);
		}
		if(obj.con2){
			Vec3.sub(dp,obj.p1,obj.con2.location);
			Vec3.mul(n,n,-1);
			obj.con2.addImpulse(dp,n);
		}

		
		Vec3.copy(obj._p0,obj.p0);
		Vec3.copy(obj._p1,obj.p1);
		
	}

	return ret
})()

