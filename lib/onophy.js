"use strict"
var OnoPhy = (function(){
	var GRAVITY = 9.8;
	var PENALTY=20;
	var DELTA=0.00000001;
	var _dt;
	var testflg;
	
	var PhyObj = function(){
		this.v = new Vec3()
		this.a = new Vec3()
		this.type = 0
		this.fix=1
		this.enable=false;
		this.mass=1.0;
		this.imoment=0.2;
		this.sfriction=1;
		this.dfriction=1;
		this.damper=1;
		this.adamper=1;
		this.penalty=2000;
		this.repulsion=50;
		this.matrix =new Mat43()
		this.imatrix = new Mat43()
		this.name;

		this.aa=new Vec3();
		this.av=new Vec3();
		this.rotmat=new Mat43();
		this.scale=new Vec3();
		this.location=new Vec3();
		this.size=new Vec3();
		this.r=1.0;
	}
	var Mesh =  function(){
		PhyObj.apply(this);
		this.type=MESH
		this.mesh=null;
		this.poses=[];
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
	ret.MESH	= MESH
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
	,bM2 = new Mat43()
	
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
			var vertexSize = mesh.vertices.length;
			for(var i=0;i<vertexSize;i++){
				res.poses.push(new Vec3());
			}
			for(var i=0;i<faceSize;i++){
				res.faceNormals.push(new Vec3());
				res.edge1Normals.push(new Vec3());
				res.edge2Normals.push(new Vec3());
			}
			calcObj(res);
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
	var calcObj= ret.calcObj= function(obj){
		var matrix=obj.matrix;
		Mat43.copy(matrix,obj.rotmat);
		var sx=obj.scale[0];
		var sy=obj.scale[1];
		var sz=obj.scale[2];
		matrix[0]*=sx;
		matrix[1]*=sx;
		matrix[2]*=sx;
		matrix[4]*=sy;
		matrix[5]*=sy;
		matrix[6]*=sy;
		matrix[8]*=sz;
		matrix[9]*=sz;
		matrix[10]*=sz;
		matrix[12]=obj.location[0];
		matrix[13]=obj.location[1];
		matrix[14]=obj.location[2];
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
	var act = function(obj,p,force,obj2){
		var l,l2;
		var penalty = 2*obj.penalty*obj2.penalty/(obj.penalty+obj2.penalty)
		Vec3.mul(a_n,force,penalty);//力
		Vec3.sub(a_l,p,obj.location); //重心からの距離
		
		//加速
		Vec3.add(obj.a,obj.a,a_n);
		//角加速
		Vec3.cross(a_a,a_l,a_n);
		Vec3.add(obj.aa,obj.aa,a_a);

		Vec3.nrm(a_n,force);

		//ダンパ
		Vec3.muladd(mem,obj.v,obj.a,1/obj.mass*_dt);
		Vec3.muladd(mem2,obj.av,obj.aa,1/obj.imoment*_dt);
		Vec3.mul(a_fric,a_n,Vec3.dot(a_n,mem)*-obj.damper);
		Vec3.add(obj.a,obj.a,a_fric);

		Vec3.cross(a_a,a_l,a_fric);
		//Vec3.muladd(a_a,a_a,a_n,-Vec3.dot(a_n,a_a));
		//Vec3.add(obj.aa,obj.aa,a_a);
		
		//Vec3.muladd(mem,obj.v,obj.a,1/obj.mass*_dt);
		////Vec3.muladd(mem2,obj.av,obj.aa,1/obj.imoment*_dt);
		//Vec3.muladd(a_fric,mem,a_n,-Vec3.dot(a_n,mem));
		//if(Vec3.scalar(a_fric)<1){
		//	Vec3.muladd(obj.a,obj.a,a_fric,-1.0/_dt*obj.mass);
		//}
		Vec3.mul(a_n,force,penalty);//力
		var n=Vec3.scalar(a_n);
		Vec3.nrm(a_n,a_n);

		//摩擦
		var friction;

		Vec3.cross(a_a,obj.av,a_l);
		Vec3.add(a_a,a_a,obj.v);
		Vec3.muladd(a_a,a_a,a_n,-Vec3.dot(a_n,a_a));
		if(Vec3.scalar(a_a)<0.1 ){
			friction = 2*obj.sfriction*obj2.sfriction/(obj.sfriction+obj2.sfriction);
		}else{
			friction = 2*obj.dfriction*obj2.dfriction/(obj.dfriction+obj2.dfriction);
		}
		friction = friction * n;
	

		Vec3.muladd(mem,obj.v,obj.a,_dt/obj.mass);
		Vec3.muladd(mem2,obj.av,obj.aa,_dt/obj.imoment);
		Vec3.cross(mem2,mem2,a_l);
		Vec3.add(a_a,mem,mem2);
		Vec3.muladd(a_a,a_a,a_n,-Vec3.dot(a_n,a_a));


		Vec3.muladd(mem,a_l,a_n,-Vec3.dot(a_l,a_n));
		//Vec3.mul(mem,mem,-1);
		var a = obj.imoment/obj.mass + Vec3.dot(a_l,a_l);

		Vec3.cross(a_fric,a_a,mem);
		Vec3.cross(a_fric,a_l,a_fric);
		Vec3.mul(a_fric,a_fric,-1/a);
		Vec3.add(a_fric,a_a,a_fric);
		Vec3.mul(a_fric,a_fric,obj.imoment
			/(obj.imoment/obj.mass + Vec3.dot(a_l,a_n)*Vec3.dot(a_l,a_n)));

//		var ff = obj.mass/(1+obj.mass*a/obj.imoment)
		Vec3.mul(a_fric,a_fric,-1/_dt);
		var f =  Vec3.scalar(a_fric);
		//if(f>friction){
		//	Vec3.mul(a_fric,a_fric,friction/f);//摩擦力
		//	f=friction;
		//}
		friction-=f;

		//加速
		Vec3.add(obj.a,obj.a,a_fric);
		//角加速
		Vec3.cross(a_a,a_l,a_fric);
		//Vec3.muladd(a_a,a_a,a_n,-Vec3.dot(a_n,a_a));
		Vec3.add(obj.aa,obj.aa,a_a);

		if(obj.name=="tes"){
			Vec3.muladd(mem,obj.v,obj.a,_dt/obj.mass);
			Vec3.muladd(mem2,obj.av,obj.aa,_dt/obj.imoment);
			Vec3.cross(mem2,mem2,a_l);
			Vec3.add(a_a,mem,mem2);
			Vec3.muladd(a_a,a_a,a_n,-Vec3.dot(a_n,a_a));
			console.log(obj.v,obj.av);
		}

	}
	var act2p= new Vec3();
	var act2f= new Vec3();
	var act2 = function(obj,p,f,obj2){
		act(obj,p,f,obj2);
		Vec3.add(act2p,p,f);
		Vec3.mul(act2f,f,-1);
		act(obj2,act2p,act2f,obj);
		
	}
	
	var calc_t=function(phyObjs,dt){
		_dt=dt;
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
			var sx=obj.scale[0];
			var sy=obj.scale[1];
			var sz=obj.scale[2];
			if(obj.type >=  CUBOID){
				sx*=obj.size[0];
				sy*=obj.size[1];
				sz*=obj.size[2];
			}
			matrix[0]*=sx;
			matrix[1]*=sx;
			matrix[2]*=sx;
			matrix[4]*=sy;
			matrix[5]*=sy;
			matrix[6]*=sy;
			matrix[8]*=sz;
			matrix[9]*=sz;
			matrix[10]*=sz;
			matrix[12]=obj.location[0];
			matrix[13]=obj.location[1];
			matrix[14]=obj.location[2];
			Mat43.getInv(obj.imatrix,obj.matrix);

			if(obj.type==SPRING_MESH){
				springmeshMove(obj);
				continue;
			}
			if(obj.fix)continue
			
			obj.a[1]-=GRAVITY*obj.mass;

		}
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
		for(i = phyObjs.length;i--;){
			obj = phyObjs[i]
						
			if(obj.type==SPRING_MESH){

				springmeshMove2(obj,dt);
				continue;
			}
			
			if(obj.fix)continue;

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
			Vec3.muladd(obj.location,obj.location,obj.v,dt);
			//Vec3.mul(obj.v,obj.v,DAMPERD);
			
			Vec3.set(obj.a,0,0,0);
			Vec3.set(obj.aa,0,0,0);
			


		}
		return
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
			Vec3.set(rVec,cuboid.rotmat[i*4+0],cuboid.rotmat[i*4+1],cuboid.rotmat[i*4+2])
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
			Vec3.set(rVec,cuboid.rotmat[i*4+0],cuboid.rotmat[i*4+1],cuboid.rotmat[i*4+2])
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
				Vec3.set(n,rotmat[i*4+0],rotmat[i*4+1],rotmat[i*4+2]);
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
				Vec3.set(n,rotmat[i*4+0],rotmat[i*4+1],rotmat[i*4+2]);
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
						Vec3.set(n,rotmat[i*4+0],rotmat[i*4+1],rotmat[i*4+2]);
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
				Vec3.set(n,rotmat[i*4+0],rotmat[i*4+1],rotmat[i*4+2]);
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
				Vec3.set(r,rotmat[i*4+0],rotmat[i*4+1],rotmat[i*4+2]);
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
				Vec3.set(n,rotmat[i*4+0],rotmat[i*4+1],rotmat[i*4+2]);
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
			Vec3.set(n,rotmat[i*4+0],rotmat[i*4+1],rotmat[i*4+2]);
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
			x=rot[i*4+0];
			y=rot[i*4+1];
			z=rot[i*4+2];
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
				x = rotA[4*i + 1]* rotB[4*j+2] - rotA[4*i+2]*rotB[4*j+1];
				y = rotA[4*i + 2]* rotB[4*j+0] - rotA[4*i+0]*rotB[4*j+2];
				z = rotA[4*i + 0]* rotB[4*j+1] - rotA[4*i+1]*rotB[4*j+0];
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
				idx=minn*4;
			}else{
				boxA = bb;
				boxB = ba;
				idx=(minn-3)*4;
			}
			rotA = boxA.rotmat;
			rotB = boxB.rotmat;
			matA= boxA.matrix;
			matB= boxB.matrix;
			Vec3.set(nVec,rotA[idx+0],rotA[idx+1],rotA[idx+2]);
			var flg=0;
			for(var ii=0;ii<3;ii++){
				l= nVec[0]*rotB[ii*4+0] + nVec[1]*rotB[ii*4+1] +nVec[2]*rotB[ii*4+2];
				if(l==0){
					dVec[0] = nVec[1]*rotB[ii*4+2] - nVec[2]*rotB[ii*4+1];
					dVec[1] = nVec[2]*rotB[ii*4+0] - nVec[0]*rotB[ii*4+2];
					dVec[2] = nVec[0]*rotB[ii*4+1] - nVec[1]*rotB[ii*4+0];
					Vec3.norm(dVec);
					Mat43.getRotMat(bM,DELTA,dVec[0],dVec[1],dVec[2]);
					Mat43.dot(rotA,rotA,bM);
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
				idx=minn*4;
			}else{
				boxA = bb;
				boxB = ba;
				idx=(minn-3)*4;
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
			Vec3.set(aVec,rotA[4*i + 0],rotA[4*i + 1],rotA[4*i + 2]);
			Vec3.set(bVec,rotB[4*j + 0], rotB[4*j + 1], rotB[4*j + 2]);
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
		
		Vec3.set(rVec,capsule.rotmat[8],capsule.rotmat[9],capsule.rotmat[10]);
		var l = Vec3.dot(rVec,dVec);
		var l2 = capsule.size[2]*capsule.scale[2];
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
	
		Vec3.muladd(pos,sphere.location,dVec,-ra);
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
		var cl =capsule.scale[2]*capsule.size[2];
		Mat43.copy(bM,capsule.matrix);
		var poses = mesh.poses;
		var faceNormals = mesh.faceNormals;
		var edge1Normals = mesh.edge1Normals;
		var edge2Normals = mesh.edge2Normals;
		Vec3.set(rVec,capsule.rotmat[8],capsule.rotmat[9],capsule.rotmat[10]);
					
		for(var j = faces.length;j--;){
			var face = faces[j]
			var p0 = poses[face.idx[0]];
			dVec[0]= bM[12] - p0[0];
			dVec[1]= bM[13] - p0[1];
			dVec[2]= bM[14] - p0[2];
			var n= faceNormals[j];

			if(Vec3.dot(n,rVec)<0){
				Vec3.muladd(dVec,dVec,rVec,cl);
			}else{
				Vec3.muladd(dVec,dVec,rVec,-cl);
			}

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
			Vec3.cross(nVec,n2Vec,rVec);
			if(nVec[0] == 0 && nVec[1] == 0 && nVec[2]==0){
				continue;
			}
			Vec3.cross(nVec,nVec,n2Vec);

			l = Vec3.dot(nVec,dVec);
			l2 = Vec3.dot(nVec,rVec);
			l=-l/l2
			if(l<-cl){
				l= -cl;
			}else if(l>cl){
				l= cl;
			}
			Vec3.muladd(dVec,dVec,rVec,l);

			Vec3.sub(nVec,p1,p0);
			l=Vec3.dot(nVec,dVec);
			if(l<0){
				continue;
			}
			l2 = Vec3.dot(nVec,nVec);
			if(l>l2){
				continue;
			}
			Vec3.muladd(nVec,dVec,nVec,-l/l2);
			Vec3.norm(nVec);
			l = Vec3.dot(nVec,dVec);
			if(l>r){
				continue;
			}
			Vec3.add(pos,dVec,p0);
			Vec3.add(pos,pos,nVec,-r);
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
		var cl = capsule.scale[2]*capsule.size[2];
		var r = capsule.r;
		Vec3.set(caprot,capsule.rotmat[8],capsule.rotmat[9],capsule.rotmat[10]);
		Vec3.sub(dVec,capsule.location,cuboid.location);

		min= 999999;
		minn = -1;
		for(var i=0;i<3;i++){
			Vec3.set(nVec,rotmat[i*4+0],rotmat[i*4+1],rotmat[i*4+2]);
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
			Vec3.set(nVec,rotmat[i*4+0],rotmat[i*4+1],rotmat[i*4+2]);

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
			Vec3.set(nVec,rotmat[i*4+0],rotmat[i*4+1],rotmat[i*4+2]);
			if(Vec3.dot(nVec,caprot)==0){
				Vec3.cross(nVec,nVec,caprot);
				Vec3.norm(nVec);
				Mat43.getRotMat(bM2,DELTA,nVec[0],nVec[1],nVec[2]);
				Mat43.dot(rotmat,rotmat,bM2);
				Mat43.dot(bM,bM,bM2);
				min= 999999;
				minn = -1;

				for(var i=0;i<3;i++){
					Vec3.set(nVec,rotmat[i*4+0],rotmat[i*4+1],rotmat[i*4+2]);
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
					Vec3.set(nVec,rotmat[i*4+0],rotmat[i*4+1],rotmat[i*4+2]);

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
			Vec3.set(nVec,rotmat[i*4+0],rotmat[i*4+1],rotmat[i*4+2]);
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
			Vec3.set(rVec,rotmat[i*4+0],rotmat[i*4+1],rotmat[i*4+2]);
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


	return ret
})()

