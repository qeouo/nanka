"use strict"
var O3o=(function(){
	var i
	,bV0 = new Vec3()
	,bV1 = new Vec3()
	,bVec4=new Vec4()
	,bM=new Mat43()
	,bM2=new Mat43()
	
	,motionBufs = new Array(128)
	,groupMatricies = new Array(32)
	,groupMatFlg= new Array(32)
	,defMatrix = new Mat43()
	,bufVertices=new Array(2048)
	,bufFaces = new Array(2048)
	,rvIndex,rvSize
	,rfIndex,rfSize

	
	var typeConvert = new Object()
	typeConvert["SPRING_MESH"]=OnoPhy.SPRING_MESH
	typeConvert["CUBOID"]=OnoPhy.CUBOID
	typeConvert["SPHERE"]=OnoPhy.SPHERE
	typeConvert["ELLIPSE"]=OnoPhy.ELLIPSE
	typeConvert["ELLIPSOLID"]=OnoPhy.ELLIPSOLID
	typeConvert["CAPSULE"]=OnoPhy.CAPSULE
	typeConvert["ELLIPSOLID_CAPSULE"]=OnoPhy.ELLIPSOLID_CAPSULE
	
	var  REPEAT_NONE = i=0
	, REPEAT_LOOP = ++i
	,REPEAT_LINER = ++i
	,repeatConvert = new Object()
	repeatConvert["NONE"] = REPEAT_NONE
	repeatConvert["LOOP"] = REPEAT_LOOP
	repeatConvert["LINER"] = REPEAT_LINER
	
	var INTERPOLATE_LINER = i=0
	,INTERPOLATE_SPLINE = ++i
	,interpolateConvert = new Object()
	interpolateConvert["LINER"] = INTERPOLATE_LINER
	interpolateConvert["SPLINE"] = INTERPOLATE_SPLINE
	
	var OBJECT_MESH = i=1
	,OBJECT_COLLISION= ++i
	,OBJECT_ARMATURE= ++i

	var FCURVE_ROT_QUAT = i=1
	,FCURVE_ROT_EULERX = ++i
	,FCURVE_ROT_EULERY = ++i
	,FCURVE_ROT_EULERZ = ++i
	,FCURVE_LOCATIONX = ++i
	,FCURVE_LOCATIONY = ++i
	,FCURVE_LOCATIONZ = ++i
	,FCURVE_SCALEX= ++i
	,FCURVE_SCALEY= ++i
	,FCURVE_SCALEZ= ++i
	,FCURVE_SHAPEKEY = ++i 
	,fcurveConvert = Object()
	fcurveConvert["rotation_quaternion"]=FCURVE_ROT_QUAT
	fcurveConvert["rotation_eulerX"]=FCURVE_ROT_EULERX
	fcurveConvert["rotation_eulerY"]=FCURVE_ROT_EULERY
	fcurveConvert["rotation_eulerZ"]=FCURVE_ROT_EULERZ
	fcurveConvert["locationX"]=FCURVE_LOCATIONX
	fcurveConvert["locationY"]=FCURVE_LOCATIONY
	fcurveConvert["locationZ"]=FCURVE_LOCATIONZ
	fcurveConvert["scaleX"]=FCURVE_SCALEX
	fcurveConvert["scaleY"]=FCURVE_SCALEY
	fcurveConvert["scaleZ"]=FCURVE_SCALEZ
	fcurveConvert["value"]=FCURVE_SHAPEKEY

	var QUATERNION=i=0
	,EULER_XYZ=1
	,EULER_XZY=6
	,EULER_YXZ=5
	,EULER_YZX=2
	,EULER_ZXY=4
	,EULER_ZYX=3
	,rotationMode={}
	rotationMode["QUATERNION"]=QUATERNION
	rotationMode["XYZ"]=EULER_XYZ
	rotationMode["XZY"]=EULER_XZY
	rotationMode["YXZ"]=EULER_YXZ
	rotationMode["YZX"]=EULER_YZX
	rotationMode["ZXY"]=EULER_ZXY
	rotationMode["ZYX"]=EULER_ZYX


	//モーションバッファ
	var MotionBuf = function(){
		this.name=""
		this.flg=0
		this.matrix=new Mat43()
	}
	//モデル描画計算用バッファ
	function bufFace (){
		this.normal=new Vec3()
		this.l=0
		this.angle=new Vec3()
	}
	
	for(i=motionBufs.length;i--;)motionBufs[i] = new MotionBuf()
	for(i=groupMatricies.length;i--;)groupMatricies[i] = new Mat43()
	for(i=bufFaces.length;i--;)bufFaces[i] = new bufFace()

	//モデルオブジェクト
	var O3o = function(){
		this.scenes = new Array()
		this.objects = new Array()
		this.textures = new Array()
		this.materials = new Array()
		this.meshes = new Array()
		this.armatures = new Array()
		this.actions = new Array()
		this.collisions = new Array()

	}
	O3o.defaultMaterial=defaultMaterial
	O3o.useDefaultMaterial=false
	
	var ono3d = null
	O3o.setOno3d = function(a){
		ono3d=a
	}

	var SceneObject = function(){
		this.matrix=new Mat43();
		this.imatrix=new Mat43();
		this.iparentmatrix=new Mat43();
		this.actmatrix=new Mat43()
		this.action
		this.data
		this.parent
		this.type
		this.groups=new Array()
		this.modifiers=new Array();
		this.location=new Array(3);
		this.rotation_mode=EULER_XYZ;
		this.rotation=new Array(4);
		this.scale=new Array(3);
		this.posebones = new Array();
	}
	var PoseBone = function(){
		this.bone;
		this.location=new Array(3);
		this.rotation_mode=QUATERNION;
		this.rotation=new Array(4);
		this.scale=new Array(3);
		this.actmatrix=new Mat43()
	}
	var Scene = function(){
		this.objects= new Array()
	}
	//テクスチャ
	var Texture = function(){
		this.path
		this.image
	}
	//マテリアル
	var Material = function(){
		this.texture=null
		this.r=1.0
		this.g=1.0
		this.b=1.0
		this.a=1.0
		this.dif=1.0
		this.mrr=0.0
		this.emt=0.0
		this.spc=0.0
		this.spchard=0
		this.normal=0
	}
	O3o.Material=Material
	var defaultMaterial= O3o.defaultMaterial= new Material()

	//骨組み
	var Armature = function(){
		this.name="noname"
		this.bones=new Array()
	}
	Armature.prototype.objecttype=OBJECT_ARMATURE
	//骨
	function Bone(){
		this.name
		this.matrix = new Mat43()
		this.imatrix = new Mat43()
	}
	O3o.Bone = Bone
	//当たり判定
	var Collision = function(){
		this.type
		this.parent
	}
	Collision.prototype.objecttype=OBJECT_COLLISION
	
	var ShapeKey = function(){
		this.shapeKeyPoints = new Array()
	}
	//モデル
	var Mesh = function(){
		this.parent=null
		this.parent_bone=null
		this.render=1
		this.vertices = new Array()
		this.shapeKeys = new Array()
		this.faces = new Array()
		this.edges = new Array()
		this.groups=new Array()
		this.flg=0
		this.type=""
	}
	Mesh.prototype.objecttype=OBJECT_MESH
	O3o.Mesh = Mesh
	//頂点グループ
	var Group = function(){
		this.name=""
	}
	//頂点
	var Vertex = function(){
		this.pos = new Vec3()
		this.normal = new Vec3()
		this.groups = new Array()
		this.groupretios = new Array()
	}
	O3o.Vertex=Vertex

	var ShapeKey = function(){
		this.name=""
		this.shapeKeyPoints = new Array()
	}
	//面
	var Face =function(){
		this.uv = new Array(8)
		this.normal = new Vec3()
		this.idx = new Array(4)
		this.idx[0]=-1
		this.idx[1]=-1
		this.idx[2]=-1
		this.idx[3]=-1
		this.material = null 
		this.flg=0
		this.idxnum=3
	}
	O3o.Face=Face
	//線
	var Edge = function(){
		this.v0 = -1
		this.v1 = -1
		this.f0 = -1
		this.f1 = -1
		this.l=0
	}
	O3o.Edge=Edge

	//アクション
	function Action(){
		this.name
		this.fcurves = new Array()
	}
	//fcurve
	function Fcurve(){
		this.target =""
		this.type =0
		this.interpolatemode=INTERPOLATE_LINER
		this.repeatmode = REPEAT_NONE
		this.keys = new Array()
		this.params = new Array()
	}
	function readValue(obj,line){
		var value
		,name
		,blocks = line.split(";")
		,i,j,imax
		for(j=blocks.length;j--;){
			if(!blocks[j].match(/^\s*(\S+)\s*:\s*(.+?)\s*$/))continue
			name=RegExp.$1
			value=RegExp.$2


			var resArray = value.split(",")
			
	
			if(resArray.length==1){
				value = resArray[0].replace(/^\s+|\s+$/g, "");
				if(value.match(/\"(.+?)\"/)){
					value=RegExp.$1
				}else if(""+parseInt(value)==value){
					value=parseInt(value)
				}else if(!isNaN(parseFloat(value))){
					value = parseFloat(value)
				}
				obj[name] = value
			}else{
				for(i=0,imax=resArray.length;i<imax;i++){
					value = resArray[i].replace(/^\s+|\s+$/g, "");
					
					if(value.match(/\"(.+?)\"/)){
						value=RegExp.$1
					}else if(""+parseInt(value)==value){
						value=parseInt(value)
					}else if(!isNaN(parseFloat(value))){
						value = parseFloat(value)
					}
					obj[name][i] = value
				}
			}
		}
	}
	function readValue2(line){
		var value
		,name
		,blocks = line.split(";")
		,i,j,imax
		var obj=new Object()
		
		for(j=blocks.length;j--;){
			if(!blocks[j].match(/^\s*(\S+)\s*:\s*(.+?)\s*$/))continue
			name=RegExp.$1
			value=RegExp.$2

			var resArray = value.split(",")
			
			obj[name] = new Array()
			for(i=0,imax=resArray.length;i<imax;i++){
				value = resArray[i].replace(/^\s+|\s+$/g, "");
				
				if(value.match(/\"(.+?)\"/)){
					value=RegExp.$1
				}else if(""+parseInt(value)==value){
					value=parseInt(value)
				}else if(!isNaN(parseFloat(value))){
					value = parseFloat(value)
				}
				obj[name].push(value)
				
			}

		}
		return obj
	}

	function readMatrixData(matrix,line){
		var res = line.match(/[\.\-\d]+/g)
		matrix[0] = parseFloat(res[0])
		matrix[1] = parseFloat(res[1])
		matrix[2] = parseFloat(res[2])
		//matrix[3] = parseFloat(res[12])
		matrix[4] = parseFloat(res[4])
		matrix[5] = parseFloat(res[5])
		matrix[6] = parseFloat(res[6])
		//matrix[7] = parseFloat(res[13])
		matrix[8] = parseFloat(res[8])
		matrix[9] = parseFloat(res[9])
		matrix[10] = parseFloat(res[10])
		//matrix[11] = parseFloat(res[14])
		matrix[12] = parseFloat(res[12])
		matrix[13] = parseFloat(res[13])
		matrix[14] = parseFloat(res[14])
		//matrix[15] = parseFloat(res[15])
	}

	var seek=function(data){
		var res
		var index2 = data.src.indexOf("\n",data.index)
		if(index2<0)return null
		res = data.src.substring(data.index,index2)
		data.index=index2 + 1
		if(/^[\]\}]/.test(res))return null
		return res
		
	}
	var createXMLHttpRequest = function(){
	  if (window.XMLHttpRequest) {
		return new XMLHttpRequest()
	  } else if (window.ActiveXObject) {
		try {
		  return new ActiveXObject("Msxml2.XMLHTTP")
		} catch (e) {
		  try {
			return new ActiveXObject("Microsoft.XMLHTTP")
		  } catch (e2) {
			return null
		  }
		}
	  } else {
		return null
	  }
	}
	
	var onloadfunc= function(o3o,url,buf){
		var i,imax,j,jmax
		if(buf.substring(0,11) =="Metasequoia"){
			var mqo = Mqo.loadMqo(url,buf)
			var texture

			//texture
			//material
			imax=mqo.materials.length
			o3o.materials = new Array(imax)
			for(i=0;i<imax;i++){
				var material = new Material()
				o3o.materials[i] = material
				material.r=mqo.materials[i].col[0]
				material.g=mqo.materials[i].col[1]
				material.b=mqo.materials[i].col[2]
				material.a=mqo.materials[i].col[3]
				material.dif=mqo.materials[i].dif
				material.spc=mqo.materials[i].spc
				material.spchard=mqo.materials[i].power
				if(mqo.materials[i].tex.length){
					texture= new Texture()
					texture.path=mqo.materials[i].tex
					o3o.textures.push(texture)
					material.texture=texture
				}
				material.normal=mqo.materials[i].normal
			}

			var scene = new Scene()
			o3o.scenes.push(scene)
			//mesh
			imax=mqo.objects.length
			o3o.meshes= new Array(imax)
			for(i=0;i<imax;i++){
				var mesh = new Mesh()
				var vertex,face
				o3o.meshes[i] = mesh
				var object = new SceneObject()
				object.data=mesh
				object.type="MESH"
				scene.objects.push(object)
				jmax=mqo.objects[i].vertices.length
				mesh.vertices = new Array(jmax)
				for(j=0;j<jmax;j++){
					vertex = new Vertex()
					mesh.vertices[j]=vertex
					
					vertex.pos[0] = mqo.objects[i].vertices[j][0]
					vertex.pos[1] = mqo.objects[i].vertices[j][1]
					vertex.pos[2] = mqo.objects[i].vertices[j][2]
				}
				jmax=mqo.objects[i].faces.length
				mesh.faces= new Array()
				for(j=0;j<jmax;j++){
					face= new Face()
					mesh.faces.push(face)
					if(mqo.objects[i].faces[j].vertexnum==4){
						face.uv[0]=mqo.objects[i].faces[j].UV[6]
						face.uv[1]=mqo.objects[i].faces[j].UV[7]
						face.uv[2]=mqo.objects[i].faces[j].UV[4]
						face.uv[3]=mqo.objects[i].faces[j].UV[5]
						face.uv[4]=mqo.objects[i].faces[j].UV[2]
						face.uv[5]=mqo.objects[i].faces[j].UV[3]
						face.uv[6]=mqo.objects[i].faces[j].UV[0]
						face.uv[7]=mqo.objects[i].faces[j].UV[1]
						face.idx[0]=mqo.objects[i].faces[j].V[3]
						face.idx[1]=mqo.objects[i].faces[j].V[2]
						face.idx[2]=mqo.objects[i].faces[j].V[1]
						face.idx[3]=mqo.objects[i].faces[j].V[0]
					}else{
						face.uv[0]=mqo.objects[i].faces[j].UV[4]
						face.uv[1]=mqo.objects[i].faces[j].UV[5]
						face.uv[2]=mqo.objects[i].faces[j].UV[2]
						face.uv[3]=mqo.objects[i].faces[j].UV[3]
						face.uv[4]=mqo.objects[i].faces[j].UV[0]
						face.uv[5]=mqo.objects[i].faces[j].UV[1]
						face.idx[0]=mqo.objects[i].faces[j].V[2]
						face.idx[1]=mqo.objects[i].faces[j].V[1]
						face.idx[2]=mqo.objects[i].faces[j].V[0]
					}
					face.material = o3o.materials[mqo.objects[i].faces[j].M]
					face.idxnum = mqo.objects[i].faces[j].vertexnum

				}
			}	

		//}else if(buf.substring(0,4)=="PMX "){
		//	return Mmd.loadPmx(url)
		//}else if(buf.substring(0,3)=="Pmd"){
		//	return Mmd.loadPmd(url)
		}else if(buf.substring(0,11) =="Ono3dObject"){
			loadO3o(o3o,url,buf)
		}else{
			return
		}

		var res =  /.*\//.exec(url)
		var currentdir=""
		var texture
		if(res) currentdir = res[0]
		o3o.name=url
		res= /[^\/]*$/.exec(url)
		if(res)o3o.name=res[0]

		//loadtexture
		for(i=o3o.textures.length;i--;){
			texture= o3o.textures[i]
			res=/[^\\\/]*$/.exec(texture.path)
			texture.path = res[0]
			texture.path = currentdir + texture.path
			if(texture.typ=="NORMAL"){
				texture.image = Util.loadImage(texture.path,1,function(img){
				var imgdata= img.imagedata;
				var data=imgdata.data;
				var arr = new Array(imgdata.width*imgdata.height*4);
				for(var i=0,imax=arr.length;i<imax;i+=4){
					arr[i+0]=-(data[i]-128)
					arr[i+1]=(data[i+1]-128)
					arr[i+2]=(data[i+2]-128)
					var d=1/Math.sqrt(arr[i]*arr[i]+arr[i+1]*arr[i+1]+arr[i+2]*arr[i+2]);
					arr[i+0]*=d
					arr[i+1]*=d
					arr[i+2]*=d
				}
					
				var obj={};
				obj.width=imgdata.width;
				obj.height=imgdata.height;
				obj.normalmap=arr;
				img.imagedata=obj;
				});
			}else{
				texture.image = Util.loadImage(texture.path,1);
			}
		}

		for(i=0,imax=o3o.materials.length;i<imax;i++){
			material = o3o.materials[i]
			material.r*=material.dif
			material.g*=material.dif
			material.b*=material.dif
			if(!o3o.materials[i].texture)continue
			for(j=o3o.textures.length;j--;){
				if(o3o.materials[i].texture == o3o.textures[j].name){
					o3o.materials[i].texture=o3o.textures[j]
					break
				}
			}
		}
		//edge
		var faces,edges
		for(i=0,imax=o3o.meshes.length;i<imax;i++){
			faces=o3o.meshes[i].faces
			edges=new Array()
			o3o.meshes[i].edges=edges
			for(j=0,jmax=faces.length;j<jmax;j++){
				face=faces[j]
				if(faces[j].idxnum==3){
					addEdge(edges,face.idx[0],face.idx[1],j)
					addEdge(edges,face.idx[1],face.idx[2],j)
					addEdge(edges,face.idx[2],face.idx[0],j)
				}else if(faces[j].idxnum==4){
					addEdge(edges,face.idx[0],face.idx[1],j)
					addEdge(edges,face.idx[1],face.idx[2],j)
					addEdge(edges,face.idx[2],face.idx[3],j)
					addEdge(edges,face.idx[3],face.idx[0],j)
				}
			}
		}
	}
	O3o.loadLocal=function(f){
		var o3o

		o3o = new O3o()
		var reader = new FileReader()
		reader.onload=function(e){
			var buf=e.target.result
			onloadfunc(o3o,f.name,buf)
		}
		reader.readAsText(f)

		return o3o
	}

	O3o.load=function(url){
		var o3o=new O3o()
		var request = createXMLHttpRequest()
		request.open("GET", url, true)
		//request.responseType="arraybuffer"
		request.onload=function(e){
			var buf =request.responseText
			onloadfunc(o3o,url,buf)
		}
		request.send("")
		return o3o
	}
	var addEdge=function(edges,v0,v1,f){
		var i,imax
		for(i=0,imax=edges.length;i<imax;i++){
			if((edges[i].v0==v0 && edges[i].v1==v1)
			|| (edges[i].v0==v1 && edges[i].v1==v0)){
				edges[i].f1=f
				return 0
			}
		}
		var edge = new Edge()
		edge.v0=v0
		edge.v1=v1
		edge.f0=f
		edges.push(edge)
		return 1
	}
	var name2Obj = function(name,objects){
		var i
		for(i=objects.length;i--;){
			if(objects[i].name == name){
				return objects[i]
			}
		}
		return null
	}
	var loadO3o = function(o3o,url,buf){
		var 
		i,imax
		,j,jmax
		,k,kmax
		,l
		var res =  /.*\//.exec(url)
		var currentdir="./"
		if(res) currentdir = res[0]

		var res
		 ,line
		 ,type
		
		var
			o3o
			,mesh
			,texture
			,material
			,vertex	
			,face	
			,face2	
			,bone	
			,param	
			,edge	
			,quat	
			,faces	
			,shapeKey
			,shapeKeyPoint
			,obj
		var data=new String()
	
		buf= buf.replace(/#.*$/mg, "")
		buf= buf.replace(/\s+$/mg, "")
		buf= buf.replace(/^\s+/mg, "")
		data.src = buf
		data.index = 0

		while(line=seek(data)){
	
			res = line.match(/^(.+)\s*\{/)
			if(res){
				while(line=seek(data)){}
				continue
			}
			res = line.match(/^(.+)\s+(.+)\[/)
			if(!res)continue
			type=res[1]
			if(type == "Textures"){
				while(line=seek(data)){
					texture=new Texture()
					o3o.textures.push(texture)
					obj=readValue2(line)
					texture.path=obj.path
					texture.name=obj.name[0]
					texture.typ=obj.typ;
				}
			}else if(type == "Materials"){
				while(line=seek(data)){
					material=new Material()
					o3o.materials.push(material)
					obj=readValue2(line)
					material.r = obj.r[0]
					material.g = obj.g[0]
					material.b = obj.b[0]
					material.a = obj.a[0]
					material.dif =obj.dif[0]
					material.ior = (obj.ior)?1.0/obj.ior[0]:1.0;
					material.mrr = obj.mrr[0]
					material.spc= obj.spc[0]
					material.spchard= obj.spchard[0]/10.0
					material.emt = obj.emt[0]
					if(obj.tex){
						material.texture=obj.tex[0]
					}
					material.normal=obj.normal;
				}
			}else if(type=="Meshes"){
				while(line=seek(data)){
					if(!/{/.test(line))continue
					mesh=new Mesh()
					o3o.meshes.push(mesh)
					
					while(line=seek(data)){
						if(line.match(/double_sided:(.*)/)){
							mesh.flg&=~Ono3d.RF_DOUBLE_SIDED
							mesh.flg|=Ono3d.RF_DOUBLE_SIDED*parseInt(RegExp.$1)

						}else if(line.match(/Vertices (.+)\[/)){
							while(line=seek(data)){
								vertex=new Vertex()
								mesh.vertices.push(vertex)
								obj=readValue2(line)
								vertex.pos=obj.pos
								vertex.normal=obj.normal
								if(obj.groups)vertex.groups= obj.groups
								if(obj.groupretios)vertex.groupretios= obj.groupretios
								obj=null
							}
						}else if(line.match(/ShapeKeys (.+)\[/)){
							while(line=seek(data)){
								if(!/ShapeKey/.test(line))continue
								shapeKey = new ShapeKey()
								mesh.shapeKeys.push(shapeKey)
								while(line=seek(data)){
									if(line.match(/ShapeKeyPoints (.+)\[/)){
										while(line=seek(data)){
											
											obj=readValue2(line)
											shapeKeyPoint= obj.pos
											shapeKey.shapeKeyPoints.push(shapeKeyPoint)

										}
	
									}else{
										readValue(shapeKey,line)
									}
								}
							}
						}else if(line.match(/Faces (.+)\[/)){
							//フェイス
							while(line=seek(data)){
								face=new Face()
								mesh.faces.push(face)
								readValue(face,line)
								for(i=0;i<4;i++){
									if(face.idx[i]<0)break
								}
								face.idxnum=i
							}
							
						}else{
							readValue(mesh,line)
						}
					}
				}
			}else if(type=="Armatures"){
				while(line=seek(data)){
					if(!/{/.test(line))continue
					var armature=new Armature()
					o3o.armatures.push(armature)
				
					while(line=seek(data)){
						if(line.match(/Bones (.+)/)){
							armature.boneSize = parseInt(RegExp.$1)
							while(line=seek(data)){
								if(!/Bone/.test(line))continue

								bone=new Bone()
								armature.bones.push(bone)
								while(line=seek(data)){
									readValue(bone,line)
								}
							}
						}else{
							readValue(armature,line)
						}
					}
				}
			}else if(type=="Collisions"){
				while(line=seek(data)){
					if(!/{/.test(line))continue
					var colligion=new Collision()
					o3o.collisions.push(colligion)
				
					while(line=seek(data)){
						readValue(colligion,line)
					}
				}
			}else if(type=="Actions"){
				while(line=seek(data)){
					if(!/{/.test(line))continue
					var action=new Action()
					o3o.actions.push(action)
					while(line=seek(data)){
						if(line.match(/Fcurves (.+)\[/)){
							while(line=seek(data)){
								if(!line.match(/target/))continue
								var fcurve = new Fcurve()
								action.fcurves.push(fcurve)
								res = line.match(/target:"(.*)",(\S+) (.+)\[(.+)\]/);
								fcurve.target=String(res[1]);
								fcurve.type=fcurveConvert[String(res[2])];
								var values = String(res[4]).split(",");
								if(fcurve.type==FCURVE_ROT_QUAT){
									for(k=0;k<values.length-1;k++){
										res = values[k].match(/(.+):(.+)/);
										fcurve.keys.push(parseInt(res[1]))
										var vec = new Vec4();
										res=String(res[2]).replace(/^\s+/,"");
										res=res.replace(/\s+$/,"");
										res=res.replace(/\s+/g," ");
										res = res.split(/\s/)
										vec[0]=parseFloat(res[0])
										vec[1]=parseFloat(res[1])
										vec[2]=parseFloat(res[2])
										vec[3]=parseFloat(res[3])
										fcurve.params.push(vec);
									}
								}else{
									for(k=0;k<values.length-1;k++){
										res = values[k].match(/(.+):(.+)/);
										fcurve.keys.push(parseInt(res[1]))
										fcurve.params.push(parseFloat(res[2]))
									}
								}
							}
						}else{
							readValue(action,line)
						}
					}
				}
			}else if(line.match(/Objects (.+)\[/)){
				while(line=seek(data)){
					if(!line.match(/Object/))continue
					object =new SceneObject()
					o3o.objects.push(object)
					while(line=seek(data)){
						if(line.match(/Groups (.+)\[/)){
							while(line=seek(data)){
								var group = new Group()
								object.groups.push(group)
								readValue(group,line)
							}
						}else if(line.match(/PoseBones (.+)\[/)){
							while(line=seek(data)){
								var posebone = new PoseBone()
								object.posebones.push(posebone)
								readValue(posebone,line)
							}
						}else if(line.match(/(.+) (.+)\[/)){
							res = line.match(/(.+) (.+)\[/);
							var os = new Array();
							object[res[1]] = os;
							
							while(line=seek(data)){
								var o={};
								os.push(o);
								readValue(o,line)
							}
						}else{
							readValue(object,line)
						}
					}
				}
			}else if(type=="Scenes"){
				while(line=seek(data)){
					if(!/{/.test(line))continue
					var scene=new Scene()
					var object
					o3o.scenes.push(scene)
					while(line=seek(data)){
						if(line.match(/Objects (.+)\[/)){
							var ret=line.match(/Objects (.+)\[(.*)\]/);
							ret= String(ret[2])
							ret =ret.split(",");
							for(i=0;i<ret.length;i++){
								if(ret[i].match(/\"(.+?)\"/)){
									scene.objects.push(RegExp.$1)
								}
							}
						}else{
							readValue(scene,line)
						}
					}
				}
			}
		}
	
	
		var scene,name,object,objects
		for(i=o3o.scenes.length;i--;){
			scene = o3o.scenes[i]
			for(j=scene.objects.length;j--;){
				scene.objects[j] = name2Obj(scene.objects[j],o3o.objects);
			}
		}
		for(j=o3o.objects.length;j--;){
			object=o3o.objects[j]
			if(object.type=="MESH"){
				object.data=name2Obj(object.data,o3o.meshes)
			}else if(object.type=="ARMATURE"){
				object.data=name2Obj(object.data,o3o.armatures)
				for(k=0;k<object.posebones.length;k++){
					object.posebones[k].target=name2Obj(object.posebones[k].target,object.data.bones)
					object.posebones[k].parent=name2Obj(object.posebones[k].parent,object.posebones)
				}
			}else{
				object.data=null
			}
			object.parent=name2Obj(object.parent,o3o.objects)
			for(k=0;k<object.modifiers.length;k++){
				object.modifiers[k].object=name2Obj(object.modifiers[k].object,o3o.objects)
				var  name=object.modifiers[k].vertex_group;
				for(var l=0;l<object.groups.length;l++){
					if(object.groups[l].name==name){
						object.modifiers[k].vertex_group=l;
						break;
					}
				}
			}
			object.action=name2Obj(object.action,o3o.actions)
			Mat43.getInv(object.imatrix,object.matrix)
		}
		var count=0
		for(i=o3o.meshes.length;i--;){
			mesh = o3o.meshes[i]
			//マテリアルのポインタ設定
			for(j=mesh.faces.length;j--;){
				face =mesh.faces[j]
				face.material = o3o.materials[face.mat]
			}
			
		}
	
		//骨の名称をアドレスに変更
		var i;for(i=o3o.armatures.length;i--;){
			armature=o3o.armatures[i]
			for(j=armature.bones.length;j--;){
				bone = armature.bones[j]
				Mat43.getInv(bone.imatrix,bone.matrix)
				for(k=armature.bones.length;k--;){
					if(bone.parent == armature.bones[k].name){
						bone.parent = armature.bones[k] 
						break
					}
				}
			}
		}

		return o3o
	}
	var clearAction = O3o.clearAction = function(){
		var i,motionBuf
		for(i=motionBufs.length;i--;){
			motionBuf = motionBufs[i]
			motionBuf.flg=0
		}
	}
	var setAction = O3o.setAction= function(action,frame){
		clearAction()
		//addAction(action,frame)
	}
	var calcVertex = function(obj,physics){
		var i,j
			,pos
			,vertex
			,retiosum
			,motionbuf
			,retio
			,shapeKeyPoint
			,shapeKey
			,vertices
			,matrix
			,mesh=obj.data
		;

		j=mesh.vertices.length+ono3d.renderVertices_index-1
		for(i = mesh.vertices.length;i--;j--){
			bufVertices[i] = ono3d.renderVertices[j]
			
		}

		if(mesh.shapeKeys.length){
			retiosum=0
			for(i = mesh.vertices.length;i--;){
				pos = bufVertices[i].pos
				pos[0]=0
				pos[1]=0
				pos[2]=0
			}
			for(j=mesh.shapeKeys.length;j--;){
				shapeKey = mesh.shapeKeys[j]
				matrix=searchMotionBuf(shapeKey.name)
				retio = matrix[0]
				retiosum+=retio

				for(i = mesh.vertices.length;i--;){
					pos = bufVertices[i].pos
					shapeKeyPoint = shapeKey.shapeKeyPoints[i]

					pos[0]+=retio*shapeKeyPoint[0]
					pos[1]+=retio*shapeKeyPoint[1]
					pos[2]+=retio*shapeKeyPoint[2]

				}
			}
			retio=1-retiosum
			if(retio>0){
				shapeKey = mesh.shapeKeys[0]
				for(i = mesh.vertices.length;i--;){
					pos = bufVertices[i].pos
					shapeKeyPoint = shapeKey.shapeKeyPoints[i]

					pos[0]+=retio*shapeKeyPoint[0]
					pos[1]+=retio*shapeKeyPoint[1]
					pos[2]+=retio*shapeKeyPoint[2]


				}
			}
			for(i = mesh.vertices.length;i--;){
				vertex=mesh.vertices[i]
				pos=bufVertices[i].pos
				bV0[0]=pos[0]
				bV0[1]=pos[1]
				bV0[2]=pos[2]
				if(vertex.groups.length == 0){
					Mat43.dotMat43Vec3(pos,defMatrix,pos)
					continue
				}
				pos[0]=0
				pos[1]=0
				pos[2]=0
				for(j = vertex.groups.length;j--;){
					retio=vertex.groupretios[j]
					Mat43.dotMat43Vec3(bV1,groupMatricies[vertex.groups[j]],bV0)
					pos[0] +=  bV1[0] * retio
					pos[1] +=  bV1[1] * retio
					pos[2] +=  bV1[2] * retio
				}
			}
		}else{
			var orglen=mesh.vertices.length;
			rvIndex=ono3d.renderVertices_index;
			rvSize=mesh.vertices.length;
			var renderVertices =ono3d.renderVertices;

			for(i = mesh.vertices.length;i--;){
				pos = renderVertices[i+rvIndex].pos
				vertex = mesh.vertices[i]

				renderVertices[i+rvIndex].vp=vertex;
				renderVertices[i+rvIndex].mrr=0;
				pos[0]=vertex.pos[0]
				pos[1]=vertex.pos[1]
				pos[2]=vertex.pos[2]
			}

		}

	}
	var calcFaces =function(obj,physics){
		rfIndex=ono3d.renderFaces_index;
		rfSize=0;
		var mesh=obj.data;
		var renderFaces=ono3d.renderFaces
		var face,renderFace;
		var material;
		var rf= ono3d.rf | mesh.flg
			var vertex
		for(i=mesh.faces.length;i--;){
			face=mesh.faces[i]
			renderFace = renderFaces[rfIndex+rfSize]

					renderFace.reverseFlg=0
//				if(Vec3.dot(bufVertices[face.idx[0]].pos,bufFace.normal)>0){
//					if((mesh.flg&Ono3d.RF_DOUBLE_SIDED)){
//						Vec3.mult(bufFace.normal,bufFace.normal,-1)
//						renderFace.reverseFlg=1
//					}else{
//						continue
//					}
//				}

			if((!face.material) || O3o.useDefaultMaterial){
				material = defaultMaterial
			}else{
				material=face.material
			}
			renderFace.r = material.r
			renderFace.g= material.g
			renderFace.b= material.b
			renderFace.a= material.a
			renderFace.ior = material.ior
			renderFace.mrr = material.mrr
			renderFace.spc= material.spc
			renderFace.spchard= material.spchard
			renderFace.emt = material.emt
			renderFace.rf = rf
//				Vec3.copy(renderFace.normal,bufFace.normal)
//				Vec3.copy(renderFace.angle,bufFace.angle)
			renderFace.operator = Ono3d.OP_TRIANGLES
			renderFace.smoothing = ono3d.smoothing
			if(ono3d.smoothing>0)renderFace.rf|=Ono3d.RF_SMOOTH

			renderFace.vertices[0]= face.idx[0]+rvIndex
			renderFace.vertices[1]= face.idx[1]+rvIndex
			renderFace.vertices[2]= face.idx[2]+rvIndex

			renderFace.normalmap=null;
			if(material.texture){
				if(material.normal>0){
					renderFace.normalmap= material.texture.image
					renderFace.normalmapvalue=material.normal;
				}else{
					renderFace.texture = material.texture.image
				}
			}else{
				renderFace.texture = null
			}
			renderFace.envTexture = ono3d.envTexture
			renderFace.uv[0][0] = face.uv[0]
			renderFace.uv[0][1] = face.uv[1]
			renderFace.uv[1][0] = face.uv[2]
			renderFace.uv[1][1] = face.uv[3]
			renderFace.uv[2][0] = face.uv[4]
			renderFace.uv[2][1] = face.uv[5]

			rfSize++;

			if(face.idxnum ==4  ){
				renderFace = renderFaces[rfIndex+rfSize]
				renderFace.r = material.r
				renderFace.g= material.g
				renderFace.b= material.b
				renderFace.a= material.a
				renderFace.ior = material.ior
				renderFace.mrr = material.mrr
				renderFace.spc= material.spc
				renderFace.spchard= material.spchard
				renderFace.emt = material.emt
				renderFace.rf = rf
//					Vec3.copy(renderFace.normal,bufFace.normal)
//					Vec3.copy(renderFace.angle,bufFace.angle)
				renderFace.operator = Ono3d.OP_TRIANGLES
				renderFace.smoothing = ono3d.smoothing
				if(ono3d.smoothing>0)renderFace.rf|=Ono3d.RF_SMOOTH

				renderFace.vertices[0]= face.idx[2]+rvIndex
				renderFace.vertices[1]= face.idx[3]+rvIndex
				renderFace.vertices[2]= face.idx[0]+rvIndex

				renderFace.normalmap=null;
				if(material.texture){
					if(material.normal>0){
						renderFace.normalmap= material.texture.image
						renderFace.normalmapvalue=material.normal;
					}else{
						renderFace.texture = material.texture.image
					}
				}else{
					renderFace.texture = null
				}
				renderFace.envTexture = ono3d.envTexture
				renderFace.uv[0][0] = face.uv[4]
				renderFace.uv[0][1] = face.uv[5]
				renderFace.uv[1][0] = face.uv[6]
				renderFace.uv[1][1] = face.uv[7]
				renderFace.uv[2][0] = face.uv[0]
				renderFace.uv[2][1] = face.uv[1]

			rfSize++;
			}
		}
	}
	
	var calcNormal = function(mesh){
		var i,j
		,lightSource
		,light
		,bufVertex
		,face
		,bufFace
		,lightPow
		,normal
		,renderVertices =ono3d.renderVertices
		,renderFaces=ono3d.renderFaces
		;

		for(i=rfSize;i--;){
			bufFace = renderFaces[i+rfIndex]
			bufFace.vertices[0]=renderVertices[bufFace.vertices[0]];
			bufFace.vertices[1]=renderVertices[bufFace.vertices[1]];
			bufFace.vertices[2]=renderVertices[bufFace.vertices[2]];

			bufFace.z = (bufFace.vertices[0].pos[2]+bufFace.vertices[1].pos[2]+bufFace.vertices[2].pos[2])*0.33333333;
		}
		if( ono3d.smoothing>0){
			for(i = mesh.vertices.length;i--;){
				normal= renderVertices[i+rvIndex].normal
				normal[0]=0
				normal[1]=0
				normal[2]=0
			}
		}

		for(j=ono3d.lightSources.length;j--;){
			lightSource = ono3d.lightSources[j]
			if(lightSource.type ==Ono3d.LT_DIRECTION){
				Mat43.dotMat33Vec3(lightSource.viewAngle,ono3d.viewMatrix,lightSource.angle)
			}
		}
		//面の法線を算出
		for(i=rfSize;i--;){
			face = mesh.faces[i]
			bufFace = renderFaces[i+rfIndex]
			normal=bufFace.normal
			Vec3.sub(bV0, bufFace.vertices[0].pos,bufFace.vertices[1].pos)
			Vec3.sub(bV1, bufFace.vertices[0].pos,bufFace.vertices[2].pos)
			
			Vec3.cross(normal,bV0,bV1)
			Vec3.norm(normal)
			
			

			Vec3.set(bufFace.angle,0,0,0)
			for(j=3;j--;){
				Vec3.add(bufFace.vertices[j].normal
					,bufFace.vertices[j].normal
						,normal)
				Vec3.add(bufFace.angle,bufFace.angle,bufFace.vertices[j].pos)
			}
			//Vec3.mult(bufFace.pos,bufFace.pos,1/3)
			Vec3.norm(bufFace.angle)

		}

		if( ono3d.smoothing>0){
			for(i = mesh.vertices.length;i--;){
				bufVertex = renderVertices[i+rvIndex]
				Vec3.norm(bufVertex.normal)
			}
		}
		

	}
	var pushMesh = function(mesh){
		var i,j
		var face
			,bufFace
			,renderFace
			,material
			,z
			,bufVertex
			,edge
			,pos
			,rf= ono3d.rf | mesh.flg
		if(ono3d.rf & Ono3d.RF_LINE){
			for(i=mesh.edges.length;i--;){
				edge=mesh.edges[i]
				renderFace = ono3d.renderFaces[ono3d.renderFaces_index]
				
				renderFace.vertices[0] = bufVertices[edge.v0]
				renderFace.vertices[1] = bufVertices[edge.v1]
				renderFace.argb = ono3d.color
				renderFace.bold = ono3d.bold
				
				renderFace.rf =rf
				renderFace.operator = Ono3d.OP_LINE

				renderFace.z = renderFace.vertices[0].pos[2] 
					+ renderFace.vertices[1].pos[2] 
				renderFace.z *=0.5
				ono3d.renderFaces_index++
			}
		}else{
		}
		var flg,flg0
		if(ono3d.rf & Ono3d.RF_OUTLINE){
			for(i=mesh.edges.length;i--;){
				edge=mesh.edges[i]
				flg0 = Vec3.dot(bufFaces[edge.f0].normal,bufVertices[mesh.faces[edge.f0].idx[0]].pos)
				flg=flg0
				if(edge.f1<0)flg*=1
				else flg*=Vec3.dot(bufFaces[edge.f1].normal,bufVertices[mesh.faces[edge.f1].idx[0]].pos)
				if(flg>0)continue

				renderFace = ono3d.renderFaces[ono3d.renderFaces_index]
				
				renderFace.vertices[0] = bufVertices[edge.v0]
				renderFace.vertices[1] = bufVertices[edge.v1]

				renderFace.rf = Ono3d.RF_LINE
				renderFace.a=1
				renderFace.r=0
				renderFace.g=0
				renderFace.b=0
				renderFace.bold=1
				renderFace.texture=null
				renderFace.operator = Ono3d.OP_LINE
				if(flg0<0){
					face = mesh.faces[edge.f0]
				}else{
					face = mesh.faces[edge.f1]
				}
				if(!face)continue
				renderFace.z = (bufVertices[face.idx[0]].pos[2]
					+ bufVertices[face.idx[1]].pos[2]
					+ bufVertices[face.idx[2]].pos[2])*0.33
				ono3d.renderFaces_index++
			}
		}
	}
	var addAction2 = function(obj,name,action,frame){
		var i,j,a,b,c,x
		,motionBuf
		,tim,retio
		,fcurve
		,name
		,mat43
		,paramA,paramB
		,quat = bVec4
		,imax
		,t1,t2,t3,A

		bM[12]=0
		bM[13]=0
		bM[14]=0

		frame=frame%action.endframe
		for(i=0,imax=action.fcurves.length;i<imax;i++){
			fcurve=action.fcurves[i]
			if(fcurve.target != name)continue;
			tim=frame

			a=0;b=fcurve.keys.length-1
			switch(fcurve.repeatmode){
			case REPEAT_NONE:
				if(tim<fcurve.keys[a])tim=fcurve.keys[a]
				if(tim>fcurve.keys[b])tim=fcurve.keys[b]
				break
			case REPEAT_LOOP:
				if(tim<fcurve.keys[a])tim=fcurve.keys[b]-(fcurve.keys[a]-tim)%(fcurve.keys[b]-fcurve.keys[a])
				if(tim>fcurve.keys[b])tim=fcurve.keys[a]+(tim-fcurve.keys[b])%(fcurve.keys[b]-fcurve.keys[a])
				break
			case REPEAT_LINER:
				break
			}
			while (a < b) {
				c = (a + b) >>1
				if (fcurve.keys[c] <= tim)
					a = c + 1
				else
					b = c
			}
			if(tim == fcurve.keys[a]){
				retio=0;
				paramA=fcurve.params[a]
				paramB=fcurve.params[a]
			}else{
				if(a>0)a--
				retio=(tim-fcurve.keys[a])/(fcurve.keys[a+1]-fcurve.keys[a])

				
				paramA=fcurve.params[a]
				paramB=fcurve.params[a+1]
			}
			switch(fcurve.type){
			case FCURVE_ROT_QUAT:
				Vec4.slerp(obj.rotation,paramA,paramB,retio)
				break;
			case FCURVE_ROT_EULERX:
				obj.rotation[0] = (paramB-paramA)*retio + paramA
				break;
			case FCURVE_ROT_EULERY:
				obj.rotation[1] = (paramB-paramA)*retio + paramA
				break;
			case FCURVE_ROT_EULERZ:
				obj.rotation[2] = (paramB-paramA)*retio + paramA
				break
			case FCURVE_SCALEX:
				obj.scale[0] = (paramB-paramA)*retio + paramA
				break;
			case FCURVE_SCALEY:
				obj.scale[1] = (paramB-paramA)*retio + paramA
				break;
			case FCURVE_SCALEZ:
				obj.scale[2] = (paramB-paramA)*retio + paramA
				break;
			case FCURVE_LOCATIONX:
				obj.location[0]= (paramB-paramA)*retio + paramA
				break;
			case FCURVE_LOCATIONY:
				obj.location[1]= (paramB-paramA)*retio + paramA
				break;
			case FCURVE_LOCATIONZ:
				obj.location[2]= (paramB-paramA)*retio + paramA
				break
			case FCURVE_SHAPEKEY:
				switch(fcurve.interpolatemode){
				case INTERPOLATE_SPLINE:
					retio=retio*2-1
					if(retio<0)
						retio=-Math.pow(-retio,1.5)
					else retio=Math.pow(retio,1.5)
					retio=(retio+1)*0.5
					mat43[0]= (paramB[0]-paramA[0])*retio + paramA[0]
					break
				case INTERPOLATE_LINER:
					mat43[0]= (paramB[0]-paramA[0])*retio + paramA[0]
					break
				}
				break
			}
		}
	}
	var addAction = function(obj,name,action,frame){
		var i,j,a,b,c,x
		,motionBuf
		,tim,retio
		,fcurve
		,name
		,mat43
		,paramA,paramB
		,quat = bVec4
		,imax
		,t1,t2,t3,A

		bM[12]=0
		bM[13]=0
		bM[14]=0

		tim=frame%action.endframe
		mat43=obj.actmatrix;
		for(i=0,imax=action.fcurves.length;i<imax;i++){
			fcurve=action.fcurves[i]
			if(fcurve.target != name)continue;

			a=0;b=fcurve.keys.length-1
			switch(fcurve.repeatmode){
			case REPEAT_NONE:
				if(tim<fcurve.keys[a])tim=fcurve.keys[a]
				if(tim>fcurve.keys[b])tim=fcurve.keys[b]
				break
			case REPEAT_LOOP:
				if(tim<fcurve.keys[a])tim=fcurve.keys[b]-(fcurve.keys[a]-tim)%(fcurve.keys[b]-fcurve.keys[a])
				if(tim>fcurve.keys[b])tim=fcurve.keys[a]+(tim-fcurve.keys[b])%(fcurve.keys[b]-fcurve.keys[a])
				break
			case REPEAT_LINER:
				break
			}
			while (a < b) {
				c = (a + b) >>1
				if (fcurve.keys[c] <= tim)
					a = c + 1
				else
					b = c
			}
			if(tim == fcurve.keys[a]){
				retio=0;
				paramA=fcurve.params[a]
				paramB=fcurve.params[a]
			}else{
				if(a>0)a--
				retio=(tim-fcurve.keys[a])/(fcurve.keys[a+1]-fcurve.keys[a])

				
				paramA=fcurve.params[a]
				paramB=fcurve.params[a+1]
			}
			switch(fcurve.type){
			case FCURVE_ROT_QUAT:
				Vec4.slerp(quat,paramA,paramB,retio)
				Vec4.qTOm(bM,quat)
				Mat43.dot(mat43,mat43,bM)
				break;
			case FCURVE_ROT_EULERX:
				x = (paramB-paramA)*retio + paramA
				Mat43.getRotMat(bM,x,0,0,1)
				Mat43.dot(mat43,bM,mat43)
				break;
			case FCURVE_ROT_EULERY:
				x = (paramB-paramA)*retio + paramA
				Mat43.getRotMat(bM,x,1,0,0)
				Mat43.dot(mat43,bM,mat43)
				break;
			case FCURVE_ROT_EULERZ:
				x = (paramB-paramA)*retio + paramA
				Mat43.getRotMat(bM,x,0,1,0)
				Mat43.dot(mat43,bM,mat43)
				break
			case FCURVE_SCALEX:
				x = (paramB-paramA)*retio + paramA
				mat43[0]*=x
				mat43[1]*=x
				mat43[2]*=x
				break;
			case FCURVE_SCALEY:
				x = (paramB-paramA)*retio + paramA
				mat43[4]*=x
				mat43[5]*=x
				mat43[6]*=x
				break;
			case FCURVE_SCALEZ:
				x = (paramB-paramA)*retio + paramA
				mat43[8]*=x
				mat43[9]*=x
				mat43[10]*=x
				break;
			case FCURVE_LOCATIONX:
				mat43[12]+= (paramB-paramA)*retio + paramA
				break;
			case FCURVE_LOCATIONY:
				mat43[13]+= (paramB-paramA)*retio + paramA
				break;
			case FCURVE_LOCATIONZ:
				mat43[14]+= (paramB-paramA)*retio + paramA
				break
			case FCURVE_SHAPEKEY:
				switch(fcurve.interpolatemode){
				case INTERPOLATE_SPLINE:
					retio=retio*2-1
					if(retio<0)
						retio=-Math.pow(-retio,1.5)
					else retio=Math.pow(retio,1.5)
					retio=(retio+1)*0.5
					mat43[0]= (paramB[0]-paramA[0])*retio + paramA[0]
					break
				case INTERPOLATE_LINER:
					mat43[0]= (paramB[0]-paramA[0])*retio + paramA[0]
					break
				}
				break
			}
		}
	}
	var flg=0;
	var calcMatrixArmature=function(obj,frame){
		var bones=obj.posebones;
		var bone;
		for(i=bones.length;i--;){
			bone=bones[i];
			Mat43.setInit(bone.actmatrix);
			if(obj.action){
				addAction2(bone,bone.target.name,obj.action,frame)
			}
			genMatrix(bone);
			Mat43.dot(bone.actmatrix,bone.actmatrix,bone.target.imatrix)
			Mat43.dot(bone.actmatrix,bone.target.matrix,bone.actmatrix)

		}
	}
	var genMatrix=function(obj){
		var mat=obj.actmatrix;
		Mat43.setInit(obj.actmatrix);
		obj.actmatrix[0]=obj.scale[0];
		obj.actmatrix[5]=obj.scale[1];
		obj.actmatrix[10]=obj.scale[2];
		if(obj.rotation_mode==QUATERNION){
			Vec4.qTOm(bM,obj.rotation);
			Mat43.dot(obj.actmatrix,bM,obj.actmatrix)
				
		}else{
			Mat43.getRotMat(bM,obj.rotation[0],1,0,0)
			Mat43.dot(obj.actmatrix,bM,obj.actmatrix);
			Mat43.getRotMat(bM,obj.rotation[1],0,1,0)
			Mat43.dot(obj.actmatrix,bM,obj.actmatrix);
			Mat43.getRotMat(bM,obj.rotation[2],0,0,1)
			Mat43.dot(obj.actmatrix,bM,obj.actmatrix);
		}
		obj.actmatrix[12]=obj.location[0];
		obj.actmatrix[13]=obj.location[1];
		obj.actmatrix[14]=obj.location[2];
	}
	var calcMatrix=function(obj,frame){
		Mat43.setInit(obj.actmatrix);
		if(obj.action){
			addAction2(obj,"",obj.action,frame)
		}
		genMatrix(obj);
		//Mat43.dot(obj.actmatrix,obj.actmatrix,obj.imatrix)
		//Mat43.dot(obj.actmatrix,obj.matrix,obj.actmatrix)

		if(obj.type=="ARMATURE"){
			calcMatrixArmature(obj,frame);
		}
	}
	var calcChainMatrix=function(target,obj){
		Mat43.copy(target,obj.actmatrix);
		while(obj.parent){
			Mat43.dot(target,obj.iparentmatrix,target)
			obj=obj.parent;
			Mat43.dot(target,obj.actmatrix,target)
		}
	}
	var calcChainBoneMatrix=function(target,obj){
		while(obj){
			Mat43.dot(target,obj.actmatrix,target)
			obj=obj.parent;
		}
	}
	
	O3o.drawScene = function(scene,frame,physics){
		var mesh
		var i,j
		var objects = scene.objects;

		for(i=objects.length;i--;){
			calcMatrix(objects[i],frame);
		}
		for(i=objects.length;i--;){
			var obj=objects[i];
			if(obj.type!="MESH")continue;
			mesh=obj.data
			if(obj.hide_render)continue;
			drawObject(scene.objects[i],physics)
		}
	}
	var cnt=0;
	var calcModifier=function(obj,phyObjs){
		var renderVertices =ono3d.renderVertices;
		var renderFaces=ono3d.renderFaces;
		var renderVertex;
		var groupMatrix;
		var groupName;
		var i,j,imax,jmax,k,kmax;
		for(var i=0,imax=obj.modifiers.length;i<imax;i++){
			var mod = obj.modifiers[i];
			if(mod.type=="MIRROR"){
				var renderVertex,renderVertex2,pos,pos2;
				renderVertex2=renderVertices[0+rvIndex+rvSize];
				renderVertex2.mrr=1;
				for(j =0;j<rvSize;j++){
					renderVertex=renderVertices[j+rvIndex];
					renderVertex2=renderVertices[j+rvIndex+rvSize];
					renderVertex2.vp = renderVertex.vp
					pos = renderVertex.pos
					pos2 = renderVertex2.pos
	
					pos2[0]=-pos[0]
					pos2[1]=pos[1]
					pos2[2]=pos[2]
				}
				var face,face2;
				var faces=obj.data.faces;
				var vertex;
				var srcidx=rfIndex,dstidx=rfIndex+rfSize;
				var flg;
				for(j =0;j<rfSize;j++){
					face= renderFaces[srcidx]
					face2 = renderFaces[dstidx]
	
					face2.vertices[0] = face.vertices[0];
					face2.vertices[1] = face.vertices[2];
					face2.vertices[2] = face.vertices[1];
					if(renderVertices[face2.vertices[0]].pos[0]){
						face2.vertices[0]+=rvSize;
					}
					if(renderVertices[face2.vertices[1]].pos[0]){
						face2.vertices[1]+=rvSize;
					}
					if(renderVertices[face2.vertices[2]].pos[0]){
						face2.vertices[2]+=rvSize;
					}
					face2.r = face.r
					face2.g= face.g
					face2.b= face.b
					face2.a= face.a
					face2.ior = face.ior
					face2.mrr = face.mrr
					face2.spc= face.spc
					face2.spchard= face.spchard
					face2.emt = face.emt
					face2.rf = face.rf
					face2.operator = face.operator;
					face2.smoothing = face.smoothing

					face2.reverseFlg=face.reverseFlg;
					face2.texture=face.texture;
					face2.normalmap=face.normalmap;
					face2.normalmapvalue=face.normalmapvalue;
					face2.envTexture = face.envTexture
					face2.uv[0][0] = face.uv[0][0]
					face2.uv[0][1] = face.uv[0][1]
					face2.uv[1][0] = face.uv[2][0]
					face2.uv[1][1] = face.uv[2][1]
					face2.uv[2][0] = face.uv[1][0]
					face2.uv[2][1] = face.uv[1][1]

					srcidx++;
					dstidx++;
				}

				rvSize+=rvSize;
				rfSize=dstidx-rfIndex;
			}else if((mod.type=="CLOTH" || mod.type=="SOFT_BODY") && phyObjs){
				var idx=rvIndex;
				var phyObj;
				for(j=0;j<phyObjs.length;j++){
					phyObj=phyObjs[j];
					if(phyObj.name == obj.name){
						break;
					}else{
						phyObj = null;
					}
				}
				if(phyObj){
					Mat43.getInv(bM2,ono3d.transMat);
					Mat43.dot(bM,bM2,ono3d.viewMatrix);
					Mat43.getInv(bM2,defMatrix);
					Mat43.dot(bM,bM2,bM);
					for(j=0;j<rvSize;j++){
						if(!phyObj.fixes[j]){
							renderVertex=renderVertices[idx];
							Mat43.dotMat43Vec3(renderVertices[idx].pos,bM,phyObj.pos[j])
						}
						idx++;
					}
				}
			}else if(mod.type=="ARMATURE"){
				calcChainMatrix(defMatrix,obj);

				var retio,pos,vertex;

				calcChainMatrix(bM,obj);
				calcChainMatrix(bM2,mod.object);
				Mat43.getInv(bM2,bM2);
				Mat43.dot(bM,bM2,bM);
				Mat43.getInv(bM2,bM);
				for(j=obj.groups.length;j--;){
					groupMatrix = groupMatricies[j]
					groupMatFlg[j] = false;
					//Mat43.setInit(groupMatrix)
					Mat43.copy(groupMatrix,bM);
				}
				var posebones=mod.object.posebones;
				for(j=obj.groups.length;j--;){
					groupName=obj.groups[j].name
					groupMatrix = groupMatricies[j]
					for(k=0,kmax=posebones.length;k<kmax;k++){
						if(posebones[k].name!=groupName)continue
						groupMatFlg[j] = true;
						//Mat43.dot(groupMatrix,bM,groupMatrix);
						calcChainBoneMatrix(groupMatrix,posebones[k]);
						Mat43.dot(groupMatrix,bM2,groupMatrix);
						break
					}
				}
				for(k = 0;k<rvSize;k++){
					pos = renderVertices[k+rvIndex].pos
					vertex = renderVertices[k+rvIndex].vp;
	
					if(renderVertices[k+rvIndex].mrr){
						var name;

						for(j=obj.groups.length;j--;){
							groupName=obj.groups[j].name
							groupMatrix = groupMatricies[j]
							if(groupName.match(/L$/)){
								groupName=groupName.replace(/L$/,"R");
							}else if(groupName.match(/R$/)){
								groupName=groupName.replace(/R$/,"L");
							}else{
								continue;
							}
							for(var l=posebones.length;l--;){
								if(posebones[l].name!=groupName)continue
								groupMatFlg[j] = true;
								Mat43.copy(groupMatrix,bM);
								calcChainBoneMatrix(groupMatrix,posebones[l]);
								Mat43.dot(groupMatrix,bM2,groupMatrix);
								break
							}
						}
					}
					bV1[0]=0
					bV1[1]=0
					bV1[2]=0
					var retiosum=0;
					for(j = vertex.groups.length;j--;){

						retio=vertex.groupretios[j]
						if(!groupMatFlg[vertex.groups[j]]){
							continue;
						}
						Mat43.dotMat43Vec3(bV0,groupMatricies[vertex.groups[j]],pos)
						
						bV1[0] +=  bV0[0] * retio
						bV1[1] +=  bV0[1] * retio
						bV1[2] +=  bV0[2] * retio
						retiosum+=retio;
					}
					if(retiosum>0){
						retiosum=1.0/retiosum;
						pos[0] =  bV1[0] * retiosum
						pos[1] =  bV1[1] * retiosum
						pos[2] =  bV1[2] * retiosum
					}else{
						if(mod.vertex_group >=0){
							Mat43.dotMat43Vec3(pos,groupMatricies[mod.vertex_group],pos)
						}
					}
				}
			}
		}

	}
	var drawObject = O3o.drawObject = function(obj,physics){
		var mesh = obj.data
		var group,groupMatrix
		var armature
		var i,j,k
		var o
		var renderVertices =ono3d.renderVertices;
		var renderFaces=ono3d.renderFaces;
		var renderVertex;


		var matrix=obj.actmatrix;
		calcVertex(obj,physics)
		calcFaces(obj,physics)
		calcModifier(obj,physics);

		calcChainMatrix(defMatrix,obj);
		Mat43.dot(defMatrix,ono3d.transMat,defMatrix);

		for(j=rvSize;j--;){
			Mat43.dotMat43Vec3(renderVertices[j+rvIndex].pos,defMatrix,renderVertices[j+rvIndex].pos)
		}
		calcNormal(mesh)
		ono3d.renderVertices_index+=rvSize;
		ono3d.renderFaces_index+=rfSize;
		
	}

	O3o.createPhyObjs = function(o3o,onoPhy){
		var mesh,obj
		,phyObjs = new Array()
		,res
		,i,j,vertices
		var renderVertices =ono3d.renderVertices;
		var renderVertex;
		var renderFaces =ono3d.renderFaces;
		var renderFace;
		var idx;
		

		for(i=0;i<o3o.objects.length;i++){
			var obj= o3o.objects[i];
			var flg=false;
			var mod;
			for(var j=0;j<obj.modifiers.length;j++){
				mod = obj.modifiers[j];
				if(mod.type=="CLOTH" || mod.type=="SOFT_BODY"){
					mesh = obj.data;
					res=null
					vertices = mesh.vertices
					calcPhyObj(obj);
					res=onoPhy.createSpringMesh(rvSize)
					idx=rvIndex;
					for(j=0;j<rvSize;j++){
						if(renderVertices[j+rvIndex].mrr){
							idx=rvIndex;
						}
						Vec3.copy(res.pos[j],renderVertices[j+rvIndex].pos);
						Vec3.copy(res.truepos[j],renderVertices[j+rvIndex].pos);
						if(mod.type=="CLOTH"){
							for(var k=0,kmax=vertices[idx-rvIndex].groups.length;k<kmax;k++){
								if(obj.groups[vertices[idx-rvIndex].groups[k]].name == mod.pin){
									res.fixes[j]=1
									break;
								}
							}
						}else{
							for(var k=0,kmax=vertices[idx-rvIndex].groups.length;k<kmax;k++){
								if(obj.groups[vertices[idx-rvIndex].groups[k]].name == mod.vertex_group_mass){
									res.fixes[j]=1
									break;
								}
							}
						}
						idx++;
					}

					if(mod.friction){
						res.friction= mod.friction*100;
						res.goal_default= mod.goal_default;
					}
					var face,edges
					var idxs;
					for(j=0;j<rfSize;j++){
							face=renderFaces[j+rfIndex]
						if(face.operator == Ono3d.OP_TRIANGLES){
							idx= new Array(3);
							idx[0]= face.vertices[0]-rvIndex
							idx[1]= face.vertices[1]-rvIndex
							idx[2]= face.vertices[2]-rvIndex
							res.faces.push(idx);
							addJoint(res,idx[0],idx[1])
							addJoint(res,idx[1],idx[2])
							addJoint(res,idx[2],idx[0])
						}
					}
					res.mesh = mesh
					res.name=obj.name
					phyObjs.push(res)
				}else if(mod.type=="COLLISION"){
					res=onoPhy.createCollision(OnoPhy.CAPSULE)
					res.name=obj.name
					res.fix=1;
					phyObjs.push(res)
						
				}
			}
		}
		return phyObjs
	}
	var addJoint=function(spring,v0,v1){
		var i,imax
		var joints=spring.joints;
		for(i=0,imax=joints.length;i<imax;i++){
			if((joints[i].v0==v0 && joints[i].v1==v1)
			|| (joints[i].v0==v1 && joints[i].v1==v0)){
				return 0
			}
		}
		var joint={};
		joint.v0=v0;
		joint.v1=v1;
		spring.joints.push(joint)
		return 1;
	};
	var initPhyObjs=function(scene,frame,phyObjs){
		var i,imax,j,jmax;
		var objects = scene.objects;
		var object;
		var phyName,phyObj;
		var renderVertices =ono3d.renderVertices;
		var renderVertex;

		for(i=objects.length;i--;){
			calcMatrix(objects[i],frame);
		}
		jmax=phyObjs.length;
		for(j=0;j<phyObjs.length;j++){
			phyName=phyObjs[j].name;
			for(i=0,imax=objects.length;i<imax;i++){
				object=objects[i];
				if(phyName==object.name){
					break;
				}else{
					object=null;
				}
			}
			if(object== null)continue;
			calcPhyObj(object);
			phyObj=phyObjs[j];
			if(phyObj.type== OnoPhy.SPRING_MESH){
				for(i=0,imax=phyObj.pos.length;i<imax;i++){
					var pos=phyObj.pos[i];
					renderVertex=renderVertices[i+rvIndex]
					pos[0]=renderVertex.pos[0]
					pos[1]=renderVertex.pos[1]
					pos[2]=renderVertex.pos[2]
					pos=phyObj.v[i];
					pos[0]=0;
					pos[1]=0;
					pos[2]=0;
				}
			}
		}
	}
	O3o.initPhyObjs=initPhyObjs;
	var calcPhyObj=function(obj,flg){
		var armature
		var renderVertices =ono3d.renderVertices;
		var renderVertex;
		var i,imax;
		Mat43.setInit(defMatrix)

		var matrix=obj.actmatrix;
		if(!flg){
			calcVertex(obj);
			calcFaces(obj);
		}
		calcModifier(obj);
		calcChainMatrix(defMatrix,obj);
		Mat43.dot(defMatrix,ono3d.worldMatrix,defMatrix);
		if(!flg){
			for(i=0;i<rvSize;i++){
				Mat43.dotMat43Vec3(renderVertices[i+rvIndex].pos,defMatrix,renderVertices[i+rvIndex].pos)
			}
		}
	}

	O3o.movePhyObjs=function(scene,frame,phyObjs){
		var i,imax,j,jmax;
		var objects = scene.objects;
		var object;
		var phyName,phyObj;
		var renderVertices =ono3d.renderVertices;
		var renderVertex;
		if(phyObjs == null)return;

		for(i=objects.length;i--;){
			calcMatrix(objects[i],frame);
		}
		jmax=phyObjs.length;
		for(j=0;j<phyObjs.length;j++){
			phyName=phyObjs[j].name;
			for(i=0,imax=objects.length;i<imax;i++){
				object=objects[i];
				if(phyName==object.name){
					break;
				}else{
					object=null;
				}
			}
			if(object== null)continue;
			phyObj=phyObjs[j];
			if(phyObj.type==OnoPhy.SPRING_MESH){
				calcPhyObj(object,false);
				for(i=0,imax=phyObj.pos.length;i<imax;i++){
					Vec3.copy(phyObj.truepos[i],renderVertices[i+rvIndex].pos);
				}
			}else{
				calcPhyObj(object,true);
				calcChainMatrix(defMatrix,object);
				Mat43.dot(phyObj.matrix,ono3d.worldMatrix,defMatrix)
			}
		}
	}
	return O3o
})()
