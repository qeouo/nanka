Engine.goClass["camera"]= (function(){
	var WIDTH=960;
	var HEIGHT=512;
	var GoCamera=function(){};
	var ret = GoCamera;
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
		var mat44 = new Mat44();
		var mat442 = new Mat44();
		Ono3d.calcOrthoMatrix(mat44,20.0,20.0,0.1,80.0)
		lightInstance.matrix[9]=goJiki.p[0] + lightInstance.matrix[3]*40;
		lightInstance.matrix[10]=goJiki.p[1] + lightInstance.matrix[4]*40;
		lightInstance.matrix[11]=goJiki.p[2] + lightInstance.matrix[5] *40;

		Mat43.fromRotVector(m,Math.PI*0.5,1,0,0);  //ライトはデフォルト姿勢で下向きなので補正
		Mat44.copyMat43(light.matrix,lightInstance.matrix);
		Mat44.dotMat43(light.matrix,light.matrix,m);
		Mat44.getInv(mat442,light.matrix);
		Mat44.dot(light.viewmatrix,mat44,mat442);//影生成用のビュー行列

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

