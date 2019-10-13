"use strict"

var field;
var shShader=[];
var sigmaShader;
var probs = new Collider();

var objMan = Engine.objMan;
var ono3d = Engine.ono3d;
var onoPhy = Engine.onoPhy;
var camera = Engine.camera;
var gl = globalParam.gl;
var WIDTH = Engine.WIDTH;
var HEIGHT = Engine.HEIGHT;

Engine.goClass.main= (function(){
	var GoMain=function(){};
	var ret = GoMain;
	inherits(ret,Engine.defObj);

	ret.prototype.init=function(){


		for(var i=objMan.objs.length;i--;){
			if(this == objMan.objs[i])continue;
			objMan.deleteObj(objMan.objs[i]);
		}

		onoPhy.init();
		Engine.go.field= objMan.createObj(Engine.goClass.field);
	
		this.initFlg=false;
	}
	ret.prototype.move=function(){
		if(!this.initFlg){
			if(Util.getLoadingCount() > 0){
				return;
			}
			this.initFlg=true;
			var o3o = field;
			var t = Engine.go.field;

			var scene= o3o.scenes[0];
			O3o.setFrame(o3o,scene,0); //アニメーション処理

			ono3d.setTargetMatrix(0);
			ono3d.loadIdentity();

			Engine.skyTexture = scene.world.envTexture;

			//物理シミュオブジェクトの設定
			t.phyObjs= O3o.createPhyObjs(o3o.scenes[0],onoPhy);



			var scene = o3o.scenes[0];

			//光源エリア判定作成
			for(var i=0;i<scene.objects.length;i++){
				var object = scene.objects[i];
				if(object.name.indexOf("prob_")==0){
					var collider= new Collider.Cuboid;
					Mat43.dotMat44Mat43(collider.matrix
							,ono3d.worldMatrix,object.matrix);
					Mat43.getInv(collider.inv_matrix,collider.matrix);
					collider.refresh();
					probs.addCollision(collider);
				}	
			}
			probs.sortList();

			ono3d.environments_index=1;

			O3o.setEnvironments(scene); //光源セット


			//0番目の光源セットをコントロールに反映
			var env = ono3d.environments[0];

			var co=  scene.objects.find(function(a){return a.name===this;},"Camera");
			if(co){
				
			}



			camera.calcMatrix();
			var poses= camera.cameracol.poses;

			Vec3.set(poses[0],-1,-1,-1);
			Vec3.set(poses[1],-1,-1,1);
			Vec3.set(poses[2],-1,1,-1,);
			Vec3.set(poses[3],-1,1,1);
			Vec3.set(poses[4],1,-1,-1);
			Vec3.set(poses[5],1,-1,1);
			Vec3.set(poses[6],1,1,-1,);
			Vec3.set(poses[7],1,1,1);
			for(var i=0;i<poses.length;i++){
				Vec3.mul(poses[i],poses[i],10000);

			}

			camera.cameracol.refresh();
			var lightSource= null;


			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			var envTexture = ono3d.createEnv(null,0,0,0,Engine.drawSub);


			if(globalParam.shadow){
				lightSource = ono3d.environments[0].sun
				if(lightSource){
					camera.calcCollision(camera.cameracol2,lightSource.viewmatrix);
				}
			}

			lightSource = ono3d.environments[0].sun
			if(lightSource){
				camera.calcCollision(camera.cameracol2,lightSource.viewmatrix);
			}
			
			for(i=0;i<objMan.objs.length;i++){
				var obj = objMan.objs[i];
				ono3d.setTargetMatrix(1)
				ono3d.push();
				ono3d.setTargetMatrix(0)
				ono3d.loadIdentity()
				ono3d.rf=0;
				obj.draw();
				ono3d.setTargetMatrix(1)
				ono3d.pop();
			}
			ono3d.lightThreshold1=globalParam.lightThreshold1;
			ono3d.lightThreshold2=globalParam.lightThreshold2;

			for(var i=0;i<ono3d.environments_index;i++){
				var env = ono3d.environments[i];
				//環境マップ
				env.envTexture=envTexture;
			}

			var lightProbeTexture = Ono3d.createTexture(64,64);

			var lightprobe=o3o.objects.find(function(e){return e.name==="LightProbe"});
			O3o.freezeMesh(O3o.bufMesh,lightprobe,null);
			//o3o.createLightProbe(ono3d,lightprobe);
			//var lightprobe = ono3d.environments[i];
			lightprobe=O3o.bufMesh;
			var vertexSize = lightprobe.vertexSize;

			var a=function(){
				var tex;
				for(var i=0;i<vertexSize;i++){
					var v=lightprobe.vertices[i].pos;
					tex=createSHcoeff(v[0],v[1],v[2],0.5,Engine.drawSub);
					Ono3d.copyImage(lightProbeTexture,(i%7)*9,(i/7|0),0,0,9,1);
				}
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				ono3d.setViewport(0,0,lightProbeTexture.width,lightProbeTexture.height);
				Ono3d.drawCopy(0,0,1,1,lightProbeTexture,0,0,1,1);

				var d = new Vec4();
				if(false){
					setTimeout(a,1);
					console.log(px,py,pz);
				}else{
					var width=64,height=64;
					var u8 = new Uint8Array(width*height*4);
					gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, u8);

					var shcoefs=[];
					var ratio = 1/(255*16*16*Math.PI*4);

					for(var i=0;i<vertexSize;i++){
						var x = (i%7)*9;
						var y= (i/7|0);
						var ii = y*64+x;
						var shcoef=[];
						for(var j=0;j<9;j++){
							d[0] = u8[(j+ii)*4+0];
							d[1] = u8[(j+ii)*4+1];
							d[2] = u8[(j+ii)*4+2];
							d[3] = u8[(j+ii)*4+3];
							var e = [0,0,0];//new Vec3();
							Ono3d.unpackFloat(e,d);
							e[0]=e[0]*ratio;
							e[1]=e[1]*ratio;
							e[2]=e[2]*ratio;
							shcoef.push(e);
						}
						SH.mulA(shcoef);
						shcoefs.push(shcoef);
					}


					Util.loadText(globalParam.model,function(text){
						var o3o=JSON.parse(text);
						var mesh=o3o.meshes.find(function(e){return e.name===this},lightprobe.name);
						mesh.shcoefs =shcoefs;
						var filename = globalParam.model.substr(globalParam.model.lastIndexOf("/")+1);
						 document.getElementById("download").setAttribute("download",filename);
						var blob = new Blob([JSON.stringify(o3o,null,4)], { "type" : "text/plain" });
						 document.getElementById("download").href = window.URL.createObjectURL(blob);
						
					});
				}
			}
			a();
		}
	}
	ret.prototype.delete=function(){
	}
	
	return ret;

})();

var createSHcoeff= function(x,y,z,gridsize,func){
	var size = 32;
	var tex;
	if(!tex){
		tex =Ono3d.createTexture(size*4,size*4);
	}
	var envBuf = ono3d.envbufTexture;

	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	//キューブマップ作成
	ono3d.setNearFar(0.01,80.0);
	ono3d.createCubeMap(envBuf,x,y,z,256,func);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.clearColor(0,0,0,1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	for(var i=0;i<9;i++){
		gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
		gl.clearColor(0,0,0,1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		ono3d.setViewport(0,0,size*4,size*2);
		Ono3d.postEffect(envBuf,0,0,256*4/envBuf.width,256*2/envBuf.height,shShader[i]); 

		Ono3d.copyImage(tex,0,0,0,0,size*4,size);
		Ono3d.copyImage(tex,0,size,0,size,size*2,size);

		//gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		//gl.clearColor(0,0,0,1);
		//gl.clear(gl.COLOR_BUFFER_BIT);

		var texsize=tex.width;

		//gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);

		while(2<texsize){
			//積分
			texsize>>=1;
			ono3d.setViewport(0,0,texsize,texsize);
			Ono3d.postEffect(tex,0,0,texsize*2/tex.width,texsize*2/tex.width,sigmaShader); 
			Ono3d.copyImage(tex,0,0,0,0,texsize,texsize);

		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		texsize>>=1;
		ono3d.setViewport(i,0,1,1);
		Ono3d.postEffect(tex,0,0,texsize*2/tex.width,texsize*2/tex.width,sigmaShader); 
		Ono3d.copyImage(tex,0,0,0,0,texsize,texsize);
	}
	
	return tex;
}


var Camera= (function(){
	var Camera = function(){
		this.p=new Vec3();
		this.a=new Vec3();
		this.zoom = 0.577;
		this.cameracol=new Collider.ConvexHull();
		this.cameracol2=new Collider.ConvexHull();
		for(var i=0;i<8;i++){
			this.cameracol.poses.push(new Vec3());
			this.cameracol2.poses.push(new Vec3());
		}
	}
	var ret = Camera;
	var scope=[
		[-1,-1,-1]
		,[-1,1,-1]
		,[1,1,-1]
		,[1,-1,-1]
		,[-1,-1,1]
		,[-1,1,1]
		,[1,1,1]
		,[1,-1,1]
	];
	ret.prototype.calcMatrix=function(){
		ono3d.setPers(this.zoom,HEIGHT/WIDTH,0.1,80);
		ono3d.setTargetMatrix(1);
		ono3d.loadIdentity();
		ono3d.rotate(-this.a[2],0,0,1);
		ono3d.rotate(-this.a[0],1,0,0);
		ono3d.rotate(-this.a[1]+Math.PI,0,1,0);
		ono3d.translate(-this.p[0],-this.p[1],-this.p[2]);
		ono3d.setAov(this.zoom);
	}
	ret.prototype.calcCollision=function(collision,matrix){
		var im = Mat44.poolAlloc();
		var v4=Vec4.poolAlloc();
		if(!matrix){
			Mat44.dot(im,ono3d.projectionMatrix,ono3d.viewMatrix);
			Mat44.getInv(im,im);
		}else{
			Mat44.getInv(im,matrix);
		}

		for(var i=0;i<8;i++){
			Vec3.copy(v4,scope[i]);
			v4[3]=1;
			if(v4[2]<0){
				Vec4.mul(v4,v4,ono3d.znear);
			}else{
				Vec4.mul(v4,v4,ono3d.zfar);
			}
			Mat44.dotVec4(v4,im,v4);
			Vec3.copy(collision.poses[i],v4);
		}
		collision.refresh();
		Vec4.poolFree(1);
		Mat44.poolFree(1);
	}

	return ret;
})();

Engine.goClass.field= (function(){
	var GoField =function(){};
	var ret = GoField;
	inherits(ret,Engine.defObj);

	var objMan = Engine.objMan;
	var ono3d = Engine.ono3d;
	var onoPhy = Engine.onoPhy;
	var camera = Engine.camera;
	var gl = globalParam.gl;
	var WIDTH = Engine.WIDTH;
	var HEIGHT = Engine.HEIGHT;
	ret.prototype.init=function(){

		field =O3o.load(globalParam.model,function(o3o){

		});
	}
	ret.prototype.move=function(){
		var obj3d=field;
		var obj = this;
		var phyObjs = obj.phyObjs;
		if(obj3d.scenes.length===0){
			return;
		}
		
		 //変換マトリクス初期化
		ono3d.setTargetMatrix(0);
		ono3d.loadIdentity();

		var scene= obj3d.scenes[0];
		O3o.setFrame(obj3d,scene,this.t/60.0*60.0); //アニメーション処理

		if(phyObjs && globalParam.physics){
			//物理シミュ有効の場合は物理オブジェクトにアニメーション結果を反映させる
			for(var i=0;i<scene.objects.length;i++){
				//物理オブジェクトにアニメーション結果を反映
				//(前回の物理シミュ無効の場合は強制反映する)
				if(scene.objects[i].phyObj){
					O3o.movePhyObj(scene.objects[i]
						,1.0/globalParam.fps
						,!globalParam.physics_);
				}
			}
		}

		for(var i=0;i<phyObjs.length;i++){
			var phyObj = phyObjs[i];
			var aabb;
			if(phyObj.type===OnoPhy.CLOTH){
				aabb = phyObj.aabb;
			}else{
				aabb = phyObj.collision.aabb;
			}
			if(aabb.max[1]<-10){
				O3o.movePhyObj(phyObj,phyObj.parent,0,true);
			}
		}
	}
	var cuboidcol = new Collider.Cuboid;
	var col = new Collider.Sphere();
	ret.prototype.draw=function(){
		var phyObjs = this.phyObjs;

		ono3d.setTargetMatrix(0)
		ono3d.loadIdentity();

		ono3d.rf=0;

		var m43 = Mat43.poolAlloc();
		if(field){
			if(field.scenes.length>0){
				var objects = field.scenes[0].objects;
				for(var i=0;i<objects.length;i++){
					if(objects[i].hide_render
					|| !objects[i].static){
						continue;
					}
					var b =objects[i].bound_box;
					Mat43.setInit(m43);
					m43[0]=(b[3] - b[0])*0.5;
					m43[4]=(b[4] - b[1])*0.5;
					m43[8]=(b[5] - b[2])*0.5;
					m43[9]=b[0]+m43[0];
					m43[10]=b[1]+m43[4];
					m43[11]=b[2]+m43[8];
					var phyObj = null;
					if(globalParam.physics){
						phyObj= phyObjs.find(function(a){return a.name===this;},objects[i].name);
					}
					if(phyObj){
						Mat43.dot(cuboidcol.matrix,phyObj.matrix,m43);
					}else{
						Mat43.dot(m43,objects[i].mixedmatrix,m43);
						Mat43.dotMat44Mat43(cuboidcol.matrix,ono3d.worldMatrix,m43);
					}
					cuboidcol.refresh();
					var l = 1;
					if(AABB.hitCheck(camera.cameracol.aabb,cuboidcol.aabb)){
						//l=-1;
						l = Collider.checkHit(camera.cameracol,cuboidcol);
					}
					var l2 = 1;
					if(globalParam.shadow){
						if(AABB.hitCheck(camera.cameracol2.aabb,cuboidcol.aabb)){
							//l2=-1;
							l2 = Collider.checkHit(camera.cameracol2,cuboidcol);
						}
					}
					if(l>0 && l2>0){
						continue;
					}
					ono3d.rf&=~Ono3d.RF_OUTLINE;
					if(globalParam.outline_bold){
						ono3d.lineWidth=globalParam.outline_bold;
						ono3d.rf|=Ono3d.RF_OUTLINE;
						Util.hex2rgb(ono3d.lineColor,globalParam.outline_color);
					}

					Mat43.setInit(col.matrix);
					Mat43.mul(col.matrix,col.matrix,0);
					col.matrix[9]=objects[i].location[0];
					col.matrix[10]=objects[i].location[2];
					col.matrix[11]=-objects[i].location[1];
					col.refresh();

					var l =probs.checkHitAll(col)
					var env = null;
					if(probs.hitListIndex>0){
						env = ono3d.environments[1];
					}
					if(globalParam.physics){
						O3o.drawObject(objects[i],phyObjs,env);
					}else{
						O3o.drawObject(objects[i],null,env);
					}
				}
			}
		}
		Mat43.poolFree(1);
	}
	return ret;
})();


	var url=location.search.substring(1,location.search.length)
	globalParam.outline_bold=0;
	globalParam.outline_color="000000";
	globalParam.lightcolor1="808080";
	globalParam.lightcolor2="808080";;
	globalParam.lightthreshold1=0.;
	globalParam.lightthreshold2=1.;
	globalParam.physics=1;
	globalParam.physics_=0;
	globalParam.smoothing=0;
	globalParam.stereomode=0;
	globalParam.stereovolume=1;
	globalParam.step=1;
	globalParam.fps=60;
	globalParam.scene=0;
	globalParam.shadow=1;
	globalParam.model="";
	globalParam.materialmode = false;
//カスタムマテリアル
	globalParam.basecolor= "ffffff";
	globalParam.metallic= 0;
	globalParam.metalcolor= "ffffff";
	globalParam.roughness= 0;
	globalParam.subroughness= 0;
	globalParam.frenel = 0;
	globalParam.opacity= 1.0;
	globalParam.ior= 1.1;
	globalParam.cnormal= 1.0;
	globalParam.emi= 0.0;

	globalParam.shader= 0;

//カメラ露光
	globalParam.autoexposure=1;
	globalParam.exposure_level=0.18;
	globalParam.exposure_upper=1;
	globalParam.exposure_bloom=0.1;
	
	globalParam.source=0;
	globalParam.target=0;
	globalParam.reference=0;
	globalParam.actionAlpha=0;

	var args=url.split("&")

	for(i=args.length;i--;){
		var arg=args[i].split("=")
		if(arg.length >1){
			if(!isNaN(arg[1]) && arg[1]!=""){
				if(arg[1].length>1 && arg[1].indexOf(0) =="0"){
					globalParam[arg[0]] = arg[1]
				}else{
					globalParam[arg[0]] = +arg[1]
				}
			}else{
				globalParam[arg[0]] = arg[1]
			}
		}
	}
	
Engine.userInit=function(){

	var select = document.getElementById("cTexture");
	var option;
	//soundbuffer = WebAudio.loadSound('se.mp3');

	


	var control = document.getElementById("control");
	if(control){
		document.getElementById("autoExposure").addEventListener("change"
			,function(evt){
				var control = document.getElementById("exposure_setting");
				var inputs = Array.prototype.slice.call(control.getElementsByTagName("input"));

				for(var i=0;i<inputs.length;i++){
					var element = inputs[i];
					if(this.checked){
						element.setAttribute("disabled","disabled");
					}else{
						element.removeAttribute("disabled");
					}
				}
		});
		var inputs = Array.prototype.slice.call(control.getElementsByTagName("input"));
		var selects= Array.prototype.slice.call(control.getElementsByTagName("select"));
		
		inputs = inputs.concat(selects);

		for(var i=0;i<inputs.length;i++){
			var element = inputs[i];
			var tag = element.id;
			if(!tag)continue;

			element.title = tag;
			if(element.className=="colorpicker"){
				element.value=globalParam[tag];
				element.addEventListener("change",function(evt){globalParam[evt.target.id] = this.value},false);
			}else if(element.type=="checkbox"){
				element.checked=Boolean(globalParam[tag]);
				element.addEventListener("change",function(evt){globalParam[evt.target.id] = this.checked},false);
			}else if(element.type==="text" || element.tagName ==="SELECT"){
				element.value=globalParam[tag];
				element.addEventListener("change",function(evt){globalParam[evt.target.id] = parseFloat(this.value)},false);
				if(!element.value){
					continue;
				}
			}else if(element.type==="radio"){
				var name = element.name;
				if(element.value === ""+globalParam[name]){
					element.checked=1;
				}else{
					element.checked=0;
				}
				element.addEventListener("change",function(evt){globalParam[evt.target.name] = parseFloat(this.value)},false);
				if(!element.checked){
					continue;
				}
			}
			Util.fireEvent(element,"change");
		}
	}
	
	//メインオブジェクト作成
	Engine.go.main= Engine.objMan.createObj(Engine.goClass.main);


}

	sigmaShader=Ono3d.loadShader("sigma.shader");

	for(var i=0;i<9;i++){
		shShader.push(Ono3d.loadShader("sh"+i+".shader"));
	}
	Engine.enableDraw=false;
