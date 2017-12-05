"use strict"
var AABB = function(){
	this.min=new Vec3();
	this.max=new Vec3();

}
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


	ret.LINE_POINT = function(ans,l1,l2,p1){
		var dir = new Vec3();
		var dpos = new Vec3();
		Vec3.sub(dir,l2,l1); //線分の向き
		if(!Vec3.scalar(dir)){
			Vec3.copy(ans,l1);
			return;
		}
		Vec3.sub(dpos,p1,l1); //線分と点の差
		var r = Vec3.dot(dir,dpos);
		if(r < 0){
			Vec3.copy(ans,l1);
		}else if( r > dir[0]*dir[0]+dir[1]*dir[1]+dir[2]*dir[2]){
			Vec3.copy(ans,l2);
		}else{
			Vec3.muladd(ans,l1,dir, r/(dir[0]*dir[0]+dir[1]*dir[1]+dir[2]*dir[2]));
		}

		return Vec3.len2(ans,p1);
	}

	ret.LINE_LINE=function(a1,a2,p1,p2,p3,p4){
		var dir1 = new Vec3(); 
		var dir2 = new Vec3();
		var cross = new Vec3();
		var dpos = new Vec3();
		var l;
		Vec3.sub(dir1,p2,p1); //線分1の向き
		if(!Vec3.scalar(dir1)){
			Vec3.copy(a1,p1);
			this.LINE_POINT(a2,p3,p4,a1);
			return;
		}
		Vec3.sub(dir2,p4,p3);// 線分2の向き
		if(!Vec3.scalar(dir2)){
			Vec3.copy(a2,p3);
			this.LINE_POINT(a1,p1,p2,a2);
			return;
		}

		Vec3.cross(cross,dir1,dir2); //垂直ベクトル
		if(Vec3.scalar(cross)){
			Vec3.cross(cross,dir2,cross); //線分2に垂直かつ線分1に並行?なベクトル
			l = Vec3.dot(cross,dir1); 
			Vec3.sub(dpos,p3,p1); 
			var r1;
			if(!l){
				//2線が垂直だった場合の例外処理
				r1 =Vec3. dot(dir1,dpos)/Vec3.dot(dir1,dir1);
			}else{
				r1 = Vec3.dot(cross,dpos)/l; //線分1の交差比率
			}

			Vec3.cross(cross,dir1,dir2); //垂直ベクトル
			Vec3.cross(cross,dir1,cross); //線分1に垂直かつ線分2に並行?なベクトル
			l = Vec3.dot(cross,dir2); 
			//Vec3.sub(dpos,p1,p3); 
			var r2;
			if(!l){
				//2線が垂直だった場合の例外処理
				r2 = -Vec3.dot(dir2,dpos)/Vec3.dot(dir2,dir2);
			}else{
				r2 = -Vec3.dot(cross,dpos)/l; //線分2の交差比率
			}

			if(r1>0 && r1<1 && r2>0 && r2<1){
				Vec3.muladd(a1,p1,dir1,r1);
				Vec3.muladd(a2,p3,dir2,r2);
				return;
			}
		}

		var ret1=new Vec3();
		var ret2=new Vec3();
		var ps1=[p1,p2];
		var ps2=[p3,p4];
		var min=-1;
		for(var i=0;i<2;i++){
			var l=this.LINE_POINT(ret1,p1,p2,ps2[i]);
			if(min<0 || l<min){
				min=l;
				Vec3.copy(a1,ret1);
				Vec3.copy(a2,ps2[i]);
			}
			l=this.LINE_POINT(ret1,p3,p4,ps1[i]);
			if(min<0 || l<min){
				min=l;
				Vec3.copy(a1,ps1[i]);
				Vec3.copy(a2,ret1);
			}
		}

	}

	ret.TRIANGLE_POINT=function(ans,t1,t2,t3,p1){
		var dir1 = new Vec3(); 
		var dir2 = new Vec3();
		var cross = new Vec3();
		var cross2 = new Vec3();
		var dpos = new Vec3();
		var l1,l2;

		Vec3.sub(dir1,t2,t1); //線分1の向き
		Vec3.sub(dir2,t3,t1);// 線分2の向き
		Vec3.cross(cross,dir1,dir2); //垂直ベクトル
		Vec3.sub(dpos,p1,t1);

		Vec3.cross(cross2,dir1,cross); //法線と線分1に垂直なベクトル
		l1=Vec3.dot(cross2,dpos)/Vec3.dot(cross2,dir2);
		Vec3.cross(cross2,dir2,cross); //法線と線分2に垂直なベクトル
		l2=Vec3.dot(cross2,dpos)/Vec3.dot(cross2,dir1);


		if(l1+l2<=1 && l1>=0 && l2>=0 ){
			Vec3.muladd(ans,t1,dir2,l1);
			Vec3.muladd(ans,ans,dir1,l2);
		}else{
			var v1,v2,v3;
			if(l1<0){
				v1=t1;
				v2=t2;
				v3=t3;
			}else if(l2<0){
				v1=t1;
				v2=t3;
				v3=t2;
			}else{
				v1=t2;
				v2=t3;
				v3=t1;
			}
			Vec3.sub(dir1,v2,v1);
			Vec3.sub(dpos,p1,v1);
			if(Vec3.dot(dpos,dir1)<0){
				this.LINE_POINT(ans,v1,v3,p1);
			}else  if(Vec3.dot(dpos,dir1)>Vec3.dot(dir1,dir1)){
				this.LINE_POINT(ans,v2,v3,p1);
			}else{
				this.LINE_POINT(ans,v1,v2,p1);
			}
		}
	}
	ret.TRIANGLE_TRIANGLE=function(ans1,ans2,t1,t2,t3,t4,t5,t6){
		var ts1=[t1,t2,t3,t1];
		var ts2=[t4,t5,t6,t4];
		var min=-1;
		var ret1=new Vec3();
		var ret2=new Vec3();

		for(var i=0;i<3;i++){
			for(var j=0;j<3;j++){
				this.LINE_LINE(ret1,ret2,ts1[i],ts1[i+1],ts2[i],ts2[i+1]);
				if(min<0 || Vec3.len2(ret1,ret2)<min){
					min=Vec3.len2(ret1,ret2);
					Vec3.copy(ans1,ret1);
					Vec3.copy(ans2,ret2);
				}
			}
		}
		for(var i=0;i<3;i++){
			this.TRIANGLE_POINT(ret1,ts1[0],ts1[1],ts1[2],ts2[i]);
			if(min<0 || Vec3.len2(ret1,ts2[i])<min){
				min=Vec3.len2(ret1,ts2[i]);
				Vec3.copy(ans1,ret1);
				Vec3.copy(ans2,ts2[i]);
			
			}
			this.TRIANGLE_POINT(ret1,ts2[0],ts2[1],ts2[2],ts1[i]);
			if(min<0 || Vec3.len2(ret1,ts1[i])<min){
				min=Vec3.len2(ret1,ts2[i]);
				Vec3.copy(ans1,ts1[i]);
				Vec3.copy(ans2,ret1);
			
			}
		}

	}
	ret.TETRA_CLOSEST=function(ans,t1,t2,t3,t4,p1){
		var dir1 = new Vec3(); 
		var dir2 = new Vec3();
		var cross = new Vec3();
		var ts=[t1,t2,t3,t4];
		var dpos = new Vec3();

		var min=-1;
		for(var i=0;i<4;i++){
			var v1=ts[i];
			var v2=ts[(i+1)&3];
			var v3=ts[(i+2)&3];
			Vec3.sub(dir1,v2,v1);
			Vec3.sub(dir2,v3,v1);
			Vec3.sub(dpos,p1,v1);
			Vec3.cross(cross,dir1,dir2);
			Vec3.norm(cross);
			var l=Vec3.dot(dpos,cross);
			if(min<0 || min>l*l){
				min=l*l;
				Vec3.muladd(ans,p1,cross,-l);
			}
		}
	}
	ret.TETRA_POINT=function(ans,t1,t2,t3,t4,p1){
		var dir1 = new Vec3(); 
		var dir2 = new Vec3();
		var dir3 = new Vec3();
		var cross = new Vec3();
		var dpos = new Vec3();
		var ts=[t1,t2,t3,t4];
		var ret = new Vec3();

		var min=-1;
		var min2=0;
		var min2n=-1;
		for(var i=0;i<4;i++){
			var v1=i;
			var v2=(i+1)&3;
			var v3=(i+2)&3;
			var v4=(i+3)&3;
			Vec3.sub(dir1,ts[v2],ts[v1]);
			Vec3.sub(dir2,ts[v3],ts[v1]);
			Vec3.sub(dir3,ts[v4],ts[v1]);
			Vec3.sub(dpos,p1,ts[v1]);
			Vec3.cross(cross,dir1,dir2);
			var l1 = Vec3.dot(dpos,cross);
			var l2 = Vec3.dot(cross,dir3);
			if( l2 ==0 || l1 * l2 <0){
				this.TRIANGLE_POINT(ret,ts[v1],ts[v2],ts[v3],p1);
				var l = Vec3.len2(p1,ret);
				if(min<0 || l<min){
					min=l;
					Vec3.copy(ans,ret);
				}
			}
		}
		if(min>0){
			return 0;
		}else{ 
			this.TETRA_CLOSEST(ans,t1,t2,t3,t4,p1);
			return 1;
		}
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

	ret.addAABB=function(a,b,c){
		for(var i=0;i<3;i++){
			if(b.min[i]<c.min[i]){
				a.min[i]=b.min[i];
			}else{
				a.min[i]=c.min[i];
			}
			if(b.max[i]>c.max[i]){
				a.max[i]=b.max[i];
			}else{
				a.max[i]=c.max[i];
			}
		}
	}

	ret.AABB_AABBhit = function(a,b){
		for(var i=0;i<3;i++){
			if(a.min[i]>b.max[i]
			|| a.max[i]<b.min[i]){
				return false;
			}
		}
		return true;
	}
	return ret;
})()
