"use strict"
var Geono= (function(){
	var sPoint=new Vec3()
	,sPoint2=new Vec3()
	,iPoint=new Vec3()
	,iPoint2=new Vec3()
	,closestA=new Vec3()
	,closestB=new Vec3()

	,Z_VECTOR = [0,0,1]
	,Z_VECTOR_NEG = [0,0,-1]
	,ZERO_VECTOR = [0,0,0]

	,PE_NUM = 4
	
	var bV0 = new Vec3()
	,bV1 = new Vec3()
	,bV2 = new Vec3()
	,bV3 = new Vec3()
	,bV4 = new Vec3()
	,bV5 = new Vec3()


	var	daen_flg,daen_a,daen_b,pk1,pk2,pk3,qk1,qk2,rk1,rk2,rk3,B3

	var ret=function(){}

	ret.iPoint=iPoint
	ret.iPoint2=iPoint2
	ret.sPoint=sPoint
	ret.sPoint2=sPoint2
	ret.Z_VECTOR= Z_VECTOR
	ret.Z_VECTOR_NEG= Z_VECTOR_NEG
	ret.ZERO_VECTOR= ZERO_VECTOR
	ret.closestA=closestA;
	ret.closestB=closestB;

	var pointPoint=ret.pointPoint=function(p0,p1){
		closestA[0]=p0[0]
		closestA[1]=p0[1]
		closestA[2]=p0[2]

		closestB[0]=p1[0]
		closestB[1]=p1[1]
		closestB[2]=p1[2]
	}
	var linePoint=ret.linePoint=function(p0,p1,p2){
		Vec3.set(closestB,p2[0],p2[1],p2[2])
		var d0x=p1[0]-p0[0]
		var d0y=p1[1]-p0[1]
		var d0z=p1[2]-p0[2]
		var d1x=p2[0]-p0[0]
		var d1y=p2[1]-p0[1]
		var d1z=p2[2]-p0[2]
		var s=d0x*d0x+d0y*d0y+d0z*d0z
		var l=(d0x*d1x+d0y*d1y+d0z*d1z)/s
		if(l<0){
			Vec3.set(closestA,p0[0],p0[1],p0[2])
		}else if(l>1){
			Vec3.set(closestA,p1[0],p1[1],p1[2])
		}else{
			closestA[0]=p0[0]+d0x*l
			closestA[1]=p0[1]+d0y*l
			closestA[2]=p0[2]+d0z*l
		}
	}
	var lineLine=ret.lineLine=function(p0,p1,p2,p3){
		var d1x=p1[0]-p0[0]
		var d1y=p1[1]-p0[1]
		var d1z=p1[2]-p0[2]
		var d2x=p2[0]-p0[0]
		var d2y=p2[1]-p0[1]
		var d2z=p2[2]-p0[2]
		var d3x=p3[0]-p2[0]
		var d3y=p3[1]-p2[1]
		var d3z=p3[2]-p2[2]
		var d1=1/(d1x*d1x+d1y*d1y+d1z*d1z)
		var l=(d1x*d3x+d1y*d3y+d1z*d3z)*d1

		var nx=d3x-d1x*l;
		var ny=d3y-d1y*l;
		var nz=d3z-d1z*l;

		var l2=-(d2x*nx+d2y*ny+d2z*nz)/(d3x*nx+d3y*ny+d3z*nz)

		d2x=d2x+d3x*l2 
		d2y=d2y+d3y*l2
		d2z=d2z+d3z*l2

		l=(d2x*d1x+d2y*d1y+d2z*d1z)*d1

		if(l>=0 && l<=1 && l2>=0 && l2<=1){
			closestA[0]=p0[0]+d1x*l
			closestA[1]=p0[1]+d1y*l
			closestA[2]=p0[2]+d1z*l
			closestB[0]=p2[0]+d3x*l2
			closestB[1]=p2[1]+d3y*l2
			closestB[2]=p2[2]+d3z*l2
		}else if(l>=0 && l<=1){
			if(l2<0){
				linePoint(p0,p1,p2);
			}else{
				linePoint(p0,p1,p3);
			}
		}else if(l2>=0 && l2<=1){
			if(l<0){
				linePoint(p2,p3,p0);
			}else{
				linePoint(p2,p3,p1);
			}
		}else{
			if(l>1)l-=1;
			if(l2>1)l2-=1;
			if(l*l<l2*l2*(d3x*d3x+d3y*d3y+d3z*d3z)*d1){
				if(l2<0){
					linePoint(p0,p1,p2);
				}else{
					linePoint(p0,p1,p3);
				}
			}else{
				if(l<0){
					linePoint(p2,p3,p0);
				}else{
					linePoint(p2,p3,p1);
				}
			}
		}
	}

	var trianglePointSub = ret.triangleSub=function(p0,p1,p2,p3){
		var d1x=p1[0]-p0[0]
		var d1y=p1[1]-p0[1]
		var d1z=p1[2]-p0[2]
		var d2x=p2[0]-p0[0]
		var d2y=p2[1]-p0[1]
		var d2z=p2[2]-p0[2]
		var d3x=p3[0]-p0[0]
		var d3y=p3[1]-p0[1]
		var d3z=p3[2]-p0[2]
		var l2=1/(d2x*d2x+d2y*d2y+d2z*d2z);
		var l1=1/(d1x*d1x+d1y*d1y+d1z*d1z);
		var dd=(d1x*d2x +d1y*d2y + d1z*d2z)

		var l=dd*l2;

		var n1x=d1x-l*d2x;
		var n1y=d1y-l*d2y;
		var n1z=d1z-l*d2z;
		l=1/(n1x*n1x+n1y*n1y+n1z*n1z)
		n1x*=l
		n1y*=l
		n1z*=l

		l=dd*l1;

		var n2x=d2x-l*d1x;
		var n2y=d2y-l*d1y;
		var n2z=d2z-l*d1z;
		l=1/(n2x*n2x+n2y*n2y+n2z*n2z)
		n2x*=l
		n2y*=l
		n2z*=l

		l1=n1x*d3x+n1y*d3y+n1z*d3z
		l2=n2x*d3x+n2y*d3y+n2z*d3z

		var ret=0;
		if(l1<0){
			ret|=1;
		}
		if(l2<0){
			ret|=2;
		}
		if(l1+l2>1){
			ret|=4;
		}
		return ret;
	}
	var trianglePoint=ret.trianglePoint=function(p0,p1,p2,p3){
		var d1x=p1[0]-p0[0]
		var d1y=p1[1]-p0[1]
		var d1z=p1[2]-p0[2]
		var d2x=p2[0]-p0[0]
		var d2y=p2[1]-p0[1]
		var d2z=p2[2]-p0[2]
		var d3x=p3[0]-p0[0]
		var d3y=p3[1]-p0[1]
		var d3z=p3[2]-p0[2]
		var l2=1/(d2x*d2x+d2y*d2y+d2z*d2z);
		var l1=1/(d1x*d1x+d1y*d1y+d1z*d1z);
		var dd=(d1x*d2x +d1y*d2y + d1z*d2z)

		var l=dd*l2;

		var n1x=d1x-l*d2x;
		var n1y=d1y-l*d2y;
		var n1z=d1z-l*d2z;
		l=1/(n1x*n1x+n1y*n1y+n1z*n1z)
		n1x*=l
		n1y*=l
		n1z*=l

		l=dd*l1;

		var n2x=d2x-l*d1x;
		var n2y=d2y-l*d1y;
		var n2z=d2z-l*d1z;
		l=1/(n2x*n2x+n2y*n2y+n2z*n2z)
		n2x*=l
		n2y*=l
		n2z*=l

		l1=n1x*d3x+n1y*d3y+n1z*d3z
		l2=n2x*d3x+n2y*d3y+n2z*d3z

		closestB[0]=p3[0]
		closestB[1]=p3[1]
		closestB[2]=p3[2]
		console.log(l,l1,l2);
		if(l1>=0 && l2 >=0 && l1+l2<=1){
			closestA[0]=p0[0]+l1*d1x+l2*d2x
			closestA[1]=p0[1]+l1*d1y+l2*d2y
			closestA[2]=p0[2]+l1*d1z+l2*d2z
		}else if(l1<=0 && l2<=0){
			closestA[0]=p0[0]
			closestA[1]=p0[1]
			closestA[2]=p0[2]
		}else if(l1+l2>=1 && l2<=0){
			closestA[0]=p1[0]
			closestA[1]=p1[1]
			closestA[2]=p1[2]
		}else if(l1<=0 && l2+l1>=1){
			closestA[0]=p2[0]
			closestA[1]=p2[1]
			closestA[2]=p2[2]
		}else if(l1<=0){
			linePoint(p0,p2,p3);
		}else if(l2<=0){
			linePoint(p0,p1,p3);
		}else{
			linePoint(p1,p2,p3);
		}

		
	}
	ret.triangleLine=function(p0,p1,p2,p3,p4){
		var d1x=p1[0]-p0[0]
		var d1y=p1[1]-p0[1]
		var d1z=p1[2]-p0[2]
		var d2x=p2[0]-p0[0]
		var d2y=p2[1]-p0[1]
		var d2z=p2[2]-p0[2]
		var d3x=p3[0]-p0[0]
		var d3y=p3[1]-p0[1]
		var d3z=p3[2]-p0[2]
		var d4x=p4[0]-p0[0]
		var d4y=p4[1]-p0[1]
		var d4z=p4[2]-p0[2]
		var nx=d1y*d2z - d1z*d2y
		var ny=d1z*d2x - d1x*d2z
		var nz=d1x*d2y - d1y*d2x

		var l=d3x*nx + d3y*ny + d3z*nz
		var l2=d4x*nx + d4y*ny + d4z*nz
		var p;
		var dx=p4[0]-p3[0]
		var dy=p4[1]-p3[1]
		var dz=p4[2]-p3[2]
		var cross=0;
		if(l*l2>0){
			if(l*l<l2*l2){
				p=p3;
			}else{
				p=p4;
				l=l2;
			}
		}else{
			var d=l/(l-l2)
			bV0[0] = p3[0] + dx*d
			bV0[1] = p3[1] + dy*d
			bV0[2] = p3[2] + dz*d
			p=bV0
			cross=1;
		}
		var f=trianglePointSub(p0,p1,p2,p);
		if(f==0 && cross==1){
			var shortest,s;
			if(l*l<l2*l2){
				p=p3;
			}else{
				p=p4;
				l=l2;
			}
			var d=-l/(nx*nx+ny*ny+nz*nz)
			bV0[0]=p[0]+nx*d
			bV0[1]=p[1]+ny*d
			bV0[2]=p[2]+nz*d
			bV1[0]=p[0]
			bV1[1]=p[1]
			bV1[2]=p[2]
			shortest=Vec3.len2(bV0,bV1);

			lineLine(p0,p1,p3,p4);
			s=Vec3.len2(closestA,closestB);
			if(shortest>s){
				shortest=s;
				bV0[0]=closestA[0];
				bV0[1]=closestA[1];
				bV0[2]=closestA[2];
				bV1[0]=closestB[0];
				bV1[1]=closestB[1];
				bV1[2]=closestB[2];
			}
			lineLine(p0,p1,p3,p4);
			s=Vec3.len2(closestA,closestB);
			if(shortest>s){
				shortest=s;
				bV0[0]=closestA[0];
				bV0[1]=closestA[1];
				bV0[2]=closestA[2];
				bV1[0]=closestB[0];
				bV1[1]=closestB[1];
				bV1[2]=closestB[2];
			}

			lineLine(p1,p2,p3,p4);
			s=Vec3.len2(closestA,closestB);
			if(shortest>s){
				shortest=s;
				bV0[0]=closestA[0];
				bV0[1]=closestA[1];
				bV0[2]=closestA[2];
				bV1[0]=closestB[0];
				bV1[1]=closestB[1];
				bV1[2]=closestB[2];
			}

			lineLine(p2,p0,p3,p4);
			s=Vec3.len2(closestA,closestB);
			if(shortest>s){
				shortest=s;
				bV0[0]=closestA[0];
				bV0[1]=closestA[1];
				bV0[2]=closestA[2];
				bV1[0]=closestB[0];
				bV1[1]=closestB[1];
				bV1[2]=closestB[2];
			}

			closestA[0]=bV0[0]
			closestA[1]=bV0[1]
			closestA[2]=bV0[2]
			closestB[0]=bV1[0]
			closestB[1]=bV1[1]
			closestB[2]=bV1[2]
		
			return 1;
		}
		if(f==0){

			var d=-l/(nx*nx+ny*ny+nz*nz)
			closestA[0]=p[0]+nx*d
			closestA[1]=p[1]+ny*d
			closestA[2]=p[2]+nz*d
			closestB[0]=p[0]
			closestB[1]=p[1]
			closestB[2]=p[2]
		}else if(f==1){
			lineLine(p2,p0,p3,p4);
		}else if(f==2){
			lineLine(p0,p1,p3,p4);
		}else if(f==4){
			lineLine(p1,p2,p3,p4);
		}else{
			var t1,t2,t3
			var d1=1/(dx*dx+dy*dy+dz*dz)
			if(f==3){
				l=(dx*d1x+dy*d1y+dz*d1z)*d1
				nx=d1x-dx*l;
				ny=d1y-dy*l;
				nz=d1z-dz*l;
				d2x=p3[0]-p0[0]
				d2y=p3[1]-p0[1]
				d2z=p3[2]-p0[2]
				l2=(d2x*nx+d2y*ny+d2z*nz)/(d1x*nx+d1y*ny+d1z*nz)
				if(l2<0){
					lineLine(p2,p0,p3,p4);
				}else{
					lineLine(p0,p1,p3,p4);
				}
			}else if( f==5){
				l=(dx*d2x+dy*d2y+dz*d2z)*d1
				nx=d2x-dx*l;
				ny=d2y-dy*l;
				nz=d2z-dz*l;
				d3x=p3[0]-p0[0]
				d3y=p3[1]-p0[1]
				d3z=p3[2]-p0[2]
				l2=(d3x*nx+d3y*ny+d3z*nz)/(d2x*nx+d2y*ny+d2z*nz)
				if(l2<1){
					lineLine(p2,p0,p3,p4);
				}else{
					lineLine(p1,p2,p3,p4);
				}
			}else if(f==6){
				l=(dx*d1x+dy*d1y+dz*d1z)*d1
				nx=d1x-dx*l;
				ny=d1y-dy*l;
				nz=d1z-dz*l;
				d2x=p3[0]-p0[0]
				d2y=p3[1]-p0[1]
				d2z=p3[2]-p0[2]
				l2=(d2x*nx+d2y*ny+d2z*nz)/(d1x*nx+d1y*ny+d1z*nz)
				if(l2<1){
					lineLine(p0,p1,p3,p4);
				}else{
					lineLine(p1,p2,p3,p4);
				}
			}
			
		}
		return 0;
	}

	ret.R2P=function(rx,ry,rw,rh,px,py){
		var w=rw/2
			,h=rh/2
			,x=rx+w
			,y=ry+h
		if(Math.abs(x-px)>w)return 0
		if(Math.abs(y-py)>h)return 0
		return 1
	}
	ret.P2P=function(p0,p1){
		sPoint[0]=p0[0]
		sPoint[1]=p0[1]
		sPoint[2]=p0[2]

		sPoint2[0]=p1[0]
		sPoint2[1]=p1[1]
		sPoint2[2]=p1[2]
	}

	ret.P2L=function(p,l0,l1){
		var len,x,y,z

		sPoint[0]=p[0]
		sPoint[1]=p[1]
		sPoint[2]=p[2]

		x=l1[0]-l0[0]
		y=l1[1]-l0[1]
		z=l1[2]-l0[2]
		
		Vec3.sub(bV1,p,l0)
		if(x*bV1[0]+ y*bV1[1] + z*bV1[2]<=0){
			sPoint2[0]=l0[0]
			sPoint2[1]=l0[1]
			sPoint2[2]=l0[2]
			return
		}
		Vec3.sub(bV1,p,l1)
		len = x*bV1[0]+ y*bV1[1] + z*bV1[2]
		if(len>=0){
			sPoint2[0]=l1[0]
			sPoint2[1]=l1[1]
			sPoint2[2]=l1[2]
			return
		}
		
		len /= x*x + y*y + z*z
		
		sPoint2[0] = l1[0] + x * len 
		sPoint2[1] = l1[1] + y * len 
		sPoint2[2] = l1[2] + z * len 
	}

	ret.L2L=function(l0,l1,l2,l3){
		var len0,len1,len2
		var x,y,z
		var pos

		Vec3.sub(bV0,l1,l0)
		Vec3.sub(bV1,l3,l2)
		Vec3.cross(bV3,bV1,bV0)
		Vec3.cross(bV2,bV3,bV1)
		x=bV2[0]
		y=bV2[1]
		z=bV2[2]
		
		len2=x*l2[0] + y*l2[1] + z*l2[2]
		len0=x*l0[0] + y*l0[1] + z*l0[2] - len2
		len1=x*l1[0] + y*l1[1] + z*l1[2] - len2
		
		if(len0*len1<0){
			Vec3.mult(bV0,bV0,len0/(len0-len1))
			Vec3.add(sPoint,bV0,l0)
			pos= sPoint
		}else{
			if(len0*len0<len1*len1){
				pos = l0
			}else{
				pos = l1
			}
		}
		Vec3.sub(bV0,pos,l3)
		if(Vec3.dot(bV0,bV1)>0){
			this.P2L(l3,l0,l1)
			x=sPoint2[0];y=sPoint2[1];z=sPoint2[2]
			sPoint2[0]=sPoint[0];sPoint2[1]=sPoint[1];sPoint2[2]=sPoint[2]
			sPoint[0]=x;sPoint[1]=y;sPoint[2]=z
			return
		}

		Vec3.sub(bV0,pos,l2)
		if(Vec3.dot(bV0,bV1)<0){
			this.P2L(l2,l0,l1)
			x=sPoint2[0];y=sPoint2[1];z=sPoint2[2]
			sPoint2[0]=sPoint[0];sPoint2[1]=sPoint[1];sPoint2[2]=sPoint[2]
			sPoint[0]=x;sPoint[1]=y;sPoint[2]=z
			return
		}
		sPoint[0] = pos[0]
		sPoint[1] = pos[1]
		sPoint[2] = pos[2]

		x=bV1[0]
		y=bV1[1]
		z=bV1[2]
		
		len0 = (bV0[0]*x + bV0[1]*y + bV0[2]*z)
		len0 /= x*x + y*y + z*z
	
		sPoint2[0] = l2[0] + x * len0 
		sPoint2[1] = l2[1] + y * len0 
		sPoint2[2] = l2[2] + z * len0
		
		return
	}
	ret.PinT= function(p,p0,p1,p2){
		var flg=0
		Vec3.sub(bV0,p1,p0)
		Vec3.sub(bV1,p2,p0)
		Vec3.cross(bV0,bV0,bV1)
		Vec3.sub(bV1,p0,p)
		Vec3.sub(bV2,p1,p)
		Vec3.cross(bV1,bV1,bV2)
		if(Vec3.dot(bV0,bV1)<=0)flg|=1
		Vec3.sub(bV1,p2,p)
		Vec3.cross(bV2,bV2,bV1)
		if(Vec3.dot(bV0,bV2)<=0)flg|=2
		Vec3.sub(bV2,p0,p)
		Vec3.cross(bV1,bV1,bV2)
		if(Vec3.dot(bV0,bV1)<=0)flg|=4
		return flg;
	}

	ret.P2T=function(p,t0,t1,t2){
		var len
		,flg=0
		,L0,L1,L2=null
		,nx,ny,nz
		sPoint[0]=p[0]
		sPoint[1]=p[1]
		sPoint[2]=p[2]

		Vec3.sub(bV3,t1,t0)
		Vec3.sub(bV4,t2,t0)
		Vec3.cross(bV0,bV3,bV4)
		nx=bV3[1]*bV4[2] - bV3[2]*bV4[1]
		ny=bV3[2]*bV4[0] - bV3[0]*bV4[2]
		nz=bV3[0]*bV4[1] - bV3[1]*bV4[0]

		Vec3.sub(bV0,p,t0)
		Vec3.cross(bV1,bV3,bV0)
		Vec3.cross(bV2,bV0,bV4)
		flg=(nx*bV1[0] + ny*bV1[1] + nz*bV1[2]<0)|((nx*bV2[0] + ny*bV2[1] + nz*bV2[2]<0)<<2)
		if(flg!=5){
			Vec3.sub(bV0,p,t1)
			Vec3.sub(bV1,t2,t1)
			Vec3.cross(bV2,bV1,bV0)
			flg|=(nx*bV2[0] + ny*bV2[1] + nz*bV2[2]<0)<<1
		}

		switch(flg){
		case 0:
			len = (nx*bV0[0] + ny*bV0[1] + nz*bV0[2])
				/ (nx*nx+ny*ny+nz*nz)
			sPoint2[0] = p[0] - nx * len 
			sPoint2[1] = p[1] - ny * len 
			sPoint2[2] = p[2] - nz * len 
			return flg;
		case 1:
			L0=t0
			L1=t1
			break
		case 2:
			L0=t1
			L1=t2
			break
		case 4:
			L0=t2
			L1=t0
			break
		case 3:
			L0=t1
			L1=t0
			L2=t2
			break
		case 6:
			L0=t2
			L1=t1
			L2=t0
			break
		case 5:
			L0=t0
			L1=t2
			L2=t1
			break
		}
		if(!L2){
			nx = L1[0]-L0[0]
			ny = L1[1]-L0[1]
			nz = L1[2]-L0[2]
			
			Vec3.sub(bV1,p,L1)
			if(nx*bV1[0]+ny*bV1[1]+nz*bV1[2]>0){
				sPoint2[0]=L1[0]
				sPoint2[1]=L1[1]
				sPoint2[2]=L1[2]
				return flg;
			}
			Vec3.sub(bV1,p,L0)
			len=nx*bV1[0]+ny*bV1[1]+nz*bV1[2]
			if(len<0){
				sPoint2[0]=L0[0]
				sPoint2[1]=L0[1]
				sPoint2[2]=L0[2]
				return flg;
			}
		}else{
			nx = L1[0]-L0[0]
			ny = L1[1]-L0[1]
			nz = L1[2]-L0[2]
			Vec3.sub(bV1,p,L0)
			len=nx*bV1[0]+ny*bV1[1]+nz*bV1[2]
			if(len<0){
				nx = L2[0]-L0[0]
				ny = L2[1]-L0[1]
				nz = L2[2]-L0[2]
				len=nx*bV1[0]+ny*bV1[1]+nz*bV1[2]
				if(len<0){
					sPoint2[0]=L0[0]
					sPoint2[1]=L0[1]
					sPoint2[2]=L0[2]
					return flg;
				}
			}
		}
		len/=nx*nx+ny*ny+nz*nz
		sPoint2[0] = L0[0] + nx * len 
		sPoint2[1] = L0[1] + ny * len 
		sPoint2[2] = L0[2] + nz * len 

		return flg;
	}
	ret.L2T=function(l0,l1,t0,t1,t2){
		var P0
		var len0,len1
		var flg,flg2,cross=0
		var edge0,edge1,corner
		var nx,ny,nz

		Vec3.sub(bV3,t1,t0)
		Vec3.sub(bV4,t2,t0)
		Vec3.cross(sPoint2,bV3,bV4)
		nx=sPoint2[0]
		ny=sPoint2[1]
		nz=sPoint2[2]
		
		
		Vec3.cross(bV3,bV3,sPoint2)
		Vec3.cross(bV5,sPoint2,bV4)
		Vec3.sub(bV4,t2,t1)
		Vec3.cross(bV4,bV4,sPoint2)
		
		Vec3.sub(bV1,l0,t0)
		len0 = nx*bV1[0] + ny*bV1[1] + nz * bV1[2]
		Vec3.sub(bV1,l1,t0)
		len1 = nx*bV1[0] + ny*bV1[1] + nz * bV1[2]

		if(len0*len1<0){
			Vec3.sub(iPoint,l1,l0)
			Vec3.mult(iPoint,iPoint,len0/(len0-len1))
			Vec3.add(iPoint,iPoint,l0)
			cross=1	
			P0=iPoint

		}else{
			if(len0*len0<len1*len1)P0=l0
			else P0=l1
		}

		
		Vec3.sub(bV1,P0,t1)
		flg=(Vec3.dot(bV3,bV1)>0)| (Vec3.dot(bV4,bV1)>0)<<1
		if(flg!=3){
			Vec3.sub(bV1,P0,t2)
			flg|=(Vec3.dot(bV5,bV1)>0)<<2
		}
		switch(flg){
		case 0:
			if(len0*len0<len1*len1){
				sPoint[0] = l0[0]
				sPoint[1] = l0[1]
				sPoint[2] = l0[2]
			}else{
				sPoint[0] = l1[0]
				sPoint[1] = l1[1]
				sPoint[2] = l1[2]
			}
			len0 = ((t0[0]-sPoint[0])*nx + (t0[1]-sPoint[1])*ny + (t0[2]-sPoint[2])*nz)
				/(nx*nx + ny*ny + nz*nz)
			sPoint2[0] = sPoint[0] + nx * len0 
			sPoint2[1] = sPoint[1] + ny * len0 
			sPoint2[2] = sPoint[2] + nz * len0 
			return cross
		case 1:
			this.L2L(l0,l1,t0,t1)
			return 0
		case 2:
			this.L2L(l0,l1,t1,t2)
			return 0
		case 4:
			this.L2L(l0,l1,t2,t0)
			return 0
		case 3:
			corner=t1
			edge0=t0
			edge1=t2
			break
		case 6:
			corner=t2
			edge0=t1
			edge1=t0
			break
		case 5:
			corner=t0
			edge0=t2
			edge1=t1
			break
		}
		Vec3.sub(bV4,edge0,corner)
		Vec3.sub(bV5,edge1,corner)

		
		Vec3.sub(bV1,l0,corner)
		flg=(Vec3.dot(bV1,bV4)>0) | (Vec3.dot(bV1,bV5)>0)<<1
		Vec3.sub(bV1,l1,corner)
		flg2=(Vec3.dot(bV1,bV4)>0) | (Vec3.dot(bV1,bV5)>0)<<1

		if(flg&flg2)flg&=flg2
		else flg|=flg2
		
		if(flg ==3){
//			Vec3.norm(bV3)
//			Vec3.norm(bV4)
//			Vec3.sub(bV5,bV4,bV3)
//			
//			Vec3.sub(bV1,corner,l0)
//			Vec3.sub(bV2,l1,l0)
//			Vec3.cross(bV1,bV1,bV2) 
//			Vec3.cross(bV1,bV1,bV2)
//
//			if(Vec3.dot(bV1,bV5)<0){
//				this.L2L(corner,edge0,l0,l1)
//			}else{
//				this.L2L(corner,edge1,l0,l1)
//			}
			nx=l1[0]-l0[0]
			ny=l1[1]-l0[1]
			nz=l1[2]-l0[2]
			Vec3.sub(bV3,l0,corner)
			len0=(bV3[0]*nx + bV3[1]*ny + bV3[2]*nz)
			/ (nx*nx + ny*ny + nz*nz)
			nx = bV3[0] - nx*len0
			ny = bV3[1] - ny*len0
			nz = bV3[2] - nz*len0

			flg = (bV4[0]*nx+bV4[1]*ny+bV4[2]*nz >0) | (bV5[0]*nx+bV5[1]*ny+bV5[2]*nz >0)<<1 
		}
		switch(flg){
		case 0:
			this.P2L(corner,l0,l1)
			nx=sPoint2[0];ny=sPoint2[1];nz=sPoint2[2]
			sPoint2[0]=sPoint[0];sPoint2[1]=sPoint[1];sPoint2[2]=sPoint[2]
			sPoint[0]=nx;sPoint[1]=ny;sPoint[2]=nz
			break
		case 1:
			this.L2L(l0,l1,corner,edge0)
			break
		case 2:
			this.L2L(l0,l1,corner,edge1)
			break
		}
		return
	}
	ret.T2T=function(t0,t1,t2,t3,t4,t5){
		var ipos=iPoint
		var len0,len1,len2
		var nx,ny,nz
		var flg=0

		Vec3.sub(bV1,t4,t3)
		Vec3.sub(bV2,t5,t3)
		Vec3.cross(bV0,bV1,bV2)
		nx=bV0[0]
		ny=bV0[1]
		nz=bV0[2]
		
		Vec3.cross(bV3,bV1,bV0)
		Vec3.cross(bV5,bV0,bV2)
		Vec3.sub(bV1,t5,t4)
		Vec3.cross(bV4,bV1,bV0)
		
		len0=nx*(t0[0]-t3[0]) + ny*(t0[1]-t3[1]) + nz*(t0[2]-t3[2])
		len1=nx*(t1[0]-t3[0]) + ny*(t1[1]-t3[1]) + nz*(t1[2]-t3[2])
		len2=nx*(t2[0]-t3[0]) + ny*(t2[1]-t3[1]) + nz*(t2[2]-t3[2])
		
		if(len0*len1<0){
			Vec3.sub(bV1,t1,t0)
			Vec3.mult(bV1,bV1,len0/(len0-len1))
			Vec3.add(ipos,bV1,t0)

			Vec3.sub(bV1,ipos,t3)
			if(Vec3.dot(bV1,bV3)<0
			&& Vec3.dot(bV1,bV5)<0){
				Vec3.sub(bV1,ipos,t4)
				if(Vec3.dot(bV1,bV4)<0){
					flg=1
					ipos=iPoint2
				}
			}
		}
		if(len1*len2<0){
			Vec3.sub(bV1,t2,t1)
			Vec3.mult(bV1,bV1,len1/(len1-len2))
			Vec3.add(ipos,bV1,t1)

			Vec3.sub(bV1,ipos,t3)
			if(Vec3.dot(bV1,bV3)<0
			&& Vec3.dot(bV1,bV5)<0){
				Vec3.sub(bV1,ipos,t4)
				if(Vec3.dot(bV1,bV4)<0){
					flg|=2
					if(flg&1)return flg
					ipos=iPoint2
				}
			}
		}

		if(len2*len0<0){
			Vec3.sub(bV1,t0,t2)
			Vec3.mult(bV1,bV1,len2/(len2-len0))
			Vec3.add(ipos,bV1,t2)

			Vec3.sub(bV1,ipos,t3)
			if(Vec3.dot(bV1,bV3)<0
			&& Vec3.dot(bV1,bV5)<0){
				Vec3.sub(bV1,ipos,t4)
				if(Vec3.dot(bV1,bV4)<0){
					flg|=4
					if(flg&3)return flg
					ipos=iPoint2
				}
			}
		}

		Vec3.sub(bV1,t1,t0)
		Vec3.sub(bV2,t2,t0)
		Vec3.cross(bV0,bV1,bV2)
		Vec3.cross(bV3,bV1,bV0)
		Vec3.cross(bV5,bV0,bV2)
		Vec3.sub(bV1,t2,t1)
		Vec3.cross(bV4,bV1,bV0)
		nx=bV0[0]
		ny=bV0[1]
		nz=bV0[2]
		

		len0=nx*(t3[0]-t0[0]) + ny*(t3[1]-t0[1]) + nz*(t3[2]-t0[2])
		len1=nx*(t4[0]-t0[0]) + ny*(t4[1]-t0[1]) + nz*(t4[2]-t0[2])
		len2=nx*(t5[0]-t0[0]) + ny*(t5[1]-t0[1]) + nz*(t5[2]-t0[2])
		if(len0*len1<0){
			Vec3.sub(bV1,t4,t3)
			Vec3.mult(bV1,bV1,len0/(len0-len1))
			Vec3.add(ipos,bV1,t3)

			Vec3.sub(bV1,ipos,t0)
			if(Vec3.dot(bV1,bV3)<0
			&& Vec3.dot(bV1,bV5)<0){
				Vec3.sub(bV1,ipos,t1)
				if(Vec3.dot(bV1,bV4)<0){
					flg|=8
					if(flg&7)return flg
					ipos=iPoint2
				}
			}
		}
		
		if(len1*len2<0){
			Vec3.sub(bV1,t5,t4)
			Vec3.mult(bV1,bV1,len1/(len1-len2))
			Vec3.add(ipos,bV1,t4)

			Vec3.sub(bV1,ipos,t0)
			if(Vec3.dot(bV1,bV3)<0
			&& Vec3.dot(bV1,bV5)<0){
				Vec3.sub(bV1,ipos,t1)
				if(Vec3.dot(bV1,bV4)<0){
					flg|=16
					if(flg&15)return flg
					ipos=iPoint2
				}
			}
		}

		if(len2*len0<0){
			Vec3.sub(bV1,t3,t5)
			Vec3.mult(bV1,bV1,len2/(len2-len0))
			Vec3.add(ipos,bV1,t5)

			Vec3.sub(bV1,ipos,t0)
			if(Vec3.dot(bV1,bV3)<0
			&& Vec3.dot(bV1,bV5)<0){
				Vec3.sub(bV1,ipos,t1)
				if(Vec3.dot(bV1,bV4)<0){
					flg|=32
					return flg
				}
			}
		}
		return 0
	}
	ret.T2T_EX=function(flg,t0,t1,t2,t3,t4,t5){
		var len0,len1,len2
		var nx,ny,nz
		var flg,flg2,flg3
		var L0,L1,L2,L3
		var corner,edge0,edge1

		
		if(flg){
			if(!(flg&56) || !(flg&7)){
				if(flg&7){
					switch(flg){
					case 3:
						L0=t1
						break
					case 6:
						L0=t2
						break
					case 5:
						L0=t0
						break
					}
					corner=t3
					Vec3.sub(bV1,t4,corner)
					Vec3.sub(bV2,t5,corner)
				}else{
					switch(flg){
					case 24:
						L0=t4
						break
					case 48:
						L0=t5
						break
					case 40:
						L0=t3
						break
					}
					corner=t0
					Vec3.sub(bV1,t1,corner)
					Vec3.sub(bV2,t2,corner)
				}
				nx=bV1[1]*bV2[2]-bV1[2]*bV2[1]
				ny=bV1[2]*bV2[0]-bV1[0]*bV2[2]
				nz=bV1[0]*bV2[1]-bV1[1]*bV2[0]

				sPoint[0]=L0[0]
				sPoint[1]=L0[1]
				sPoint[2]=L0[2]
				len0=(nx*(corner[0]-sPoint[0]) + ny*(corner[1]-sPoint[1]) + nz*(corner[2]-sPoint[2]))
					/(nx*nx + ny*ny + nz*nz)
					
				sPoint2[0]=sPoint[0]+nx*len0
				sPoint2[1]=sPoint[1]+ny*len0
				sPoint2[2]=sPoint[2]+nz*len0
				
			}else{
				switch(flg&7){
				case 1:
					L0=t0
					L1=t1
					break
				case 2:
					L0=t1
					L1=t2
					break
				case 4:
					L0=t2
					L1=t0
					break
				}
				switch(flg&56){
				case 8:
					L2=t3
					L3=t4
					break
				case 16:
					L2=t4
					L3=t5
					break
				case 32:
					L2=t5
					L3=t3
					break
				}

				Vec3.sub(bV0,L1,L0)
				Vec3.sub(bV1,L3,L2)
				Vec3.cross(bV2,bV1,bV0)
				nx=bV2[1]*bV1[2]-bV2[2]*bV1[1]
				ny=bV2[2]*bV1[0]-bV2[0]*bV1[2]
				nz=bV2[0]*bV1[1]-bV2[1]*bV1[0]
				
				len2=nx*L2[0] + ny*L2[1] + nz*L2[2]
				len0=nx*L0[0] + ny*L0[1] + nz*L0[2] - len2
				len1=nx*L1[0] + ny*L1[1] + nz*L1[2] - len2
				
				len0 /= len0-len1
				sPoint[0] = L0[0]+bV0[0]*len0
				sPoint[1] = L0[1]+bV0[1]*len0
				sPoint[2] = L0[2]+bV0[2]*len0
				
				nx=bV2[0]
				ny=bV2[1]
				nz=bV2[2]
				Vec3.sub(bV0,L2,sPoint)
				
				len0 = ((L2[0]-sPoint[0])*nx + (L2[1]-sPoint[1])*ny + (L2[2]-sPoint[2])*nz)
					/(nx*nx + ny*ny + nz*nz)
			
				sPoint2[0] = sPoint[0] + nx*len0 
				sPoint2[1] = sPoint[1] + ny*len0 
				sPoint2[2] = sPoint[2] + nz*len0

			}
			return
		}
	
		Vec3.sub(bV3,t1,t0)
		Vec3.sub(bV4,t2,t0)
		Vec3.cross(bV0,bV3,bV4)
		nx=bV0[0]
		ny=bV0[1]
		nz=bV0[2]
		
		len0= (t3[0]-t0[0])*nx + (t3[1]-t0[1])*ny +(t3[2]-t0[2])*nz 
		len1= (t4[0]-t0[0])*nx + (t4[1]-t0[1])*ny +(t4[2]-t0[2])*nz 
		len2= (t5[0]-t0[0])*nx + (t5[1]-t0[1])*ny +(t5[2]-t0[2])*nz 

		Vec3.cross(bV3,bV3,bV0)
		Vec3.cross(bV5,bV0,bV4)

		if(len0*len1>=0 && len1*len2>=0 && len2*len0>=0){
			if(len0*len0<len1*len1){
				if(len0*len0<len2*len2)L0=t3
				else L0=t5
			}else{
				if(len1*len1<len2*len2) L0=t4
				else L0=t5
			}
		}else{
			if(len0*len1<0){
				Vec3.sub(bV1,t4,t3)
				len0/=len0-len1
			}else if(len0*len2<0){
				Vec3.sub(bV1,t5,t3)
				len0/=len0-len2
			}
			bV1[0] = t3[0] + bV1[0]*len0
			bV1[1] = t3[1] + bV1[1]*len0
			bV1[2] = t3[2] + bV1[2]*len0
			L0=bV1
		}
		Vec3.sub(bV1,L0,t0)
		flg = (Vec3.dot(bV3,bV1)>0) | (Vec3.dot(bV5,bV1)>0)<<2
		if(flg!=5){
			Vec3.sub(bV1,L0,t1)
			Vec3.sub(bV4,t2,t1)
			Vec3.cross(bV4,bV4,bV0)
			flg |=(Vec3.dot(bV4,bV1)>0)<<1
		}
		switch(flg){
		case 0:
			sPoint[0]=L0[0]
			sPoint[1]=L0[1]
			sPoint[2]=L0[2]
			len0= ((t0[0]-sPoint[0])*nx + (t0[1]-sPoint[1])*ny + (t0[2]-sPoint[2])*nz)
				/ (nx*nx + ny*ny + nz*nz)
			sPoint2[0]=sPoint[0] + nx*len0
			sPoint2[1]=sPoint[1] + ny*len0
			sPoint2[2]=sPoint[2] + nz*len0
			return
		case 1:
			this.L2T(t0,t1,t3,t4,t5)
			return
		case 2:
			this.L2T(t1,t2,t3,t4,t5)
			return
		case 4:
			this.L2T(t2,t0,t3,t4,t5)
			return
		case 3:
			corner=t1
			edge0=t0
			edge1=t2
			break
		case 6:
			corner=t2
			edge0=t1
			edge1=t0
			break
		case 5:
			corner=t0
			edge0=t2
			edge1=t1
			break
		}
		
		Vec3.sub(bV1,t4,t3)
		Vec3.sub(bV2,t5,t3)
		nx=bV1[1]*bV2[2]-bV1[2]*bV2[1]
		ny=bV1[2]*bV2[0]-bV1[0]*bV2[2]
		nz=bV1[0]*bV2[1]-bV1[1]*bV2[0]
		
		Vec3.sub(bV0,t3,corner)
		Vec3.sub(bV1,t4,corner)
		Vec3.sub(bV2,t5,corner)
		
		Vec3.cross(bV4,bV0,bV1)
		len0=bV4[0]*nx + bV4[1]*ny + bV4[2]*nz
		Vec3.cross(bV4,bV1,bV2)
		len1=bV4[0]*nx + bV4[1]*ny + bV4[2]*nz
		Vec3.cross(bV4,bV2,bV0)
		len2=bV4[0]*nx + bV4[1]*ny + bV4[2]*nz
		
		Vec3.sub(bV4,edge0,corner)
		Vec3.sub(bV5,edge1,corner)
		if(len0>0 && len1>0 && len2>0){
			if(bV0[0]*nx + bV0[1]*ny + bV0[2]*nz <0){
				nx*=-1
				ny*=-1
				nz*=-1
			}
			flg2 = (bV4[0]*nx+bV4[1]*ny+bV4[2]*nz >0) | (bV5[0]*nx+bV5[1]*ny+bV5[2]*nz >0) <<1 
		}else{
			if(len0<0){
				L0 = bV0
				L1 = bV1
			}else if(len1<0){
				L0 = bV1
				L1 = bV2
			}else{
				L0 = bV2
				L1 = bV0
			}
			flg2 = (Vec3.dot(bV4,L0)>0) | (Vec3.dot(bV5,L0)>0)<<1
			flg3 = (Vec3.dot(bV4,L1)>0) | (Vec3.dot(bV5,L1)>0)<<1
			if((flg2^flg3)==3){
				nx=L1[0]-L0[0]
				ny=L1[1]-L0[1]
				nz=L1[2]-L0[2]
				len0=(L0[0]*nx + L0[1]*ny + L0[2]*nz)
				/ (nx*nx + ny*ny + nz*nz)
				nx = L0[0] - nx*len0
				ny = L0[1] - ny*len0
				nz = L0[2] - nz*len0
	
				flg2 = (bV4[0]*nx+bV4[1]*ny+bV4[2]*nz >0) | (bV5[0]*nx+bV5[1]*ny+bV5[2]*nz >0)<<1 

			}else{
				flg2 = (flg2&flg3)?(flg2&flg3):(flg2|flg3)
			}
			
		}
		switch(flg2){
		case 0:
			this.P2T(corner,t3,t4,t5)
			break
		case 1:
			this.L2T(corner,edge0,t3,t4,t5)
			break
		case 2:
			this.L2T(corner,edge1,t3,t4,t5)
			break
		}
		
	}



	ret.PointEllipseTrue_before=function(a,b){
		daen_a=a
		daen_b=b
		daen_flg=0
		if(a>b){
			daen_a=b
			daen_b=a
			daen_flg=1
		}
		a=daen_a
		b=daen_b

		var a2=a*a
		,b2=b*b
		,sub=1/(b2-a2)
		,sub2=sub*sub
		pk1=-a2
		pk2=-1/2*a2*a2*sub2
		pk3=a2*b2*sub2
		qk1=-a2*a2*sub
		qk2=-a2*a2*b2*sub2*sub
		rk1=-1/4*a2*a2*a2*sub2
		rk2=1/4*a2*a2*a2*b2*sub2*sub2
		rk3=1/16*a2*a2*a2*a2*sub2*sub2
		B3= a2*sub/2
	}
	ret.PointEllipseTrue=function(x,y){
		var a,b
		a=daen_a
		b=daen_b
		if(daen_flg){
			c=x
			x=y
			y=c
		}
		var
		x2=x*x
		,y2=y*y
		,p= pk1+ pk2*x2 +pk3*y2
		,q= qk1*x +qk2*y2*x
		,r= rk1*x2 +rk2*y2*x2 + rk3*x2*x2
		,D2=p*2/3
		,P=-4*r-p*p/3
		,Q=-q*q-p*p*p*2/27+r*p*8/3

		var y3=0,bbb
		var flg=(Q*Q/4)+(P*P*P/27)
		if(flg<0){
			var AA
			AA=Math.sqrt(-P/3)
			
	
			var rad = -Q/(AA*AA*AA*2)
			rad=(1/3)*Math.acos(rad)
	
			y3=2*AA*Math.cos(rad)
		}else{
			flg=Math.sqrt((Q*Q/4)+(P*P*P/27))
			bbb=-Q/2+flg
			
			if(bbb<0)
				y3-=Math.pow(-bbb,1/3)
			else
				y3+=Math.pow(bbb,1/3)
	
			bbb=-Q/2-flg
			
			if(bbb<0)
				y3-=Math.pow(-bbb,1/3)
			else
				y3+=Math.pow(bbb,1/3)
		}
		y3=y3-D2
		var c1,c0,d1,d0
		
		c1=Math.sqrt(y3)
		
		d1=-c1
		c0=(c1*c1*c1+p*c1-q)/(2*c1)
		d0=r/c0
		sPoint[0]=-x
		flg=(c1*c1)-4*c0
		if(flg>=0){
			flg=Math.sqrt(flg)
			if(sPoint[0]*x<0)
				sPoint[0]=(-c1-flg)/2-B3*x
			if(sPoint[0]*x<0)
				sPoint[0]=(-c1+flg)/2-B3*x
		}

		flg=(d1*d1)-4*d0
		if((d1*d1)-4*d0>=0){
			flg=Math.sqrt(flg)
			if(sPoint[0]*x<0)
				sPoint[0]=(-d1-flg)/2-B3*x
			if(sPoint[0]*x<0)
				sPoint[0]=(-d1+flg)/2-B3*x
		}
		sPoint[1]=-b*Math.sqrt(1-(sPoint[0]*sPoint[0])/(a*a))
		if(sPoint[1]*y<0){
			sPoint[1]*=-1
		}
		if(daen_flg){
			var c=sPoint[1]
			sPoint[1]=sPoint[0]
			sPoint[0]=c
		}
		
		sPoint2[1]=sPoint[1]
		sPoint2[0]=sPoint[0]
		sPoint[0]=x
		sPoint[1]=y
	}
	ret.PointEllipse=function(sx,sy,a,b,num){

		var
		x,y
		,a2=a*a
		,b2=b*b
		,sxb2=sx*b2
		,sya2=sy*a2
		,i
		,A,B,C
		,t

		if(!num)num=PE_NUM
		x=sx*b2*b2
		y=sy*a2*a2
		
		C = sx*sx*b2 + sy*sy*a2 - a2*b2

		for(i=num;i--;){
			x=b2*x
			y=a2*y

			A = x*x*b2+y*y*a2
			B = x*sxb2+y*sya2
			t=(-B+Math.sqrt(B*B-A*C))/A
			x=t*x+sx
			y=t*y+sy
		}
		sPoint[0]=sx
		sPoint[1]=sy
		sPoint2[0]=x
		sPoint2[1]=y

	}
	ret.PointEllipsolid=function(sx,sy,sz,a,b,c){

		var
		x,y,z
		,a2=a*a
		,b2=b*b
		,c2=c*c
		,b2c2=b2*c2
		,a2c2=a2*c2
		,a2b2=a2*b2
		,sxb2c2=sx*b2c2
		,sya2c2=sy*a2c2
		,sza2b2=sz*a2b2
		,i
		,A,B,C
		,t

		x=sx*b2c2
		y=sy*a2c2
		z=sz*a2b2
		
		C = sx*sxb2c2 + sy*sya2c2 + sz*sza2b2 - a2b2*c2

		for(i=PE_NUM;i--;){
			x=x*b2c2
			y=y*a2c2
			z=z*a2b2

			A = x*x*b2c2 + y*y*a2c2 + z*z*a2b2
			B = x*sxb2c2 + y*sya2c2 + z*sza2b2
			t=(-B+Math.sqrt(B*B-A*C))/A
			x=t*x+sx
			y=t*y+sy
			z=t*z+sz
		}
		sPoint[0]=sx
		sPoint[1]=sy
		sPoint[2]=sz
		sPoint2[0]=x
		sPoint2[1]=y
		sPoint2[2]=z

	}
	return ret
})()
