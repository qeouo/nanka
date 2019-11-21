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

		//Mat43.setInit(lightInstance.matrix);
		Mat43.fromRotVector(m,Math.PI*0.5,1,0,0);  
		Mat43.dot(lightInstance.matrix,lightInstance.matrix,m);

		var mat44 = new Mat44();
		var mat442 = new Mat44();

		var yup = new Vec3();
		var zup = new Vec3();
		var xup = new Vec3();
		var target= new Vec3();
		var SHADOW_WIDTH=40;
		var SHADOW_DEPTH=80;

		//ライト向きとカメラ向きからライトレンダリング向き決める
		Vec3.set(yup,lightInstance.matrix[6],lightInstance.matrix[7],lightInstance.matrix[8]);
		Vec3.set(zup,camera.matrix[6],camera.matrix[7],camera.matrix[8]);

		target[0]=camera.matrix[9]-zup[0]*10;
		target[1]=camera.matrix[10]-zup[1]*10;
		target[2]=camera.matrix[11]-zup[2]*10;

		Vec3.cross(xup,yup,zup);
		Vec3.norm(xup);
		Vec3.cross(zup,xup,yup);
		Vec3.norm(zup);

		lightInstance.matrix[9]=target[0] - lightInstance.matrix[6]*SHADOW_DEPTH/2;
		lightInstance.matrix[10]=target[1] - lightInstance.matrix[7]*SHADOW_DEPTH/2;
		lightInstance.matrix[11]=target[2] - lightInstance.matrix[8] *SHADOW_DEPTH/2;

		Mat44.copyMat43(light.matrix,lightInstance.matrix);
		Mat44.getInv(mat442,light.matrix);


		Ono3d.calcOrthoMatrix(mat44,SHADOW_WIDTH,SHADOW_WIDTH,0.1,SHADOW_DEPTH)
		Mat44.dot(light.viewmatrix,mat44,mat442);//影生成用のビュー行列


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
		mat44[12]=target[0]+zup[0]*10;
		mat44[13]=target[1]+zup[1]*10;
		mat44[14]=target[2]+zup[2]*10;
		mat44[15]=1;
		

		Mat44.getInv(mat44,mat44);

		Mat44.setInit(mat442);
		mat442[5]=0;
		mat442[14]=1;
		mat442[13]=2
		Mat44.dot(mat44,mat442,mat44);

		ono3d.calcProjectionMatrix(mat442,0.5,0.5,0.1,SHADOW_WIDTH*2);


		Mat44.dot(light.viewmatrix2,mat442,mat44);

		Mat44.setInit(mat442);
		mat442[0]=-0.5;
		mat442[5]=-1.0;
		Mat44.dot(light.viewmatrix2,mat442,light.viewmatrix2);


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

