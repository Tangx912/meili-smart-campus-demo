// Fictional sales-demo content. None of these records describes a real tenant.
export const demoDimensions={
 enterprise:{title:'企业示例 · 梅李智造科技',text:'虚拟演示企业，主营智能检测设备与工业软件，团队50人。',fields:[['行业','智能制造（虚拟）'],['状态','演示入驻']],question:'介绍一下虚拟示例企业'},
 space:{title:'空间示例 · 综合服务点',text:'示例关联11号楼二层物业办公，可联动打开真实CAD空间。',fields:[['位置','11号楼 / 2F'],['使用场景','企业服务（虚拟）']],question:'示例企业的空间在哪里'},
 people:{title:'人物示例 · 林知远',text:'虚拟人物，担任示例企业负责人，主要关注智能制造与团队服务。',fields:[['职务','负责人（虚拟）'],['关注方向','设备智能化']],question:'介绍一下虚拟企业负责人'},
 industry:{title:'产业示例 · 智能制造',text:'以“传感部件 → 智能检测设备 → 工业应用”展示一条简化产业关系。',fields:[['链条环节','智能检测设备'],['合作方向','传感器 / 工业软件']],question:'展示虚拟产业链'},
 economy:{title:'经济示例 · 年度经营',text:'全部为虚拟数值，仅用于展示卡片效果，不代表园区真实经营数据。',fields:[['年营收','2,000万元（虚拟）'],['就业','50人（虚拟）']],question:'查看虚拟经济效益'},
 records:{title:'服务示例 · 配套咨询',text:'演示记录：企业咨询综合楼配套，已提供食堂与物业位置指引。',fields:[['事项','生活配套咨询'],['状态','演示已答复']],question:'查看虚拟服务记录'}
};
export function answerDemo(key,floors){const d=demoDimensions[key],office=floors?.floors?.find(f=>f.number===2)?.rooms.find(r=>r.kind==='office');return {text:`${d.text} 以上为虚拟演示，不代表真实入驻、企业、人物或经济情况。`,actions:key==='space'||key==='enterprise'?[{label:'定位示例关联空间',floor:2,...(office?{room:office.id}:{})}]:[],card:{title:d.title,tag:'虚拟演示',fields:d.fields},source:'用户授权创建的虚拟展示数据'};}
