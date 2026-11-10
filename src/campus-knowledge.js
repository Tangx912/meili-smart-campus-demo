import {answerDemo} from './demo-knowledge.js';
export function answerCampus(question,{site,floors}){
 const q=question.toLowerCase().replace(/\s/g,'');
 const result=(text,actions=[],card=null)=>({text,actions,card,source:'用户总图、11号综合楼单体CAD及本地演示数据'});
 if(/虚拟.*负责人|企业负责人|人物示例/.test(q))return answerDemo('people',floors);
 if(/虚拟.*产业|产业示例/.test(q))return answerDemo('industry',floors);
 if(/虚拟.*经济|经济示例/.test(q))return answerDemo('economy',floors);
 if(/虚拟.*服务记录|服务示例/.test(q))return answerDemo('records',floors);
 if(/示例.*空间|空间示例/.test(q))return answerDemo('space',floors);
 if(/虚拟.*企业|梅李智造/.test(q))return answerDemo('enterprise',floors);
 if(/知识库|六维|知识中枢/.test(q))return result('知识中枢按企业、空间、人物、产业、经济、服务六个维度组织。目前已接通CAD空间和楼层功能；现有六类均可点击查看用户授权创建的虚拟示例；所有人物与经济数字都明确标注虚拟，不代表实际业务。',[{label:'查看综合楼空间',floor:2}]);
 if(/政策|申报|补贴/.test(q))return result('可以先准备企业基本情况、所属行业、项目说明与申请事项，用于后续政策匹配。当前未接入正式政策库，无法确认可申报政策、申报窗口或截止日期；材料清单与申请资格应以主管部门正式指南为准。可先查看服务目录或定位物业办公。',[{label:'打开服务指南',service:'services'},{label:'定位物业办公',floor:2}]);
 if(/投诉|诉求|建议|报修/.test(q))return result('可以在“诉求记录”里选择类型并填写内容。当前是本机演示：只保存到当前浏览器，不会发送给物业，不代表已受理。后续可连接工单系统实现分派与进度跟踪。',[{label:'创建本地诉求',service:'requests'}]);
 if(/办事|活动|预约|人工|报名/.test(q))return result('服务目录已提供物业服务、政策申报方向与投诉建议入口。当前未提供真实活动排期、预约窗口或办理进度数据，暂不能完成正式报名或预约。物业办公位于11号综合楼二层。',[{label:'查看服务指南',service:'services'},{label:'定位二层物业',floor:2}]);
 if(/效益|税收|营收|就业|产值|贡献|产业链|企业家/.test(q))return result('已预留经济效益、产业图谱和人物资料字段。当前没有经核实的营收、税收、就业、产业链与人物数据，暂不展示数值、排名或企业履历。取得相应授权数据后可生成卡片与趋势图。');
 if(/片区|配套/.test(q))return result('本次资料覆盖梅李镇特色产业发展中心本体。已知配套包括11号综合楼一层食堂、二层物业办公与活动空间、三至六层宿舍，以及总图189个机动车位。周边交通、商业和酒店资料尚未导入。',[{label:'食堂位置',floor:1},{label:'物业办公',floor:2},{label:'园区停车',view:'overview'}]);
 if(/企业|入驻|租户|公司/.test(q)&&!/物业/.test(q))return answerDemo('enterprise',floors);
 if(/租金|价格|电话|联系|空置|招商|收费|营业时间/.test(q))return result('当前资料没有提供经核实的租金、招商电话、空置状态或收费信息，我不会编造。11号综合楼二层设有物业办公区域，可先在模型中查看其位置。',[{label:'查看物业办公',floor:2}]);
 if(/物业|办公|二层|2f|2层/.test(q))return result('11号综合楼二层包含物业办公、活动室、走廊和配套服务空间。点击下方按钮可拆出二层立体平面，再点亮房间查看功能。',[{label:'拆出2F',floor:2}]);
 if(/食堂|吃饭|餐厅|厨房|一层|1f|1层/.test(q))return result('11号综合楼一层图纸标有餐厅、无明火厨房、大堂、活动室及配套用房。当前模型不放餐桌、厨具或其他家具，只显示抽象低墙与完整功能色块。',[{label:'拆出1F',floor:1}]);
 if(/宿舍|住宿|三层|3f|3层|四层|五层|六层/.test(q))return result('11号综合楼三至六层以宿舍为主，包含2人间宿舍、卫生间、走廊、阳台和楼梯等空间。各层按各自CAD独立提取，房间可单独点亮；示例企业信息均为虚拟。',[{label:'拆出3F',floor:3},{label:'展开全部楼层',floor:'all'}]);
 if(/停车|车位|车辆/.test(q))return result(`总图标注189个机动车位，本场景保留了${site.parkingBays.length}个CAD停车轮廓。车辆只是示意，不能据此判断实时空位。`,[{label:'查看园区总览',view:'overview'}]);
 if(/玻璃|透明/.test(q))return result('建筑玻璃已调整为轻微透光、保留蓝灰反射的材质。11号综合楼内加了简化隔墙，透过玻璃可以看到一些空间纵深，不布置家具。',[{label:'精看11号楼',view:'dorm'}]);
 if(/多少|几栋|面积|园区|介绍|哪里|梅李|11|综合楼/.test(q))return result('这里是常熟市梅李镇特色产业发展中心（智谷共享空间）的本地3D演示。园区有11栋主要建筑；11号为综合楼，功能是宿舍、物业办公室和食堂。你可以看园区、精看11号楼，或拆出1—6层点击房间。',[{label:'精看综合楼',view:'dorm'},{label:'查看楼层',floor:1}]);
 if(/楼层|拆|平面|走道|房间/.test(q))return result('先进入“11号楼精看”，再点击1F—6F可单独拆出对应楼层，也可以点击“全部展开”。绿色表示走道，米色表示宿舍，蓝色表示办公，橙色表示餐饮。点击房间独立点亮，再次点击取消。',[{label:'打开楼层模式',floor:1}]);
 return result('我目前根据本地项目资料回答园区与11号综合楼的问题，尚未接入外部大模型服务。可以问我“11号楼有什么”“物业办公室在哪”“食堂在哪层”或“有多少停车位”。资料没有涵盖的问题，我会明确说明。');
}
