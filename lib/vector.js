"use strict"
var Vec2=(function(){
	
	var Vec2=function(){
		this[0]=0.0
		this[1]=0.0
	}
	Vec2.scalar=function(a){
		return Math.sqrt(a[0]*a[0] + a[1]*a[1]);
	}
	Vec2.set=function(a,x,y){
		a[0]=x
		a[1]=y
	}
	Vec2.add=function(a,b,c){
		a[0] = b[0] + c[0]
		a[1] = b[1] + c[1]
	}
	Vec2.sub=function(a,b,c){
		a[0] = b[0] - c[0]
		a[1] = b[1] - c[1]
	}
	Vec2.mult=function(a,b,c){
		a[0]=b[0]*c
		a[1]=b[1]*c
	}
	Vec2.mul=function(a,b,c){
		a[0]=b[0]*c
		a[1]=b[1]*c
	}
	Vec2.len = function(a){
		return Math.sqrt(a[0]*a[0]+a[1]*a[1])
	}
	Vec2.nrm=function(a,b){
		var l = Math.sqrt(b[0]*b[0] + b[1]*b[1])
		
		l= 1/l
		if(!isFinite(l))return
		
		a[0] *=l
		a[1] *=l
	}
	Vec2.norm=function(a){
		var l = Math.sqrt(a[0]*a[0] + a[1]*a[1])
		
		l= 1/l
		if(!isFinite(l))return
		
		a[0] *=l
		a[1] *=l
	}
	Vec2.dot=function(a,b){
		return a[0]*b[0] + a[1]*b[1]
	}
	Vec2.cross=function(a,b){
		return a[0]*b[1] - a[1]*b[0]
	}
	return Vec2
})()

var Vec3=(function(){
	var buf0=0.0,buf1=0.0,buf2=0.0
	var ret=function(){
		this[0]=0.0
		this[1]=0.0
		this[2]=0.0
		this.length=3;
	}
	ret.set=function(a,x,y,z){
		a[0]=x
		a[1]=y
		a[2]=z
	}
	ret.copy=function(a,b){
		a[0]=b[0]
		a[1]=b[1]
		a[2]=b[2]
	}

	ret.add=function(a,b,c){
		a[0] = b[0] + c[0]
		a[1] = b[1] + c[1]
		a[2] = b[2] + c[2]
	}

	ret.sub=function(a,b,c){
		a[0] = b[0] - c[0]
		a[1] = b[1] - c[1]
		a[2] = b[2] - c[2]
	}
	ret.copy=function(a,b){
		a[0] = b[0]
		a[1] = b[1]
		a[2] = b[2]
	}
	ret.mult=function(a,b,c){
		a[0]=b[0]*c
		a[1]=b[1]*c
		a[2]=b[2]*c
	}
	ret.mul=function(a,b,c){
		a[0]=b[0]*c
		a[1]=b[1]*c
		a[2]=b[2]*c
	}
	ret.muladd=function(a,b,c,d){
		a[0]=b[0]+c[0]*d
		a[1]=b[1]+c[1]*d
		a[2]=b[2]+c[2]*d
	}
	ret.len=function(b,c){
		buf0 = b[0]-c[0]
		buf1 = b[1]-c[1]
		buf2 = b[2]-c[2]
		return Math.sqrt( buf0*buf0 + buf1*buf1 + buf2*buf2 )
	}
	ret.len2=function(b,c){
		buf0 = b[0]-c[0]
		buf1 = b[1]-c[1]
		buf2 = b[2]-c[2]
		return buf0*buf0 + buf1*buf1 + buf2*buf2
	}
	ret.scalar=function(a){
		return Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2])
	}
	ret.nrm=function(a,b){
		var l = Math.sqrt(b[0]*b[0] + b[1]*b[1] + b[2]*b[2])
		
		l= 1/l
		if(!isFinite(l))return
		
		a[0] =b[0]*l
		a[1] =b[1]*l
		a[2] =b[2]*l
	}
	ret.norm=function(a){
		var l = Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2])
		
		l= 1/l
		if(!isFinite(l))return
		
		a[0] *=l
		a[1] *=l
		a[2] *=l
	}
	ret.dot=function(a,b){
		return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
	}
	ret.cross=function(a,b,c){
		buf0 = b[1]*c[2] - b[2]*c[1]
		buf1 = b[2]*c[0] - b[0]*c[2]
		buf2 = b[0]*c[1] - b[1]*c[0]
		a[0] = buf0
		a[1] = buf1
		a[2] = buf2
	}
	return ret

})()
var Vec4=(function(){
	var buf0,buf1,buf2,buf3
	var x2,y2,z2,xy,yz,zx,xw,yw,zw
	var qr,ss,flag,sp,ph,pt,t1,t0
	var ret = function(){
		this[0]=0.0
		this[1]=0.0
		this[2]=0.0
		this[3]=1.0
	}
	ret.add=function(a,b,c){
		a[0] = b[0] + c[0]
		a[1] = b[1] + c[1]
		a[2] = b[2] + c[2]
		a[3] = b[3] + c[3]
	}

	ret.sub=function(a,b,c){
		a[0] = b[0] - c[0]
		a[1] = b[1] - c[1]
		a[2] = b[2] - c[2]
		a[3] = b[3] - c[3]
	}
	ret.mult=function(a,b,c){
		a[0]*=c
		a[1]*=c
		a[2]*=c
		a[3]*=c
		}
	ret.set=function(a,x,y,z,w){
		a[0] = x;
		a[1] = y;
		a[2] = z;
		a[3] = w;
	}
	ret.qdot=function(a,b,c){
		buf0 = b[0]*c[0] - b[1]*c[1] - b[2]*c[2] - b[3]* c[3]
		buf1 = b[0]*c[1] + c[0] + b[1] + b[2]*c[3] - b[3]*c[2]
		buf2 = b[0]*c[2] + c[0] + b[2] + b[3]*c[1] - b[1]*c[3]
		buf3 = b[0]*c[3] + c[0] + b[3] + b[1]*c[2] - b[2]*c[1]
		a[0] = buf0
		a[1] = buf1
		a[2] = buf2
		a[3] = buf3
	}
	//
	ret.qTOm=function(a,b){
		x2 = b[1] * b[1] * 2.0
		y2 = b[2] * b[2] * 2.0
		z2 = b[3] * b[3] * 2.0
		xy = b[1] * b[2] * 2.0
		yz = b[2] * b[3] * 2.0
		zx = b[3] * b[1] * 2.0
		xw = b[1] * b[0] * 2.0
		yw = b[2] * b[0] * 2.0
		zw = b[3] * b[0] * 2.0

		a[0] = 1.0 - y2 - z2
		a[1] = xy + zw
		a[2] = zx - yw
		a[4] = xy - zw
		a[5] = 1.0 - z2 - x2
		a[6] = yz + xw
		a[8] = zx + yw
		a[9] = yz - xw
		a[10] = 1.0 - x2 - y2
		//a[3] = a[7] = a[11] = 0.0
	}
	//
	ret.slerp=function(a,b,c,t){
		qr = b[0] * c[0] + b[1] * c[1] + b[2] * c[2] + b[3] * c[3]
		ss = 1.0 - qr * qr
		flag=0
		if(qr<0){
			flag=1
			qr*=-1
		}
		if (ss <= 0.0) {
			a[0] = b[0]
			a[1] = b[1]
			a[2] = b[2]
			a[3] = b[3]
		}
		else {
			sp = Math.sqrt(ss)
			ph = Math.acos(qr)
			pt = ph * t
			t1 = Math.sin(pt) / sp
			t0 = Math.sin(ph - pt) / sp
			if(flag)t1*=-1
			a[0] = b[0] * t0 + c[0] * t1
			a[1] = b[1] * t0 + c[1] * t1
			a[2] = b[2] * t0 + c[2] * t1
			a[3] = b[3] * t0 + c[3] * t1
		}
	}
	return ret
})()
var Mat43=(function(){
	var buf0,buf1,buf2,buf3,buf4,buf5,buf6,buf7,buf8
		,buf9,buf10,buf11,buf12,buf13,buf14,buf15
	var ret =function(){
		this[0]=1.0
		this[1]=0.0
		this[2]=0.0
		this[3]=0.0
		this[4]=0.0
		this[5]=1.0
		this[6]=0.0
		this[7]=0.0
		this[8]=0.0
		this[9]=0.0
		this[10]=1.0
		this[11]=0.0
		this[12]=0.0
		this[13]=0.0
		this[14]=0.0
		this[15]=1.0
	}
	var bM=new ret();
	ret.copy=function(a,b){
		a[0]=b[0]
		a[1]=b[1]
		a[2]=b[2]
		a[4]=b[4]
		a[5]=b[5]
		a[6]=b[6]
		a[8]=b[8]
		a[9]=b[9]
		a[10]=b[10]
		a[12]=b[12]
		a[13]=b[13]
		a[14]=b[14]
	}

	ret.set=function(obj,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15){
		obj[0]=a0
		obj[1]=a1
		obj[2]=a2
		obj[4]=a4
		obj[5]=a5
		obj[6]=a6
		obj[8]=a8
		obj[9]=a9
		obj[10]=a10
		obj[12]=a12
		obj[13]=a13
		obj[14]=a14
	}
	ret.setInit=function(obj){
		obj[0]=1.0
		obj[1]=0
		obj[2]=0
		obj[4]=0
		obj[5]=1.0
		obj[6]=0
		obj[8]=0
		obj[9]=0
		obj[10]=1.0
		obj[12]=0
		obj[13]=0
		obj[14]=0
	}
	ret.dotMat43Vec3=function(a,b,c){
		buf0 = c[0]
		buf1 = c[1]
		buf2 = c[2]
		a[0] = b[0]*buf0 + b[4]*buf1 + b[8]*buf2 +b[12]
		a[1] = b[1]*buf0 + b[5]*buf1 + b[9]*buf2 +b[13]
		a[2] = b[2]*buf0 + b[6]*buf1 + b[10]*buf2 +b[14]
	}
	ret.dotMat33Vec3=function(a,b,c){
		buf0 = c[0]
		buf1 = c[1]
		buf2 = c[2]
		a[0] = b[0]*buf0 + b[4]*buf1 + b[8]*buf2 
		a[1] = b[1]*buf0 + b[5]*buf1 + b[9]*buf2 
		a[2] = b[2]*buf0 + b[6]*buf1 + b[10]*buf2
	}
	var dot=ret.dot=function(a,b,c){
		if(a == c){
			buf0 = c[0]
			buf1 = c[1]
			buf2 = c[2]
			buf4 = c[4]
			buf5 = c[5]
			buf6 = c[6]
			buf8 = c[8]
			buf9 = c[9]
			buf10 = c[10]
			buf12 = c[12]
			buf13 = c[13]
			buf14 = c[14]

			a[0]=b[0]*buf0 + b[4]*buf1 + b[8]*buf2
			a[1]=b[1]*buf0 + b[5]*buf1 + b[9]*buf2
			a[2]=b[2]*buf0 + b[6]*buf1 + b[10]*buf2

			a[4]=b[0]*buf4 + b[4]*buf5 + b[8]*buf6
			a[5]=b[1]*buf4 + b[5]*buf5 + b[9]*buf6
			a[6]=b[2]*buf4 + b[6]*buf5 + b[10]*buf6

			a[8]=b[0]*buf8 + b[4]*buf9 + b[8]*buf10
			a[9]=b[1]*buf8 + b[5]*buf9 + b[9]*buf10
			a[10]=b[2]*buf8 + b[6]*buf9 + b[10]*buf10

			a[12]=b[0]*buf12 + b[4]*buf13 + b[8]*buf14 + b[12]
			a[13]=b[1]*buf12 + b[5]*buf13 + b[9]*buf14 + b[13]
			a[14]=b[2]*buf12 + b[6]*buf13 + b[10]*buf14 + b[14]
		}else{
			buf0 = b[0]
			buf1 = b[1]
			buf2 = b[2]
			buf4 = b[4]
			buf5 = b[5]
			buf6 = b[6]
			buf8 = b[8]
			buf9 = b[9]
			buf10 = b[10]

			a[0]=buf0*c[0] + buf4*c[1] + buf8*c[2]
			a[1]=buf1*c[0] + buf5*c[1] + buf9*c[2]
			a[2]=buf2*c[0] + buf6*c[1] + buf10*c[2]

			a[4]=buf0*c[4] + buf4*c[5] + buf8*c[6]
			a[5]=buf1*c[4] + buf5*c[5] + buf9*c[6]
			a[6]=buf2*c[4] + buf6*c[5] + buf10*c[6]

			a[8]=buf0*c[8] + buf4*c[9] + buf8*c[10]
			a[9]=buf1*c[8] + buf5*c[9] + buf9*c[10]
			a[10]=buf2*c[8] + buf6*c[9] + buf10*c[10]

			a[12]=buf0*c[12] + buf4*c[13] + buf8*c[14] + b[12]
			a[13]=buf1*c[12] + buf5*c[13] + buf9*c[14] + b[13]
			a[14]=buf2*c[12] + buf6*c[13] + buf10*c[14] + b[14]
		}

	}
	var getRotMat=ret.getRotMat=function(a,r,x,y,z){
		var SIN=Math.sin(r)
		var COS=Math.cos(r)
		a[0]=x*x*(1-COS)+COS;a[4]=x*y*(1-COS)-z*SIN;a[8]=z*x*(1-COS)+y*SIN;a[12]=0
		a[1]=x*y*(1-COS)+z*SIN;a[5]=y*y*(1-COS)+COS;a[9]=y*z*(1-COS)-x*SIN;a[13]=0
		a[2]=z*x*(1-COS)-y*SIN;a[6]=y*z*(1-COS)+x*SIN;a[10]=z*z*(1-COS)+COS;a[14]=0
	}
	ret.getRotVector=function(target,angle){
		var dx=angle[0]
		var dy=angle[1]
		var dz=angle[2]
		var ax=Math.atan2(dy,dz)+Math.PI;
		var ay=Math.atan2(dx,dz);
		var az=0;
		getRotMat(target,-az,0,0,1);
		getRotMat(bM,-ax,1,0,0);
		dot(target,target,bM);
		getRotMat(bM,-ay,0,1,0);
		dot(target,target,bM);
	}
	ret.scale=function(a,x,y,z){
		a[0]*=x; a[1]*=x; a[2]*=x;
		a[4]*=y; a[5]*=y; a[6]*=y;
		a[8]*=z; a[9]*=z; a[10]*=z;
	}

	ret.getInv=function(a,b){
		var det = b[0] * b [5] * b[10] 
			+ b[4] * b[9] * b[2] 
			+ b[8] * b[1] * b[6]
			- b[0] * b[9] * b[6]
			- b[4] * b[1] * b[10]
			- b[8] * b[5] * b[2]
		if(Math.abs(det) < 0.0001){
			return
		}
		det = 1/det

		buf0=b[0]
		buf1=b[1]
		buf2=b[2]
		buf4=b[4]
		buf5=b[5]
		buf6=b[6]
		buf8=b[8]
		buf9=b[9]
		buf10=b[10]
		buf12=b[12]
		buf13=b[13]
		buf14=b[14]


		a[0]= (buf5*buf10 - buf9*buf6) * det
		a[1]= (buf2*buf9 - buf1*buf10) * det
		a[2]= (buf1*buf6 - buf5*buf2) * det
		a[4]= (buf8*buf6 - buf4*buf10) * det
		a[5]= (buf0*buf10 - buf8*buf2) * det
		a[6]= (buf4*buf2 - buf0*buf6) * det
		a[8]= (buf4*buf9 - buf5*buf8) * det
		a[9]= (buf8*buf1 - buf0*buf9) * det
		a[10]= (buf0*buf5 - buf4*buf1) * det
		a[12]= (buf4*buf13*buf10 + buf8*buf5*buf14 + buf12*buf9*buf6 - buf4*buf9*buf14 - buf8*buf13*buf6 - buf12*buf5*buf10) * det
		a[13]= (buf0*buf9*buf14 + buf8*buf13*buf2 + buf12*buf1*buf10 - buf0*buf13*buf10 - buf8*buf1*buf14 - buf12*buf9*buf2) * det
		a[14]= (buf0*buf13*buf6 + buf4*buf1*buf14 + buf12*buf5*buf2 - buf0*buf5*buf14 - buf4*buf13*buf2 - buf12*buf1*buf6) * det

	} 

	return ret

})()

var Mat44=(function(){
	var buf0,buf1,buf2,buf3,buf4,buf5,buf6,buf7,buf8
		,buf9,buf10,buf11,buf12,buf13,buf14,buf15
	var ret =function(){
		this[0]=1.0
		this[1]=0.0
		this[2]=0.0
		this[3]=0.0
		this[4]=0.0
		this[5]=1.0
		this[6]=0.0
		this[7]=0.0
		this[8]=0.0
		this[9]=0.0
		this[10]=1.0
		this[11]=0.0
		this[12]=0.0
		this[13]=0.0
		this[14]=0.0
		this[15]=1.0
	}
	ret.set=function(obj,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15){
		obj[0]=a0
		obj[1]=a1
		obj[2]=a2
		obj[3]=a3
		obj[4]=a4
		obj[5]=a5
		obj[6]=a6
		obj[7]=a7
		obj[8]=a8
		obj[9]=a9
		obj[10]=a10
		obj[11]=a11
		obj[12]=a12
		obj[13]=a13
		obj[14]=a14
		obj[15]=a15
	}
	ret.copy=function(a,b){
		a[0]=b[0]
		a[1]=b[1]
		a[2]=b[2]
		a[3]=b[3]
		a[4]=b[4]
		a[5]=b[5]
		a[6]=b[6]
		a[7]=b[7]
		a[8]=b[8]
		a[9]=b[9]
		a[10]=b[10]
		a[11]=b[11]
		a[12]=b[12]
		a[13]=b[13]
		a[14]=b[14]
		a[15]=b[15]
	}

	ret.dotMat44Vec4=function(a,b,c){
		buf0 = c[0]
		buf1 = c[1]
		buf2 = c[2]
		buf3 = c[3]
		a[0] = b[0]*buf0 + b[4]*buf1 + b[8]*buf2 +b[12]*buf3
		a[1] = b[1]*buf0 + b[5]*buf1 + b[9]*buf2 +b[13]*buf3
		a[2] = b[2]*buf0 + b[6]*buf1 + b[10]*buf2 +b[14]*buf3
		a[3] = b[3]*buf0 + b[7]*buf1 + b[11]*buf2 +b[14]*buf3
	}
	ret.dotMat44Mat43=function(a,b,c){
			buf0 = b[0]
			buf1 = b[1]
			buf2 = b[2]
			buf3 = b[3]
			buf4 = b[4]
			buf5 = b[5]
			buf6 = b[6]
			buf7 = b[7]
			buf8 = b[8]
			buf9 = b[9]
			buf10 = b[10]
			buf11 = b[11]
			buf12 = b[12]
			buf13 = b[13]
			buf14 = b[14]
			buf15 = b[15]

			a[0]=buf0*c[0] + buf4*c[1] + buf8*c[2]
			a[1]=buf1*c[0] + buf5*c[1] + buf9*c[2]
			a[2]=buf2*c[0] + buf6*c[1] + buf10*c[2]
			a[3]=buf3*c[0] + buf7*c[1] + buf11*c[2]

			a[4]=buf0*c[4] + buf4*c[5] + buf8*c[6]
			a[5]=buf1*c[4] + buf5*c[5] + buf9*c[6]
			a[6]=buf2*c[4] + buf6*c[5] + buf10*c[6]
			a[7]=buf3*c[4] + buf7*c[5] + buf11*c[6]

			a[8]=buf0*c[8] + buf4*c[9] + buf8*c[10]
			a[9]=buf1*c[8] + buf5*c[9] + buf9*c[10]
			a[10]=buf2*c[8] + buf6*c[9] + buf10*c[10]
			a[11]=buf3*c[8] + buf7*c[9] + buf11*c[10]

			a[12]=buf0*c[12] + buf4*c[13] + buf8*c[14] + b[12]
			a[13]=buf1*c[12] + buf5*c[13] + buf9*c[14] + b[13]
			a[14]=buf2*c[12] + buf6*c[13] + buf10*c[14] + b[14]
			a[15]=buf3*c[12] + buf7*c[13] + buf11*c[14] + b[15]
	}
	ret.dot=function(a,b,c){
			if(a == b){
				buf0 = b[0]
				buf1 = b[1]
				buf2 = b[2]
				buf3 = b[3]
				buf4 = b[4]
				buf5 = b[5]
				buf6 = b[6]
				buf7 = b[7]
				buf8 = b[8]
				buf9 = b[9]
				buf10 = b[10]
				buf11 = b[11]
				buf12 = b[12]
				buf13 = b[13]
				buf14 = b[14]
				buf15 = b[15]

				a[0]=buf0*c[0] + buf4*c[1] + buf8*c[2] + buf12*c[3]
				a[1]=buf1*c[0] + buf5*c[1] + buf9*c[2] + buf13*c[3]
				a[2]=buf2*c[0] + buf6*c[1] + buf10*c[2] + buf14*c[3]
				a[3]=buf3*c[0] + buf7*c[1] + buf11*c[2] + buf15*c[3]

				a[4]=buf0*c[4] + buf4*c[5] + buf8*c[6] + buf12*c[7]
				a[5]=buf1*c[4] + buf5*c[5] + buf9*c[6] + buf13*c[7]
				a[6]=buf2*c[4] + buf6*c[5] + buf10*c[6] + buf14*c[7]
				a[7]=buf3*c[4] + buf7*c[5] + buf11*c[6] + buf15*c[7]

				a[8]=buf0*c[8] + buf4*c[9] + buf8*c[10] + buf12*c[11]
				a[9]=buf1*c[8] + buf5*c[9] + buf9*c[10] + buf13*c[11]
				a[10]=buf2*c[8] + buf6*c[9] + buf10*c[10] + buf14*c[11]
				a[11]=buf3*c[8] + buf7*c[9] + buf11*c[10] + buf15*c[11]

				a[12]=buf0*c[12] + buf4*c[13] + buf8*c[14] + buf12*c[15]
				a[13]=buf1*c[12] + buf5*c[13] + buf9*c[14] + buf13*c[15]
				a[14]=buf2*c[12] + buf6*c[13] + buf10*c[14] + buf14*c[15]
				a[15]=buf3*c[12] + buf7*c[13] + buf11*c[14] + buf15*c[15]
			}else{
				buf0 = c[0]
				buf1 = c[1]
				buf2 = c[2]
				buf3 = c[3]
				buf4 = c[4]
				buf5 = c[5]
				buf6 = c[6]
				buf7 = c[7]
				buf8 = c[8]
				buf9 = c[9]
				buf10 = c[10]
				buf11 = c[11]
				buf12 = c[12]
				buf13 = c[13]
				buf14 = c[14]
				buf15 = c[15]

				a[0]=b[0]*buf0+ b[4]*buf1+ b[8]*buf2+ b[12]*buf3
				a[1]=b[1]*buf0+ b[5]*buf1+ b[9]*buf2+ b[13]*buf3
				a[2]=b[2]*buf0+ b[6]*buf1+ b[10]*buf2+ b[14]*buf3
				a[3]=b[3]*buf0+ b[7]*buf1+ b[11]*buf2+ b[15]*buf3

				a[4]=b[0]*buf4+ b[4]*buf5+ b[8]*buf6+ b[12]*buf7
				a[5]=b[1]*buf4+ b[5]*buf5+ b[9]*buf6+ b[13]*buf7
				a[6]=b[2]*buf4+ b[6]*buf5+ b[10]*buf6+ b[14]*buf7
				a[7]=b[3]*buf4+ b[7]*buf5+ b[11]*buf6+ b[15]*buf7

				a[8]=b[0]*buf8+ b[4]*buf9+ b[8]*buf10+ b[12]*buf11
				a[9]=b[1]*buf8+ b[5]*buf9+ b[9]*buf10+ b[13]*buf11
				a[10]=b[2]*buf8+ b[6]*buf9+ b[10]*buf10+ b[14]*buf11
				a[11]=b[3]*buf8+ b[7]*buf9+ b[11]*buf10+ b[15]*buf11

				a[12]=b[0]*buf12+ b[4]*buf13+ b[8]*buf14+ b[12]*buf15
				a[13]=b[1]*buf12+ b[5]*buf13+ b[9]*buf14+ b[13]*buf15
				a[14]=b[2]*buf12+ b[6]*buf13+ b[10]*buf14+ b[14]*buf15
				a[15]=b[3]*buf12+ b[7]*buf13+ b[11]*buf14+ b[15]*buf15
			}
	}
	ret.getInv=function(a,b){
		var det =
			 b[0]*b[5]*b[10]*b[15]+b[0]*b[9]*b[14]*b[7]+b[0]*b[13]*b[6]*b[11]
			+b[4]*b[1]*b[14]*b[11]+b[4]*b[9]*b[2]*b[15]+b[4]*b[13]*b[10]*b[3]
			+b[8]*b[1]*b[6]*b[15]+b[8]*b[5]*b[14]*b[3]+b[8]*b[13]*b[2]*b[7]
			+b[12]*b[1]*b[10]*b[7]+b[12]*b[5]*b[2]*b[11]+b[12]*b[9]*b[6]*b[3]
			-b[0]*b[5]*b[14]*b[11]-b[0]*b[9]*b[6]*b[15]-b[0]*b[13]*b[10]*b[7]
			-b[4]*b[1]*b[10]*b[15]-b[4]*b[9]*b[14]*b[3]-b[4]*b[13]*b[2]*b[11]
			-b[8]*b[1]*b[14]*b[7]-b[8]*b[5]*b[2]*b[15]-b[8]*b[13]*b[6]*b[3]
			-b[12]*b[1]*b[6]*b[11]-b[12]*b[5]*b[10]*b[3]-b[12]*b[9]*b[2]*b[7]
		if(Math.abs(det) < 0.0001){
			return
		}
		det = 1/det

		buf0=b[0]*det
		buf1=b[1]*det
		buf2=b[2]*det
		buf3=b[3]*det
		buf4=b[4]*det
		buf5=b[5]*det
		buf6=b[6]*det
		buf7=b[7]*det
		buf8=b[8]*det
		buf9=b[9]*det
		buf10=b[10]*det
		buf11=b[11]*det
		buf12=b[12]*det
		buf13=b[13]*det
		buf14=b[14]*det
		buf15=b[15]*det

		a[0]=buf5*buf10*buf15+buf9*buf14*buf7+buf13*buf6*buf11-buf5*buf14*buf11-buf9*buf6*buf15-buf13*buf10*buf7
		a[4]=buf4*buf14*buf11+buf8*buf6*buf15+buf12*buf10*buf7-buf4*buf10*buf15-buf8*buf14*buf7-buf12*buf6*buf11
		a[8]=buf4*buf9*buf15+buf8*buf13*buf7+buf12*buf5*buf11-buf4*buf13*buf11-buf8*buf5*buf15-buf12*buf9*buf7
		a[12]=buf4*buf13*buf10+buf8*buf5*buf14+buf12*buf9*buf6-buf4*buf9*buf14-buf8*buf13*buf6-buf12*buf5*buf10
		a[1]=buf1*buf14*buf11+buf9*buf2*buf15+buf13*buf10*buf3-buf1*buf10*buf15-buf9*buf14*buf3-buf13*buf2*buf11
		a[5]=buf0*buf10*buf15+buf8*buf14*buf3+buf12*buf2*buf11-buf0*buf14*buf11-buf8*buf2*buf15-buf12*buf10*buf3
		a[9]=buf0*buf13*buf11+buf8*buf1*buf15+buf12*buf9*buf3-buf0*buf9*buf15-buf8*buf13*buf3-buf12*buf1*buf11
		a[13]=buf0*buf9*buf14+buf8*buf13*buf2+buf12*buf1*buf10-buf0*buf13*buf10-buf8*buf1*buf14-buf12*buf9*buf2
		a[2]=buf1*buf6*buf15+buf5*buf14*buf3+buf13*buf2*buf7-buf1*buf14*buf7-buf5*buf2*buf15-buf13*buf6*buf3
		a[6]=buf0*buf14*buf7+buf4*buf2*buf15+buf12*buf6*buf3-buf0*buf6*buf15-buf4*buf14*buf3-buf12*buf2*buf7
		a[10]=buf0*buf5*buf15+buf4*buf13*buf3+buf12*buf1*buf7-buf0*buf13*buf7-buf4*buf1*buf15-buf12*buf5*buf3
		a[14]=buf0*buf13*buf6+buf4*buf1*buf14+buf12*buf5*buf2-buf0*buf5*buf14-buf4*buf13*buf2-buf12*buf1*buf6
		a[3]=buf1*buf10*buf7+buf5*buf2*buf11+buf9*buf6*buf3-buf1*buf6*buf11-buf5*buf10*buf3-buf9*buf2*buf7
		a[7]=buf0*buf6*buf11+buf4*buf10*buf3+buf8*buf2*buf7-buf0*buf10*buf7-buf4*buf2*buf11-buf8*buf6*buf3
		a[11]=buf0*buf9*buf7+buf4*buf1*buf11+buf8*buf5*buf3-buf0*buf5*buf11-buf4*buf9*buf3-buf8*buf1*buf7
		a[15]=buf0*buf5*buf10+buf12*buf9*buf2+buf8*buf1*buf6-buf0*buf9*buf6-buf12*buf1*buf10-buf8*buf5*buf2
	} 
	return ret;
})();
