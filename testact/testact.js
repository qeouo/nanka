"use strict"
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
var Testact=(function(){
	var ret={};
	var HEIGHT=512,WIDTH=960;
	var gl;
	var onoPhy=null;
	var env2dtex=null;
	var shadowTexture;
	var bufTexture;
	var emiTexture;
	var bdf;
	var bdfimage=null;
	var soundbuffer=null;

	var obj3d=null,field=null;
	var goField
		,goCamera
		,goJiki
		,goMain
	;
	var objMan;
	var probs = new Collider();
	ret.probs = probs;

	var i;
	var pad =new Vec2();
	ret.pad = pad;

	var txt="STAGE CLEAR!!";
	var txt2="ALL CLEAR!!";

	var averageTexture;


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
			if(this.pool.length==0){
				for(var i=0;i<16;i++){
					this.pool.push(new Obj());
				}
			}
			var obj = this.pool[this.pool.length-1];
			if(obj.stat<0){
				for(var i=0;i<16;i++){
					this.pool.push(new Obj());
				}
			}
			var obj = this.pool.pop();
			this.objs.push(obj);
			if(this.objs.length>1024){
				alert("objs>1024!");
			}

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

			obj.id=this.id;

			obj.__proto__=c.prototype;

			obj.init();

			this.id++;
			return obj;
			
		}
		ret.prototype.deleteObj=function(obj){
			var objs = this.objs;
			for(var i=0;i<objs.length;i++){
				if(obj === objs[i]){
					obj.stat=-10;
					this.pool.unshift(objs[i]);
					objs.splice(i,1);
					break;
				}
			}
		}
		ret.prototype.update=function(){
			var objs = this.objs;
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
	


	var stage =0;
	var stages=[
		"f1.o3o"
		,"f2.o3o"
		,"f3.o3o"
		,"f4.o3o"
		,"f5.o3o"
	]
	var GoMain = (function(){
		var GoMain=function(){};
		var ret = GoMain;
		inherits(ret,defObj);
		ret.prototype.init=function(){

			bdf = Bdf.load("./k8x12.bdf",null,function(){
				bdfimage = Bdf.render(txt+"\n"+txt2,bdf,false);
				bdfimage.gltexture = Rastgl.createTexture(bdfimage);//512x512

				gl.bindTexture(gl.TEXTURE_2D,bdfimage.gltexture);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
				gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);//1024x1024
				gl.viewport(0,0,1024,1024);
				gl.clearColor(.8,0.2,0.6,0.0);
				gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);
				gl.enable(gl.BLEND);
				gl.blendFuncSeparate(gl.ZERO,gl.ONE,gl.ONE,gl.ONE);
				var scl=2;//1;//1/8;
				var ss=1/512;
				for(var i=0;i<3;i++){
					for(var j=0;j<3;j++){
						Rastgl.copyframe(bdfimage.gltexture,-ss*i,-ss*j,scl,scl);
					}
				}
				gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE);
				gl.enable(gl.BLEND);
				gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE);
				Rastgl.copyframe(bdfimage.gltexture,-1*ss,-1*ss,scl,scl);
				gl.bindTexture(gl.TEXTURE_2D,bdfimage.gltexture);
				gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,512,512);

			});

			stage=-1;
			GoMain.prototype.next.call(this);
		
		}
		ret.prototype.next = function(){
			stage++;
			if(stages.length<=stage){
				return;
			}

			for(var i=objMan.objs.length;i--;){
				if(this == objMan.objs[i])continue;
				objMan.deleteObj(objMan.objs[i]);
			}
			fieldpath=stages[stage];
			if(globalParam.stage){
				fieldpath=globalParam.stage;
			}


			onoPhy.init();
			goField=objMan.createObj(GoField);
			goCamera = objMan.createObj(GoCamera);

		}
		ret.prototype.delete=function(){
		}
		
		return ret;

	})();

	var blit = function(tex,x,y,w,h,u,v,u2,v2){
			Rastgl.copyframe(tex.gltexture,x,y,w*2,h*2
							,u/tex.width,(v+v2)/tex.height,u2/tex.width,-v2/tex.height);
	}
	var GoMsg = (function(){
		var GoMsg=function(){};
		var ret = GoMsg;
		inherits(ret,defObj);
		ret.prototype.init=function(){
		}
		ret.prototype.move=function(){
			if(this.t>60){
				GoMain.prototype.next.call(goMain);
			}
		}
		ret.prototype.drawhud = function(){
			if(bdfimage){
				var width=txt.length*4;
				var height=12+1;
				var scale=4;
				gl.enable(gl.BLEND);
				gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE);
				blit(bdfimage,0,0,scale*width/WIDTH,scale*height/(WIDTH*ono3d.persy/ono3d.persx)
							,0,0,width,height);
			}
		}
		return ret;
	})();
	
	var GoMsg2 = (function(){
		var GoMsg2=function(){};
		var ret = GoMsg2;
		inherits(ret,defObj);
		ret.prototype.init=function(){
		}
		ret.prototype.move=function(){
			if(this.t>60){
			}
		}
		ret.prototype.drawhud = function(){
			if(bdfimage){
				var width=txt2.length*4;
				var height=12+1;
				var scale=4;
				gl.enable(gl.BLEND);
				gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE);

				blit(bdfimage,0,0,scale*width/WIDTH,scale*height/(WIDTH*ono3d.persy/ono3d.persx)
							,0,height,width,height);
			}
		}
		return ret;
	})();


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
			ono3d.setPers(this.zoom,HEIGHT/WIDTH);
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
	ret.camera = camera;

	var GoCamera= (function(){
		var GoCamera=function(){};
		var ret = GoCamera;
		inherits(ret,defObj);
		ret.prototype.init=function(){
			//onoPhy.collider.hitcheck(Collider.SPHERE,this.p);
		}
		ret.prototype.move=function(){

			if(!goJiki){
				return;
			}
			var vec3=Vec3.poolAlloc();
			Vec3.copy(vec3,goJiki.p);
			vec3[1]+=1;

			var cameralen = 8;//Vec3.len(this.p,vec3);
			camera.zoom=0.6;

			if(Util.pressOn){
				this.a[1]+=(-(Util.cursorX-Util.oldcursorX)/WIDTH)*2;
				this.a[0]+=(-(Util.cursorY-Util.oldcursorY)/HEIGHT)*2;

			}
			this.a[0] =Math.min(this.a[0],Math.PI/2);
			this.a[0] =Math.max(this.a[0],-Math.PI/2);
			this.p[2]=Math.cos(this.a[0]);
			this.p[1]=Math.sin(this.a[0]);
			this.p[0]=Math.sin(this.a[1])*this.p[2];
			this.p[2]=Math.cos(this.a[1])*this.p[2];

			Vec3.mul(this.p,this.p,-cameralen);
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


			Vec3.poolFree(1);
		}
		ret.prototype.draw=function(){
		}
		return ret;
	})();

	var homingCamera=function(angle,target,camera){
		var dx=target[0]-camera[0]
		var dy=target[1]-camera[1]
		var dz=target[2]-camera[2]
		angle[0]=Math.atan2(dy,Math.sqrt(dz*dz+dx*dx));
		angle[1]=Math.atan2(dx,dz);
		angle[2]=0;
		
	}
	var fieldpath="f1.o3o";
	var reset=function(){
		var o3o = field;
		ono3d.setTargetMatrix(0);
		ono3d.loadIdentity();
		ono3d.rotate(-Math.PI*0.5,1,0,0) //blenderはzが上なのでyが上になるように補正

		var start = o3o.objects.find(function(o){return o.name==="_start";});
		Mat44.dotVec3(goJiki.p,ono3d.worldMatrix,start.location);
		var m = Mat44.poolAlloc();
		Mat44.setInit(m);
		Mat44.dotMat43(m,m,start.matrix);
		Mat44.dot(m,ono3d.worldMatrix,m);
		Vec4.fromMat44(goJiki.rotq,m);

		Mat44.poolFree(1);

		if(goJiki.phyObjs.length){
			Vec3.copy(goJiki.phyObjs[0].location,goJiki.p);
		}

		goCamera.a[1]=start.rotation[2];
		Vec3.copy(goCamera.p,goJiki.p);

	}
	var GoField= (function(){
		var GoField =function(){};
		var ret = GoField;
		inherits(ret,defObj);
		ret.prototype.init=function(){
			var t = this;

			field =O3o.load(fieldpath,function(o3o){

				ono3d.setTargetMatrix(0);
				ono3d.loadIdentity();
				ono3d.rotate(-Math.PI*0.5,1,0,0) //blenderはzが上なのでyが上になるように補正

				var scene = o3o.scenes[0];

				//物理シミュオブジェクトの設定
				t.phyObjs= O3o.createPhyObjs(scene,onoPhy);


				var object = scene.objects.find(function(o){return o.name==="_border";});
				var collision= O3o.createCollision(object);
				collision.groups = 1;
				collision.callbackFunc=function(col1,col2,pos1,pos2){
					if(col2.name==="jiki"){
						//画面外侵入時
						reset();
					}
				}
				t.collisions=[];
				t.collisions.push(collision);
				
				object = scene.objects.find(function(o){return o.name==="_goal";});
				collision= O3o.createCollision(object);
				collision.groups = 1;
				collision.callbackFunc=function(col1,col2,pos1,pos2){
					if(!col2.parent)return;
					if(col2.parent.name!=="jiki"){
						return;
					}
					onoPhy.collider.deleteCollision(col1);
					if(stage<stages.length-1){
						objMan.createObj(GoMsg);
					}else{
						objMan.createObj(GoMsg2);
					}
				}
				t.collisions.push(collision);
				for(var i=0;i<t.collisions.length;i++){
					onoPhy.collider.addCollision(t.collisions[i]);
				}
				


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

				for(var i=0;i<ono3d.environments_index;i++){
					//環境マップ
					ono3d.environments[i].envTexture=env2dtex;
				}

				//0番目の光源セットをコントロールに反映
				var env = ono3d.environments[0];
				for(var i=0;i<2;i++){
					var ol = [env.sun,env.area][i];
					var el = document.getElementById("lightColor"+(i+1));
					el.value = Util.rgb(ol.color[0],ol.color[1],ol.color[2]).slice(1);
					Util.fireEvent(el,"change");
				}

				//カメラ反映等
				ono3d.push();
				goJiki=objMan.createObj(GoJiki);
				ono3d.pop();
				Vec3.copy(camera.p,goCamera.p)
				Vec3.copy(camera.a,goCamera.a)
				Vec3.set(camera.a,0,Math.PI,0)

				reset();

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
			O3o.setFrame(obj3d,scene,this.t/60.0*24); //アニメーション処理

			//コリジョンにアニメーション結果を反映させる
			for(var i=0;i<this.collisions.length;i++){
				var collision = this.collisions[i];
				var object = obj3d.objects.find(function(o){return o.name === collision.name;});
				O3o.moveCollision(collision,object,ono3d)
			}
			if(phyObjs && globalParam.physics){
				//物理シミュ有効の場合は物理オブジェクトにアニメーション結果を反映させる
				for(var i=0;i<phyObjs.length;i++){
					var phyObj = phyObjs[i];
					//物理オブジェクトにアニメーション結果を反映
					//(前回の物理シミュ無効の場合は強制反映する)
					O3o.movePhyObj(phyObj,phyObj.parent
						,1.0/globalParam.fps
						,!globalParam.physics_);
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
					//リセット
					O3o.movePhyObj(phyObj,phyObj.parent,0,true);
				}
			}
		}
		var cuboidcol = new Collider.Cuboid;
		ret.prototype.draw=function(){
			var phyObjs = this.phyObjs;

			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity();
			ono3d.rotate(-Math.PI*0.5,1,0,0)

			ono3d.rf=0;

			if(field){
				if(field.scenes.length>0){
					var m43 = Mat43.poolAlloc();
					var objects = field.scenes[0].objects;
					for(var i=0;i<objects.length;i++){
						if(objects[i].hide_render){
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
							var name = objects[i].name;
							phyObj= phyObjs.find(function(a){return a.name===name});
						}
						if(phyObj){
							Mat43.dot(cuboidcol.matrix,phyObj.matrix,m43);
						}else{
							Mat43.dot(m43,objects[i].mixedmatrix,m43);
							Mat43.dotMat44Mat43(cuboidcol.matrix,ono3d.worldMatrix,m43);
						}
						Mat43.getInv(cuboidcol.inv_matrix,cuboidcol.matrix);
						var l = Collider.checkHit(camera.cameracol,cuboidcol);
						var l2 = 1;
						if(globalParam.shadow){
							if(AABB.hitCheck(camera.cameracol2.AABB,cuboidcol.AABB)){
								l2 = Collider.checkHit(camera.cameracol2,cuboidcol);
							}
						}
						if(l>0 && l2>0){
							continue;
						}
						if(globalParam.physics){
							O3o.drawObject(objects[i],phyObjs);
						}else{
							O3o.drawObject(objects[i],null);
						}
					}
					Mat43.poolFree(1);
				}
			}
		}
		return ret;
	})();

	var sourceArmature=null;
	var referenceArmature=null;


	ret.assetload = function(obj3d,path,func){
		if(obj3d){
			func(obj3d);
			return obj3d;
		}
		return O3o.load(path,func);

	}

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
		globalParam.model="./f1.o3o";
		globalParam.materialMode = false;
		globalParam.cColor= "ffffff";
		globalParam.cReflection= 0;
		globalParam.cReflectionColor= "ffffff";
		globalParam.cRoughness= 0;
		globalParam.cTransRoughness= 0;
		globalParam.frenel = 0;
		globalParam.cAlpha= 1.0;
		globalParam.cRefraction = 1.1;
		globalParam.cNormal= 1.0;
		globalParam.cEmi= 0.0;
		globalParam.shader= 0;

	//カメラ露光
		globalParam.autoExposure=1;
		globalParam.exposure_level=0.5;
		globalParam.exposure_upper=2;
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
	
	
	var span;
	var oldTime = 0;
	var mseccount=0;
	var framecount=0;
	var inittime=0;
	var timer=0;
	var mainloop=function(){
		var nowTime = Date.now()
		timer=nowTime-inittime;
		
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
		var phytime=0;
		if(globalParam.physics){
			for(var i=0;i<globalParam.step;i++){
				var s=Date.now();
				onoPhy.calc(1.0/globalParam.fps/globalParam.step);
				phytime=Date.now()-s;
			}
			globalParam.physics_=1;
		}




		var cursorr = new Vec2();
		cursorr[0] =Util.cursorX/WIDTH*2-1;
		cursorr[1] =Util.cursorY/HEIGHT*2-1;
		if(globalParam.stereomode!=0){
			cursorr[0]*=2;
			if(cursorr[0]<0){
				cursorr[0]+=1;

				ono3d.projectionMat[12]=globalParam.stereo;
				Mat44.dot(ono3d.pvMat,ono3d.projectionMat,ono3d.viewMatrix);
			}else{
				cursorr[0]-=1;
			}
		}

		ono3d.rf=0;
		ono3d.lineWidth=1.0;
		ono3d.smoothing=globalParam.smoothing;

		var environment = ono3d.environments[0];
		Util.hex2rgb(environment.sun.color,globalParam.lightColor1)
		Util.hex2rgb(environment.area.color,globalParam.lightColor2)

		ono3d.lightThreshold1=globalParam.lightThreshold1;
		ono3d.lightThreshold2=globalParam.lightThreshold2;

	
		var start = Date.now();
		camera.calcMatrix();
		camera.calcCollision(camera.cameracol);
		var lightSource= null;

		if(globalParam.shadow){
			lightSource = ono3d.environments[0].sun;
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

		var drawgeometry=Date.now()-start;

		start=Date.now();



//遠景描画
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.BLEND);
		gl.depthMask(true);
		gl.viewport(0,0,1024,1024);
		gl.clearColor(0.0,0.0,0.0,0.0);
		gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);
		gl.depthMask(false);
		gl.colorMask(true,true,true,true);
		gl.disable(gl.BLEND);

		if(env2dtex){
			if(globalParam.stereomode==0){
				ono3d.setPers(camera.zoom,HEIGHT/WIDTH,1,20);
				ono3d.setViewport(0,0,WIDTH,HEIGHT);
				Env2D.draw(env2dtex,0,0,1,0.5);
			}else{
				ono3d.setPers(camera.zoom,HEIGHT/WIDTH*2,1,20);
				ono3d.setViewport(0,0,WIDTH/2,HEIGHT);
				Env2D.draw(env2dtex,0,0,1,0.5);
				ono3d.setViewport(WIDTH/2,0,WIDTH/2,HEIGHT);
				Env2D.draw(env2dtex,0,0,1,0.5);
				
			}
		}


//オブジェクト描画
		ono3d.setViewport(0,0,WIDTH,HEIGHT);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.depthMask(true);
		gl.enable(gl.DEPTH_TEST);
		ono3d.setViewport(0,0,WIDTH,HEIGHT);

		if(env2dtex){
			//Plain.draw(ono3d,0);
			if(globalParam.shader===0){
				if(globalParam.cMaterial){
					ono3d.render(shadowTexture,camera.p,customMaterial);
				}else{
					ono3d.render(shadowTexture,camera.p);
				}
			}else{
				MainShader2.draw(ono3d,shadowTexture,camera.p);
			}
		}
		gl.finish();
		

		//描画結果をバッファにコピー
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindTexture(gl.TEXTURE_2D, bufTexture);
		gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,WIDTH,HEIGHT);

		//画面平均光度算出
		if(globalParam.autoExposure){

			//ピクセル毎の光度と最大値を取得
			gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
			ono3d.setViewport(0,0,256,256);
			gl.bindTexture(gl.TEXTURE_2D,averageTexture);
			Rastgl.postEffect(bufTexture ,(WIDTH-512)/2.0/1024,0 ,512/1024,HEIGHT/1024,ono3d.shaders["average"]); 
			gl.bindTexture(gl.TEXTURE_2D, averageTexture);
			gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,256,256);

			//1/2縮小を繰り返し平均と最大値を求める
			var size = 256;
			for(var i=0;size>1;i++){
				ono3d.setViewport(0,0,size/2,size/2);
				Rastgl.postEffect(averageTexture ,0 ,0,size/512,size/512,ono3d.shaders["average2"]); 
				gl.bindTexture(gl.TEXTURE_2D, averageTexture);
				gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,size/2,size/2);
				size/=2;
			}
			ono3d.setViewport(0,511,1,1);
			Rastgl.postEffect(averageTexture ,0,511/512,1/512,1/512,ono3d.shaders["average3"]); 
			gl.bindTexture(gl.TEXTURE_2D, averageTexture);
			gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,511,0,511,1,1);

			//光度計算結果を取得
//			var u8 = new Uint8Array(4);
//			var a= new Vec4();
//			var b= new Vec4();
//			gl.readPixels(0,0,1,1, gl.RGBA, gl.UNSIGNED_BYTE, u8);
//			b[0]=u8[0]/255;
//			b[1]=u8[1]/255;
//			b[2]=u8[2]/255;
//			b[3]=u8[3]/255;
//			Rastgl.decode2(a,b);
//
//		//	//補間
//		//	a[0] = globalParam.exposure_level +(a[0] - globalParam.exposure_level)*0.1;
//		//	a[1] = globalParam.exposure_upper +(a[1] - globalParam.exposure_upper)*0.1;
//			document.getElementById("exposure_level").value = a[0];
//			document.getElementById("exposure_upper").value = a[1];
//			Util.fireEvent(document.getElementById("exposure_level"),"change");
//			Util.fireEvent(document.getElementById("exposure_upper"),"change");
//		//	globalParam.exposure_level = a[0];
//		//	globalParam.exposure_upper= a[1];

		}else{
			ono3d.setViewport(0,511,1,1);
			gl.useProgram(ono3d.shaders["fill"]);
			var a = new Vec4();
			Vec4.set(a,globalParam.exposure_level
				,globalParam.exposure_upper
				,0.5,0.5);
			Rastgl.encode2(a,a);
			gl.uniform4f(ono3d.shaders["fill"].unis["uColor"]
				,a[0],a[1],a[2],a[3]);
				
			Rastgl.postEffect(averageTexture,0,0,0,0,ono3d.shaders["fill"]); 
			gl.bindTexture(gl.TEXTURE_2D, averageTexture);
			gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,511,0,511,1,1);
		}
		var addShader = ono3d.shaders["add"];
		if(globalParam.exposure_bloom && addShader.program){

			//合成
			gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);

			gl.useProgram(addShader.program);
			gl.uniform1i(addShader.unis["uSampler2"],1);
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D,bufTexture);
			gl.uniform1f(addShader.unis["v1"],0.0);
			gl.uniform1f(addShader.unis["v2"],globalParam.exposure_bloom);
			
			var emiSize=0.5;
			ono3d.setViewport(0,0,WIDTH*emiSize,HEIGHT*emiSize);
			Rastgl.postEffect(emiTexture ,0,0 ,WIDTH/1024,HEIGHT/1024,addShader); 
			gl.bindTexture(gl.TEXTURE_2D, emiTexture);
			gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,WIDTH/2,HEIGHT/2);

			Gauss.filter(WIDTH*emiSize,HEIGHT*emiSize,100
				,emiTexture,0,0,WIDTH*emiSize/512,HEIGHT*emiSize/512,512,512); //光テクスチャをぼかす
			gl.bindTexture(gl.TEXTURE_2D, emiTexture);
			gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,WIDTH*emiSize,HEIGHT*emiSize);//結果を光テクスチャに書き込み

			//合成
			gl.bindFramebuffer(gl.FRAMEBUFFER,null );

			gl.useProgram(addShader.program);
			gl.uniform1i(addShader.unis["uSampler2"],1);
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D,emiTexture);
			gl.uniform1f(addShader.unis["v1"],1.0);
			gl.uniform1f(addShader.unis["v2"],1.0);

			ono3d.setViewport(0,0,WIDTH,HEIGHT);
			Rastgl.postEffect(bufTexture,0,0 ,WIDTH/1024.0,HEIGHT/1024,addShader); 

			gl.bindTexture(gl.TEXTURE_2D, bufTexture);
			gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,WIDTH,HEIGHT);
		}
		ono3d.setViewport(0,0,WIDTH,HEIGHT);
		gl.bindFramebuffer(gl.FRAMEBUFFER,null );

		var decodeShader = ono3d.shaders["decode"];
		gl.useProgram(decodeShader.program);
		gl.uniform1i(decodeShader.unis["uSampler2"],1);
		gl.uniform1f(decodeShader.unis["uAL"],globalParam.exposure_level);
		gl.uniform1f(decodeShader.unis["uLw"],globalParam.exposure_upper);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D,averageTexture);
		Rastgl.postEffect(bufTexture ,0,0 ,WIDTH/1024,HEIGHT/1024,decodeShader); 
		


		gl.finish();
		ono3d.clear();

		for(i=0;i<objMan.objs.length;i++){
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

		var drawrasterise=Date.now()-start;

		mseccount += (Date.now() - nowTime)
		framecount++
		if(nowTime-oldTime > 1000){
			var mspf=0;
			var fps = framecount*1000/(nowTime-oldTime)
			if(framecount!==0)mspf = mseccount/framecount
			
			Util.setText(span,fps.toFixed(2) + "fps " + mspf.toFixed(2) + "msec/f"
				   +"\n AABB " + onoPhy.collider.AABBTime+"ms(" + onoPhy.collider.collisions.length + ")"
				   +"\n Collision " + onoPhy.collider.collisionTime + "ms(" + onoPhy.collider.collisionCount+ ")"
				   +"\n Impulse " + onoPhy.impulseTime+"ms ,repetition " + onoPhy.repetition
				   +"\n PhyTime" + phytime
				   +"\n draw geometry " + drawgeometry +"ms"
				   +"\n draw rasterise " + drawrasterise +"ms" 
				   )
	
			framecount = 0
			mseccount=0
			oldTime = nowTime
		}
	}
	var parentnode = (function (scripts) {
		return scripts[scripts.length - 1].parentNode;
	}) (document.scripts || document.getElementsByTagName('script'));


	ret.loadModel=function(){
		obj3d=O3o.load(globalParam.model,function(){

			for(var i=0;i<obj3d.objects.length;i++){
				var object=obj3d.objects[i];
			}

			var sceneSelect = document.getElementById("scene");
			var option;
			for(var i=0;i<obj3d.scenes.length;i++){
				if(obj3d.scenes[i].name.indexOf("_",0)==0){
					continue;
				}
				option = document.createElement('option');
				option.setAttribute('value', i);
				option.innerHTML = obj3d.scenes[i].name;
				sceneSelect.appendChild(option);
			}
		});
		ret.obj3d = obj3d;
		
	}
	ret.start = function(){
		var select = document.getElementById("cTexture");
		var option;

		Ono3d.loadTexture("sky.jpg",function(image){
			var envsize=16;
			gl.colorMask(true,true,true,true);
			gl.disable(gl.BLEND);
			gl.disable(gl.DEPTH_TEST);

			env2dtex= Rastgl.createTexture(null,1024,1024);
			gl.clearColor(1.0,0.0,0.0,1.0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.bindTexture(gl.TEXTURE_2D,env2dtex);
			gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,1024,1024);

			gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
			EnvSet2D.draw(image.gltexture,image.width,image.height);
			gl.bindTexture(gl.TEXTURE_2D, image.gltexture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,image.width,image.height);

			var envsizeorg=envsize;
			var width=image.width;
			var height=image.height;
			var rough=0.125;

			gl.bindTexture(gl.TEXTURE_2D,env2dtex);
			gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,width,height);
			width>>=1;
			height>>=1;

			var envs=[0.06,0.24,0.54,1.0];
			for(var i=0;i<envs.length;i++){
				rough=envs[i];
				var tex = Rastgl.createTexture(0,width,height);

				ono3d.setViewport(0,0,width,height);
				Rough2D.draw(width,height,rough,image.gltexture);

				gl.bindTexture(gl.TEXTURE_2D,tex);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,width,height);
				
				Gauss.filter(width,height,10,tex,0,0,1,1,width,height); 

				gl.bindTexture(gl.TEXTURE_2D,env2dtex);
				gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,1024-height*2,0,0,width,height);
				gl.copyTexSubImage2D(gl.TEXTURE_2D,0,width,1024-height*2,0,0,width,height);
				gl.copyTexSubImage2D(gl.TEXTURE_2D,0,1024-width,1024-height*2,0,0,width,height);
				width>>=1;
				height>>=1;

			}
			
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);

			ono3d.environments[0].envTexture = env2dtex;
			ono3d.environments[1].envTexture=env2dtex;
		});
		emiTexture = Rastgl.createTexture(null,512,512);

		
		Util.setFps(globalParam.fps,mainloop);
		Util.fpsman();
	
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
	
		var control = document.getElementById("control");
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
		

		var userAgent = window.navigator.userAgent.toLowerCase();
		if (navigator.platform.indexOf("Win") != -1) {
			globalParam.windows=true;
		}else{
			globalParam.windows=false;
		}

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
		gl = canvasgl.getContext('webgl') || canvasgl.getContext('experimental-webgl');

		Util.enableVirtualPad=true;
		Util.init(canvas,canvasgl,parentnode);

		if(gl){
			globalParam.enableGL=true;
		}else{
			globalParam.enableGL=false;
		}
		globalParam.gl=gl;


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
		ret.ono3d = ono3d;
		O3o.setOno3d(ono3d)
		ono3d.init(canvas,ctx);
		ono3d.rendercanvas=canvas;
		Rastgl.ono3d = ono3d;


		var environment = ono3d.environments[0];
		ono3d.environments_index++;


		gl.clearColor(1, 1, 1,1.0);
		gl.clearColor(0.0,0.0,0.0,1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
	
		shadowTexture=Rastgl.createTexture(null,1024,1024);
		gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		bufTexture=Rastgl.createTexture(null,1024,1024);
		gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		onoPhy = new OnoPhy();
		ret.onoPhy = onoPhy;
		objMan = new ObjMan();

		goMain = objMan.createObj(GoMain);
		inittime=Date.now();

		span=document.getElementById("cons");

	averageTexture=Rastgl.createTexture(null,512,512);
	gl.bindTexture(gl.TEXTURE_2D, averageTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
	return ret;
})()
