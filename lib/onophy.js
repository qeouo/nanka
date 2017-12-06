"use strict"
var OnoPhy = (function(){
function inherits(childCtor, parentCtor) {
    // ES6
    if (Object.setPrototypeOf) {
        Object.setPrototypeOf(childCtor.prototype, parentCtor.prototype);
    }
    // ES5
    else if (Object.create) {
        childCtor.prototype = Object.create(parentCtor.prototype);
    }
    // legacy platform
    else {
        function tempCtor() {};
        tempCtor.prototype = parentCtor.prototype;
        childCtor.superClass_ = parentCtor.prototype;
        childCtor.prototype = new tempCtor();
        childCtor.prototype.constructor = childCtor;
    }
};

	var DIMENSION=3;
	var GRAVITY = 9.8; //重力加速度
	var DELTA=0.00000001; //ちょっとずらしたいときに使う
	var REPETITION_MAX=50;
	var PENALTY = 200;
	var _dt; //ステップ時間
	var dv = new Vec3();
	var impulse = new Vec3();
	var hitInfoCount=0;
	var impulseBufsCount=0;
	
	var ret = function(){
		this.phyObjs = new Array();
		this.repetition=0;
	}

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
		this.tEffic2=new Vec2();
		this.tImpulse = new Vec3(); 
		this.t2Vec = new Vec3();
		this.t2Effic= 0;
		this.t2Effic2=new Vec2();
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
	var PhyObj = (function(){
		var buf1=new Vec3();
		var buf2=new Vec3();
		var ret = function(){
			//基本オブジェクト
			this.id=idcount;
			idcount++;
			this.AABB= new AABB();
			this.type = 0; //オブジェクト種類
			this.fix=1; //1固定 0挙動計算対象
			this.damper=1; //ダンパ定数
			this.penalty=2000; //ペナルティ係数(ばね定数)
			this.matrix =new Mat43(); //オブジェクトの姿勢等
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

			this.rotmat=new Mat33(); //回転状態
			this.scale=new Vec3(); //スケール
			this.location=new Vec3(); //位置
			this.size=new Vec3(); //基準サイズ
			Vec3.set(this.size,1,1,1);
			this.bold = 0; //太さ
			this.inv_restCoe = 1.0/0.2; //反発係数の逆数
			this.inv_fricCoe = 1.0/0.2; //摩擦係数の逆数
			this.inv_mass = 0; //質量の逆数

			this.type=0;
		}
		ret.prototype.calcAABB=function(){
			var axis=buf2;
			var ret=buf1;

			if(!this.calcSupport){
				return;
			}
			for(var i=0;i<3;i++){
				Vec3.set(axis,0,0,0);
				axis[i]=-1;
				this.calcSupport(ret,axis);
				this.AABB.max[i]=ret[i]+this.bold;
				axis[i]=1;
				this.calcSupport(ret,axis);
				this.AABB.min[i]=ret[i]-this.bold;
			}
		}
		ret.prototype.calcPre=function(){
			var m=this.matrix;
			var r=this.rotmat;

			//合成行列
			var sx=this.scale[0] * this.size[0];
			var sy=this.scale[1] * this.size[1];
			var sz=this.scale[2] * this.size[2];
			if(this.type<CUBOID){
				sx=this.scale[0];
				sy=this.scale[1];
				sz=this.scale[2];
			}
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


			//AABBを求める
			this.calcAABB();
		};
		return ret;
	})();
	var Mesh = (function(){
		var ret= function(){
		//メッシュ
		PhyObj.apply(this);
		this.type=MESH;
		this.mesh=null; //メッシュ情報
		this.faceAABBs=[];//フェイスAABB
		this.poses=[]; //頂点座標
		};
		ret.prototype.calcPre=function(){
			PhyObj.prototype.calcPre.call(this);
			var vertices = this.mesh.vertices;
			var poses= this.poses;
			var matrix = this.matrix;
			for(var j=0;j<poses.length;j++){
				Mat43.dotMat43Vec3(poses[j],matrix,vertices[j].pos);
			}

		}
		var calcAABB_POLYGON= function(aabb,v1,v2,v3){
			for(var i=0;i<DIMENSION;i++){
				aabb.min[i]=(Math.min(Math.min(v1[i],v2[i]),v3[i]));
				aabb.max[i]=(Math.max(Math.max(v1[i],v2[i]),v3[i]));
			}
		}
		ret.prototype.calcAABB=function(){
			var mesh = this.mesh;
			var poses=this.poses;
			var faces = mesh.faces;
			var pos1 = new Vec3();
			var pos2 = new Vec3();
			var pos3 = new Vec3();
			var aabb = this.AABB;
			var faceAABBs = this.faceAABBs;
			Vec3.set(aabb.min,99999,99999,99999);
			Vec3.mul(aabb.max,aabb.min,-1);
			for(var i=0;i<faces.length;i++){
				var face = faces[i];
				calcAABB_POLYGON(faceAABBs[i],poses[face.idx[0]],poses[face.idx[1]],poses[face.idx[2]]);
				Geono.addAABB(aabb,aabb,faceAABBs[i]);
			}
			
		};
		inherits(ret,PhyObj);
		return ret;
	})();

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
	inherits(Spring,PhyObj);
	
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
	inherits(SpringMesh,PhyObj);


	var Sphere = ret.Sphere = (function(){
		var ret = function(){
			PhyObj.apply(this);
			this.type=SPHERE;
		};
		inherits(ret,PhyObj);
		ret.prototype.calcPre=function(){
			var sc=this.scale;
			var si=this.size;
			this.bold = Math.max(Math.max(sc[0]*si[0],sc[1]*si[1]),sc[2]*si[2]);
			PhyObj.prototype.calcPre.call(this);
		}
		ret.prototype.calcSupport=function(ans,v){
			Vec3.copy(ans,this.location);
		};
		return ret;
	})();


	var Capsule = ret.Capsule = (function(){
		var ret = function(){
			PhyObj.apply(this);
			this.type=CAPSULE;
		};
		inherits(ret,PhyObj);
		ret.prototype.calcPre =function(){
			var sc=this.scale;
			var si=this.size;
			this.bold = Math.max(sc[0]*si[0],sc[1]*si[1]);
			var temp=this.size[2];
			this.size[2]=Math.max(temp - this.bold,0);
			PhyObj.prototype.calcPre.call(this);
			this.size[2]=temp;
		}
		ret.prototype.calcSupport=function(ans,v){
			var m=this.matrix;
			Vec3.set(ans,m[8],m[9],m[10]);
			if(Vec3.dot(ans,v)>0){
				Vec3.mul(ans,ans,-1);
			}
			Vec3.add(ans,ans,this.location);
		}
		return ret;
	})();

	var Cuboid = ret.Cuboid=function(){
		PhyObj.apply(this);
		this.type=CUBOID;
		//this.calcAABB = function(){
		//	var m=this.matrix;
		//	for(var i=0;i<3;i++){
		//		var l=Math.abs(m[i])+Math.abs(m[4+i])+Math.abs(m[8+i]);
		//		this.AABB.min[i]=-l;
		//		this.AABB.max[i]=+l;
		//	}
		//	Vec3.add(this.AABB.min,this.AABB.min,this.location);
		//	Vec3.add(this.AABB.max,this.AABB.max,this.location);
		//}
		this.calcSupport=function(ans,v){
			var cmat=this.matrix;
			Vec3.set(ans,0,0,0);
			for(var i=0;i<3;i++){
				var a=1;
				if(cmat[i*4+0]*v[0] + cmat[i*4+1]*v[1] + cmat[i*4+2]*v[2] > 0){
					a=-1;
				}
				ans[0]+=cmat[i*4+0]*a;
				ans[1]+=cmat[i*4+1]*a;
				ans[2]+=cmat[i*4+2]*a;
			}
			Vec3.add(ans,ans,this.location);
		}
	}
	inherits(Cuboid,PhyObj);

	var ConvexPolyhedron = ret.ConvexPolyhedron= function(n){
		PhyObj.apply(this);
		this.type=TRIANGLE;

		this.v=[];
		for(var i=0;i<n;i++){
			this.v.push(new Vec3());
		}
		this.calcSupport=function(ans,v){
			var l = Vec3.dot(v,this.v[0]);
			Vec3.copy(ans,this.v[0]);
			for(var i=1;i<this.v.length;i++){
				var l2 = Vec3.dot(v,this.v[i]);
				if(l>l2){
					l=l2;
					Vec3.copy(ans,this.v[i]);
				}
				
			}
			Vec3.add(ans,ans,this.location);
		}
	}
	inherits(ConvexPolyhedron,PhyObj);

	var Triangle = ret.Triangle = function(){
		ConvexPolyhedron.apply(this,[3]);
	}
	inherits(Triangle,ConvexPolyhedron);



	//オブジェクト種類
	var i=1
	var SPRING_MESH = ret.SPRING_MESH = i++
		,SPRING = ret.SPRING = i++
		,MESH = ret.MESH = i++
		,CUBOID = ret.CUBOID = i++
		,SPHERE = ret.SPHERE = i++
		,ELLIPSE = ret.ELLIPSE = i++
		,CAPSULE = ret.CAPSULE = i++
		,TRIANGLE = ret.TRIANGLE= i++
	;
	
	var bV0 = new Vec3()
	,bV1 = new Vec3()
	,bV2 = new Vec3()
	,bV3 = new Vec3()
	,bV4 = new Vec3()
	,bV5 = new Vec3()
	,bV6 = new Vec3()
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
			var res;
			if(type==CUBOID){
				res = new Cuboid();
			}else if(type==SPHERE){
				res = new Sphere();
			}else if(type==CAPSULE){
				res = new Capsule();
			}else{
				res=new Collision(type)
			}
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
				res.faceAABBs.push(new AABB());
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
		obj.calcPre();
	}

	var registHitInfo = function(obj,p,f,obj2){
		var hitInfo = hitInfos[hitInfoCount];
		hitInfoCount++;
		hitInfo.obj1 = obj;
		hitInfo.obj2 = obj2;
		Vec3.sub(hitInfo.pos1,p,obj.location);
		Vec3.sub(hitInfo.pos2,p,obj2.location);
		Vec3.add(hitInfo.pos2,hitInfo.pos2,f);
	}
	var registHitInfo2 = function(obj,p,obj2,p2){
		var hitInfo = hitInfos[hitInfoCount];
		hitInfoCount++;
		hitInfo.obj1 = obj;
		hitInfo.obj2 = obj2;
		Vec3.sub(hitInfo.pos1,p,obj.location);
		Vec3.sub(hitInfo.pos2,p2,obj2.location);
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

	var calcHitInfoBuf = new Vec3();
	var calcHitInfo = function(hitInfo){
		var obj1 = hitInfo.obj1;
		var obj2 = hitInfo.obj2;
		hitInfo.nImpulse = 0;
		Vec3.set(hitInfo.tImpulse,0,0,0);
		hitInfo.t2Impulse = 0;

		Vec3.add(hitInfo.nVec,obj2.location,hitInfo.pos2);
		Vec3.sub(hitInfo.nVec,hitInfo.nVec,obj1.location);
		Vec3.sub(hitInfo.nVec,hitInfo.nVec,hitInfo.pos1);
		hitInfo.tVec[0] = hitInfo.nVec[1];
		hitInfo.tVec[1] = -hitInfo.nVec[2];
		hitInfo.tVec[2] = -hitInfo.nVec[0];
		Vec3.cross(hitInfo.tVec,hitInfo.tVec,hitInfo.nVec);
		Vec3.cross(hitInfo.t2Vec,hitInfo.tVec,hitInfo.nVec);
		Vec3.norm(hitInfo.nVec);
		Vec3.norm(hitInfo.tVec);
		Vec3.norm(hitInfo.t2Vec);

		hitInfo.nEffic = calcEffic(hitInfo.nVec, hitInfo);
		calcEffic2(calcHitInfoBuf,hitInfo.tVec, hitInfo);
		hitInfo.tEffic2[0] = Vec3.dot(hitInfo.tVec,calcHitInfoBuf);
		hitInfo.tEffic2[1] = Vec3.dot(hitInfo.t2Vec,calcHitInfoBuf);
		calcEffic2(calcHitInfoBuf,hitInfo.t2Vec, hitInfo);
		hitInfo.t2Effic2[0] = Vec3.dot(hitInfo.tVec,calcHitInfoBuf);
		hitInfo.t2Effic2[1] = Vec3.dot(hitInfo.t2Vec,calcHitInfoBuf);

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
			obj.calcPre();
			


		}


		hitInfoCount = 0;
		impulseBufsCount = 0;
		var ans1=new Vec3();
		var ans2=new Vec3();
		var n=new Vec3();
		for(i = phyObjs.length;i--;){
			var obj1=phyObjs[i];
			for(j = i;j--;){
				var obj2=phyObjs[j];
				if(obj1.fix * obj2.fix){
					continue;
				}
				if(obj1.type==MESH){
					MESH_ANY(obj1,obj2);
					continue;
				}
				if(obj2.type==MESH){
					MESH_ANY(obj2,obj1);
					continue;
				}
				var func=hantei[obj1.type*8+obj2.type];
				if(func){
					func(obj1,obj2,dt);
				}else{
					if(!obj1.calcSupport || !obj2.calcSupport){
						continue;
					}
					var l=calcCLOSEST(ans1,ans2,obj1,obj2);
					l -= (obj1.bold + obj2.bold);
					if(l<0){
						Vec3.sub(n,ans2,ans1);
						Vec3.norm(n);
						Vec3.muladd(ans1,ans1,n,obj1.bold);
						Vec3.muladd(ans2,ans2,n,-obj2.bold);
						registHitInfo2(obj1,ans1,obj2,ans2);
					}
				}
			}
		}

		for(var i=0;i<hitInfoCount;i++){
			calcHitInfo(hitInfos[i]);
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
		for (var i = 0;i<hitInfoCount; i++) {
			var hitInfo = hitInfos[i];
			Vec3.mul(impulse, hitInfo.nVec, hitInfo.nImpulse );
			Vec3.add(impulse, impulse,  hitInfo.tImpulse );
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
				if(dv[0]*dv[0]+dv[1]*dv[1]+dv[2]*dv[2]>0.0001){
					max*=0.9;
				}
				Vec3.copy(bV0,hitInfo.tImpulse);
				//old = hitInfo.tImpulse;
				bV1[0] = Vec3.dot(hitInfo.tVec,dv);
				bV1[1] = Vec3.dot(hitInfo.t2Vec,dv);
				var x = Vec2.cross(bV1,hitInfo.t2Effic2)/Vec2.cross(hitInfo.tEffic2,hitInfo.t2Effic2);
				var y = Vec2.cross(bV1,hitInfo.tEffic2)/Vec2.cross(hitInfo.t2Effic2,hitInfo.tEffic2);
				Vec3.muladd(hitInfo.tImpulse,hitInfo.tImpulse,hitInfo.tVec,x);
				Vec3.muladd(hitInfo.tImpulse,hitInfo.tImpulse,hitInfo.t2Vec,y);
				var l =Vec3.scalar(hitInfo.tImpulse);
				if (l > max) {
					Vec3.mul(hitInfo.tImpulse,hitInfo.tImpulse,max/l);
				}
				Vec3.sub(impulse, hitInfo.tImpulse,bV0);
				addimpulse( hitInfo, impulse);

				//if(l<max){
				//	//calcDiffVelocity(dv,hitInfo);
				//	Vec3.sub(dv,hitInfo.obj1.v,hitInfo.obj2.v);
				//	Vec3.muladd(dv,dv,hitInfo.nVec,-Vec3.dot(dv,hitInfo.nVec));
				//	var d = Vec3.scalar(dv);
				//	if(d<0.0001){
				//		Vec3.mul(impulse,dv,1/(hitInfo.obj1.inv_mass+hitInfo.obj2.inv_mass))
				//		Vec3.muladd(hitInfo.obj1.v,hitInfo.obj1.v,impulse,hitInfo.obj1.inv_mass);
				//		Vec3.muladd(hitInfo.obj2.v,hitInfo.obj2.v,impulse,-hitInfo.obj2.inv_mass);
				//		Vec3.add(hitInfo.tImpulse,hitInfo.tImpulse,impulse);
				//	}

				//}
			}

			var sum= 0;
			for(i = phyObjs.length;i--;){
				var o = phyObjs[i];
				if(o.fix){continue;}
				var a=0;
				Vec3.sub(dv,o.oldv,o.v);
				a=(dv[0]*dv[0]+dv[1]*dv[1]+dv[2]*dv[2])*o.mass*o.mass;
				Vec3.sub(dv,o.oldrotV,o.rotV);
				Mat33.dotVec(dv,o.inertiaTensor,dv);
				a+=(dv[0]*dv[0]+dv[1]*dv[1]+dv[2]*dv[2]);

				sum+=a;
			}
			if ( sum<= 0.0000001 ) {
				break;
			}
		}
		ret.repetition=repetition;
		for (var i = 0;i<hitInfoCount; i++) {
			var hitInfo = hitInfos[i];

			Vec3.add(dv, hitInfo.pos2, hitInfo.obj2.location);
			Vec3.sub(dv, dv, hitInfo.obj1.location);
			Vec3.sub(dv, dv, hitInfo.pos1);
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
		}
		if(obj.con2){
			Vec3.sub(bV0,obj.p1,obj.con2.location);
			Vec3.mul(bV2,bV2,-1);
			addimpulse_(obj.con2,bV0,bV2);
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


	var CUBOID_LINE2_result = {};
	var CUBOID_LINE2 = function(mat,p0,p1){
		var r = new Vec3();
		var direction = new Vec3();
		var d = new Vec3();
		d[0]= mat[12] - p0[0];
		d[1]= mat[13] - p0[1];
		d[2]= mat[14] - p0[2]; //p0から箱中心までのベクトル
		Vec3.sub(direction,p1,p0); //線分のベクトル
		var maxin=-99999;
		var minout=99999;
		for(var i=0;i<3;i++){
			Vec3.set(r,mat[i*4+0],mat[i*4+1],mat[i*4+2]); //直交ベクトルを順番に取得。以下r成分に対しての計算
			var fulllen = Vec3.dot(r,direction); //線分分母
			var halflen = Vec3.dot(r,d); //p0から箱中心までの線分分子
			var size = (r[0]*r[0] + r[1]*r[1] + r[2]*r[2]);//箱サイズ
			if(fulllen==0){
				if(Math.abs(halflen)<size){
					continue;
				}else{
					maxin=99999;
					minout=-99999;
					break;
				}
			}

			var halfratio = halflen / fulllen; //箱中心までの線分比率
			var sizeratio = size / Math.abs(fulllen); //箱サイズの比率
			var inr= halfratio - sizeratio; //箱突入比率
			var outr= halfratio + sizeratio;//箱脱出比率
			if(maxin < inr){
				maxin = inr;
			}
			if(minout > outr){
				minout = outr;
			}
		}
		CUBOID_LINE2_result.inr = maxin;
		CUBOID_LINE2_result.outr = minout;
		
	}

	var ObjSub = ret.ObjSub = function(obj1,obj2){
		Collision.apply(this,[TRIANGLE]);
		this.obj1=obj1;
		this.obj2=obj2;
		this.calcAABB=function(){
			Vec3.sub(this.AABB.min,this.obj1.AABB.min,this.obj2.AABB.max);
			Vec3.sub(this.AABB.max,this.obj1.AABB.max,this.obj2.AABB.min);
		}
		this.calcSupport=function(ans,v){
			var ret = new Vec3();
			this.obj1.calcSupport(ans,v);
			var v2=new Vec3();
			Vec3.mul(v2,v,-1);
			this.obj2.calcSupport(ret,v2);
			Vec3.sub(ans,ans,ret);
		}
	}
	var conLINE_LINE=function(ans1,ans2,l1,l2,l3,l4){
		var dir1=new Vec3();
		var dir2=new Vec3();
		var cross=new Vec3();
		var cross2=new Vec3();
		var dpos=new Vec3();
		Vec3.sub(dir1,l2,l1);
		Vec3.sub(dir2,l4,l3);
		Vec3.cross(cross,dir1,dir2);
		if(Vec3.scalar(cross)==0){
			return 0;
		}

		Vec3.cross(cross2,cross,dir2);
		Vec3.sub(dpos,l3,l1);
		var r1 = Vec3.dot(dpos,cross2)/Vec3.dot(dir1,cross2);
		if(r1<0 || r1>1){
			return 0;
		}

		Vec3.cross(cross2,cross,dir1);
		Vec3.sub(dpos,l1,l3);
		var r2 = Vec3.dot(dpos,cross2)/Vec3.dot(dir2,cross2);
		if(r2<0 || r2>1){
			return 0;
		}
		Vec3.muladd(ans1,l1,dir1,r1);
		Vec3.muladd(ans2,l3,dir2,r2);
		return 1;
	}
	var conTRIANGLE_LINE = function(ans1,ans2,t1,t2,t3,l1,l2){

		var ts=[t1,t2,t3,t1];
		for(var i=0;i<3;i++){
			if(conLINE_LINE(ans,ans2,ts[i],ts[i+1],l1,l2)){
				return;
			}
		}
		var ls=[l1,l2];
		if(conTRIANGLE_POINTS(ans1,ans2,t1,t2,t3,ls)){
			return;
		}

	}
	var conTRIANGLE_POINTS = ret.conTRIANGLE_POINTS = function(ans,ans2,t1,t2,t3,ps){
		var dir1 = new Vec3(); 
		var dir2 = new Vec3();
		var cross = new Vec3();
		var cross2 = new Vec3();
		var dpos = new Vec3();
		var l1,l2;

		Vec3.sub(dir1,t2,t1); //線分1の向き
		Vec3.sub(dir2,t3,t1);// 線分2の向き
		Vec3.cross(cross,dir1,dir2); //垂直ベクトル

		Vec3.cross(cross2,dir1,cross); //法線と線分1に垂直なベクトル
		Vec3.mul(cross2,cross2,1/Vec3.dot(cross2,dir2));
		Vec3.cross(cross,dir2,cross); //法線と線分2に垂直なベクトル
		Vec3.mul(cross,cross,1/Vec3.dot(cross,dir1));

		for(var i=0;i<ps.length;i++){
			Vec3.sub(dpos,ps[i],t1);
			var r1=Vec3.dot(cross,dpos);
			var r2=Vec3.dot(cross2,dpos);

			if(r1+r2<=1 && r1>=0 && r2>=0 ){
				Vec3.muladd(ans,t1,dir1,r1);
				Vec3.muladd(ans,ans,dir2,r2);
				Vec3.copy(ans2,ps[i]);
				return 1;
			}
		}
		return 0;
	}
	var conTRIANGLE_TRIANGLE = ret.conTRIANGLE_TRIANGLE=function(ans1,ans2,t1,t2,t3,l1,l2,l3){

		var ts=[t1,t2,t3,t1];
		var ls=[l1,l2,l3,l1];
		for(var i=0;i<3;i++){
			for(var j=0;j<3;j++){
				if(conLINE_LINE(ans1,ans2,ts[i],ts[i+1],ls[j],ls[j+1])){
					return;
				}
			}
		}

		if(conTRIANGLE_POINTS(ans1,ans2,t1,t2,t3,ls)){
			return;
		}

		if( conTRIANGLE_POINTS(ans2,ans1,l1,l2,l3,ts)){
			return;
		}
	}

	var calcCLOSEST = ret.calcCLOSEST = (function(){

			var closestFace=function(){
				this.v=new Array(3);
				this.cross = new Vec3();
				this.len = 0;
			}
			var vertices=[];
			var vertices1=[];
			var vertices2=[];
			//var _faces=[];
			for(var i=0;i<256;i++){
				vertices.push(new Vec3());
				vertices1.push(new Vec3());
				vertices2.push(new Vec3());
			//	_faces.push(new closestFace());
			}

			var _addEdge = function(_edges,v1,v2){
				for(var j=0;j<_edges.length;j++){
					if((_edges[j][0]==v1 && _edges[j][1]==v2)
					|| (_edges[j][0]==v2 && _edges[j][1]==v1)){
						_edges.splice(j,1);
						return;
						
					}
				}
				var edge=[v1,v2];
				_edges.push(edge);
			}
		return	function(ans1,ans2,obj1,obj2){

		var p1= new Vec3();

		var s=new Vec3();
		var s1=new Vec3();
		var s2=new Vec3();
		var v=vertices;
		var v1=vertices1;
		var v2=vertices2;
		var vbuf=new Vec3();
		var va = new Vec3();
		var axis=new Vec3();

		//中心
		Vec3.add(va,obj1.AABB.min,obj1.AABB.max);
		Vec3.sub(va,va,obj2.AABB.min);
		Vec3.sub(va,va,obj2.AABB.max);
		Vec3.mul(axis,va,0.5);

		//点から中心までのベクトル
		//Vec3.sub(axis,va,p1);

		var idx=0;
		var counter=0;
		var next=3;

		while(1){
			counter++;
			//axisの向きで一番近い点をとる
			//objSub.calcSupport(s,va);
			obj1.calcSupport(s1,axis);
			Vec3.mul(axis,axis,-1);
			obj2.calcSupport(s2,axis);
			//Vec3.mul(axis,axis,-1);
			Vec3.sub(s,s1,s2);

			//取得した点が重複するかチェック
			for(var i=0;i<idx;i++){
				if(Vec3.len2(v[i],s)<0.00000001){
					//重複する場合はその時点での点が最短
					if(idx<DIMENSION){
						for(var j=idx;j<DIMENSION;j++){
							Vec3.copy(v1[j],v1[0]);
							Vec3.copy(v2[j],v2[0]);
						}
					}else{
						Vec3.copy(v1[next],v1[3]);
						Vec3.copy(v2[next],v2[3]);
					}
					Geono.TRIANGLE_TRIANGLE(ans1,ans2,v1[0],v1[1],v1[2]
							,v2[0],v2[1],v2[2]);
						//console.log(v1[0],v1[1],v1[2],obj2.location
						//		,v2[0],v2[1],v2[2]);
						//console.log(v[0],v[1],v[2],va,idx);
					return Vec3.len(ans1,ans2);
				}
			}
			if(counter>999){
				//無限ループ対策
				console.log("loooop!!");
				return 0;
			}

			if(idx<DIMENSION+1){
				//点が揃っていない場合は追加する
				Vec3.copy(v[idx],s);
				Vec3.copy(v1[idx],s1);
				Vec3.copy(v2[idx],s2);
				idx++;
			}else{
				//点が揃っている場合は一番遠いの？と入れ替える
				//var max=-1;
				//var n=-1;
				//for(i=0;i<idx;i++){
				//	var l=Vec3.dot(va,v[i]);
				//	if(max<l || n<0){
				//		max=l;
				//		n=i;
				//	}
				//}
				Vec3.copy(v[next],s);
				Vec3.copy(v1[next],s1);
				Vec3.copy(v2[next],s2);
			}

			//現在の取得点から目標点までの最短点を求める
			if(idx==1){
				Vec3.copy(axis,v[0]);
			}else if(idx==2){
				Geono.LINE_POINT(axis,v[0],v[1],p1);
				//Vec3.sub(vbuf,v[0],v[1]);
				//Vec3.sub(va,p1,v[0]);
				//Vec3.norm(vbuf);
				//Vec3.muladd(vbuf,va,vbuf,-Vec3.dot(vbuf,va));
				//Vec3.mul(va,vbuf,-1);
			}else if(idx==3){
				Geono.TRIANGLE_POINT(axis,v[0],v[1],v[2],p1);
				//Vec3.sub(vbuf,v[1],v[0]);
				//Vec3.sub(va,v[2],v[0]);
				//Vec3.cross(vbuf,va,vbuf);
				//Vec3.sub(va,p1,v[0]);
				//if(Vec3.dot(va,vbuf)<0){
				//	Vec3.mul(vbuf,vbuf,-1);
				//}
				//Vec3.mul(axis,vbuf,-1);
			}else{
				var min=-1;
				var flg=true;
				for(var i=0;i<4;i++){
					var t1=v[i];
					var t2=v[(i+1)&3];
					var t3=v[(i+2)&3];
					var t4=v[(i+3)&3];
					Vec3.sub(vbuf,t2,t1);
					Vec3.sub(s,t3,t1);
					Vec3.cross(vbuf,s,vbuf);
					Vec3.sub(s,p1,t1);
					var l1=Vec3.dot(s,vbuf);
					Vec3.sub(s,t4,t1);
					var l2=Vec3.dot(s,vbuf);

					if(l2*l2<=0.0000000001){
						//体積0の場合の例外処理
						var min=0;
						for(var j=0;j<4;j++){
							Geono.TRIANGLE_POINT(vbuf,v[j],v[(j+1)&3]
								,v[(j+2)&3],p1);
							var l =Vec3.len(vbuf,p1);
							if(j==0 || l<min){
								min=l;
								Vec3.copy(axis,vbuf);
								next=(j+3&3);
							}
						}
						flg=false;
						break;
					}else if( l1*l2<0){
						Geono.TRIANGLE_POINT(vbuf,t1,t2,t3,p1);
						//if(l2>0){
						//	Vec3.copy(va,vbuf);
						//}else{
						//	Vec3.mul(va,vbuf,-1);
						//}
						l=Vec3.len2(vbuf,p1);
						if(min<0 || l<min){
							min=l;
							Vec3.copy(axis,vbuf);
							next=(i+3)&3;
						}
						flg=false;
					}
				}
				if(flg){
					//内包する場合
					break;
				}
			}
		}

		//内包する場合
		var faces=[];
		var addEdge=_addEdge;
		var cross=new Vec3();
		var dir1=new Vec3();
		var dir2=new Vec3();
		for(var i=0;i<idx;i++){ 
			//現状4つの距離を計算
			var face=new closestFace();
			face.v[0]=i;
			face.v[1]=(i+1)&3;
			face.v[2]=(i+2)&3;
			Vec3.sub(dir1,v[face.v[1]],v[face.v[0]]);
			Vec3.sub(dir2,v[face.v[2]],v[face.v[0]]);
			Vec3.cross(face.cross,dir1,dir2);
			Vec3.norm(face.cross);
			face.len = Vec3.dot(face.cross,v[face.v[0]]);
			if(face.len<0){
				face.len*=-1;
				Vec3.mul(face.cross,face.cross,-1);
			}
			Geono.TRIANGLE_POINT(vbuf,v[face.v[0]],v[face.v[1]],v[face.v[2]],p1);
			face.len = Vec3.scalar(vbuf);
			faces.push(face);
		}
		while(1){
			var min=faces[0].len;
			var minn=0;
			//最短面探索
			for(var i=1;i<faces.length;i++){
				if(faces[i].len<min){
					min=faces[i].len;
					minn=i;
				}
			}
			var face = faces[minn];
			//最短面の法線取得
			Vec3.copy(cross,face.cross);
			Vec3.mul(cross,cross,-1);
			//サポ射
			obj1.calcSupport(s1,cross);
			Vec3.mul(cross,cross,-1);
			obj2.calcSupport(s2,cross);
			Vec3.sub(s,s1,s2);
			//重複チェック
			var flg=false;
			//for(var i=0;i<3;i++){
			//	if(Vec3.len2(v[face.v[i]],s)<0.00000001){
			//		flg=true;
			//	}
			//}

			for(var i=0;i<idx;i++){
				if(Vec3.len2(v[i],s)<0.00000001){
					flg=true;
				}
			}
			//if(Vec3.dot(s,face.cross)-face.len<0.000001){
			//	flg=true;
			//}
			if(flg){
				//重複する場合はその時点での点が最短
				Geono.TRIANGLE_TRIANGLE(ans1,ans2
						,v1[face.v[0]],v1[face.v[1]],v1[face.v[2]]
						,v2[face.v[0]],v2[face.v[1]],v2[face.v[2]]);
				//console.log(v1[face.v[0]],v1[face.v[1]],v1[face.v[2]]
				//		,v2[face.v[0]],v2[face.v[1]],v2[face.v[2]]);
				//console.log(v[face.v[0]],v[face.v[1]],v[face.v[2]]);
				//console.log(face.len);

				return -Vec3.len(ans1,ans2);
			}
			//重複しなかった場合はその点を追加
			Vec3.copy(v[idx],s);
			Vec3.copy(v1[idx],s1);
			Vec3.copy(v2[idx],s2);


			var edges=[];
			for(var i=faces.length;i--;){ 
				var face=faces[i];
				Vec3.sub(vbuf,s,v[face.v[0]]);
				if(Vec3.dot(vbuf,face.cross)>0){
					//エッジ追加
					addEdge(edges,face.v[0],face.v[1]);
					addEdge(edges,face.v[1],face.v[2]);
					addEdge(edges,face.v[2],face.v[0]);
					//face削除
					faces.splice(i,1);
				}
			}
			for(var i=0;i<edges.length;i++){
				//新たなfaceを追加、
				var edge=edges[i];
				var newface={};
				newface.cross=new Vec3();;
				newface.v=new Array(3);
				newface.v[0]=edge[0];
				newface.v[1]=edge[1];
				newface.v[2]=idx;

				faces.push(newface);
			
				Vec3.sub(dir1,v[newface.v[1]],v[newface.v[0]]);
				Vec3.sub(dir2,v[newface.v[2]],v[newface.v[0]]);
				Vec3.cross(newface.cross,dir1,dir2);
				Vec3.norm(newface.cross);
				newface.len = Vec3.dot(newface.cross,v[newface.v[2]]);
				if(newface.len<0){
					newface.len*=-1;
					Vec3.mul(newface.cross,newface.cross,-1);
				}
				Geono.TRIANGLE_POINT(vbuf,v[newface.v[0]],v[newface.v[1]],v[newface.v[2]],p1);
				newface.len = Vec3.scalar(vbuf);
			}
			idx++;
		}

		return 1;
	};
	})();

	var MESH_ANY=function(mesh,cuboid,dt){
		var meshdata= mesh.mesh; //メッシュ情報
		var faces =meshdata.faces;
		var poses = mesh.poses;
		var faceAABBs = mesh.faceAABBs;//フェイスAABB
		var ans1=new Vec3();
		var ans2=new Vec3();
		var n=new Vec3();
		var triangle = new Triangle();

		for(var i=0;i<faces.length;i++){
			var face = faces[i];
			var faceAABB = mesh.faceAABBs[i];

			if(!Geono.AABB_AABBhit(faceAABB,cuboid.AABB)){
				continue;
			}
			Vec3.copy(triangle.v[0],poses[face.idx[0]]);
			Vec3.copy(triangle.v[1],poses[face.idx[1]]);
			Vec3.copy(triangle.v[2],poses[face.idx[2]]);
			triangle.AABB = faceAABB;

			var l=calcCLOSEST(ans1,ans2,triangle,cuboid);
			l -= (mesh.bold + cuboid.bold);
			if(l<0){
				Vec3.sub(n,ans2,ans1);
				Vec3.norm(n);
				Vec3.muladd(ans1,ans1,n,mesh.bold);
				Vec3.muladd(ans2,ans2,n,-cuboid.bold);
				registHitInfo2(mesh,ans1,cuboid,ans2);

			}else{
			}
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
//	setHantei(MESH, SPHERE, MESH_SPHERE);
//	setHantei(MESH, CUBOID, MESH_CUBOID);
//	setHantei(MESH, CAPSULE, MESH_CAPSULE);


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
		var r = obj.bold ;
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
		var sc = obj.scale[2]*obj.size[2] - obj.bold;
		if(sc<0){
			//シリンダ部分がない場合
			return this.SPHERE_LINE2(p0,p1,obj.location,obj.bold);
		}

		Vec3.sub(t,p1,p0);
		r[0]=rotmat[6];
		r[1]=rotmat[7];
		r[2]=rotmat[8];
		Vec3.sub(d,p0,obj.location);
		Vec3.cross(n,r,t); //2線に垂直なベクトル
		Vec3.nrm(n,n);
		var nd = Vec3.dot(n,d);//垂直距離
		var y = obj.bold*obj.bold - nd*nd;
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
			return this.SPHERE_LINE2(p0,p1,d,obj.bold);

		}
		if(ra<-sc){
			Vec3.muladd(d,obj.location,r,-sc);
			return this.SPHERE_LINE2(p0,p1,d,obj.bold);
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

