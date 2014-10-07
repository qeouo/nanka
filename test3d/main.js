"use strict"
var Main=(function(){
var 
	devObj
	,objman
	,ono3d
	,onoPhy
	,obj3d
	,phyObjs
	,envtex
	,imagedata
	,objcube=null

var ret=function(){}

var frame = 0
var viewscale=1
var light1;
var objControl = (function(){
	var light
		,viewx,viewy,viewz,views
		,viewpos=new Vec3()
		,pos=new Vec3()
	
	var ret=function(){}
	ret.f_create= function(obj,param){
		frame =  0
		viewx = -Math.PI/64
		viewy = Math.PI
		viewz = 0
		views = 1
		obj.z=100

		light = new ono3d.LightSource()
		light.type =Ono3d.LT_DIRECTION
		light.angle[0] = -0.4
		light.angle[1] = -0.4
		light.angle[2] = -0.4
		light.power=1
		Vec3.norm(light.angle)
	//	ono3d.lightSources.push(light)
		light1=light;
		light = new ono3d.LightSource()
		light.type =Ono3d.LT_AMBIENT
		light.power =1
		ono3d.lightSources.push(light)
	}
	ret.f_move=function(obj,param){
		if(obj3d && phyObjs==null){
			if(obj3d.scenes.length>0){
				phyObjs=O3o.createPhyObjs(obj3d,onoPhy);
				ono3d.setTargetMatrix(0)
				ono3d.loadIdentity()
				ono3d.rotate(-Math.PI*0.5,1,0,0)
				O3o.initPhyObjs(obj3d.scenes[0],0,phyObjs);
			}
		}
		
		ono3d.rf = 0
		ono3d.rf |= Ono3d.RF_SHADE

		if(global_param.wireframe) ono3d.rf |=Ono3d.RF_LINE
		if(global_param.usetexture) ono3d.rf |=Ono3d.RF_TEXTURE
		//ono3d.rf |=Ono3d.RF_ENVMAP
		ono3d.envTexture=envtex
		if(global_param.outline) ono3d.rf |=Ono3d.RF_OUTLINE
		ono3d.smoothing=global_param.smoothing
		if(global_param.phongshading)ono3d.rf|=Ono3d.RF_PHONGSHADING;
	
		if(Util.pressOn){
			viewy = viewy + (Util.cursorX - Util.oldcursorX)*0.01
			viewx = viewx - (Util.cursorY - Util.oldcursorY)*0.01
		}
		if(global_param.perscollect)ono3d.rf|=Ono3d.RF_PERSCOLLECT
		if(global_param.depthtest)ono3d.rf|=Ono3d.RF_DEPTHTEST

		if(viewx>Math.PI/2)viewx = Math.PI/2
		if(viewx<-Math.PI/2)viewx = -Math.PI/2
		viewpos[2]=Math.cos(viewx)
		viewpos[1]=Math.sin(viewx)-0.2;
		viewpos[0]=-Math.sin(viewy)*viewpos[2]
		viewpos[2]=Math.cos(viewy)*viewpos[2]

		Vec3.mult(viewpos,viewpos,-20)
		if(Util.wheelDelta<0)views+=0.1
		if(Util.wheelDelta>0)views-=0.1

		ono3d.setTargetMatrix(0)
		ono3d.loadIdentity()
		ono3d.rotate(-Math.PI*0.5,1,0,0)
		if(obj3d){
			if(obj3d.scenes.length>0){
				O3o.movePhyObjs(obj3d.scenes[global_param.scene],frame*24/30,phyObjs)
			}
		}
		ono3d.setTargetMatrix(1)
		ono3d.loadIdentity()
		ono3d.scale(viewscale,viewscale,viewscale)
		ono3d.rotate(viewz,0,0,1)
		ono3d.rotate(viewx,1,0,0)
		ono3d.rotate(viewy,0,1,0)
		ono3d.translate(-viewpos[0],-viewpos[1],-viewpos[2])

		ono3d.setTargetMatrix(0)
		ono3d.setPers(views,views)

		frame++;
	}
	ret.f_draw=function(obj,param){
		var ctx=Util.ctx
		ctx.setTransform(1,0,0,1,0,0)
		ctx.globalCompositeOperation='source-over'
		if(global_param.drawmethod!=9){
			ctx.clearRect(0,0,Util.canvas.width,Util.canvas.height)
		}
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()

			Mat43.dot(ono3d.transMat,ono3d.viewMatrix,ono3d.worldMatrix)

		ono3d.bold=1
		var rf =ono3d.rf;
		ono3d.mrr=0;
		ono3d.texture=null;
		ono3d.rf=0;
		if(global_param.perscollect)ono3d.rf|=Ono3d.RF_PERSCOLLECT
		if(global_param.depthtest)ono3d.rf|=Ono3d.RF_DEPTHTEST
		ono3d.begin(Ono3d.OP_LINES)
		ono3d.color=0xfffff0000
		ono3d.setVertex(3,0,0)
		ono3d.setVertex(0,0,0)
		ono3d.color=0xfff00ff00
		ono3d.setVertex(0,3,0)
		ono3d.setVertex(0,0,0)
		ono3d.color=0xfff0000ff
		ono3d.setVertex(0,0,3)
		ono3d.setVertex(0,0,0)
		ono3d.end()
		ono3d.rf=rf;

		if(0){
			ono3d.getPos(pos,2,0,0)
			ctx.fillStyle="#000000"
			var x,y
			x=pos[0]*Util.canvas.width +0.5|0
			y=pos[1]*Util.canvas.height +0.5|0
			ctx.fillRect(x,y,8,8)
			Util.drawText(ctx,x,y,"X",fontimg,8,8)
			
			ono3d.getPos(pos,0,2,0)
			x=pos[0]*Util.canvas.width +0.5|0
			y=pos[1]*Util.canvas.height +0.5|0
			ctx.fillRect(x,y,8,8)
			Util.drawText(ctx,x,y,"Y",fontimg,8,8)
			
			ono3d.getPos(pos,0,0,2)
			x=pos[0]*Util.canvas.width +0.5|0
			y=pos[1]*Util.canvas.height +0.5|0
			ctx.fillRect(x,y,8,8)
			Util.drawText(ctx,x,y,"Z",fontimg,8,8)
		}

		var mesh
		var i,j
		if(obj3d){
			if(!obj3d.meshes.length)return
			ono3d.rotate(-Math.PI*0.5,1,0,0)
			
			O3o.drawScene(obj3d.scenes[global_param.scene],frame*24/30,phyObjs)
		}
		if(global_param.drawmethod==9){
			ono3d.targetImageData = imagedata
			ono3d.rendercanvas = Util.canvas
			Rastono.clear(imagedata)
		}else if(global_param.drawmethod==3){
			Rastgl.set(ono3d);
		}else{
			ono3d.drawTarget=Util.ctx
			ono3d.rendercanvas = Util.canvas
		}
		if(global_param.wireframe){
			ono3d.color =0x7f00ff00
			ono3d.bold =1
			ono3d.render_lineonly(Util.ctx)
		}else{
			ono3d.render(Util.ctx)
		}
		ono3d.clear()
		if(global_param.drawmethod==9){
			Util.ctx.putImageData(imagedata,0,0)
		}else{
			Util.ctx.setTransform(1,0,0,1,0,0)
			Util.ctx.globalCompositeOperation='source-over'
			Util.ctx.globalAlpha= 1 
		}
	}
	return ret
})()

var objCube = (function(){
	var ret=function(){}
	ret.f_create=function(obj,param){
		obj.z=10
		obj.initflg=false
	}
	ret.f_move=function(obj,param){
		if(!obj3d.meshes.length)return
		if(!obj.initflg){
			obj.initflg=true

			var i,imax,vertexnum=0,facenum=0
			for(i=obj3d.meshes.length;i--;){
				vertexnum+=obj3d.meshes[i].vertices.length
				facenum+=obj3d.meshes[i].faces.length
			}

			if(vertexnum>1000 || facenum>1000){
				//obj3d=null
				objman.deleteObj(obj)
				alert("err")
				return
			}
			//scaling
			var max,scalar,i,j,vertices
			max=1
			for(i=obj3d.meshes.length;i--;){
				vertices=obj3d.meshes[i].vertices
				for(j=vertices.length;j--;){
					scalar=Vec3.scalar(vertices[j].pos)
					if(max<scalar)max=scalar
				}
			}
			var cmb_scene = document.getElementById("cmb_scene")
			var opt

			cmb_scene.disabled=false
			while(cmb_scene.firstChild){
				cmb_scene.removeChild(cmb_scene.firstChild);
			}
			var sp_scene= document.getElementById("sp_scene")
			if(obj3d.scenes.length<=1 && obj3d.armatures.length==1){
				for(i=0,imax=obj3d.actions.length;i<imax;i++){
					opt=document.createElement("option")
					opt.value=i
					Util.setText(opt,obj3d.actions[i].name)
					cmb_scene.appendChild(opt)
				}
				Util.setText(sp_scene,"action")
			}else{

				for(i=0,imax=obj3d.scenes.length;i<imax;i++){
					opt=document.createElement("option")
					opt.value=i
					Util.setText(opt,obj3d.scenes[i].name)
					cmb_scene.appendChild(opt)
				}
				Util.setText(sp_scene,"scene")
				if(obj3d.scenes.length<=1){
					cmb_scene.disabled=true
				}
			}

			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()
			
			obj.phyObjs=O3o.createPhyObjs(obj3d,onoPhy)
			return
		}	
		ono3d.setTargetMatrix(0)
		ono3d.loadIdentity()
	
		O3o.movePhyObjs(obj3d,obj.phyObjs)
	}
	ret.f_draw=function(obj,param){

	}
	return ret
})()

var cons
var mainfunc=(function(){
	var oldTime = 0
		,mseccount=0
		,mspf =0
		,framecount=0
		,fps=0
	return function(){
		Util.canvas.hidden=true
		var nowTime = new Date()
		var n=5,i
	
		objman.move()
		for(i=n;i--;){
			
			onoPhy.calc(1.0/(30*n))
		}
		Ono3d.setDrawMethod(global_param.drawmethod)
		objman.draw()
	
		mseccount += (new Date() - nowTime)
		framecount++
		if(nowTime-oldTime > 1000){
			fps = framecount*1000/(nowTime-oldTime)
			if(framecount!=0)mspf = mseccount/framecount
			
			Util.setText(cons,fps.toFixed(2) + "fps " + mspf.toFixed(2) + "msec")
	
			framecount = 0
			mseccount=0
			oldTime = nowTime
		}
		Util.canvas.hidden=false
	}
})()

	ret.init=function(){
		cons = document.getElementById("status_a")
		
		objman= new Objman()
		ono3d = new Ono3d()
		O3o.setOno3d(ono3d)
		ono3d.init(Util.canvas,Util.ctx)

		

		Ono3d.setDrawMethod(global_param.drawmethod)

		if(Util.ctx.createImageData)
		imagedata = Util.ctx.createImageData(Util.canvas.width,Util.canvas.height)

		//ono3d.backTexture=back
	
		if(global_param.enableGL){
			envtex = Util.loadImage("lib/envtex.png",1);
		}else{
			envtex = Util.loadImage("lib/envtex.png");	
		}

		onoPhy = new OnoPhy()

		objman.createObj(objControl)

		Util.setFps(global_param.fps,mainfunc)
		Util.fpsman()
		if(global_param.model){
			obj3d = O3o.load("./"+global_param.model+"?"+Date.now())
		}
		

	}

	return ret;
})()
