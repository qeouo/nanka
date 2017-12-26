"use strict"
var OnoPhy = (function(){
	var MIN=Math.min;
	var MAX=Math.max;

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
	var GRAVITY = 9.81; //重力加速度
	var DELTA=0.00000001; //ちょっとずらしたいときに使う
	var REPETITION_MAX=50;
	var PENALTY = 200;
	var _dt; //ステップ時間
	var dv = new Vec3();
	var impulse = new Vec3();
	var impulseBufsCount=0;
	
	var ret = function(){
		this.phyObjs = new Array();
		this.collisions = new Array();
		this.repetition=0;
	}

	//物体の接触情報
	var HitInfo = function() {
		this.obj1 = null; //接触物体1
		this.obj2 = null; //接触物体2
		this.pos1 = new Vec3(); //接触相対位置1
		this.pos2 = new Vec3(); //接触相対位置2
		this.dpos = new Vec3();
		this.nVec = new Vec3(); //法線方向
		this.nEffic = 0; //法線方向に対する力の影響係数
		this.nImpulse = 0;  //法線方向にかかる力
		this.tVec = new Vec3(); //従法線1 /法線方向と垂直な方向
		//this.tEffic= 0; //従法線方向に対する力の影響係数
		this.tEffic2=new Vec2(); ///従法線1方向に対する力の影響係数
		this.t2Vec = new Vec3(); //従法線2 / 法線と従法線1に垂直な方向
		//this.t2Effic= 0; //従法線2方向に対する力の影響係数
		this.t2Effic2=new Vec2(); //従法線2方向に対する力の影響係数
		this.tImpulse = new Vec3(); //従法線1および2(法線以外)の方向にかかる力
		this.restCoe = 0; //2物体間の反発係数
		this.fricCoe = 0; //2物体間の摩擦係数
	}
	var hitInfos=[];
	var disableHitInfos=[];
	for(var i=0;i<128;i++){
		disableHitInfos.push(new HitInfo());
	}

	var PhyObj = (function(){
		var PhyObj = function(){
			//物理オブジェクト
			this.id=idcount;
			this.type = CUBOID; //オブジェクト種類
			this.fix=1; //1固定 0挙動計算対象
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
			this.inv_restCoe = 1.0/0.2; //反発係数の逆数
			this.inv_fricCoe = 1.0/0.8; //摩擦係数の逆数
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
	var Collision=(function(){
		var ret = function(){
			this.AABB= new AABB();
			this.location=new Vec3();
			this.rotation =new Vec3();
			this.size=new Vec3();
			Vec3.set(this.size,1,1,1);
			this.bold = 0; //太さ
			this.parent=null;
			this.matrix=new Mat44();
			this.oldmat=new Mat44();
		}
		ret.prototype.calcSupport=function(ret,axis){
			return;
		}
		var buf1=new Vec3();
		var buf2=new Vec3();
		ret.prototype.calcAABB=function(){
			var axis=buf2;
			var ret=buf1;

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
		var bM =new Mat44();
		ret.prototype.calcPre=function(){
			var m=this.matrix;
			var r=this.rotation;

			Mat43.getRotMat(m,r[0],1,0,0)
			Mat43.getRotMat(bM,r[1],0,1,0)
			Mat43.dot(m,bM,m);
			Mat43.getRotMat(bM,r[2],0,0,1)
			Mat43.dot(m,bM,m);

			//合成行列
			var sx=this.size[0];
			var sy=this.size[1];
			var sz=this.size[2];
			

			m[0]=m[0]*sx;
			m[1]=m[1]*sx;
			m[2]=m[2]*sx;
			m[3]=0;
			m[4]=m[4]*sy;
			m[5]=m[5]*sy;
			m[6]=m[6]*sy;
			m[7]=0;
			m[8]=m[8]*sz;
			m[9]=m[9]*sz;
			m[10]=m[10]*sz;
			m[11]=0;
			m[12]=this.location[0];
			m[13]=this.location[1];
			m[14]=this.location[2];
			m[15]=1;

			if(this.parent){
			Mat44.dot(m,this.parent.matrix,m);
			}

			//AABBを求める
			this.calcAABB();
		};
		return ret;
	})();

	var calcAABB_POLYGON= function(aabb,v1,v2,v3){
		for(var i=0;i<DIMENSION;i++){
			aabb.min[i]=(MIN(MIN(v1[i],v2[i]),v3[i]));
			aabb.max[i]=(MAX(MAX(v1[i],v2[i]),v3[i]));
		}
	}
	var Mesh = (function(){
		var ret= function(){
		//メッシュ
		Collision.apply(this);
		this.type=MESH;
		this.mesh=null; //メッシュ情報
		this.faceAABBs=[];//フェイスAABB
		this.poses=[]; //頂点座標
		};
		ret.prototype.calcPre=function(){
			Collision.prototype.calcPre.call(this);

			var m=this.matrix;
			var r=this.rotation;

			Mat43.getRotMat(m,r[0],1,0,0)
			Mat43.getRotMat(bM,r[1],0,1,0)
			Mat43.dot(m,bM,m);
			Mat43.getRotMat(bM,r[2],0,0,1)
			Mat43.dot(m,bM,m);

			//合成行列
			m[12]=this.location[0];
			m[13]=this.location[1];
			m[14]=this.location[2];

			Mat44.dot(m,this.parent.matrix,m);

			var vertices = this.mesh.vertices;
			var poses= this.poses;
			var matrix = this.matrix;
			for(var j=0;j<poses.length;j++){
				Mat43.dotMat43Vec3(poses[j],matrix,vertices[j].pos);
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
		inherits(ret,Collision);
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


	var Sphere = ret.Sphere = (function(){
		var ret = function(){
			Collision.apply(this);
			this.type=SPHERE;
		};
		inherits(ret,Collision);
		ret.prototype.calcPre=function(){
			var sc=this.parent.scale;
			var si=this.size;
			this.bold = MAX(MAX(sc[0]*si[0],sc[1]*si[1]),sc[2]*si[2]);
			Collision.prototype.calcPre.call(this);
		}
		ret.prototype.calcSupport=function(ans,v){
			ans[0]=this.matrix[12];
			ans[1]=this.matrix[13];
			ans[2]=this.matrix[14];
		};
		return ret;
	})();


	var Capsule = ret.Capsule = (function(){
		var ret = function(){
			Collision.apply(this);
			this.type=CAPSULE;
		};
		inherits(ret,Collision);
		ret.prototype.calcPre =function(){
			var m=this.matrix;
			var location=this.location;
			var size=this.size;

			var sizen=0;
			if(size[0]<size[1]){
				sizen=1;
			}

			var r=this.rotation;

			Mat43.getRotMat(m,r[0],1,0,0)
			Mat43.getRotMat(bM,r[1],0,1,0)
			Mat43.dot(m,bM,m);
			Mat43.getRotMat(bM,r[2],0,0,1)
			Mat43.dot(m,bM,m);

			//合成行列
			var sx=size[0];
			var sy=size[1];
			var sz=size[2];
			sz=MAX(sz- size[sizen],0);

			m[0]*=sx;
			m[1]*=sx;
			m[2]*=sx;
			m[3]=0;
			m[4]*=sy;
			m[5]*=sy;
			m[6]*=sy;
			m[7]=0;
			m[8]*=sz;
			m[9]*=sz;
			m[10]*=sz;
			m[11]=0;
			m[12]=location[0];
			m[13]=location[1];
			m[14]=location[2];
			m[15]=1;

			Mat44.dot(m,this.parent.matrix,m);

			this.bold = Math.sqrt(m[sizen*4]*m[sizen*4] + m[sizen*4+1]*m[sizen*4+1] + m[sizen*4+2]*m[sizen*4+2]);

			//AABBを求める
			this.calcAABB();
		}
		ret.prototype.calcSupport=function(ans,v){
			var m=this.matrix;
			Vec3.set(ans,m[8],m[9],m[10]);
			if(Vec3.dot(ans,v)>0){
				Vec3.mul(ans,ans,-1);
			}
			ans[0]+=m[12];
			ans[1]+=m[13];
			ans[2]+=m[14];

		}
		return ret;
	})();

	var Cuboid = ret.Cuboid = (function(){
		var ret = function(){
			Collision.apply(this);
			this.type=CUBOID;
		}
		ret.prototype.calcSupport=function(ans,v){
			//var m=this.matrix;
			//Vec3.set(ans,0,0,0);
			//for(var i=0;i<3;i++){
			//var a =1;
			//	if(m[i*4]*v[0] + m[i*4+1]*v[1] + m[i*4+2]*v[2] > 0){
			//		a=-1;
			//	}
			//	ans[0]+=m[i*4]*a;
			//	ans[1]+=m[i*4+1]*a;
			//	ans[2]+=m[i*4+2]*a;
			//}
			//Vec3.add(ans,ans,this.location);
			var m=this.matrix;
			if(m[0]*v[0] + m[1]*v[1] + m[2]*v[2] > 0){
				ans[0]=-1;
			}else{
				ans[0]=1;
			}
			if(m[4]*v[0] + m[5]*v[1] + m[6]*v[2] > 0){
				ans[1]=-1;
			}else{
				ans[1]=1;
			}
			if(m[8]*v[0] + m[9]*v[1] + m[10]*v[2] > 0){
				ans[2]=-1;
			}else{
				ans[2]=1;
			}

			Mat43.dotMat43Vec3(ans,m,ans);
//			Vec3.add(ans,ans,this.location);
		}
		return ret;
	})();
	inherits(Cuboid,Collision);

	var ConvexPolyhedron = ret.ConvexPolyhedron= function(n){
		Collision.apply(this);
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
			ans[0]+=this.matrix[12];
			ans[1]+=this.matrix[13];
			ans[2]+=this.matrix[14];
		}
	}
	inherits(ConvexPolyhedron,Collision);

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

	var idcount=0;

	ret.prototype.createPhyObj= function(){
		var obj =new PhyObj();
		obj.id=idcount;
		idcount++;
		this.phyObjs.push(obj);
		return obj;
	}
	ret.prototype.createCollision = function(type){
			//コリジョンオブジェクト作成
			var res;
			if(type==CUBOID){
				res = new Cuboid();
			}else if(type==SPHERE){
				res = new Sphere();
			}else if(type==CAPSULE){
				res = new Capsule();
			}else{
				return null;
			}
			this.collisions.push(res)

			return res;
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
			obj.id=idcount;
			idcount++;
			this.phyObjs.push(obj)
			return obj; 
		}
	ret.prototype.createMesh = function(mesh){
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
			this.collisions.push(res)
			return res;
		}
	ret.prototype.deleteCollision = function(obj){
		var collisions=this.collisions;
		for(var i=0;i<collisions.length;i++){
			if(collisions[i] == obj){
				collisions.splice(i,1);
				break;
			}
		}
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
					break
				}
			}
		}
	ret.prototype.calc = function(dt,step){
			//物理計算
			for(var i=step;i--;){
				this.calc_t(dt/step);
			}

		}
	

	var registHitInfo = (function(){
		var vec3=new Vec3();
		var vec32=new Vec3();
		return function(col1,pos1,col2,pos2){
			var obj1=col1.parent;
			var obj2=col2.parent;

			var hitInfo = null;
			Vec3.sub(vec3,pos1,obj1.location);
			Vec3.sub(vec32,pos2,obj2.location);
			var counter=0;
			for(var i=0;i<hitInfos.length;i++){
				if(hitInfos[i].col1!= col1 || hitInfos[i].col2!=col2){
					continue;
				}

				counter++;
				if(!hitInfo){
					if(Vec3.len2(hitInfos[i].pos1,vec3)>0.000001){
						continue;
					}
					if(Vec3.len2(hitInfos[i].pos2,vec32)>0.000001){
						continue;
					}

					hitInfo = hitInfos[i];
					hitInfos.splice(i,1);
				}
			}	
			if(!hitInfo){
				hitInfo = disableHitInfos.pop();
				hitInfo.obj1 = obj1;
				hitInfo.obj2 = obj2;
				hitInfo.col1=col1;
				hitInfo.col2=col2;

				hitInfo.nImpulse = 0;
				Vec3.set(hitInfo.tImpulse,0,0,0);
				hitInfo.t2Impulse = 0;

				hitInfo.fricCoe = 2.0/(obj1.inv_fricCoe + obj2.inv_fricCoe);
				hitInfo.restCoe = 2.0/(obj1.inv_restCoe + obj2.inv_restCoe);

				Vec3.copy(hitInfo.pos1,vec3);
				Vec3.copy(hitInfo.pos2,vec32);

				Vec3.sub(hitInfo.dpos,obj2.location,obj1.location);
			}else{
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
			hitInfos.push(hitInfo);


			Vec3.sub(hitInfo.nVec,pos2,pos1);
			Vec3.norm(hitInfo.nVec);


			hitInfo.tVec[0] = hitInfo.nVec[1];
			hitInfo.tVec[1] = -hitInfo.nVec[2];
			hitInfo.tVec[2] = -hitInfo.nVec[0];
			Vec3.cross(hitInfo.tVec,hitInfo.tVec,hitInfo.nVec);
			Vec3.cross(hitInfo.t2Vec,hitInfo.tVec,hitInfo.nVec);
			Vec3.norm(hitInfo.tVec);
			Vec3.norm(hitInfo.t2Vec);

			hitInfo.nEffic = calcEffic(hitInfo.nVec, hitInfo);
			calcEffic2(vec3,hitInfo.tVec, hitInfo);
			hitInfo.tEffic2[0] = Vec3.dot(hitInfo.tVec,vec3);
			hitInfo.tEffic2[1] = Vec3.dot(hitInfo.t2Vec,vec3);
			calcEffic2(vec3,hitInfo.t2Vec, hitInfo);
			hitInfo.t2Effic2[0] = Vec3.dot(hitInfo.tVec,vec3);
			hitInfo.t2Effic2[1] = Vec3.dot(hitInfo.t2Vec,vec3);


			hitInfo.counter=0;


		};
	})();
	
	var calcHitInfo = (function(){
		var calcHitInfoBuf = new Vec3();
		return function(hitInfo){

		}
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
	ret.prototype.calc_t=function(dt){
		_dt=dt;
		var i,j,k
		,AIR_DAMPER=Math.pow(0.95,dt) 
		,DAMPERD=Math.pow(0.5,dt) 
		,REFLECT_DAMPER=1-Math.pow(0.1,dt)
		,obj,obj2
		,x,y,z,nx,ny,nz
		,matrix
		,detdt=1/dt
		,phyObjs = this.phyObjs;
		
		cnt=0;

		impulseBufsCount = 0;
		var ans1=new Vec3();
		var ans2=new Vec3();
		var n=new Vec3();
		var start=Date.now();
		var collisions=this.collisions;

		for(i = phyObjs.length;i--;){
			//判定用行列更新
			obj = phyObjs[i];
			obj.calcPre();
		}
		for(var i= collisions.length;i--;){
			var col=collisions[i];
			if(col.parent.fix){
				col.moveflg=0;
				continue;
			}
			var l=Mat43.compare(col.oldmat,col.matrix);
			if(l<=0.00000001){
				col.moveflg=0;
			}else{
				col.moveflg=1;
				Mat43.copy(col.oldmat,col.matrix);
			}
		}

		//hitInfos=[];
		for(var i=0;i<hitInfos.length;i++){
			var hitInfo = hitInfos[i];
			if((hitInfo.col1.moveflg || hitInfo.col2.moveflg) && hitInfo.counter>5){
				hitInfos.splice(i,1);
				disableHitInfos.push(hitInfo);
				i--;
			}else{
				if(hitInfo.col1.moveflg || hitInfo.col2.moveflg){
					hitInfo.counter++;
				}
			}
		}	

		for(var i = collisions.length;i--;){
			var obj1=collisions[i];
			if(obj1.type==SPRING){
				continue;
			}
			for(j = i;j--;){
				var obj2=collisions[j];
				if(obj2.type==SPRING){
					continue;
				}
				if(!obj1.moveflg && !obj2.moveflg){
					continue;
				}

				if(!Geono.AABB_AABBhit(obj1.AABB,obj2.AABB)){
					continue;
				}
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
						registHitInfo(obj1,ans1,obj2,ans2);
					}
				}
			}
		}

//		console.log(Date.now()-start);
		//console.log(cnt);


		for(var i=0;i<hitInfos.length;i++){
			var hitInfo=hitInfos[i];
			calcDiffVelocity(dv,hitInfo);
			hitInfo.repulsion = Vec3.dot(dv, hitInfo.nVec) * hitInfo.restCoe *hitInfo.nEffic;
		}	
		for (var i = 0;i<hitInfos.length; i++) {
			var hitInfo = hitInfos[i];
			Vec3.mul(impulse, hitInfo.nVec, hitInfo.nImpulse );
			Vec3.add(impulse, impulse,  hitInfo.tImpulse );
			addimpulse( hitInfo, impulse);
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

		var repetition;
		for (repetition = 0; repetition < REPETITION_MAX; repetition++) {
			for(i = phyObjs.length;i--;){
				var o = phyObjs[i];
				Vec3.copy(o.oldv,o.v);
				Vec3.copy(o.oldrotV,o.rotV);
			}

			for (var i = 0;i<hitInfos.length; i++) {
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
		this.repetition=repetition;
		for (var i = 0;i<hitInfos.length; i++) {
			//重なり時の押出し
			var hitInfo = hitInfos[i];
			if(hitInfo.counter>0){
				continue;
			}

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
				calcAABB_POLYGON(faceAABBs[i],poses[face[0]],poses[face[1]],poses[face[2]]);
				Geono.addAABB(aabb,aabb,faceAABBs[i]);
			}
			
		};



		var ans1=new Vec3();
		var ans2=new Vec3();
		var n=new Vec3();
		var triangle = new Triangle();
		for(var i=0;i<this.collisions.length;i++){
			var collision=this.collisions[i];
			if(!Geono.AABB_AABBhit(aabb,collision.AABB)){
				continue;
			}
			if(collision.type==MESH){
				var mesh=collision.mesh;
				var faceAABBs2 = collision.faceAABBs;
				var triangle2 = new Triangle();
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

						var l=calcCLOSEST(ans1,ans2,triangle,triangle2);
						if(l<(springmesh.bold+collision.bold) && l!=0){
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

					var l=calcCLOSEST(ans1,ans2,triangle,collision);
					if(l<(springmesh.bold+collision.bold) && l!=0){
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

var cnt;
	var calcCLOSEST = ret.calcCLOSEST = (function(){

			var TRIANGLE_TRIANGLE=function(ans1,ans2,t1,t2,t3,t4,t5,t6){
				var ts1=[t1,t2,t3,t1];
				var ts2=[t4,t5,t6,t4];
				var min=-1;
				var ret1=new Vec3();
				var ret2=new Vec3();

				for(var i=0;i<3;i++){
					for(var j=0;j<3;j++){
						Geono.LINE_LINE(ret1,ret2,ts1[i],ts1[i+1],ts2[i],ts2[i+1]);
						if(min<0 || Vec3.len2(ret1,ret2)<min){
							min=Vec3.len2(ret1,ret2);
							Vec3.copy(ans1,ret1);
							Vec3.copy(ans2,ret2);
						}
					}
				}
				for(var i=0;i<3;i++){
					Geono.TRIANGLE_POINT(ret1,ts1[0],ts1[1],ts1[2],ts2[i]);
					if(min<0 || Vec3.len2(ret1,ts2[i])<min){
						min=Vec3.len2(ret1,ts2[i]);
						Vec3.copy(ans1,ret1);
						Vec3.copy(ans2,ts2[i]);
					
					}
					Geono.TRIANGLE_POINT(ret1,ts2[0],ts2[1],ts2[2],ts1[i]);
					if(min<0 || Vec3.len2(ret1,ts1[i])<min){
						min=Vec3.len2(ret1,ts2[i]);
						Vec3.copy(ans1,ts1[i]);
						Vec3.copy(ans2,ret1);
					
					}
				}

			}
			var closestFace=function(){
				this.v=new Array(3);
				this.cross = new Vec3();
				this.len = 0;
			}
			var vertices=[];
			var vertices1=[];
			var vertices2=[];
			var faces=[];
			var _edges=[];
			var _edgesIndex;
			var faceIndex;
			var idx;
			for(var i=0;i<256;i++){
				vertices.push(new Vec3());
				vertices1.push(new Vec3());
				vertices2.push(new Vec3());
				faces.push(new closestFace());
				var edge=[-1,-1];
				_edges.push(edge);
			}

			var addFaceBuf=new Vec3();
			var _addFace = function(v1,v2,v3,obj1,obj2){
				var vs = vertices;
				//現状4つの距離を計算
				var face;
				var i;
				for(i=0;i<faceIndex;i++){
					if(faces[i].len<0){
						break;
					}
				}
				if(i==faceIndex){
					faceIndex++;
				}
				face=faces[i];
				face.v[0]=v1;
				face.v[1]=v2;
				face.v[2]=v3;
				var dx1=vs[v2][0] - vs[v1][0];
				var dy1=vs[v2][1] - vs[v1][1];
				var dz1=vs[v2][2] - vs[v1][2];
				var dx2=vs[v3][0] - vs[v1][0];
				var dy2=vs[v3][1] - vs[v1][1];
				var dz2=vs[v3][2] - vs[v1][2];
				face.cross[0]=dy1*dz2 - dz1*dy2;
				face.cross[1]=dz1*dx2 - dx1*dz2;
				face.cross[2]=dx1*dy2 - dy1*dx2;
				Vec3.norm(face.cross);
				face.len = Vec3.dot(face.cross,vs[v1]);

				if(face.len<0){
					face.len*=-1;
					Vec3.mul(face.cross,face.cross,-1);
				}

				if(face.len<0.000001){

					for(var i=0;i<idx;i++){
						if(i==v1 || i==v2 || i==v3){
							continue;
						}

						if(Vec3.dot(face.cross,vs[i])>0){
							Vec3.mul(face.cross,face.cross,-1);
							break;
						}
					}
					
				}

				Geono.TRIANGLE_POINT(addFaceBuf,vs[v1],vs[v2],vs[v3],ZERO_VECTOR);
				face.len = Vec3.scalar2(addFaceBuf);
			}
			for(var i=0;i<128;i++){
				var edge=[-1,-1];
				_edges.push(edge);
			}
			var _addEdge = function(v1,v2){
				for(var j=0;j< _edgesIndex;j++){
					if((_edges[j][0]==v1 && _edges[j][1]==v2)
					|| (_edges[j][0]==v2 && _edges[j][1]==v1)){
						//_edges.splice(j,1);
						_edges[j][0]=-1;
						return;
						
					}
				}
				var idx;
				for(idx=0;idx<_edgesIndex;idx++){
					if(_edges[idx][0]<0){
						break;
					}
				}
				if(idx==_edgesIndex){
					_edgesIndex++;
				}
				var edge=_edges[idx];//[v1,v2];
				edge[0]=v1;
				edge[1]=v2;
				//_edges.push(edge);
			}
			var buf1=new Vec3();
			var buf2=new Vec3();
			var buf3=new Vec3();
			var buf4=new Vec3();
			var buf5=new Vec3();
			var buf6=new Vec3();
			var buf7=new Vec3();
			var buf8=new Vec3();
			var buf9=new Vec3();
	return function(ans1,ans2,obj1,obj2){
		var s= buf2;
		var s1= buf3;
		var s2= buf4;
		var v=vertices;
		var v1=vertices1;
		var v2=vertices2;
		var vbuf= buf5;
		var axis= buf7;
		var sup1=obj1.calcSupport;
		var sup2=obj2.calcSupport;

		//中心
//		Vec3.add(va,obj1.AABB.min,obj1.AABB.max);
//		Vec3.sub(va,va,obj2.AABB.min);
//		Vec3.sub(va,va,obj2.AABB.max);
//		Vec3.mul(axis,va,0.5);
		axis[0]=(obj1.AABB.min[0]+obj1.AABB.max[0] - obj2.AABB.min[0] - obj2.AABB.max[0])*0.5;
		axis[1]=(obj1.AABB.min[1]+obj1.AABB.max[1] - obj2.AABB.min[1] - obj2.AABB.max[1])*0.5;
		axis[2]=(obj1.AABB.min[2]+obj1.AABB.max[2] - obj2.AABB.min[2] - obj2.AABB.max[2])*0.5;

		cnt++;
		idx=0;
		var counter=0;
		var next=3;
		var min=9999999999999999;
		while(1){
			counter++;
			//axisの向きで一番近い点をとる
			obj1.calcSupport(s1,axis);
			axis[0]*=-1;
			axis[1]*=-1;
			axis[2]*=-1;
			obj2.calcSupport(s2,axis);
			s[0]=s1[0]-s2[0];
			s[1]=s1[1]-s2[1];
			s[2]=s1[2]-s2[2];
		
			//取得した点が重複するかチェック
			//if(idx>0){
				if(Vec3.dot(s,axis)+min<0.00000001){
//			for(var i=0;i<idx;i++){
//				Vec3.sub(vbuf,s,v[i]);
//				if(Math.abs(Vec3.dot(vbuf,axis))<0.0000000000001){
					//重複する場合はその時点での点が最短
					if(idx==1){
						Vec3.copy(ans1,v1[0]);
						Vec3.copy(ans2,v2[0]);
					}else if(idx==2){
						Geono.LINE_LINE(ans1,ans2,v1[0],v1[1],v2[0],v2[1]);
					}else if(idx==3){
						TRIANGLE_TRIANGLE(ans1,ans2,v1[0],v1[1],v1[2]
							,v2[0],v2[1],v2[2]);
					}else{
						//頂点が4つある場合は最も遠い点を無視する
						Vec3.copy(v1[next],v1[3]);
						Vec3.copy(v2[next],v2[3]);
						TRIANGLE_TRIANGLE(ans1,ans2,v1[0],v1[1],v1[2]
							,v2[0],v2[1],v2[2]);
					}
					//console.log(v1[0],v1[1],v1[2],obj2.location
					//		,v2[0],v2[1],v2[2]);
						//console.log(v[0],v[1],v[2],va,idx);
					return Vec3.len(ans1,ans2);
				}
			//}
			if(counter>999){
				//無限ループ対策
				console.log("loooop!!");
				return 0;
			}

			if(idx<DIMENSION+1){
				//点が揃っていない場合は追加する
				next=idx;
				idx++;
			}
			//点が揃っている場合は一番遠いの？と入れ替える
			Vec3.copy(v[next],s);
			Vec3.copy(v1[next],s1);
			Vec3.copy(v2[next],s2);
			

			//現在の取得点から目標点までの最短点を求める
			if(idx==1){
				Vec3.copy(axis,v[0]);
				min=Vec3.scalar2(axis);
			}else if(idx==2){
				Geono.LINE_POINT(axis,v[0],v[1],ZERO_VECTOR);
				min=Vec3.scalar2(axis);
				if(!(axis[0] || axis[1] || axis[2])){
					//接触している場合は適当に垂直な方向をとる
					axis[0]=-(v[0][1]-v[1][1]);
					axis[1]=v[0][2]-v[1][2];
					axis[2]=v[0][0]-v[1][0];
				}
			}else if(idx==3){
				Geono.TRIANGLE_POINT(axis,v[0],v[1],v[2],ZERO_VECTOR);
				min=Vec3.scalar2(axis);
				if(!(axis[0] || axis[1] || axis[2])){
					//接触している場合は適当に法線をとる
					Vec3.sub(vbuf,v[1],v[0]);
					Vec3.sub(axis,v[2],v[0]);
					Vec3.cross(axis,vbuf,axis);
				}
			}else{
				//console.log(v1[0],v1[1],v1[2],v1[3]
				//		,v2[0],v2[1],v2[2],v2[3]);
				min=-1;
				var flg=true;
				for(var i=0;i<4;i++){
					var t1=v[i];
					var t2=v[(i+1)&3];
					var t3=v[(i+2)&3];
					var t4=v[(i+3)&3];
					Vec3.sub(vbuf,t2,t1);
					Vec3.sub(s,t3,t1);
					Vec3.cross(vbuf,s,vbuf);
					var l1=-Vec3.dot(t1,vbuf); //面から原点までの距離
					Vec3.sub(s,t4,t1);
					var l2=Vec3.dot(s,vbuf); //面からもうひとつの頂点までの距離

					if(l2*l2<=0.0000000001
					|| l1*l2<0){
						flg=false;
						Geono.TRIANGLE_POINT(vbuf,t1,t2,t3,ZERO_VECTOR);
						var l=vbuf[0]*vbuf[0]+vbuf[1]*vbuf[1]+vbuf[2]*vbuf[2];//面と原点との距離^2
						if(min<0 || l<min){
							min=l;
							Vec3.copy(axis,vbuf);
							next=(i+3)&3;
						}
					}
				}
				if(flg){
					//内包する場合
					break;
				}
			}

		}

		//内包する場合
		var addFace = _addFace;
		var addEdge=_addEdge;
		var edges=_edges;
		faceIndex=0;
		for(var i=0;i<idx;i++){ 
			//現状4つの距離を計算
			addFace(i,(i+1)&3,(i+2)&3,obj1,obj2);
		}
		while(1){
			var min=faces[0].len;
			var minn=0;
			//最短面探索
			for(var i=1;i<faceIndex;i++){
				if(faces[i].len<min && faces[i].len>=0){
					min=faces[i].len;
					minn=i;
				}
			}
			var face = faces[minn];
			//最短面の法線取得
			Vec3.mul(axis,face.cross,-1);
			//サポ射
			obj1.calcSupport(s1,axis);
			Vec3.mul(axis,axis,-1);
			obj2.calcSupport(s2,axis);
			Vec3.sub(s,s1,s2);
			//重複チェック
			var flg=false;

			//for(var i=0;i<idx;i++){
			//	if(Vec3.len2(v[i],s)<0.00000001){
			if(Vec3.dot(s,axis) - Vec3.dot(v[face.v[0]],axis)<0.00001){
					//重複する場合はその時点での点が最短
					TRIANGLE_TRIANGLE(ans1,ans2
							,v1[face.v[0]],v1[face.v[1]],v1[face.v[2]]
							,v2[face.v[0]],v2[face.v[1]],v2[face.v[2]]);
					//console.log(v1[face.v[0]],v1[face.v[1]],v1[face.v[2]]
					//		,v2[face.v[0]],v2[face.v[1]],v2[face.v[2]]);
					//console.log(v[face.v[0]],v[face.v[1]],v[face.v[2]]);
					//console.log(face.len);

					return -Vec3.len(ans1,ans2);
				}
			//}
			//重複しなかった場合はその点を追加
			Vec3.copy(v[idx],s);
			Vec3.copy(v1[idx],s1);
			Vec3.copy(v2[idx],s2);

			_edgesIndex=0;
			for(var i=0;i<faceIndex;i++){
				var face=faces[i];
				if(face.len<0){
					continue;
				}
				Vec3.sub(vbuf,s,v[face.v[0]]);
				if(Vec3.dot(vbuf,face.cross)>0){
					//エッジ追加
					addEdge(face.v[0],face.v[1]);
					addEdge(face.v[1],face.v[2]);
					addEdge(face.v[2],face.v[0]);
					//face削除
					//faces.splice(i,1);
					face.len=-1;
				}
			}
			for(var i=0;i<_edgesIndex;i++){
				if(edges[i][0]<0){
					continue;
				}
				//新たなfaceを追加、
				addFace(edges[i][0],edges[i][1],idx,obj1,obj2);
			}
			idx++;
		}

		return 1;
	};
	})();

	var MESH_ANY=function(obj1,obj2,dt){
		var faces =obj1.mesh.faces;
		var poses = obj1.poses;
		var faceAABBs = obj1.faceAABBs;//フェイスAABB
		var ans1=new Vec3();
		var ans2=new Vec3();
		var n=new Vec3();
		var triangle = new Triangle();

		for(var i=0;i<faces.length;i++){
			var face = faces[i];

			if(!Geono.AABB_AABBhit(faceAABBs[i],obj2.AABB)){
				continue;
			}
			triangle.v[0]=poses[face.idx[0]];
			triangle.v[1]=poses[face.idx[1]];
			triangle.v[2]=poses[face.idx[2]];
			triangle.AABB = faceAABBs[i];

			var l=calcCLOSEST(ans1,ans2,triangle,obj2);
			l -= (obj1.bold + obj2.bold);
			if(l<0){
				Vec3.sub(n,ans2,ans1);
				Vec3.norm(n);
				Vec3.muladd(ans1,ans1,n,obj1.bold);
				Vec3.muladd(ans2,ans2,n,-obj2.bold);
				registHitInfo(obj1,ans1,obj2,ans2);

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
	
	//setHantei(SPRING_MESH, CAPSULE, SPRINGMESH_CAPSULE);

	ret.SPHERE_LINE = function(p0,p1,obj) {
		var t = bV0;
		var d = bV1;
		var m = obj.matrix;
		Vec3.sub(t,p1,p0);

		//Vec3.sub(d,obj.location,p0);
		d[0]=m[12]-p0[0];
		d[1]=m[13]-p0[1];
		d[2]=m[14]-p0[2];
		var tl = Vec3.scalar(t);
		var l2 = Vec3.dot(d,t)/tl;
		Vec3.mul(bV2,t,l2/tl);
		Vec3.sub(bV2,bV2,d);
		var l = Vec3.scalar(bV2);
		var r = obj.bold ;
		if(l>r){
			return -1;
		}
		r = r*r - l*l;
		r = Math.sqrt(r);
		l2 -= r;
		return l2/tl;

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
			return -1;
		}
		r = r*r - l*l;
		r = Math.sqrt(r);
		l2 -= r;
		return l2/tl;

	}
	ret.CAPSULE_LINE = function(p0,p1,obj) {
		var t = bV0;
		var d = bV1;
		var n = bV2;
		var r = bV3;
		var n2 = bV4;
		var rotmat=obj.rotmat;
		var m = obj.matrix;
		var sc = Math.sqrt(m[8]*m[8]+m[9]*m[9]+m[10]*m[10]); //円柱長さ
		if(sc<=0){
			//シリンダ部分がない場合
			return this.SPHERE_LINE(p0,p1,obj);
		}

		Vec3.sub(t,p1,p0);
		r[0]=m[8];
		r[1]=m[9];
		r[2]=m[10];

		//円柱中心から線分までの距離
		d[0]=-(m[12]-p0[0]);
		d[1]=-(m[13]-p0[1]);
		d[2]=-(m[14]-p0[2]);

		Vec3.cross(n,r,t); //2線に垂直なベクトル
		Vec3.norm(n);

		var y = obj.bold - Math.abs(Vec3.dot(n,d)); //表面との差分
		if(y < 0){
			//半径より大きい場合
			return -1;
		}
		Vec3.cross(n2,n,r); //円柱に対して垂直なベクトル
		Vec3.norm(n2);
		if(Vec3.dot(t,n2)<0){
			y*=-1;
		}
		var len = (-Vec3.dot(d,n2)-y)/Vec3.dot(t,n2);
		Vec3.muladd(d,d,t,len);
		var ra = Vec3.dot(r,d);
		if(ra>sc){
			d[0]=m[12]+r[0]*sc;
			d[1]=m[13]+r[1]*sc;
			d[2]=m[14]+r[2]*sc;
			return this.SPHERE_LINE2(p0,p1,d,obj.bold);

		}
		if(ra<-sc){
			d[0]=m[12]-r[0]*sc;
			d[1]=m[13]-r[1]*sc;
			d[2]=m[14]-r[2]*sc;
			return this.SPHERE_LINE2(p0,p1,d,obj.bold);
		}

		return len;

	}
	ret.CUBOID_LINE = function(p0,p1,obj) {
		var min=-99999;
		var max=99999;
		var t = bV0;
		var d = bV1;
		var rotmat = obj.rotmat;
		var m=obj.matrix;
		Vec3.sub(t,p1,p0);
		d[0]=m[12]-p0[0];
		d[1]=m[13]-p0[1];
		d[2]=m[14]-p0[2];
		//Vec3.sub(d,obj.location,p0);
		for(var i=0;i<3;i++){
			var n=t[0]*m[i*4+0] 
			+t[1]*m[i*4+1] 
			+t[2]*m[i*4+2] ;
			if(n==0){
				continue;
			}

			var n2=d[0]*m[i*4+0] 
			+d[1]*m[i*4+1] 
			+d[2]*m[i*4+2] ;

			var l=m[i*4+0] *m[i*4+0]
			+ m[i*4+1] *m[i*4+1]
			+ m[i*4+2] *m[i*4+2];
			
			var n3;
			if(n>0){
				n3 = (l + n2)/n;
			}else{
				n3 = (-l + n2)/n;
			}

			if(n3 < max){
				max=n3;
			}
			if(n>0){
				n3 = (-l + n2)/n;
			}else{
				n3 = (l + n2)/n;
			}
			if(n3 > min){
				min=n3;
			}
		}
		if(min<max){
			return min;
		}
		return -1;
	}
	ret.collisionLine = function(p0,p1,collision){
		switch (collision.type){
		case OnoPhy.CUBOID:
			return OnoPhy.CUBOID_LINE(p0,p1,collision);
			break;
		case OnoPhy.SPHERE:
			return OnoPhy.SPHERE_LINE(p0,p1,collision);
			break;
		case OnoPhy.CAPSULE:
			return OnoPhy.CAPSULE_LINE(p0,p1,collision);
			break;
		}
		return -1;
	}

	ret.setPhyObjData = function(phyobj){
		var type =phyobj.type;
		var obj =phyobj.target;
		var sx = obj.bound_box[3]*obj.scale[0];
		var sy = obj.bound_box[4]*obj.scale[1];
		var sz = obj.bound_box[5]*obj.scale[2];
			
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

