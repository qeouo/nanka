"use strict"
var Geono= (function(){
	var cross=new Vec3()
	,closestA=new Vec3()
	,closestB=new Vec3()

	,Z_VECTOR = [0,0,1]
	,Z_VECTOR_NEG = [0,0,-1]
	,ZERO_VECTOR = [0,0,0]
	
	var bV0 = new Vec3()
	,bV1 = new Vec3()
	,bV2 = new Vec3()
	,bV3 = new Vec3()
	,bV4 = new Vec3()
	,bV5 = new Vec3()

	var ret=function(){}

	ret.Z_VECTOR= Z_VECTOR
	ret.Z_VECTOR_NEG= Z_VECTOR_NEG
	ret.ZERO_VECTOR= ZERO_VECTOR
	ret.cross=cross;
	ret.closestA=closestA;
	ret.closestB=closestB;

	var pointPoint=ret.pointPoint=function(ax,ay,az,bx,by,bz){
		closestA[0]=ax;
		closestA[1]=ay;
		closestA[2]=az;

		closestB[0]=bx;
		closestB[1]=by;
		closestB[2]=bz;
	}
	var linePoint=ret.linePoint=function(a0x,a0y,a0z,a1x,a1y,a1z,bx,by,bz){
		closestB[0]=bx;
		closestB[1]=by;
		closestB[2]=bz;

		var vx=a1x-a0x;
		var vy=a1y-a0y;
		var vz=a1z-a0z;
		var dx=bx-a0x;
		var dy=by-a0y;
		var dz=bz-a0z;
		var l=vx*dx + vy*dy + vz*dz;
		var s=vx*vx + vy*vy + vz*vz;
		if(l<0){
			closestA[0] = a0x;
			closestA[1] = a0y;
			closestA[2] = a0z;
		}else if(l-s<0){
			closestA[0] = a1x;
			closestA[1] = a1y;
			closestA[2] = a1z;
		}else{
			l = l/s;
			closestA[0]=a0x+vx*l;
			closestA[1]=a0y+vy*l;
			closestA[2]=a0z+vz*l;
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
	return ret
})()
