"use strict"
var OnoPhy = (function(){
	var PhyObj = function(){
		this.v = new Vec3()
		this.a = new Vec3()
		this.type = 0
		this.fix=0
		this.enable=false;
		this.mass=1;
		this.sfriction=10;
		this.dfriction=10;
		this.repulsion=50;
		this.damper=10;
		this.matrix =new Mat43()
		this.imatrix = new Mat43()
	}
	var Mesh =  function(){
		this.type=MESH
		this.fix=1;
		this.mesh=null;
		this.faceNormals=[];
		this.edge1Normals=[];
		this.edge2Normals=[];
	}
	Mesh.prototype=new PhyObj();
	var SpringMesh =  function(vertexsize){
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
	SpringMesh.prototype=new PhyObj();

	var Collision =  function(type){
		this.type=type;
	}
	Collision.prototype=new PhyObj();
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
			var res=new Mesh()
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
			Vec3.norm(edge1Normal);
			Vec3.mul(edge1Normal,edge1Normal,1.0/Vec3.dot(bV2,edge1Normal));
			
			Vec3.cross(edge2Normal,bV2,faceNormal);
			Vec3.norm(edge2Normal);
			Vec3.mul(edge2Normal,edge2Normal,1.0/Vec3.dot(bV1,edge2Normal));
		
		}
	}
	
	var calc_t=function(phyObjs,dt){
		var i,j,k
		,AIR_DAMPER=Math.pow(0.95,dt) 
		,REFLECT_DAMPER=1-Math.pow(0.1,dt)
		,PENALTY=10
		,CLOTH_DAMPER=0.04
		,GRAVITY = 9.8
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
		,retio,retio2,retiox,retioy,retioz
		,detdt=1/dt;
		
		
		for(i = phyObjs.length;i--;){
			obj = phyObjs[i]

			CLOTH_WEIGHT=obj.mass;
			if(obj.type==SPRING_MESH)continue
			if(obj.fix)continue
			Vec3.mul(obj.v,obj.v,obj.mass);
		}
		
		for(i = phyObjs.length;i--;){
			obj = phyObjs[i]
			CLOTH_WEIGHT=obj.mass;
			if(obj.type===MESH){
				Mat43.getInv(obj.imatrix,obj.matrix);
				mesh = obj.mesh
				faces=mesh.faces;
				var vertices = mesh.vertices;
				//別オブジェクトとのあたり判定
				for(k = phyObjs.length;k--;){
					obj2 = phyObjs[k]
					switch(obj2.type){
					case SPHERE:
						matrix=obj2.matrix
						retio2 = matrix[0]*matrix[0]+matrix[1]*matrix[1]+matrix[2]*matrix[2]
						retio=Math.sqrt(retio2)
						
						bV0[0] = obj2.matrix[12]
						bV0[1] = obj2.matrix[13]
						bV0[2] = obj2.matrix[14]
						Mat43.dotMat43Vec3(bV0,obj.imatrix,bV0);
						var hitflg=1;
						while(hitflg){
							hitflg=0;
							for(j = faces.length;j--;){
								face = faces[j]

								Vec3.sub(bV1,bV0,vertices[face.idx[0]].pos);
								var l=Vec3.dot(bV1,obj.faceNormals[j]);
								if(l*l>1.0){
									continue;
								}
								l=Vec3.dot(bV1,obj.edge1Normals[j]);
								if(l>1.0 || l<0){
									continue;
								}
								
								var l2=Vec3.dot(bV1,obj.edge2Normals[j]);
								if(l2>1.0 || l2<0){
									continue;
								}
								if(l2+l>1.0){
									continue;
								}
								Vec3.set(Geono.sPoint,bV0[0],bV0[1],bV0[2]);
								Vec3.muladd(Geono.sPoint2,bV0,obj.faceNormals[j],-Vec3.dot(obj.faceNormals[j],bV1));
								
								//var flg=Geono.P2T(bV0,p0.pos,p1.pos,p2.pos);
								//if(flg!=0){
								//	continue;
								//}

								Vec3.sub(bV1,Geono.sPoint,Geono.sPoint2);
								Mat43.dotMat43Vec3(bV1,obj.matrix,bV1);
								var l2 = bV1[0]*bV1[0] + bV1[1]*bV1[1] + bV1[2]*bV1[2];
								if(l2 < 1.0){
									l2=1/l2;
									var l = Math.sqrt(l2);
									//Vec3.mul(bV2,bV1,(1.0-l)/l);
									Vec3.mul(bV2,bV1,l-1.0);

									//Vec3.muladd(obj2.a,obj2.a,bV2,200);
									//Vec3.nrm(bV3,bV2);

									l=Vec3.dot(bV1,obj2.v)*l2;
									Vec3.muladd(obj2.a,obj2.a,bV1,-l*20);

									Mat43.dotMat43Vec3(bV2,obj.imatrix,bV2);
									Vec3.add(bV0,bV0,bV2);
									hitflg++;

								}
							}
							hitflg=0;
						}
						Mat43.dotMat43Vec3(bV0,obj.matrix,bV0);
						bV2[0] = bV0[0] - obj2.matrix[12];
						bV2[1] = bV0[1] - obj2.matrix[13];
						bV2[2] = bV0[2] - obj2.matrix[14];
						Vec3.muladd(obj2.a,obj2.a,bV2,200);
//						Vec3.norm(bV2);
//						var l=Vec3.dot(bV2,obj2.v);
//						Vec3.muladd(obj2.a,obj2.a,bV2,-l*20);
						break;
					}
				}

			}
			if(obj.type==SPRING_MESH){

				mesh = obj.mesh
				vertices = obj.truepos;
				velocities = obj.v
				accs=obj.a
				positions=obj.pos
				fixes=obj.fixes
				edges=obj.joints;
				faces=obj.faces;

				//頂点の加速度
				for(j=positions.length;j--;){
					Vec3.set(accs[j],0,0,0);
					Vec3.muladd(accs[j],accs[j],velocities[j],-obj.friction);
				}
				//頂点間のばね制御
				for(j=edges.length;j--;){
					edge=edges[j]
					p0=edge.v0
					p1=edge.v1
					if(fixes[p0] && fixes[p1])continue;

					len2=Vec3.len(vertices[p0],vertices[p1])
					if(len2*len2<0.0001){
						continue;
					}

					Vec3.sub(bV3,positions[p1],positions[p0])
					x=bV3[0]
					y=bV3[1]
					z=bV3[2]
						
					len=Vec3.scalar(bV3);
					if(!len){
						continue
					}

					len=(len-len2)*len2;
					if(len<0){
						len *= obj.edgePush;
					}else if(len>0){
						len *= obj.edgePull;
					}
					Vec3.norm(bV3);
					Vec3.muladd(accs[p0],accs[p0],bV3,len);
					Vec3.muladd(accs[p1],accs[p1],bV3,-len);

					Vec3.sub(bV1,velocities[p1],velocities[p0]);
					CLOTH_DAMPER=obj.edgeDamping;
					Vec3.mul(bV0,bV3,(Vec3.dot(bV1,bV3))*0.5);
					Vec3.muladd(accs[p0],accs[p0],bV0,CLOTH_DAMPER);
					Vec3.muladd(accs[p1],accs[p1],bV0,-CLOTH_DAMPER);

					
				}
				
				//別オブジェクトとのあたり判定
				for(k = phyObjs.length;k--;){
					obj2 = phyObjs[k]
					switch(obj2.type){
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
					case CAPSULE:
						matrix=obj2.matrix
						Mat43.dotMat43Vec3(bV0,matrix,Z_VECTOR)
						Mat43.dotMat43Vec3(bV1,matrix,Z_VECTOR_NEG)
						retio2=(matrix[0]*matrix[0]+matrix[1]*matrix[1]+matrix[2]*matrix[2])
						retio=Math.sqrt(retio2)
						
						for(j = faces.length;j--;){
							face = faces[j]
							p0=face[0]
							p1=face[1]
							p2=face[2]
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
						break;
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
				
				//元形状補正
				var goalDefault = obj.goalDefault*detdt;
				var wei=dt/CLOTH_WEIGHT;
				
				//頂点の移動
				for(j=positions.length;j--;){
					if(fixes[j] === 0){
						Vec3.sub(bV3,vertices[j],positions[j])
						Vec3.muladd(accs[j],accs[j],bV3,goalDefault);

						velocity= velocities[j]
						accs[j][1]-=GRAVITY*CLOTH_WEIGHT
						Vec3.muladd(velocity,velocity,accs[j],wei);
						Vec3.muladd(positions[j],positions[j],velocity,dt);
					}else{
						Vec3.sub(velocities[j],vertices[j],positions[j]);
						Vec3.mult(velocities[j],velocities[j],detdt);
						Vec3.copy(positions[j],vertices[j]);
					}
				}
				
				//両面オブジェクト対応
				for(j=edges.length;j--;){
					edge=edges[j]
					p0=edge.v0
					p1=edge.v1
					if(fixes[p0] && fixes[p1])continue;
						
					len2=Vec3.len(vertices[p0],vertices[p1])
						
					if(len2*len2<0.0001){
						Vec3.copy(positions[p1],positions[p0])
						continue;
					}
				}
			}
			matrix=obj.matrix

		}
		for(i = phyObjs.length;i--;){
			obj = phyObjs[i]
			if(obj.type==SPRING_MESH)continue;
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

