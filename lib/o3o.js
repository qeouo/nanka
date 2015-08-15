"use strict"
var O3o=(function(){
	var i
	,bV0 = new Vec3()
	,bV1 = new Vec3()
	,bVec4=new Vec4()
	,bM=new Mat43()
	,bM2=new Mat43()
	
	,groupMatricies = new Array(32)
	,groupMatFlg= new Array(32)
	,defMatrix = new Mat43()
	,rvSize
	,rfSize

	for(i=groupMatricies.length;i--;)groupMatricies[i] = new Mat43();

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
	,FCURVE_ROT_EULER = ++i
	,FCURVE_LOCATION = ++i
	,FCURVE_SCALE= ++i
	,FCURVE_SHAPEKEY = ++i 
	,FCURVE_OFFSET = ++i 
	,fcurveConvert = Object()
	fcurveConvert["rotation_quaternion"]=FCURVE_ROT_QUAT
	fcurveConvert["rotation_euler"]=FCURVE_ROT_EULER
	fcurveConvert["location"]=FCURVE_LOCATION
	fcurveConvert["scale"]=FCURVE_SCALE
	fcurveConvert["offset"]=FCURVE_OFFSET
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
	
	var ono3d = null;
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
		this.flg=false;
		this.mixedmatrix=new Mat43();
	}
	var PoseBone = function(){
		this.bone;
		this.location=new Array(3);
		this.rotation_mode=QUATERNION;
		this.rotation=new Array(4);
		this.scale=new Array(3);
		this.actmatrix=new Mat43();
		this.mixedmatrix=new Mat43();
		this.flg=false;
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
		this.offset=new Vec2();
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
		this.groupratios = new Array()
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

	var calcMesh=new Mesh();
	var calcFaces=new Array();
	for(i=0;i<1000;i++){
		var vertex=new Vertex();
		calcMesh.vertices.push(vertex);
		for(var j=0;j<8;j++){
			vertex.groups.push(-1);
			vertex.groupratios.push(-1);
		}

		var face=new Face();
		calcFaces.push(face);
	}
	calcMesh.faces=new Array(1000);

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
			
	
			if(resArray.length===1){
				value = resArray[0].replace(/^\s+|\s+$/g, "");
				if(value.match(/\"(.+?)\"/)){
					value=RegExp.$1
				}else if(""+parseInt(value)===value){
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
					}else if(""+parseInt(value)===value){
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
				}else if(""+parseInt(value)===value){
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
		if(buf.substring(0,11) ==="Metasequoia"){
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
				material.emt=mqo.materials[i].emt
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
					if(mqo.objects[i].faces[j].vertexnum===4){
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
					face.fs= mqo.objects[i].faces[j].fs;

				}
			}	

		//}else if(buf.substring(0,4)==="PMX "){
		//	return Mmd.loadPmx(url)
		//}else if(buf.substring(0,3)==="Pmd"){
		//	return Mmd.loadPmd(url)
		}else if(buf.substring(0,11) ==="Ono3dObject"){
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
			if(texture.typ==="NORMAL"){
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
				if(o3o.materials[i].texture === o3o.textures[j].name){
					o3o.materials[i].texture=o3o.textures[j]
					break;
				}
			}
		}

		//edge
		var faces,edges
		for(i=0,imax=o3o.meshes.length;i<imax;i++){
			faces=o3o.meshes[i].faces
			if(o3o.meshes[i].edges){
				edges=o3o.meshes[i].edges;
			}else{
				edges=new Array()
				o3o.meshes[i].edges=edges;
			}
			for(j=0,jmax=faces.length;j<jmax;j++){
				face=faces[j]
				if(faces[j].idxnum===3){
					addEdge(edges,face.idx[0],face.idx[1],j)
					addEdge(edges,face.idx[1],face.idx[2],j)
					addEdge(edges,face.idx[2],face.idx[0],j)
				}else if(faces[j].idxnum===4){
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
			if((edges[i].v0===v0 && edges[i].v1===v1)
			|| (edges[i].v0===v1 && edges[i].v1===v0)){
				if(edges[i].f0<0){
					edges[i].f0=f
				}else{
					edges[i].f1=f
				}
				return 0
			}
		}
		var edge = new Edge()
		edge.v0=v0
		edge.v1=v1
		edge.f0=f
		edge.f1=-1;
		edges.push(edge)
		return 1
	}
	var name2Obj = function(name,objects){
		var i
		for(i=objects.length;i--;){
			if(objects[i].name === name){
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
			if(type === "Textures"){
				while(line=seek(data)){
					texture=new Texture()
					o3o.textures.push(texture)
					obj=readValue2(line)
					texture.path=obj.path
					texture.name=obj.name[0]
					texture.typ=obj.typ;
				}
			}else if(type === "Materials"){
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
					if(obj.action){
						material.action = obj.action[0]
					}
					if(obj.tex){
						material.texture=obj.tex[0]
					}
					material.normal=obj.normal;
				}
				
			}else if(type==="Meshes"){
				while(line=seek(data)){
					if(!/{/.test(line))continue
					mesh=new Mesh()
					o3o.meshes.push(mesh)
					
					while(line=seek(data)){
						if(line.match(/double_sided:(.*)/)){
							mesh.flg&=~Ono3d.RF_DOUBLE_SIDED
							mesh.flg|=Ono3d.RF_DOUBLE_SIDED*parseInt(RegExp.$1)
						}else if(line.match(/Edges (.+)\[/)){
							while(line=seek(data)){
								var values = line.split(",");
								mesh.edges=new Array();
								for(i=0;i<values.length;i+=2){
									var edge = new Edge()
									edge.v0=parseInt(values[i])
									edge.v1=parseInt(values[i+1])
									edge.f0=-1;
									edge.f1=-1;
									mesh.edges.push(edge);
								}
							}

						}else if(line.match(/Vertices (.+)\[/)){
							while(line=seek(data)){
								vertex=new Vertex()
								mesh.vertices.push(vertex)
								obj=readValue2(line)
								vertex.pos=obj.pos
								vertex.normal=obj.normal
								if(obj.groups)vertex.groups= obj.groups
								if(obj.groupratios)vertex.groupratios= obj.groupratios
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
			}else if(type==="Armatures"){
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
			}else if(type==="Collisions"){
				while(line=seek(data)){
					if(!/{/.test(line))continue
					var colligion=new Collision()
					o3o.collisions.push(colligion)
				
					while(line=seek(data)){
						readValue(colligion,line)
					}
				}
			}else if(type==="Actions"){
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
								res = line.match(/target:"(.*)",(\S+),(.+) (.+)\[(.+)\]/);
								fcurve.target=String(res[1]);
								fcurve.type=fcurveConvert[String(res[2])];
								fcurve.array_index=parseInt(res[3]);
								var values = String(res[5]).split(",");
								if(fcurve.type===FCURVE_ROT_QUAT){
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
				o3o.objectsN=[];
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
					o3o.objectsN[object.name]=object;
				}
			}else if(type==="Scenes"){
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
			if(object.type==="MESH"){
				object.objecttype=OBJECT_MESH;
				object.data=name2Obj(object.data,o3o.meshes)
			}else if(object.type==="ARMATURE"){
				object.objecttype=OBJECT_ARMATURE;
				object.data=name2Obj(object.data,o3o.armatures)
				for(k=0;k<object.posebones.length;k++){
					object.posebones[k].target=name2Obj(object.posebones[k].target,object.data.bones)
					object.posebones[k].parent=name2Obj(object.posebones[k].parent,object.posebones)
				}
			}else{
				object.objecttype="";
				object.data=null
			}
			object.parent=name2Obj(object.parent,o3o.objects)
			for(k=0;k<object.modifiers.length;k++){
				object.modifiers[k].object=name2Obj(object.modifiers[k].object,o3o.objects)
				var  name=object.modifiers[k].vertex_group;
				for(var l=0;l<object.groups.length;l++){
					if(object.groups[l].name===name){
						object.modifiers[k].vertex_group=l;
						break;
					}
				}
			}
			object.action=name2Obj(object.action,o3o.actions)
			Mat43.getInv(object.imatrix,object.matrix)
		}
		for(i=o3o.materials.length;i--;j){
			o3o.materials[i].action=name2Obj(o3o.materials[i].action,o3o.actions)
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
					if(bone.parent === armature.bones[k].name){
						bone.parent = armature.bones[k] 
						break
					}
				}
			}
		}

		return o3o
	}
	var calcVertex = function(obj,physics){
		var i,j
			,src,dst
			,srcarr,dstarr
			,dstvertices=calcMesh.vertices
			,srcvertices=obj.data.vertices
			,mesh=obj.data;
		;
		rvSize=obj.data.vertices.length;
		for(i = rvSize;i--;){
			src = srcvertices[i];
			dst = dstvertices[i];
			srcarr = src.pos;
			dstarr= dst.pos;
			dstarr[0]=srcarr[0];
			dstarr[1]=srcarr[1];
			dstarr[2]=srcarr[2];
			dstarr= dst.groups;
			srcarr= src.groups;
			dstarr[0]=-1;
			dstarr[1]=-1;
			dstarr[2]=-1;
			dstarr[3]=-1;
			dstarr[4]=-1;
			dstarr[5]=-1;
			dstarr[6]=-1;
			dstarr[7]=-1;
			for(var k=0;k<srcarr.length;k++){
				dstarr[k]=srcarr[k];
				//dst.groupratios[k]=src.groupratios[k];
			}
			dst.groupratios=src.groupratios;
		}

	}
	var setFaces =function(){
		var rfIndex=ono3d.renderFaces_index;
		var mesh=calcMesh;
		var renderFaces=ono3d.renderFaces
		var face,renderFace;
		var material;
		var rf= ono3d.rf | mesh.flg
			var vertex
		var rvIndex=ono3d.renderVertices_index;
		for(i=0;i<rfSize;i++){
			
			face=mesh.faces[i]
			renderFace = renderFaces[rfIndex+i]
			renderFace.reverseFlg=0

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
			if(face.fs){
				renderFace.rf &= ~Ono3d.RF_OUTLINE;
			}
			renderFace.operator = Ono3d.OP_TRIANGLES
			renderFace.smoothing = ono3d.smoothing
			if(ono3d.smoothing>0)renderFace.rf|=Ono3d.RF_SMOOTH

			renderFace.vertices[0]= face.idx[0]+rvIndex;
			renderFace.vertices[1]= face.idx[1]+rvIndex;
			renderFace.vertices[2]= face.idx[2]+rvIndex;

			renderFace.normalmap=null;
			var offsetx=0,offsety=0;
			if(material.texture){
				if(material.normal>0){
					renderFace.normalmap= material.texture.image
					renderFace.normalmapvalue=material.normal;
				}else{
					renderFace.texture = material.texture.image
				}
				offsetx=material.offset[0];
				offsety=material.offset[1];
			}else{
				renderFace.texture = null
			}
			renderFace.envTexture = ono3d.envTexture
			renderFace.uv[0][0] = face.uv[0]+offsetx
			renderFace.uv[0][1] = face.uv[1]+offsety
			renderFace.uv[1][0] = face.uv[2]+offsetx
			renderFace.uv[1][1] = face.uv[3]+offsety
			renderFace.uv[2][0] = face.uv[4]+offsetx
			renderFace.uv[2][1] = face.uv[5]+offsety
		}
	}
	var _calcFaces =function(obj){
		var mesh=obj.data;
		var facesize=mesh.faces.length;
		var face,renderFace;
		var transMat = ono3d.transMat;
		var i;

		rfSize=mesh.faces.length;

		if(transMat[0]*transMat[5]*transMat[10]
		+ transMat[1]*transMat[6]*transMat[8]
		+ transMat[2]*transMat[4]*transMat[9]
		- transMat[0]*transMat[6]*transMat[9]
		- transMat[2]*transMat[5]*transMat[8]
		- transMat[1]*transMat[4]*transMat[10]
			<0){
			var faces=mesh.faces;
			for(i=faces.length;i--;){
				var calcFace=calcFaces[i];
				var face=faces[i];
				calcMesh.faces[i]=calcFace;
				calcFace.material = face.material;

				calcFace.idx[0]= face.idx[0]
				calcFace.idx[1]= face.idx[2]
				calcFace.idx[2]= face.idx[1]
				calcFace.idxnum=face.idxnum;

				calcFace.uv[0] = face.uv[0]
				calcFace.uv[1] = face.uv[1]
				calcFace.uv[2] = face.uv[4]
				calcFace.uv[3] = face.uv[5]
				calcFace.uv[4] = face.uv[2]
				calcFace.uv[5] = face.uv[3]
				calcFace.fs = face.fs;
			}
			for(i=0;i<mesh.faces.length;i++){
				face=mesh.faces[i];

				if(face.idxnum ===4){
					calcFace.idxnum=3;
					calcFace=calcFaces[rfSize];
					calcMesh.faces[rfSize]=calcFace;
					calcFace.material = face.material;
					calcFace.idxnum=3;

					calcFace.idx[0]= face.idx[0]
					calcFace.idx[1]= face.idx[3]
					calcFace.idx[2]= face.idx[2]

					calcFace.uv[0] = face.uv[0]
					calcFace.uv[1] = face.uv[1]
					calcFace.uv[2] = face.uv[6]
					calcFace.uv[3] = face.uv[7]
					calcFace.uv[4] = face.uv[4]
					calcFace.uv[5] = face.uv[5]

					calcFace.fs = face.fs;
					rfSize++;
				}
			}
		}else{
			for(i=0;i<mesh.faces.length;i++){
				calcMesh.faces[i] = mesh.faces[i]
			}
			for(i=0;i<mesh.faces.length;i++){
				face=mesh.faces[i];

				if(face.idxnum ===4  ){
					calcFace=calcFaces[rfSize];
					calcFace.idxnum=3;
					calcMesh.faces[rfSize]=calcFace;
					calcFace.material = face.material;
					calcFace.idxnum=3;

					calcFace.idx[0]= face.idx[0]
					calcFace.idx[1]= face.idx[1]
					calcFace.idx[2]= face.idx[2]

					calcFace.uv[0] = face.uv[0]
					calcFace.uv[1] = face.uv[1]
					calcFace.uv[2] = face.uv[2]
					calcFace.uv[3] = face.uv[3]
					calcFace.uv[4] = face.uv[4]
					calcFace.uv[5] = face.uv[5]

					calcFace=calcFaces[rfSize];
					calcMesh.faces[rfSize]=calcFace;
					calcFace.material = face.material;
					calcFace.idxnum=3;

					calcFace.idx[0]= face.idx[0]
					calcFace.idx[1]= face.idx[2]
					calcFace.idx[2]= face.idx[3]

					calcFace.uv[0] = face.uv[0]
					calcFace.uv[1] = face.uv[1]
					calcFace.uv[2] = face.uv[4]
					calcFace.uv[3] = face.uv[5]
					calcFace.uv[4] = face.uv[6]
					calcFace.uv[5] = face.uv[7]

					calcFace.fs = face.fs;
					rfSize++;
				}
			}
		}

		calcMesh.faces[rfSize]=null;
	}
	
	var calcNormal = function(){
		var i,j
		,lightSource
		,light
		,bufVertex
		,face
		,bufFace
		,lightPow
		,normal
		,renderVertices =ono3d.renderVertices
		,renderFaces =ono3d.renderFaces
		,rvIndex=ono3d.renderVertices_index
		,rfIndex=ono3d.renderFaces_index
		;

		for(i=rfSize;i--;){
			bufFace = renderFaces[i+rfIndex]
			bufFace.vertices[0]=renderVertices[bufFace.vertices[0]];
			bufFace.vertices[1]=renderVertices[bufFace.vertices[1]];
			bufFace.vertices[2]=renderVertices[bufFace.vertices[2]];

			bufFace.z = (bufFace.vertices[0].pos[2]+bufFace.vertices[1].pos[2]+bufFace.vertices[2].pos[2])*0.33333333;
		}
		if( ono3d.smoothing>0){
			for(i = rvSize;i--;){
				normal= renderVertices[i+rvIndex].normal
				normal[0]=0
				normal[1]=0
				normal[2]=0
			}
		}

		for(j=ono3d.lightSources.length;j--;){
			lightSource = ono3d.lightSources[j]
			if(lightSource.type ===Ono3d.LT_DIRECTION){
				//Mat43.dotMat33Vec3(lightSource.viewAngle,ono3d.viewMatrix,lightSource.angle)
				Vec3.copy(lightSource.viewAngle,lightSource.angle)
			}
		}
		//面の法線を算出
		for(i=rfSize;i--;){
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
			if(bufFace.rf & Ono3d.RF_OUTLINE){
				Mat43.dotMat43Vec3(bV0,ono3d.viewMatrix,bufFace.vertices[0].pos);
				Mat43.dotMat33Vec3(bV1,ono3d.viewMatrix,bufFace.normal);
				if(Vec3.dot(bV1,bV0)<0){
					bufFace.cul=1;
				}else{
					bufFace.cul=-1;
				}	
			}else{
				bufFace.cul=0;
			}

		}

		if( ono3d.smoothing>0){
			for(i = rvSize;i--;){
				bufVertex = renderVertices[i+rvIndex]
				Vec3.norm(bufVertex.normal)
			}
		}
		

	}
	var changeFrame= function(obj,name,action,frame){
		var a,b,c
			,tim,ratio
			,fcurve
			,keys
			,mat43
			,paramA,paramB
			,quat = bVec4
		;

		frame=frame%action.endframe;

		for(var i=0,imax=action.fcurves.length;i<imax;i++){
			if(action.fcurves[i].target !== name)continue;
			fcurve=action.fcurves[i]
			keys=fcurve.keys;
			tim=frame

			a=0;b=fcurve.keys.length-1
			switch(fcurve.repeatmode){
			case REPEAT_NONE:
				if(tim<keys[a])tim=keys[a]
				if(tim>keys[b])tim=keys[b]
				break
			case REPEAT_LOOP:
				if(tim<keys[a])tim=keys[b]-(keys[a]-tim)%(keys[b]-keys[a])
				if(tim>keys[b])tim=keys[a]+(tim-keys[b])%(keys[b]-keys[a])
				break
			case REPEAT_LINER:
				break
			}
			while (a < b) {
				c = (a + b) >>1;
				if (keys[c] <= tim){
					a = c + 1;
				}else{
					b = c;
				}
			}
			if(tim === keys[a]){
				ratio=0;
				paramA=fcurve.params[a]
				paramB=paramA;//fcurve.params[a]
			}else{
				if(a>0)a--
				ratio=(tim-keys[a])/(keys[a+1]-keys[a])
				paramA=fcurve.params[a]
				paramB=fcurve.params[a+1]
			}
			if(fcurve.type==FCURVE_ROT_QUAT){
				Vec4.slerp(obj.rotation,paramA,paramB,ratio)
			}else{
				var target;
				switch(fcurve.type){
				case FCURVE_ROT_EULER:
					target=~obj.rotation;
					break;
				case FCURVE_SCALE:
					target=~obj.scale;
					break;
				case FCURVE_LOCATIONX:
					target=obj.location;
					break;
				}
				target[fcurve.array_index]= (paramB-paramA)*ratio + paramA
			}
		}
	}
	var addaction = function(obj,name,action,frame){
		var a,b,c
			,tim,ratio
			,fcurve
			,keys
			,mat43
			,paramA,paramB
			,quat = bVec4
		;

		frame=frame%action.endframe;

		for(var i=0,imax=action.fcurves.length;i<imax;i++){
			if(action.fcurves[i].target !== name)continue;
			fcurve=action.fcurves[i]
			keys=fcurve.keys;
			tim=frame

			a=0;b=fcurve.keys.length-1
			switch(fcurve.repeatmode){
			case REPEAT_NONE:
				if(tim<keys[a])tim=keys[a]
				if(tim>keys[b])tim=keys[b]
				break
			case REPEAT_LOOP:
				if(tim<keys[a])tim=keys[b]-(keys[a]-tim)%(keys[b]-keys[a])
				if(tim>keys[b])tim=keys[a]+(tim-keys[b])%(keys[b]-keys[a])
				break
			case REPEAT_LINER:
				break
			}
			while (a < b) {
				c = (a + b) >>1;
				if (keys[c] <= tim){
					a = c + 1;
				}else{
					b = c;
				}
			}
			if(tim === keys[a]){
				ratio=0;
				paramA=fcurve.params[a]
				paramB=paramA;//fcurve.params[a]
			}else{
				if(a>0)a--
				ratio=(tim-keys[a])/(keys[a+1]-keys[a])
				paramA=fcurve.params[a]
				paramB=fcurve.params[a+1]
			}
			if(fcurve.type==FCURVE_ROT_QUAT){
				Vec4.slerp(obj.rotation,paramA,paramB,ratio)
			}else{
				var target;
				switch(fcurve.type){
				case FCURVE_ROT_EULER:
					target=obj.rotation;
					break;
				case FCURVE_SCALE:
					target=obj.scale;
					break;
				case FCURVE_LOCATION:
					target=obj.location;
					break;
				case FCURVE_OFFSET:
					target=obj.offset;
					break;
				}
				target[fcurve.array_index]= (paramB-paramA)*ratio + paramA
			}
		}
	}
	var calcMatrixArmature=function(armature,frame){
		var posebones=armature.posebones;
		var posebone;
		var actmatrix;
		for(var i=posebones.length;i--;){
			posebone=posebones[i];
			actmatrix=posebone.actmatrix;
			if(armature.action){
				addaction(posebone,posebone.target.name,armature.action,frame)
			}
			genMatrix(posebone);
			Mat43.dot(actmatrix,actmatrix,posebone.target.imatrix)
			Mat43.dot(actmatrix,posebone.target.matrix,actmatrix)
			posebone.flg=false;
		}
		for(var i=0;i<posebones.length;i++){
			mixBoneMatrix(posebones[i]);
		}
	}
	var genMatrix=function(obj){
		var mat=obj.actmatrix;
		if(obj.rotation_mode===QUATERNION){
			Vec4.qTOm(mat,obj.rotation);
				
		}else{
			Mat43.getRotMat(mat,obj.rotation[0],1,0,0)
			Mat43.getRotMat(bM,obj.rotation[1],0,1,0)
			Mat43.dot(mat,bM,mat);
			Mat43.getRotMat(bM,obj.rotation[2],0,0,1)
			Mat43.dot(mat,bM,mat);
		}
		var s=obj.scale[0];
		mat[0]*=s; mat[1]*=s; mat[2]*=s;
		s=obj.scale[1];
		mat[4]*=s; mat[5]*=s; mat[6]*=s;
		s=obj.scale[2];
		mat[8]*=s; mat[9]*=s; mat[10]*=s;

		mat[12]=obj.location[0];
		mat[13]=obj.location[1];
		mat[14]=obj.location[2];
	}
	var getMatrix=function(obj,frame){
		if(obj.flg){
			return obj.mixedmatrix;
		}
		if(obj.action){
			addaction(obj,"",obj.action,frame)
		}
		genMatrix(obj);

		if(obj.parent){
			if(!obj.parent.flg){
				getMatrix(obj.parent,frame);
			}
			Mat43.dot(obj.mixedmatrix,obj.iparentmatrix,obj.actmatrix);
			Mat43.dot(obj.mixedmatrix,obj.parent.mixedmatrix,obj.mixedmatrix);
		}else{
			Mat43.copy(obj.mixedmatrix,obj.actmatrix);
		}
		obj.flg=true;
		return obj.mixedmatrix;
	}
	var calcMatrix=function(obj,frame){
		if(obj.action){
			addaction(obj,"",obj.action,frame)
		}
		genMatrix(obj);

		if(obj.objecttype===OBJECT_ARMATURE){
			calcMatrixArmature(obj,frame);
		}
		obj.flg=false;
	}
	var mixMatrix=function(obj){
		if(obj.parent){
			if(!obj.parent.flg){
				mixMatrix(obj.parent);
			}
			Mat43.dot(obj.mixedmatrix,obj.iparentmatrix,obj.actmatrix);
			Mat43.dot(obj.mixedmatrix,obj.parent.mixedmatrix,obj.mixedmatrix);
		}else{
			Mat43.copy(obj.mixedmatrix,obj.actmatrix);
		}
		obj.flg=true;
	}
	var mixBoneMatrix=function(bone){
		if(bone.parent){
			if(!bone.parent.flg){
				mixBoneMatrix(bone.parent);
			}
			Mat43.dot(bone.mixedmatrix,bone.parent.mixedmatrix,bone.actmatrix);
		}else{
			Mat43.copy(bone.mixedmatrix,bone.actmatrix);
		}
		bone.flg=true;
	}
	
	O3o.setFrame=function(o3o,scene,frame){
		var objects = scene.objects;
		for(i=o3o.materials.length;i--;){
			var material=o3o.materials[i];
			if(material.action){
				addaction(material,"0",material.action,frame);
			}
		}

		for(i=objects.length;i--;){
			objects[i].flg=false;
			if(objects[i].objecttype===OBJECT_ARMATURE){
				var posebones=objects[i].posebones;
				for(j=posebones.length;j--;){
					posebones[j].flg=false;
				}

			}
		}
		for(i=objects.length;i--;){
			calcMatrix(objects[i],frame);
		}
		for(i=0;i<objects.length;i++){
			mixMatrix(objects[i]);
		}

	}
	O3o.drawScene = function(o3o,num,frame,physics){
		var i;
		var scene=o3o.scenes[num];
		var objects = scene.objects;

		for(i=objects.length;i--;){
			var obj=objects[i];
			if(obj.objecttype!=OBJECT_MESH)continue;
			if(obj.hide_render)continue;
			drawObject(scene.objects[i],physics)
		}
	}
	var abs=Math.abs;
	var table=new Array(64);
	var calcModifier=function(obj,phyObjs){
		var calcMeshVertices =calcMesh.vertices
		var renderFaces=calcMesh.faces;
		var renderVertex;
		var groupMatrix;
		var groupName;
		var jmax,k,kmax;
		var x,y,z;
		var phyObj=null;
		if(phyObjs){
			for(i=0;i<phyObjs.length;i++){
				if(phyObjs[i].name === obj.name
				&& phyObjs[i].type===OnoPhy.SPRING_MESH){
					phyObj=phyObjs[i];
					break;
				}
			}
		}
		for(var i=0,imax=obj.modifiers.length;i<imax;i++){
			var mod = obj.modifiers[i];

			if(mod.type!="MIRROR" && phyObj){
				continue;
			}
			if(mod.type==="MIRROR"){
				var dstvertices,srcvertices;
				var dstvertex,srcvertex;
				for(j =0;j<rvSize;j++){
					srcvertex=calcMeshVertices[j];
					dstvertex=calcMeshVertices[j+rvSize];
	
					dstvertex.pos[0]=-srcvertex.pos[0]
					dstvertex.pos[1]=srcvertex.pos[1]
					dstvertex.pos[2]=srcvertex.pos[2]
					//dstvertex.groups=srcvertex.groups;
					dstvertex.groupratios=srcvertex.groupratios;
					for(var k=0;k<srcvertex.groups.length;k++){
						dstvertex.groups[k]=srcvertex.groups[k];
					//	dstvertex.groupratios[k]=srcvertex.groupratios[k];
					}
					
				}
				var dstFace,srcFace;
				for(var j =0;j<rfSize;j++){
					srcFace= calcMesh.faces[j]
					srcvertices=srcFace.idx;
					dstFace= calcFaces[rfSize+j]
					renderFaces[rfSize+j] = dstFace;
					dstFace.idxnum=srcFace.idxnum;
					dstvertices=dstFace.idx;
					dstvertices[0] = srcvertices[1]
					dstvertices[1] = srcvertices[0]
					dstvertices[2] = srcvertices[2]
					if(abs(calcMeshVertices[dstvertices[0]].pos[0])>0.01){
						dstvertices[0]+=rvSize;
					}
					if(abs(calcMeshVertices[dstvertices[1]].pos[0])>0.01){
						dstvertices[1]+=rvSize;
					}
					if(abs(calcMeshVertices[dstvertices[2]].pos[0])>0.01){
						dstvertices[2]+=rvSize;
					}
					var dst=dstFace.uv,src=srcFace.uv
					dst[0] = src[2]
					dst[1] = src[3]
					dst[2] = src[0]
					dst[3] = src[1]
					dst[4] = src[4]
					dst[5] = src[5]

					dstFace.material = srcFace.material;
					dstFace.fs= srcFace.fs;

				}

				for(j=0;j<obj.groups.length;j++){
					table[j]=j;
					var groupName=obj.groups[j].name;
					if(groupName.match(/L$/)){
						groupName=groupName.replace(/L$/,"R");
					}else if(groupName.match(/R$/)){
						groupName=groupName.replace(/R$/,"L");
					}else{
						continue;
					}

					for(k=0;k<obj.groups.length;k++){
						if(groupName===obj.groups[k].name){
							table[j]=k;
							break;
						}
					}
				}
				for(k=0;k<rvSize;k++){
					var vertex=calcMeshVertices[rvSize+k];
					for(var l=0;l<8;l++){
						if(vertex.groups[l]<0)continue;
						vertex.groups[l]=table[vertex.groups[l]];
					}
				}
					

				rvSize+=rvSize;
				rfSize+=rfSize;
			}else if(mod.type==="ARMATURE"){

				var ratio,pos,vertex;
				var groups=obj.groups;

				Mat43.getInv(bM2,mod.object.mixedmatrix);
				Mat43.dot(bM,bM2,obj.mixedmatrix);
				Mat43.getInv(bM2,bM);

				var posebones=mod.object.posebones;
				for(var j=groups.length;j--;){
					groupMatFlg[j] = false;
					groupName=groups[j].name;
					groupMatrix = groupMatricies[j];
					for(k=0,kmax=posebones.length;k<kmax;k++){
						if(posebones[k].name!=groupName)continue
						groupMatFlg[j] = true;
						Mat43.dot(groupMatricies[j],posebones[k].mixedmatrix,bM);
						Mat43.dot(groupMatrix,bM2,groupMatrix);
						break
					}
				}
				for(k = 0;k<rvSize;k++){
					pos = calcMeshVertices[k].pos
					vertex = calcMeshVertices[k];
					var vertexGroups = vertex.groups;
	
					x=0;
					y=0;
					z=0;
					var ratiosum=0;
					for(j = vertexGroups.length;j--;){
						if(vertexGroups[j]<0)continue;
						if(!groupMatFlg[vertexGroups[j]]){
							continue;
						}
						ratio=vertex.groupratios[j]
						Mat43.dotMat43Vec3(bV0,groupMatricies[vertexGroups[j]],pos)
						
						x +=  bV0[0] * ratio
						y +=  bV0[1] * ratio
						z +=  bV0[2] * ratio
						ratiosum+=ratio;
					}
					if(ratiosum>0){
						ratiosum=1.0/ratiosum;
						pos[0] =  x * ratiosum;
						pos[1] =  y * ratiosum;
						pos[2] =  z * ratiosum;
					}else{
						if(mod.vertex_group >=0){
							Mat43.dotMat43Vec3(pos,groupMatricies[mod.vertex_group],pos)
						}
					}
				}
			}
		}

	}
	var _edges=[];
	var drawObject = O3o.drawObject = function(obj,physics){
		var i,j,k
		var phyObj=null;
		if(physics){
			for(i=0;i<physics.length;i++){
				if( physics[i].name===obj.name
					&& physics[i].type===OnoPhy.SPRING_MESH){
					phyObj=physics[i];
					break;
				}
			}
		}
		calcVertex(obj,physics)
		_calcFaces(obj)
		calcModifier(obj,physics);

		var renderVertices =ono3d.renderVertices;
		var renderFaces=ono3d.renderFaces;
		var rvIndex=ono3d.renderVertices_index;
		var rfIndex=ono3d.renderFaces_index;
		if(phyObj){
			var poses=phyObj.pos;
			var mat=ono3d.viewMatrix;
			for(j=phyObj.pos.length;j--;){
				//Mat43.dotMat43Vec3(renderVertices[j+rvIndex].pos,mat,poses[j])
				Vec3.copy(renderVertices[j+rvIndex].pos,poses[j])
			}
		}else{
			var calcMeshVertices=calcMesh.vertices;
			Mat43.dot(defMatrix,ono3d.worldMatrix,obj.mixedmatrix);
			//Mat43.dot(defMatrix,ono3d.viewMatrix,defMatrix);

			for(j=rvSize;j--;){
				Mat43.dotMat43Vec3(renderVertices[j+rvIndex].pos,defMatrix,calcMeshVertices[j].pos)
			}
		}
		setFaces();
		calcNormal();
		if( ono3d.rf  & Ono3d.RF_OUTLINE){

			_edges=[];
			
			for(i=0;i<rfSize;i++){
				var renderFace=renderFaces[ono3d.renderFaces_index+i];
				if(renderFace.operator === Ono3d.OP_TRIANGLES && renderFace){
					addEdge(_edges,renderFace.vertices[0].idx,renderFace.vertices[1].idx,i)
					addEdge(_edges,renderFace.vertices[1].idx,renderFace.vertices[2].idx,i)
					addEdge(_edges,renderFace.vertices[2].idx,renderFace.vertices[0].idx,i)
				}
			}

			var edges=_edges;
//		var edges=obj.data.edges;
			for(i=0;i<edges.length;i++){
				var edge=edges[i];
				var flg=false;
				if(edge.f0<0)continue;
				if(edge.f1<0){
					if(renderFaces[edge.f0+ono3d.renderFaces_index].cul>0){
						flg=true;
					}
				}else{
					if(renderFaces[edge.f0+ono3d.renderFaces_index].cul
						* renderFaces[edge.f1+ono3d.renderFaces_index].cul <0){
						flg=true;
					}
				}
				if(!flg)continue;
				var renderFace=renderFaces[ono3d.renderFaces_index+rfSize];
				renderFace.vertices[0] = renderVertices[/*ono3d.renderVertices_index+*/edge.v0]
				renderFace.vertices[1] = renderVertices[/*ono3d.renderVertices_index+*/edge.v1]
				renderFace.r = 0;
				renderFace.g = 0;
				renderFace.b = 0;
				renderFace.a = 1;
				renderFace.bold = 1;
				renderFace.operator = Ono3d.OP_LINE
				//renderFace.z=
				//renderFace.z+=
				renderFace.rf=ono3d.rf
				renderFace.texture=null;
				rfSize++;
			}
			
		}
		ono3d.renderVertices_index+=rvSize;
		ono3d.renderFaces_index+=rfSize;
		
	}

	O3o.createPhyObjs = function(obj,onoPhy){
		var mesh,obj
		,res
		,i,j,vertices
		var renderVertices =calcMesh.vertices;
		var renderVertex;
		var renderFaces =calcMesh.faces;
		var renderFace;
		var idx;
		

		var mod;
		for(var j=0;j<obj.modifiers.length;j++){
			mod = obj.modifiers[j];
			if(mod.type==="CLOTH" || mod.type==="SOFT_BODY"){
				mesh = obj.data;
				res=null
				vertices = calcMesh.vertices;
				calcPhyObj(obj);
				res=onoPhy.createSpringMesh(rvSize)
				for(j=0;j<rvSize;j++){
					Vec3.copy(res.pos[j],renderVertices[j].pos);
					Vec3.copy(res.truepos[j],renderVertices[j].pos);
					for(var k=0,kmax=vertices[j].groups.length;k<kmax;k++){
						if(vertices[j].groups[k]<0)break;
						if(obj.groups[vertices[j].groups[k]].name === mod.pin){
							res.fixes[j]=1
							break;
						}
					}
				}

				if(mod.type==="CLOTH"){
					res.mass=mod.mass;
					res.friction=mod.air_damping;
					res.air_damping=mod.air_damping;
					res.vel_damping=mod.vel_damping;
					res.edgePull= mod.structural;
					res.edgePush= mod.structural;
					res.goalDefault=mod.bending_stiffness;
					res.edgeDamping = mod.vel_damping;
				}
				if(mod.type==="SOFT_BODY"){
					res.friction= mod.friction*mod.mass;
					res.mass=mod.mass;
					res.speed= mod.speed;
					res.goalDefault= mod.goalDefault*2;
					res.edgePull= mod.edgePull*10;
					res.edgePush= mod.edgePush*10;
					res.edgeDamping= mod.edgeDamping ;
				}

				var face,edges
				for(j=0;j<rfSize;j++){
					face=renderFaces[j]
					if(face.idxnum=== 3){
						idx= new Array(3);
						idx[0]= face.idx[0]
						idx[1]= face.idx[1]
						idx[2]= face.idx[2]
						res.faces.push(idx);
						addJoint(res,idx[0],idx[1])
						addJoint(res,idx[1],idx[2])
						addJoint(res,idx[2],idx[0])
					}
				}
				for(j=0;j<rvSize;j++){
					for(k=j+1;k<rvSize;k++){
						if(Vec3.len(renderVertices[j].pos,renderVertices[k].pos)<0.0001){
							var joint={};
							joint.v0=j;
							joint.v1=k;
							res.joints.push(joint)
						}
					}
				}
				res.mesh = mesh
				res.name=obj.name
			}else if(mod.type==="COLLISION"){
				res=onoPhy.createCollision(OnoPhy.CAPSULE)
				res.name=obj.name
				res.fix=1;
			}
		}
		return res;
	}
	var addJoint=function(spring,v0,v1){
		var i,imax
		var joints=spring.joints;
		for(i=0,imax=joints.length;i<imax;i++){
			if((joints[i].v0===v0 && joints[i].v1===v1)
			|| (joints[i].v0===v1 && joints[i].v1===v0)){
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
		var i,imax,j;
		var objects = scene.objects;
		var object;
		var phyName,phyObj;
		var calcMeshVertices=calcMesh.vertices;

		for(i=objects.length;i--;){
			calcMatrix(objects[i],frame);
		}
		for(i=0;i<objects.length;i++){
			mixMatrix(objects[i]);
		}
		for(j=0;j<phyObjs.length;j++){
			phyName=phyObjs[j].name;
			for(i=0,imax=objects.length;i<imax;i++){
				object=objects[i];
				if(phyName===object.name){
					break;
				}else{
					object=null;
				}
			}
			if(object=== null)continue;
			phyObj=phyObjs[j];
			if(phyObj.type=== OnoPhy.SPRING_MESH){
				var poses=phyObj.pos;
				calcPhyObj(object);
				Mat43.dot(defMatrix,ono3d.worldMatrix,object.mixedmatrix);
				for(i=0,imax=phyObj.pos.length;i<imax;i++){
					Mat43.dotMat43Vec3(poses[i],defMatrix,calcMeshVertices[i].pos)
					var pos=phyObj.v[i];
					pos[0]=0; pos[1]=0; pos[2]=0;
				}
			}
		}
	}
	O3o.initPhyObjs=initPhyObjs;
	var calcPhyObj=function(obj,flg){
		var renderVertices =calcMesh.vertices;
		var renderVertex;
		var i,imax;
		Mat43.setInit(defMatrix)

		var matrix=obj.actmatrix;
		calcVertex(obj);
		_calcFaces(obj);

		calcModifier(obj);
	}

	O3o.movePhyObjs=function(scene,frame,phyObjs){
		if(phyObjs === null)return;
		var i,imax,j,jmax;
		var objects = scene.objects;
		var object;
		var phyName,phyObj;

		jmax=phyObjs.length;
		for(j=0;j<phyObjs.length;j++){
			phyName=phyObjs[j].name;
			object=null;
			for(i=0,imax=objects.length;i<imax;i++){
				if(phyName===objects[i].name){
					object=objects[i]
					break;
				}
			}
			if(object=== null)continue;
			phyObj=phyObjs[j];
			var truepos=phyObj.truepos;
			if(phyObj.type===OnoPhy.SPRING_MESH){
				var calcMeshVertices=calcMesh.vertices;
				calcPhyObj(object);
				Mat43.dot(defMatrix,ono3d.worldMatrix,object.mixedmatrix);
				for(i=0,imax=phyObj.pos.length;i<imax;i++){
					Mat43.dotMat43Vec3(truepos[i],defMatrix,calcMeshVertices[i].pos)
				}
			}else{
				calcPhyObj(object);
				Mat43.dot(phyObj.matrix,ono3d.worldMatrix,object.mixedmatrix)
			}
		}
	}
	return O3o
})()
