"""Original CC0 test humanoid, metres, Y-up, six-bone skin and two animation clips."""
import struct,json,math
from pathlib import Path
R=Path(__file__).resolve().parents[1];blob=bytearray();views=[];accessors=[]
def acc(data,fmt,typ,component,minmax=False):
 while len(blob)%4:blob.append(0)
 start=len(blob);flat=[v for row in data for v in row]if isinstance(data[0],(list,tuple))else data
 blob.extend(struct.pack('<'+fmt*len(flat),*flat));view=len(views);views.append({'buffer':0,'byteOffset':start,'byteLength':len(blob)-start});a={'bufferView':view,'componentType':component,'count':len(data),'type':typ}
 if minmax:
  rows=data if isinstance(data[0],(list,tuple))else[[x]for x in data];a['min']=[min(r[i]for r in rows)for i in range(len(rows[0]))];a['max']=[max(r[i]for r in rows)for i in range(len(rows[0]))]
 accessors.append(a);return len(accessors)-1
# joint positions are global rest pose. Children of hips use relative translations.
joints=[(0,.92,0),(0,1.55,0),(-.28,1.4,0),(.28,1.4,0),(-.12,.87,0),(.12,.87,0)]
verts=[];norms=[];js=[];weights=[]
faces=[([0,1,0],[(-1,1,-1),(-1,1,1),(1,1,1),(1,1,-1)]),([0,-1,0],[(-1,-1,1),(-1,-1,-1),(1,-1,-1),(1,-1,1)]),([1,0,0],[(1,-1,-1),(1,1,-1),(1,1,1),(1,-1,1)]),([-1,0,0],[(-1,-1,1),(-1,1,1),(-1,1,-1),(-1,-1,-1)]),([0,0,1],[(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]),([0,0,-1],[(1,-1,-1),(-1,-1,-1),(-1,1,-1),(1,1,-1)])]
def cube(cx,cy,cz,w,h,d,j):
 for normal,corners in faces:
  for k in [0,1,2,0,2,3]:
   v=corners[k];verts.append([cx+v[0]*w/2,cy+v[1]*h/2,cz+v[2]*d/2]);norms.append(normal);js.append([j,0,0,0]);weights.append([1,0,0,0])
cube(0,1.2,0,.42,.55,.25,0);cube(0,1.64,0,.25,.28,.25,1)
cube(-.3,1.13,0,.13,.57,.15,2);cube(.3,1.13,0,.13,.57,.15,3)
cube(-.12,.47,0,.17,.8,.19,4);cube(.12,.47,0,.17,.8,.19,5)
cube(-.12,.045,.045,.18,.09,.3,4);cube(.12,.045,.045,.18,.09,.3,5)
attrs={'POSITION':acc(verts,'f','VEC3',5126,True),'NORMAL':acc(norms,'f','VEC3',5126),'JOINTS_0':acc(js,'H','VEC4',5123),'WEIGHTS_0':acc(weights,'f','VEC4',5126)}
ibm=[]
for x,y,z in joints:ibm.append([1,0,0,0,0,1,0,0,0,0,1,0,-x,-y,-z,1])
ib=acc(ibm,'f','MAT4',5126);nodes=[{'name':'DemoHumanoid','children':[1,7]},{'name':'Hips','translation':list(joints[0]),'children':[2,3,4,5,6]}]
for i,p in enumerate(joints[1:]):nodes.append({'name':['Head','LeftArm','RightArm','LeftLeg','RightLeg'][i],'translation':[p[k]-joints[0][k]for k in range(3)]})
nodes.append({'name':'BodySkin','mesh':0,'skin':0})
times=acc([0,.5,1,1.5,2],'f','SCALAR',5126,True)
idle=acc([[0,.92,0],[0,.935,0],[0,.92,0],[0,.935,0],[0,.92,0]],'f','VEC3',5126)
animations=[{'name':'Idle','samplers':[{'input':times,'output':idle,'interpolation':'LINEAR'}],'channels':[{'sampler':0,'target':{'node':1,'path':'translation'}}]}]
samplers=[];channels=[]
for node,sign in [(5,1),(6,-1),(3,-1),(4,1)]:
 rotations=[[math.sin(a*sign/2),0,0,math.cos(a*sign/2)]for a in [0,.48,0,-.48,0]];samplers.append({'input':times,'output':acc(rotations,'f','VEC4',5126),'interpolation':'LINEAR'});channels.append({'sampler':len(samplers)-1,'target':{'node':node,'path':'rotation'}})
animations.append({'name':'Walk','samplers':samplers,'channels':channels})
gltf={'asset':{'version':'2.0','generator':'Meili Demo1 original CC0 fixture'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':nodes,'meshes':[{'primitives':[{'attributes':attrs,'material':0}]}],'materials':[{'name':'Demo bronze','pbrMetallicRoughness':{'baseColorFactor':[.83,.35,.14,1],'metallicFactor':.1,'roughnessFactor':.65}}],'skins':[{'inverseBindMatrices':ib,'joints':[1,2,3,4,5,6],'skeleton':1}],'animations':animations,'accessors':accessors,'bufferViews':views,'buffers':[{'byteLength':len(blob)}]}
j=json.dumps(gltf,separators=(',',':')).encode();j+=b' '*((-len(j))%4);blob+=b'\0'*((-len(blob))%4);out=struct.pack('<4sII',b'glTF',2,12+8+len(j)+8+len(blob))+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(blob),b'BIN\0')+blob
(R/'public/models/demo-human.glb').write_bytes(out);print('CC0 skinned avatar',len(out),'bytes')
