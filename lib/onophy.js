"use strict"
var OnoPhy = (function(){
	var GRAVITY = 9.8; //重力加速度
	var DELTA=0.00000001; //ちょっとずらしたいときに使う
	var REPETITION_MAX=50;
	var PENALTY = 200;
	var _dt; //ステップ時間
	var dv = new Vec3();
	var impulse = new Vec3();
	var hitInfoCount=0;
	var impulseBufsCount=0;
	
	var HitInfo = function() {
		this.obj1 = null;
		this.obj2 = null;
		this.pos1 = new Vec3();
		this.pos2 = new Vec3();
		this.nVec = new Vec3();
		this.nEffic = 0;
		this.nImpulse = 0; 
		this.tVec = new Vec3();
		this.tEffic= 0;
		this.tImpulse = 0; 
		this.t2Vec = new Vec3();
		this.t2Effic= 0;
		this.t2Impulse = 0; 
		this.restCoe = 0; 
		this.fricCoe = 0;
	}
	var ImpulseBuf = function() {
		this.id0 = 0;
		this.id1 = 0;
		this.nImpulse = 0;
		this.tImpulse = 0;
	}
	var impulseBufs=[];
	var hitInfos=[];
	for(var i=0;i<100;i++){
		hitInfos.push(new HitInfo());
		impulseBufs.push(new ImpulseBuf());
	}
	impulseBufs[99].id0=9999;


	var idcount=0;
	var PhyObj = function(){
		//基本オブジェクト
		this.id=idcount;
		idcount++;
		this.type = 0; //オブジェクト種類
		this.fix=1; //1固定 0挙動計算対象
		this.damper=1; //ダンパ定数
		this.penalty=2000; //ペナルティ係数(ばね定数)
		this.matrix =new Mat43(); //オブジェクトの姿勢等
		this.imatrix = new Mat43(); //逆行列
		this.name; //オブジェクト名称

		this.mass=1.0; //質量
		this.inertia=new Vec3(); //慣性主軸モーメント
		Vec3.set(this.inertia,99999,99999,99999);
		this.inertiaTensor=new Mat33;
		this.inv_inertiaTensor=new Mat33;
		this.sfriction=1; //静止摩擦力
		this.dfriction=1; //動摩擦力

		this.v = new Vec3(); //速度
		this.oldv = new Vec3(); //速度
		this.a = new Vec3(); //加速度

		this.rotL = new Vec3(); //角運動量
		this.rotV = new Vec3(); //回転速度
		this.oldrotV = new Vec3(); //角運動量(古い)
		this.aa=new Vec3(); //回転加速度

		this.rotmat=new Mat33(); //回転状態
		this.scale=new Vec3(); //スケール
		this.location=new Vec3(); //位置
		this.size=new Vec3(); //基準サイズ
		this.r=1.0; //半径
		this.inv_restCoe = 1.0/0.2; //反発係数の逆数
		this.inv_fricCoe = 1.0/0.5; //摩擦係数の逆数
		this.inv_mass = 0; //質量の逆数
	}
	var Mesh =  function(){
		//メッシュ
		PhyObj.apply(this);
		this.type=MESH;
		this.mesh=null; //メッシュ情報
		this.poses=[]; //頂点座標
		this.faceNormals=[]; //面法線
		this.edge1Normals=[]; //従法線1
		this.edge2Normals=[]; //従法線2
	}

	var Spring =  function(){
		//ばね
		PhyObj.apply(this);
		this.type = SPRING;
		this.p0 = new Vec3(); //ばね先端1座標
		this.p1 = new Vec3(); //ばね先端2座標
		this._p0 = new Vec3(); //前回の座標
		this._p1 = new Vec3(); //前回の座標
		this.con1Obj = null; //接続オブジェクト1
		this.con1Pos = new Vec3(); //オブジェクト接続座標
		this.con2Obj = null; //接続オブジェクト2
		this.con2Pos = new Vec3(); //オブジェクト接続座標
	}
	
	var SpringMesh =  function(vertexsize){
		//ばねメッシュ
		PhyObj.apply(this);
		this.type=SPRING_MESH;
		this.fix=0; 
		var pos = new Array(vertexsize); //頂点座標
		var v = new Array(vertexsize); //頂点速度
		var a = new Array(vertexsize); //頂点加速度
		var fixes= new Array(vertexsize); //固定フラグ
		var truepos=new Array(vertexsize); //本来の座標
		for(var i=vertexsize;i--;){
			v[i] = new Vec3();
			a[i] = new Vec3();
			pos[i] = new Vec3();
			fixes[i]=0;
			truepos[i]=new Vec3();
		}
		this.v = v;
		this.a=a;
		this.pos = pos;
		this.truepos=truepos;
		this.fixes = fixes;
		
		this.joints = new Array(); //エッジ
		this.faces = new Array(); //面

		this.friction=50; //摩擦定数
		this.mass=1; //点あたりの質量
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

	var Collision =  function(type){
		//コリジョン
		PhyObj.apply(this);
		this.type=type;
	}

	var ret = function(){
		this.phyObjs = new Array();
		this.repetition=0;
	}

	//オブジェクト種類
	var i=1
	var SPRING_MESH = ret.SPRING_MESH = i++
		,SPRING = ret.SPRING = i++
		,MESH = ret.MESH = i++
		,CUBOID = ret.CUBOID = i++
		,SPHERE = ret.SPHERE = i++
		,ELLIPSE = ret.ELLIPSE = i++
		,CAPSULE = ret.CAPSULE = i++
	;
	
	var bV0 = new Vec3()
	,bV1 = new Vec3()
	,bV2 = new Vec3()
	,bV3 = new Vec3()
	,bV4 = new Vec3()
	,bV5 = new Vec3()
	,bV6 = new Vec3()
	,bV7 = new Vec3()
	,bM = new Mat43()
	,bM2 = new Mat43()
	
	,Z_VECTOR=Geono.Z_VECTOR
	,Z_VECTOR_NEG=Geono.Z_VECTOR_NEG
	,ZERO_VECTOR = Geono.ZERO_VECTOR

	ret.prototype= {
		init:function(){
		}
		,createCollision:function(type){
			//コリジョンオブジェクト作成
			var res=new Collision(type)
			this.phyObjs.push(res)
			return res
		}
		,createSpring:function(){
			//スプリングオブジェクト作成
			var res=new Spring();
			res.fix=0;
			this.phyObjs.push(res)
			return res
		}
		,createSpringMesh:function(num){
			//スプリングメッシュオブジェクト作成
			var res=new SpringMesh(num)
			this.phyObjs.push(res)
			return res
		}
		,createMesh:function(mesh){
			//メッシュオブジェクト作成
			var res=new Mesh();
			res.mesh = mesh;
			var faceSize = mesh.faces.length;
			var vertexSize = mesh.vertices.length;
			for(var i=0;i<vertexSize;i++){
				res.poses.push(new Vec3());
			}
			for(var i=0;i<faceSize;i++){
				res.faceNormals.push(new Vec3());
				res.edge1Normals.push(new Vec3());
				res.edge2Normals.push(new Vec3());
			}
			this.phyObjs.push(res)
			
			return res
		}
		,deletePhyObject:function(object){
			//オブジェクト削除
			var phyObjs=this.phyObjs;
			for(i=phyObjs.length;i--;){
				if(phyObjs[i]==object){
					phyObjs.splice(i,1);
					break
				}
			}
		}
		,calc:function(dt,step){
			//物理計算
			for(var i=step;i--;){
				calc_t(this.phyObjs,dt/step,this);
			}
		}
	}
	var calcObj= ret.calcObj= function(obj){
		var matrix=obj.matrix;
		var rotmat=obj.rotmat;
		var sx=obj.scale[0];
		var sy=obj.scale[1];
		var sz=obj.scale[2];
		matrix[0]=rotmat[0]*sx;
		matrix[1]=rotmat[1]*sx;
		matrix[2]=rotmat[2]*sx;
		matrix[3]=0;
		matrix[4]=rotmat[3]*sy;
		matrix[5]=rotmat[4]*sy;
		matrix[6]=rotmat[5]*sy;
		matrix[7]=0;
		matrix[8]=rotmat[6]*sz;
		matrix[9]=rotmat[7]*sz;
		matrix[10]=rotmat[8]*sz;
		matrix[11]=0;
		matrix[12]=obj.location[0];
		matrix[13]=obj.location[1];
		matrix[14]=obj.location[2];
		matrix[15]=1;
		if(obj.type == SPHERE){
			obj.r = Math.max(Math.max(
				obj.scale[0]*obj.size[0]
				,obj.scale[1]*obj.size[1])
				,obj.scale[2]*obj.size[2]);
		}
		if(obj.type == CAPSULE){
			obj.r = Math.max(
				obj.scale[0]*obj.size[0]
				,obj.scale[1]*obj.size[1]);
		}
		if(obj.type == MESH){
			var vertices = obj.mesh.vertices;
			var faces = obj.mesh.faces;
			var poses= obj.poses;
			for(var j=0;j<poses.length;j++){
				Mat43.dotMat43Vec3(poses[j],matrix,vertices[j].pos);
			}
			for(var j=0;j<faces.length;j++){
				var face = faces[j];
				
				var faceNormal = obj.faceNormals[j];
				var edge1Normal = obj.edge1Normals[j];
				var edge2Normal = obj.edge2Normals[j];
				
				Vec3.sub(bV1,poses[face.idx[1]],poses[face.idx[0]]);
				Vec3.sub(bV2,poses[face.idx[2]],poses[face.idx[0]]);
				Vec3.cross(faceNormal,bV1,bV2);
				Vec3.norm(faceNormal);
				
				Vec3.cross(edge1Normal,faceNormal,bV1);
				Vec3.mul(edge1Normal,edge1Normal,1.0/Vec3.dot(bV2,edge1Normal));
				
				Vec3.cross(edge2Normal,bV2,faceNormal);
				Vec3.mul(edge2Normal,edge2Normal,1.0/Vec3.dot(bV1,edge2Normal));
			}
		}
	}


	var a_n=new Vec3(); 
	var a_fric=new Vec3(); 
	var a_l=new Vec3();  
	var a_a=new Vec3();
	var mem=new Vec3();
	var mem2=new Vec3();

	var act2p= new Vec3();
	var act2f= new Vec3();
	var act2 = function(obj,p,f,obj2){
//		act(obj,p,f,obj2);
//		Vec3.add(act2p,p,f);
//		Vec3.mul(act2f,f,-1);
//		act(obj2,act2p,act2f,obj);
		var hitInfo = hitInfos[hitInfoCount];
		hitInfoCount++;
		hitInfo.obj1 = obj;
		hitInfo.obj2 = obj2;
		Vec3.sub(hitInfo.pos1,p,obj.location);
		Vec3.sub(hitInfo.pos2,p,obj2.location);
		Vec3.sub(hitInfo.pos2,hitInfo.pos2,f);

		
	}
	
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

	var calcDiffVelocity = function(dv,hitInfo){
		var obj1 = hitInfo.obj1;
		var obj2 = hitInfo.obj2;
		Vec3.sub(dv, obj2.v, obj1.v);
		Vec3.cross(calcBuf,obj1.rotV,hitInfo.pos1);
		Vec3.sub(dv,dv,calcBuf);
		Vec3.cross(calcBuf,obj2.rotV,hitInfo.pos2);
		Vec3.add(dv,dv,calcBuf);
	}

	var calcHitInfo = function(hitInfo){
		var obj1 = hitInfo.obj1;
		var obj2 = hitInfo.obj2;
		hitInfo.nImpulse = 0;
		hitInfo.tImpulse = 0;
		hitInfo.t2Impulse = 0;

		Vec3.add(hitInfo.nVec,obj1.location,hitInfo.pos1);
		Vec3.sub(hitInfo.nVec,hitInfo.nVec,obj2.location);
		Vec3.sub(hitInfo.nVec,hitInfo.nVec,hitInfo.pos2);
		hitInfo.tVec[0] = hitInfo.nVec[1];
		hitInfo.tVec[1] = -hitInfo.nVec[2];
		hitInfo.tVec[2] = -hitInfo.nVec[0];
		Vec3.cross(hitInfo.tVec,hitInfo.tVec,hitInfo.nVec);
		Vec3.cross(hitInfo.t2Vec,hitInfo.tVec,hitInfo.nVec);
		Vec3.norm(hitInfo.nVec);
		Vec3.norm(hitInfo.tVec);
		Vec3.norm(hitInfo.t2Vec);

		hitInfo.nEffic = calcEffic(hitInfo.nVec, hitInfo);
		hitInfo.tEffic = calcEffic(hitInfo.tVec, hitInfo);
		hitInfo.t2Effic = calcEffic(hitInfo.t2Vec, hitInfo);

		hitInfo.fricCoe = 2.0/(obj1.inv_fricCoe + obj2.inv_fricCoe);

		calcDiffVelocity(dv,hitInfo);
		hitInfo.repulsion = Vec3.dot(dv, hitInfo.nVec) * 2 / (obj1.inv_restCoe + obj2.inv_restCoe)*hitInfo.nEffic;

		var i = obj1.id;
		var j = obj2.id;
		for (; 1; impulseBufsCount++) {
			var impulseBuf = impulseBufs[impulseBufsCount];
			if (impulseBuf.id0 > i || (impulseBuf.id0 ==i && impulseBuf.id1 > j)) {
				break;
			}
			if (impulseBuf.id0 == i && impulseBuf.id1 == j) {
				hitInfo.nImpulse = impulseBuf.nImpulse;
				hitInfo.tImpulse = impulseBuf.tImpulse;
				break;
			}
		}
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
	var calc_t=ret.calc_t=function(phyObjs,dt,ret){
		_dt=dt;
		var i,j,k
		,AIR_DAMPER=Math.pow(0.95,dt) 
		,DAMPERD=Math.pow(0.5,dt) 
		,REFLECT_DAMPER=1-Math.pow(0.1,dt)
		
		,obj,obj2
		,x,y,z,nx,ny,nz
		,matrix

		,detdt=1/dt;
		
		for(i = phyObjs.length;i--;){
			//判定用行列更新
			obj = phyObjs[i];
			
			matrix=obj.matrix;
			var rotmat=obj.rotmat;
			var sx=obj.scale[0];
			var sy=obj.scale[1];
			var sz=obj.scale[2];
			if(obj.type >=  CUBOID){
				sx*=obj.size[0];
				sy*=obj.size[1];
				sz*=obj.size[2];
			}
			matrix[0]=rotmat[0]*sx;
			matrix[1]=rotmat[1]*sx;
			matrix[2]=rotmat[2]*sx;
			matrix[3]=0;
			matrix[4]=rotmat[3]*sy;
			matrix[5]=rotmat[4]*sy;
			matrix[6]=rotmat[5]*sy;
			matrix[7]=0;
			matrix[8]=rotmat[6]*sz;
			matrix[9]=rotmat[7]*sz;
			matrix[10]=rotmat[8]*sz;
			matrix[11]=0;
			matrix[12]=obj.location[0];
			matrix[13]=obj.location[1];
			matrix[14]=obj.location[2];
			matrix[15]=1;
			Mat43.getInv(obj.imatrix,obj.matrix);

			Mat33.getInv(bM,obj.rotmat);
			bM[0]*=obj.inertia[0];
			bM[1]*=obj.inertia[1];
			bM[2]*=obj.inertia[2];
			bM[3]*=obj.inertia[0];
			bM[4]*=obj.inertia[1];
			bM[5]*=obj.inertia[2];
			bM[6]*=obj.inertia[0];
			bM[7]*=obj.inertia[1];
			bM[8]*=obj.inertia[2];
			Mat33.dot(obj.inertiaTensor,rotmat,bM);
			Mat33.getInv(obj.inv_inertiaTensor,obj.inertiaTensor);
			Mat33.dotVec(obj.rotV,obj.inv_inertiaTensor,obj.rotL);
		}

		for(i = phyObjs.length;i--;){
			obj = phyObjs[i];

			if(obj.fix)continue

			if(obj.type==SPRING_MESH){
				springmeshMove(obj,dt);
				continue;
			}
			if(obj.type==SPRING){
				springMove(obj);
				continue;
			}
			
			obj.v[1]-=GRAVITY*dt;

		}

		hitInfoCount = 0;
		impulseBufsCount = 0;
		for(i = phyObjs.length;i--;){
			for(j = i;j--;){
				if(phyObjs[i].fix * phyObjs[j].fix){
					continue;
				}
				var func=hantei[phyObjs[i].type*8+phyObjs[j].type];
				if(func){
					func(phyObjs[i],phyObjs[j],dt);
				}
			}
		}

		for(var i=0;i<hitInfoCount;i++){
			calcHitInfo(hitInfos[i]);
		}	
		for (var i = 0;i<hitInfoCount; i++) {
			var hitInfo = hitInfos[i];
			Vec3.mul(impulse, hitInfo.nVec, hitInfo.nImpulse );
			Vec3.muladd(impulse, impulse, hitInfo.tVec, hitInfo.tImpulse );
			addimpulse( hitInfo, impulse);
		}

		var repetition;
		for (repetition = 0; repetition < REPETITION_MAX; repetition++) {
			for(i = phyObjs.length;i--;){
				var o = phyObjs[i];
				Vec3.copy(o.oldv,o.v);
				Vec3.copy(o.oldrotV,o.rotV);
			}

			for (var i = 0;i<hitInfoCount; i++) {
				var hitInfo = hitInfos[i];

				calcDiffVelocity(dv,hitInfo);
				var old = hitInfo.nImpulse;
				hitInfo.nImpulse += Vec3.dot(dv, hitInfo.nVec) * hitInfo.nEffic + hitInfo.repulsion;
				if (hitInfo.nImpulse < 0) {
					hitInfo.nImpulse = 0;
				}
				Vec3.mul(impulse, hitInfo.nVec, (hitInfo.nImpulse-old));
				addimpulse( hitInfo, impulse);

				calcDiffVelocity(dv,hitInfo);
				var max = hitInfo.nImpulse * hitInfo.fricCoe;
				old = hitInfo.tImpulse;
				hitInfo.tImpulse += Vec3.dot(dv, hitInfo.tVec)* hitInfo.tEffic;
				if (hitInfo.tImpulse > max) {
					hitInfo.tImpulse = max;
				}
				if (hitInfo.tImpulse < -max) {
					hitInfo.tImpulse = -max;
				}
				Vec3.mul(impulse, hitInfo.tVec, (hitInfo.tImpulse-old));
				old = hitInfo.t2Impulse;
				hitInfo.t2Impulse += Vec3.dot(dv, hitInfo.t2Vec)* hitInfo.t2Effic;
				if (hitInfo.t2Impulse > max) {
					hitInfo.t2Impulse = max;
				}
				if (hitInfo.t2Impulse < -max) {
					hitInfo.t2Impulse = -max;
				}
				Vec3.muladd(impulse,impulse, hitInfo.t2Vec, (hitInfo.t2Impulse-old));
				addimpulse( hitInfo, impulse);
			}

			var sum= 0;
			for(i = phyObjs.length;i--;){
				var o = phyObjs[i];
				if(o.fix){continue;}
				Vec3.sub(dv,o.oldv,o.v);
				sum+=(dv[0]*dv[0]+dv[1]*dv[1]+dv[2]*dv[2])*o.mass*o.mass;
				Vec3.sub(dv,o.oldrotV,o.rotV);
				Mat33.dotVec(dv,o.inertiaTensor,dv);
				sum+=(dv[0]*dv[0]+dv[1]*dv[1]+dv[2]*dv[2]);
			}
			if ( sum<= 0.0000001 ) {
				break;
			}
		}
		ret.repetition=repetition;
		for (var i = 0;i<hitInfoCount; i++) {
			var hitInfo = hitInfos[i];

			Vec3.add(dv, hitInfo.pos1, hitInfo.obj1.location);
			Vec3.sub(dv, dv, hitInfo.obj2.location);
			Vec3.sub(dv, dv, hitInfo.pos2);
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
			Vec3.set(obj.aa,0,0,0);
			


		}
		return
	}
	var springmeshMove=function(mesh,dt){
		var detdt=1.0/dt;
		var truepos = mesh.truepos;
		var velocities = mesh.v
		var accs=mesh.a
		var pos=mesh.pos;
		var fixes=mesh.fixes;
		var edges=mesh.joints;

		//頂点の加速度
		for(var j=pos.length;j--;){
			Vec3.set(accs[j],0,0,0);
			Vec3.muladd(accs[j],accs[j],velocities[j],-mesh.friction);
			accs[j][1]-=GRAVITY*mesh.mass;
		}
		//頂点間のばね制御
		for(var j=edges.length;j--;){
			var edge=edges[j]
			var p0=edge.v0
			var p1=edge.v1

//			if(fixes[p0] && fixes[p1]){
//				//両方の頂点が固定の場合は処理不要
//				continue;
//			}

			//2点間の本来の距離
			var truelen=Vec3.len(truepos[p0],truepos[p1]);
			if(truelen*truelen<0.0001){
				//同位置の場合は処理不要
				continue;
			}

			//2点間の差分ベクトル
			Vec3.sub(bV3,pos[p1],pos[p0]);
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
				len *= mesh.edgePush;
			}else if(len>0){
				//伸びている場合
				len *= mesh.edgePull;
			}

			//ばねの力を両点に加算
			Vec3.norm(bV3);
			Vec3.muladd(accs[p0],accs[p0],bV3,len);
			Vec3.muladd(accs[p1],accs[p1],bV3,-len);

			//両点の速度差分からダンパ力を計算
			Vec3.sub(bV1,velocities[p1],velocities[p0]);
			Vec3.mul(bV0,bV3,(Vec3.dot(bV1,bV3)));
			Vec3.muladd(accs[p0],accs[p0],bV0,mesh.edgeDamping);
			Vec3.muladd(accs[p1],accs[p1],bV0,-mesh.edgeDamping);

		}

	}
	var springmeshMove2=function(mesh,dt){
		var detdt=1/dt;
		var truepos= mesh.truepos;
		var velocities = mesh.v;
		var velocity;
		var accs=mesh.a
		var positions=mesh.pos
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

				Vec3.mul(velocity,velocity,0.95);
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
		//接続点
		if(obj.con1){
			Mat43.dotMat43Vec3(obj.p0,obj.con1.matrix,obj.con1Pos);
		}
		if(obj.con2){
			Mat43.dotMat43Vec3(obj.p1,obj.con2.matrix,obj.con2Pos);
		}
		Vec3.sub(bV0,obj.p0,obj._p0);
		Vec3.sub(bV1,obj.p1,obj._p1);
		Vec3.sub(bV0,bV0,bV1);

		Vec3.sub(bV2,obj.p1,obj.p0);
		var defaultLength = obj.size[0] * obj.scale[0];
		
		var l = -defaultLength + Vec3.scalar(bV2);
		Vec3.norm(bV2);

		Vec3.dot(bV0,bV0,bV2);
		Vec3.mul(bV0,bV0,-obj.damper);

		Vec3.mul(bV2,bV2,l*obj.penalty);
		Vec3.add(bV2,bV2,bV0);
		Vec3.mul(bV2,bV2,_dt);


		if(obj.con1){
			Vec3.sub(bV0,obj.p0,obj.con1.location);
			addimpulse_(obj.con1,bV0,bV2);
			//impact(obj.con1,obj.p0,bV2);
		}
		if(obj.con2){
			Vec3.sub(bV0,obj.p1,obj.con2.location);
			Vec3.mul(bV2,bV2,-1);
			addimpulse_(obj.con2,bV0,bV2);
			//impact(obj.con2,obj.p1,bV2);
		}

		
		Vec3.copy(obj._p0,obj.p0);
		Vec3.copy(obj._p1,obj.p1);
		
	}
	var SPRINGMESH_CAPSULE=function(mesh,capsule,dt){
		var PENALTY=20;
		var positions=mesh.pos;
		var fixes=mesh.fixes;
		var edges=mesh.joints;
		var faces=mesh.faces;
		var velocities = mesh.v;
		var nx,ny,nz,x,y,z,len,dlen;
		var REFLECT_DAMPER=1-Math.pow(0.1,dt)
				
		var matrix=capsule.matrix
		Mat43.dotMat43Vec3(bV0,matrix,Z_VECTOR)
		Mat43.dotMat43Vec3(bV1,matrix,Z_VECTOR_NEG)
		var retio2=(matrix[0]*matrix[0]+matrix[1]*matrix[1]+matrix[2]*matrix[2]);
		var retio=Math.sqrt(retio2)
		
		for(var j = faces.length;j--;){
			var face = faces[j]
			var p0=face[0]
			var p1=face[1]
			var p2=face[2]
			if(Geono.triangleLine(positions[p0],positions[p1],positions[p2]
					,bV0,bV1) ){
				x=Geono.closestB[0]-Geono.closestA[0]
				y=Geono.closestB[1]-Geono.closestA[1]
				z=Geono.closestB[2]-Geono.closestA[2]
				len = Math.sqrt(x*x+y*y+z*z)
				dlen=1/len;
				nx=x*dlen;
				ny=y*dlen;
				nz=z*dlen;
				len= (retio + len) * PENALTY
				x=nx*len;
				y=ny*len;
				z=nz*len;
			}else{
				x=Geono.closestA[0]-Geono.closestB[0]
				y=Geono.closestA[1]-Geono.closestB[1]
				z=Geono.closestA[2]-Geono.closestB[2]

				len = x*x+y*y+z*z
				if(len>retio2)continue
				len = Math.sqrt(len)
				dlen=1/len;
				nx=x*dlen;
				ny=y*dlen;
				nz=z*dlen;
				
				len= (retio - len) * PENALTY
				x=nx*len
				y=ny*len
				z=nz*len
			}
			var velocity = velocities[p0]
			len= -(velocity[0]*nx+velocity[1]*ny + velocity[2]*nz)*REFLECT_DAMPER
			velocity[0]+=x + nx*len
			velocity[1]+=y + ny*len
			velocity[2]+=z + nz*len
			
			velocity = velocities[p1]
			len= -(velocity[0]*nx+velocity[1]*ny + velocity[2]*nz)*REFLECT_DAMPER
			velocity[0]+=x + nx*len
			velocity[1]+=y + ny*len
			velocity[2]+=z + nz*len
			
			velocity = velocities[p2]
			len= -(velocity[0]*nx+velocity[1]*ny + velocity[2]*nz)*REFLECT_DAMPER
			velocity[0]+=x + nx*len
			velocity[1]+=y + ny*len
			velocity[2]+=z + nz*len
		}
	}
	var MESH_SPHERE=function(mesh,sphere,dt){

		var meshdata = mesh.mesh;
		var faces=meshdata.faces;
		var edges=meshdata.edges;
		var vertices=meshdata.vertices;
		var nVec = bV0;
		var dVec = bV4;
		var rVec = bV5;
		var l,l2;

		var matrix=mesh.matrix;
		var r = sphere.r;
		Mat43.copy(bM,sphere.matrix);
		var poses = mesh.poses;
		var faceNormals = mesh.faceNormals;
		var edge1Normals = mesh.edge1Normals;
		var edge2Normals = mesh.edge2Normals;
					
		for(var j = faces.length;j--;){
			var face = faces[j]
			var p0 = poses[face.idx[0]];
			dVec[0]= bM[12] - p0[0];
			dVec[1]= bM[13] - p0[1];
			dVec[2]= bM[14] - p0[2];
			var n= faceNormals[j];

			l=Vec3.dot(dVec,edge1Normals[j]);
			if( l<0){
				continue;
			}
			l2=Vec3.dot(dVec,edge2Normals[j]);
			if(l2<0 || (l2+l)>=1.0){
				continue;
			}

			l=Vec3.dot(dVec,n);
			if(l<0 || l>r){
				continue;
			}
			Vec3.muladd(rVec,sphere.location,n,-r);
			Vec3.mul(nVec,n, r - l);
			act2(sphere,rVec,nVec,mesh);

			bM[12]+=nVec[0]*(1+DELTA);
			bM[13]+=nVec[1]*(1+DELTA);
			bM[14]+=nVec[2]*(1+DELTA);
		}
		for(j = edges.length;j--;){
			var edge=edges[j];

			var p0 = poses[edge.v0];
			var p1 = poses[edge.v1];
			dVec[0]= bM[12] - p0[0];
			dVec[1]= bM[13] - p0[1];
			dVec[2]= bM[14] - p0[2];
			Vec3.sub(rVec,p1,p0);

			l=Vec3.dot(rVec,dVec);
			if(l<0){
				continue;
			}
			l2 = Vec3.dot(rVec,rVec);
			if(l>l2){
				continue;
			}
			Vec3.muladd(nVec,dVec,rVec,-l/l2);
			Vec3.norm(nVec);
			l = Vec3.dot(nVec,dVec);
			if(l>r){
				continue;
			}
			rVec[0]=bM[12]-nVec[0]*r
			rVec[1]=bM[13]-nVec[1]*r
			rVec[2]=bM[14]-nVec[2]*r
			Vec3.mul(nVec,nVec, r - l);
			act2(sphere,rVec,nVec,mesh);


			bM[12]+=nVec[0]*(1+DELTA);
			bM[13]+=nVec[1]*(1+DELTA);
			bM[14]+=nVec[2]*(1+DELTA);
		}
		for(j = vertices.length;j--;){
			var vertex=vertices[j];
			p0 = poses[j];
			dVec[0]= bM[12] - p0[0];
			dVec[1]= bM[13] - p0[1];
			dVec[2]= bM[14] - p0[2];

			l=dVec[0]*dVec[0] + dVec[1]*dVec[1] + dVec[2]*dVec[2] ; 
			if(l>r*r){
				continue;
			}
			l=Math.sqrt(l);
			Vec3.mul(nVec,dVec,(r-l)/l);
			Vec3.sub(rVec,p0,nVec);
			act2(sphere,rVec,nVec,mesh);

			bM[12]+=nVec[0]*(1+DELTA);
			bM[13]+=nVec[1]*(1+DELTA);
			bM[14]+=nVec[2]*(1+DELTA);
		}

	}
	var CUBOID_SPHERE=function(cuboid,sphere){
		var rVec = bV0;
		var dVec = bV1;
		var pos = bV2;
		var nVec = bV3;
		var l;
		Vec3.sub(dVec,sphere.location,cuboid.location);
		var min,minn;
		var r= sphere.r;
		min=99999;
		minn = -1;
		var flg=0;
		Vec3.set(pos,0,0,0);
		for(var i=0;i<3;i++){
			Vec3.set(rVec,cuboid.rotmat[i*3+0],cuboid.rotmat[i*3+1],cuboid.rotmat[i*3+2])
			var d = Vec3.dot(rVec,dVec);
			var size = cuboid.scale[i]*cuboid.size[i];
			if(Math.abs(d) > r + size){
				return;
			}
			if(d>size){
				Vec3.muladd(pos,pos,rVec,size);
				flg = 1;
			}else if( d< -size){
				Vec3.muladd(pos,pos,rVec,-size);
				flg = 1;
			}else{
				Vec3.muladd(pos,pos,rVec,d);
				l = r + size - Math.abs(d);
				if(l<min){
					min=l;
					minn=i;
				}
			}
		}
		if(!flg){
			i = minn;
			Vec3.set(rVec,cuboid.rotmat[i*3+0],cuboid.rotmat[i*3+1],cuboid.rotmat[i*3+2])
			if(Vec3.dot(rVec,dVec)<0){
				Vec3.mul(rVec,rVec,-1);
			}
			Vec3.mul(nVec,rVec,min);
			Vec3.muladd(pos,sphere.location,rVec,-r);
		}else{
			Vec3.sub(nVec,dVec,pos);
			l = nVec[0]*nVec[0]+ nVec[1]*nVec[1]+ nVec[2]*nVec[2];
			if(r* r < l){
				return;
			}
			l=Math.sqrt(l);
			Vec3.norm(nVec);
			Vec3.muladd(pos,sphere.location,nVec,-r);
			Vec3.mul(nVec,nVec,r-l);
			

		}
		act2(sphere,pos,nVec,cuboid);

		
	}
	var SPHERE_SPHERE=function(sphereA,sphereB){
		var dVec = bV0;
		var nVec = bV1;
		var pos = bV2;

		Vec3.sub(dVec,sphereB.location,sphereA.location);
		var l= dVec[0]*dVec[0] + dVec[1]*dVec[1] + dVec[2]*dVec[2];
		var ra= sphereA.r;
		var radd= ra + sphereB.r;
		
		if(l>radd*radd){
			return;
		}

		Vec3.norm(dVec);
		l=Math.sqrt(l);
		Vec3.mul(nVec,dVec,-(radd-l));
		
		Vec3.muladd(pos,sphereA.location,dVec,ra);
		act2(sphereA,pos,nVec,sphereB);
		
	}
	
	var MESH_CUBOID=function(mesh,cuboid,dt){
		var p0 = bV0;
		var p1 = bV1;
		var n = bV2;
		var pos = bV3;
		var r = bV4;
		var dVec = bV5;
		var p2 = bV6;

		var meshdata = mesh.mesh;
		var faces=meshdata.faces;
		var edges=meshdata.edges;
		var vertices=meshdata.vertices;
		var poses = mesh.poses;
		var faceNormals = mesh.faceNormals;
		var edge1Normals = mesh.edge1Normals;
		var edge2Normals = mesh.edge2Normals;
		var l,l2;


		Mat43.copy(bM,cuboid.matrix);
					
		for(var j = faces.length;j--;){
			var face = faces[j];
			var fn = mesh.faceNormals[j];

			Vec3.copy(p0,poses[face.idx[0]]);
			pos[0]= bM[12] - p0[0];
			pos[1]= bM[13] - p0[1];
			pos[2]= bM[14] - p0[2];
			Vec3.copy(n,faceNormals[j]);

			var l=Vec3.dot(pos,n);
			if(l<0){
				continue;
			}
			var l2 = 0;
			for(i=0;i<3;i++){
				var ll= bM[0+i*4]*n[0] + bM[1+i*4]*n[1] + bM[2+i*4]*n[2];
				if(ll<0){
					pos[i]=1;
					l2+=-ll;
				}else{
					pos[i]=-1;
					l2+=ll;
				}
			}
			
			if(l>l2){
				continue;
			}

			Vec3.copy(dVec,pos);
			Mat43.dotMat33Vec3(pos,bM,pos);
			Vec3.mul(pos,pos,l/l2);
			pos[0] = bM[12]+pos[0]-p0[0];
			pos[1] = bM[13]+pos[1]-p0[1];
			pos[2] = bM[14]+pos[2]-p0[2];
			
			Vec3.norm(n);

			l=Vec3.dot(pos,edge1Normals[j]);
			if( l<0){
				continue;
			}
			
			l2=Vec3.dot(pos,edge2Normals[j]);
			if(l2<0){
				continue;
			}
			if(l2+l>=1.0){
				continue;
			}

			Mat43.dotMat43Vec3(pos,bM,dVec);
			Vec3.sub(dVec,p0,pos);
			Vec3.mul(n,n,Vec3.dot(n,dVec));

			act2(cuboid,pos,n,mesh);
			bM[12]+=n[0]*(1+DELTA);
			bM[13]+=n[1]*(1+DELTA);
			bM[14]+=n[2]*(1+DELTA);

		}

		for(var j = edges.length;j--;){
			var edge= edges[j];
			var rotmat = cuboid.rotmat;
			Vec3.copy(p0,poses[edge.v0]);
			Vec3.copy(p1,poses[edge.v1]);
			Vec3.sub(p1,p1,p0);
			Vec3.mul(p1,p1,0.5);
			Vec3.add(p0,p1,p0);
			dVec[0] = p0[0] - bM[12];
			dVec[1] = p0[1] - bM[13];
			dVec[2] = p0[2] - bM[14];

			var min,minn;
			min= 999999;
			minn = -1;

			for(var i=0;i<3;i++){
				Vec3.set(n,rotmat[i*3+0],rotmat[i*3+1],rotmat[i*3+2]);
				var l =  Math.abs(Vec3.dot(n,p1)) + cuboid.scale[i]*cuboid.size[i]
					-Math.abs(Vec3.dot(n,dVec));
				if(l<0){
					minn=-1;
					break;
				}
				if(l<min){
					min=l;
					minn=i;
				}

				Vec3.cross(n,n,p1);
				if(n[0]*n[0]+n[1]*n[1]+n[2]*n[2]==0){
					continue;
				}
				var mat = cuboid.matrix;
				Vec3.norm(n);
				var l =  Math.abs(Vec3.dot(n,p1)) 
					+ Math.abs(bM[0] *n[0]  + bM[1]*n[1] + bM[2]*n[2])
					+ Math.abs(bM[4] *n[0] + bM[5]*n[1] + bM[6]*n[2])
					+ Math.abs(bM[8] *n[0] + bM[9]*n[1] + bM[10]*n[2])
					-Math.abs(Vec3.dot(n,dVec));
				if(l<0){
					minn=-1;
					break;
				}
				if(l<min){
					min=l;
					minn=i+3;
				}
			}
			if(minn<0){
				continue;
			}
			if(minn<3){
				var idx;
				var flg=0;
				var i=minn;
				Vec3.set(n,rotmat[i*3+0],rotmat[i*3+1],rotmat[i*3+2]);
				if(Vec3.dot(n,p1)==0){
					r[0] = n[1]*p1[2] - n[2]*p1[1];
					r[1] = n[2]*p1[0] - n[0]*p1[2];
					r[2] = n[0]*p1[1] - n[1]*p1[0];
					Vec3.norm(r);
					Mat43.getRotMat(bM2,DELTA,r[0],r[1],r[2]);
					Mat43.dot(rotmat,rotmat,bM2);
					Mat43.dot(bM,bM,bM2);

					min= 999999;
					minn = -1;

					for(var i=0;i<3;i++){
						Vec3.set(n,rotmat[i*3+0],rotmat[i*3+1],rotmat[i*3+2]);
						var l =  Math.abs(Vec3.dot(n,p1)) + cuboid.scale[i]*cuboid.size[i]
							-Math.abs(Vec3.dot(n,dVec));
						if(l<0){
							minn=-1;
							break;
						}
						if(l<min){
							min=l;
							minn=i;
						}

						Vec3.cross(n,n,p1);
						Vec3.norm(n);
						var l =  Math.abs(Vec3.dot(n,p1)) 
							+ Math.abs(bM[0] *n[0]  + bM[1]*n[1] + bM[2]*n[2])
							+ Math.abs(bM[4] *n[0] + bM[5]*n[1] + bM[6]*n[2])
							+ Math.abs(bM[8] *n[0] + bM[9]*n[1] + bM[10]*n[2])
						if(l<0){
							minn=-1;
							break;
						}
						if(l<min){
							min=l;
							minn=i+3;
						}
					}
					if(minn<0){
						continue;
					}
				}
			}

			if(minn<3){
				continue;
				var i =minn;
				Vec3.set(n,rotmat[i*3+0],rotmat[i*3+1],rotmat[i*3+2]);
				Vec3.norm(n);
				Vec3.mul(n,n,min);
				if(Vec3.dot(n,dVec)>0){
					Vec3.mul(n,n,-1);
				}
				if(Vec3.dot(n,p1)>0){
					Vec3.add(p0,p0,p1);
				}else{
					Vec3.sub(p0,p0,p1);
				}
				Vec3.sub(pos,p0,n);
				
				act2(cuboid,pos,n,mesh);
				bM[12]+=n[0]*(1+DELTA);
				bM[13]+=n[1]*(1+DELTA);
				bM[14]+=n[2]*(1+DELTA);
			}else{
				var i =minn-3;
				Vec3.set(r,rotmat[i*3+0],rotmat[i*3+1],rotmat[i*3+2]);
				Vec3.cross(n,p1,r);
				Vec3.norm(n);
				Vec3.mul(n,n,min);

				if(Vec3.dot(n,dVec)>0){
					Vec3.mul(n,n,-1);
				}
				var mat=cuboid.matrix;
				for(var i=0;i<3;i++){
					l= mat[0+i*4]*n[0] + mat[1+i*4]*n[1] + mat[2+i*4]*n[2];
					if(l<0){
						pos[i]=1;
					}else{
						pos[i]=-1;
					}
				}
				Mat43.dotMat43Vec3(pos,mat,pos);
				Vec3.sub(pos,pos,p0);

				Vec3.cross(r,n,r);

				Vec3.muladd(p0,p0,p1,Vec3.dot(r,pos)/Vec3.dot(r,p1));
				Vec3.sub(pos,p0,n);
				
				act2(cuboid,pos,n,mesh);
				bM[12]+=n[0]*(1+DELTA);
				bM[13]+=n[1]*(1+DELTA);
				bM[14]+=n[2]*(1+DELTA);
			}
		}
		for(var j = vertices.length;j--;){
			var rotmat = cuboid.rotmat;
			//Mat43.dotMat43Vec3(p0,mesh.matrix,vertices[j].pos);
			Vec3.copy(p0,poses[j]);
			dVec[0] = p0[0] - bM[12];
			dVec[1] = p0[1] - bM[13];
			dVec[2] = p0[2] - bM[14];
			var min,minn;
			min= 999999;
			minn = -1;

			for(var i=0;i<3;i++){
				Vec3.set(n,rotmat[i*3+0],rotmat[i*3+1],rotmat[i*3+2]);
				var l =   cuboid.size[i]*cuboid.scale[i] -Math.abs(Vec3.dot(n,dVec));
				if(l<0){
					minn=-1;
					break;
				}
				if(l<min){
					min=l;
					minn=i;
				}
			}
			if(minn<0){
				continue;
			}

			i=minn;
			Vec3.set(n,rotmat[i*3+0],rotmat[i*3+1],rotmat[i*3+2]);
			Vec3.norm(n);
			Vec3.mul(n,n,min);
			if(Vec3.dot(n,dVec)>0){
				Vec3.mul(n,n,-1);
			}
			Vec3.sub(pos,p0,n);
			act2(cuboid,pos,n,mesh);
			bM[12]+=n[0]*(1+DELTA);
			bM[13]+=n[1]*(1+DELTA);
			bM[14]+=n[2]*(1+DELTA);
		}	


	}

	var calcRecentRet={min:0,minn:0};
	var calcRecent = function(objA,objB){
		var dx = objB.location[0]-objA.location[0];
		var dy = objB.location[1]-objA.location[1];
		var dz = objB.location[2]-objA.location[2];
		var x,y,z;
		var min=99999;
		var minn=-1;
		var mat,rot,mat2;
		var l,l2;

		calcRecentRet.min=min;
		calcRecentRet.minn=minn;

		for(var ii=0;ii<6;ii++){
			var i;
			if(ii<3){
				rot = objA.rotmat;
				mat = objA.matrix;
				mat2 = objB.matrix;
				i=ii;
			}else{
				rot = objB.rotmat;
				mat = objB.matrix;
				mat2 = objA.matrix;
				i=ii-3;
			}
			x=rot[i*3+0];
			y=rot[i*3+1];
			z=rot[i*3+2];
			l = Math.abs(mat2[0] * x + mat2[1]*y + mat2[2]*z)
				+ Math.abs(mat2[4] * x + mat2[5]*y + mat2[6]*z)
				+ Math.abs(mat2[8] * x + mat2[9]*y + mat2[10]*z)
				+ mat[i*4+0]*x + mat[i*4+1]*y+ mat[i*4+2]*z;
			l2 = Math.abs(dx *x + dy*y + dz*z);
			l = l - l2;
			if( l<0 ){
				return
			}
			if(l<min){
				min=l;
				minn = ii;
			}
		}
		var rotA = objA.rotmat
			,rotB =objB.rotmat
			,matA = objA.matrix
			,matB = objB.matrix
		;
		for(var i =0;i<3;i++){
			for(var j =0;j<3;j++){
				x = rotA[3*i + 1]* rotB[3*j+2] - rotA[3*i+2]*rotB[3*j+1];
				y = rotA[3*i + 2]* rotB[3*j+0] - rotA[3*i+0]*rotB[3*j+2];
				z = rotA[3*i + 0]* rotB[3*j+1] - rotA[3*i+1]*rotB[3*j+0];
				if(x*x+y*y+z*z<=0){
					continue;
				}
				l =1/Math.sqrt(x*x+y*y+z*z);
				x*=l;y*=l;z*=l;
				l = Math.abs(matA[0] *x + matA[1]*y + matA[2]*z)
					+ Math.abs(matA[4] *x + matA[5]*y + matA[6]*z)
					+ Math.abs(matA[8] *x + matA[9]*y + matA[10]*z)
					+ Math.abs(matB[0] *x + matB[1]*y + matB[2]*z)
					+ Math.abs(matB[4] *x + matB[5]*y + matB[6]*z)
					+ Math.abs(matB[8] *x + matB[9]*y + matB[10]*z)
				;

				l2 = Math.abs(dx *x + dy*y + dz*z);
				l = l - l2;
				if( l<0 ){
					return
				}
				if(l<min){
					min=l;
					minn = i*3+j+6;
				}
			}
		}
		calcRecentRet.min=min;
		calcRecentRet.minn=minn;
		return 
	}
	var CUBOID_CUBOID=function(ba,bb,dt){
		var boxA =ba,boxB=bb;
		var dVec = bV0;
		var nVec = bV1;
		var aPos = bV2;
		var bPos = bV3;
		var aVec = bV4;
		var bVec = bV5;
		var dpVec= bV6;
		var rotA=boxA.rotmat;
		var rotB=boxB.rotmat;
		var matA=boxA.matrix;
		var matB=boxB.matrix;
		var l,l2;
		Vec3.sub(dVec,boxB.location,boxA.location);
		var min;
		var minn;

		calcRecent(ba,bb);
		min=calcRecentRet.min;
		minn=calcRecentRet.minn;
		if(minn<0){
			return;
		}

		if(minn<6){
			var idx;
			if(minn<3){
				boxA =ba;
				boxB =bb;
				idx=minn*3;
			}else{
				boxA = bb;
				boxB = ba;
				idx=(minn-3)*3;
			}
			rotA = boxA.rotmat;
			rotB = boxB.rotmat;
			matA= boxA.matrix;
			matB= boxB.matrix;
			Vec3.set(nVec,rotA[idx+0],rotA[idx+1],rotA[idx+2]);
			var flg=0;
			for(var ii=0;ii<3;ii++){
				l= nVec[0]*rotB[ii*3+0] + nVec[1]*rotB[ii*3+1] +nVec[2]*rotB[ii*3+2];
				if(l==0){
					dVec[0] = nVec[1]*rotB[ii*3+2] - nVec[2]*rotB[ii*3+1];
					dVec[1] = nVec[2]*rotB[ii*3+0] - nVec[0]*rotB[ii*3+2];
					dVec[2] = nVec[0]*rotB[ii*3+1] - nVec[1]*rotB[ii*3+0];
					Vec3.norm(dVec);
					Mat33.getRotMat(bM,DELTA,dVec[0],dVec[1],dVec[2]);
					Mat33.dot(rotA,rotA,bM);
					Mat43.getRotMat(bM,DELTA,dVec[0],dVec[1],dVec[2]);
					Mat43.dot(matA,matA,bM);
					flg=1;
				}
			}
			if(flg){
				calcRecent(ba,bb);
				min=calcRecentRet.min;
				minn=calcRecentRet.minn;
				if(minn<0){
					return;
				}
			}
		}
		boxA = ba;
		boxB = bb;

		var i=0;
		if(minn<6){
			var idx;
			if(minn<3){
				boxA =ba;
				boxB =bb;
				idx=minn*3;
			}else{
				boxA = bb;
				boxB = ba;
				idx=(minn-3)*3;
			}
			rotA = boxA.rotmat;
			rotB = boxB.rotmat;
			matA= boxA.matrix;
			matB= boxB.matrix;
			Vec3.set(nVec,rotA[idx+0],rotA[idx+1],rotA[idx+2]);
			Vec3.sub(dVec,boxB.location,boxA.location);
			Vec3.norm(nVec);
			if(Vec3.dot(nVec,dVec)<0){
				Vec3.mul(nVec,nVec,-1);
			}
			for(i=0;i<3;i++){
				l= matB[0+i*4]*nVec[0] + matB[1+i*4]*nVec[1] + matB[2+i*4]*nVec[2];
				if(l<0){
					bPos[i]=1;

				}else{
					bPos[i]=-1;
				}
			}
			Vec3.mul(nVec,nVec,min);
			Mat43.dotMat43Vec3(bPos,matB,bPos);
			Vec3.add(aPos,bPos,nVec);
			act2(boxB,bPos,nVec,boxA);
		}else{
			var i=(minn-6)/3|0;
			var j=(minn-6)-i*3;
			Vec3.sub(dVec,boxB.location,boxA.location);
			Vec3.set(aVec,rotA[3*i + 0],rotA[3*i + 1],rotA[3*i + 2]);
			Vec3.set(bVec,rotB[3*j + 0], rotB[3*j + 1], rotB[3*j + 2]);
			Vec3.cross(nVec,aVec,bVec);
			Vec3.norm(nVec);
			Vec3.mul(nVec,nVec,min);

			if(Vec3.dot(nVec,dVec)<0){
				Vec3.mul(nVec,nVec,-1);
			}
			for(var i=0;i<3;i++){
				l= matB[0+i*4]*nVec[0] + matB[1+i*4]*nVec[1] + matB[2+i*4]*nVec[2];
				if(l<0){
					bPos[i]=1;
				}else{
					bPos[i]=-1;
				}
			}
			Mat43.dotMat43Vec3(bPos,matB,bPos);

			for(var i=0;i<3;i++){
				l= matA[0+i*4]*nVec[0] + matA[1+i*4]*nVec[1] + matA[2+i*4]*nVec[2];
				if(l<0){
					aPos[i]=-1;
				}else{
					aPos[i]=1;
				}
			}
			Mat43.dotMat43Vec3(aPos,matA,aPos);
			Vec3.sub(dpVec,aPos,bPos);

			Vec3.cross(aVec,nVec,aVec);

			Vec3.muladd(bPos,bPos,bVec,Vec3.dot(aVec,dpVec)/Vec3.dot(aVec,bVec));
			Vec3.add(aPos,bPos,nVec);
			
			act2(boxB,bPos,nVec,boxA);

		}

	}
	var CAPSULE_SPHERE=function(capsule,sphere){
		var dVec = bV0;
		var nVec = bV1;
		var rVec = bV1;
		var pos = bV2;

		Vec3.sub(dVec,sphere.location,capsule.location);
		var r= sphere.r;
		var capr= capsule.r;
		var radd = r + capr;
		
		Vec3.set(rVec,capsule.rotmat[6],capsule.rotmat[7],capsule.rotmat[8]);
		var l = Vec3.dot(rVec,dVec);
		var l2 = capsule.size[2]*capsule.scale[2] - capr;
		if(l>l2){
			l=l2;
		}else if(l<-l2){
			l=-l2;
		}
		Vec3.muladd(dVec,dVec,rVec,-l);
		var l= dVec[0]*dVec[0] + dVec[1]*dVec[1] + dVec[2]*dVec[2];
		if(l>radd*radd){
			return;
		}
		l = Math.sqrt(l);
		Vec3.norm(dVec);
		Vec3.mul(nVec,dVec,(radd-l));
	
		Vec3.muladd(pos,sphere.location,dVec,-radd);
		act2(sphere,pos,nVec,capsule);
	}
	var MESH_CAPSULE=function(mesh,capsule,dt){

		var meshdata = mesh.mesh;
		var faces=meshdata.faces;
		var edges=meshdata.edges;
		var vertices=meshdata.vertices;
		var nVec = bV0;
		var n2Vec = bV1;
		var pos= bV2;
		var dVec = bV4;
		var rVec = bV5;
		var l,l2;

		var matrix=mesh.matrix;
		var r = capsule.r;
		var cl =capsule.scale[2]*capsule.size[2] - r;
		if(cl<0){
			//シリンダ部分がない場合
			MESH_SPHERE(mesh,capsule,dt);
			return;
		}
		Mat43.copy(bM,capsule.matrix);
		var poses = mesh.poses;
		var faceNormals = mesh.faceNormals;
		var edge1Normals = mesh.edge1Normals;
		var edge2Normals = mesh.edge2Normals;
		//シリンダ向
		Vec3.set(rVec,capsule.rotmat[6],capsule.rotmat[7],capsule.rotmat[8]);
					
		for(var j = faces.length;j--;){
			var face = faces[j]
			var p0 = poses[face.idx[0]];
			dVec[0]= bM[12] - p0[0];
			dVec[1]= bM[13] - p0[1];
			dVec[2]= bM[14] - p0[2];
			var n= faceNormals[j];

			//面に近い方のシリンダ先端座標との差分
			if(Vec3.dot(n,rVec)<0){
				Vec3.muladd(dVec,dVec,rVec,cl);
			}else{
				Vec3.muladd(dVec,dVec,rVec,-cl);
			}

			l=Vec3.dot(dVec,edge1Normals[j]);
			if( l<0){ //シリンダ軸が面を通っていない
				continue;
			}
			l2=Vec3.dot(dVec,edge2Normals[j]);
			if(l2<0 || (l2+l)>=1.0){ //シリンダ軸が面を通っていない
				continue;
			}

			l=Vec3.dot(dVec,n);
			if(l<0 || l>r){ //シリンダが面から離れている
				continue;
			}
			Vec3.add(pos,p0,dVec);
			Vec3.muladd(pos,pos,n,-r);
			Vec3.mul(nVec,n, r - l);
			act2(capsule,pos,nVec,mesh);

			bM[12]+=nVec[0]*(1+DELTA);
			bM[13]+=nVec[1]*(1+DELTA);
			bM[14]+=nVec[2]*(1+DELTA);
		}
		for(j = edges.length;j--;){
			var edge=edges[j];

			var p0 = poses[edge.v0];
			var p1 = poses[edge.v1];
			dVec[0]= bM[12] - p0[0];
			dVec[1]= bM[13] - p0[1];
			dVec[2]= bM[14] - p0[2];
			Vec3.sub(n2Vec,p1,p0);
			Vec3.cross(nVec,n2Vec,rVec); //シリンダ軸とエッジの垂直ベクトル
			if(nVec[0] == 0 && nVec[1] == 0 && nVec[2]==0){ //並行な場合
				continue;
			}
			Vec3.cross(nVec,nVec,n2Vec); //シリンダに並行でエッジに垂直なベクトル
			l = Vec3.dot(nVec,dVec);
			l2 = Vec3.dot(nVec,rVec);
			l=-l/l2; 
			if(l<-cl){ //シリンダ端っこ補正
				l= -cl;
			}else if(l>cl){ //シリンダ端っこ補正
				l= cl;
			}
			Vec3.muladd(dVec,dVec,rVec,l); //交差部分を求める

//			Vec3.sub(n2Vec,p1,p0);
			l=Vec3.dot(n2Vec,dVec);
			if(l<0){ //交差部分がエッジの外側
				continue;
			}
			l2 = Vec3.dot(n2Vec,n2Vec);
			if(l>l2){ //交差部分がエッジの外側
				continue;
			}
			Vec3.muladd(nVec,dVec,n2Vec,-l/l2);
			Vec3.norm(nVec);
			l = Vec3.dot(nVec,dVec);
			if(l>r){
				continue;
			}
			Vec3.add(pos,dVec,p0);
			Vec3.muladd(pos,pos,nVec,-r);
			Vec3.mul(nVec,nVec, r - l);
			act2(capsule,pos,nVec,mesh);

			bM[12]+=nVec[0]*(1+DELTA);
			bM[13]+=nVec[1]*(1+DELTA);
			bM[14]+=nVec[2]*(1+DELTA);
		}
		for(j = vertices.length;j--;){
			var vertex=vertices[j];
			p0 = poses[j];
			dVec[0]= bM[12] - p0[0];
			dVec[1]= bM[13] - p0[1];
			dVec[2]= bM[14] - p0[2];

			l = Vec3.dot(rVec,dVec);
			if(l>cl){
				l=cl;
			}else if(l<-cl){
				l=-cl;
			}
			Vec3.muladd(dVec,dVec,rVec,-l);

			l=dVec[0]*dVec[0] + dVec[1]*dVec[1] + dVec[2]*dVec[2] ; 
			if(l>r*r){
				continue;
			}
			l=Math.sqrt(l);
			Vec3.mul(nVec,dVec,(r-l)/l);
			Vec3.sub(dVec,p0,nVec);
			act2(capsule,dVec,nVec,mesh);

			bM[12]+=nVec[0]*(1+DELTA);
			bM[13]+=nVec[1]*(1+DELTA);
			bM[14]+=nVec[2]*(1+DELTA);
		}

	}
	var CUBOID_CAPSULE=function(cuboid,capsule,dt){
		var dVec = bV0;
		var nVec = bV1;
		var nVec2= bV2;
		var rVec= bV3;
		var posa= bV4;
		var posb= bV5;
		var caprot= bV6;
		var rotmat=cuboid.rotmat;
		var l,l2;
		var min;
		var minn;
		var r = capsule.r;
		var cl = capsule.scale[2]*capsule.size[2] - r;
		Vec3.set(caprot,capsule.rotmat[6],capsule.rotmat[7],capsule.rotmat[8]);
		Vec3.sub(dVec,capsule.location,cuboid.location);

		min= 999999;
		minn = -1;
		for(var i=0;i<3;i++){
			Vec3.set(nVec,rotmat[i*3+0],rotmat[i*3+1],rotmat[i*3+2]);
			var l = Math.abs(Vec3.dot(nVec,caprot))*cl +r
				+ cuboid.scale[i]*cuboid.size[i]
				-Math.abs(Vec3.dot(nVec,dVec));
			if(l<0){
				return;
			}
			if(l<min){
				min=l;
				minn=i;
			}
		}
		for(var i=0;i<3;i++){
			Vec3.set(nVec,rotmat[i*3+0],rotmat[i*3+1],rotmat[i*3+2]);

			Vec3.cross(nVec,nVec,caprot);
			if(Vec3.scalar(nVec)==0){
				continue;
			}
			var mat = cuboid.matrix;
			Vec3.norm(nVec);
			var l = r
				+ Math.abs(mat[0] *nVec[0] + mat[1]*nVec[1] + mat[2]*nVec[2])
				+ Math.abs(mat[4] *nVec[0] + mat[5]*nVec[1] + mat[6]*nVec[2])
				+ Math.abs(mat[8] *nVec[0] + mat[9]*nVec[1] + mat[10]*nVec[2])
				- Math.abs(Vec3.dot(nVec,dVec));
			if(l<0){
				return;
			}
			if(l<min){
				min=l;
				minn=i+3;
			}
		}
		if(minn<0){
			return;
		}
		if(minn<3){
			var i=minn;
			Vec3.set(nVec,rotmat[i*3+0],rotmat[i*3+1],rotmat[i*3+2]);
			if(Vec3.dot(nVec,caprot)==0){
				Vec3.cross(nVec,nVec,caprot);
				Vec3.norm(nVec);
				Mat33.getRotMat(bM2,DELTA,nVec[0],nVec[1],nVec[2]);
				Mat33.dot(rotmat,rotmat,bM2);
				//Mat43.dot(bM,bM,bM2);
				min= 999999;
				minn = -1;

				for(var i=0;i<3;i++){
					Vec3.set(nVec,rotmat[i*3+0],rotmat[i*3+1],rotmat[i*3+2]);
					var l = Math.abs(Vec3.dot(nVec,caprot))*cl +r
						 + cuboid.scale[i]*cuboid.size[i]
						-Math.abs(Vec3.dot(nVec,dVec));
					if(l<0){
						return;
					}
					if(l<min){
						min=l;
						minn=i;
					}
				}
				for(var i=0;i<3;i++){
					Vec3.set(nVec,rotmat[i*3+0],rotmat[i*3+1],rotmat[i*3+2]);

					Vec3.cross(nVec,nVec,caprot);
					if(Vec3.scalar(nVec)==0){
						continue;
					}
					var mat = cuboid.matrix;
					Vec3.norm(nVec);
					var l = r
						+ Math.abs(mat[0] *nVec[0] + mat[1]*nVec[1] + mat[2]*nVec[2])
						+ Math.abs(mat[4] *nVec[0] + mat[5]*nVec[1] + mat[6]*nVec[2])
						+ Math.abs(mat[8] *nVec[0] + mat[9]*nVec[1] + mat[10]*nVec[2])
						- Math.abs(Vec3.dot(nVec,dVec));
					if(l<0){
						return;
					}
					if(l<min){
						min=l;
						minn=i+3;
					}
				}
				if(minn<0){
					return;
				}
			}
		}
		if(minn<3){
			var i =minn;
			Vec3.set(nVec,rotmat[i*3+0],rotmat[i*3+1],rotmat[i*3+2]);
			if(Vec3.dot(nVec,dVec)<0){
				Vec3.mul(nVec,nVec,-1);
			}
			if(Vec3.dot(nVec,caprot)>0){
				Vec3.muladd(dVec,dVec,caprot,-cl);
			}else{
				Vec3.muladd(dVec,dVec,caprot,cl);
			}
			Vec3.muladd(dVec,dVec,nVec,-r);
			Vec3.add(posb,cuboid.location,dVec);
			Vec3.mul(nVec,nVec,min);
			
			act2(capsule,posb,nVec,cuboid);
		}else{
			var i =minn-3;
			Vec3.set(rVec,rotmat[i*3+0],rotmat[i*3+1],rotmat[i*3+2]);
			Vec3.cross(nVec,rVec,caprot);
			Vec3.norm(nVec);

			if(Vec3.dot(nVec,dVec)<0){
				Vec3.mul(nVec,nVec,-1);
			}
			var mat=cuboid.matrix;
			for(var i=0;i<3;i++){
				if(i==minn-3){
					posb[i]=0;
				}
				l= mat[0+i*4]*nVec[0] + mat[1+i*4]*nVec[1] + mat[2+i*4]*nVec[2];
				if(l>0){
					posb[i]=1;
				}else{
					posb[i]=-1;
				}
			}
			Mat43.dotMat43Vec3(posb,mat,posb);
			Vec3.sub(dVec,capsule.location,posb);

			Vec3.cross(nVec,nVec,rVec);
			l = Vec3.dot(nVec,dVec);
			l2 = Vec3.dot(nVec,caprot);

			l=-l/l2
			if(l<-cl){
				l= -cl;
			}else if(l>cl){
				l= cl;
			}
			Vec3.muladd(posa,capsule.location,caprot,l);
			Vec3.sub(dVec,posa,posb);

			l = Vec3.dot(rVec,dVec);
			var size = cuboid.scale[minn]*cuboid.size[minn];
			if(l<-size){
				l= -size;
			}else if(l>size){
				l= size;
			}
			Vec3.muladd(posb,posb,rVec,l);

			Vec3.sub(nVec,posa,posb);
			l = Vec3.scalar(nVec);
			Vec3.sub(nVec2,posa,cuboid.location);
			if(Vec3.dot(nVec,nVec2)>0){
				Vec3.mul(nVec,nVec,(r-l)/l);
			}else{
				Vec3.mul(nVec,nVec,-(r+l)/l);
			}
			Vec3.sub(posb,posb,nVec);
			act2(capsule,posa,nVec,cuboid);
		}

	}
	var hantei=new Array(8*8);
	for(var i=0;i<8*8;i++){
		hantei[i]=null;
	}
	var setHantei = function(a,b,c){
		hantei[a*8+b]=c;
		if(a!=b){
			hantei[b*8+a]=function(x,y,z){
				c(y,x,z);
			};
		}
	}
	
	setHantei(SPRING_MESH, CAPSULE, SPRINGMESH_CAPSULE);
	setHantei(MESH, SPHERE, MESH_SPHERE);
	setHantei(MESH, CUBOID, MESH_CUBOID);
	setHantei(MESH, CAPSULE, MESH_CAPSULE);
	setHantei(CAPSULE, SPHERE,CAPSULE_SPHERE);
	setHantei(CUBOID, SPHERE, CUBOID_SPHERE);
	setHantei(SPHERE, SPHERE, SPHERE_SPHERE);
	setHantei(CUBOID, CUBOID, CUBOID_CUBOID);
	setHantei(CUBOID, CAPSULE, CUBOID_CAPSULE);


	ret.result = 0;
	ret.SPHERE_LINE = function(p0,p1,obj) {
		var t = bV0;
		var d = bV1;
		Vec3.sub(t,p1,p0);
		Vec3.sub(d,obj.location,p0);
		var tl = Vec3.scalar(t);
		var l2 = Vec3.dot(d,t)/tl;
		Vec3.mul(bV2,t,l2/tl);
		Vec3.sub(bV2,bV2,d);
		var l = Vec3.scalar(bV2);
		var r = obj.r ;
		if(l>r){
			return false;
		}
		r = r*r - l*l;
		r = Math.sqrt(r);
		l2 -= r;
		this.result = l2/tl;
		return true;

	}
	ret.SPHERE_LINE2 = function(p0,p1,p2,r) {
		var t = bV0;
		var d = bV1;
		Vec3.sub(t,p1,p0);
		Vec3.sub(d,p2,p0);
		var tl = Vec3.scalar(t);
		var l2 = Vec3.dot(d,t)/tl;
		Vec3.mul(bV2,t,l2/tl);
		Vec3.sub(bV2,bV2,d);
		var l = Vec3.scalar(bV2);
		if(l>r){
			return false;
		}
		r = r*r - l*l;
		r = Math.sqrt(r);
		l2 -= r;
		this.result = l2/tl;
		return true;

	}
	ret.CAPSULE_LINE = function(p0,p1,obj) {
		var t = bV0;
		var d = bV1;
		var n = bV2;
		var r = bV3;
		var n2 = bV4;
		var rotmat=obj.rotmat;
		var sc = obj.scale[2]*obj.size[2] - obj.r;
		if(sc<0){
			//シリンダ部分がない場合
			return this.SPHERE_LINE2(p0,p1,obj.location,obj.r);
		}

		Vec3.sub(t,p1,p0);
		r[0]=rotmat[6];
		r[1]=rotmat[7];
		r[2]=rotmat[8];
		Vec3.sub(d,p0,obj.location);
		Vec3.cross(n,r,t); //2線に垂直なベクトル
		Vec3.nrm(n,n);
		var nd = Vec3.dot(n,d);//垂直距離
		var y = obj.r*obj.r - nd*nd;
		if(y < 0){
			//半径より大きい場合
			return false;
		}
		y = Math.sqrt(y);
		Vec3.cross(n2,n,r);
		Vec3.nrm(n2,n2);
		if(Vec3.dot(t,n2)<0){
			y*=-1;
		}
		this.result = (-Vec3.dot(d,n2)-y)/Vec3.dot(t,n2);
		Vec3.muladd(d,d,t,this.result);
		var ra = Vec3.dot(r,d);
		if(ra>sc){
			Vec3.muladd(d,obj.location,r,sc);
			return this.SPHERE_LINE2(p0,p1,d,obj.r);

		}
		if(ra<-sc){
			Vec3.muladd(d,obj.location,r,-sc);
			return this.SPHERE_LINE2(p0,p1,d,obj.r);
		}

		return true;

	}
	ret.CUBOID_LINE = function(p0,p1,obj) {
		var min=-99999;
		var max=99999;
		var t = bV0;
		var d = bV1;
		var rotmat = obj.rotmat;
		Vec3.sub(t,p1,p0);
		Vec3.sub(d,obj.location,p0);
		for(var i=0;i<3;i++){
			var n=t[0]*rotmat[i*3+0] 
			+t[1]*rotmat[i*3+1] 
			+t[2]*rotmat[i*3+2] ;
			if(n==0){
				continue;
			}

			var n2=d[0]*rotmat[i*3+0] 
			+d[1]*rotmat[i*3+1] 
			+d[2]*rotmat[i*3+2] ;
			
			var n3;
			if(n>0){
				n3 = (obj.scale[i] * obj.size[i] + n2)/n;
			}else{
				n3 = (-obj.scale[i] * obj.size[i] + n2)/n;
			}

			if(n3 < max){
				max=n3;
			}
			if(n>0){
				n3 = (-obj.scale[i] * obj.size[i] + n2)/n;
			}else{
				n3 = (obj.scale[i] * obj.size[i] + n2)/n;
			}
			if(n3 > min){
				min=n3;
			}
		}
		if(min<max){
			this.result = min;
			return true;
		}
		return false;
	}
	ret.setPhyObjData = function(phyobj){
		var type =phyobj.type;
		var sx = phyobj.size[0]*phyobj.scale[0];
		var sy = phyobj.size[1]*phyobj.scale[1];
		var sz = phyobj.size[2]*phyobj.scale[2];
			
		switch(type){
		case SPHERE:
			var i=phyobj.mass*2/5*(sx*sx+sy*sy+sz*sz);
			Vec3.set(phyobj.inertia,i,i,i);
			break;
		default:
			var i=phyobj.mass*2/5*(sx*sx+sy*sy+sz*sz);
			Vec3.set(phyobj.inertia,i,i,i);
			break;
		}
		phyobj.penalty=phyobj.mass*200;
		phyobj.damper=phyobj.penalty/10;
		phyobj.sfriction=phyobj.dfriction*1.1;

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

