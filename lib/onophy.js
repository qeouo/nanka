"use strict"
var OnoPhy = (function(){
	var GRAVITY = 9.8;
	var PENALTY=10;
	var DAMPER=20;
	var PENALTY=200;
	
	var PhyObj = function(){
		this.v = new Vec3()
		this.a = new Vec3()
		this.type = 0
		this.fix=0
		this.enable=false;
		this.mass=1;
		this.sfriction=10;
		this.dfriction=5;
		this.repulsion=50;
		this.matrix =new Mat43()
		this.imatrix = new Mat43()
		this.name;
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
				var n=-Vec3.dot(bV1,sphere.v);
				if(n>0){
					
					Vec3.muladd(bV3,sphere.v,bV1,n);
					n*=1.0/dt;
					if(bV3[0]*bV3[0]+bV3[1]*bV3[1]+bV3[2]*bV3[2]<0.0000001){
					}else{
						
						Vec3.norm(bV3);
						
						Vec3.muladd(sphere.a,sphere.a,bV3,-n*sphere.dfriction);
						
					}					
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
		
	var hantei=new Array(8*8);
	for(var i=0;i<8*8;i++){
		hantei[i]=null;
		}
	var setHantei = function(a,b,c){
		hantei[a*8+b]=c;
		hantei[b*8+a]=function(x,y,z){
			c(y,x,z);
		};
	}
	
	setHantei(SPRING_MESH, CAPSULE, SPRINGMESH_CAPSULE);
	setHantei(MESH, SPHERE, MESH_SPHERE);
	setHantei(CUBOID, SPHERE, CUBOID_SPHERE);


	
	var calc_t=function(phyObjs,dt){
		var i,j,k
		,AIR_DAMPER=Math.pow(0.95,dt) 
		,REFLECT_DAMPER=1-Math.pow(0.1,dt)
		,CLOTH_DAMPER=0.04
		,CLOTH_WEIGHT=1
		
		,obj,obj2
		,len,dlen,len2
		,x,y,z,nx,ny,nz
		,p0,p1,p2
		,matrix
		,velocity,velocities
		,acc,accs
		,position,positions
		,vertex,vertices
		,fixes
		,mesh
		,face,faces
		,edges,edge
		,vertices,vertex
		,retio,retio2,retiox,retioy,retioz
		,detdt=1/dt;
		
		
		for(i = phyObjs.length;i--;){
			obj = phyObjs[i];
			
			Mat43.getInv(obj.imatrix,obj.matrix);

			CLOTH_WEIGHT=obj.mass;
			if(obj.type==SPRING_MESH){
				springmeshMove(obj);
				continue;
			}
			if(obj.fix)continue
			Vec3.mul(obj.v,obj.v,obj.mass);
			

		}
		for(i = phyObjs.length;i--;){
			for(j = i;j--;){
				var func=hantei[phyObjs[i].type*8+phyObjs[j].type];
				if(func){
					func(phyObjs[i],phyObjs[j],dt);
				}
			}
		}
		//for(i = phyObjs.length;i--;){
		if(0){
			obj = phyObjs[i]
			CLOTH_WEIGHT=obj.mass;
			if(obj.type==MESH){
				for(j = phyObjs.length;j--;){
					obj2 = phyObjs[j];
					switch(obj2.type){
					case SPHERE:
						MESH_SPHERE(obj,obj2);
						break;
					}
				}
			}
			if(obj.type==SPRING_MESH){

				var positions=obj.pos;
				var fixes=obj.fixes;
				var edges=obj.joints;
				var faces=obj.faces;
				var velocities = obj.v
						
				//別オブジェクトとのあたり判定
				for(k = phyObjs.length;k--;){
					obj2 = phyObjs[k]
					switch(obj2.type){
					case CAPSULE:
						SPRINGMESH_CAPSULE(obj,obj2,dt);
						break;
					case SPHERE:
						matrix=obj2.matrix
						retio2 = matrix[0]*matrix[0]+matrix[1]*matrix[1]+matrix[2]*matrix[2]
						retio=Math.sqrt(retio2)
						
						for(j = faces.length;j--;){
							face = faces[j]
							p0=face[0]
							p1=face[1]
							p2=face[2]
							
							bV0[0] = obj2.matrix[12]
							bV0[1] = obj2.matrix[13]
							bV0[2] = obj2.matrix[14]
							Geono.P2T(bV0,positions[p0],positions[p1],positions[p2])
							x=Geono.sPoint2[0]-Geono.sPoint[0]
							y=Geono.sPoint2[1]-Geono.sPoint[1]
							z=Geono.sPoint2[2]-Geono.sPoint[2]
							len = x*x+y*y+z*z
							if(len>retio2)continue
							
							len = Math.sqrt(len)
							nx=x/len
							ny=y/len
							nz=z/len
							
							len= (retio - len) * PENALTY
							x=nx*len;
							y=ny*len;
							z=nz*len;
							velocity = velocities[p0]
							velocity[0]+= x
							velocity[1]+= y
							velocity[2]+= z
							
							velocity = velocities[p1]
							velocity[0]+= x
							velocity[1]+= y
							velocity[2]+= z
							
							velocity = velocities[p2]
							velocity[0]+= x
							velocity[1]+= y
							velocity[2]+= z

						}
						break
					case ELLIPSOLID:
						matrix=obj2.matrix
						retiox = Math.sqrt(matrix[0]*matrix[0]+matrix[1]*matrix[1]+matrix[2]*matrix[2])
						retioy = Math.sqrt(matrix[4]*matrix[4]+matrix[5]*matrix[5]+matrix[6]*matrix[6])
						retioz = Math.sqrt(matrix[8]*matrix[8]+matrix[9]*matrix[9]+matrix[10]*matrix[10])
						
						for(j = faces.length;j--;){
							face = faces[j]
							p0=face.idx[0]
							p1=face.idx[1]
							p2=face.idx[2]
							matrix=obj2.imatrix
							Mat43.dotMat43Vec3(bV0,matrix,positions[p0])
							Mat43.dotMat43Vec3(bV1,matrix,positions[p1])
							Mat43.dotMat43Vec3(bV2,matrix,positions[p2])
						
							Geono.P2T(ZERO_VECTOR,bV0,bV1,bV2)
							x=Geono.sPoint2[0]
							y=Geono.sPoint2[1]
							z=Geono.sPoint2[2]
							len = x*x+y*y+z*z
							if(len>1)continue
							x*=retiox
							y*=retioy
							z*=retioz
							
							Geono.PointEllipsolid(x,y,z,retiox,retioy,retioz)
							nx=Geono.sPoint2[0]
							ny=Geono.sPoint2[1]
							nz=Geono.sPoint2[2]
							
							bV0[0]=(nx- x) /retiox
							bV0[1]=(ny- y) /retioy
							bV0[2]=(nz -z) /retioz
						
							Mat43.dotMat33Vec3(bV0,obj2.matrix,bV0)
							
							x=bV0[0]
							y=bV0[1]
							z=bV0[2]
							
							len = Math.sqrt(x*x+y*y+z*z)
							nx=x/len
							ny=y/len
							nz=z/len
							
							x*=PENALTY
							y*=PENALTY
							z*=PENALTY
							
							velocity = velocities[p0]
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
						break

					case ELLIPSOLID_CAPSULE:

						matrix=obj2.matrix
						retiox=Math.sqrt(matrix[0]*matrix[0]+matrix[1]*matrix[1]+matrix[2]*matrix[2])
						retioy=Math.sqrt(matrix[4]*matrix[4]+matrix[5]*matrix[5]+matrix[6]*matrix[6])
						retioz=Math.sqrt(matrix[8]*matrix[8]+matrix[9]*matrix[9]+matrix[10]*matrix[10])
						bM[0]=matrix[0]/retiox
						bM[1]=matrix[1]/retiox
						bM[2]=matrix[2]/retiox
						bM[4]=matrix[4]/retioy
						bM[5]=matrix[5]/retioy
						bM[6]=matrix[6]/retioy
						bM[8]=matrix[8]/retioz
						bM[9]=matrix[9]/retioz
						bM[10]=matrix[10]/retioz
						
						for(j = faces.length;j--;){
							face = faces[j]
							p0=face.idx[0]
							p1=face.idx[1]
							p2=face.idx[2]
							
							matrix=obj2.imatrix
							Mat43.dotMat43Vec3(bV0,matrix,positions[p0])
							Mat43.dotMat43Vec3(bV1,matrix,positions[p1])
							Mat43.dotMat43Vec3(bV2,matrix,positions[p2])
							
							if(Geono.L2T(Z_VECTOR,Z_VECTOR_NEG,bV0,bV1,bV2)){
								Vec3.sub(bV0,Geono.sPoint,Geono.sPoint2)
								bV0[0]*=retiox
								bV0[1]*=retioy
								bV0[2]*=retioz
							}else{
								z=Geono.sPoint2[2]
							
								if(z>1){
									x=Geono.sPoint2[0]
									y=Geono.sPoint2[1]
									z=(z-1)*retioz/retiox
									
									len = x*x+y*y+z*z
									if(len>1)continue
									x*=retiox
									y*=retioy
									z*=retiox
									Geono.PointEllipsolid(x,y,z,retiox,retioy,retiox)
									Vec3.sub(bV0,Geono.sPoint2,Geono.sPoint)
									
								}else if(z<-1){
									x=Geono.sPoint2[0]
									y=Geono.sPoint2[1]
									z=(z+1)*retioz/retiox
									
									len = x*x+y*y+z*z
									if(len>1)continue
									x*=retiox
									y*=retioy
									z*=retiox
									Geono.PointEllipsolid(x,y,z,retiox,retioy,retiox)
									Vec3.sub(bV0,Geono.sPoint2,Geono.sPoint)

								}else{
									x=Geono.sPoint2[0]
									y=Geono.sPoint2[1]
									len = x*x+y*y
									if(len>1)continue
									x*=retiox
									y*=retioy
									Geono.PointEllipse(x,y,retiox,retioy)
									Vec2.sub(bV0,Geono.sPoint2,Geono.sPoint)
									
									bV0[0]=Geono.sPoint2[0]-x
									bV0[1]=Geono.sPoint2[1]-y
									bV0[2]=0
								}
								
							}
							Mat43.dotMat33Vec3(bV0,bM,bV0)
							
							x=bV0[0]
							y=bV0[1]
							z=bV0[2]
							
							len=1/Math.sqrt(x*x+y*y+z*z)
							nx=x*len
							ny=y*len
							nz=z*len
							len = PENALTY*0.1
							x*=len
							y*=len
							z*=len
							
							velocity = velocities[p0]
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
						break
					case CUBOID:
						matrix=obj2.matrix
						imatrix=obj2.imatrix
						retio2 = matrix[0]*matrix[0]+matrix[1]*matrix[1]+matrix[2]*matrix[2]
						retio=Math.sqrt(retio2)
						
						for(j = faces.length;j--;){
							var flg0,flg1,flg2,flg3

							face = faces[j]
							p0=positions[face.idx[0]]
							p1=positions[face.idx[1]]
							p2=positions[face.idx[2]]
							
							Mat43.dotMat43Vec3(bV0,imatrix,p0)
							if(Math.abs(bV0[0])>1)flg0=1
							if(Math.abs(bV0[1])>1)flg0|=2
							if(Math.abs(bV0[2])>1)flg0|=4
							Mat43.dotMat43Vec3(bV0,imatrix,p1)
							if(Math.abs(bV1[0])>1)flg1|=1
							if(Math.abs(bV1[1])>1)flg1|=2
							if(Math.abs(bV1[2])>1)flg1|=4
							Mat43.dotMat43Vec3(bV0,imatrix,p2)
							if(Math.abs(bV2[0])>1)flg2|=1
							if(Math.abs(bV2[1])>1)flg2|=2
							if(Math.abs(bV2[2])>1)flg2|=4


							//flg=flg2
							//flg2=flg2^flg1
							//flg1=flg^flg0
							//flg0=flg1^flg0


							bV1[0]=0
							bV1[1]=0
							bV1[2]=0

							if(flg0^flg1&1){
								if(flg1&1){
									if(p1[0]>0)x=1
									else x=-1
									Vec3.sub(bV0,p1,p0)
									x=x-p0[0]
									Vec3.mul(bV0,bV0,x)
									Vec3.add(bV0,p0,bV0)
									if(Math.abs(bV0[1])<1 && Math.abs(bV0[2])<1){
										bV1[0]=x
									}
								}
							}


								

							Geono.P2T(bV0,positions[p0],positions[p1],positions[p2])
							bV0[0] = obj2.matrix[12]
							bV0[1] = obj2.matrix[13]
							bV0[2] = obj2.matrix[14]
							Geono.P2T(bV0,positions[p0],positions[p1],positions[p2])
							x=Geono.sPoint2[0]-Geono.sPoint[0]
							y=Geono.sPoint2[1]-Geono.sPoint[1]
							z=Geono.sPoint2[2]-Geono.sPoint[2]
							len = x*x+y*y+z*z
							if(len>retio2)continue
							
							len = Math.sqrt(len)
							nx=x/len
							ny=y/len
							nz=z/len
							
							len= (retio - len) * PENALTY
							x=nx*len
							y=ny*len
							z=nz*len
							
							velocity = velocities[p0]
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
						break
						for(j = positions.length;j--;){
							Mat43.dotMat43Vec3(bV3,obj2.imatrix,positions[j])
							velocity=velocities[j]
							x = Math.abs(bV3[0])
							y = Math.abs(bV3[1])
							z = Math.abs(bV3[2])
							if(x>=1
								|| y>=1
								|| z>=1
							)continue

							if(x>y && x>z){
								len = (1-x)*PENALTY
								if(bV3[0]<0)len*=-1
								bV3[0]=len
								bV3[1]=0
								bV3[2]=0
							}else if(y>z){
								len = (1-y)*PENALTY
								if(bV3[1]<0)len*=-1
								bV3[1]=len
								bV3[0]=0
								bV3[2]=0
							}else{
								len = (1-z)*PENALTY
								if(bV3[2]<0)len*=-1
								bV3[2]=len
								bV3[0]=0
								bV3[1]=0
							}
							Mat43.dotMat33Vec3(bV3,obj2.matrix,bV3)
							Vec3.add(velocity,velocity,bV3)
						}
						break
					}
				}
				
			}
			matrix=obj.matrix

		}
		for(i = phyObjs.length;i--;){
			obj = phyObjs[i]
						
			if(obj.type==SPRING_MESH){

				springmeshMove2(obj,dt);
				continue;
			}
			
			if(obj.fix)continue;

			obj.a[1]-=GRAVITY*obj.mass;
			Vec3.muladd(obj.v,obj.v,obj.a,dt);
			matrix=obj.matrix;

			Vec3.mul(obj.v,obj.v,1.0/obj.mass);
			matrix[12]+=obj.v[0]*dt
			matrix[13]+=obj.v[1]*dt
			matrix[14]+=obj.v[2]*dt
			Vec3.mul(obj.v,obj.v,AIR_DAMPER)
			Vec3.set(obj.a,0,0,0);

		}
		return
	}
	return ret
})()

