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


	ret.LINE_POINT = function(a1,a2,l1,l2,p1){
		var dir = new Vec3();
		var dpos = new Vec3();
		Vec3.sub(dir,l2,l1); //線分の向き
		Vec3.sub(dpos,p1,l1); //線分と点の差
		var r = Vec3.dot(dir,dpos);
		Vec3.copy(a2,p1);
		if(r < 0){
			Vec3.copy(a1,l1);
		}else if( r > dir[0]*dir[0]+dir[1]*dir[1]+dir[2]*dir[2]){
			Vec3.copy(a1,l2);
		}else{
			Vec3.muladd(a1,l1,dir, r/(dir[0]*dir[0]+dir[1]*dir[1]+dir[2]*dir[2]));
		}
	}

	ret.LINE_LINE=function(a1,a2,p1,p2,p3,p4){
		var dir1 = new Vec3(); 
		var dir2 = new Vec3();
		var cross = new Vec3();
		var dpos = new Vec3();
		var l;
		Vec3.sub(dir1,p2,p1); //線分1の向き
		Vec3.sub(dir2,p4,p3);// 線分2の向き
		Vec3.cross(cross,dir1,dir2); //垂直ベクトル
		
		Vec3.cross(cross,dir2,cross); //線分2に垂直かつ線分1に並行?なベクトル
		l = Vec3.dot(cross,dir1); 
		Vec3.sub(dpos,p3,p1); 
		var r = Vec3.dot(cross,dpos)/l; //線分1の交差比率
		if(r<0){
			Vec3.copy(a1,p1);
		}else if(r>1){
			Vec3.copy(a1,p2);
		}else{
			Vec3.muladd(a1,p1,dir1,r);
		}
		this.LINE_POINT(a2,a1,p3,p4,a1);
	}

	ret.CUBOID_POINT=function(a1,a2,cuboid,point){
		var axis = new Vec3();
		var dLoc= new Vec3();
		var closestPos= new Vec3();
		var rotmat=cuboid.rotmat;
		Vec3.copy(closestPos,point);
		Vec3.sub(dLoc,point,cuboid.location); //位置差
		var min=99999; //最短距離
		var minn = -1; //最短要素
		var flg=0;

		//矩形面に対する最近距離
		for(var i=0;i<3;i++){
			Vec3.set(axis,rotmat[i*3+0],rotmat[i*3+1],rotmat[i*3+2])
			var d = Vec3.dot(axis,dLoc);
			var size = cuboid.scale[i]*cuboid.size[i];

			if(d*d>size*size){
				//面より外に点がある場合
				Vec3.muladd(closestPos,closestPos,axis,size*Math.sign(d)-d);
				flg = 1;
			}else{
				//面の内側に点がある場合
				var l = size - Math.abs(d);
				if(l<min || minn<0){
					min=l;
					minn=i;
				}
			}
		}
		if(flg==0){
			//箱の内側に点がある場合
			var size = cuboid.scale[minn]*cuboid.size[minn];
			Vec3.set(axis,rotmat[minn*3+0],rotmat[minn*3+1],rotmat[minn*3+2])
			Vec3.muladd(closestPos,closestPos,axis,size*Math.sign(d)-d);
		}
		Vec3.copy(a1,closestPos);
		Vec3.copy(a2,point);
	}
	return ret
})()
