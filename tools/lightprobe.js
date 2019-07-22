"use strict"
var Testact=(function(){
	var ret={};
	var HEIGHT=256,WIDTH=512;
	var gl;
	var onoPhy=null;
	var objs=[];
	var bufTexture;
	var lightProbeTexture=null;
	var probs = new Collider();
	var px,py,pz;
	var cube2lightfield1;
	var cube2lightfield2;
	var cube2lightfield3;
	var shShader=[];
	var sigmaShader;

	var obj3d=null,field=null;
	var goField;

	var i;
	var pad =new Vec2();

	var objMan;
	var goMain;

	var ObjMan= (function(){
		var STAT_EMPTY=0
			,STAT_ENABLE=1
			,STAT_CREATE=2
		;
		var ObjMan=function(){
			this.objs= []; 
			this.pool= []; 
			this.id=0;
		}
		var ret = ObjMan;

		ret.Obj = (function(){
			var Obj = function(){
				this.p=new Vec3();
				this.scale=new Vec3();
				this.rotq = new Vec4();
				this.v=new Vec3();
				this.a=new Vec3();
				this.stat=STAT_EMPTY;
				this.type=0;
				this.hp=1;
				this.t=0;
				this.hitareas=[];
				this.matrix=new Mat43();
				this.phyObjs = [];
			}
			var ret = Obj;

			return ret;
		})();
		var Obj = ret.Obj;

		ret.prototype.createObj = function(c){
			if(!c){
				c=defObj;
			}
			var obj = null;
			if(this.pool.length>0){
				obj = this.pool[this.pool.length-1];
				if(obj.stat<0){
					//クールタイムなのは無視
					obj=null;
				}
			}
			if(!obj){
				//プールからとってこれない場合は何個か追加する
				for(var i=0;i<16;i++){
					this.pool.push(new Obj());
				}
			}
			//プールからオブジェクトを移動
			obj = this.pool.pop();
			this.objs.push(obj);

			if(this.objs.length>1024){
				//不本意
				alert("objs>1024!");
			}

			//初期値セット
			Mat43.setInit(obj.matrix);
			obj.parent=null;
			Vec3.set(obj.scale,1,1,1);
			obj.angle=0;
			obj.t=0;
			obj.hp=1;
			obj.stat=STAT_CREATE;
			obj.pattern=0;
			obj.frame=0;
			obj.pos2=new Vec3();
			obj.phyObjs = [];
			obj.func=c;

			//IDセット
			obj.id=this.id;
			this.id++;

			obj.__proto__=c.prototype;

			obj.init();

			return obj;
			
		}
		ret.prototype.deleteObj=function(obj){
			for(var i=0;i<this.objs.length;i++){
				if(obj === this.objs[i]){
					//クールタイムを取る
					obj.stat=-10;
					//プールに移動
					this.pool.unshift(objs[i]);
					objs.splice(i,1);
					break;
				}
			}
		}
		ret.prototype.update=function(){
			objs = this.objs;
			for(var i=0;i<this.objs.length;i++){

				if(objs[i].stat===STAT_CREATE){
					objs[i].stat=STAT_ENABLE;
				}

				if(objs[i].stat===STAT_ENABLE){
					objs[i].t++;
					objs[i].frame++;
				}
			}
			for(var i=0;i<this.pool.length;i++){
				if(this.pool[i].stat<0){
					this.pool[i].stat++;
				}else{
					break;
				}
			}

		}
		
		ret.prototype.move=function(){
			var objs = this.objs;
			for(i=0;i<objs.length;i++){
				if(objs[i].stat!==STAT_ENABLE)continue;
				objs[i].move();
			}
		}

		
		return ret;
	})();
	

	var defObj = (function(){
		var defObj = function(){};
		var ret = defObj;
		ret.prototype.init=function(){};
		ret.prototype.move=function(){};
		ret.prototype.draw=function(){};
		ret.prototype.drawShadow=function(){
			this.draw();
		};
		ret.prototype.hit=function(){};
		ret.prototype.delete=function(){};
		ret.prototype.drawhud=function(){};
		return ret;
	})();

	var GoMain = (function(){
		var GoMain=function(){};
		var ret = GoMain;
		inherits(ret,defObj);
		ret.prototype.init=function(){


			for(var i=objMan.objs.length;i--;){
				if(this == objMan.objs[i])continue;
				objMan.deleteObj(objMan.objs[i]);
			}

			onoPhy.init();
			goField= objMan.createObj(GoField);
		
		}
		ret.prototype.move=function(){
			if(!lightProbeTexture){
				if(Util.getLoadingCount() === 0){
					var o3o = field;
					var t = goField;

					var scene= o3o.scenes[0];
					O3o.setFrame(o3o,scene,0); //アニメーション処理

					ono3d.setTargetMatrix(0);
					ono3d.loadIdentity();
					ono3d.rotate(-Math.PI*0.5,1,0,0) //blenderはzが上なのでyが上になるように補正

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
							collider.update();
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

					camera.cameracol.update();
					var lightSource= null;

					gl.bindFramebuffer(gl.FRAMEBUFFER, null);
					var envTexture = ono3d.createEnv(null,0,0,0,drawSub);


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

					lightProbeTexture = Ono3d.createTexture(64,64);
					//gl.bindFramebuffer(gl.FRAMEBUFFER, null);
					//gl.clearColor(0,0,0,1);
					//gl.clear(gl.COLOR_BUFFER_BIT);
					//Ono3d.copyImage(lightProbeTexture,0,0,0,0,WIDTH,HEIGHT);
					//for(var px=0;px<128;px++){
					//	for(var py=0;py<128;py++){
					//		for(var pz=0;pz<8;pz++){

					var lightprobe=o3o.objects.find(function(e){return e.name==="LightProbe"});
					lightprobe=lightprobe.data;




					var a=function(){
						for(var i=0;i<lightprobe.vertices.length;i++){
							var v=lightprobe.vertices[i].pos;
							//createLightField(lightProbeTexture,v[0],v[1],v[2],0.5,drawSub);
							createSHcoeff(v[0],v[1],v[2],0.5,drawSub);
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

							var css=[];
							for(var i=0;i<lightprobe.vertices.length;i++){
								var x = (i%7)*9;
								var y= (i/7|0);
								var ii = y*64+x;
								var cs=[];
								for(var j=0;j<9;j++){
									d[0] = u8[(j+ii)*4+0];
									d[1] = u8[(j+ii)*4+1];
									d[2] = u8[(j+ii)*4+2];
									d[3] = u8[(j+ii)*4+3];
									var e = new Vec3();
									Ono3d.unpackFloat(e,d);
									e[0]=Math.pow(e[0]/256,1.0/2.2)
									e[1]=Math.pow(e[1]/256,1.0/2.2)
									e[2]=Math.pow(e[2]/256,1.0/2.2)
									e[0]=Math.floor(e[0]*1000)/1000;
									e[1]=Math.floor(e[1]*1000)/1000;
									e[2]=Math.floor(e[2]*1000)/1000;
									cs.push(e);
								}
								css.push(cs);
							}
							var content = JSON.stringify(css);


							Util.loadText(globalParam.model,function(text){
								var o3o=JSON.parse(text);
								var mesh=o3o.meshes.find(function(e){return e.name===this},lightprobe.name);
								mesh.colors=css;
								var filename = globalParam.model.substr(globalParam.model.lastIndexOf("/")+1);
								 document.getElementById("download").setAttribute("download",filename);
								var blob = new Blob([JSON.stringify(o3o)], { "type" : "text/plain" });
								 document.getElementById("download").href = window.URL.createObjectURL(blob);
								
							});
             
						}
					}
					a();
					//ono3d.createLightField(lightProbeTexture,0,0,0,drawSub);

					//for(var i=0;i<ono3d.environments_index;i++){
					//	var env = ono3d.environments[i];

					//	env.lightProbe=lightProbeTexture;
					//}

				}
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
		var a=new Vec3(x,y,z);
		Mat44.dotVec3(a,ono3d.worldMatrix,a);
	
		ono3d.createCubeMap(envBuf,a[0],a[1],a[2],size,func);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.clearColor(0,0,0,1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		for(var i=0;i<9;i++){
			gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
			gl.clearColor(0,0,0,1);
			gl.clear(gl.COLOR_BUFFER_BIT);
			ono3d.setViewport(0,0,size*4,size*2);
			Ono3d.postEffect(envBuf,0,0,size*4/envBuf.width,size*2/envBuf.height,shShader[i]); 

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
		
		return ;
	}
	var createLightField= function(tex,x,y,z,gridsize,func){
		var size = 32;
		if(!tex){
			tex =Ono3d.createTexture(size*4,size*2);
		}
		var envBuf = ono3d.envbufTexture;

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		//キューブマップ作成
		//ono3d.createCubeMap(envBuf,(x-64)*gridsize,(y-4)*gridsize,(z-64)*gridsize,size,func);
		var a=new Vec3(x,y,z);
		Mat44.dotVec3(a,ono3d.worldMatrix,a);
	
		ono3d.createCubeMap(envBuf,a[0],a[1],a[2],size,func);

		ono3d.setViewport(0,0,size*4,size*2);
		Ono3d.postEffect(envBuf,0,0,size*4/envBuf.width,size*2/envBuf.height,cube2lightfield1); 
		Ono3d.copyImage(envBuf,0,0,0,0,size*4,size*2);

		var texsize=size;

		while(2<texsize){
			//積分
			texsize>>=1;
			ono3d.setViewport(0,0,texsize*4,texsize*2);
			Ono3d.postEffect(envBuf,0,0,1,1,cube2lightfield2); 
			Ono3d.copyImage(envBuf,0,0,0,0,texsize*4,texsize*2);

		}

		//積分2
		ono3d.setViewport(0,0,6,1);
		Ono3d.postEffect(envBuf,0,0,1,1,cube2lightfield3); 
		//Ono3d.copyImage(tex,x*6,z+y*128,0,0,6,1);
		

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
			collision.update();
			Vec4.poolFree(1);
			Mat44.poolFree(1);
		}

		return ret;
	})();
	var camera = new Camera();

	var GoField= (function(){
		var GoField =function(){};
		var ret = GoField;
		inherits(ret,defObj);
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
			ono3d.rotate(-Math.PI*0.5,1,0,0) //blenderはzが上なのでyが上になるように補正

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
					aabb = phyObj.AABB;
				}else{
					aabb = phyObj.collision.AABB;
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
			ono3d.rotate(-Math.PI*0.5,1,0,0)

			ono3d.rf=0;

			var m43 = Mat43.poolAlloc();
			if(field){
				if(field.scenes.length>0){
					var objects = field.scenes[0].objects;
					for(var i=0;i<objects.length;i++){
						if(objects[i].hide_render){
							continue;
						}
						if(objects[i].rigid_body){
							var r = objects[i].rigid_body;
							if(r.type!=="PASSIVE"){
								continue;
							}
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
						cuboidcol.update();
						var l = 1;
						if(AABB.hitCheck(camera.cameracol.AABB,cuboidcol.AABB)){
							//l=-1;
							l = Collider.checkHit(camera.cameracol,cuboidcol);
						}
						var l2 = 1;
						if(globalParam.shadow){
							if(AABB.hitCheck(camera.cameracol2.AABB,cuboidcol.AABB)){
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
						col.update();

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
		globalParam.lightColor1="808080";
		globalParam.lightColor2="808080";;
		globalParam.lightThreshold1=0.;
		globalParam.lightThreshold2=1.;
		globalParam.physics=1;
		globalParam.physics_=0;
		globalParam.smoothing=0;
		globalParam.stereomode=0;
		globalParam.stereoVolume=1;
		globalParam.step=1;
		globalParam.fps=60;
		globalParam.scene=0;
		globalParam.shadow=1;
		globalParam.model="";
		globalParam.materialMode = false;
	//カスタムマテリアル
		globalParam.baseColor= "ffffff";
		globalParam.metallic= 0;
		globalParam.metalColor= "ffffff";
		globalParam.roughness= 0;
		globalParam.subRoughness= 0;
		globalParam.frenel = 0;
		globalParam.opacity= 1.0;
		globalParam.ior= 1.1;
		globalParam.cNormal= 1.0;
		globalParam.emi= 0.0;

		globalParam.shader= 0;

	//カメラ露光
		globalParam.autoExposure=1;
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
	
	var physicsTime;
	var span;
	var oldTime = 0;
	var nowTime =0;
	var drawgeometryTime=0;
	var drawrasteriseTime=0;
	var drawTime=0;
	var mseccount=0;
	var framecount=0;
	var inittime=0;
	var afID=0;
	var mainloop=function(){
		
		nowTime = Date.now()
		var obj;

		pad[0] = Util.padX + (Util.keyflag[2] || Util.keyflag[10])-(Util.keyflag[0] || Util.keyflag[8]);
		pad[1] = Util.padY + (Util.keyflag[3] || Util.keyflag[11])-(Util.keyflag[1] || Util.keyflag[9]);
		var l = Vec2.scalar(pad);
		if(l>1){
			Vec2.norm(pad);
		}
		

		var i;
		objMan.update();

		objMan.move();
		physicsTime=Date.now();
		if(globalParam.physics){
			for(var i=0;i<globalParam.step;i++){
				onoPhy.calc(1.0/globalParam.fps/globalParam.step);
			}
			globalParam.physics_=1;
		}
		physicsTime=Date.now()-physicsTime;

		mseccount += (Date.now() - nowTime)
		framecount++
		if(nowTime-oldTime > 1000){
			var mspf=0;
			var fps = framecount*1000/(nowTime-oldTime)
			if(framecount!==0)mspf = mseccount/framecount
			
			Util.setText(span,fps.toFixed(2) + "fps " + mspf.toFixed(2) + "ms/frame"
				   )
	
			framecount = 0
			mseccount=0
			oldTime = nowTime
		}

	}
	var parentnode = (function (scripts) {
		return scripts[scripts.length - 1].parentNode;
	}) (document.scripts || document.getElementsByTagName('script'));

	var drawSub = function(x,y,w,h){

//遠景描画
		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.BLEND);
		gl.depthMask(true);
		ono3d.setViewport(x,y,w,h);
		ono3d.getProjectionMatrix(ono3d.projectionMatrix);

		gl.clear(gl.DEPTH_BUFFER_BIT);
		gl.depthMask(false);
		gl.disable(gl.BLEND);
		if(field.scenes[0].world.envTexture.glTexture){
			var skyTexture = field.scenes[0].world.envTexture;
			if(globalParam.stereomode==0){
				ono3d.drawCelestialSphere(skyTexture);
			}else{
				ono3d.setPers(0.577,HEIGHT/WIDTH*2,1,20);
				ono3d.setViewport(0,0,WIDTH/2,HEIGHT);
				ono3d.drawCelestialSphere(skyTexture);
				ono3d.setViewport(WIDTH/2,0,WIDTH/2,HEIGHT);
				ono3d.drawCelestialSphere(skyTexture);
				
			}
		}

		ono3d.setViewport(x,y,w,h);
//オブジェクト描画
		gl.depthMask(true);
		gl.enable(gl.DEPTH_TEST);

		if(globalParam.shader===0){
			ono3d.render(camera.p);
		}
		
	}

	ret.loadModel=function(){
		obj3d=O3o.load(globalParam.model,function(){

			for(var i=0;i<obj3d.objects.length;i++){
				var object=obj3d.objects[i];
			}

			var sceneSelect = document.getElementById("scene");
			var option;
			for(var i=0;i<obj3d.scenes.length;i++){
				if(obj3d.scenes[i].name.indexOf("_",0)==0){
	var drawFunc = function(){
		afID = 0;

		drawTime=Date.now();


		ono3d.rf=0;
		ono3d.lineWidth=1.0;
		ono3d.smoothing=globalParam.smoothing;


		var environment = ono3d.environments[0];

			
		var start = Date.now();

		camera.calcMatrix();
		camera.calcCollision(camera.cameracol);
		var lightSource= null;

		if(globalParam.shadow){
			lightSource = ono3d.environments[0].sun
			if(lightSource){
				camera.calcCollision(camera.cameracol2,lightSource.viewmatrix);
			}
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

		drawgeometryTime=Date.now()-start;

		
		// ステレオ描画設定
		globalParam.stereo=-globalParam.stereoVolume * globalParam.stereomode*0.4;

		start=Date.now();

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.depthMask(true);
		gl.clear(gl.DEPTH_BUFFER_BIT);
		drawSub(0,0,WIDTH,HEIGHT);
		

		//描画結果をバッファにコピー
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		Ono3d.copyImage(bufTexture,0,0,0,0,WIDTH,HEIGHT);

		//画面平均光度算出
		//if(globalParam.autoExposure){
		//	ono3d.calcExpose(bufTexture,(WIDTH-512)/2.0/1024,0 ,512/1024,HEIGHT/1024);
		//}else{
			ono3d.setExpose(globalParam.exposure_level,globalParam.exposure_upper);
		//}


		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		ono3d.setViewport(0,0,WIDTH,HEIGHT);
		var lightProbe = ono3d.environments[0].lightProbe;
		if(lightProbe){
			Ono3d.drawCopy(0,0,1,1,lightProbe,0,1,1,-1);
		}

		//Ono3d.drawCopy(0,0,1,1,lightProbeTexture,0,0,WIDTH/lightProbeTexture.width,HEIGHT/lightProbeTexture.height);
		//Ono3d.drawCopy(0,0,1,1,lightProbeTexture,0,0,6.0/lightProbeTexture.width,1.0/lightProbeTexture.height);
		//Ono3d.copyImage(bufTexture,0,0,0,0,WIDTH,HEIGHT);
		gl.finish();

		ono3d.setViewport(0,0,WIDTH,HEIGHT);
		gl.bindFramebuffer(gl.FRAMEBUFFER,null );

		//トーンマッピング
		//ono3d.toneMapping(bufTexture,WIDTH/1024,HEIGHT/1024);
		gl.finish();

		
		gl.clearColor(0,0,0,0.0);
		//gl.clear(gl.COLOR_BUFFER_BIT);

		ono3d.clear();

		for(i=0;i<objMan.objs.length;i++){
			//HUD描画
			obj = objMan.objs[i];
			ono3d.setTargetMatrix(1)
			ono3d.push();
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()
			ono3d.rf=0;
			obj.drawhud();
			ono3d.setTargetMatrix(1)
			ono3d.pop();
		}

		//gl.getParameter(gl.VIEWPORT);
		drawrasteriseTime=Date.now()-start;

		drawTime =Date.now()-drawTime;

gl.enable(gl.BLEND);
gl.blendEquation(gl.FUNC_ADD);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.blendFuncSeparate(
  gl.SRC_ALPHA, gl.ZERO, gl.ONE, gl.ZERO);
	}
					continue;
				}
				option = document.createElement('option');
				option.setAttribute('value', i);
				option.innerHTML = obj3d.scenes[i].name;
				sceneSelect.appendChild(option);
			}
		});
		
	}
	ret.start = function(){

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
		
		goMain = objMan.createObj(GoMain);

		Util.setFps(globalParam.fps,mainloop);
		Util.fpsman();

	}

	var canvas =document.createElement("canvas");
	canvas.width=WIDTH;
	canvas.height=HEIGHT;
	parentnode.appendChild(canvas);
	var canvasgl =document.createElement("canvas");
	canvasgl.width=WIDTH;
	canvasgl.height=HEIGHT;
	parentnode.appendChild(canvasgl);
	var ctx=canvas.getContext("2d");
	gl = canvasgl.getContext('webgl',{alpha:true}) || canvasgl.getContext('experimental-webgl');


	Util.init(canvas,canvasgl,parentnode);
	if(gl){
		globalParam.enableGL=true;
	}else{
		globalParam.enableGL=false;
	}
	globalParam.gl=gl;

	canvasgl.style.zoom="1.0";

	if(globalParam.enableGL){
		Rastgl.init(gl);
		canvas.style.width="0px";
		canvasgl.style.display="inline";
		//Ono3d.setDrawMethod(3);
	}else{
		canvasgl.style.display="none";
		canvas.style.display="inline";
	}
	var ono3d = new Ono3d()
	O3o.setOno3d(ono3d)
	ono3d.init(canvas,ctx);

	ono3d.rendercanvas=canvas;
	Rastgl.ono3d = ono3d;

	

	bufTexture=Ono3d.createTexture(1024,1024);
	gl.bindTexture(gl.TEXTURE_2D, bufTexture.glTexture);


	
	onoPhy = new OnoPhy();
	objMan = new ObjMan();

	inittime=Date.now();

	span=document.getElementById("cons");

	cube2lightfield1=Ono3d.loadShader("cube2lightfield.shader");
	cube2lightfield2=Ono3d.loadShader("cube2lightfield2.shader");
	cube2lightfield3=Ono3d.loadShader("cube2lightfield3.shader");
	sigmaShader=Ono3d.loadShader("sigma.shader");

	for(var i=0;i<9;i++){
		shShader.push(Ono3d.loadShader("sh"+i+".shader"));
	}
	return ret;
})()
