// Product examples only: no invented association with a real CAD space.
export const demoSpaces=[
 {id:'demo-a',name:'示例研发空间一',area:620,use:'研发',delivery:'标准交付示意',demo:true,buildingId:null,image:'./public/spaces/shell-01.png',imageAlt:'AI生成的毛坯空间示意：左侧窗与混凝土柱网'},
 {id:'demo-b',name:'示例办公空间',area:560,use:'办公',delivery:'精装交付示意',demo:true,buildingId:null,image:'./public/spaces/shell-01.png',imageAlt:'AI生成的毛坯空间示意：左侧窗与混凝土柱网'},
 {id:'demo-c',name:'示例研发组合空间',area:780,use:'研发',delivery:'组合出租示意',demo:true,buildingId:null,image:'./public/spaces/shell-02.png',imageAlt:'AI生成的毛坯空间示意：右侧窗与开阔柱网'}
];
export function searchSpaces(query){
 const q=query.replace(/,/g,''),range=q.match(/(\d+)\s*(?:到|至|—|–|-|~|～)\s*(\d+)/),single=q.match(/(\d+)\s*(?:平方米|平米|㎡|m²)/i);
 let min=0,max=Infinity;if(range){min=Number(range[1]);max=Number(range[2]);}else if(single){const n=Number(single[1]);if(/以上|不少于/.test(q))min=n;else if(/以下|以内|不超过/.test(q))max=n;else{min=n*.8;max=n*1.2;}}
 const use=/研发/.test(q)?'研发':/办公/.test(q)?'办公':null;
 return demoSpaces.filter(r=>(!use||r.use===use)&&r.area>=min&&r.area<=max);
}
