Engine.goClass["camera"]= (function(){
	var GoCamera=function(){};
	var ret = GoCamera;

	var WIDTH=960;
	var HEIGHT=512;
	var ono3d = Engine.ono3d;
	inherits(ret,Engine.defObj);
	ret.prototype.init=function(){
	}
	var collision=new Collider.Sphere();
	collision.bold=0.1;
	ret.prototype.move=function(){
		var camera = Engine.camera;
		var goJiki = Engine.go["jiki"];

		if(!goJiki){
			return;
		}
		var vec3=Vec3.poolAlloc();
		Vec3.copy(vec3,goJiki.p);
		vec3[1]+=1;

		var cameralen = 8;

		var field=Engine.go["field"];
		camera.zoom=0.6;

		if(Util.pressOn){
			this.a[1]+=(-(Util.cursorX-Util.oldcursorX)/WIDTH)*2;
			this.a[0]+=(-(Util.cursorY-Util.oldcursorY)/HEIGHT)*2;
			this.a[0]=Math.max(this.a[0],-(Math.PI/2-0.1));
			this.a[0]=Math.min(this.a[0],(Math.PI/2-0.1));

		}
		this.a[0] =Math.min(this.a[0],Math.PI/2);
		this.a[0] =Math.max(this.a[0],-Math.PI/2);
		this.p[2]=Math.cos(this.a[0]);
		this.p[1]=-Math.sin(this.a[0]);
		this.p[0]=-Math.sin(this.a[1])*this.p[2];
		this.p[2]=-Math.cos(this.a[1])*this.p[2];


		if(field){
			Mat43.setInit(collision.matrix);
			collision.matrix[9]=vec3[0];
			collision.matrix[10]=vec3[1];
			collision.matrix[11]=vec3[2];
			collision.refresh();
			var instance = field.instance;
			var nearest =8;
			for(var i=0;i<instance.objectInstances.length;i++){
				var phyObj2 = instance.objectInstances[i].phyObj;
				if(!phyObj2){
					continue;
				}
				phyObj2.refreshCollision();
				if(!AABB.aabbCast(this.p,collision.aabb,phyObj2.collision.aabb)){
					continue;
				}
				var a=Collider.convexCast(this.p,collision,phyObj2.collision);
				if(a !== Collider.INVALID){
					if(a>0 && a<nearest){
						nearest=a;
					}
				}
			}
		}
		cameralen = nearest;
		Vec3.mul(this.p,this.p,cameralen);
		Vec3.add(this.p,this.p,goJiki.p);
		this.p[1]+=1;

		camera.p[0]+=(this.p[0]-camera.p[0])*0.1
		camera.p[1]+=(this.p[1]-camera.p[1])*0.1
		camera.p[2]+=(this.p[2]-camera.p[2])*0.1

		homingCamera(this.a,vec3,this.p);
		var nangle=function(a){
			if(a>Math.PI){a-=Math.PI*2};
			if(a<-Math.PI){a+=Math.PI*2};
			return a;
		}
		for(var i=0;i<3;i++){
			this.a[i]=nangle(this.a[i]);
			camera.a[i]=nangle(camera.a[i]);
		}

		camera.a[0] +=nangle(this.a[0]-camera.a[0])*0.1;
		camera.a[1] +=nangle(this.a[1]-camera.a[1])*0.1;
		camera.a[2] +=nangle(this.a[2]-camera.a[2])*0.1;



		var light = Engine.ono3d.environments[0].sun;
		var lightInstance = Engine.go.field.instance.objectInstances["1sun"];

		var m = new Mat43();

		Mat43.setInit(lightInstance.matrix);
		Mat43.fromRotVector(m,Math.PI*0.5,1,0,0);  
		Mat43.dot(lightInstance.matrix,lightInstance.matrix,m);
		Mat44.copyMat43(light.matrix,lightInstance.matrix);

		var mat44 = new Mat44();
		var mat442 = new Mat44();

		var yup = new Vec3();
		var zup = new Vec3();
		var xup = new Vec3();
		var SHADOW_WIDTH=camera.zfar*0.5;
		var SHADOW_DEPTH=80;

		//ライト向きとカメラ向きからライトレンダリング向き決める
		Vec3.set(yup,lightInstance.matrix[6],lightInstance.matrix[7],lightInstance.matrix[8]);
		Vec3.mul(yup,yup,-1);
		Vec3.set(zup,camera.matrix[6],camera.matrix[7],camera.matrix[8]);

		var cameraz=new Vec3();
		Vec3.copy(cameraz,zup);

		Vec3.cross(xup,yup,zup);
		var offset=10/Vec3.scalar(xup);
		Vec3.norm(xup);
		Vec3.cross(zup,xup,yup);


		Vec3.norm(zup);

		var target = new Vec3();
		Vec3.madd(target,camera.p,cameraz,offset/Vec3.dot(zup,cameraz));
		target[2]+=10;

		var support= new Vec3();
		var result= new Vec3();
		Vec3.mul(support,xup,1);

		var calcAngle=function(point,axis){
			var z;
			var vec3 = new Vec3();
			Vec3.sub(vec3,point,target);
			return Vec3.dot(vec3,axis)/Vec3.dot(vec3,zup);

		}
		var calcSupportAngle =function(axis,poses,ref_point){
			var vec3 = new Vec3();
			var pi=0;

			Vec3.sub(vec3,poses[pi],ref_point);
			Vec3.norm(vec3);
			var l = Vec3.dot(vec3,axis);

			for(pi=1;pi<poses.length;pi++){
				Vec3.sub(vec3,poses[pi],ref_point);
				Vec3.norm(vec3);
				var l2 = Vec3.dot(vec3,axis);
				if(l2<l){
					l=l2;
					n=pi;
				}
			}
			return l;
		}
		var poses= camera.cameracol.poses;

		Vec3.mul(support,xup,1);
		var xminangle = calcSupportAngle(support,poses,target);

		Vec3.mul(support,xup,-1);
		var xmaxangle = calcSupportAngle(support,poses,target);

		Vec3.mul(support,yup,1);
		var yminangle = calcSupportAngle(support,poses,target);

		Vec3.mul(support,yup,-1);
		var ymaxangle = calcSupportAngle(support,poses,target);

		Vec3.mul(support,zup,1);
		camera.cameracol.calcSupport(result,support);
		var zmin = Vec3.dot(result,zup);
		Vec3.mul(support,zup,-1);
		camera.cameracol.calcSupport(result,support);
		var zmax= Vec3.dot(result,zup);

		//Vec3.madd(target,target,xup,xmax+xmin);
		//Vec3.madd(target,target,yup,(ymax+ymin));
		//Vec3.mul(target,target,0.5);
		//Vec3.madd(target,target,zup,zmax+offset);





		mat44[0]=xup[0];
		mat44[1]=xup[1];
		mat44[2]=xup[2]
		mat44[3]=0;
		mat44[4]=yup[0];
		mat44[5]=yup[1];
		mat44[6]=yup[2];
		mat44[7]=0;
		mat44[8]=+zup[0];
		mat44[9]=+zup[1];
		mat44[10]=+zup[2];
		mat44[11]=0;
		mat44[12]=target[0];
		mat44[13]=target[1];
		mat44[14]=target[2];
		mat44[15]=1;
		

		Mat44.getInv(mat44,mat44);


	//	ono3d.calcPerspectiveMatrix(mat442
	//			,(xmax-xmin)/2/(zmax-zmin+offset)*offset
	//			,-(xmax-xmin)/2/(zmax-zmin+offset)*offset
	//			,(ymax-ymin)/2/(offset)*offset
	//			,-(ymax-ymin)/2/(offset)*offset
	//			,offset,(zmax-zmin)+offset);

		ono3d.calcPerspectiveMatrix(mat442
				,-xmaxangle*offset
				,xminangle*offset
				,-ymaxangle*offset
				,yminangle*offset
				,offset,(zmax-zmin)+offset);

		Mat44.dot(light.viewmatrix,mat442,mat44);

		Mat44.setInit(mat442);
		mat442[5]=0;
		mat442[9]=-1;
		mat442[6]=-1;
		mat442[10]=0;
		Mat44.dot(light.viewmatrix,mat442,light.viewmatrix);


//		var a = new Vec4();
//		Vec4.set(a,-100,10,0,1);
//		Mat44.dotVec4(a,light.viewmatrix2,a);
//
//		Vec4.set(a,-100,-10,0,1);
//		Mat44.dotVec4(a,light.viewmatrix,a);


		Vec3.poolFree(1);
	}
	ret.prototype.draw=function(){
	}
var homingCamera=function(angle,target,camera){
	var dx=target[0]-camera[0]
	var dy=target[1]-camera[1]
	var dz=target[2]-camera[2]
	angle[0]=Math.atan2(dy,Math.sqrt(dz*dz+dx*dx));
	angle[1]=Math.atan2(dx,dz);
	angle[2]=0;
	
}
	return ret;
})();

