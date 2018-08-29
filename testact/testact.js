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
	var HEIGHT=540,WIDTH=960;
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

	var i;
	var pad =new Vec2();
	ret.pad = pad;

	var txt="STAGE CLEAR!!";
	var txt2="ALL CLEAR!!";

	var lightSun;
	var lightAmbient


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
			for(var i=0;i<this.objs.length;i++){
				if(obj === this.objs[i]){
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
			for(var i=0;i<8;i++){
				this.cameracol.poses.push(new Vec3());
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
		ret.prototype.calcCollision=function(){
			var v4=Vec4.poolAlloc();
			var im = Mat44.poolAlloc();
			Mat44.dot(im,ono3d.projectionMatrix,ono3d.viewMatrix);
			Mat44.getInv(im,im);
			for(var i=0;i<8;i++){
				Vec3.copy(v4,scope[i]);
				v4[3]=1;
				if(v4[2]<0){
					Vec4.mul(v4,v4,ono3d.znear);
				}else{
					Vec4.mul(v4,v4,ono3d.zfar);
				}
				Mat44.dotVec4(v4,im,v4);
				Vec3.copy(this.cameracol.poses[i],v4);
			}
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

			var cameralen = 5;//Vec3.len(this.p,vec3);
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

		var start = o3o.objectsN["_start"];
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

		//Vec3.set(goCamera.p,0,6,2)
		//var start = o3o.objectsN["_start"];
		//Mat43.dotVec3(goCamera.p,start.matrix,goCamera.p);
		//Mat44.dotVec3(goCamera.p,ono3d.worldMatrix,goCamera.p);
		//Vec3.set(goCamera.a,start.rotation);
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

				//物理シミュオブジェクトの設定
				t.phyObjs= O3o.createPhyObjs(o3o.scenes[0],onoPhy);
				t.collisions= O3o.createCollisions(o3o.scenes[0],onoPhy.collider);

				var border = t.collisions.find(function(o){return o.name==="_border";});
				if(border){
					border.callbackFunc=function(col1,col2,pos1,pos2){
						if(col2.name==="jiki"){
							//画面外侵入時
							reset();
						}
					}
				}

				ono3d.push();
				goJiki=objMan.createObj(GoJiki);
				ono3d.pop();

				reset();
				Vec3.copy(camera.p,goCamera.p)
				Vec3.copy(camera.a,goCamera.a)

				Vec3.set(camera.a,0,Math.PI,0)

				var m43 = Mat43.poolAlloc();
				//var goal= t.collisions.find(function(o){return o.name==="_goal";});
				//var goalobj = o3o.objectsN["_goal"];
				//onoPhy.collider.addCollision(goal);
				//Mat43.dotMat44Mat43(goal.matrix,ono3d.worldMatrix,goalobj.mixedmatrix);
				//goal.groups=2;
				//goal.bold=1;
				//goal.name="goal";
				//goal.callbackFunc=function(col1,col2,pos1,pos2){
				//	if(!col2.parent)return;
				//	if(col2.parent.name!=="jiki"){
				//		return;
				//	}
				//	onoPhy.collider.deleteCollision(col1);
				//	if(stage<stages.length-1){
				//		objMan.createObj(GoMsg);
				//	}else{
				//		objMan.createObj(GoMsg2);
				//	}
				//}
				//goal.update();

				//var collision= this.collisions.find(function(o){return o.name==="border";});
				//Mat43.dotMat44Mat43(collision.matrix,ono3d.worldMatrix,borderObj.mixedmatrix);
				//collision.groups=2;
				//collision.bold=0;
				//collision.name="border";
				//collision.update();

				var light=null;
				//ono3d.lightSources.splice(0,ono3d.lightSources.length);

				//light = new ono3d.LightSource();
				//ono3d.lightSources.push(light);
				//light.type =Ono3d.LT_AMBIENT;
				//Vec3.set(light.color,0.4,0.4,0.4);

				var scene = o3o.scenes[0];
				var m=Mat43.poolAlloc();

				for(var i=0;i<scene.objects.length;i++){
					var object = scene.objects[i];
					if(object.type!=="LAMP")continue;
					var ol = object.data;
					var element;
					if(ol.type==="SUN"){
						light = lightSun;
						element =document.getElementById("lightColor1");
					}else{
						light = lightAmbient;
						element =document.getElementById("lightColor2");
					}
					light.power=1;
					element.value=Util.rgb(ol.color[0],ol.color[1],ol.color[2]).slice(1);
					Util.fireEvent(element,"change");

					Mat43.fromLSE(object.matrix,object.location,object.scale,object.rotation);
					Mat44.dotMat43(light.matrix,ono3d.worldMatrix,object.matrix);
					Mat43.fromRotVector(m,Math.PI,1,0,0);
					Mat44.dotMat43(light.matrix,light.matrix,m);

					ono3d.setOrtho(10.0,10.0,1.0,20.0)
					var mat44 = ono3d.viewMatrix;//Mat44.poolAlloc();
					Mat44.getInv(mat44,light.matrix);
					Mat44.dot(light.viewmatrix,ono3d.projectionMatrix,mat44);


				}

				Mat43.poolFree(1);

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

			var m43 = Mat43.poolAlloc();
			if(field){
				if(field.scenes.length>0){
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
						if(l>0){
							continue;
						}
						if(globalParam.physics){
							O3o.drawObject(objects[i],phyObjs);
						}else{
							O3o.drawObject(objects[i],null);
						}
					}
				}
			}
			Mat43.poolFree(1);
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
		globalParam.outlineWidth=0;
		globalParam.outlineColor="000000";
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
		globalParam.hdr=1;
		globalParam.model="./field.o3o";
		globalParam.materialMode = false;
		globalParam.cColor= "ffffff";
		globalParam.cReflection= 0;
		globalParam.cReflectionColor= "ffffff";
		globalParam.cRoughness= 0;
		globalParam.frenel = 0;
		globalParam.cAlpha= 1.0;
		globalParam.cRefraction = 1.1;
		globalParam.cNormal= 1.0;
		globalParam.cEmi= 0.0;
		globalParam.shader=0;
		

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

		//var light=ono3d.lightSources[0];
		//Util.hex2rgb(light.color,globalParam.lightColor1);

		//light=ono3d.lightSources[1];
		//Util.hex2rgb(light.color,globalParam.lightColor2);

		ono3d.lightThreshold1=globalParam.lightThreshold1;
		ono3d.lightThreshold2=globalParam.lightThreshold2;

		Util.hex2rgb(lightSun.color,globalParam.lightColor1)
		Util.hex2rgb(lightAmbient.color,globalParam.lightColor2)

	
//シャドウマップ描画
		var start = Date.now();
		camera.calcMatrix();
		camera.calcCollision(camera.cameracol);

		if(globalParam.shadow){
			var lightSource = ono3d.lightSources.find(
				function(a){return a.type===Ono3d.LT_DIRECTION;});
			if(lightSource){
				camera.calcCollision(camera.cameracol2,lightSource.veiwmatrix);
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

		gl.bindFramebuffer(gl.FRAMEBUFFER,Rastgl.frameBuffer);
		ono3d.setViewport(0,0,1024,1024);
		gl.depthMask(true);
		gl.clearColor(1., 1., 1.,1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		if(globalParam.shadow){
			var lightSource = ono3d.lightSources.find(
				function(a){return a.type=== Ono3d.LT_DIRECTION;});
			if(lightSource){
				Shadow.draw(ono3d,lightSource.viewmatrix);
			}
		}
		gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
		gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,1024,1024);
		
		globalParam.stereo=-globalParam.stereoVolume * globalParam.stereomode*0.4;

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

		gl.viewport(0,0,WIDTH,HEIGHT);
//オブジェクト描画
		gl.depthMask(true);
		gl.enable(gl.DEPTH_TEST);
		ono3d.setViewport(0,0,WIDTH,HEIGHT);

		if(env2dtex){
			if(globalParam.shader===0){
				MainShader3.draw(ono3d,shadowTexture,env2dtex,camera.p);
			}else{
				MainShader4.draw(ono3d,shadowTexture,env2dtex,camera.p);
			}
		}
		Plain.draw(ono3d);
		gl.finish();
		
		//gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,WIDTH,HEIGHT);


		if(globalParam.hdr){
			//疑似HDRぼかし(α値が0が通常、1に近いほど光る)

			//描画結果をバッファにコピー
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.bindTexture(gl.TEXTURE_2D, bufTexture);
			gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,WIDTH,HEIGHT);

			var emiSize=0.5;
			gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
			ono3d.setViewport(0,0,WIDTH*emiSize,HEIGHT*emiSize);
			gl.depthMask(false);
			gl.disable(gl.DEPTH_TEST);
			gl.disable(gl.BLEND);
			Rastgl.copyframe(bufTexture ,0,0 ,WIDTH/1024,HEIGHT/1024); //今回結果を書き込み
			gl.enable(gl.BLEND);
			gl.blendFuncSeparate(gl.CONSTANT_ALPHA,gl.DST_ALPHA,gl.ZERO,gl.ZERO);
			gl.blendColor(0,0,0,0.4);
			Rastgl.copyframe(emiTexture ,0,0 ,WIDTH/1024,HEIGHT/1024); //前回の結果を重ねる
			gl.bindTexture(gl.TEXTURE_2D, emiTexture);
			gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,WIDTH*emiSize,HEIGHT*emiSize);//結果を光テクスチャに書き込み

			gl.clearColor(0.0,0.0,0.0,1.0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.disable(gl.DEPTH_TEST);
			gl.disable(gl.BLEND);
			Gauss.filter(WIDTH*emiSize,HEIGHT*emiSize,10
				,emiTexture,0,0,WIDTH*emiSize/512,HEIGHT*emiSize/512,512,512); //光テクスチャをぼかす
			
			gl.bindTexture(gl.TEXTURE_2D,emiTexture);
			gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,WIDTH*emiSize,HEIGHT*emiSize);

			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			ono3d.setViewport(0,0,WIDTH,HEIGHT);
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.ONE,gl.ONE);
			Rastgl.copyframe(emiTexture,0,0,WIDTH/1024,HEIGHT/1024); //メイン画面に合成
		}
//メインのバッファのアルファ値を1にする
		gl.viewport(0,0,WIDTH,HEIGHT);
		gl.colorMask(false,false,false,true);
		gl.clearColor(0.0,0.0,0.0,1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.colorMask(true,true,true,true);

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
		});
		emiTexture = Rastgl.createTexture(null,512,512);

		
		Util.setFps(globalParam.fps,mainloop);
		Util.fpsman();
	
		var checkbox=document.getElementById("notstereo");
		if(globalParam.stereomode==-1){
			checkbox=document.getElementById("parallel");
		}else if(globalParam.stereomode==1){
			checkbox=document.getElementById("cross");
		}
		checkbox.checked=1;
			
		var tags=["smoothing"
			,"lightColor1"
			,"lightColor2"
			,"lightThreshold1"
			,"lightThreshold2"
			,"outlineWidth"
			,"outlineColor"
			,"stereoVolume"
			,"shadow"
			,"hdr"

		];
		for(var i=0;i<tags.length;i++){
			(function(tag){
				var element = document.getElementById(tag);
				if(element.className=="colorpicker"){
					element.value=globalParam[tag];
					element.addEventListener("change",function(evt){globalParam[tag] = this.value},false);
				}else if(element.type=="checkbox"){
					element.checked=Boolean(globalParam[tag]);
					element.addEventListener("change",function(evt){globalParam[tag] = this.checked},false);
				}else{
					element.value=globalParam[tag];
					element.addEventListener("change",function(evt){globalParam[tag] = parseFloat(this.value)},false);
					if(!element.value){
						return;
					}
				}
				Util.fireEvent(element,"change");
			})(tags[i]);
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
		var ono3d = new Ono3d()
		ret.ono3d = ono3d;
		O3o.setOno3d(ono3d)
		ono3d.init(canvas,ctx);

		ono3d.rendercanvas=canvas;
		if(gl){
			globalParam.enableGL=true;
		}else{
			globalParam.enableGL=false;
		}
		globalParam.gl=gl;


		if(globalParam.enableGL){
			Rastgl.init(gl,ono3d);
			canvas.style.width="0px";
			canvasgl.style.display="inline";
			Ono3d.setDrawMethod(3);
		}else{
			canvasgl.style.display="none";
			canvas.style.display="inline";
		}

		ono3d.lightSources.splice(0,ono3d.lightSources.length);

		lightAmbient = new ono3d.LightSource();
		ono3d.lightSources.push(lightAmbient);
		lightAmbient.type = Ono3d.LT_AMBIENT;
		Vec3.set(lightAmbient.color,0.4,0.4,0.4);

		lightSun= new ono3d.LightSource();
		ono3d.lightSources.push(lightSun);
		lightSun.type =Ono3d.LT_DIRECTION;


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
		
	return ret;
})()
