"use strict"
var Collider = (function(){

	var DIMENSION = 3; //次元数
	var MIN=Math.min
	,MAX=Math.max
	,Z_VECTOR=Geono.Z_VECTOR
	,Z_VECTOR_NEG=Geono.Z_VECTOR_NEG
	,ZERO_VECTOR = Geono.ZERO_VECTOR;

	var bM = new Mat44();
	var bV0 = new Vec3();
	var bV1 = new Vec3();
	var bV2 = new Vec3();
	var bV3 = new Vec3();
	var bV4 = new Vec3();

	var HitListElem=function(){
		this.pairId=-1;
		this.col1=null;
		this.col2=null;
	}
	var HitListElemEx=(function(){
		var HitListElemEx = function(){
			HitListElem.call(this);
			this.pos1=new Vec3();
			this.pos2=new Vec3();
		}
		inherits(HitListElemEx,HitListElem);
		return HitListElemEx;
	})();

	var Collider = function(){
		this.collisions = [];
		this.collisionIndexList=[];
		for(var i=1023;i--;){
			this.collisionIndexList.push(i);
		}
		this.AABBSorts=[];
		this.AABBHitListAll=[];
		this.hitList=[];
		this.hitListIndex=0;
		for(var i=0;i<1024;i++){
			this.AABBHitListAll.push(new HitListElem);
			this.hitList.push(new HitListElemEx);
		}

		for(var i=0;i<3;i++){
			this.AABBSorts.push([]);
		}
	}
	var ret=Collider;
	
	var i=0;
	var MESH = ret.MESH = i++
		,CUBOID = ret.CUBOID = i++
		,SPHERE = ret.SPHERE = i++
		,ELLIPSE = ret.ELLIPSE = i++
		,CAPSULE = ret.CAPSULE = i++
		,TRIANGLE = ret.TRIANGLE= i++
	;

	var collisionIndexList;

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
		res.id=this.collisionIndexList.pop();
		this.collisions.push(res)
		for(var i=0;i<3;i++){
			this.AABBSorts[i].push(res)
		}
		return res;
	}
	ret.prototype.createMesh = function(mesh){
			//メッシュオブジェクト作成
			var res=new Collider.Mesh();
			res.mesh = mesh;
			var faceSize = mesh.faces.length;
			var vertexSize = mesh.vertices.length;
			for(var i=0;i<vertexSize;i++){
				res.poses.push(new Vec3());
			}
			for(var i=0;i<faceSize;i++){
				res.faceAABBs.push(new AABB());
			}
			res.id=this.collisionIndexList.pop();
			this.collisions.push(res)
			for(var i=0;i<3;i++){
				this.AABBSorts[i].push(res)
			}
			return res;
		}

	ret.prototype.deleteCollision = function(obj){
		var collisions=this.collisions;
		for(var i=0;i<collisions.length;i++){
			if(collisions[i] == obj){
				collisions.splice(i,1);
				this.collisionIndexList.push(collisions[i].id);
				break;
			}
		}
		for(var j=0;j<3;j++){
			var aabbSort = this.AABBSorts[j];
			for(var i=0;i<aabbSort.length;i++){
				if(aabbSort[i] == obj){
					aabbSort.splice(i,1);
					break;
				}
			}
		}
	}
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
	ret = Collider;

	var calcAABB_POLYGON = ret.calcAABB_POLYGON = function(aabb,v1,v2,v3){
		for(var i=0;i<DIMENSION;i++){
			aabb.min[i]=(MIN(MIN(v1[i],v2[i]),v3[i]));
			aabb.max[i]=(MAX(MAX(v1[i],v2[i]),v3[i]));
		}
	}
	ret.Mesh = (function(){
		var Mesh= function(){
			//メッシュ
			Collision.apply(this);
			this.type=MESH;
			this.mesh=null; //メッシュ情報
			this.faceAABBs=[];//フェイスAABB
			this.poses=[]; //頂点座標
		};
		var ret = Mesh;
		ret.prototype.calcPre=function(){
			Collision.prototype.calcPre.call(this);

			var m=this.matrix;
			//var r=this.rotation;
			//Mat43.getRotMat(m,r[0],1,0,0)
			//Mat43.getRotMat(bM,r[1],0,1,0)
			//Mat43.dot(m,bM,m);
			//Mat43.getRotMat(bM,r[2],0,0,1)
			//Mat43.dot(m,bM,m);
			//m[12]=this.location[0];
			//m[13]=this.location[1];
			//m[14]=this.location[2];

			//Mat44.dot(m,this.parent.matrix,m);
			Mat44.copy(m,this.parent.matrix);

			var vertices = this.mesh.vertices;
			var poses= this.poses;
			for(var j=0;j<poses.length;j++){
				Mat43.dotMat43Vec3(poses[j],m,vertices[j].pos);
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


	var Sphere = ret.Sphere = (function(){
		var Sphere = function(){
			Collision.apply(this);
			this.type=SPHERE;
		};
		var ret = Sphere;
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
		var Capsule = function(){
			Collision.apply(this);
			this.type=CAPSULE;
		};
		var ret = Capsule;
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
		var Cuboid = function(){
			Collision.apply(this);
			this.type=CUBOID;
		}
		var ret = Cuboid;
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

	ret.prototype.calcAABBHitList=(function(){
		var aabbHitList=new Array(DIMENSION);
		var aabbHitListIdx=new Array(DIMENSION);
		for(var i=0;i<aabbHitList.length;i++){
			aabbHitList[i]=new Array(1024);
		}


		return function(){
			var aabbHitListAll=this.AABBHitListAll;
			for(var i=0;i<DIMENSION;i++){
				//ソート
				var AABBSort = this.AABBSorts[i];
				AABBSort.sort(function(a,b){return a.AABB.min[i] - b.AABB.min[i]});
			}

			//AABBの重なりチェックx軸
			var aabbHitListAllIdx=0;
			var AABBSort = this.AABBSorts[0];
			for(var j=0;j<AABBSort.length;j++){
				var end=AABBSort[j].AABB.max[0];
				for(var k=j+1;k<AABBSort.length;k++){
					if(end<=AABBSort[k].AABB.min[0]){
						//AABBの先頭が判定元AABBの終端を超えていたら終了
						break;
					}
					//重なっているAABBを追加
					var pairId = 0;
					if(AABBSort[j].id<AABBSort[k].id){
						pairId = (AABBSort[j].id<<16) | AABBSort[k].id;
						aabbHitListAll[aabbHitListAllIdx].col1=AABBSort[j];
						aabbHitListAll[aabbHitListAllIdx].col2=AABBSort[k];
					}else{
						pairId = (AABBSort[k].id<<16) | AABBSort[j].id;
						aabbHitListAll[aabbHitListAllIdx].col1=AABBSort[k];
						aabbHitListAll[aabbHitListAllIdx].col2=AABBSort[j];
					}
					aabbHitListAll[aabbHitListAllIdx].pairId=pairId;
					aabbHitListAllIdx++;
				}
			}
			aabbHitListAll[aabbHitListAllIdx].pairId=-1;
			Sort.kisu(aabbHitListAll,function(a){return a.pairId});

			for(var i=1;i<DIMENSION;i++){
				//y,z軸それぞれで計算
				aabbHitListIdx[i]=0;
				var AABBSort = this.AABBSorts[i];

				//AABBの重なりチェック
				for(var j=0;j<AABBSort.length;j++){
					var end=AABBSort[j].AABB.max[i];
					for(var k=j+1;k<AABBSort.length;k++){
						if(end<=AABBSort[k].AABB.min[i]){
							//AABBの先頭が判定元AABBの終端を超えていたら終了
							break;
						}
						//重なっているAABBを追加
						var pairId = 0;
						if(AABBSort[j].id<AABBSort[k].id){
							pairId = (AABBSort[j].id<<16) | AABBSort[k].id;
						}else{
							pairId = (AABBSort[k].id<<16) | AABBSort[j].id;
						}
						aabbHitList[i][aabbHitListIdx[i]]=pairId;
						aabbHitListIdx[i]++;
					}
				}

				aabbHitList[i][aabbHitListIdx[i]]=-1;
				Sort.kisu(aabbHitList[i]);
			}


			//3つの軸すべて重なっているものを抽出
			var idx=0;
			aabbHitListIdx[1]=0;
			aabbHitListIdx[2]=0;
			for(var i=0;aabbHitListAll[i].pairId>=0;i++){
				var pairId = aabbHitListAll[i].pairId;
				var flg=1;
				
				//x軸と同じペアIDがy,zにあるか
				for(var j=1;j<3;j++){
					var aabbHitF=aabbHitList[j];
					var k=aabbHitListIdx[j];
					if(!flg){
						break;
					}
					for(;aabbHitF[k]>=0;k++){
						if(aabbHitF[k]>=pairId){
							break;
						}
					}
					if(aabbHitF[k]!=pairId){
						flg=0;
					}

					if(k>0 && aabbHitF[k]<0){
						aabbHitListIdx[j]=k-1;
					}else{
						aabbHitListIdx[j]=k;
					}
						

				}

				if(flg){
					//あった場合追加
					aabbHitListAll[idx].pairId=aabbHitListAll[i].pairId;
					aabbHitListAll[idx].col1=aabbHitListAll[i].col1;
					aabbHitListAll[idx].col2=aabbHitListAll[i].col2;
					idx++;
				}
			}
			aabbHitListAll[idx].pairId=-1;

			return aabbHitListAll;
		};
	})();

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
						Vec3.sub(addFaceBuf,vs[i],vs[v1]);

						var a=Vec3.dot(face.cross,addFaceBuf);
						var b=Vec3.dot(face.cross,vs[i])-face.len;
						if((a>0.0000001) != (b>0.0000001)){
							console.log(a,b);
							}
						if(b>0.0000000001){
							Vec3.mul(face.cross,face.cross,-1);
							break;
						}
					}
					
				}

				Geono.TRIANGLE_POINT(addFaceBuf,vs[v1],vs[v2],vs[v3],ZERO_VECTOR);
				face.len = Vec3.scalar2(addFaceBuf);
				return face;
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
			var buf2=new Vec3();
			var buf3=new Vec3();
			var buf4=new Vec3();
			var buf5=new Vec3();
			var buf7=new Vec3();
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

			//終了チェック
			if((Vec3.dot(s,axis) - Vec3.dot(v[face.v[0]],axis)<0.0000001)
			|| faceIndex>=200){
				TRIANGLE_TRIANGLE(ans1,ans2
						,v1[face.v[0]],v1[face.v[1]],v1[face.v[2]]
						,v2[face.v[0]],v2[face.v[1]],v2[face.v[2]]);
				//console.log(v1[face.v[0]],v1[face.v[1]],v1[face.v[2]]
				//		,v2[face.v[0]],v2[face.v[1]],v2[face.v[2]]);
				//console.log(v[face.v[0]],v[face.v[1]],v[face.v[2]]);
				//console.log(face.len);

				return -Vec3.len(ans1,ans2);
			}

			//終了しなかった場合はその点を追加
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

	ret.prototype.MESH_ANY=function(col1,col2){
		var faces =col1.mesh.faces;
		var poses = col1.poses;
		var faceAABBs = col1.faceAABBs;//フェイスAABB
		var ans1=new Vec3();
		var ans2=new Vec3();
		var ans3=new Vec3();
		var ans4=new Vec3();
		var n=new Vec3();
		var triangle = new Triangle();
		var min=999999;

		for(var i=0;i<faces.length;i++){
			var face = faces[i];

			if(!Geono.AABB_AABBhit(faceAABBs[i],col2.AABB)){
				continue;
			}
			triangle.v[0]=poses[face.idx[0]];
			triangle.v[1]=poses[face.idx[1]];
			triangle.v[2]=poses[face.idx[2]];
			triangle.AABB = faceAABBs[i];

			var l = calcCLOSEST(ans3,ans4,triangle,col2);
			if(l<min){
				min=l;
				Vec3.copy(ans1,ans3);
				Vec3.copy(ans2,ans4);
			}
		}
		var l = min - (col1.bold + col2.bold);
		if(l<0){
			var elem = this.hitList[this.hitListIndex];
			Vec3.sub(n,ans2,ans1);
			Vec3.norm(n);
			Vec3.muladd(elem.pos1,ans1,n,col1.bold);
			Vec3.muladd(elem.pos2,ans2,n,-col2.bold);
			elem.col1=col1;
			elem.col2=col2;
			elem.pairId = 1;
			this.hitListIndex++;
		}
	}
	var hantei=new Array(8*8);
	for(var i=0;i<8*8;i++){
		hantei[i]=null;
	}
	var setHantei = function(a,b,c){
		hantei[a*8+b]=c;
		if(a!=b){
			hantei[b*8+a]=function(ans1,ans2,col1,col2){
				return c(ans2,ans1,col2,col1);
			};
		}
	}
	
	setHantei(SPHERE, SPHERE, function(ans1,ans2,col1,col2){
		Vec3.set(ans1,col1.matrix[12],col1.matrix[13],col1.matrix[14]);
		Vec3.set(ans2,col2.matrix[12],col2.matrix[13],col2.matrix[14]);
		return Vec3.len(ans1,ans2);
	});

	var CUBOID_SPHERE=function(ans1,ans2,cuboid,sphere){
		var axis= bV0;
		var dVec = bV1;
		var len = bV2;

		//中心差分
		dVec[0]=sphere.matrix[12] - cuboid.matrix[12];
		dVec[1]=sphere.matrix[13] - cuboid.matrix[13];
		dVec[2]=sphere.matrix[14] - cuboid.matrix[14];

		var insideFlg=1; //内包フラグ

		Vec3.set(ans1,sphere.matrix[12],sphere.matrix[13],sphere.matrix[14]); 
		Vec3.set(ans2,sphere.matrix[12],sphere.matrix[13],sphere.matrix[14]); //球は中心固定
		
		for(var i=0;i<DIMENSION;i++){
			Vec3.set(axis,cuboid.matrix[i*4+0],cuboid.matrix[i*4+1],cuboid.matrix[i*4+2]); //軸
			var d = Vec3.dot(axis,dVec); //軸に対する差分
			var size = Vec3.scalar2(axis); //軸の長さ^2
			if(d >  size){ //軸より外の場合(正)
				Vec3.muladd(ans1,ans1,axis,1-d/size);
				insideFlg = 0;
			}else if( d< -size){//軸より外の場合(負)
				Vec3.muladd(ans1,ans1,axis,-(1+d/size));
				insideFlg = 0;
			}else{ //内側の場合
				if(d>0){
					len[i] = (size - d)/Vec3.scalar(axis);
				}else{
					len[i] = (-size - d)/Vec3.scalar(axis);
				}
			}
		}
		if(insideFlg){ //内側の場合
			var min=0;
			for(var i=1;i<DIMENSION;i++){
				if(len[min]*len[min]>len[i]*len[i]){
					min=i;
				}
			}
			Vec3.set(axis,cuboid.matrix[min*4+0],cuboid.matrix[min*4+1],cuboid.matrix[min*4+2]); //軸
			Vec3.muladd(ans1,ans2,axis,len[min]/Vec3.scalar(axis));

			return -Vec3.len(ans1,ans2);
		}else{ //外側の場合
			return Vec3.len(ans1,ans2);
		}
	}
	setHantei(CUBOID, SPHERE, CUBOID_SPHERE);

	ret.prototype.All = function(){
		var ans1 = new Vec3();
		var ans2 = new Vec3();
		var n = new Vec3();

		var start=Date.now();
		//AABBで重なっているペアを抽出
		var aabbHitList = this.calcAABBHitList();
		this.AABBTime=Date.now()-start;


		start=Date.now();
		this.hitListIndex=0;
		for(var i=0;aabbHitList[i].pairId>0;i++){
			var col1=aabbHitList[i].col1;
			var col2=aabbHitList[i].col2;

			if(!col1.parent.moveflg && !col2.parent.moveflg){
				continue;
			}

			if(col1.type==MESH){
				this.MESH_ANY(col1,col2);
				continue;
			}
			if(col2.type==MESH){
				this.MESH_ANY(col2,col1);
				continue;
			}
			var func=hantei[col1.type*8+col2.type];
			var l = 9999;
			if(func){
				l=func(ans1,ans2,col1,col2);
			}else{
				l=calcCLOSEST(ans1,ans2,col1,col2);
			}
			l -= (col1.bold + col2.bold);
			if(l<0){
				var elem = this.hitList[this.hitListIndex];
				Vec3.sub(n,ans2,ans1);
				Vec3.norm(n);
				Vec3.muladd(elem.pos1,ans1,n,col1.bold);
				Vec3.muladd(elem.pos2,ans2,n,-col2.bold);
				elem.col1=col1;
				elem.col2=col2;
				elem.pairId = aabbHitList[i].pairId;
				this.hitListIndex++;
			}
		}
		this.hitList[this.hitListIndex].col1=null;

		this.collisionCount=i;
		this.collisionTime=Date.now()-start;
	}

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
		case CUBOID:
			return Collider.CUBOID_LINE(p0,p1,collision);
			break;
		case SPHERE:
			return Collider.SPHERE_LINE(p0,p1,collision);
			break;
		case CAPSULE:
			return Collider.CAPSULE_LINE(p0,p1,collision);
			break;
		}
		return -1;
	}
	return ret;
})();
