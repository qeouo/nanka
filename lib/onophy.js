"use strict"
var OnoPhy = (function(){

	var DIMENSION=3; //次元
	var GRAVITY = 9.81; //重力加速度
	var REPETITION_MAX=10; //繰り返しソルバ最大回数
	var PENALTY =200; //押出し係数
	var _dt; //ステップ時間
	var dv = new Vec3();
	var impulse = new Vec3();
	
	var ret = function(){
		this.phyObjs = [];
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
		//this.t1Effic= 0; //従法線方向に対する力の影響係数
		this.t1Effic2=new Vec2(); ///従法線1方向に対する力の影響係数
		this.t2Vec = new Vec3(); //従法線2 / 法線と従法線1に垂直な方向
		//this.t2Effic= 0; //従法線2方向に対する力の影響係数
		this.t2Effic2=new Vec2(); //従法線2方向に対する力の影響係数
		this.tImpulse = new Vec3(); //従法線1および2(法線以外)の方向にかかる力
		this.inv_tEffic=1.0;

		this.restCoe = 0; //2物体間の反発係数
		this.fricCoe = 0; //2物体間の摩擦係数
	}
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
					if(hitInfos[i].obj1!= obj1|| hitInfos[i].obj2!=obj2){
						continue;
					}
					hitInfos[i].save=true;

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

					hitInfo.fricCoe = obj1.friction * obj2.friction ; //2.0/(obj1.inv_fricCoe + obj2.inv_fricCoe);
					hitInfo.restCoe = 2.0/(obj1.inv_restCoe + obj2.inv_restCoe);


				}else{
					hitInfo = hitInfos[idx];
					hitInfos.splice(idx,1);
					hitInfos.push(hitInfo);


				}

				if(counter>=8){
					for(var i=0;i<hitInfos.length;i++){
						if(hitInfos[i].obj1!= obj1 || hitInfos[i].obj2!=obj2){
							continue;
						}
						disableHitInfos.push(hitInfos[i]);
						hitInfos.splice(i,1);
						break;
					}	
				}
				hitInfo.save=true;
			}
				Vec3.copy(hitInfo.pos1,vec3);
				Vec3.copy(hitInfo.pos2,vec32);
			Vec3.copy(hitInfo.pos1org,pos1);
			Vec3.copy(hitInfo.pos2org,pos2);

				hitInfo.nImpulse = 0;
				Vec3.set(hitInfo.tImpulse,0,0,0);
				hitInfo.t2Impulse = 0;

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
			calcEffic2(vec3,hitInfo.t1Vec, hitInfo);
			hitInfo.t2Effic2[0] = Vec3.dot(hitInfo.t1Vec,vec3);
			hitInfo.t2Effic2[1] = Vec3.dot(hitInfo.t2Vec,vec3);
			calcEffic2(vec3,hitInfo.t2Vec, hitInfo);
			hitInfo.t1Effic2[0] = Vec3.dot(hitInfo.t1Vec,vec3);
			hitInfo.t1Effic2[1] = Vec3.dot(hitInfo.t2Vec,vec3);

			var inv=1.0/Vec2.cross(hitInfo.t1Effic2,hitInfo.t2Effic2);
			Vec3.mul(hitInfo.t1Effic2,hitInfo.t1Effic2,-inv);
			Vec3.mul(hitInfo.t2Effic2,hitInfo.t2Effic2,inv);


			hitInfo.counter=0;

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
		for(var i=0;i<hitInfos.length;i++){
			var hitInfo = hitInfos[i];

			hitInfo.save=false;

			var obj1=hitInfo.obj1;
			var obj2=hitInfo.obj2;
			if(!obj1.moveflg && !obj2.moveflg){
				continue;
			}
			
			if(hitInfo.counter>5){
				hitInfos.splice(i,1);
				disableHitInfos.push(hitInfo);
				i--;
			}else{
//				if(l1<l2){
//					Mat43.dotMat43Vec3(bV1,obj1.matrix,hitInfo.pos1ex);
//					//Vec3.add(bV1,bV1,bV0);
//					Vec3.sub(bV2,ans2,bV1);
//					Vec3.norm(bV2);
//					l = Vec3.dot(bV2,hitInfo.nVec);
//					this.registHitInfo(obj1,bV1,obj2,ans2,hitInfo);
//				}else{
//					Mat43.dotMat43Vec3(bV1,obj2.matrix,hitInfo.pos2ex);
//					//Vec3.sub(bV1,bV1,bV0);
//					Vec3.sub(bV2,bV1,ans3);
//					Vec3.norm(bV2);
//					l = Vec3.dot(bV2,hitInfo.nVec);
//					this.registHitInfo(obj1,ans3,obj2,bV1,hitInfo);
//				}
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

			if(!hitInfos[i].obj1.moveflg && !hitInfos[i].obj2.moveflg){
				continue;
			}
			if(!hitInfos[i].save){
				disableHitInfos.push(hitInfos[i]);
				hitInfos.splice(i,1);
				i--;
			}
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
				var hitInfo = hitInfos[i];

				//法線方向
				calcDiffVelocity(dv,hitInfo); //衝突点の速度差
				var old = hitInfo.nImpulse; //現在の撃力
				hitInfo.nImpulse += Vec3.dot(dv, hitInfo.nVec) * hitInfo.nEffic 
					+ hitInfo.repulsion; //速度差から新しい撃力を算出
				if (hitInfo.nImpulse < 0) { //撃力が逆になった場合は0にする
					hitInfo.nImpulse = 0;
				}
				Vec3.mul(impulse, hitInfo.nVec, (hitInfo.nImpulse-old));
				addimpulse( hitInfo, impulse); //撃力差分を剛体の速度に反映

				//従法線方向
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
				//t1方向とt2方向の摩擦力を合算
				Vec3.muladd(hitInfo.tImpulse,hitInfo.tImpulse,hitInfo.t1Vec,x);
				Vec3.muladd(hitInfo.tImpulse,hitInfo.tImpulse,hitInfo.t2Vec,y);
				var l =Vec3.scalar(hitInfo.tImpulse);
				if (l > max) { //摩擦力が最大量を上回る場合は最大量でセーブ
					Vec3.mul(hitInfo.tImpulse,hitInfo.tImpulse,max/l);
				}
				Vec3.sub(impulse, hitInfo.tImpulse,bV0); //摩擦力の差分を算出
				addimpulse( hitInfo, impulse); //摩擦力を速度に反映

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
				//Mat33.dotVec(dv,o.inertiaTensor,dv);
				a+=(dv[0]*dv[0]+dv[1]*dv[1]+dv[2]*dv[2]);

				sum+=a;
				
			}
			if ( sum<= 0.0001) {
				break;
			}
		}
		this.repetition=repetition;
		this.impulseTime=Date.now()-start;

		for (var i = 0;i<hitInfos.length; i++) {
			//重なり時の押出し
			var hitInfo = hitInfos[i];
			if(hitInfo.counter!=0){
				continue;
			}

			Vec3.add(dv, hitInfo.pos2, hitInfo.obj2.location);
			Vec3.sub(dv, dv, hitInfo.obj1.location);
			Vec3.sub(dv, dv, hitInfo.pos1);
			Vec3.mul(dv,dv,Math.max(Vec3.scalar(dv)-0.001,0)/Vec3.scalar(dv));
			Vec3.mul(impulse, dv, PENALTY*dt*hitInfo.nEffic);
			addimpulse(hitInfo,impulse);
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
				Mat33.dot(obj.rotmat,bM,obj.rotmat);
			}


			Vec3.muladd(obj.v,obj.v,obj.a,dt/obj.mass);
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
		var type =Collider.SPHERE ; //phyobj.children[0].type;
		var obj =phyobj.parent;
		var sx = obj.bound_box[3]*obj.scale[0];
		var sy = obj.bound_box[4]*obj.scale[1];
		var sz = obj.bound_box[5]*obj.scale[2];
			
		switch(type){
		case Collider.SPHERE:
			var i=phyobj.mass*2/5*(sx*sx+sy*sy+sz*sz);
			Vec3.set(phyobj.inertia,i,i,i);
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

