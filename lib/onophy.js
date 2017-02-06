"use strict"
var OnoPhy = (function(){
	var GRAVITY = 9.8;
	var DAMPER=20;
	var PENALTY=20;
	
	var PhyObj = function(){
		this.v = new Vec3()
		this.a = new Vec3()
		this.type = 0
		this.fix=0
		this.enable=false;
		this.mass=1.0;
		this.imoment=0.2;
		this.sfriction=100;
		this.dfriction=0.1;
		this.damper=20;
		this.penalty=100;
		this.repulsion=50;
		this.matrix =new Mat43()
		this.imatrix = new Mat43()
		this.name;

		this.aa=new Vec3();
		this.av=new Vec3();
		this.rotmat=new Mat43();
		this.scale=new Vec3();
		this.location=new Vec3();
	}
	var Mesh =  function(){
		PhyObj.apply(this);
		this.type=MESH
		this.mesh=null;
		this.faceNormals=[];
		this.edge1Normals=[];
		this.edge2Normals=[];
	}

	var SpringMesh =  function(vertexsize){
		PhyObj.apply(this);
		this.type=SPRING_MESH
		var pos = new Array(vertexsize)
		var v = new Array(vertexsize)
		var a = new Array(vertexsize)
		var fixes= new Array(vertexsize)
		var truepos=new Array(vertexsize)
		for(var i=vertexsize;i--;){
			v[i] = new Vec3()
			a[i] = new Vec3()
			pos[i] = new Vec3()
			fixes[i]=0
			truepos[i]=new Vec3();
		}
		this.v = v
		this.a=a;
		this.pos = pos
		this.truepos=truepos;
		this.fixes = fixes
		this.joints = new Array();
		this.faces = new Array();
		this.friction=1000;
		this.goalDefault=0;
	}

	var Collision =  function(type){
		PhyObj.apply(this);
		this.type=type;
	}
	var ret = function(){
		this.phyObjs = new Array()
	}
	var i=1
	var SPRING_MESH= i++
	,MESH= i++
	,CUBOID = i++
	,SPHERE = i++
	,ELLIPSE = i++
	,ELLIPSOLID = i++
	,CAPSULE = i++
	,ELLIPSOLID_CAPSULE = i++
	
	ret.SPRING_MESH	= SPRING_MESH
	ret.CUBOID		= CUBOID
	ret.CAPSULE		= CAPSULE
	ret.SPHERE		= SPHERE
	ret.ELLIPSE		= ELLIPSE
	ret.ELLIPSOLID_CAPSULE = ELLIPSOLID_CAPSULE
	
	ret.SpringMesh	= SpringMesh
	ret.Collision	= Collision
	
	var bV0 = new Vec3()
	,bV1 = new Vec3()
	,bV2 = new Vec3()
	,bV3 = new Vec3()
	,bV4 = new Vec3()
	,bV5 = new Vec3()
	,bV6 = new Vec3()
	,bV7 = new Vec3()
	,bM = new Mat43()
	
	,Z_VECTOR=Geono.Z_VECTOR
	,Z_VECTOR_NEG=Geono.Z_VECTOR_NEG
	,ZERO_VECTOR = Geono.ZERO_VECTOR

	ret.prototype= {
		init:function(){
		}
		,createCollision:function(type){
			var res=new Collision(type)
			this.phyObjs.push(res)
			return res
		}		
		,createSpringMesh:function(num){
			var res=new SpringMesh(num)
			this.phyObjs.push(res)
			return res
		}
		,createMesh:function(mesh){
			var res=new Mesh();
			res.mesh = mesh;
			var faceSize = mesh.faces.length;
			for(var i=0;i<faceSize;i++){
				res.faceNormals.push(new Vec3());
				res.edge1Normals.push(new Vec3());
				res.edge2Normals.push(new Vec3());
			}
			calcMesh(res);
			this.phyObjs.push(res)
			
			return res
		}
		,deletePhyObject:function(object){
			phyObjs=this.phyObjs
			for(i=phyObjs.length;i--;){
				if(phyObjs[i]==object){
					splice(i,1)
					break
				}
			}
		}

		,calc:function(dt,step){
			for(var i=step;i--;){
				calc_t(this.phyObjs,dt/step);
			}
		}
	}
	var calcMesh = function(obj){
		var vertices = obj.mesh.vertices;
		var faces = obj.mesh.faces;
		for(var j=0;j<faces.length;j++){
			var face = faces[j];
			
			var faceNormal = obj.faceNormals[j];
			var edge1Normal = obj.edge1Normals[j];
			var edge2Normal = obj.edge2Normals[j];
			
			Vec3.sub(bV1,vertices[face.idx[1]].pos,vertices[face.idx[0]].pos);
			Vec3.sub(bV2,vertices[face.idx[2]].pos,vertices[face.idx[0]].pos);
			Vec3.cross(faceNormal,bV1,bV2);
			Vec3.norm(faceNormal);
			
			Vec3.cross(edge1Normal,faceNormal,bV1);
			//Vec3.norm(edge1Normal);
			Vec3.mul(edge1Normal,edge1Normal,1.0/Vec3.dot(bV2,edge1Normal));
			
			Vec3.cross(edge2Normal,bV2,faceNormal);
			//Vec3.norm(edge2Normal);
			Vec3.mul(edge2Normal,edge2Normal,1.0/Vec3.dot(bV1,edge2Normal));
		
		}
	}


	var springmeshMove=function(mesh){
		var vertices = mesh.truepos;
		var velocities = mesh.v
		var accs=mesh.a
		var positions=mesh.pos
		var fixes=mesh.fixes;
		var edges=mesh.joints;
		var CLOTH_DAMPER=mesh.edgeDamping;

		//頂点の加速度
		for(var j=positions.length;j--;){
			Vec3.set(accs[j],0,0,0);
			Vec3.muladd(accs[j],accs[j],velocities[j],-mesh.friction);
		}
		//頂点間のばね制御
		for(var j=edges.length;j--;){
			var edge=edges[j]
			var p0=edge.v0
			var p1=edge.v1
			if(fixes[p0] && fixes[p1])continue;

			var len2=Vec3.len(vertices[p0],vertices[p1])
			if(len2*len2<0.0001){
				continue;
			}

			Vec3.sub(bV3,positions[p1],positions[p0])

				
			var len=Vec3.scalar(bV3);
			if(!len){
				continue
			}

			len=(len-len2)*len2;
			if(len<0){
				len *= mesh.edgePush;
			}else if(len>0){
				len *= mesh.edgePull;
			}
			Vec3.norm(bV3);
			Vec3.muladd(accs[p0],accs[p0],bV3,len);
			Vec3.muladd(accs[p1],accs[p1],bV3,-len);

			Vec3.sub(bV1,velocities[p1],velocities[p0]);
			Vec3.mul(bV0,bV3,(Vec3.dot(bV1,bV3))*0.5);
			Vec3.muladd(accs[p0],accs[p0],bV0,CLOTH_DAMPER);
			Vec3.muladd(accs[p1],accs[p1],bV0,-CLOTH_DAMPER);

			
		}
	}
	var springmeshMove2=function(mesh,dt){
		var detdt=1/dt;
		var vertices = mesh.truepos;
		var velocities = mesh.v;
		var velocity;
		var accs=mesh.a
		var positions=mesh.pos
		var fixes=mesh.fixes;
		var edges=mesh.joints;
		
		//元形状補正
		var goalDefault = mesh.goalDefault*detdt;
		var wei=dt/mesh.mass;
		
		//頂点の移動
		for(var j=positions.length;j--;){
			if(fixes[j] === 0){
				Vec3.sub(bV3,vertices[j],positions[j])
				Vec3.muladd(accs[j],accs[j],bV3,goalDefault);

				velocity= velocities[j]
				accs[j][1]-=GRAVITY*mesh.mass;
				Vec3.muladd(velocity,velocity,accs[j],wei);
				Vec3.muladd(positions[j],positions[j],velocity,dt);
			}else{
				Vec3.sub(velocities[j],vertices[j],positions[j]);
				Vec3.mult(velocities[j],velocities[j],detdt);
				Vec3.copy(positions[j],vertices[j]);
			}
		}
		
		//両面オブジェクト対応
		for(var j=edges.length;j--;){
			var edge=edges[j]
			var p0=edge.v0
			var p1=edge.v1
			if(fixes[p0] && fixes[p1])continue;
				
			var len2=Vec3.len(vertices[p0],vertices[p1])
				
			if(len2*len2<0.0001){
				Vec3.copy(positions[p1],positions[p0])
				continue;
			}
		}
	}

	var SPRINGMESH_CAPSULE=function(mesh,capsule,dt){
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

		var matrix=sphere.matrix;
		var retio2 = matrix[0]*matrix[0]+matrix[1]*matrix[1]+matrix[2]*matrix[2]
		var retio=Math.sqrt(retio2)
					
		bV0[0] = sphere.matrix[12]
		bV0[1] = sphere.matrix[13]
		bV0[2] = sphere.matrix[14]
		Mat43.dotMat43Vec3(bV0,mesh.imatrix,bV0);


		for(var j = faces.length;j--;){
			var face = faces[j]

			Vec3.sub(bV1,bV0,vertices[face.idx[0]].pos);
			var l=Vec3.dot(bV1,mesh.edge1Normals[j]);
			if( l<0){
				continue;
			}
			
			var l2=Vec3.dot(bV1,mesh.edge2Normals[j]);
			if(l2<0){
				continue;
			}
			if(l2+l>=1.0){
				continue;
			}
			l=Vec3.dot(bV1,mesh.faceNormals[j]);

			Vec3.mult(bV1,mesh.faceNormals[j],l);
			Mat43.dotMat33Vec3(bV1,mesh.matrix,bV1);
			var l2 = bV1[0]*bV1[0] + bV1[1]*bV1[1] + bV1[2]*bV1[2];
			if(l2 < 1.0){
				var l = Math.sqrt(l2);
				Vec3.mul(bV1,bV1,1/l);
				Vec3.mul(bV2,bV1,1.0 - l);

				//ダンパ
				l=Vec3.dot(bV1,sphere.v);
				Vec3.muladd(sphere.a,sphere.a,bV1,-l*DAMPER);
				
				//摩擦
				var n=Vec3.scalar(bV2);
				
				Vec3.muladd(bV3,sphere.v,bV1,-l);
				if(bV3[0]*bV3[0]+bV3[1]*bV3[1]+bV3[2]*bV3[2]<0.0000001){
				}else{
					
					Vec3.norm(bV3);

					Vec3.muladd(sphere.a,sphere.a,bV3,-n*sphere.dfriction);
					
				}	

				Mat43.dotMat33Vec3(bV2,mesh.imatrix,bV2);
				Vec3.add(bV0,bV0,bV2);

			}
		}
		for(j = edges.length;j--;){
			var edge=edges[j];
			Vec3.sub(bV1,bV0,vertices[edge.v0].pos);
			Vec3.sub(bV2,vertices[edge.v1].pos,vertices[edge.v0].pos);
			var l=Vec3.dot(bV2,bV1);
			if(l<0){
				continue;
			}
			if(l/(bV2[0]*bV2[0]+bV2[1]*bV2[1]+bV2[2]*bV2[2])>=1){
				continue;
			}
			Vec3.mul(bV2,bV2,l/(bV2[0]*bV2[0]+bV2[1]*bV2[1]+bV2[2]*bV2[2]));

			Vec3.sub(bV1,bV1,bV2);
			Mat43.dotMat33Vec3(bV1,mesh.matrix,bV1);
			var l2 = bV1[0]*bV1[0] + bV1[1]*bV1[1] + bV1[2]*bV1[2];
			if(l2 < 1.0){
				l2=1/l2;
				var l = Math.sqrt(l2);
				Vec3.mul(bV2,bV1,l-1.0);

				l=Vec3.dot(bV1,sphere.v)*l2;
				Vec3.muladd(sphere.a,sphere.a,bV1,-l*20);

				Mat43.dotMat33Vec3(bV2,mesh.imatrix,bV2);
				Vec3.add(bV0,bV0,bV2);

			}
		}
		for(j = vertices.length;j--;){
			var vertex=vertices[j];
			Vec3.sub(bV1,bV0,vertex.pos);

			Mat43.dotMat33Vec3(bV1,mesh.matrix,bV1);
			var l2 = bV1[0]*bV1[0] + bV1[1]*bV1[1] + bV1[2]*bV1[2];
			if(l2 < 1.0){
				l2=1/l2;
				var l = Math.sqrt(l2);
				Vec3.mul(bV2,bV1,l-1.0);

				l=Vec3.dot(bV1,sphere.v)*l2;
				Vec3.muladd(sphere.a,sphere.a,bV1,-l*DAMPER);

				Mat43.dotMat33Vec3(bV2,mesh.imatrix,bV2);
				Vec3.add(bV0,bV0,bV2);

			}
		}
		Mat43.dotMat43Vec3(bV0,mesh.matrix,bV0);
		bV2[0] = bV0[0] - sphere.matrix[12];
		bV2[1] = bV0[1] - sphere.matrix[13];
		bV2[2] = bV0[2] - sphere.matrix[14];
		Vec3.muladd(sphere.a,sphere.a,bV2,PENALTY);

	}
	var CUBOID_SPHERE=function(cuboid,sphere){
		bV0[0] = sphere.matrix[12]
		bV0[1] = sphere.matrix[13]
		bV0[2] = sphere.matrix[14]
		Mat43.dotMat43Vec3(bV0,cuboid.imatrix,bV0);

		var flg=0;
		
		for(var i=0;i<3;i++){
			if(bV0[i]>1){
				bV1[i]=1;
			}else if(bV0[i]<-1){
				bV1[i]=-1;
			}else{
				bV1[i]=bV0[i];
			}
		}
		
		
		if(bV1[0]*bV1[0]<0
		&& bV1[1]*bV1[1]<0
		&& bV1[2]*bV1[2]<0){

			var mat = cuboid.matrix;
			for(var i=0;i<3;i++){
				bV2[i]=(mat[0+i*4]*mat[0+i*4]
				+mat[1+i*4]*mat[1+i*4]
				+mat[2+i*4]*mat[2+i*4])
				*(1-Math.abs(bV1[i]))*(1-Math.abs(bV1[i]));
			}
			var f=0;
			if(bV2[0]<bV2[1]){
				if(bV2[0]<bV2[2]){
					f=0;
				}else if(bV2[1]<bV2[2]){
					f=1;
				}else{
					f=2;
				}
			}else{
				if(bV2[1]<bV2[2]){
					f=1;
				}else if(bV2[0]<bV2[2]){
					f=0;
				}else{
					f=2;
				}
			}
			if(bV1[f]<0){
				bV1[f]=-1;
			}else{
				bV1[f]=1;
			}
			
			Vec3.sub(bV1,bV1,bV0);
			Mat43.dotMat33Vec3(bV1,mat,bV1);
			var l2=bV1[0]*bV1[0] + bV1[1]*bV1[1] + bV1[2]*bV1[2];
			Vec3.mul(bV1,bV1,1/Math.sqrt(l2) + 1);

		}else{
			Vec3.sub(bV1,bV0,bV1);
			
			Mat43.dotMat33Vec3(bV1,cuboid.matrix,bV1);
			var l2=bV1[0]*bV1[0] + bV1[1]*bV1[1] + bV1[2]*bV1[2];
			if(l2>1){
				return;
			}
			Vec3.mul(bV1,bV1,1/Math.sqrt(l2) - 1);
		}
			
			
		l2=bV1[0]*bV1[0]+bV1[1]*bV1[1]+bV1[2]*bV1[2];
		var l=Vec3.dot(bV1,sphere.v)/l2;
		Vec3.muladd(sphere.a,sphere.a,bV1,-l*DAMPER);

		Vec3.muladd(sphere.a,sphere.a,bV1,PENALTY);
		
	}
	var SPHERE_SPHERE=function(sphereA,sphereB){
		bV0[0] = sphereB.matrix[12] -sphereA.matrix[12];
		bV0[1] = sphereB.matrix[13] -sphereA.matrix[13];
		bV0[2] = sphereB.matrix[14] -sphereA.matrix[14];
		var l= bV0[0]*bV0[0] + bV0[1]*bV0[1] + bV0[2]*bV0[2];
		
		var l2 =Math.sqrt(sphereA.matrix[0]*sphereA.matrix[0]
			+sphereA.matrix[1]*sphereA.matrix[1]
			+sphereA.matrix[2]*sphereA.matrix[2])
		+Math.sqrt(sphereB.matrix[0]*sphereB.matrix[0]
			+sphereB.matrix[1]*sphereB.matrix[1]
			+sphereB.matrix[2]*sphereB.matrix[2])
		
		if(l>=l2*l2){
			return;
		}
		
		l=Math.sqrt(l);
		Vec3.mul(bV1,bV0,(l2-l)/l);
		
		l2=1/(bV1[0]*bV1[0]+bV1[1]*bV1[1]+bV1[2]*bV1[2]);
		l=Vec3.dot(bV1,sphereA.v)*l2;
		Vec3.muladd(sphereA.a,sphereA.a,bV1,-l*sphereA.damper);
		l=Vec3.dot(bV1,sphereB.v)*l2;
		Vec3.muladd(sphereB.a,sphereB.a,bV1,-l*sphereB.damper);

		Vec3.muladd(sphereA.a,sphereA.a,bV1,-PENALTY);
		Vec3.muladd(sphereB.a,sphereB.a,bV1,PENALTY);
		
	}
	
	var a_fn=new Vec3();
	var a_ma=new Vec3();
	var a_n=new Vec3();
	
	var adamper=new Vec3();
	var act = function(obj,p,f){
		Vec3.mul(a_n,f,obj.penalty);
		var l,l2;
		var len=Vec3.scalar(p);
		Vec3.nrm(a_fn,p);
		Vec3.mul(a_ma,a_fn,Vec3.dot(a_fn,a_n));
		Vec3.sub(a_ma,a_n,a_ma);
		Vec3.cross(a_fn,a_fn,a_ma);
		Vec3.norm(a_fn);
		 l=Vec3.scalar(a_ma)*len;
		Vec3.muladd(obj.aa,obj.aa,a_fn,l);

		//ダンパ
		l2 =Vec3.dot(a_fn,obj.av);
		l=Vec3.dot(a_fn,adamper);
		if(l2 * l >0){
			if(l2*l2>l*l){
				Vec3.muladd(adamper,adamper,a_fn,l2-l);
			}	
		}else{
			Vec3.muladd(adamper,adamper,a_fn,l2);
		}
		
		Vec3.nrm(a_fn,a_n);
		
		l2=Vec3.dot(a_fn,obj.v)*Vec3.scalar(a_n)*0.03;
		l = Vec3.dot(bV5,a_fn);
		if(l2*l>0){
			if(l2*l2>l*l){
				Vec3.muladd(bV5,bV5,a_fn,l2-l);
			}	
		}else{
			Vec3.muladd(bV5,bV5,a_fn,l2);
		}
			
		//摩擦
		var n=Vec3.scalar(a_n);
		
		Vec3.muladd(a_ma,obj.v,a_fn,-l2);
		if(a_ma[0]*a_ma[0]+a_ma[1]*a_ma[1]+a_ma[2]*a_ma[2]<0.0000001){
		}else{
			
			Vec3.norm(a_ma);
			Vec3.muladd(obj.a,obj.a,a_ma,-n*obj.dfriction);
		}	
		Vec3.add(obj.a,obj.a,a_n);
		//l=Vec3.dot(obj.v,f);
		//if(l<0){
		//	Vec3.nrm(a_n,f);
		//	Vec3.muladd(obj.v,obj.v,a_n,-Vec3.dot(obj.v,a_n));
		//}

		//Vec3.muladd(obj.location,obj.location,f,1);
	}
	var MESH_CUBOID=function(mesh,cuboid,dt){

		var meshdata = mesh.mesh;
		var faces=meshdata.faces;
		var edges=meshdata.edges;
		var vertices=meshdata.vertices;
		var l,l2;

		Vec3.set(bV5,0,0,0);
		Vec3.set(adamper,0,0,0);

		Mat43.dot(bM,mesh.imatrix,cuboid.matrix);
					
		for(var j = faces.length;j--;){
			var face = faces[j]
			var fn = mesh.faceNormals[j];

			//Vec3.sub(bV1,bV0,vertices[face.idx[0]].pos);
			bV1[0]= bM[12] - vertices[face.idx[0]].pos[0];
			bV1[1]= bM[13] - vertices[face.idx[0]].pos[1];
			bV1[2]= bM[14] - vertices[face.idx[0]].pos[2];

			var l=Vec3.dot(bV1,fn);
			if(l<0){
				continue;
			}
			for(i=0;i<3;i++){
				bV2[i]= bM[0+i*4]*fn[0] + bM[1+i*4]*fn[1] + bM[2+i*4]*fn[2];
				if(bV2[i]<0){
					bV0[i]=1;
				}else{
					bV0[i]=-1;
				}
			}
			
			Mat43.dotMat33Vec3(bV4,cuboid.matrix,bV0);
			var l3 = -Vec3.dot(bV2,bV0)-Math.abs(l);
			if(l3<0){
				continue;
			}
			Vec3.mul(bV2,bV0,-1);
			Mat43.dotMat43Vec3(bV0,bM,bV0);
			Mat43.dotMat33Vec3(bV2,bM,bV2);
			bV1[0]=bM[12]
			bV1[1]= bM[13]
			bV1[2]= bM[14]
			
			//Vec3.sub(bV2,bV0,bV1);
			Vec3.sub(bV3,vertices[face.idx[0]].pos,bV1);
			
			
			
			Vec3.muladd(bV0,bV1,bV2,Vec3.dot(fn,bV3)/Vec3.dot(fn,bV2));
			Vec3.sub(bV1,bV0,vertices[face.idx[0]].pos);

			l=Vec3.dot(bV1,mesh.edge1Normals[j]);
			if( l<0){
				continue;
			}
			
			l2=Vec3.dot(bV1,mesh.edge2Normals[j]);
			if(l2<0){
				continue;
			}
			if(l2+l>=1.0){
				continue;
			}

			Vec3.mul(bV2,fn,l3);
			Mat43.dotMat33Vec3(bV2,mesh.matrix,bV2);



			Vec3.mul(bV3,bV2,PENALTY);
			act(cuboid,bV4,bV2);
			Mat43.dotMat33Vec3(bV2,mesh.imatrix,bV2);
			bM[12]+=bV2[0]*1.0001
			bM[13]+=bV2[1]*1.0001
			bM[14]+=bV2[2]*1.0001

		}
		Mat43.dot(bM,mesh.matrix,bM);
		Mat43.getInv(bM,bM);
		Mat43.dot(bM,bM,mesh.matrix);
		
		var mat=cuboid.matrix;
		bV4[0]=Math.sqrt(mat[0]*mat[0] + mat[1]*mat[1] + mat[2]*mat[2]);
		bV4[1]=Math.sqrt(mat[4]*mat[4] + mat[5]*mat[5] + mat[6]*mat[6]);
		bV4[2]=Math.sqrt(mat[8]*mat[8] + mat[9]*mat[9] + mat[10]*mat[10]);

		for(var j = edges.length;j--;){
			var edge= edges[j];
			Mat43.dotMat43Vec3(bV0,bM,vertices[edge.v0].pos);
			Mat43.dotMat43Vec3(bV1,bM,vertices[edge.v1].pos);

			Vec3.sub(bV1,bV1,bV0);
			var tin=-1000000,tout=1000000;

			for(var i=0;i<3;i++){
				if(bV1[i]==0){
					if(bV0[i]<-1 || bV0[i]>1){
						tin=1;
						tout=-1;
						break;
					}
				}else{
					var min = -1,max=1;
					if(bV1[i]<0){
						min=1;
						max=-1;
					}
					var t=(min-bV0[i])/bV1[i];
					if(t>tin){
						tin=t;
					}
					t=(max-bV0[i])/bV1[i];
					if(t<tout){
						tout=t;
					}
					}
				
			}
			if(tin>tout){
				continue;
			}
			if(tout<0 || tin>1){
				continue;
			}
			

			bV0[0]*=bV4[0];
			bV0[1]*=bV4[1];
			bV0[2]*=bV4[2];
			bV1[0]*=bV4[0];
			bV1[1]*=bV4[1];
			bV1[2]*=bV4[2];
			
			min=10000000;
			var a = bV1[0]*bV1[0] + bV1[1]*bV1[1]  + bV1[2]*bV1[2];
			if(tin<0){
				l=a*tout*tout
				if(l<min){
					min=l;
				}
			}
			if(tout>1){
				l=a*(1-tin)*(1-tin)
				if(l<min){
					min=l;
				}
			}

			var flag=false;
			for(var i=0;i<3;i++){
				var x=[1,2,0][i];
				var y=[2,0,1][i];
				a = bV1[x]*bV1[x] + bV1[y]*bV1[y] ;
				if(a==0){
					continue;
				}
				Vec3.set(bV2,0,0,0);
				bV2[i]=1;
				Vec3.cross(bV2,bV1,bV2);
				if(Vec3.dot(bV2,bV0)<0){
					Vec3.mul(bV2,bV2,-1);
				}
				bV6[i] = 0;
				if(bV2[x]>0){
					bV6[x] = 1;
				}else{
					bV6[x] = -1;
				}
				if(bV2[y]>0){
					bV6[y] = 1;
				}else{
					bV6[y] = -1;
				}
				bV6[x]*=bV4[x];
				bV6[y]*=bV4[y];
				Vec3.sub(bV2,bV6,bV0);
				var l =  bV2[x]*bV1[x] + bV2[y]*bV1[y];
				Vec3.muladd(bV2,bV0,bV1,l/a);
				bV2[x]=bV6[x] - bV2[x];
				bV2[y]=bV6[y] - bV2[y];
				var b = bV2[x]*bV2[x] + bV2[y]*bV2[y] ;
				if(b<min){
					min=b;
					if(l<0-a*0.1 || l>a+a*0.1){
						flag=false;
						continue;
					}
					flag=true;
					bV3[i]= bV2[i];
					bV3[x]= bV6[x];
					bV3[y]= bV6[y];
				}
			}
			if(!flag){
				continue;
			}

			Vec3.norm(bV1);
			Vec3.sub(bV2,bV3,bV0);
			Vec3.muladd(bV2,bV0,bV1,Vec3.dot(bV1,bV2));
			Vec3.sub(bV2,bV2,bV3);
			
			bV2[0]/=bV4[0];
			bV2[1]/=bV4[1];
			bV2[2]/=bV4[2];
			bV3[0]/=bV4[0];
			bV3[1]/=bV4[1];
			bV3[2]/=bV4[2];
			
			bM[12] -= bV2[0]*1.0001;
			bM[13] -= bV2[1]*1.0001;
			bM[14] -= bV2[2]*1.0001;
			

			Mat43.dotMat33Vec3(bV2,cuboid.matrix,bV2);
			Mat43.dotMat33Vec3(bV3,cuboid.matrix,bV3);
			l = Vec3.scalar(bV3);

//			Vec3.mul(bV2,bV2,PENALTY);
			act(cuboid,bV3,bV2);
			//Mat43.dotMat33Vec3(bV2,mesh.imatrix,bV2);

		}
		for(var j = vertices.length;j--;){
			var vertex= vertices[j];
			Mat43.dotMat43Vec3(bV0,bM,vertex.pos);

			if(bV0[0]*bV0[0] >= 1
			|| bV0[1]*bV0[1] >= 1
			|| bV0[2]*bV0[2] >= 1){
				continue;
			}
			var min=1000;
			for(var i=0;i<3;i++){
				var l=(1-Math.abs(bV0[i]))*bV4[i];
				if( l < min){
					min = l;
					Vec3.set(bV1,0,0,0);
					if(bV0[i]<0){
						bV1[i] = 1 + bV0[i];
					}else{
						bV1[i] = - 1 + bV0[i];
					}
						
				}
			}

			if(min>=1000){
				continue;
			}
			bM[12] -= bV1[0];
			bM[13] -= bV1[1];
			bM[14] -= bV1[2];
			
			Vec3.sub(bV0,bV0,bV1);
			Mat43.dotMat33Vec3(bV0,cuboid.matrix,bV0);
			Mat43.dotMat33Vec3(bV1,cuboid.matrix,bV1);
			
			//Vec3.mul(bV1,bV1,PENALTY);
			act(cuboid,bV0,bV1);

		}
		var damper = cuboid.damper;// (1-Math.pow(1-cuboid.damper*(1/30),(dt)/(1/30)))/(dt)
		
		Vec3.muladd(cuboid.a,cuboid.a,bV5,-damper);
		
		Vec3.muladd(cuboid.aa,cuboid.aa,adamper,-10);

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
	setHantei(CUBOID, SPHERE, CUBOID_SPHERE);
	setHantei(SPHERE, SPHERE, SPHERE_SPHERE);


	
	var calc_t=function(phyObjs,dt){
		var i,j,k
		,AIR_DAMPER=Math.pow(0.95,dt) 
		,DAMPERD=Math.pow(0.2,dt) 
		,REFLECT_DAMPER=1-Math.pow(0.1,dt)
		
		,obj,obj2
		,x,y,z,nx,ny,nz
		,matrix

		,detdt=1/dt;
		
		
		
		for(i = phyObjs.length;i--;){
			obj = phyObjs[i];
			
			matrix=obj.matrix;
			Mat43.copy(matrix,obj.rotmat);
			matrix[0]*=obj.scale[0];
			matrix[1]*=obj.scale[0];
			matrix[2]*=obj.scale[0];
			matrix[4]*=obj.scale[1];
			matrix[5]*=obj.scale[1];
			matrix[6]*=obj.scale[1];
			matrix[8]*=obj.scale[2];
			matrix[9]*=obj.scale[2];
			matrix[10]*=obj.scale[2];
			matrix[12]=obj.location[0];
			matrix[13]=obj.location[1];
			matrix[14]=obj.location[2];
			Mat43.getInv(obj.imatrix,obj.matrix);

			if(obj.type==SPRING_MESH){
				springmeshMove(obj);
				continue;
			}
			if(obj.fix)continue
			

		}
		for(i = phyObjs.length;i--;){
			for(j = i;j--;){
				var func=hantei[phyObjs[i].type*8+phyObjs[j].type];
				if(func){
					func(phyObjs[i],phyObjs[j],dt);
				}
			}
		}
		for(i = phyObjs.length;i--;){
			obj = phyObjs[i]
						
			if(obj.type==SPRING_MESH){

				springmeshMove2(obj,dt);
				continue;
			}
			
			if(obj.fix)continue;

			obj.a[1]-=GRAVITY*obj.mass;
			Vec3.muladd(obj.v,obj.v,obj.a,dt/obj.mass);
			matrix=obj.matrix;

			Vec3.muladd(obj.av,obj.av,obj.aa,dt/obj.imoment);
			var l=Vec3.scalar(obj.av);
			if(l>0.01){
				var d=1/l;

				Mat43.getRotMat(bM,l*dt,obj.av[0]*d,obj.av[1]*d,obj.av[2]*d);
				Mat43.dot(obj.rotmat,bM,obj.rotmat);
				Vec3.mul(obj.av,obj.av,DAMPERD);
			}else{
			 	Vec3.mul(obj.av,obj.av,0);
			}
			 l=Vec3.scalar(obj.v);
			 if(l <0.01){
			 	Vec3.mul(obj.v,obj.v,0);
			 }
				obj.location[0]+=obj.v[0]*dt
				obj.location[1]+=obj.v[1]*dt
				obj.location[2]+=obj.v[2]*dt
			
			//Vec3.mul(obj.v,obj.v,AIR_DAMPER)
			Vec3.set(obj.a,0,0,0);
			Vec3.set(obj.aa,0,0,0);
			


		}
		return
	}
	return ret
})()

