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


		var yup = new Vec3();
		var zup = new Vec3();
		var xup = new Vec3();

		//ライト向きとカメラ向きからライトレンダリング向き決める
		Vec3.set(yup,lightInstance.matrix[6],lightInstance.matrix[7],lightInstance.matrix[8]);
		Vec3.mul(yup,yup,-1);
		Vec3.set(zup,camera.matrix[6],camera.matrix[7],camera.matrix[8]);

		var cameraz=new Vec3();
		Vec3.copy(cameraz,zup);

		Vec3.cross(xup,yup,zup);
		var offset=10/Math.abs(Vec3.dot(cameraz,zup));
		Vec3.norm(xup);
		Vec3.cross(zup,xup,yup);
		Vec3.norm(zup);

		var support= new Vec3();
		var result= new Vec3();

		Vec3.mul(support,zup,1);
		camera.cameracol.calcSupport(result,support);
		var zmin = Vec3.dot(result,zup);
		Vec3.mul(support,zup,-1);
		camera.cameracol.calcSupport(result,support);
		var zmax= Vec3.dot(result,zup);

		var light_anchor_pos = new Vec3();
		Vec3.madd(light_anchor_pos,camera.p,zup,offset);

		Vec3.mul(support,xup,1);

		var calcSupportAngle =function(axis,poses,ref_point){
			var vec3 = new Vec3();
			var pi=0;

			Vec3.sub(vec3,poses[pi],ref_point);
			var l = Vec3.dot(vec3,axis)/-Vec3.dot(vec3,zup);

			for(pi=1;pi<poses.length;pi++){
				Vec3.sub(vec3,poses[pi],ref_point);
				var l2 = Vec3.dot(vec3,axis)/-Vec3.dot(vec3,zup);
				if(l2<l){
					l=l2;
					n=pi;
				}
			}

			return l;
		}
		var poses= camera.cameracol.poses;

		Vec3.mul(support,xup,1);
		var xminangle = calcSupportAngle(support,poses,light_anchor_pos);

		Vec3.mul(support,xup,-1);
		var xmaxangle = -calcSupportAngle(support,poses,light_anchor_pos);

		Vec3.mul(support,yup,1);
		var yminangle = calcSupportAngle(support,poses,light_anchor_pos);

		Vec3.mul(support,yup,-1);
		var ymaxangle = -calcSupportAngle(support,poses,light_anchor_pos);


		var view_matrix = light.viewmatrix;


		view_matrix[0]=xup[0];
		view_matrix[1]=xup[1];
		view_matrix[2]=xup[2]
		view_matrix[3]=0;
		view_matrix[4]=yup[0];
		view_matrix[5]=yup[1];
		view_matrix[6]=yup[2];
		view_matrix[7]=0;
		view_matrix[8]=+zup[0];
		view_matrix[9]=+zup[1];
		view_matrix[10]=+zup[2];
		view_matrix[11]=0;
		view_matrix[12]=light_anchor_pos[0];
		view_matrix[13]=light_anchor_pos[1];
		view_matrix[14]=light_anchor_pos[2];
		view_matrix[15]=1;
		

		Mat44.getInv(view_matrix,view_matrix);


		var projection_matrix = new Mat44();
		ono3d.calcPerspectiveMatrix(projection_matrix
			,xminangle*offset
			,xmaxangle*offset
			,ymaxangle*offset
			,yminangle*offset
			,offset,(zmax-zmin)+offset);


		Mat44.dot(view_matrix,projection_matrix,view_matrix);

		Mat44.setInit(projection_matrix);
		projection_matrix[5]=0;
		projection_matrix[9]=-1;
		projection_matrix[6]=-1;
		projection_matrix[10]=0;
		Mat44.dot(view_matrix,projection_matrix,view_matrix);


//		var a = new Vec4();
//		Vec4.set(a,0,0,0,1);
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

