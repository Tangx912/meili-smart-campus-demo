# 11号综合楼精细化与交互说明

本次唯一新增几何来源：用户提供《11号楼导图.dwg》，工程内副本为references/cad/building11.dwg；来源SHA256和原始实体handle保存在data/building11.json。用途按用户更正与CAD文字统一为**综合楼：宿舍＋物业办公室＋食堂**。

## 已完成的外观精细化

- 主体墙面56.4×20.2m；保留原园区西北角锚点，其他10栋几何数据不变。
- 楼面0/4.5/9/12.6/16.2/19.8/23.4m；常规女儿墙25.2m，南侧局部低段24.3m，屋顶机房27.9m。
- 195个门窗/门洞投影对象来自四面立面；94个栏杆图块和对应错缝百叶、宽窄阳台按原源线处理。南立面有两处无独立栏杆图块的凹入单元，洞口按对应窗与相邻3.05m模块推定，已在生成代码注释中标明。
- 阳台是1.8m凹入空间，墙板开洞，窗位在内侧；不是在实心盒上贴栏杆。射线测试检查阳台纵深。
- 两端橙色框沿长轴各外挑1.2m，使总外包络达58.8m；这与历史PDF数字一致，不能据此断定PDF尺寸链的量取定义已全部核定。
- 屋顶机房8.3×8.9m；40块太阳能集热器及15T热水箱按屋顶平面位置保留。设备高度、支架和倾角仍为示意。
- 玻璃统一改为轻微透光蓝灰色：MeshPhysicalMaterial，transmission .16、opacity .9、thickness .05m；太阳能吸热面另用不透明材质。室内仅简化隔墙和楼板，避免玻璃透出空壳。

## 逐层立体平面

进入“11号楼精看”后选择1F—6F；单层移到检查基准面，标签保留原楼层标高，米制比例不变。全部展开使用六张分开的立体平面作比较；展开偏移不是原建筑实际位置。南/北/西/屋顶切换回外立面；返回园区恢复11栋建筑。

- 1F：餐厅、厨房、大堂/活动空间、卫生间、配电及服务用房。
- 2F：物业办公、活动室、走廊及服务用房。
- 3F—6F：宿舍、卫生间、阳台、走廊与楼梯等。每层使用自己的CAD线，不以一张标准层复制所有楼层。
- 拆解楼层仅表达1.1m抽象低墙与功能地板色块；不显示柱子、门窗玻璃、门窗框及家具。保留房间独立点亮与信息查询。建筑整体外观的微透明玻璃不变。
- 墙体由CAD双面墙线配对，门窗保持原图线位。交互色块通过5cm栅格连通区域提取，门洞仅为分区识别闭合、不会增加实体墙；少量文字落在门扇弧线处时，选择附近可容纳该功能的区域。
- 开放空间保持连通，可出现“大堂/活动室”等合并功能。当前并非施工图级房间面积算法，色块边界和面积不作测量依据；未显示面积作为招商依据。
- 房间可独立点亮，多选状态互不影响。再次点击同一房间熄灭，或“清除点亮”。每个空间保留文字handle与来源位置。
- “XX企业”、服务关系和介绍**全部虚拟**。实际功能名来自CAD，虚拟内容不代表真实租赁、入驻、住宿安排或经营主体。

## 梅李小智

前台数字人已改为窗口悬浮助手。使用用户参考图派生的单体透明PNG，胸前写“梅李小智”；具有轻微悬浮动效，可拖动，点击打开咨询。不是在场景地面上漫游的人物。

图像采用内置image_gen生成，保存为public/assistant/meili-xiaozhi.png。使用的提示词摘要：保留蓝白透明科技头罩、黑眼、手持平板和友好表情；只保留单个正面角色；胸牌精确写“梅李小智”；去除参考表的小视图、标志、水印与背景；输出真实透明背景。未对生成素材另做像素编辑。

当前为**本地资料问答**，无后台大模型、无密钥、无外部消息发送。回答园区概况、189车位、综合楼功能、物业/食堂/宿舍楼层；回答可带按钮直接打开模型或楼层。租金、电话、真实入驻和空置数据未提供时明确说明。不会把“XX企业”当真实企业。

后续接自研咨询服务：

```js
meili.setAssistantProvider(async (question, {site, floors}) => {
  const response = await fetch('/your-private-backend/consult', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({question})
  });
  if (!response.ok) throw new Error('咨询服务不可用');
  return response.json(); // {text: '回答', actions: [{label:'查看物业办公', floor:2}]}
});
```

私密模型密钥放在自研后端，不写入浏览器。前端回答使用textContent，动作仅接受1—6层、all及已存在机位。会话只留在当前页面内存，不上传或写入持久存储。旧GLB骨骼加载接口仍保留在meili.loadAvatar，前台行走控件已隐藏。

## 文件与重建

- scripts/extract-building11.py → data/building11/drawing.json（本地大体积中间件）
- scripts/prepare-building11.py → data/building11.json（外观源特征）
- scripts/apply-building11.py → 更新site.json中11号及入口框柱碰撞；其余10栋保留
- scripts/prepare-building11-floors.py → data/building11-floors.json（逐层空间），随后自动调用 scripts/prepare-floor-section.py，保留真实门洞、窗位与柱的源数据；当前显示层将其简化为1.1m低墙
- src/building11.js、src/floors11.js、src/assistant.js、src/campus-knowledge.js负责相应功能

逐层重建额外需要Python3.12、numpy、scipy、shapely、Pillow；当前脚本可选用临时依赖目录。仅开发重建需要这些库，运行与静态部署不需要Python。

功能色块采用连续铺满的展示轮廓，填平柱位、门口与边缘空隙；原始CAD空间轮廓仍保存在polygons，展示轮廓使用displayPolygons。scripts/prepare-floor-colors.py可重新生成，六层楼板均无未填充区域。
