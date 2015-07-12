"use strict"
var Test3d=(function(){
	var HEIGHT=480,WIDTH=360
	var canvas,canvasgl;
	var ctx;
	var div;
	var obj3d;
	var ret={};
	var oldTime = 0
	var span;
	var mseccount=0;
	var framecount=0;
	var camera;
	var camerazoom=1;
	var calcMat43=new Mat43();
	var calcVec3=new Vec3();
	var jikipos=new Vec3();
	var PI=Math.PI
	var OBJSLENGTH=1024;
	var i;
	var onoPhy=null;

	var STAT_EMPTY=0
		,STAT_ENABLE=1
		,STAT_CREATE=2

		,TYPE_EFFECT=i=0
		
		,MSG_CREATE=++i
		,MSG_MOVE=++i
		,MSG_DRAW=++i
		;
	
	var Obj = function(){
		this.p=new Vec3();
		this.scale=new Vec3();
		this.angle=0;
		this.v=new Vec3();
		this.a=new Vec3();
		this.pos2=new Vec3();
		this.stat=STAT_EMPTY;
		this.type=0;
		this.hp=1;
		this.t=0;
		this.hitareas=[];
		this.matrix=new Mat43();
		this.calcMat43=new Mat43();
	}	
	var createObj = function(func){
		for(i=0;i<OBJSLENGTH;i++){
			var obj=objs[i];
			if(obj.stat!==STAT_EMPTY)continue;
			obj.func=func;
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
			obj.type=TYPE_EFFECT;
			obj.func(obj,MSG_CREATE,0);
			return obj;
		}
		return null;
	}
	var deleteObj=function(obj){
		obj.stat=-10;
	}
	
	var objs=[];
	for(i=0;i<OBJSLENGTH;i++){
		var obj=new Obj();
		obj.num=i;
		objs.push(obj);
	}
	var defObj=function(obj,msg,param){
		switch(msg){
		case MSG_CREATE:
			break;
		case MSG_MOVE:
			break;
		case MSG_DRAW:
			break;
		case MSG_HIT:
			obj.hp--;
			break;
		case MSG_FRAMEOUT:
			deleteObj(obj);
			break;
		}
		return;
	}
	var phyObjs=null;
	var mainObj=function(obj,msg,param){
		switch(msg){
		case MSG_MOVE:
			if(obj3d.scenes.length===0){
				break;
			}
			if(phyObjs===null){
				if(obj3d.scenes.length>0){
					phyObjs=new Array();
					var scene=obj3d.scenes[0];
					for(i=0;i<scene.objects.length;i++){
						var phyobj=O3o.createPhyObjs(scene.objects[i],onoPhy);
						if(phyobj){
							phyObjs.push(phyobj);
						}
					}
				}
			}
			if(phyObjs && globalParam.physics){
				ono3d.setTargetMatrix(1)
				ono3d.loadIdentity()
				ono3d.setTargetMatrix(0)
				ono3d.loadIdentity()
				ono3d.rotate(-Math.PI*0.5,1,0,0)

				if(!globalParam.physics_){
					O3o.initPhyObjs(obj3d.scenes[0],(obj.t+1)*24/30,phyObjs);
					globalParam.physics_=true;
				}
				globalParam.physics_=globalParam.physics;

				O3o.movePhyObjs(obj3d.scenes[0],(obj.t+1)*24/globalParam.fps,phyObjs)
			}else{
				globalParam.physics_=false;
			}

			break;

		case MSG_DRAW:
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()

			ono3d.rotate(-Math.PI*0.5,1,0,0)
			if(obj3d){
				if(obj3d.scenes.length>0){
					if(globalParam.physics){
						O3o.drawScene(obj3d.scenes[0],obj.t*24/globalParam.fps,phyObjs);
					}else{
						O3o.drawScene(obj3d.scenes[0],obj.t*24/globalParam.fps,null);
					}
				}
			}
			break;
		}
		return defObj(obj,msg,param);
	}
		var url=location.search.substring(1,location.search.length)
		globalParam.outlineWidth=2;
		globalParam.outlineColor="000000";
		globalParam.lightcol1="ffffff";
		globalParam.lightcol2="808080";
		globalParam.lightThreshold1=0.5;
		globalParam.lightThreshold2=0.6;
		globalParam.physics=1;
		globalParam.smoothing=1;
		globalParam.stereomode=1;
		globalParam.stereoscope=1;
		globalParam.step2=1;
		globalParam.fps=30;
		globalParam.model="./raara.o3o";

		//if(url.length==0){
		//	url="model=raara.o3o&drawmethod=3&smoothing=1&outline=1";
		//}
		
		var args=url.split("&")

		for(i=args.length;i--;){
			var arg=args[i].split("=")
			if(arg.length >1){
				if(!isNaN(arg[1]) && arg[1]!=""){
					globalParam[arg[0]] = +arg[1]
				}else{
					globalParam[arg[0]] = arg[1]
				}
			}
		}
	
	var mainObj=createObj(mainObj);
	var camera=createObj(defObj);
	var mainloop=function(){
		var nowTime = new Date()
		var obj;

		if(obj3d.objects.length<=0){
			return;
		}
		var i;
		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat===STAT_CREATE){
				objs[i].stat=STAT_ENABLE;
			}
			if(objs[i].stat<0){
				objs[i].stat++;
			}
		}

		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat!==STAT_ENABLE)continue;
			objs[i].func(objs[i],MSG_MOVE,0);
		}
		if(globalParam.physics){
			onoPhy.calc(1.0/globalParam.fps,globalParam.step2);
		}
		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat!==STAT_ENABLE)continue;
			objs[i].t++;
			objs[i].frame++;
		}

		ono3d.setTargetMatrix(1)
		ono3d.loadIdentity()
		ono3d.scale(camerazoom,camerazoom,camerazoom)

		ono3d.rotate(-camera.a[2],0,0,1)
		ono3d.rotate(-camera.a[0],1,0,0)
		ono3d.rotate(-camera.a[1],0,1,0)
		ono3d.translate(-camera.p[0],-camera.p[1],-camera.p[2])

		ono3d.rf=0;
		if(globalParam.outlineWidth>0.){
			ono3d.lineWidth=globalParam.outlineWidth;
			ono3d.rf=Ono3d.RF_OUTLINE;
			Util.hex2rgb(ono3d.outlineColor,globalParam.outlineColor);
		}
		ono3d.smoothing=globalParam.smoothing;

		var light=ono3d.lightSources[0];
		Util.hex2rgb(light.color,globalParam.lightcol1);

		light=ono3d.lightSources[1];
		Util.hex2rgb(light.color,globalParam.lightcol2);

		ono3d.lightThreshold1=globalParam.lightThreshold1;
		ono3d.lightThreshold2=globalParam.lightThreshold2;

		for(i=0;i<OBJSLENGTH;i++){
			if(objs[i].stat!==STAT_ENABLE)continue;
			ono3d.push();
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()
			objs[i].func(objs[i],MSG_DRAW,0);
			ono3d.setTargetMatrix(1)
			ono3d.pop();
		}

		Rastgl.set(ono3d);
		globalParam.stereo=-globalParam.stereoscope * globalParam.stereomode;
		ono3d.setPers(1/2,HEIGHT/WIDTH/2)
		ono3d.projectionMat[8]=-globalParam.stereo/5;
		ono3d.projectionMat[12]=globalParam.stereo;

		globalParam.gl.viewport(0,0,WIDTH,HEIGHT);

		ono3d.render(Util.ctx)

		globalParam.stereo=globalParam.stereoscope * globalParam.stereomode;
		ono3d.projectionMat[8]=-globalParam.stereo/5;
		ono3d.projectionMat[12]=globalParam.stereo;
		globalParam.gl.viewport(WIDTH,0,WIDTH,HEIGHT);
		ono3d.render(Util.ctx)

		ono3d.clear()


		mseccount += (new Date() - nowTime)
		framecount++
		if(nowTime-oldTime > 1000){
			var mspf=0;
			var fps = framecount*1000/(nowTime-oldTime)
			if(framecount!==0)mspf = mseccount/framecount
			
			Util.setText(span,fps.toFixed(2) + "fps " + mspf.toFixed(2) + "msec")
	
			framecount = 0
			mseccount=0
			oldTime = nowTime
		}
	}
	var parentnode = (function (scripts) {
		return scripts[scripts.length - 1].parentNode;
	}) (document.scripts || document.getElementsByTagName('script'));


	var div=document.createElement("div");
	parentnode.appendChild(div);
	canvas =document.createElement("canvas");
	canvas.width=WIDTH;
	canvas.height=HEIGHT;
	parentnode.appendChild(canvas);
	canvasgl =document.createElement("canvas");
	canvasgl.width=WIDTH*2;
	canvasgl.height=HEIGHT;
	parentnode.appendChild(canvasgl);
	ctx=canvas.getContext("2d");
	var gl = canvasgl.getContext('webgl') || canvasgl.getContext('experimental-webgl');

	Util.init(canvas,document.body);
	var ono3d = new Ono3d()
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
		Rastgl.init(gl);
		canvas.style.display="none";
		canvasgl.style.display="inline";
		Ono3d.setDrawMethod(3);
	}else{
		canvasgl.style.display="none";
		canvas.style.display="inline";
	}

	gl.clearColor(1, 1, 1,1.0);

	obj3d=O3o.load(globalParam.model);
	
	onoPhy = new OnoPhy();
	Util.setFps(globalParam.fps,mainloop);
	Util.fpsman();

	var light = new ono3d.LightSource()
	light.type =Ono3d.LT_DIRECTION
	Vec3.set(light.angle,-0.3,-0.5,-0.5);
	light.power=1
	light.color[0]=1
	light.color[1]=1
	light.color[2]=1
	Vec3.norm(light.angle)
	ono3d.lightSources.push(light)
	light = new ono3d.LightSource()
	light.type =Ono3d.LT_AMBIENT
	light.color[0]=0.2
	light.color[1]=0.2
	light.color[2]=0.2
	ono3d.lightSources.push(light)
	Vec3.set(camera.p,0,6,10)
	Vec3.set(camera.a,0,Math.PI,0)

	span=document.getElementById("cons");
	ret.setPhysics=function(flg){
		globalParam.physics=flg;
//		if(globalParam.physics === flg){
//			return;
//		}
//		if(flg && obj3d.scenes){
//			var obj=mainObj;
//			ono3d.setTargetMatrix(1)
//			ono3d.loadIdentity()
//			ono3d.setTargetMatrix(0)
//			ono3d.loadIdentity()
//			ono3d.rotate(-Math.PI*0.5,1,0,0)
//			ono3d.scale(-1,1,1)
//			O3o.initPhyObjs(obj3d.scenes[0],0,phyObjs);
//		}

	}
	var homingCamera=function(angle,target,camera){
		var dx=target[0]-camera[0]
		var dy=target[1]-camera[1]
		var dz=target[2]-camera[2]
		angle[0]=Math.atan2(dy,dz)+Math.PI;
		angle[1]=Math.atan2(dx,dz);
		angle[2]=0;
	}
	return ret;
})()
