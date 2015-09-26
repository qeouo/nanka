bl_info = {
    "name": "Export Ono3dObject (.o3o)",
    "author": "ono",
    "version": (0,0,1),
    "blender": (2, 6, 3),
    "location": "File > Export > Ono3dObject (.o3o)",
    "description": "Export Ono3dObject (.o3o)",
    "warning": "",
    "wiki_url": "",
    "tracker_url": "",
    "category": "Import-Export"}

#g_magicCode = "Ono3dObject"
#g_version = "0.13"

import math 

import os
from math import radians
import bpy
from mathutils import *

import re

config = ""
class Ono3dObjectExporterSettings:
    def __init__(self,
                 context,
                 FilePath,
                 ):
        self.context = context
        self.FilePath = FilePath

def fileout(content):
    config.File.write("{}{}".format("  " * config.Whitespace,content))

def fileout2(content):
    config.File.write(content)

def fileoutLu():
    fileout2("[\n")
    config.Whitespace+=1

def fileoutLd():
    config.Whitespace-=1
    fileout("]\n")

def fileoutMu():
    fileout2("{\n")
    config.Whitespace+=1

def fileoutMd():
    config.Whitespace-=1
    fileout("}\n")

def ExportOno3dObject():
    config.File = open(config.FilePath, "w")

    config.Whitespace=0
    fileout2("Ono3dObject Version 0.1\n")

    fileout("Textures {}".format(len(bpy.data.textures)))
    fileoutLu()
    for a in bpy.data.textures:
        WriteTexture(a)
    fileoutLd()

    fileout("Materials {}".format(len(bpy.data.materials)))
    fileoutLu()
    for material in bpy.data.materials:
        WriteMaterial(material)
    fileoutLd()
    
    a = [Object for Object in bpy.data.meshes if Object.name.find("@") != 0 ]
    fileout("Meshes {}".format(len(a)))
    fileoutLu()
    for mesh in a:
        WriteMesh(mesh)
    fileoutLd()

#    a = [Object for Object in bpy.data.meshes if Object.name.find("@") == 0 ]
#    fileout("Collisions {}".format(len(a)))
#    fileoutLu()
#    for mesh in a:
#        WriteColligion(mesh)
#    fileoutLd()

    a = bpy.data.armatures
    fileout("Armatures {}".format(len(a)))
    fileoutLu()
    for Object in a:
        WriteArmatureBones(Object)
    fileoutLd()

    fileout("Actions {}".format(len(bpy.data.actions)))
    fileoutLu()
    fileout("framerate:{}\n".format(int(bpy.context.scene.render.fps / bpy.context.scene.render.fps_base)))
    for a in bpy.data.actions:
        WriteAction(a)

    fileoutLd()

    fileout("Objects {}".format(len(bpy.data.objects)))
    fileoutLu()
    for obj in bpy.data.objects:
        fileout("Object")
        fileoutMu()

        
        if(obj.hide_render == True): fileout("hide_render: {}\n".format(obj.hide_render))
        fileout("Groups {}".format( len(obj.vertex_groups)))
        fileoutLu()
        for group in obj.vertex_groups:
            fileout("")
            fileout2("name:\"{}\";".format(group.name))
            fileout2("\n")
        fileoutLd()

        pose = obj.pose
        if(pose):
            fileout("PoseBones {}".format( len(pose.bones)))
            fileoutLu()
            for bone in pose.bones:
               fileout("target:\"{}\";".format(bone.bone.name))
               fileout2("name:\"{}\";".format(bone.name))
               if(bone.parent):
                   fileout2("parent:\"{}\";".format(bone.parent.name))
               fileout2("location:{:9f},{:9f},{:9f};".format( bone.location[0],bone.location[1],bone.location[2]))
               fileout2("rotation:{:9f},{:9f},{:9f},{:9f};".format( bone.rotation_quaternion[0],bone.rotation_quaternion[1],bone.rotation_quaternion[2],bone.rotation_quaternion[3]))
               fileout2("scale:{:9f},{:9f},{:9f};".format( bone.scale[0],bone.scale[1],bone.scale[2]))
               fileout2("\n")
            fileoutLd()

        fileout("location:{:9f},{:9f},{:9f}\n".format(obj.location[0],obj.location[1],obj.location[2]))
        if(obj.rotation_mode == "QUATERNION"):
            fileout("rotation:{:9f},{:9f},{:9f},{:9f}\n".format(obj.rotation_quaternion[0],obj.rotation_quaternion[1],obj.rotation_quaternion[2],obj.rotation_quaternion[3]))
        else:
            fileout("rotation:{:9f},{:9f},{:9f}\n".format(obj.rotation_euler[0],obj.rotation_euler[1],obj.rotation_euler[2]))
        
        fileout("scale:{:9f},{:9f},{:9f}\n".format(obj.scale[0],obj.scale[1],obj.scale[2]))
        if(obj.matrix_basis):
            fileout("matrix:{}\n".format(stringMatrix(obj.matrix_basis)))
        if(obj.parent):
            fileout("parent:{}\n".format(obj.parent.name))
        fileout("iparentmatrix:{}\n".format(stringMatrix(obj.matrix_parent_inverse)))
        fileout("name:{}\n".format(obj.name))
        fileout("type:{}\n".format(obj.type))
        if(obj.data):
            fileout("data:{}\n".format(obj.data.name))
        if(obj.animation_data):
            if(obj.animation_data.action):
               fileout("action:{}\n".format(obj.animation_data.action.name))
        fileout("modifiers {}".format( len(obj.modifiers)))
        fileoutLu()
        for group in obj.modifiers:
            fileout("")
            fileout2("name:\"{}\";".format(group.name))
            fileout2("type:\"{}\";".format(group.type))
            if(group.type=="ARMATURE" ):
                if(group.object!=None ):
                    fileout2("object:\"{}\";".format(group.object.name))
                    fileout2("vertex_group:\"{}\";".format(group.vertex_group))
            elif(group.type=="CLOTH" ):
                fileout2("pin:\"{}\";".format(group.settings.vertex_group_mass))
                fileout2("mass:\"{}\";".format(group.settings.mass))
                fileout2("structural:\"{}\";".format(group.settings.structural_stiffness))
                fileout2("bending_stiffness:\"{}\";".format(group.settings.bending_stiffness))
                fileout2("spring_damping:\"{}\";".format(group.settings.spring_damping))
                fileout2("air_damping:\"{}\";".format(group.settings.air_damping))
                fileout2("vel_damping:\"{}\";".format(group.settings.vel_damping))
            elif(group.type=="SOFT_BODY" ):
                fileout2("pin:\"{}\";".format(group.settings.vertex_group_goal))
                fileout2("mass:{:9f};".format(group.settings.mass))
                fileout2("friction:{:9f};".format(group.settings.friction))
                fileout2("speed:{:9f};".format(group.settings.speed))
                fileout2("goalDefault:{:9f};".format(group.settings.goal_default))
#fileout2("goal_spring:{:9f};".format(group.settings.goal_spring))
                fileout2("edgePull:{:9f};".format(group.settings.pull))
                fileout2("edgePush:{:9f};".format(group.settings.push))
                fileout2("edgeDamping:{:9f};".format(group.settings.damping))
            elif(group.type=="MIRROR" ):
                fileout2("use_x:{};".format(group.use_x));
                fileout2("use_y:{};".format(group.use_y));
                fileout2("use_z:{};".format(group.use_z));
            fileout2("\n")
        fileoutLd()
        fileoutLd()
    fileoutLd()
    fileout("Scenes {}".format(len(bpy.data.scenes)))
    fileoutLu()
    for scene in bpy.data.scenes:
        WriteScene(scene)

    fileoutLd()

    config.File.close()
    print("Finished")

def writeMatrix(matrix):
    fileout2("matrix:{}\n".format(stringMatrix(matrix)))

def stringMatrix(matrix):
    return "{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f}".format(
         matrix[0][0], matrix[1][0], matrix[2][0], matrix[3][0]
        ,matrix[0][1], matrix[1][1], matrix[2][1], matrix[3][1]
        ,matrix[0][2], matrix[1][2], matrix[2][2], matrix[3][2]
        ,matrix[0][3], matrix[1][3], matrix[2][3], matrix[3][3])

def WriteTexture(Texture=None):
    if Texture is None :return
        
    fileout(" name:\"{}\";".format(Texture.name))
    fileout2(" type:\"{}\";".format(Texture.type))
    if(Texture.type == "IMAGE"):
        fileout2(" path:\"{}\";".format(Texture.image.filepath))
    fileout2("\n")

def WriteMaterial( Material=None):
    if Material is None :return
        
    fileout("name:\"{}\";".format( Material.name))
    lst = list(Material.diffuse_color)
    fileout2(" r:{:9f};g:{:9f};b:{:9f};a:{:9f};".format( lst[0],lst[1],lst[2],Material.alpha))
    fileout2(" dif:{:9f};".format( Material.diffuse_intensity))
    fileout2(" emt:{:9f};".format(Material.emit))
    lst = list(Material.mirror_color)
    if(Material.raytrace_mirror):
        fileout2(" mrr:{:9f};".format(Material.raytrace_mirror.reflect_factor))
    if(Material.raytrace_transparency):
        fileout2(" ior:{:9f};".format(Material.raytrace_transparency.ior))
    fileout2(" spc:{:9f};spchard:{};".format(Material.specular_intensity,Material.specular_hardness))
    for texture_slot in Material.texture_slots:
        if(texture_slot is None):continue
        fileout2(" tex:\"{}\";".format(texture_slot.texture.name))
        if(texture_slot.use_map_normal):
            fileout2(" normal:\"{:9f}\";".format(texture_slot.normal_factor))
    if(Material.animation_data):
        if(Material.animation_data.action):
            fileout2(" action:{};".format(Material.animation_data.action.name))

    fileout2("\n")


def WriteArmatureBones(Armature):
    import mathutils
    fileout("Armature ")
    fileoutMu()
    fileout("name:\"{}\" \n".format( Armature.name))

    Bones = Armature.bones
    fileout("Bones {}".format(len(Bones)))
    fileoutLu()
    for Bone in Bones:
        fileout("Bone ")
        fileoutMu()
        fileout("name:\"{}\" \n".format( Bone.name))
        if(Bone.parent):
            fileout("parent:\"{}\" \n".format( Bone.parent.name))

        DataBone = Bones[Bone.name]
        BoneMatrix = DataBone.matrix_local

        fileout("matrix:{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f},{:9f}\n".format( BoneMatrix[0][0], BoneMatrix[1][0], BoneMatrix[2][0], BoneMatrix[3][0],BoneMatrix[0][1], BoneMatrix[1][1], BoneMatrix[2][1], BoneMatrix[3][1],BoneMatrix[0][2], BoneMatrix[1][2], BoneMatrix[2][2], BoneMatrix[3][2],BoneMatrix[0][3], BoneMatrix[1][3], BoneMatrix[2][3], BoneMatrix[3][3]))


        fileoutMd()
    fileoutLd()
    fileoutMd()

def WriteMesh(mesh):
    import mathutils
    Index = 0


    fileout("Mesh")
    fileoutMu()
    sp = mesh.name.split("|");
    fileout("name:\"{}\"\n".format(mesh.name))
    if mesh.show_double_sided & config.EnableDoubleSided:
        fileout("double_sided:1\n")
    if mesh.shape_keys:
        fileout("ShapeKeys {}".format( len(mesh.shape_keys.key_blocks)-1))
        fileoutLu()
        for shapeKey in mesh.shape_keys.key_blocks:
            fileout("ShapeKey\n")
            fileoutMu()
            fileout("name:\"{}\"\n".format(shapeKey.name ))
            fileout("ShapeKeyPoints {}".format(len(shapeKey.data)))
            fileoutLu()
            for shapeKeyPoint in shapeKey.data:
                fileout("")
                fileout2("pos:{:9f},{:9f},{:9f};".format(shapeKeyPoint.co[0], shapeKeyPoint.co[1], shapeKeyPoint.co[2]))
                fileout2("\n")
            fileoutLd()
            fileoutMd()
        fileoutLd()
        
    

    fileout("Vertices {}".format( len(mesh.vertices)))
    fileoutLu()
    for Vertex in mesh.vertices:
        Position = Vertex.co

        fileout("")
        fileout2("pos:{:9f},{:9f},{:9f};".format(Position[0], Position[1], Position[2]))
        weightmax = 0
        for group in Vertex.groups:
            weightmax += group.weight
        if len(Vertex.groups)>0:
            fileout2("groups:")
            Index=0
            for group in Vertex.groups:
                fileout2("{}".format(group.group))
                Index+=1
                if Index<len(Vertex.groups): fileout2(",")
            fileout2(";")
            Index=0
            fileout2("groupratios:")
            for group in Vertex.groups:
                fileout2("{:9f}".format(group.weight/weightmax))
                Index+=1
                if Index<len(Vertex.groups): fileout2(",")
            fileout2(";")
        fileout2("\n")
    fileoutLd()

#    fileout("Edges {}".format( len(mesh.edges)))
#    fileoutLu()
#    fileout("")
#    for i,edge in enumerate(mesh.edges):
#        fileout2("{},{}".format( edge.vertices[0],edge.vertices[1]))
#        if(i<len(mesh.edges)-1):
#            fileout2(",");
#        else:
#            fileout2("\n");
#    fileoutLd()

    fileout("Faces {}".format( len(mesh.polygons)))
    fileoutLu()
    faceIndex = 0
    if(len(mesh.uv_textures) > 0):
        uv = mesh.uv_layers[0].data #.active.data
    else:
        uv = None
    faceIndex = 0
    for Face in mesh.polygons:
        fileout("")
        fileout2("idx:")
        Index = 0
        for Vertex in Face.vertices:
            fileout2("{}".format(Vertex))
            Index+=1
            if Index < len(Face.vertices): fileout2(",")
        fileout2(";")
        if(Face.use_freestyle_mark):
            fileout2("fs:1;")
        
#        Normal = Face.normal
#        fileout2("normal:{:9f},{:9f},{:9f};".format(Normal[0], Normal[1], Normal[2]))
        if Face.material_index < len(mesh.materials):
            if mesh.materials[Face.material_index] != None:
                fileout2("mat:{};".format(bpy.data.materials.keys().index(mesh.materials[Face.material_index].name)))
        if(uv != None):
            if(len(uv)>0):
                fileout2("uv:")
                uvIndex = 0
                for loop_index in range(Face.loop_start, Face.loop_start + Face.loop_total):
                    if uvIndex >0: fileout2(",")
                    fileout2("{:9f},{:9f}".format( uv[loop_index].uv[0], 1 - uv[loop_index].uv[1]))
                    uvIndex+=1
                fileout2(";")
        fileout2("\n")
        faceIndex += 1
    fileoutLd()

    fileoutMd()


def WriteAction(action):
    fileout("Action ")
    fileoutMu()
    fileout("name:\"{}\"\n".format(action.name))
    fileout("endframe:{}\n".format(int(action.frame_range[1])))
    fileout("id_root:\"{}\"\n".format(action.id_root))
    fcurvesize = 0
    i = 0

    fileout("Fcurves {}".format(len(action.fcurves)))
    fileoutLu()
    i = 0
    while i < len(action.fcurves):
        fcurve = action.fcurves[i]
        ii = 0
        p = re.search("\[\"(.+)\"\]\.(.+)$",fcurve.data_path)
        if(not p):
            p = re.search("\[(.+)\]\.(.+)$",fcurve.data_path)
        if(p):
            pflg = p.group(2)
        else:
            pflg = fcurve.data_path
        target=""
        if p:
            target=p.group(1)
#        fileout("type:{}\n".format(pflg))
#        fileout("data_path:{}\n".format(fcurve.data_path))
#        fileout("keyframes {}".format(len(fcurve.keyframe_points)))
#        fileoutLu()
        if(pflg == "rotation_quaternion"):
            fileout("target:\"{}\",".format(target))
            fileout2("{},0 {}[".format(pflg,len(fcurve.keyframe_points)))
            xi=0;yi=0;zi=0;
            pw=action.fcurves[i].keyframe_points;
            px=action.fcurves[i+1].keyframe_points;
            py=action.fcurves[i+2].keyframe_points;
            pz=action.fcurves[i+3].keyframe_points;
            for keyframe_points in fcurve.keyframe_points:
                keytime=pw[ii].co[0]
                if(len(px)>xi+1 and keytime==int(px[xi+1].co[0]) ): xi=xi+1;
                if(len(py)>yi+1 and keytime==int(py[yi+1].co[0]) ): yi=yi+1;
                if(len(pz)>zi+1 and keytime==int(pz[zi+1].co[0]) ): zi=zi+1;
                fileout2("{}:{:9f} {:9f} {:9f} {:9f},".format(
                int(keytime)
                ,pw[ii].co[1]
                ,px[xi].co[1]
                ,py[yi].co[1]
                ,pz[zi].co[1]));
                ii +=1;
            fileout2("]\n")
            i += 4
        else:
            fileout("target:\"{}\",".format(target))
            fileout2("{},{} {}[".format(pflg,fcurve.array_index,len(fcurve.keyframe_points)))
            for keyframe_points in fcurve.keyframe_points:
                fileout2("{}:{:9f},".format(int(keyframe_points.co[0]),keyframe_points.co[1]))
            fileout2("]\n")
            i += 1
#        fileoutLd()
#        fileoutMd()
    fileoutLd()
    fileoutMd()

def WriteScene(scene):
    fileout("Scene")
    fileoutMu()
    fileout("name:{}\n".format(scene.name))
    fileout("frame_start:{}\n".format(scene.frame_start))
    fileout("frame_end:{}\n".format(scene.frame_end))

    a = scene.objects
    fileout("Objects {}[".format(len(a)))
#    fileoutLu()
    for obj in scene.objects:
        if(scene.objects[0]!=obj):fileout2(",")
        fileout2("\"{}\"".format(obj.name));
    fileout2("]\n")
#fileoutLd()
    fileoutMd()


from bpy.props import *
class Ono3dObjectExporter(bpy.types.Operator):
    """Export to the Ono3dObject format (.o3o)"""

    bl_idname = "export.ono3o"
    bl_label = "Export Ono3dObject"
    filter_glob = StringProperty(default="*.o3o",options={'HIDDEN'})
    filepath = StringProperty(subtype='FILE_PATH')

    #Coordinate System
#    CoordinateSystem = EnumProperty(name="System", description="Select a coordinate system to export to", items=CoordinateSystems, default="1")

    #General Options
#    RotateX = BoolProperty(name="Rotate X 90 Degrees", description="Rotate the entire scene 90 degrees around the X axis so Y is up.", default=True)
#FlipNormals = BoolProperty(name="Flip Normals", description="", default=False)
#    ExportAnimation = EnumProperty(name="Animations", description="Select the type of animations to export.  Only object and armature bone animations can be exported.  Full Animation exports every frame.", items=AnimationModes, default="1")
#    AnimName = StringProperty(name="AnimName:", description="Input an animation name to export to", default="Waiting", subtype='FILENAME')
#    MaxBoneCount = IntProperty(name="MaxVertexSkinBoneCount", description="Input a max skin bone count at one vertex", default=4, min=1, max=9)

 #Export Mode
#    ExportMode = EnumProperty(name="Export", description="Select which objects to export.  Only Mesh, Empty, and Armature objects will be exported.", items=ExportModes, default="1")

#    Verbose = BoolProperty(name="Verbose", description="Run the exporter in debug mode.  Check the console for output.", default=False)
    EnableDoubleSided = BoolProperty(name="Enable Double Sided", description="enable double sided", default=False)

    def execute(self, context):
        FilePath = self.filepath
        if not FilePath.lower().endswith(".o3o"):
            FilePath += ".o3o"
        global config
        config = Ono3dObjectExporterSettings(context,
                                         FilePath)
#                                         CoordinateSystem=self.CoordinateSystem,
#                                         RotateX=self.RotateX,
#                                         FlipNormals=self.FlipNormals,
#                                         ExportArmatures=self.ExportArmatures,
#                                         ExportAnimation=self.ExportAnimation,
#                                         AnimName=self.AnimName,
#                                         ExportMode=self.ExportMode,
        config.EnableDoubleSided=self.EnableDoubleSided
        ExportOno3dObject()
        return {"FINISHED"}

    def invoke(self, context, event):
        WindowManager = context.window_manager
        WindowManager.fileselect_add(self)
        return {"RUNNING_MODAL"}


def menu_func(self, context):
    default_path = os.path.splitext(bpy.data.filepath)[0] + ".o3o"
    self.layout.operator(Ono3dObjectExporter.bl_idname, text="Ono3dObject (.o3o)").filepath = default_path

def register():
    bpy.utils.register_module(__name__)
    bpy.types.INFO_MT_file_export.append(menu_func)


def unregister():
    bpy.utils.unregister_module(__name__)
    bpy.types.INFO_MT_file_export.remove(menu_func)


if __name__ == "__main__":
    register()

