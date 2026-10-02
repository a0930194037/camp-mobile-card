/* 露營助手 — local-first Manifest V3 side panel */
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const key = 'camp-assistant-state-v1';
const now = () => new Date().toISOString();
const uid = (p) => `${p}-${crypto.randomUUID().slice(0, 8)}`;

const seedRows = [
['S01','住宿與睡眠','月帳 1 型','傳統雙層帳','裝備櫃'],['S02','住宿與睡眠','月帳 2 型','傳統雙層帳','裝備櫃'],['S03','住宿與睡眠','DD 4x4 天幕','可獨立搭設/配合行軍床','裝備袋'],['S04','住宿與睡眠','單人行軍床','折疊式','裝備袋'],['S05','住宿與睡眠','蚊帳','配合天幕/行軍床','裝備袋'],['S06','住宿與睡眠','充氣睡墊','搭配充氣泵','裝備袋'],['S07','住宿與睡眠','睡袋','-','裝備袋'],['S08','住宿與睡眠','卷卷壽司枕','睡眠必帶','裝備袋'],
['R01','搭設工具','碳纖營柱 x 2','主撐柱','營柱袋'],['R02','搭設工具','可調長短鋁營柱 x 2','副撐柱','營柱袋'],['R03','搭設工具','營釘袋','含營錘、各式營釘','工具包'],['R04','搭設工具','營繩袋','含多組營繩、調節片','工具包'],['R05','搭設工具','魚骨釘袋','棧板營位專用','工具包'],
['F01','桌椅客廳','戰壘露營椅','高位，適合切菜備料用餐','車後廂'],['F02','桌椅客廳','低地月亮椅','低位，適合焚火放空','車後廂'],['F03','桌椅客廳','Captain Stag 鋁捲桌','主工作區 / 用餐區','車後廂'],['F04','桌椅客廳','Tillak 黑色矮桌','副工作區 / 烹飪備料區','車後廂'],['F05','桌椅客廳','TOKYO CRAFTS 層架桌','氣氛與小物收納區','車後廂'],['F06','桌椅客廳','防火布地墊','地面放背包/保冷袋防髒','車後廂'],
['C01','烹飪熱源','SOTO 高山爐頭 + 瓦斯罐','主力烹飪熱源','廚具箱'],['C02','烹飪熱源',"笑's B6君焚火台",'炭火/烤肉/煎肉','焚火箱'],['C03','烹飪熱源','SOTO 六邊型輕量焚火台 + 小烤網','輕量焚火/微型烤肉','焚火箱'],['C04','烹飪熱源','自製酒精爐套組','僅輕量登山純煮水使用','備用箱'],['C05','烹飪熱源','生火包','防風打火機、點火器、火種、吹火棒','焚火箱'],['C06','烹飪熱源','手持式電風扇','生火助燃用','焚火箱'],['C07','烹飪熱源','冷水瓶','料理專用用水','廚具箱'],['C08','烹飪熱源','木質砧板','-','廚具箱'],['C09','烹飪熱源','折疊菜刀','預計升級 FEDECA 折疊料理刀','廚具箱'],['C10','烹飪熱源','挾持式鍋柄','拿取無柄鍋具/深鍋用','廚具箱'],['C11','烹飪熱源','矽膠長筷','保護不沾鍋塗層，調理用','廚具箱'],['C12','烹飪熱源','不鏽鋼料理夾','烤肉/鑄鐵鍋煎肉用','廚具箱'],['C13','烹飪熱源','木炭夾','炭火夾取用','焚火箱'],
['K01','鍋具選項','不沾套鍋組（湯鍋+煎鍋蓋）','泡麵/火鍋/燉咖哩','廚具箱'],['K02','鍋具選項','煮飯盒（Mestin）','煮白飯/炊飯/蒸燒賣','廚具箱'],['K03','鍋具選項','多層野戰黑飯盒','兵營風燉菜/蒸煮同時','廚具箱'],['K04','鍋具選項','15cm 鑄鐵平底鍋','煎厚切牛排/煎餃','廚具箱'],['K05','鍋具選項','14cm 輕量鋁不沾平底鍋','煎荷包蛋/玉子燒/少油炒肉片','廚具箱'],['K06','鍋具選項','熱壓吐司烤鍋','輕食/熱壓三明治/蛋餅','廚具箱'],
['T01','餐具容器','搖曳露營聯名深雪拉碗 + 12cm蓋','主用餐區，蓋子可與湯鍋共用','餐具包'],['T02','餐具容器','帶蓋小鈦杯','水/茶專用','餐具包'],['T03','餐具容器','不鏽鋼溫清酒杯','當餐具/工具收納筒','餐具包'],['T04','餐具容器','搖曳露營聯名萬用叉匙','主用餐具（必帶）','餐具包'],['T05','餐具容器','鈦折疊湯匙','泡茶/沖濃湯','餐具包'],['T06','餐具容器','鈦筷','備用/精細用餐','餐具包'],['T07','餐具容器','隨身調味玻璃瓶 x 6 + 透明盒','3罐隨時加、3罐料理用','廚具箱'],
['L01','照明電力收納','盧美爾瓦斯燈（Lumere）','桌面氣氛燈','燈具包'],['L02','照明電力收納','燭台氣化燈 / 氛圍燈','氣氛照明','燈具包'],['L03','照明電力收納','露營燈與頭燈袋','含照明營地燈、工作頭燈','燈具包'],['L04','照明電力收納','電器與充電袋','行動電源、延長線、吹風機','電子包'],['L05','照明電力收納','Tillak 軟質保冷袋','裝食材與飲料','車後廂'],['L06','照明電力收納','登山包','個人裝備與衣物收納','個人'],['L07','氣氛小物','志摩凜公仔','擺飾','小物盒'],['L08','氣氛小物','多功能計時器','掌握煮飯/悶煮時間','小物盒'],
['X01','生活清潔','布質折疊垃圾桶','折疊後略大；營位整理體驗佳','車後廂'],['X02','生活清潔','清潔／飲用水袋','洗手、洗碗、清潔與備用飲水','廚具箱']
];
const defaultGear = seedRows.map(([id,category,name,note,location]) => ({id,category,name,note,location,owned:true,levels:['L1','L2','L3','L4'],contexts:[],size: id.startsWith('F') || id==='S04' ? 'large':'medium', links:[]}));
const recipes = [
 {id:'RCP01',name:'香菇海鮮炊飯',meal:'晚餐',gear:['K02','C01','L08'],ingredients:['白米 1 杯','乾香菇 3 朵','蝦仁 50g','醬油 15ml','味醂 10ml','柴魚粉 2g'],onsite:false},
 {id:'RCP02',name:'香煎牛排配蒜片',meal:'晚餐',gear:['K04','C01','C12'],ingredients:['牛肩排或沙朗 200g','大蒜 3 瓣','海鹽 3g','黑胡椒 2g','無鹽奶油 10g'],onsite:true},
 {id:'RCP03',name:'日式咖哩烏龍麵',meal:'午餐',gear:['K01','C01','C11'],ingredients:['冷凍烏龍麵 1 包','咖哩塊 1 小塊','豬肉片 80g','洋蔥 1/4 顆','水 300ml'],onsite:true},
 {id:'RCP04',name:'熱壓火腿起司吐司',meal:'早餐',gear:['K06','C01'],ingredients:['吐司 2 片','火腿 1 片','起司片 1 片','雞蛋 1 顆','番茄醬 10ml'],onsite:false},
 {id:'RCP05',name:'泡菜豬肉鍋',meal:'晚餐',gear:['K01','C01','C11'],ingredients:['豬肉片 120g','泡菜 100g','豆腐 1/2 盒','金針菇 1/2 包','高湯粉 1 包'],onsite:true},
 {id:'RCP06',name:'沖泡濃湯與熱茶',meal:'早餐',gear:['C01','T02','T05'],ingredients:['玉米濃湯粉 1 包','茶包 1 包','水 350ml'],onsite:false}
];
const recipeSpecs=[
['泡麵加蛋','宵夜','K01,C01,C11','泡麵 1 包；雞蛋 1 顆；青菜 1 把',false],['起司泡麵','宵夜','K01,C01,C11','泡麵 1 包；起司片 1 片；雞蛋 1 顆',false],['辛拉麵火鍋','晚餐','K01,C01,C11','辛拉麵 1 包；豬肉片 80g；豆腐 1/2 盒；青菜 1 把',true],['麻油雞泡麵','宵夜','K01,C01,C11','麻油雞調理包 1 包；泡麵 1 包；青菜 1 把',false],['關東煮','晚餐','K01,C01,C11','關東煮材料 1 包；白蘿蔔 100g；高湯包 1 包',true],['番茄肉醬義大利麵','晚餐','K01,C01,C11','義大利麵 100g；肉醬調理包 1 包；起司粉 少許',false],['奶油培根義大利麵','晚餐','K01,C01,C11','義大利麵 100g；培根 2 片；鮮奶油 50ml；奶油 10g',true],['蒜香橄欖油義大利麵','晚餐','K01,C01,C11','義大利麵 100g；大蒜 2 瓣；橄欖油 15ml；辣椒 少許',true],['咖哩飯','晚餐','K02,K01,C01,C11','白米 1 杯；咖哩調理包 1 包；蛋 1 顆',false],['雞肉蔬菜咖哩','晚餐','K02,K01,C01,C11','白米 1 杯；雞腿肉 120g；咖哩塊 1 塊；洋蔥 1/4 顆',true],['牛肉燴飯','晚餐','K02,K01,C01,C11','白米 1 杯；牛肉調理包 1 包；青菜 1 把',false],['親子丼','晚餐','K02,K05,C01,C11','白米 1 杯；雞肉 100g；雞蛋 2 顆；洋蔥 1/4 顆；醬油 15ml',true],['豬肉丼','晚餐','K02,K05,C01,C11','白米 1 杯；豬肉片 100g；洋蔥 1/4 顆；壽喜燒醬 20ml',true],['韓式泡菜豬肉丼','晚餐','K02,K05,C01,C11','白米 1 杯；豬肉片 100g；泡菜 80g；芝麻油 5ml',true],['午餐肉蛋炒飯','午餐','K05,C01,C11','白飯 1 碗；午餐肉 60g；雞蛋 1 顆；蔥 1 根',true],['鮭魚茶泡飯','宵夜','K02,C01,T02','白飯 1 碗；鮭魚罐頭 1/2 罐；茶包 1 包；海苔 少許',false],['鯖魚罐頭炊飯','晚餐','K02,C01,L08','白米 1 杯；鯖魚罐頭 1 罐；醬油 10ml；薑絲 少許',false],['香腸炊飯','晚餐','K02,C01,L08','白米 1 杯；香腸 1 條；玉米粒 50g；醬油 10ml',true],['奶油玉米炊飯','晚餐','K02,C01,L08','白米 1 杯；玉米粒 80g；奶油 10g；鹽 少許',false],['鮪魚玉米炊飯','晚餐','K02,C01,L08','白米 1 杯；鮪魚罐頭 1 罐；玉米粒 50g；美乃滋 10g',false],['煎牛五花','晚餐','K04,C01,C12','牛五花 150g；鹽 2g；黑胡椒 2g；生菜 1 把',false],['煎雞腿排','晚餐','K04,C01,C12','去骨雞腿排 180g；鹽 2g；胡椒 2g；檸檬 1/4 顆',false],['煎鮭魚','晚餐','K04,C01,C12','鮭魚排 150g；鹽 2g；奶油 10g；檸檬 1/4 顆',false],['煎餃','晚餐','K04,C01,C12','冷凍水餃 10 顆；油 10ml；醬油 10ml；醋 5ml',false],['玉子燒','早餐','K05,C01,C11','雞蛋 2 顆；糖 3g；醬油 5ml；油 5ml',false],['荷包蛋吐司','早餐','K05,C01,C11','吐司 2 片；雞蛋 1 顆；奶油 5g',false],['培根蛋早餐盤','早餐','K05,C01,C11','培根 2 片；雞蛋 2 顆；小番茄 5 顆',false],['煎午餐肉蛋','早餐','K05,C01,C11','午餐肉 60g；雞蛋 1 顆；醬油 少許',false],['蔥油餅加蛋','早餐','K05,C01,C11','冷凍蔥油餅 1 片；雞蛋 1 顆；甜辣醬 10ml',false],['蛋餅','早餐','K06,C01','蛋餅皮 1 張；雞蛋 1 顆；起司片 1 片；醬油膏 10ml',false],['鮪魚起司熱壓吐司','早餐','K06,C01','吐司 2 片；鮪魚罐頭 1/2 罐；起司片 1 片；美乃滋 10g',false],['花生香蕉熱壓吐司','早餐','K06,C01','吐司 2 片；香蕉 1 根；花生醬 15g',false],['火腿起司熱壓吐司','早餐','K06,C01','吐司 2 片；火腿 1 片；起司片 1 片；奶油 5g',false],['棉花糖巧克力吐司','宵夜','K06,C01','吐司 2 片；巧克力 20g；棉花糖 6 顆',false],['起司燒餅','早餐','K06,C01','燒餅 1 個；起司片 1 片；雞蛋 1 顆',false],['罐頭粥','早餐','K01,C01,T05','白粥調理包 1 包；肉鬆 10g；醬瓜 少許',false],['海鮮濃湯','早餐','K01,C01,T05','海鮮濃湯調理包 1 包；牛奶 100ml；麵包 1 個',false],['玉米濃湯','早餐','C01,T02,T05','玉米濃湯粉 1 包；熱水 250ml；吐司 1 片',false],['味噌湯泡飯','早餐','K01,C01,T05','白飯 1 碗；味噌湯包 1 包；海苔 少許',false],['沖泡燕麥','早餐','C01,T02,T05','即食燕麥 50g；牛奶 200ml；堅果 10g',false],['即食麥片','早餐','C01,T02,T05','麥片 1 包；熱水 200ml；果乾 10g',false],['手沖咖啡','早餐','C01,T02','濾掛咖啡 1 包；熱水 200ml',false],['奶茶','早餐','C01,T02','奶茶包 1 包；熱水 200ml',false],['紅茶','早餐','C01,T02','紅茶包 1 包；熱水 250ml',false],['綠茶','早餐','C01,T02','綠茶包 1 包；熱水 250ml',false],['薑茶','宵夜','C01,T02','薑茶包 1 包；熱水 250ml',false],['可可','宵夜','C01,T02','可可粉 20g；熱水 200ml；牛奶 50ml',false],['泡菜豆腐鍋','晚餐','K01,C01,C11','泡菜 100g；嫩豆腐 1/2 盒；豬肉片 80g；高湯包 1 包',true],['味噌鮭魚鍋','晚餐','K01,C01,C11','鮭魚 120g；味噌 15g；豆腐 1/2 盒；白菜 100g',true],['昆布火鍋','晚餐','K01,C01,C11','昆布湯包 1 包；肉片 120g；蔬菜盤 1 份；豆腐 1/2 盒',true],['麻辣鍋','晚餐','K01,C01,C11','麻辣湯底 1 包；肉片 120g；豆腐 1/2 盒；菇類 80g',true],['番茄蔬菜鍋','晚餐','K01,C01,C11','番茄湯底 1 包；高麗菜 100g；香腸 1 條；菇類 80g',true],['燒肉生菜包','晚餐','K04,C01,C12','豬五花 150g；生菜 1 把；泡菜 50g；烤肉醬 20ml',false],['炭烤香腸','晚餐','C02,C05,C13,C12','香腸 2 條；蒜頭 2 瓣；烤肉醬 15ml',false],['炭烤玉米','晚餐','C02,C05,C13,C12','玉米 1 根；奶油 10g；鹽 少許',false],['炭烤杏鮑菇','晚餐','C02,C05,C13,C12','杏鮑菇 2 根；醬油 10ml；奶油 10g',false],['炭烤雞翅','晚餐','C02,C05,C13,C12','雞翅 4 隻；烤肉醬 25ml；胡椒 少許',false],['烤棉花糖','宵夜','C02,C05,C13','棉花糖 10 顆；餅乾 4 片；巧克力 20g',false],['調理包燴飯','晚餐','K02,C01','白米 1 杯；牛肉燴飯調理包 1 包',false],['調理包麻婆豆腐飯','晚餐','K02,K01,C01','白米 1 杯；麻婆豆腐調理包 1 包；豆腐 1/2 盒',false],['調理包雞肉飯','晚餐','K02,C01','白米 1 杯；雞肉飯調理包 1 包；海苔 少許',false],['調理包燉牛肉','晚餐','K02,K01,C01','白米 1 杯；燉牛肉調理包 1 包；麵包 1 個',false],['調理包義式燉飯','晚餐','K01,C01,C11','義式燉飯調理包 1 包；起司粉 少許',false],['罐頭咖哩飯','晚餐','K02,C01','白米 1 杯；咖哩罐頭 1 罐；福神漬 少許',false],['罐頭紅燒牛肉麵','晚餐','K01,C01,C11','紅燒牛肉罐頭 1 罐；關廟麵 1 份；青菜 1 把',false],['鯖魚罐頭拌麵','午餐','K01,C01,C11','乾麵 1 份；鯖魚罐頭 1 罐；醬油 10ml；蔥花 少許',false],['鮪魚罐頭三明治','午餐','K06,C01','吐司 2 片；鮪魚罐頭 1/2 罐；美乃滋 15g；小黃瓜 1/4 根',false],['雞肉沙拉','午餐','C01,T01','即食雞胸 1 包；生菜 1 把；小番茄 5 顆；沙拉醬 15ml',false],['水果優格杯','早餐','T01,T05','優格 1 杯；香蕉 1 根；莓果 50g；燕麥 20g',false],['飯糰','午餐','K02,C01,T04','白米 1 杯；鮪魚罐頭 1/2 罐；海苔 2 片；美乃滋 10g',false],['煎飯糰','宵夜','K05,C01,C11','飯糰 1 個；醬油 10ml；奶油 5g',false],['起司燉飯','晚餐','K01,C01,C11','白飯 1 碗；牛奶 150ml；起司片 1 片；培根 1 片',true],['番茄蛋花湯','晚餐','K01,C01,C11','番茄 1 顆；雞蛋 1 顆；高湯粉 1 包；蔥花 少許',true],['蛋花麵','午餐','K01,C01,C11','麵條 1 份；雞蛋 1 顆；青菜 1 把；高湯粉 1 包',true],['香菇雞湯','晚餐','K01,C01,C11','雞腿肉 150g；乾香菇 3 朵；薑 3 片；鹽 少許',true],['奶油蘑菇湯','早餐','K01,C01,C11','蘑菇 100g；濃湯包 1 包；牛奶 150ml',true],['蒸燒賣','早餐','K03,C01,C10','冷凍燒賣 6 顆；醬油 10ml；薑絲 少許',false],['蒸蛋','晚餐','K03,C01,C10','雞蛋 2 顆；高湯 150ml；醬油 5ml',false],['蒸地瓜','早餐','K03,C01,C10','地瓜 1 條；水 200ml',false],['蒸玉米','午餐','K03,C01,C10','玉米 1 根；奶油 10g',false],['黑飯盒燉菜','晚餐','K03,C01,C10','牛肋條 150g；紅蘿蔔 1/3 根；洋蔥 1/4 顆；燉菜調理包 1 包',true],['酒精爐泡麵','午餐','C04,T02,T05','泡麵 1 包；熱水 350ml',false],['酒精爐濃湯','午餐','C04,T02,T05','濃湯粉 1 包；熱水 250ml；餅乾 1 包',false],['即食飯配罐頭','午餐','C01,T01,T04','即食白飯 1 包；鯖魚罐頭 1 罐；海苔 少許',false],['冷麵野餐盒','午餐','T01,T04','蕎麥麵 1 份；胡麻醬 20ml；小黃瓜 1/4 根；蛋 1 顆',false],['雞蛋沙拉三明治','早餐','K05,C01,C11','吐司 2 片；雞蛋 2 顆；美乃滋 15g；胡椒 少許',false],['香蕉巧克力鬆餅','早餐','K06,C01','鬆餅粉 80g；香蕉 1 根；巧克力 20g；牛奶 80ml',false],['法式吐司','早餐','K05,C01,C11','吐司 2 片；雞蛋 1 顆；牛奶 80ml；奶油 5g',false],['鮪魚蛋餅','早餐','K06,C01','蛋餅皮 1 張；鮪魚 1/2 罐；雞蛋 1 顆；美乃滋 10g',false],['漢堡排飯','晚餐','K02,K04,C01,C12','白米 1 杯；冷凍漢堡排 1 片；照燒醬 20ml；青菜 1 把',false],['照燒雞腿飯','晚餐','K02,K04,C01,C12','白米 1 杯；雞腿排 150g；照燒醬 25ml；白芝麻 少許',false],['蒜香蝦仁','晚餐','K05,C01,C11','蝦仁 120g；大蒜 2 瓣；奶油 10g；鹽 少許',true],['辣炒年糕','晚餐','K05,C01,C11','年糕 150g；韓式辣醬 20g；魚板 50g；高麗菜 80g',true],['泡菜起司炒飯','午餐','K05,C01,C11','白飯 1 碗；泡菜 80g；起司片 1 片；雞蛋 1 顆',true],['烤肉飯糰','午餐','C02,C05,C13,C12','飯糰 1 個；醬油 10ml；海苔 1 片',false]
];
recipeSpecs.slice(0,94).forEach(([name,meal,gear,ingredients,onsite],i)=>recipes.push({id:`RCP${String(i+7).padStart(2,'0')}`,name,meal,gear:gear.split(','),ingredients:ingredients.split('；'),onsite}));
const defaultLocations=['裝備櫃','裝備袋','營柱袋','工具包','車後廂','廚具箱','焚火箱','餐具包','燈具包','電子包','小物盒','個人背包'];
const baseState = () => ({gear: defaultGear, recipes, locations:defaultLocations, trips:[], logs:[], activeTripId:null, page:'home'});
let state;
let listTab = 'pack';
let gearCategoryFilter = 'all';
const store = { async get(){ const r = await chrome.storage.local.get(key); return r[key] || null; }, async save(){ await chrome.storage.local.set({[key]:state}); } };
const gearById = id => state.gear.find(g=>g.id===id);
const trip = () => state.trips.find(t=>t.id===state.activeTripId);
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const levelText = {L1:'L1 機車極簡',L2:'L2 機車舒適',L3:'L3 汽車日歸',L4:'L4 汽車全配'};

function item(id, reason){ const g=gearById(id); return g ? {gearId:id,gearSyncId:g.syncId||`legacy:gear:${id}`,name:g.name,category:g.category,reason,checked:false,manual:false}:null; }
function buildTripItems(t){
 const ids = new Map(); const add=(id,reason)=>{if(gearById(id)&&!ids.has(id))ids.set(id,item(id,reason));};
 const overnight=t.duration==='overnight', fire=t.goals.includes('fire'), cooking=t.goals.includes('cook'), bush=t.goals.includes('bush'), prep=t.prep;
 ['F03','F04','F06','C01','C07','T01','T02','T04','L05','L06','X01'].forEach(id=>add(id,'基本行程'));
 add(fire?'F02':'F01',fire?'焚火放空':'備料與用餐');
 if(overnight){ ['S07','S08','L03','X02'].forEach(id=>add(id,'過夜需要')); if(bush){['S03','S04','S05','R01','R03','R04'].forEach(id=>add(id,'Bushcraft 過夜'));}else{['S01','S06','R03'].forEach(id=>add(id,'住宿搭設'));} if(t.level==='L4') ['F05','L01','T05','T06','T07'].forEach(id=>add(id,'全配過夜')); }
 if(t.campType==='pallet') add('R05','棧板營位');
 if(t.goals.includes('shelter')) ['S03','R01','R03','R04'].forEach(id=>add(id,'遮陽／避雨'));
 if(fire) ['C02','C05','C06','C12','C13','F06'].forEach(id=>add(id,'焚火／炭烤'));
 if(t.power) add('L04','有插座營位'); else if(overnight) add('L04','行動電源與照明');
 if(cooking) ['C10','C11','T03'].forEach(id=>add(id,'料理目標'));
 if(!prep) ['C08','C09'].forEach(id=>add(id,'現場備料'));
 if(t.goals.includes('mood')) ['F05','L01','L07','T07'].forEach(id=>add(id,'氣氛拍照'));
 for(const rid of t.recipeIds){ const r=state.recipes.find(x=>x.id===rid); if(!r)continue; r.gear.forEach(id=>add(id,`料理：${r.name}`)); if(!prep && r.onsite){add('C08',`料理：${r.name}`);add('C09',`料理：${r.name}`);} }
 state.gear.filter(g=>g.owned&&g.levels?.includes(t.level)&&g.contexts?.some(c=>t.goals.includes(c))).forEach(g=>add(g.id,'裝備情境設定'));
 if(t.level==='L1'){ ['F03','F05','S01','S02','S04','C02','L01'].forEach(id=>ids.delete(id)); if(overnight) ['S03','S05','R01','R03','R04'].forEach(id=>add(id,'機車極簡過夜')); if(!t.recipeIds.length) add('K01','一鍋輕食'); }
 if(t.level==='L2') ids.delete('F05');
 return [...ids.values()];
}
function buildShopping(t){ const seen=[]; t.recipeIds.forEach(rid=>{const r=state.recipes.find(x=>x.id===rid); if(r) r.ingredients.forEach(x=>{if(!seen.includes(x))seen.push(x);});}); return seen.map(name=>({name,checked:false})); }
function createTrip(data={}){const createdAt=now(),t={id:uid('trip'),code:`C-${Date.now().toString(36).toUpperCase()}`,revision:1,name:data.name||'未命名露營',date:data.date||new Date().toISOString().slice(0,10),location:data.location||'',duration:data.duration||'day',campType:data.campType||'grass',level:data.level||'L1',power:!!data.power,goals:data.goals||[],prep:!!data.prep,recipeIds:data.recipeIds||[],status:'active',statusUpdatedAt:createdAt,createdAt,updatedAt:createdAt,items:[],shopping:[],overrides:{added:[],removed:[]}};t.items=buildTripItems(t);t.shopping=buildShopping(t);return t;}
function recalc(t){ t.overrides??={added:[],removed:[]};t.overrides.added??=[];t.overrides.removed??=[];const key=i=>String(i?.gearSyncId||i?.gearId);const before=new Map((t.items||[]).map(i=>[key(i),i])); const fresh=buildTripItems(t).filter(i=>!t.overrides.removed.includes(i.gearId)); t.overrides.added.forEach(i=>{if(!fresh.some(x=>key(x)===key(i)))fresh.push(structuredClone(i));}); before.forEach(i=>{if(i.manual&&!t.overrides.removed.includes(i.gearId)&&!fresh.some(x=>key(x)===key(i)))fresh.push(structuredClone(i));}); fresh.forEach(i=>{if(before.has(key(i)))i.checked=before.get(key(i)).checked;}); t.items=fresh; const oldShop=new Map((t.shopping||[]).map(i=>[i.shoppingKey||i.name,i]));t.shopping=buildShopping(t).map(i=>oldShop.has(i.shoppingKey||i.name)?oldShop.get(i.shoppingKey||i.name):i);t.revision++;t.updatedAt=now();}

function header(){return `<header class="top"><div class="brand"><h1>露營助手</h1><span class="brand-note">CAMP PLANNER</span></div></header>`}
function nav(){return `<nav class="nav" aria-label="主要導覽">${[['trips','行程'],['lists','清單'],['gear','裝備'],['logs','紀錄']].map(([p,n])=>`<button class="${state.page===p?'active':''}" data-page="${p}">${n}</button>`).join('')}</nav>`}
function art(){return ''}
function render(){ const app=$('#app'); let content=state.page==='trips'?renderTrips():state.page==='lists'?renderLists():state.page==='gear'?renderGear():renderLogs(); app.innerHTML=header()+content+nav(); bind(); }
function renderTrips(){const active=trip(); if(active){const goals=Array.isArray(active.goals)?active.goals:[];const items=Array.isArray(active.items)?active.items:[];const shopping=typeof shoppingProgressRows==='function'?shoppingProgressRows(active):(Array.isArray(active.shopping)?active.shopping:[]);return `<section class="page">${art('mountain')}<p class="eyebrow">行程卡片 · ${active.code} · v${active.revision}</p><h2 class="title">${esc(active.name)}</h2><p class="sub">${active.date}　${esc(active.location||'未填地點')}<br>${active.duration==='overnight'?'2 日 1 夜':'日歸'} · ${levelText[active.level]}</p>${goals.map(x=>`<span class="tag">${goalText[x]}</span>`).join('')}<div class="card"><div class="row between"><span>打包</span><strong>${done(items)} / ${items.length}</strong></div><div class="progress"><span style="width:${pct(items)}%"></span></div><div class="row between"><span>採買</span><strong>${done(shopping)} / ${shopping.length}</strong></div><div class="progress"><span style="width:${pct(shopping)}%"></span></div></div><div class="actions"><button class="primary" data-page="lists">查看清單</button><button class="secondary" data-action="edit-trip">編輯</button><button class="secondary" data-action="export-trip">匯出卡片</button></div><div class="actions"><button class="ghost" data-action="archive-trip">結束並歸檔</button><button class="ghost" data-action="new-trip">新增行程</button></div></section>`;} const ts=state.trips;return `<section class="page">${art('mountain')}<div class="row between"><div><p class="eyebrow">我的露營</p><h2 class="title">行程</h2></div><button class="primary" data-action="new-trip">新增行程</button></div>${ts.length?ts.map(t=>tripRow(t)).join(''):`<div class="empty"><span class="art">▲ ⛺ ♠</span>建立一張行程卡片，<br>出發前可以確認物品清單是否齊全。</div>`}</section>`}
function tripRow(t){return `<button class="card ${t.status==='archived'?'':'active'}" data-action="open-trip" data-id="${t.id}" style="width:100%;text-align:left"><div class="row between"><h3>${esc(t.name)}</h3><span class="tiny">${t.status==='archived'?'已歸檔':t.code}</span></div><div class="meta">${t.date} · ${esc(t.location||'未填地點')} · ${levelText[t.level]}</div><div class="progress"><span style="width:${pct(t.items)}%"></span></div></button>`}
function renderLists(){const t=trip();if(!t)return noTrip();const groups=groupItems(t.items);return `<section class="page"><p class="eyebrow">行程清單 · ${t.code}</p><h2 class="title">${esc(t.name)}</h2><p class="trip-context">${t.date}　${esc(t.location||'未填地點')}<br>${t.duration==='overnight'?'2 日 1 夜':'日歸'} · ${levelText[t.level]}　｜　目的：${esc(cardPurpose(t))}</p><div class="split"><button class="${listTab==='pack'?'primary':'secondary'}" data-listtab="pack">帶什麼 ${done(t.items)}/${t.items.length}</button><button class="${listTab==='shop'?'primary':'secondary'}" data-listtab="shop">買什麼 ${done(t.shopping)}/${t.shopping.length}</button></div><div id="list-body">${listTab==='pack'?renderPack(groups):renderShop(t.shopping)}</div></section>`}
function groupItems(items){return items.reduce((a,i)=>{(a[i.category]??=[]).push(i);return a;},{});}
function renderPack(groups){return Object.entries(groups).map(([cat,items])=>`<div class="section-head"><h2>${esc(cat)}</h2><span>${done(items)}/${items.length}</span></div><div class="list">${items.map(i=>`<div class="item ${i.checked?'checked':''}"><input aria-label="${esc(i.name)}" type="checkbox" data-pack="${i.gearId}" ${i.checked?'checked':''}><span style="flex:1"><span class="item-name">${esc(i.name)}</span><span class="reason">${esc(i.manual?'手動加入':i.reason)}</span></span><button class="ghost" aria-label="從本次清單移除 ${esc(i.name)}" data-action="remove-from-trip" data-id="${i.gearId}">×</button></div>`).join('')}</div>`).join('')+`<div class="actions"><button class="secondary" data-action="add-to-trip">手動加入裝備</button></div>`}
function renderShop(items){return `<div class="section-head"><h2>採買清單</h2><span>${done(items)}/${items.length}</span></div><div class="list">${items.length?items.map((i,n)=>`<label class="item ${i.checked?'checked':''}"><input type="checkbox" data-shop="${n}" ${i.checked?'checked':''}><span class="item-name">${esc(i.name)}</span></label>`).join(''):'<p class="sub">尚未選擇料理。</p>'}</div>`}
function noTrip(){return `<section class="page"><div class="empty"><span class="art">▲ ⛺</span>先建立一場行程，才會有這次的清單。<div class="actions" style="justify-content:center"><button class="primary" data-action="new-trip">新增行程</button></div></div></section>`}
function renderGear(){return `<section class="page">${art('water')}<div class="row between"><div><p class="eyebrow">我的裝備</p><h2 class="title">裝備</h2></div><button class="primary" data-action="add-gear">新增裝備</button></div><div class="actions"><button class="secondary" data-action="add-recipe">新增料理</button><button class="secondary" data-action="import-file">匯入資料</button><button class="ghost" data-action="export-json">備份</button></div><input id="gear-search" placeholder="搜尋名稱或分類" aria-label="搜尋裝備"><p class="sub">${state.gear.length} 件已登記 · ${state.recipes.length} 道料理</p><div id="gear-list">${gearRows(state.gear)}</div></section>`}
function gearRows(gs){return gs.map(g=>`<button class="item" data-action="edit-gear" data-id="${g.id}" style="width:100%;text-align:left"><span class="tag">${esc(g.id)}</span><span><span class="item-name">${esc(g.name)}</span><span class="reason">${esc(g.category)} · ${esc(g.location||'未填收納位置')}</span></span></button>`).join('')}
function renderLogs(){const logs=state.logs;return `<section class="page">${art('fire')}<p class="eyebrow">回顧</p><h2 class="title">紀錄</h2>${logs.length?logs.map(l=>`<div class="card"><h3>${esc(l.name)}</h3><p class="meta">${l.date} · ${l.notes||'未填心得'}</p></div>`).join(''):`<div class="empty"><span class="art">♠ ♨ ▲</span>完成一場露營後，在行程卡片選擇「結束並歸檔」。</div>`}</section>`}
const goalText={cook:'料理規劃',fire:'焚火烤肉',bush:'輕量野營',mood:'拍照佈置',shelter:'遮陽避雨',rest:'放空休息',picnic:'野餐聊天',coffee:'咖啡茶飲',friends:'親友同樂',light:'輕量挑戰',hike:'登山健行',rain:'雨天備案'};const done=a=>a.filter(x=>x.checked).length;const pct=a=>a.length?Math.round(done(a)/a.length*100):0;
const goalHelp={cook:'加入料理工具、合適鍋具與完整調味。',fire:'加入焚火台、生火包、夾具與防火布。',bush:'優先推薦 DD 天幕、行軍床、蚊帳與搭設工具。',mood:'加入層架桌、瓦斯燈與個人擺飾。',shelter:'加入 DD 天幕、營柱、營釘與營繩。',rest:'以舒適座椅與簡單料理為主。',picnic:'日歸取向，建議桌椅、保冷與輕食。',coffee:'加入鈦杯、熱水與茶／咖啡料理建議。',friends:'預留分享料理與較完整的桌面空間。',light:'偏向少量、可背負的裝備與單鍋料理。',hike:'偏向登山包、酒精爐與純煮水料理。',rain:'加強遮蔽、地面防護與防潮收納。'};

function bind(){
 $$('[data-page]').forEach(b=>b.onclick=()=>{state.page=b.dataset.page;render();});
 $$('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action,b.dataset));
 $$('[data-listtab]').forEach(b=>b.onclick=()=>{listTab=b.dataset.listtab;render();});
 $$('[data-pack]').forEach(x=>x.onchange=async()=>{const t=trip(),i=t.items.find(y=>y.gearId===x.dataset.pack);i.checked=x.checked;t.updatedAt=now();await store.save();render();});
 $$('[data-shop]').forEach(x=>x.onchange=async()=>{const t=trip();t.shopping[+x.dataset.shop].checked=x.checked;t.updatedAt=now();await store.save();render();});
 $$('[data-recipe-slot]').forEach(x=>x.onchange=async()=>{const t=trip();t.recipeMeals??={};t.recipeMeals[x.dataset.recipeSlot]=x.value;t.shopping.filter(item=>item.recipeId===x.dataset.recipeSlot).forEach(item=>item.meal=x.value);await store.save();render();});
 $('#gear-search')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();$('#gear-list').innerHTML=gearRows(state.gear.filter(g=>(g.name+g.category+g.id).toLowerCase().includes(q)));$$('[data-action]', $('#gear-list')).forEach(b=>b.onclick=()=>action(b.dataset.action,b.dataset));});
 $('#gear-category-filter')?.addEventListener('change',e=>{gearCategoryFilter=e.target.value;render();});
}
async function action(name,data={}){
 if(name==='toggle-gear-favorite'){const g=gearById(data.id);if(g){g.favorite=!g.favorite;await store.save();render();}return;}
 if(name==='new-trip') return tripDialog();
 if(name==='show-trip-list'){state.activeTripId=null;state.page='trips';await store.save();return render();}
 if(name==='edit-trip') return tripDialog(trip());
 if(name==='open-trip'){state.activeTripId=data.id;state.page='trips';await store.save();return render();}
 if(name==='archive-trip') return archiveDialog();
 if(name==='add-gear') return gearDialog();
 if(name==='add-recipe') return recipeDialog();
 if(name==='edit-gear') return gearDialog(gearById(data.id));
 if(name==='add-to-trip') return addToTripDialog();
 if(name==='remove-from-trip'){const t=trip(),i=t.items.find(x=>x.gearId===data.id);if(!i)return;t.items=t.items.filter(x=>x.gearId!==data.id);if(!t.overrides.removed.includes(data.id))t.overrides.removed.push(data.id);t.overrides.added=t.overrides.added.filter(x=>x.gearId!==data.id);await store.save();return render();}
 if(name==='export-trip') return exportCard(trip());
 if(name==='import-file') return chooseFile('import');
 if(name==='manage-locations') return locationDialog();
 if(name==='export-json') return download(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),'露營助手備份.json');
}
function dialog(html){document.body.insertAdjacentHTML('beforeend',`<div class="dialog" role="dialog" aria-modal="true"><div class="dialog-box">${html}</div></div>`);const d=$('.dialog:last-of-type');$$('input[name="goal"]',d).forEach(input=>{const label=input.closest('label');if(label){label.title=goalHelp[input.value]||'';label.setAttribute('aria-label',`${goalText[input.value]}：${goalHelp[input.value]||''}`);}});return d;}
function closeDialog(){document.querySelector('.dialog:last-of-type')?.remove();}
function tripDialog(existing){const t=existing||createTrip();const d=dialog(`<h2>${existing?'編輯行程':'新增行程'}</h2><form id="trip-form"><div class="form-grid"><div class="field full"><label>行程名稱</label><input name="name" required value="${esc(t.name)}"></div><div class="field"><label>日期</label><input type="date" name="date" value="${t.date}"></div><div class="field"><label>地點</label><input name="location" value="${esc(t.location)}" placeholder="例如：苗栗營地"></div><div class="field"><label>行程</label><select name="duration"><option value="day" ${t.duration==='day'?'selected':''}>日歸</option><option value="overnight" ${t.duration==='overnight'?'selected':''}>2 日 1 夜</option></select></div><div class="field"><label>量級</label><select name="level">${Object.entries(levelText).map(([v,n])=>`<option value="${v}" ${t.level===v?'selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label>營地</label><select name="campType"><option value="grass" ${t.campType==='grass'?'selected':''}>草地</option><option value="pallet" ${t.campType==='pallet'?'selected':''}>棧板</option><option value="wild" ${t.campType==='wild'?'selected':''}>野營</option></select></div><div class="field"><label class="check-label"><input type="checkbox" name="power" ${t.power?'checked':''}> 有插座</label></div><div class="field full"><label>這次想做什麼</label><div class="checks">${Object.entries(goalText).map(([v,n])=>`<label class="check-label"><input type="checkbox" name="goal" value="${v}" ${t.goals.includes(v)?'checked':''}>${n}</label>`).join('')}</div></div><div class="field full"><label>料理</label><div class="checks">${state.recipes.map(r=>`<label class="check-label"><input type="checkbox" name="recipe" value="${r.id}" ${t.recipeIds.includes(r.id)?'checked':''}>${esc(r.name)}</label>`).join('')}</div></div><div class="field full"><label class="check-label"><input type="checkbox" name="prep" ${t.prep?'checked':''}> 在家先備料</label><span class="tiny">若料理仍需現場切配，砧板與菜刀會保留。</span></div></div><div class="actions"><button class="primary">${existing?'儲存變更':'建立行程卡片'}</button><button type="button" class="secondary" id="cancel">取消</button></div></form>`); $('#cancel',d).onclick=closeDialog; $('#trip-form',d).onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const vals={name:f.get('name'),date:f.get('date'),location:f.get('location'),duration:f.get('duration'),level:f.get('level'),campType:f.get('campType'),power:f.get('power')==='on',goals:f.getAll('goal'),prep:f.get('prep')==='on',recipeIds:f.getAll('recipe')};if(existing){Object.assign(existing,vals);recalc(existing);}else{const fresh=createTrip(vals);state.trips.unshift(fresh);state.activeTripId=fresh.id;}await store.save();closeDialog();state.page='trips';render();};}
function gearDialog(existing){const g=existing||{id:'',name:'',category:'生活清潔',note:'',location:'',size:'medium',levels:['L1','L2','L3','L4'],contexts:[],links:[]};const d=dialog(`<h2>${existing?'編輯裝備':'新增裝備'}</h2><form id="gear-form"><div class="form-grid"><div class="field"><label>編號</label><input name="id" ${existing?'readonly':''} required placeholder="例如 X03" value="${esc(g.id)}"></div><div class="field"><label>分類</label><input name="category" required value="${esc(g.category)}"></div><div class="field full"><label>名稱</label><input name="name" required value="${esc(g.name)}"></div><div class="field"><label>收納位置</label><input name="location" value="${esc(g.location)}"></div><div class="field"><label>體積</label><select name="size">${[['small','極小'],['medium','中型'],['large','大型']].map(([v,n])=>`<option value="${v}" ${g.size===v?'selected':''}>${n}</option>`).join('')}</select></div><div class="field full"><label>適用量級</label><div class="checks">${Object.entries(levelText).map(([v,n])=>`<label class="check-label"><input name="level" type="checkbox" value="${v}" ${g.levels.includes(v)?'checked':''}>${n}</label>`).join('')}</div></div><div class="field full"><label>適用情境</label><div class="checks">${Object.entries(goalText).map(([v,n])=>`<label class="check-label"><input name="context" type="checkbox" value="${v}" ${g.contexts.includes(v)?'checked':''}>${n}</label>`).join('')}</div></div><div class="field full"><label>備註／搭配需求</label><textarea name="note">${esc(g.note)}</textarea></div></div><div id="gear-eval" class="notice"></div><div class="actions"><button class="primary">儲存至我的裝備</button><button type="button" class="secondary" id="cancel">取消</button>${existing?'<button type="button" class="ghost danger" id="delete-gear">刪除</button>':''}</div></form>`); const f=$('#gear-form',d);const evaluate=()=>{$('#gear-eval',d).innerHTML=gearAssessment(Object.fromEntries(new FormData(f)),f);};f.addEventListener('input',evaluate);f.addEventListener('change',evaluate);evaluate();$('#cancel',d).onclick=closeDialog;$('#delete-gear',d)?.addEventListener('click',async()=>{if(confirm('刪除這件裝備？')){state.gear=state.gear.filter(x=>x.id!==existing.id);await store.save();closeDialog();render();}});f.onsubmit=async e=>{e.preventDefault();const data=new FormData(f),id=data.get('id').trim().toUpperCase();if(!existing&&state.gear.some(x=>x.id===id)){alert('裝備編號已存在，請改用其他編號。');return;}const n={id,name:data.get('name'),category:data.get('category'),location:data.get('location'),note:data.get('note'),size:data.get('size'),levels:data.getAll('level'),contexts:data.getAll('context'),links:[],owned:true};if(existing)Object.assign(existing,n);else state.gear.push(n);await store.save();closeDialog();render();};}
function recipeDialog(){const d=dialog(`<h2>新增料理</h2><form id="recipe-form"><div class="field"><label>料理名稱</label><input name="name" required placeholder="例如：奶油雞肉炊飯"></div><div class="field"><label>餐別</label><select name="meal"><option>早餐</option><option>午餐</option><option selected>晚餐</option><option>宵夜</option></select></div><div class="field"><label>單人份食材／醬料</label><textarea name="ingredients" required placeholder="一行一項，例如：&#10;白米 1 杯&#10;雞腿肉 120g&#10;醬油 15ml"></textarea></div><div class="field"><label>需要的裝備</label><div class="checks">${state.gear.filter(g=>g.category.includes('烹飪')||g.category.includes('鍋具')||g.category.includes('餐具')).map(g=>`<label class="check-label"><input type="checkbox" name="gear" value="${g.id}">${esc(g.name)}</label>`).join('')}</div></div><div class="field"><label class="check-label"><input type="checkbox" name="onsite"> 需要現場切配</label></div><div class="actions"><button class="primary">儲存料理</button><button class="secondary" type="button" id="cancel">取消</button></div></form>`);$('#cancel',d).onclick=closeDialog;$('#recipe-form',d).onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);state.recipes.push({id:uid('RCP'),name:f.get('name'),meal:f.get('meal'),ingredients:f.get('ingredients').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),gear:f.getAll('gear'),onsite:f.get('onsite')==='on'});await store.save();closeDialog();render();};}
function gearAssessment(d,form){const levels=new FormData(form).getAll('level'),ctx=new FormData(form).getAll('context'),name=d.name||'這件裝備';const same=state.gear.find(x=>x.name===d.name&&x.id!==d.id);let a=`<strong>${esc(name)}</strong>：適合 ${levels.length?levels.map(l=>levelText[l]).join('、'):'尚未設定量級'}。`;if(d.size==='large'&&levels.includes('L1'))a+=' 大型裝備放入機車極簡清單時會顯示容量提醒。';if(same)a+=` 可能與「${esc(same.name)}」重複。`;if(ctx.includes('fire')&&!/夾|爐|火|焚/.test(`${d.name}${d.note}`))a+=' 焚火情境仍需確認熱源與夾具是否齊全。';return a;}
function addToTripDialog(){const t=trip();const available=state.gear.filter(g=>!t.items.some(i=>i.gearId===g.id));const d=dialog(`<h2>手動加入裝備</h2><div class="list">${available.map(g=>`<label class="item"><input type="checkbox" value="${g.id}"><span><span class="item-name">${esc(g.name)}</span><span class="reason">${esc(g.category)}</span></span></label>`).join('')}</div><div class="actions"><button class="primary" id="add-items">加入</button><button class="secondary" id="cancel">取消</button></div>`);$('#cancel',d).onclick=closeDialog;$('#add-items',d).onclick=async()=>{$$('input:checked',d).forEach(x=>{const g=gearById(x.value);const i=item(g.id,'手動加入');i.manual=true;t.items.push(i);t.overrides.added.push(i);t.overrides.removed=t.overrides.removed.filter(id=>id!==g.id);});await store.save();closeDialog();render();};}
function archiveDialog(){const t=trip();const d=dialog(`<h2>結束這次露營</h2><p class="sub">勾選實際沒用到的裝備，留下下次會用到的短記。</p><form id="archive-form"><div class="field"><label>未使用裝備</label><div class="checks">${t.items.map(i=>`<label class="check-label"><input type="checkbox" name="unused" value="${i.gearId}">${esc(i.name)}</label>`).join('')}</div></div><div class="field"><label>心得</label><textarea name="notes" placeholder="例如：牛排很好吃，但帶了層架桌沒有用到。"></textarea></div><div class="actions"><button class="primary">歸檔</button><button type="button" class="secondary" id="cancel">取消</button></div></form>`);$('#cancel',d).onclick=closeDialog;$('#archive-form',d).onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);t.status='archived';state.logs.unshift({id:uid('log'),tripId:t.id,name:t.name,date:t.date,notes:f.get('notes'),unused:f.getAll('unused'),cooked:t.recipeIds});state.activeTripId=null;await store.save();closeDialog();render();};}

function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
let toastTimer;
function notify(message,kind='info'){let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';el.setAttribute('role','status');document.body.append(el);}el.textContent=message;el.dataset.kind=kind;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4200);}
async function digest(text){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function gzip(text){const stream=new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));return new Uint8Array(await new Response(stream).arrayBuffer());}
async function ungzip(bytes){const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return new Response(stream).text();}
function base64(bytes){let s='';bytes.forEach(x=>s+=String.fromCharCode(x));return btoa(s);}
function unbase64(s){const x=atob(s);return Uint8Array.from(x,c=>c.charCodeAt(0));}
function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function u32be(n){return Uint8Array.of(n>>>24,(n>>>16)&255,(n>>>8)&255,n&255)}
function addPngChunk(png,type,data){const chunkData=typeof data==='string'?new TextEncoder().encode(data):data;const typeB=new TextEncoder().encode(type);const raw=new Uint8Array(typeB.length+chunkData.length);raw.set(typeB);raw.set(chunkData,typeB.length);const part=new Uint8Array(12+chunkData.length);part.set(u32be(chunkData.length));part.set(typeB,4);part.set(chunkData,8);part.set(u32be(crc32(raw)),8+chunkData.length);let pos=8;while(pos<png.length){const len=(png[pos]<<24)|(png[pos+1]<<16)|(png[pos+2]<<8)|png[pos+3];const kind=new TextDecoder().decode(png.slice(pos+4,pos+8));if(kind==='IEND'){const out=new Uint8Array(png.length+part.length);out.set(png.slice(0,pos));out.set(part,pos);out.set(png.slice(pos),pos+part.length);return out;}pos+=12+len;}throw new Error('不是有效的 PNG');}
function readPngChunk(bytes,type){const sig='137,80,78,71,13,10,26,10';if(bytes.slice(0,8).join(',')!==sig)throw new Error('不是有效的 PNG');let pos=8;while(pos<bytes.length){const len=(((bytes[pos]<<24)>>>0)|(bytes[pos+1]<<16)|(bytes[pos+2]<<8)|bytes[pos+3])>>>0;const kind=new TextDecoder().decode(bytes.slice(pos+4,pos+8));if(kind===type)return bytes.slice(pos+8,pos+8+len);pos+=12+len;}return null;}
async function exportCard(t){try{const snapshot={format:'camp-card.v1',exportedAt:now(),trip:structuredClone(t),gear:t.items.map(i=>gearById(i.gearId)).filter(Boolean),recipes:t.recipeIds.map(id=>state.recipes.find(r=>r.id===id)).filter(Boolean)};const json=JSON.stringify(snapshot);const meta=JSON.stringify({format:'camp-card.v1',compression:'gzip',sha256:await digest(json),payload:base64(await gzip(json))});const png=await drawCard(t);const tagged=addPngChunk(new Uint8Array(await png.arrayBuffer()),'caMp',meta);download(new Blob([tagged],{type:'image/png'}),`${t.code}-v${t.revision}.png`);alert('已匯出行程卡片。若要能重新匯入，請以「檔案／原始檔」傳送 PNG。');}catch(e){console.error(e);alert('匯出失敗：'+e.message);}}
function drawCard(t){return new Promise(resolve=>{const c=document.createElement('canvas'),w=1080,h=1500;c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.fillStyle='#161616';x.fillRect(0,0,w,22);x.strokeStyle='#161616';x.lineWidth=4;x.beginPath();x.moveTo(0,183);x.lineTo(160,92);x.lineTo(290,183);x.lineTo(465,57);x.lineTo(650,183);x.lineTo(825,107);x.lineTo(1080,183);x.stroke();x.font='700 34px sans-serif';x.fillText('露營助手  /  行程卡片',64,110);x.font='26px sans-serif';x.fillText(`${t.code} · v${t.revision}`,64,150);x.font='700 60px sans-serif';wrap(x,t.name,64,270,950,72);x.font='30px sans-serif';x.fillText(`${t.date}  ·  ${t.location||'未填地點'}`,64,410);x.fillText(`${t.duration==='overnight'?'2 日 1 夜':'日歸'}  ·  ${levelText[t.level]}`,64,454);x.strokeStyle='#161616';x.lineWidth=2;x.beginPath();x.moveTo(64,495);x.lineTo(1016,495);x.stroke();x.font='700 28px sans-serif';x.fillText('這次料理',64,550);x.font='26px sans-serif';wrap(x,t.recipeIds.map(id=>state.recipes.find(r=>r.id===id)?.name).filter(Boolean).join('、')||'尚未選擇',64,594,930,40);x.font='700 28px sans-serif';x.fillText(`打包清單  ${done(t.items)} / ${t.items.length}`,64,710);x.font='23px sans-serif';let y=753;for(const i of t.items.slice(0,18)){x.fillText(`${i.checked?'☑':'☐'}  ${i.name}`,76,y);y+=35;}if(t.items.length>18)x.fillText(`… 另有 ${t.items.length-18} 項`,76,y);x.font='700 28px sans-serif';x.fillText(`採買  ${done(t.shopping)} / ${t.shopping.length}`,590,710);x.font='23px sans-serif';y=753;for(const i of t.shopping.slice(0,18)){x.fillText(`${i.checked?'☑':'☐'}  ${i.name}`,600,y);y+=35;}x.fillStyle='#555';x.font='21px sans-serif';x.fillText('原始 PNG 含可還原的行程資料；請以檔案模式傳送。',64,1415);x.fillText('▲  ⛺  ♠  ♨  ≈',64,1460);c.toBlob(resolve,'image/png');});}
function wrap(ctx,text,x,y,max,widthLine){const chars=[...text];let line='',dy=0;for(const char of chars){if(ctx.measureText(line+char).width>max&&line){ctx.fillText(line,x,y+dy);line=char;dy+=widthLine;}else line+=char;}if(line)ctx.fillText(line,x,y+dy);return y+dy;}
function chooseFile(mode){const input=$('#file-input');input.value='';input.onchange=async()=>{const f=input.files[0];if(!f)return;try{if(f.type==='image/png'||f.name.toLowerCase().endsWith('.png'))await importCard(f);else await importData(f);alert('匯入完成。');render();}catch(e){console.error(e);alert('匯入失敗：'+e.message);}};input.click();}
async function importCard(file){const bytes=new Uint8Array(await file.arrayBuffer()),chunk=readPngChunk(bytes,'caMp');if(!chunk)throw new Error('這張 PNG 沒有可還原的行程資料。圖片可能被通訊軟體壓縮或轉檔，請取得原始檔。');const info=JSON.parse(new TextDecoder().decode(chunk));if(info.format!=='camp-card.v1')throw new Error('不支援的行程卡片版本');const json=await ungzip(unbase64(info.payload));if(await digest(json)!==info.sha256)throw new Error('行程卡片完整性檢查失敗');const snap=JSON.parse(json);const t=snap.trip;t.id=uid('trip');t.code=`${t.code}-I`;t.status='active';t.createdAt=now();t.updatedAt=now();t.revision=1;t.items=(t.items||[]).map(i=>{if(!gearById(i.gearId)){const original=snap.gear.find(g=>g.id===i.gearId);return {...i,reason:`待對應：${original?.name||i.name}`};}return i;});state.trips.unshift(t);state.activeTripId=t.id;state.page='trips';await store.save();}
async function importData(file){const lower=file.name.toLowerCase();if(lower.endsWith('.json')){const data=JSON.parse(await file.text());if(data.gear&&data.trips){state=data;await store.save();return;}if(Array.isArray(data)){mergeGear(data);await store.save();return;}throw new Error('JSON 格式不符合備份或裝備陣列');}let rows;if(lower.endsWith('.csv'))rows=parseCsv(await file.text());else if(lower.endsWith('.xlsx'))rows=await readXlsx(file);else throw new Error('請選擇 XLSX、CSV、JSON 或行程卡片 PNG');if(rows.length<2)throw new Error('找不到裝備資料');const heads=rows[0].map(x=>x.trim());const idIdx=heads.findIndex(x=>/裝備.*編號|^ID$/i.test(x)),catIdx=heads.findIndex(x=>/系統分類|分類/.test(x)),nameIdx=heads.findIndex(x=>/裝備名稱|名稱/.test(x)),noteIdx=heads.findIndex(x=>/規格|備註/.test(x)),locIdx=heads.findIndex(x=>/存放位置|狀態/.test(x));if(idIdx<0||nameIdx<0)throw new Error('找不到「裝備編號」或「裝備名稱」欄位');mergeGear(rows.slice(1).filter(r=>r[idIdx]&&r[nameIdx]).map(r=>({id:r[idIdx],category:r[catIdx]||'未分類',name:r[nameIdx],note:r[noteIdx]||'',location:r[locIdx]||'',owned:true,levels:['L1','L2','L3','L4'],contexts:[],size:'medium',links:[]})));await store.save();}
function mergeGear(list){for(const g of list){const old=state.gear.find(x=>x.id===g.id);if(old)Object.assign(old,g);else state.gear.push(g);}}
function parseCsv(text){return text.replace(/^\uFEFF/,'').trim().split(/\r?\n/).map(line=>line.split(',').map(x=>x.trim().replace(/^"|"$/g,'')));}
async function readXlsx(file){const bytes=new Uint8Array(await file.arrayBuffer());const files=await unzip(bytes);const shared=files['xl/sharedStrings.xml']?xmlStrings(new TextDecoder().decode(files['xl/sharedStrings.xml'])):[];const sheet=files['xl/worksheets/sheet1.xml'];if(!sheet)throw new Error('找不到第一個工作表');const doc=new DOMParser().parseFromString(new TextDecoder().decode(sheet),'application/xml');const rows=[];for(const row of [...doc.getElementsByTagName('row')]){const out=[];for(const c of row.getElementsByTagName('c')){const ref=c.getAttribute('r'),col=ref.match(/[A-Z]+/)[0];const n=[...col].reduce((a,ch)=>a*26+ch.charCodeAt(0)-64,0)-1;const v=c.getElementsByTagName('v')[0]?.textContent||'';out[n]=c.getAttribute('t')==='s'?shared[+v]||'':v;}rows.push(out.map(x=>x||''));}return rows;}
function xmlStrings(xml){const d=new DOMParser().parseFromString(xml,'application/xml');return [...d.querySelectorAll('si')].map(x=>x.textContent||'');}
async function unzip(b){const view=new DataView(b.buffer,b.byteOffset,b.byteLength);let e=-1;for(let i=b.length-22;i>=Math.max(0,b.length-65558);i--){if(view.getUint32(i,true)===0x06054b50){e=i;break;}}if(e<0)throw new Error('不是有效的 XLSX 壓縮檔');const count=view.getUint16(e+10,true),offset=view.getUint32(e+16,true),files={};let p=offset;for(let n=0;n<count;n++){if(view.getUint32(p,true)!==0x02014b50)throw new Error('XLSX 目錄無法讀取');const method=view.getUint16(p+10,true),compressed=view.getUint32(p+20,true),nameLen=view.getUint16(p+28,true),extra=view.getUint16(p+30,true),comment=view.getUint16(p+32,true),local=view.getUint32(p+42,true),name=new TextDecoder().decode(b.slice(p+46,p+46+nameLen));if(view.getUint32(local,true)!==0x04034b50)throw new Error('XLSX 內容無法讀取');const ln=view.getUint16(local+26,true),le=view.getUint16(local+28,true),start=local+30+ln+le,raw=b.slice(start,start+compressed);if(method===0)files[name]=raw;else if(method===8){const s=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));files[name]=new Uint8Array(await new Response(s).arrayBuffer());}p+=46+nameLen+extra+comment;}return files;}

const categories=['住宿與睡眠','搭設工具','桌椅客廳','烹飪熱源','鍋具選項','餐具容器','照明電力收納','氣氛小物','生活清潔'];
const categoryPrefix={'住宿與睡眠':'S','搭設工具':'R','桌椅客廳':'F','烹飪熱源':'C','鍋具選項':'K','餐具容器':'T','照明電力收納':'L','氣氛小物':'L','生活清潔':'X'};
function nextGearId(category){const prefix=categoryPrefix[category]||'X';const nums=state.gear.filter(g=>g.id?.startsWith(prefix)).map(g=>Number(g.id.slice(prefix.length))).filter(Number.isFinite);return `${prefix}${String((Math.max(0,...nums)+1)).padStart(2,'0')}`;}
function menuSummary(t){
  // The visible card must follow the trip's active ingredient rows, not a
  // legacy recipeIds display cache. This makes the card converge with the
  // checklist when the final ingredient removes a recipe relation.
  const activeRecipeIds=new Set((t.shopping||[]).map(item=>item.recipeId).filter(Boolean));
  const names=(t.recipeIds||[]).filter(id=>activeRecipeIds.has(id)).map(id=>state.recipes.find(r=>r.id===id)?.name).filter(Boolean);
  return names.length?`<div class="menu-summary"><span>今日菜單</span><strong>${esc(names.join('、'))}</strong></div>`:`<div class="menu-summary"><span>今日菜單</span><button class="ghost" data-action="add-recipe-to-trip">加入料理</button></div>`;
}
function renderTrips(){const active=trip();if(active){const shopping=typeof shoppingProgressRows==='function'?shoppingProgressRows(active):(active.shopping||[]);return `<section class="page"><div class="row between"><p class="eyebrow">行程卡片 · ${active.code} · v${active.revision}</p><button class="ghost trip-list-link" data-action="show-trip-list">所有行程</button></div><h2 class="title">${esc(active.name)}</h2><p class="sub">${active.date}　${esc(active.location||'未填地點')}<br>${active.duration==='overnight'?'2 日 1 夜':'日歸'} · ${levelText[active.level]}</p>${menuSummary(active)}<div class="progress-block"><div class="row between"><span>打包</span><strong>${done(active.items)} / ${active.items.length}</strong></div><div class="progress"><span style="width:${pct(active.items)}%"></span></div><div class="row between"><span>採買</span><strong>${done(shopping)} / ${shopping.length}</strong></div><div class="progress"><span style="width:${pct(shopping)}%"></span></div></div><div class="actions"><button class="primary" data-page="lists">查看清單</button><button class="secondary" data-action="edit-trip">編輯</button><button class="secondary" data-action="export-trip">匯出卡片</button></div><div class="actions"><button class="ghost" data-action="archive-trip">結束並歸檔</button><button class="ghost" data-action="new-trip">新增行程</button></div></section>`;}const ts=state.trips;return `<section class="page"><div class="row between"><div><p class="eyebrow">我的露營</p><h2 class="title">行程</h2></div><button class="primary" data-action="new-trip">新增行程</button></div>${ts.length?ts.map(t=>tripRow(t)).join(''):`<div class="empty">建立一張行程卡片，<br>出發前可以確認物品清單是否齊全。</div>`}</section>`;}
function gearDialog(existing){const g=existing||{id:nextGearId('生活清潔'),name:'',category:'生活清潔',note:'',location:state.locations[0],size:'medium',levels:['L1','L2','L3','L4'],contexts:[],links:[]};const d=dialog(`<h2>${existing?'編輯裝備':'新增裝備'}</h2><form id="gear-form"><p class="system-id">系統編號：<strong id="auto-id">${esc(g.id)}</strong></p><div class="form-grid"><div class="field"><label>裝備類別</label><select name="category">${categories.map(c=>`<option ${g.category===c?'selected':''}>${c}</option>`).join('')}</select></div><div class="field"><label>體積</label><select name="size">${[['small','極小'],['medium','中型'],['large','大型']].map(([v,n])=>`<option value="${v}" ${g.size===v?'selected':''}>${n}</option>`).join('')}</select></div><div class="field full"><label>名稱</label><input name="name" required value="${esc(g.name)}" placeholder="例如：摺疊洗手盆"></div><div class="field full"><label>收納位置</label><input name="location" list="locations" value="${esc(g.location)}"><datalist id="locations">${state.locations.map(x=>`<option value="${esc(x)}">`).join('')}</datalist><span class="tiny">可直接輸入新位置，儲存後會加入選項。</span></div><div class="field full"><label>適用量級</label><div class="compact-options">${Object.entries(levelText).map(([v,n])=>`<label><input name="level" type="checkbox" value="${v}" ${g.levels.includes(v)?'checked':''}> ${n}</label>`).join('')}</div></div><div class="field full"><label>適用情境</label><div class="compact-options">${Object.entries(goalText).map(([v,n])=>`<label><input name="context" type="checkbox" value="${v}" ${g.contexts.includes(v)?'checked':''}> ${n}</label>`).join('')}</div></div><div class="field full"><label>備註／搭配需求</label><textarea name="note">${esc(g.note)}</textarea></div></div><div id="gear-eval" class="notice"></div><div class="actions"><button class="primary">儲存至我的裝備</button><button type="button" class="secondary" id="cancel">取消</button>${existing?'<button type="button" class="ghost danger" id="delete-gear">刪除</button>':''}</div></form>`);const f=$('#gear-form',d);const updateId=()=>{if(!existing)$('#auto-id',d).textContent=nextGearId(f.category.value);$('#gear-eval',d).innerHTML=gearAssessment(Object.fromEntries(new FormData(f)),f);};f.addEventListener('input',updateId);f.addEventListener('change',updateId);updateId();$('#cancel',d).onclick=closeDialog;$('#delete-gear',d)?.addEventListener('click',async()=>{if(confirm('刪除這件裝備？')){state.gear=state.gear.filter(x=>x.id!==existing.id);await store.save();closeDialog();render();}});f.onsubmit=async e=>{e.preventDefault();const data=new FormData(f),id=existing?existing.id:nextGearId(data.get('category'));const n={id,name:data.get('name'),category:data.get('category'),location:data.get('location').trim(),note:data.get('note'),size:data.get('size'),levels:data.getAll('level'),contexts:data.getAll('context'),links:[],owned:true};if(n.location&&!state.locations.includes(n.location))state.locations.push(n.location);if(existing)Object.assign(existing,n);else state.gear.push(n);await store.save();closeDialog();render();};}
function recipeDialog(){const usable=state.gear.filter(g=>['烹飪熱源','鍋具選項','餐具容器'].includes(g.category));const d=dialog(`<h2>新增料理</h2><form id="recipe-form"><div class="form-grid"><div class="field full"><label>料理名稱</label><input name="name" required placeholder="例如：奶油雞肉炊飯"></div><div class="field"><label>餐別</label><select name="meal"><option>早餐</option><option>午餐</option><option selected>晚餐</option><option>宵夜</option></select></div><div class="field"><label class="inline-label"><input type="checkbox" name="onsite"> 現場切配</label></div><div class="field full"><label>單人份食材／醬料</label><textarea name="ingredients" required placeholder="一行一項，例如：&#10;白米 1 杯&#10;雞腿肉 120g"></textarea></div><div class="field full"><label>需要的裝備</label><select name="gear" multiple size="7">${usable.map(g=>`<option value="${g.id}">${esc(g.name)}（${g.id}）</option>`).join('')}</select><span class="tiny">按 Ctrl／⌘ 可複選；不需在畫面中平鋪所有裝備。</span></div></div><div class="actions"><button class="primary">儲存料理</button><button class="secondary" type="button" id="cancel">取消</button></div></form>`);$('#cancel',d).onclick=closeDialog;$('#recipe-form',d).onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);state.recipes.push({id:`RCP${String(state.recipes.length+1).padStart(2,'0')}`,name:f.get('name'),meal:f.get('meal'),ingredients:f.get('ingredients').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),gear:f.getAll('gear'),onsite:f.get('onsite')==='on'});await store.save();closeDialog();render();};}
function renderGear(){return `<section class="page"><div class="row between"><div><p class="eyebrow">我的裝備</p><h2 class="title">裝備</h2></div><button class="primary" data-action="add-gear">新增裝備</button></div><div class="actions"><button class="secondary" data-action="add-recipe">新增料理</button><button class="secondary" data-action="manage-locations">收納位置</button><button class="ghost" data-action="import-file">匯入資料</button><button class="ghost" data-action="export-json">備份</button></div><input id="gear-search" placeholder="搜尋名稱或分類" aria-label="搜尋裝備"><p class="sub">${state.gear.length} 件已登記 · ${state.recipes.length} 道料理</p><div id="gear-list">${gearRows(state.gear)}</div></section>`}
function locationDialog(){const d=dialog(`<h2>收納位置</h2><p class="sub">可直接修改名稱或移除不再使用的位置。</p><form id="location-form"><div id="location-rows">${state.locations.map((x,i)=>`<div class="location-row"><input name="location-${i}" value="${esc(x)}"><button type="button" class="ghost danger" data-remove-location="${i}">移除</button></div>`).join('')}</div><div class="actions"><button class="secondary" type="button" id="add-location">新增位置</button><button class="primary">儲存</button><button class="ghost" type="button" id="cancel">取消</button></div></form>`);const f=$('#location-form',d);const refresh=()=>{$('#location-rows',d).innerHTML=$$('input',f).map((x,i)=>`<div class="location-row"><input name="location-${i}" value="${esc(x.value)}"><button type="button" class="ghost danger" data-remove-location="${i}">移除</button></div>`).join('');$$('[data-remove-location]',d).forEach(b=>b.onclick=()=>{b.parentElement.remove();});};$('#add-location',d).onclick=()=>{const wrap=document.createElement('div');wrap.className='location-row';wrap.innerHTML='<input placeholder="例如：玄關收納箱"><button type="button" class="ghost danger">移除</button>';wrap.querySelector('button').onclick=()=>wrap.remove();$('#location-rows',d).append(wrap);};$('#cancel',d).onclick=closeDialog;f.onsubmit=async e=>{e.preventDefault();state.locations=$$('input',$('#location-rows',d)).map(x=>x.value.trim()).filter(Boolean);await store.save();closeDialog();render();};}
function recipePicker(t){const groups=state.recipes.reduce((all,r)=>{(all[r.meal]??=[]).push(r);return all;},{});return `<details class="recipe-picker"><summary>選擇料理 <span id="recipe-count">已選 ${t.recipeIds.length} 道</span></summary><div class="recipe-groups">${['早餐','午餐','晚餐','宵夜'].filter(meal=>groups[meal]?.length).map(meal=>`<section><h3>${meal}</h3>${groups[meal].map(r=>`<label><input type="checkbox" name="recipe" value="${r.id}" ${t.recipeIds.includes(r.id)?'checked':''}> ${esc(r.name)}</label>`).join('')}</section>`).join('')}</div></details>`;}
function tripDialog(existing){const t=existing||createTrip();const d=dialog(`<h2>${existing?'編輯行程':'新增行程'}</h2><form id="trip-form"><div class="form-grid"><div class="field full"><label>行程名稱</label><input name="name" required value="${esc(t.name)}"></div><div class="field"><label>日期</label><input type="date" name="date" value="${t.date}"></div><div class="field"><label>地點</label><input name="location" value="${esc(t.location)}" placeholder="例如：苗栗營地"></div><div class="field"><label>行程</label><select name="duration"><option value="day" ${t.duration==='day'?'selected':''}>日歸</option><option value="overnight" ${t.duration==='overnight'?'selected':''}>2 日 1 夜</option></select></div><div class="field"><label>量級</label><select name="level">${Object.entries(levelText).map(([v,n])=>`<option value="${v}" ${t.level===v?'selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label>營地</label><select name="campType"><option value="grass" ${t.campType==='grass'?'selected':''}>草地</option><option value="pallet" ${t.campType==='pallet'?'selected':''}>棧板</option><option value="wild" ${t.campType==='wild'?'selected':''}>野營</option></select></div><div class="field"><label class="inline-label"><input type="checkbox" name="power" ${t.power?'checked':''}> 有插座</label></div><div class="field full"><label>這次想做什麼</label><div class="compact-options">${Object.entries(goalText).map(([v,n])=>`<label><input type="checkbox" name="goal" value="${v}" ${t.goals.includes(v)?'checked':''}> ${n}</label>`).join('')}</div></div><div class="field full"><label>這天的菜單</label>${recipePicker(t)}</div><div class="field full"><label class="inline-label"><input type="checkbox" name="prep" ${t.prep?'checked':''}> 在家先備料</label><span class="tiny">若料理仍需現場切配，砧板與菜刀會保留。</span></div></div><div class="actions"><button class="primary">${existing?'儲存變更':'建立行程卡片'}</button><button type="button" class="secondary" id="cancel">取消</button></div></form>`);$('#cancel',d).onclick=closeDialog;$$('input[name="recipe"]',d).forEach(x=>x.onchange=()=>{$('#recipe-count',d).textContent=`已選 ${$$('input[name="recipe"]:checked',d).length} 道`;});$('#trip-form',d).onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const vals={name:f.get('name'),date:f.get('date'),location:f.get('location'),duration:f.get('duration'),level:f.get('level'),campType:f.get('campType'),power:f.get('power')==='on',goals:f.getAll('goal'),prep:f.get('prep')==='on',recipeIds:f.getAll('recipe')};if(existing){Object.assign(existing,vals);recalc(existing);}else{const fresh=createTrip(vals);state.trips.unshift(fresh);state.activeTripId=fresh.id;}await store.save();closeDialog();state.page='trips';render();};}
function buildShopping(t){const items=[],removed=new Set(t.shoppingRemoved||[]);(t.recipeIds||[]).forEach(rid=>{const r=state.recipes.find(x=>x.id===rid)||t.recipeSnapshots?.[rid];if(!r)return;const meal=t.recipeMeals?.[r.id]||'',add=(item)=>{if(!removed.has(item.shoppingKey))items.push(item);};(r.ingredients||[]).forEach(name=>add({name,checked:false,recipeId:r.id,recipeName:r.name,meal,shoppingKey:`recipe:${r.id}:${name}`}));(t.extraShopping?.[r.id]||[]).forEach(extra=>add({name:extra.name,checked:!!extra.checked,recipeId:r.id,recipeName:r.name,meal,shoppingKey:`extra:${extra.id}`,extra:true}));});return items;}
function renderShop(items){if(!items.length)return `<div class="section-head"><h2>採買清單</h2><span>0/0</span></div><p class="sub">尚未選擇料理。</p>`;const groups=items.reduce((all,item,index)=>{const k=item.recipeId||'other';(all[k]??={id:item.recipeId||'',name:item.recipeName||'其他採買',meal:item.meal||'',items:[]}).items.push({...item,index});return all;},{});Object.values(groups).forEach(g=>g.meal=trip()?.recipeMeals?.[g.id]||'');const slotOptions=['','早餐','午餐','晚餐','宵夜'];return `<div class="section-head"><h2>採買清單</h2><span>${done(items)}/${items.length}</span></div>${Object.values(groups).map(g=>`<section class="shopping-recipe"><div class="shopping-recipe-title"><select class="recipe-slot" data-recipe-slot="${esc(g.id)}" aria-label="${esc(g.name)}的用餐時段">${slotOptions.map(slot=>`<option value="${slot}" ${g.meal===slot?'selected':''}>${slot||'未設定'}</option>`).join('')}</select><strong>${esc(g.name)}</strong><em>${done(g.items)}/${g.items.length}</em></div><div class="list">${g.items.map(i=>`<div class="item shopping-item ${i.checked?'checked':''}"><input type="checkbox" data-shop="${i.index}" ${i.checked?'checked':''}><span class="item-name">${esc(i.name)}</span><button type="button" class="shopping-remove" data-action="remove-shopping" data-index="${i.index}" data-shopping-key="${esc(i.shoppingKey||`recipe:${i.recipeId}:${i.name}`)}" aria-label="移除 ${esc(i.name)}">×</button></div>`).join('')}</div><button type="button" class="ghost add-extra-dish" data-action="add-extra-dish" data-recipe-id="${esc(g.id)}">額外加菜</button></section>`).join('')}`}
function gearRows(gs){return [...gs].sort((a,b)=>Number(!!b.favorite)-Number(!!a.favorite)||a.name.localeCompare(b.name,'zh-Hant')).map(g=>`<div class="gear-row"><button class="gear-open" data-action="edit-gear" data-id="${g.id}"><span><span class="item-name">${esc(g.name)}</span><span class="reason">${esc(g.category)} · ${esc(g.location||'未填收納位置')}</span></span></button><button type="button" class="favorite ${g.favorite?'is-favorite':''}" data-action="toggle-gear-favorite" data-id="${g.id}" aria-label="${g.favorite?'取消最愛':'標記最愛'} ${esc(g.name)}">${g.favorite?'★':'☆'}</button></div>`).join('')}
function recipePicker(t){const order=['早餐','午餐','晚餐','宵夜'];const groups=state.recipes.reduce((all,r)=>{(all[r.meal]??=[]).push(r);return all;},{});const active=order.find(m=>groups[m]?.some(r=>t.recipeIds.includes(r.id)))||'早餐';const rows=m=>(groups[m]||[]).sort((a,b)=>Number(!!b.favorite)-Number(!!a.favorite)||a.name.localeCompare(b.name,'zh-Hant')).map(r=>`<div class="recipe-row"><label><input type="checkbox" name="recipe" value="${r.id}" ${t.recipeIds.includes(r.id)?'checked':''}> <span>${esc(r.name)}</span></label><button type="button" class="favorite ${r.favorite?'is-favorite':''}" data-favorite-recipe="${r.id}">${r.favorite?'★':'☆'}</button></div>`).join('');return `<div class="recipe-picker"><div class="meal-tabs">${order.map(m=>`<button type="button" data-meal-tab="${m}" class="${m===active?'active':''}">${m}</button>`).join('')}<span id="recipe-count">已選 ${t.recipeIds.length} 道</span></div><div class="recipe-groups">${order.map(m=>`<section data-meal-panel="${m}" ${m===active?'':'hidden'}>${rows(m)}</section>`).join('')}</div></div>`;}
function tripDialog(existing){const t=existing||createTrip();const d=dialog(`<h2>${existing?'編輯行程':'新增行程'}</h2><form id="trip-form"><div class="form-grid"><div class="field full"><label>行程名稱</label><input name="name" required value="${esc(t.name)}"></div><div class="field"><label>日期</label><input type="date" name="date" value="${t.date}"></div><div class="field"><label>地點</label><input name="location" value="${esc(t.location)}"></div><div class="field"><label>行程</label><select name="duration"><option value="day" ${t.duration==='day'?'selected':''}>日歸</option><option value="overnight" ${t.duration==='overnight'?'selected':''}>2 日 1 夜</option></select></div><div class="field"><label>量級</label><select name="level">${Object.entries(levelText).map(([v,n])=>`<option value="${v}" ${t.level===v?'selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label>營地</label><select name="campType"><option value="grass" ${t.campType==='grass'?'selected':''}>草地</option><option value="pallet" ${t.campType==='pallet'?'selected':''}>棧板</option><option value="wild" ${t.campType==='wild'?'selected':''}>野營</option></select></div><div class="field"><label class="inline-label"><input type="checkbox" name="power" ${t.power?'checked':''}> 有插座</label></div><div class="field full"><label>這次想做什麼</label><div class="compact-options">${Object.entries(goalText).map(([v,n])=>`<label><input type="checkbox" name="goal" value="${v}" ${t.goals.includes(v)?'checked':''}> ${n}</label>`).join('')}</div></div><div class="field full"><label>這天的菜單</label>${recipePicker(t)}</div><div class="field full"><label class="inline-label"><input type="checkbox" name="prep" ${t.prep?'checked':''}> 在家先備料</label></div></div><div class="actions"><button class="primary">${existing?'儲存變更':'建立行程卡片'}</button><button type="button" class="secondary" id="cancel">取消</button></div></form>`);$('#cancel',d).onclick=closeDialog;$$('input[name="recipe"]',d).forEach(x=>x.onchange=()=>{$('#recipe-count',d).textContent=`已選 ${$$('input[name="recipe"]:checked',d).length} 道`;});$$('[data-meal-tab]',d).forEach(b=>b.onclick=()=>{$$('[data-meal-tab]',d).forEach(x=>x.classList.toggle('active',x===b));$$('[data-meal-panel]',d).forEach(x=>x.hidden=x.dataset.mealPanel!==b.dataset.mealTab);});$$('[data-favorite-recipe]',d).forEach(b=>b.onclick=async()=>{const r=state.recipes.find(x=>x.id===b.dataset.favoriteRecipe);r.favorite=!r.favorite;b.textContent=r.favorite?'★':'☆';b.classList.toggle('is-favorite',r.favorite);await store.save();});$('#trip-form',d).onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const vals={name:f.get('name'),date:f.get('date'),location:f.get('location'),duration:f.get('duration'),level:f.get('level'),campType:f.get('campType'),power:f.get('power')==='on',goals:f.getAll('goal'),prep:f.get('prep')==='on',recipeIds:f.getAll('recipe')};if(existing){Object.assign(existing,vals);recalc(existing);}else{const fresh=createTrip(vals);state.trips.unshift(fresh);state.activeTripId=fresh.id;}await store.save();closeDialog();state.page='trips';render();};}
function recipeCourse(recipe){const n=recipe.name;if(/咖啡|紅茶|綠茶|奶茶|薑茶|可可|濃湯|味噌湯|雞湯|蛋花湯|蘑菇湯/.test(n))return '點心／飲品';if(/吐司|三明治|沙拉|優格|燕麥|麥片|飯糰|玉米|地瓜|燒賣|燒餅|蛋餅|鬆餅/.test(n))return '輕食';if(/牛排|雞腿|鮭魚|香腸|玉子燒|荷包蛋|蒜香蝦|燒肉|烤|蒸蛋/.test(n))return '副食';return '主食';}
function recipePicker(t){const order=['早餐','午餐','晚餐','宵夜'];const groups=state.recipes.reduce((all,r)=>{(all[r.meal]??=[]).push(r);return all;},{});const active=order.find(m=>groups[m]?.some(r=>t.recipeIds.includes(r.id)))||'早餐';const row=r=>`<div class="recipe-row"><label><input type="checkbox" name="recipe" value="${r.id}" ${t.recipeIds.includes(r.id)?'checked':''}> <span>${esc(r.name)}</span></label><button type="button" class="favorite ${r.favorite?'is-favorite':''}" data-favorite-recipe="${r.id}" aria-label="${r.favorite?'取消最愛':'標記最愛'} ${esc(r.name)}">${r.favorite?'★':'☆'}</button></div>`;const panel=meal=>{const all=(groups[meal]||[]).sort((a,b)=>a.name.localeCompare(b.name,'zh-Hant'));const favorites=all.filter(r=>r.favorite);const ordinary=all.filter(r=>!r.favorite);const courses=['主食','副食','輕食','點心／飲品'];return `${favorites.length?`<div class="recipe-course favorites"><h3>★ 我的最愛</h3><div class="recipe-course-grid">${favorites.map(row).join('')}</div></div>`:''}${courses.map(course=>{const list=ordinary.filter(r=>recipeCourse(r)===course);return list.length?`<div class="recipe-course"><h3>${course}</h3><div class="recipe-course-grid">${list.map(row).join('')}</div></div>`:'';}).join('')}`;return `<div class="recipe-picker"><div class="meal-tabs">${order.map(m=>`<button type="button" data-meal-tab="${m}" class="${m===active?'active':''}">${m}</button>`).join('')}<span id="recipe-count">已選 ${t.recipeIds.length} 道</span></div><div class="recipe-groups">${order.map(m=>`<section data-meal-panel="${m}" ${m===active?'':'hidden'}>${panel(m)}</section>`).join('')}</div></div>`;}
}
function cardPurpose(t){const goals=Array.isArray(t?.goals)?t.goals:[];return goals.length?goals.map(x=>goalText[x]).filter(Boolean).slice(0,2).join('、'):'一般露營';}
exportCard = async function(t){try{const snapshot={format:'camp-card.v1',exportedAt:now(),trip:structuredClone(t),gear:t.items.map(i=>gearById(i.gearId)).filter(Boolean),recipes:t.recipeIds.map(id=>state.recipes.find(r=>r.id===id)).filter(Boolean)};const json=JSON.stringify(snapshot);const meta=JSON.stringify({format:'camp-card.v1',compression:'gzip',sha256:await digest(json),payload:base64(await gzip(json))});const png=await drawCard(t);const tagged=addPngChunk(new Uint8Array(await png.arrayBuffer()),'caMp',meta);const filename=`${t.date}_${safeFilePart(t.name)}_${safeFilePart(cardPurpose(t))}_${t.code}-v${t.revision}.png`;download(new Blob([tagged],{type:'image/png'}),filename);notify('已匯出行程卡片；要重新匯入請以原始 PNG 檔傳送。');}catch(e){console.error(e);notify(`匯出失敗：${e.message}`,'error');}};
chooseFile = function(){const input=$('#file-input');input.value='';input.onchange=async()=>{const f=input.files[0];if(!f)return;try{if(f.type==='image/png'||f.name.toLowerCase().endsWith('.png'))await importCard(f);else await importData(f);notify('匯入完成。');render();}catch(e){console.error(e);notify(`匯入失敗：${e.message}`,'error');}};input.click();};
function safeFilePart(text){return String(text||'未命名').replace(/[\\/:*?"<>|]/g,'').replace(/\s+/g,' ').trim().slice(0,32)||'未命名';}
async function exportCard(t){try{const snapshot={format:'camp-card.v1',exportedAt:now(),trip:structuredClone(t),gear:t.items.map(i=>gearById(i.gearId)).filter(Boolean),recipes:t.recipeIds.map(id=>state.recipes.find(r=>r.id===id)).filter(Boolean)};const json=JSON.stringify(snapshot);const meta=JSON.stringify({format:'camp-card.v1',compression:'gzip',sha256:await digest(json),payload:base64(await gzip(json))});const png=await drawCard(t);const tagged=addPngChunk(new Uint8Array(await png.arrayBuffer()),'caMp',meta);const filename=`${t.date}_${safeFilePart(t.name)}_${safeFilePart(cardPurpose(t))}_${t.code}-v${t.revision}.png`;download(new Blob([tagged],{type:'image/png'}),filename);alert('已匯出行程卡片。若要能重新匯入，請以「檔案／原始檔」傳送 PNG。');}catch(e){console.error(e);alert('匯出失敗：'+e.message);}}
function drawCard(t){return new Promise(resolve=>{const c=document.createElement('canvas'),w=1080,h=1500;c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fffefa';x.fillRect(0,0,w,h);x.fillStyle='#1f4937';x.fillRect(0,0,w,24);x.font='700 34px sans-serif';x.fillText('露營助手  /  行程卡片',64,105);x.font='25px sans-serif';x.fillStyle='#2f624a';x.fillText(`${t.code} · v${t.revision}`,64,147);x.fillStyle='#18352a';x.font='700 60px sans-serif';wrap(x,t.name,64,260,950,70);x.font='30px sans-serif';x.fillText(`日期：${t.date}　地點：${t.location||'未填地點'}`,64,390);x.fillText(`${t.duration==='overnight'?'2 日 1 夜':'日歸'}　·　${levelText[t.level]}`,64,435);x.fillStyle='#2f624a';x.font='700 30px sans-serif';x.fillText(`主要目的：${cardPurpose(t)}`,64,485);x.strokeStyle='#dbe1d9';x.lineWidth=2;x.beginPath();x.moveTo(64,520);x.lineTo(1016,520);x.stroke();x.fillStyle='#18352a';x.font='700 28px sans-serif';x.fillText('這天的菜單',64,575);x.font='26px sans-serif';wrap(x,t.recipeIds.map(id=>state.recipes.find(r=>r.id===id)?.name).filter(Boolean).join('、')||'尚未選擇',64,620,930,40);x.font='700 28px sans-serif';x.fillText(`打包清單　${done(t.items)} / ${t.items.length}`,64,735);x.font='23px sans-serif';let y=778;for(const i of t.items.slice(0,17)){x.fillText(`${i.checked?'☑':'☐'}  ${i.name}`,76,y);y+=35;}if(t.items.length>17)x.fillText(`… 另有 ${t.items.length-17} 項`,76,y);x.font='700 28px sans-serif';x.fillText(`採買清單　${done(t.shopping)} / ${t.shopping.length}`,590,735);x.font='23px sans-serif';y=778;for(const i of t.shopping.slice(0,17)){x.fillText(`${i.checked?'☑':'☐'}  ${i.name}`,600,y);y+=35;}x.fillStyle='#68746d';x.font='20px sans-serif';x.fillText('原始 PNG 含可還原的行程資料；請以檔案模式傳送。',64,1415);c.toBlob(resolve,'image/png');});}
function renderGear(){const visible=gearCategoryFilter==='favorite'?state.gear.filter(g=>g.favorite):gearCategoryFilter==='all'?state.gear:state.gear.filter(g=>g.category===gearCategoryFilter);return `<section class="page"><div class="row between"><div><p class="eyebrow">我的裝備</p><h2 class="title">裝備</h2></div><button class="primary" data-action="add-gear">新增裝備</button></div><div class="actions"><button class="secondary" data-action="add-recipe">新增料理</button><button class="secondary" data-action="manage-locations">收納位置</button><button class="ghost" data-action="import-file">匯入資料</button><button class="ghost" data-action="export-json">備份</button></div><div class="gear-filter"><label for="gear-category-filter">顯示分類</label><select id="gear-category-filter"><option value="all" ${gearCategoryFilter==='all'?'selected':''}>全部裝備</option><option value="favorite" ${gearCategoryFilter==='favorite'?'selected':''}>★ 我的最愛</option>${categories.map(c=>`<option value="${c}" ${gearCategoryFilter===c?'selected':''}>${c}</option>`).join('')}</select></div><p class="sub">${visible.length} / ${state.gear.length} 件裝備 · ${state.recipes.length} 道料理</p><div id="gear-list">${gearRows(visible)}</div></section>`}

/* Small presentation refinements loaded after the core side-panel app. */
const originalTripDialog = tripDialog;
const originalCreateTrip = createTrip;
const originalRender = render;
const originalAction = action;
const originalDialog = dialog;
const originalBuildTripItems = buildTripItems;
// Always open the side panel on the active 行程 tab.  The overview remains a
// deliberate destination through「所有行程」instead of a restored page state.
let homeOpened = true;

function dateCode(date) {
  return String(date || '').replace(/[^0-9]/g, '').slice(0, 8) || '00000000';
}

function nextDate(date) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + 1);
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

function nextTripCode(date, excludeId) {
  const prefix = `C-${dateCode(date)}-`;
  const used = (state?.trips || [])
    .filter(trip => trip.id !== excludeId && String(trip.code || '').startsWith(prefix))
    .map(trip => Number(String(trip.code).slice(prefix.length)))
    .filter(Number.isFinite);
  return `${prefix}${String((used.length ? Math.max(...used) : 0) + 1).padStart(2, '0')}`;
}

createTrip = function (data = {}) {
  const trip = originalCreateTrip(data);
  trip.code = nextTripCode(trip.date);
  trip.endDate = data.duration === 'overnight' ? nextDate(trip.date) : (data.endDate || '');
  trip.siteAmenities = data.siteAmenities || [];
  return trip;
};

buildTripItems = function (trip) {
  const needsOvernightKit = ['overnight', 'multi-day'].includes(trip.duration);
  return originalBuildTripItems({ ...trip, duration: needsOvernightKit ? 'overnight' : trip.duration });
};

function durationName(trip) {
  return ({ day: '日歸', overnight: '2 日 1 夜', 'multi-day': '多日露營' })[trip.duration] || '日歸';
}

function dateRange(trip) {
  if (trip.duration === 'overnight') return `${trip.date} ～ ${trip.endDate || nextDate(trip.date)}`;
  return trip.duration === 'multi-day' && trip.endDate ? `${trip.date} ～ ${trip.endDate}` : trip.date;
}

function renderRecipePicker(trip) {
  const meals = ['早餐', '午餐', '晚餐', '宵夜'];
  const selected = new Set(trip?.recipeIds || []);
  const grouped = (state.recipes || []).reduce((all, recipe) => {
    const meal = recipe.meal || '晚餐';
    (all[meal] ||= []).push(recipe);
    return all;
  }, {});
  const active = meals.find(meal => (grouped[meal] || []).some(recipe => selected.has(recipe.id))) || '早餐';
  const row = recipe => `<div class="recipe-row"><label><input type="checkbox" name="recipe" value="${esc(recipe.id)}" ${selected.has(recipe.id) ? 'checked' : ''}><span>${esc(recipe.name)}</span></label><button type="button" class="favorite ${recipe.favorite ? 'is-favorite' : ''}" data-favorite-recipe="${esc(recipe.id)}" aria-label="標記最愛 ${esc(recipe.name)}">${recipe.favorite ? '★' : '☆'}</button></div>`;
  const section = meal => {
    const recipes = [...(grouped[meal] || [])].sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || a.name.localeCompare(b.name, 'zh-Hant'));
    return recipes.length ? recipes.map(row).join('') : '<p class="tiny">尚無可選料理</p>';
  };
  return `<div class="recipe-picker"><div class="meal-tabs">${meals.map(meal => `<button type="button" data-meal-tab="${meal}" class="${meal === active ? 'active' : ''}">${meal}</button>`).join('')}</div><div class="recipe-groups">${meals.map(meal => `<section data-meal-panel="${meal}" ${meal === active ? '' : 'hidden'}>${section(meal)}</section>`).join('')}</div></div>`;
}

// The original file accumulated several declarations while iterating on the UI.
// Make this one renderer the sole runtime source of the menu UI.
recipePicker = renderRecipePicker;

function decorateTripDates() {
  document.querySelectorAll('button.card[data-action="open-trip"]').forEach(card => {
    const current = state.trips.find(trip => trip.id === card.dataset.id);
    const meta = card.querySelector('.meta');
    if (current && meta) meta.textContent = `${dateRange(current)}　·　${current.location || '未填地點'}　·　${durationName(current)} · ${levelText[current.level]}`;
  });
  if (!['trips', 'lists'].includes(state.page)) return;
  const active = trip();
  if (!active) return;
  // The list page has several `.sub` elements (including the water-plan
  // explanation). Trip metadata belongs only in the dedicated header node.
  const context = document.querySelector('.trip-context');
  if (context) context.innerHTML = `${dateRange(active)}　${esc(active.location || '未填地點')}<br>${durationName(active)} · ${levelText[active.level]}　｜　目的：${esc(cardPurpose(active))}`;
}

function normalizeTripCodes() {
  const groups = new Map();
  (state?.trips || []).forEach(trip => {
    if (trip.duration === 'night-rush') trip.duration = 'overnight';
    const key = dateCode(trip.date);
    groups.set(key, [...(groups.get(key) || []), trip]);
  });
  let changed = false;
  groups.forEach((trips, day) => {
    trips.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
    trips.forEach((trip, index) => {
      const code = `C-${day}-${String(index + 1).padStart(2, '0')}`;
      if (trip.code !== code) { trip.code = code; changed = true; }
    });
  });
  // Rendering may normalize legacy display fields, but must never create a
  // background sync operation that can overwrite a real user action.
}

function promoteTripActions() {
  document.querySelectorAll('[data-action="new-trip"], [data-action="show-trip-list"]').forEach(button => {
    button.classList.remove('ghost', 'secondary', 'trip-list-link');
    button.classList.add('primary');
  });
}

function refineTripCardActions() {
  const cardPage = document.querySelector('.page:has([data-action="edit-trip"])');
  if (!cardPage) return;

  cardPage.querySelector('[data-action="new-trip"]')?.remove();
  const archive = cardPage.querySelector('[data-action="archive-trip"]');
  if (!archive || cardPage.querySelector('[data-action="delete-trip"]')) return;

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'ghost danger';
  remove.dataset.action = 'delete-trip';
  remove.textContent = state.pendingDeleteTripId === state.activeTripId ? '再按一次刪除' : '刪除行程';
  remove.onclick = () => action('delete-trip');
  archive.parentElement.append(remove);
}

function discardTrip(current) {
  state.discardedTrips ??= [];
  const changedAt = now();
  const cancelled = { ...structuredClone(current), status: 'cancelled', statusUpdatedAt: changedAt, updatedAt: changedAt };
  // Keep the original trip ID as the cancellation record ID. The sync layer
  // can then compare active/cancelled/purged states for exactly one trip.
  state.discardedTrips.unshift({ id: current.id, tripId: current.id, trip: cancelled, status: 'cancelled', statusUpdatedAt: changedAt, deletedAt: changedAt });
  state.discardedTrips = state.discardedTrips.slice(0, 10);
  state.trips = state.trips.filter(item => item.id !== current.id);
  state.activeTripId = null;
  state.pendingDeleteTripId = null;
}

function refineHomeRows() {
  const page = document.querySelector('.page');
  if (!page) return;
  const heading = page.querySelector('.row.between');
  if (heading && (state.discardedTrips || []).length && !heading.querySelector('[data-action="show-cancelled-trips"]')) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'secondary';
    button.dataset.action = 'show-cancelled-trips';
    button.textContent = `取消的行程 (${(state.discardedTrips || []).length})`;
    button.onclick = () => action('show-cancelled-trips');
    const newTrip = heading.querySelector('[data-action="new-trip"]');
    const actions = document.createElement('div');
    actions.className = 'home-header-actions';
    newTrip.before(actions); actions.append(button, newTrip);
  }
  page.querySelectorAll('button.card[data-action="open-trip"]').forEach(card => {
    if (card.parentElement.classList.contains('home-trip-row')) return;
    const row = document.createElement('div'); row.className = 'home-trip-row';
    card.before(row); row.append(card); card.style.width = 'auto';
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'ghost danger';
    remove.dataset.action = 'trash-trip'; remove.dataset.id = card.dataset.id;
    remove.textContent = '×';
    remove.setAttribute('aria-label', '取消行程');
    remove.title = '取消行程';
    remove.onclick = () => action('trash-trip', { id: card.dataset.id });
    row.append(remove);
    const progress = card.querySelector('.progress');
    if (progress && !card.querySelector('.home-progress-label')) {
      progress.insertAdjacentHTML('beforebegin', `<p class="home-progress-label">裝備清單 · 已打包 ${done(state.trips.find(entry => entry.id === card.dataset.id)?.items || [])} / ${(state.trips.find(entry => entry.id === card.dataset.id)?.items || []).length}</p>`);
    }
  });
}

function renderCancelledTrips() {
  const entries = state.discardedTrips || [];
  const page = `<section class="page"><div class="page-heading cancelled-page-heading"><div><h2 class="title">取消的行程</h2></div></div>${entries.length ? entries.map(entry => `<div class="cancelled-trip"><h3>${esc(entry.trip.name)}</h3><p class="meta">${entry.trip.date}　${esc(entry.trip.location || '未填地點')}<br>取消於 ${new Date(entry.deletedAt).toLocaleDateString('zh-TW')}</p><div class="actions"><button class="ghost" data-action="restore-trip" data-id="${entry.id}">復原行程</button><button class="ghost danger" data-action="purge-trip" data-id="${entry.id}">${state.pendingPurgeId === entry.id ? '再按一次永久清空' : '永久清空'}</button></div></div>`).join('') : '<p class="sub">目前沒有取消的行程。</p>'}</section>`;
  document.querySelector('#app').innerHTML = header() + page + nav();
  bind();
  const home = document.querySelector('.nav button[data-page="trips"]');
  if (home) { home.dataset.page = 'home'; home.textContent = '行程'; }
}

render = function () {
  // Navigation is a transient UI choice. Every fresh launch uses the current
  // "我的行程" overview (the tent layout), never an old restored sub-page.
  if (!window.__campInitialViewSet) {
    state.page = 'home';
    window.__campInitialViewSet = true;
  }
  /* v8: normalization belongs to migration, not rendering. */
  state.discardedTrips ??= [];
  // The checklist is a view of a trip.  If the previously selected trip is no
  // longer available, restore the most recently opened active trip instead of
  // showing an empty-state call to action while usable lists already exist.
  if (!homeOpened && state.page === 'trips') {
    state.page = 'home';
    homeOpened = true;
  }

  if (state.page === 'cancelled') return renderCancelledTrips();
  if (state.page === 'archived-log') return archivedTripPage();
  if (state.page !== 'home') {
    const result = originalRender();
    promoteTripActions();
    refineTripCardActions();
    decorateTripDates();
    return result;
  }

  const selectedTrip = state.activeTripId;
  state.page = 'trips';
  state.activeTripId = null;
  originalRender();
  state.page = 'home';
  state.activeTripId = selectedTrip;

  const app = document.querySelector('#app');
  const overview = app?.querySelector('.page');
  const eyebrow = overview?.querySelector('.eyebrow');
  const title = overview?.querySelector('.title');
  eyebrow?.remove();
  if (title) title.textContent = '我的行程';

  // Home is rendered from the trip-list template, but the compact navigation
  // already names that destination "home".  Update either form before binding.
  const homeButton = app?.querySelector('.nav button[data-page="home"], .nav button[data-page="trips"]');
  if (homeButton) {
    homeButton.dataset.page = 'home';
    homeButton.textContent = '行程';
    app.querySelectorAll('.nav button').forEach(button => button.classList.remove('active'));
    homeButton.classList.add('active');
  }
  promoteTripActions();
  refineHomeRows();
  decorateTripDates();
};

action = async function (name, data = {}) {
  if (name === 'open-trip') {
    const opened = state.trips.find(candidate => candidate.id === data.id);
    if (opened) opened.lastOpenedAt = now();
    return originalAction(name, data);
  }
  if (name === 'show-trip-list') {
    state.page = 'home';
    return render();
  }
  if (name === 'delete-trip') {
    const current = trip();
    if (!current) return;
    discardTrip(current);
    state.page = 'home';
    await store.save();
    return render();
  }
  if (name === 'trash-trip') {
    const current = state.trips.find(item => item.id === data.id);
    if (!current) return;
    discardTrip(current); state.page = 'home'; await store.save(); return render();
  }
  if (name === 'show-cancelled-trips') { state.page = 'cancelled'; return render(); }
  if (name === 'back-home') { state.page = 'home'; state.pendingPurgeId = null; return render(); }
  if (name === 'restore-trip') {
    const entry = (state.discardedTrips || []).find(item => item.id === data.id);
    if (!entry) return;
    const changedAt = now();
    state.trips.unshift({ ...entry.trip, status: 'active', statusUpdatedAt: changedAt, updatedAt: changedAt });
    state.discardedTrips = state.discardedTrips.filter(item => item.id !== entry.id);
    state.pendingPurgeId = null; state.page = 'home'; await store.save(); return render();
  }
  if (name === 'purge-trip') {
    if (state.pendingPurgeId !== data.id) { state.pendingPurgeId = data.id; return render(); }
    const entry = (state.discardedTrips || []).find(item => item.id === data.id);
    const changedAt = now();
    state.tripTombstones ??= [];
    state.tripTombstones = state.tripTombstones.filter(item => (item.tripId || item.id) !== (entry?.tripId || entry?.trip?.id || data.id));
    state.tripTombstones.push({ tripId: entry?.tripId || entry?.trip?.id || data.id, status: 'purged', statusUpdatedAt: changedAt, purgedAt: changedAt });
    state.discardedTrips = (state.discardedTrips || []).filter(item => item.id !== data.id);
    state.pendingPurgeId = null; await store.save(); return render();
  }
  state.pendingDeleteTripId = null;
  return originalAction(name, data);
};

dialog = function (html) {
  const dialogRoot = originalDialog(html);
  const box = dialogRoot.querySelector('.dialog-box');
  const topbar = document.createElement('div');
  topbar.className = 'dialog-topbar';
  topbar.innerHTML = '<button type="button" class="ghost" aria-label="返回" data-dialog-close>返回</button>';
  topbar.querySelector('[data-dialog-close]').onclick = closeDialog;
  box.prepend(topbar);

  const footer = box.querySelector('form > .actions:last-child');
  if (footer) {
    footer.classList.add('dialog-footer');
  } else {
    const cancel = document.createElement('div');
    cancel.className = 'actions dialog-footer';
    cancel.innerHTML = '<button type="button" class="secondary" data-dialog-close>取消</button>';
    cancel.querySelector('[data-dialog-close]').onclick = closeDialog;
    box.append(cancel);
  }
  return dialogRoot;
};

tripDialog = function (existing) {
  originalTripDialog(existing);

  const dialogRoot = document.querySelector('.dialog:last-of-type');
  const tripForm = dialogRoot?.querySelector('#trip-form');
  const duration = dialogRoot?.querySelector('select[name="duration"]');
  const dateInput = dialogRoot?.querySelector('input[name="date"]');
  const dateField = dateInput?.closest('.field');
  if (tripForm && duration && dateField && !duration.querySelector('option[value="multi-day"]')) {
    duration.insertAdjacentHTML('beforeend', '<option value="multi-day">多日露營</option>');
    duration.value = existing?.duration === 'night-rush' ? 'overnight' : (existing?.duration || duration.value);
    const endField = document.createElement('div');
    endField.className = 'field';
    endField.innerHTML = `<label>結束日期</label><input type="date" name="endDate" value="${esc(existing?.endDate || '')}">`;
    dateField.after(endField);
    const endInput = endField.querySelector('input');
    const toggleEndDate = () => {
      const multiDay = duration.value === 'multi-day';
      const overnight = duration.value === 'overnight';
      endField.hidden = !(multiDay || overnight);
      endInput.required = multiDay;
      endInput.disabled = overnight;
      endInput.min = dateInput.value;
      if (overnight) endInput.value = nextDate(dateInput.value);
      else if (multiDay && !endInput.value) endInput.value = dateInput.value;
    };
    duration.onchange = toggleEndDate;
    dateInput.onchange = toggleEndDate;
    toggleEndDate();

    tripForm.onsubmit = async event => {
      event.preventDefault();
      const data = new FormData(tripForm);
      const selectedDuration = data.get('duration');
      const siteAmenities = data.getAll('amenity');
      const values = { name:data.get('name'), date:data.get('date'), endDate:selectedDuration === 'overnight' ? nextDate(data.get('date')) : (data.get('endDate') || ''), location:data.get('location'), duration:selectedDuration, level:data.get('level'), campType:data.get('campType'), power:siteAmenities.includes('power'), siteAmenities, goals:data.getAll('goal'), prep:data.get('prep') === 'on', recipeIds:data.getAll('recipe') };
      if (existing) { Object.assign(existing, values); recalc(existing); }
      else { const fresh = createTrip(values); state.trips.unshift(fresh); state.activeTripId = fresh.id; }
      await store.save(); closeDialog(); state.page = 'trips'; render();
    };
  }

  const environment = dialogRoot?.querySelector('select[name="campType"]');
  if (!environment) return;

  const selected = environment.value;
  const choices = [
    ['grass', '草地營位'],
    ['pallet', '棧板營位'],
    ['forest', '林地'],
    ['riverside', '溪邊／河畔'],
    ['beach', '海邊'],
    ['mountain', '山區'],
    ['campground', '一般營區'],
    ['wild', '野營地']
  ];

  environment.innerHTML = choices
    .map(([value, label]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${label}</option>`)
    .join('');

  const environmentField = environment.closest('.field');
  const powerField = dialogRoot.querySelector('input[name="power"]')?.closest('.field');
  if (!environmentField || !powerField) return;

  const environmentTitle = environmentField.querySelector(':scope > label');
  if (!environmentTitle) return;

  environmentTitle.textContent = '營地環境';
  const labelRow = document.createElement('div');
  labelRow.className = 'environment-label-row';
  labelRow.append(environmentTitle);
  environmentField.prepend(labelRow);
  powerField.remove();

  if (!dialogRoot.querySelector('[data-amenities]')) {
    const amenities = [
      ['shower', '淋浴間'], ['toilet', '廁所'], ['drinking-water', '飲用水'], ['power', '電源插座'],
      ['shared-freezer', '共用冰櫃'], ['shared-tables', '公用桌椅'], ['washing-station', '洗滌台'], ['trash', '垃圾集中處'],
      ['parking', '停車位'], ['signal', '網路／訊號'], ['fire-zone', '營火區'], ['shop', '販售部']
    ];
    const selected = new Set(existing?.siteAmenities || []);
    const amenityField = document.createElement('div');
    amenityField.className = 'field full'; amenityField.dataset.amenities = 'true';
    amenityField.innerHTML = `<label>現場設施</label><div class="compact-options">${amenities.map(([value, label]) => `<label><input type="checkbox" name="amenity" value="${value}" ${selected.has(value) ? 'checked' : ''}> ${label}</label>`).join('')}</div>`;
    environmentField.after(amenityField);
  }

  const locationInput = dialogRoot.querySelector('input[name="location"]');
  const locationField = locationInput?.closest('.field');
  if (locationInput && locationField && !locationField.querySelector('[data-map-search]')) {
    const locationSearch = document.createElement('div');
    locationSearch.className = 'location-search';
    locationInput.before(locationSearch);
    locationSearch.append(locationInput);
    const mapButton = document.createElement('button');
    mapButton.type = 'button';
    mapButton.className = 'secondary';
    mapButton.dataset.mapSearch = 'true';
    mapButton.textContent = 'Google 地圖';
    mapButton.onclick = () => {
      const query = locationInput.value.trim();
      if (!query) { locationInput.focus(); return; }
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener');
    };
    locationSearch.append(mapButton);
  }


  dialogRoot.addEventListener('click', async (event) => {
    const favoriteButton = event.target.closest('[data-favorite-recipe]');
    if (favoriteButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const recipe = state.recipes.find(item => item.id === favoriteButton.dataset.favoriteRecipe);
      if (!recipe) return;
      recipe.favorite = !recipe.favorite;
      await store.save();

      const recipeField = dialogRoot.querySelector('input[name="recipe"]')?.closest('.field.full');
      const picker = recipeField?.querySelector('.recipe-picker');
      if (!picker) return;
      const selectedIds = [...dialogRoot.querySelectorAll('input[name="recipe"]:checked')].map(input => input.value);
      picker.outerHTML = recipePicker({ recipeIds: selectedIds });
      return;
    }

    const mealTab = event.target.closest('[data-meal-tab]');
    if (!mealTab) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const meal = mealTab.dataset.mealTab;
    dialogRoot.querySelectorAll('[data-meal-tab]').forEach(button => button.classList.toggle('active', button === mealTab));
    dialogRoot.querySelectorAll('[data-meal-panel]').forEach(panel => { panel.hidden = panel.dataset.mealPanel !== meal; });
  }, true);
};

// Authoritative trip editor. This replaces the duplicated legacy dialog declarations.
function openTripEditor(existing) {
  const t = existing || { name:'未命名露營', date:new Date().toISOString().slice(0, 10), endDate:'', location:'', duration:'day', level:'L1', campType:'grass', goals:[], prep:false, recipeIds:[], siteAmenities:[] };
  const environment = [['grass','草地營位'],['pallet','棧板營位'],['forest','林地'],['riverside','溪邊／河畔'],['beach','海邊'],['mountain','山區'],['campground','一般營區'],['wild','野營地']];
  const amenities = [['shower','淋浴間'],['toilet','廁所'],['drinking-water','飲用水'],['power','電源插座'],['shared-freezer','共用冰櫃'],['shared-tables','公用桌椅'],['washing-station','洗滌台'],['trash','垃圾集中處'],['parking','停車位'],['signal','網路／訊號'],['fire-zone','營火區'],['shop','販售部']];
  const selectedAmenities = new Set(t.siteAmenities || []);
  const d = dialog(`<h2>${existing ? '編輯行程' : '新增行程'}</h2><form id="trip-form"><div class="form-grid"><div class="field full"><label>行程名稱</label><input name="name" required value="${esc(t.name)}"></div><div class="field"><label>日期</label><input type="date" name="date" value="${t.date}"></div><div class="field" id="end-date-field"><label>結束日期</label><input type="date" name="endDate" value="${esc(t.endDate || '')}"></div><div class="field"><label>地點</label><div class="location-search"><input name="location" value="${esc(t.location)}"><button type="button" class="secondary" data-map-search>Google 地圖</button></div></div><div class="field"><label>行程</label><select name="duration"><option value="day" ${t.duration==='day'?'selected':''}>日歸</option><option value="overnight" ${t.duration==='overnight'?'selected':''}>2 日 1 夜</option><option value="multi-day" ${t.duration==='multi-day'?'selected':''}>多日露營</option></select></div><div class="field"><label>量級</label><select name="level">${Object.entries(levelText).map(([value,label])=>`<option value="${value}" ${t.level===value?'selected':''}>${label}</option>`).join('')}</select></div><div class="field"><label>營地環境</label><select name="campType">${environment.map(([value,label])=>`<option value="${value}" ${t.campType===value?'selected':''}>${label}</option>`).join('')}</select></div><div class="field full"><label>現場設施</label><div class="compact-options">${amenities.map(([value,label])=>`<label><input type="checkbox" name="amenity" value="${value}" ${selectedAmenities.has(value)?'checked':''}> ${label}</label>`).join('')}</div></div><div class="field full"><label>這次想做什麼</label><div class="compact-options">${Object.entries(goalText).map(([value,label])=>`<label><input type="checkbox" name="goal" value="${value}" ${(t.goals||[]).includes(value)?'checked':''}> ${label}</label>`).join('')}</div></div><div class="field full"><label>這天的菜單</label>${recipePicker(t)}</div><div class="field full"><label class="inline-label"><input type="checkbox" name="prep" ${t.prep?'checked':''}> 在家先備料</label></div></div><div class="actions"><button class="primary">${existing?'儲存變更':'建立行程卡片'}</button><button type="button" class="secondary" id="cancel">取消</button></div></form>`);
  const form = $('#trip-form', d), duration = $('select[name="duration"]', d), date = $('input[name="date"]', d), endField = $('#end-date-field', d), endDate = $('input[name="endDate"]', d);
  const updateDates = () => { const overnight = duration.value === 'overnight', multi = duration.value === 'multi-day'; endField.hidden = !(overnight || multi); endDate.disabled = overnight; endDate.required = multi; endDate.min = date.value; if (overnight) endDate.value = nextDate(date.value); if (multi && !endDate.value) endDate.value = date.value; };
  updateDates(); duration.onchange = updateDates; date.onchange = updateDates;
  $('#cancel', d).onclick = closeDialog;
  $('[data-map-search]', d).onclick = () => { const query = $('input[name="location"]', d).value.trim(); if (query) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener'); else $('input[name="location"]', d).focus(); };
  d.addEventListener('click', async event => { const tab=event.target.closest('[data-meal-tab]'), favorite=event.target.closest('[data-favorite-recipe]'); if(tab){$$('[data-meal-tab]',d).forEach(x=>x.classList.toggle('active',x===tab));$$('[data-meal-panel]',d).forEach(x=>x.hidden=x.dataset.mealPanel!==tab.dataset.mealTab);return;} if(favorite){const recipe=state.recipes.find(x=>x.id===favorite.dataset.favoriteRecipe);recipe.favorite=!recipe.favorite;await store.save();const selected=$$('input[name="recipe"]:checked',d).map(x=>x.value);const picker=$('.recipe-picker',d);picker.outerHTML=recipePicker({recipeIds:selected});} });
  form.onsubmit = async event => { event.preventDefault(); const data = new FormData(form), kind=data.get('duration'), siteAmenities=data.getAll('amenity'); const values={name:data.get('name'),date:data.get('date'),endDate:kind==='overnight'?nextDate(data.get('date')):(data.get('endDate')||''),location:data.get('location'),duration:kind,level:data.get('level'),campType:data.get('campType'),power:siteAmenities.includes('power'),siteAmenities,goals:data.getAll('goal'),prep:data.get('prep')==='on',recipeIds:data.getAll('recipe')}; if(existing){Object.assign(existing,values);recalc(existing);}else{const fresh=createTrip(values);state.trips.unshift(fresh);state.activeTripId=fresh.id;}await store.save();closeDialog();state.page='trips';render(); };
}

tripDialog = openTripEditor;

/*
 * Authoritative trip planning layer.
 * The earlier prototype accumulated several UI-only patches.  This layer owns
 * the trip editor and the packing rules so a selected condition always has a
 * traceable effect on the result.
 */
(() => {
  const coreCreateTrip = createTrip;
  const coreRender = render;

  const environmentOptions = [
    ['grass', '草地營位'], ['pallet', '棧板營位'], ['forest', '林地'],
    ['riverside', '溪邊'], ['beach', '海邊'], ['mountain', '山區'],
    ['campground', '一般營區'], ['wild', '野外營地']
  ];
  const amenityOptions = [
    ['shower', '淋浴間'], ['toilet', '廁所'], ['drinking-water', '飲用水'],
    ['power', '電源插座'], ['shared-freezer', '共用冰櫃'], ['shared-tables', '公用桌椅'],
    ['washing-station', '洗滌台'], ['trash', '垃圾集中處'], ['parking', '停車位'],
    ['signal', '網路／訊號'], ['fire-zone', '營火區'], ['shop', '販售部']
  ];
  const courseOrder = ['主食', '副食', '輕食', '點心／飲品'];
  const mealOrder = ['全部', '早餐', '午餐', '晚餐', '宵夜', '不限'];

  function isOvernight(tripData) {
    return ['overnight', 'multi-day'].includes(tripData.duration);
  }

  function tripDurationName(tripData) {
    if (tripData.duration === 'overnight') return '2 日 1 夜';
    if (tripData.duration === 'multi-day') return '多日露營';
    return '日歸';
  }

  function tripDateRange(tripData) {
    if (tripData.duration === 'day') return tripData.date;
    const endDate = tripData.endDate || nextDate(tripData.date);
    const shortEndDate = endDate.slice(0, 4) === tripData.date.slice(0, 4) ? endDate.slice(5) : endDate;
    return `${tripData.date} ～ ${shortEndDate}`;
  }

  function recipeCourse(recipe) {
    const name = recipe.name;
    if (/咖啡|紅茶|綠茶|奶茶|薑茶|可可|濃湯|味噌湯|雞湯|蛋花湯|蘑菇湯/.test(name)) return '點心／飲品';
    if (/吐司|三明治|沙拉|優格|燕麥|麥片|飯糰|玉米|地瓜|燒賣|燒餅|蛋餅|鬆餅/.test(name)) return '輕食';
    if (/牛排|雞腿|鮭魚|香腸|玉子燒|荷包蛋|蒜香蝦|燒肉|炭烤|蒸蛋/.test(name)) return '副食';
    return '主食';
  }

  function plannerRecipePicker(tripData) {
    const selected = new Set(tripData.recipeIds || []);
    const typeOrder = ['all', ...recipeTypeOptions.map(([value]) => value)];
    const active = '全部';
    const row = recipe => `<div class="recipe-row"><label><input type="checkbox" name="recipe" value="${esc(recipe.id)}" ${selected.has(recipe.id) ? 'checked' : ''}><span>${esc(recipe.name)}</span></label><button type="button" class="favorite ${recipe.favorite ? 'is-favorite' : ''}" data-favorite-recipe="${esc(recipe.id)}" aria-label="${recipe.favorite ? '取消最愛' : '標記最愛'} ${esc(recipe.name)}">${recipe.favorite ? '★' : '☆'}</button></div>`;
    const panel = type => {
      const source = type === 'all' ? (state.recipes || []) : (state.recipes || []).filter(recipe => recipeTypeOf(recipe) === type);
      const all = [...source].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
      const favorites = all.filter(recipe => recipe.favorite);
      const normal = all.filter(recipe => !recipe.favorite);
      const group = (title, recipes, favorite = false) => recipes.length ? `<section class="recipe-course ${favorite ? 'favorites' : ''}"><h3>${title}</h3><div class="recipe-course-grid">${recipes.map(row).join('')}</div></section>` : '';
      return group('★ 我的最愛', favorites, true) + recipeEffortOptions.map(([value, label]) => group(label, normal.filter(recipe => recipeEffortOf(recipe) === value))).join('') || '<p class="tiny">這個分類尚無料理。</p>';
    };
    return `<div class="recipe-picker"><div class="meal-tabs">${typeOrder.map(type => `<button type="button" data-meal-tab="${type}" class="${type === 'all' ? 'active' : ''}">${type === 'all' ? '全部' : recipeTypeLabel(type)}</button>`).join('')}</div><div class="recipe-groups">${typeOrder.map(type => `<div data-meal-panel="${type}" ${type === 'all' ? '' : 'hidden'}>${panel(type)}</div>`).join('')}</div></div>`;
  }

  function buildGuidance(tripData) {
    const amenities = new Set(tripData.siteAmenities || []);
    const guidance = [];
    if (amenities.has('shower')) guidance.push('有淋浴間：盥洗用品可改放個人包，不需額外準備清潔用水。');
    if (amenities.has('toilet')) guidance.push('有廁所：可不必另備行動如廁用品。');
    if (amenities.has('drinking-water')) guidance.push('有飲用水：冷水瓶可在營地補水，仍保留料理用水。');
    if (amenities.has('shared-freezer')) guidance.push('有共用冰櫃：保冷袋用於運送食材，到場後可轉入冷凍保存。');
    if (amenities.has('shared-tables')) guidance.push('有公用桌椅：非料理行程可省略主桌，保留矮桌作個人備料區。');
    if (amenities.has('washing-station')) guidance.push('有洗滌台：已省略過夜水袋；需遠離洗滌台時可手動加入。');
    if (amenities.has('trash')) guidance.push('有垃圾集中處：折疊垃圾桶仍用於營位暫存，離場前集中丟棄。');
    if (amenities.has('parking')) guidance.push('有停車位：可依量級帶較大型桌椅與保冷袋。');
    if (amenities.has('signal')) guidance.push('有網路／訊號：可直接使用地圖連結與營地聯絡資訊。');
    if (amenities.has('fire-zone')) guidance.push('有營火區：選擇焚火烤肉時，系統會加入焚火台與生火配件。');
    if (amenities.has('shop')) guidance.push('有販售部：仍依菜單採買；只把冰塊、飲料等臨時品留待現場補充。');
    return guidance;
  }

  buildTripItems = function buildPlannerItems(tripData) {
    const results = new Map();
    const amenities = new Set(tripData.siteAmenities || []);
    const goals = new Set(tripData.goals || []);
    const add = (id, reason) => {
      const gear = gearById(id);
      if (!gear) return;
      const existing = results.get(id);
      if (existing) {
        if (!existing.reason.includes(reason)) existing.reason += `／${reason}`;
        return;
      }
      results.set(id, { gearId: id, name: gear.name, category: gear.category, reason, checked: false, manual: false });
    };
    const remove = id => results.delete(id);
    const overnight = isOvernight(tripData);
    const cooking = goals.has('cook');
    const hasOnsiteRecipe = (tripData.recipeIds || []).some(id => state.recipes.find(recipe => recipe.id === id)?.onsite);

    // Each transport level starts from a user-editable equipment preset.
    const levelPreset = new Set(levelDefaultGear(tripData.level));
    levelPreset.forEach(id => add(id, `${levelText[tripData.level]}預設裝備`));

    if (overnight) {
      ['S07', 'S08', 'L03', 'X02'].forEach(id => add(id, '過夜需要'));
      if (goals.has('bush')) ['S03', 'S04', 'S05', 'R01', 'R03', 'R04'].forEach(id => add(id, '輕量野營過夜'));
      else ['S01', 'S06', 'R03'].forEach(id => add(id, '帳篷過夜'));
      if (tripData.level === 'L4') ['L01', 'L02', 'L04'].forEach(id => add(id, '全配過夜'));
    }

    // Environment rules.
    if (tripData.campType === 'pallet') add('R05', '棧板營位');
    if (tripData.campType === 'forest') ['S05', 'L03'].forEach(id => add(id, '林地防蚊與照明'));
    if (tripData.campType === 'riverside') ['S05', 'L03', 'X02'].forEach(id => add(id, '溪邊防蚊、照明與清潔'));
    if (tripData.campType === 'beach') ['S03', 'R01', 'R03', 'R04'].forEach(id => add(id, '海邊遮陽與防風固定'));
    if (tripData.campType === 'mountain') ['L03', 'X02', 'L06'].forEach(id => add(id, '山區照明、備水與背負'));
    if (tripData.campType === 'wild') ['S03', 'R01', 'R03', 'R04', 'L03', 'X02'].forEach(id => add(id, '野外自給搭設'));

    // Goal rules.
    if (cooking) ['C10', 'C11', 'T03'].forEach(id => add(id, '料理規劃'));
    if (goals.has('fire')) ['F02', 'C02', 'C05', 'C06', 'C12', 'C13'].forEach(id => add(id, '焚火烤肉'));
    if (goals.has('bush') && !overnight) ['S03', 'R01', 'R03', 'R04'].forEach(id => add(id, '輕量野營搭設'));
    if (goals.has('mood')) ['F05', 'L01', 'L02', 'L07', 'T07'].forEach(id => add(id, '拍照佈置'));
    if (goals.has('shelter')) ['S03', 'R01', 'R03', 'R04'].forEach(id => add(id, '遮陽避雨'));
    if (goals.has('rest')) add('F02', '放空休息');
    if (goals.has('picnic')) ['F03', 'F04', 'T07'].forEach(id => add(id, '野餐聊天'));
    if (goals.has('coffee')) ['C01', 'T02', 'T05'].forEach(id => add(id, '咖啡茶飲'));
    if (goals.has('friends')) ['F03', 'F01', 'T01'].forEach(id => add(id, '親友同樂'));
    if (goals.has('light')) ['C04', 'T02', 'T05', 'L06'].forEach(id => add(id, '輕量挑戰'));
    if (goals.has('hike')) ['C04', 'T02', 'T05', 'L03', 'L06'].forEach(id => add(id, '登山健行'));
    if (goals.has('rain')) ['S03', 'R01', 'R03', 'R04', 'L03'].forEach(id => add(id, '雨天備案'));

    // Recipe rules are the source of truth for cookware, tools and food.
    for (const recipeId of tripData.recipeIds || []) {
      const recipe = state.recipes.find(item => item.id === recipeId);
      if (!recipe) continue;
      recipe.gear.forEach(id => add(id, `料理：${recipe.name}`));
      if (recipe.onsite) ['C08', 'C09'].forEach(id => add(id, `料理仍需現場切配：${recipe.name}`));
    }
    if (!tripData.prep && (cooking || hasOnsiteRecipe)) ['C08', 'C09'].forEach(id => add(id, '現場備料'));

    // Facilities have explicit, conservative effects.  They never silently
    // discard an essential item unless that facility replaces its exact job.
    if (amenities.has('power')) add('L04', '營地電源');
    if (amenities.has('drinking-water')) add('C07', '營地可補飲用水');
    if (amenities.has('shared-freezer')) add('L05', '食材運送至共用冰櫃');
    if (amenities.has('shared-tables') && !cooking && !hasOnsiteRecipe && tripData.level !== 'L1') remove('F03');
    if (amenities.has('washing-station') && overnight && tripData.campType !== 'wild') remove('X02');
    if (amenities.has('fire-zone') && goals.has('fire')) ['C02', 'C05', 'C06', 'C12', 'C13'].forEach(id => add(id, '營火區焚火烤肉'));

    // Gear a user marked for the chosen goal remains additive.
    state.gear
      .filter(gear => gear.owned && gear.levels?.includes(tripData.level) && gear.contexts?.some(context => goals.has(context)))
      .forEach(gear => {
        const matchedContexts = gear.contexts.filter(context => goals.has(context)).map(context => goalText[context]).filter(Boolean);
        add(gear.id, `適用情境：${matchedContexts.join('、')}`);
      });

    // L1 remains one stove / one cookware by default.  Recipe-specified gear is
    // allowed, but the user sees an explicit constraint instead of hidden removal.
    if (tripData.level === 'L1' && !(tripData.recipeIds || []).length) add('K01', 'L1 一爐一鍋');
    if (tripData.level === 'L1') ['F03', 'F05', 'S01', 'S02', 'S04', 'C02', 'L01', 'L02'].forEach(id => { if (!levelPreset.has(id)) remove(id); });
    if (tripData.level === 'L2' && !levelPreset.has('F05')) remove('F05');

    tripData.guidance = buildGuidance(tripData);
    return [...results.values()];
  };

  function parseMapShare(raw) {
    const text = String(raw || '').trim();
    const url = text.match(/https?:\/\/[^\s]+/i)?.[0] || '';
    let name = '';
    let latitude = '';
    let longitude = '';
    let placeId = '';
    try {
      const parsed = new URL(url);
      const place = parsed.pathname.match(/\/place\/([^/@]+)/i)?.[1];
      if (place) name = decodeURIComponent(place).replace(/\+/g, ' ');
      const coordinate = `${parsed.pathname}${parsed.search}`.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
      if (coordinate) [, latitude, longitude] = coordinate;
      const placeIds = [...`${parsed.pathname}${parsed.search}`.matchAll(/!1s([^!&]+)/g)];
      placeId = placeIds.at(-1)?.[1] || '';
    } catch (_) { /* A pasted sharing card can omit a valid URL. */ }
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).filter(line => !/^https?:\/\//i.test(line));
    if (!name && lines.length) name = lines[0];
    const phone = text.match(/(?:\+?886[-\s]?)?0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{3,4}/)?.[0] || '';
    const address = lines.find(line => /(?:\d{3,5}.*(?:市|縣|區|鄉|鎮|村|里|路|街|巷|弄|號)|(?:市|縣).*(?:區|鄉|鎮|路|街|號))/.test(line)) || '';
    return { mapUrl: url, mapShare: text, mapName: name, address, contact: phone, latitude, longitude, placeId };
  }

  function mapDetails(tripData) {
    const lines = [];
    if (tripData.address) lines.push(`地址：${tripData.address}`);
    if (tripData.contact) lines.push(`聯絡：${tripData.contact}`);
    return lines.join('<br>');
  }

  function plannerTripEditor(existing) {
    const today = new Date().toISOString().slice(0, 10);
  const preferences = state.preferences || { defaultLevel: 'L1', defaultCampType: 'grass', defaultPrep: false, illustrations: true, autoTrimSuggestions: true };
  const tripData = existing || { name: '未命名露營', date: today, endDate: '', location: '', duration: 'day', level: preferences.defaultLevel, campType: preferences.defaultCampType, goals: [], prep: preferences.defaultPrep, recipeIds: [], siteAmenities: [], mapShare: '', mapUrl: '', address: '', contact: '' };
    const chosenAmenities = new Set(tripData.siteAmenities || []);
    const dialogRoot = dialog(`<h2>${existing ? '編輯行程' : '新增行程'}</h2><form id="trip-form"><div class="form-grid"><div class="field full"><label>行程名稱</label><input name="name" required value="${esc(tripData.name)}"></div><div class="field"><label>出發日期</label><input type="date" name="date" value="${esc(tripData.date)}"></div><div class="field" id="end-date-field"><label>結束日期</label><input type="date" name="endDate" value="${esc(tripData.endDate || '')}"></div><div class="field full"><label>營地名稱</label><div class="location-search"><input name="location" value="${esc(tripData.location)}" placeholder="例如：鴛鴦谷烤肉區"><button type="button" class="secondary" data-map-search>開啟地圖</button></div></div><div class="field full"><label>Google Maps 分享資訊</label><textarea name="mapShare" rows="3" placeholder="貼上完整 Google Maps 網址，或貼上分享卡中的名稱、地址、電話與網址">${esc(tripData.mapShare || tripData.mapUrl || '')}</textarea><div class="map-actions"><button type="button" class="ghost" data-read-map>讀取分享資訊</button><span class="tiny">完整網址可讀取名稱與座標；短網址只能保存連結。</span></div></div><div class="field"><label>地址</label><input name="address" value="${esc(tripData.address || '')}" placeholder="可從分享卡貼上"></div><div class="field"><label>聯絡資訊</label><input name="contact" value="${esc(tripData.contact || '')}" placeholder="電話、LINE 或備註"></div><div class="field"><label>行程</label><select name="duration"><option value="day" ${tripData.duration === 'day' ? 'selected' : ''}>日歸</option><option value="overnight" ${tripData.duration === 'overnight' ? 'selected' : ''}>2 日 1 夜</option><option value="multi-day" ${tripData.duration === 'multi-day' ? 'selected' : ''}>多日露營</option></select></div><div class="field"><label>量級</label><select name="level">${Object.entries(levelText).map(([value, label]) => `<option value="${value}" ${tripData.level === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field"><label>營地環境</label><select name="campType">${environmentOptions.map(([value, label]) => `<option value="${value}" ${tripData.campType === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field full"><label>現場設施</label><div class="compact-options amenities-options">${amenityOptions.map(([value, label]) => `<label><input type="checkbox" name="amenity" value="${value}" ${chosenAmenities.has(value) ? 'checked' : ''}> ${label}</label>`).join('')}</div></div><div class="field full"><label>這次想做什麼</label><div class="compact-options">${Object.entries(goalText).map(([value, label]) => `<label title="${esc(goalHelp[value] || '')}"><input type="checkbox" name="goal" value="${value}" ${(tripData.goals || []).includes(value) ? 'checked' : ''}> ${label}</label>`).join('')}</div></div><div class="field full"><label>這天的菜單</label>${plannerRecipePicker(tripData)}</div><div class="field full"><label class="inline-label"><input type="checkbox" name="prep" ${tripData.prep ? 'checked' : ''}> 在家先備料</label><span class="tiny">食譜若標示需要現場切配，砧板與菜刀仍會保留並標示原因。</span></div></div><div class="actions"><button class="primary">${existing ? '儲存變更' : '建立行程卡片'}</button><button type="button" class="secondary" id="cancel">取消</button></div></form>`);
    const form = $('#trip-form', dialogRoot);
    const date = $('input[name="date"]', dialogRoot);
    const duration = $('select[name="duration"]', dialogRoot);
    const endField = $('#end-date-field', dialogRoot);
    const endDate = $('input[name="endDate"]', dialogRoot);
    const mapShare = $('textarea[name="mapShare"]', dialogRoot);
    const location = $('input[name="location"]', dialogRoot);
    const address = $('input[name="address"]', dialogRoot);
    const contact = $('input[name="contact"]', dialogRoot);
    const updateDates = () => {
      const overnight = duration.value === 'overnight';
      const multiDay = duration.value === 'multi-day';
      endField.hidden = !(overnight || multiDay);
      endDate.disabled = overnight;
      endDate.required = multiDay;
      endDate.min = date.value;
      if (overnight) endDate.value = nextDate(date.value);
      if (multiDay && !endDate.value) endDate.value = date.value;
    };
    const readMap = () => {
      const details = parseMapShare(mapShare.value);
      if (!details.mapUrl && !details.mapName) { mapShare.focus(); return; }
      if (details.mapName) location.value = details.mapName;
      if (details.address) address.value = details.address;
      if (details.contact) contact.value = details.contact;
    };
    updateDates();
    duration.onchange = updateDates;
    date.onchange = updateDates;
    $('#cancel', dialogRoot).onclick = closeDialog;
    $('[data-read-map]', dialogRoot).onclick = readMap;
    $('[data-map-search]', dialogRoot).onclick = () => {
      const details = parseMapShare(mapShare.value);
      const query = details.mapUrl || location.value.trim();
      if (query) window.open(details.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener');
      else location.focus();
    };
    dialogRoot.addEventListener('click', async event => {
      const tab = event.target.closest('[data-meal-tab]');
      const favorite = event.target.closest('[data-favorite-recipe]');
      if (tab) {
        event.preventDefault();
        $$('[data-meal-tab]', dialogRoot).forEach(button => button.classList.toggle('active', button === tab));
        $$('[data-meal-panel]', dialogRoot).forEach(panel => { panel.hidden = panel.dataset.mealPanel !== tab.dataset.mealTab; });
        return;
      }
      if (!favorite) return;
      event.preventDefault();
      const recipe = state.recipes.find(item => item.id === favorite.dataset.favoriteRecipe);
      if (!recipe) return;
      const selected = $$('input[name="recipe"]:checked', dialogRoot).map(input => input.value);
      recipe.favorite = !recipe.favorite;
      await store.save();
      $('.recipe-picker', dialogRoot).outerHTML = plannerRecipePicker({ recipeIds: selected });
    });
    form.onsubmit = async event => {
      event.preventDefault();
      const data = new FormData(form);
      const parsedMap = parseMapShare(data.get('mapShare'));
      const kind = data.get('duration');
      const values = {
        name: data.get('name').trim(), date: data.get('date'),
        endDate: kind === 'overnight' ? nextDate(data.get('date')) : (data.get('endDate') || ''),
        location: data.get('location').trim() || parsedMap.mapName,
        duration: kind, level: data.get('level'), campType: data.get('campType'),
        siteAmenities: data.getAll('amenity'), power: data.getAll('amenity').includes('power'),
        goals: data.getAll('goal'), prep: data.get('prep') === 'on', recipeIds: data.getAll('recipe'),
        mapShare: data.get('mapShare').trim(), mapUrl: parsedMap.mapUrl,
        address: data.get('address').trim() || parsedMap.address,
        contact: data.get('contact').trim() || parsedMap.contact,
        latitude: parsedMap.latitude, longitude: parsedMap.longitude, placeId: parsedMap.placeId
      };
      if (existing) {
        Object.assign(existing, values);
        recalc(existing);
      } else {
        const fresh = coreCreateTrip(values);
        Object.assign(fresh, values);
        fresh.items = buildTripItems(fresh);
        fresh.shopping = buildShopping(fresh);
        fresh.planningRuleVersion = 2;
        state.trips.unshift(fresh);
        state.activeTripId = fresh.id;
      }
      await store.save();
      closeDialog();
      state.page = 'trips';
      render();
    };
  }

function optionalPackingSuggestions(tripData) {
  const limits = { L1: 16, L2: 28, L3: 40, L4: 54 };
  const limit = limits[tripData.level] || 28;
  const extraCount = Math.max(0, (tripData.items || []).length - limit);
  if (!extraCount) return { limit, extraCount: 0, candidates: [] };
  const optionalReason = /適用情境|氣氛|拍照|野餐|咖啡茶飲|親友同樂|基本行程/;
  const essentialReason = /料理|過夜|營地|現場|焚火|遮陽|避雨/;
  const candidates = (tripData.items || [])
    .filter(item => optionalReason.test(item.reason || '') && !essentialReason.test(item.reason || ''))
    .slice(0, Math.min(extraCount, 5));
  return { limit, extraCount, candidates };
}

function decorateTripDetails() {
  // 行程摘要只屬於「行程卡片」與「本次清單」。
  // 其他頁面也有 .sub（例如裝備／料理的筆數），不能共用這個選取器。
  if (!['trips', 'lists'].includes(state.page)) return;
  const current = trip();
    if (!current) return;
    const details = mapDetails(current);
    // Only the page header may receive trip/map details. A descendant `.sub`
    // can be the drinking-water explanation, and updating it here caused the
    // campsite address/contact block to appear underneath that section.
    const context = document.querySelector('.trip-context');
    if (context) context.innerHTML = `${tripDateRange(current)}　${esc(current.location || '未填地點')}<br>${tripDurationName(current)} · ${levelText[current.level]}　｜　目的：${esc(cardPurpose(current))}${details ? `<br>${details}` : ''}`;
    const list = document.querySelector('#list-body');
    const guidance = current.guidance || buildGuidance(current);
    if (list && guidance.length && !document.querySelector('.trip-guidance')) {
      list.insertAdjacentHTML('afterbegin', `<section class="trip-guidance"><h3>營地條件提醒</h3>${guidance.map(line => `<p>${esc(line)}</p>`).join('')}</section>`);
    }
    if (list && listTab === 'pack' && state.preferences?.autoTrimSuggestions !== false && !document.querySelector('.packing-suggestions')) {
      const suggestion = optionalPackingSuggestions(current);
      if (suggestion.extraCount && suggestion.candidates.length) {
        list.insertAdjacentHTML('afterbegin', `<section class="packing-suggestions"><h3>精簡建議</h3><p>目前 ${current.items.length} 件，${levelText[current.level]} 建議約 ${suggestion.limit} 件內。以下屬於情境加選，可視需要不帶。</p><div class="suggestion-list">${suggestion.candidates.map(item => `<div><span>${esc(item.name)}</span><button type="button" class="ghost" data-action="remove-from-trip" data-id="${esc(item.gearId)}">不帶這件</button></div>`).join('')}</div></section>`);
      }
    }
  }

  function upgradeTripsToPlanningRules() {
    let changed = false;
    for (const tripData of state.trips || []) {
      if (tripData.planningRuleVersion === 2) continue;
      tripData.siteAmenities ||= [];
      tripData.overrides ||= { added: [], removed: [] };
      const checkedItems = new Map((tripData.items || []).map(entry => [entry.gearId, entry.checked]));
      const checkedShopping = new Map((tripData.shopping || []).map(entry => [`${entry.recipeId || ''}:${entry.name}`, entry.checked]));
      let items = buildTripItems(tripData).filter(entry => !tripData.overrides.removed.includes(entry.gearId));
      for (const entry of tripData.overrides.added) if (!items.some(item => item.gearId === entry.gearId)) items.push(entry);
      items.forEach(entry => { entry.checked = checkedItems.get(entry.gearId) || false; });
      tripData.items = items;
      tripData.shopping = buildShopping(tripData).map(entry => ({ ...entry, checked: checkedShopping.get(`${entry.recipeId || ''}:${entry.name}`) || false }));
      tripData.planningRuleVersion = 2;
      tripData.updatedAt = now();
      changed = true;
    }
    // Planning upgrades are persisted by the next explicit user mutation.
  }

  drawCard = function drawPlannerCard(tripData) {
    return new Promise(resolve => {
      const width = 1080;
      const items = tripData.items || [];
      const shopping = tripData.shopping || [];
      const recipeNames = (tripData.recipeIds || [])
        .map(id => state.recipes.find(recipe => recipe.id === id)?.name)
        .filter(Boolean);
      // A card is an image, not a paginated document.  Its height grows with the
      // longer list so every item remains readable and the footer never overlaps it.
      const listRows = Math.max(items.length, shopping.length, 1);
      const listStart = 680;
      const footerTop = listStart + 72 + listRows * 42 + 58;
      const height = Math.max(1500, footerTop + 112);
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d');
      const left = 64;
      const right = width - 64;
      const columnGap = 48;
      const columnWidth = (right - left - columnGap) / 2;
      const shoppingX = left + columnWidth + columnGap;

      const clipped = (text, maxWidth) => {
        const value = String(text || '');
        if (context.measureText(value).width <= maxWidth) return value;
        let output = value;
        while (output && context.measureText(`${output}…`).width > maxWidth) output = output.slice(0, -1);
        return `${output}…`;
      };
      const wrapped = (text, x, y, maxWidth, lineHeight, maxLines = 2) => {
        const characters = [...String(text || '')];
        const lines = [];
        let line = '';
        for (const character of characters) {
          const next = line + character;
          if (line && context.measureText(next).width > maxWidth) {
            lines.push(line); line = character;
          } else line = next;
        }
        if (line) lines.push(line);
        lines.slice(0, maxLines).forEach((value, index) => {
          const finalLine = index === maxLines - 1 && lines.length > maxLines ? `${value}…` : value;
          context.fillText(finalLine, x, y + index * lineHeight);
        });
        return Math.min(lines.length, maxLines) * lineHeight;
      };
      const line = (y) => {
        context.strokeStyle = '#d8e0d8'; context.lineWidth = 2;
        context.beginPath(); context.moveTo(left, y); context.lineTo(right, y); context.stroke();
      };
      const stat = (label, value, x, y, maxWidth) => {
        context.fillStyle = '#68746d'; context.font = '700 19px sans-serif'; context.fillText(label, x, y);
        context.fillStyle = '#18352a'; context.font = '700 30px sans-serif'; context.fillText(clipped(value, maxWidth), x, y + 38);
      };
      const listColumn = (title, complete, total, entries, x) => {
        context.fillStyle = '#18352a'; context.font = '700 31px sans-serif';
        context.fillText(title, x, listStart);
        context.fillStyle = '#2f624a'; context.textAlign = 'right'; context.fillText(`${complete} / ${total}`, x + columnWidth, listStart); context.textAlign = 'left';
        context.font = '25px sans-serif';
        entries.forEach((entry, index) => {
          const y = listStart + 48 + index * 42;
          context.fillStyle = entry.checked ? '#2f624a' : '#6a756f';
          context.fillText(entry.checked ? '☑' : '☐', x + 10, y);
          context.fillStyle = '#18352a';
          context.fillText(clipped(entry.name, columnWidth - 52), x + 42, y);
        });
        if (!entries.length) {
          context.fillStyle = '#68746d'; context.font = '24px sans-serif'; context.fillText('目前沒有項目', x + 10, listStart + 48);
        }
      };

      context.fillStyle = '#fffefa'; context.fillRect(0, 0, width, height);
      context.fillStyle = '#1f4937'; context.fillRect(0, 0, width, 24);

      context.fillStyle = '#18352a'; context.font = '700 64px sans-serif';
      const titleHeight = wrapped(tripData.name, left, 120, 630, 74, 2);
      context.fillStyle = '#2f624a'; context.font = '700 28px sans-serif';
      context.fillText(cardPurpose(tripData), left, 146 + titleHeight);

      const statsY = 270;
       stat('日期', tripDateRange(tripData), left, statsY, 350);
       stat('行程', tripDurationName(tripData), 440, statsY, 180);
      stat('營地', tripData.location || '未填地點', left, statsY + 102, 500);
      stat('難度', levelText[tripData.level] || '未設定', 365, statsY + 102, 280);

      context.fillStyle = '#f1f5ef'; context.fillRect(710, 352, 306, 158);
      context.fillStyle = '#2f624a'; context.font = '700 20px sans-serif'; context.fillText('地點資訊', 736, 388);
      context.fillStyle = '#40564b'; context.font = '22px sans-serif';
      let detailY = 423;
      if (tripData.address) { detailY += wrapped(`地址：${tripData.address}`, 736, detailY, 252, 28, 2) + 6; }
      if (tripData.contact) wrapped(`聯絡：${tripData.contact}`, 736, detailY, 252, 28, 2);
      if (!tripData.address && !tripData.contact) context.fillText('尚未填寫地址或聯絡方式', 736, detailY);

      context.fillStyle = '#18352a'; context.font = '700 27px sans-serif'; context.fillText('這天的菜單', left, 552);
      context.fillStyle = '#40564b'; context.font = '24px sans-serif';
      wrapped(recipeNames.join('、') || '尚未選擇料理', left, 586, 930, 30, 1);

      listColumn('打包清單', done(items), items.length, items, left);
      listColumn('採買清單', done(shopping), shopping.length, shopping, shoppingX);
      line(footerTop - 36);
      context.fillStyle = '#68746d'; context.font = '20px sans-serif';
      context.fillText('原始 PNG 含可還原的行程資料；請以檔案模式傳送。', left, footerTop + 8);
      context.fillStyle = '#2f624a'; context.font = '700 20px sans-serif'; context.textAlign = 'right';
      context.fillText(`露營助手 ／ 行程卡片　${tripData.code} · v${tripData.revision}`, right, footerTop + 8);
      context.textAlign = 'left';
      const finish = () => canvas.toBlob(resolve, 'image/png');
      // Use the same location-map illustration that appears in the side panel.
      // It is drawn after layout because it occupies only the reserved right hero space.
      const mapIllustration = new Image();
      mapIllustration.onload = () => {
        context.drawImage(mapIllustration, 1024, 512, 512, 512, 718, 60, 298, 250);
        finish();
      };
      mapIllustration.onerror = finish;
      mapIllustration.src = 'assets/camping-illustrations-v1.png';
    });
  };

  tripDialog = plannerTripEditor;
  recipePicker = plannerRecipePicker;
  render = function renderPlanner() {
    /* v8: normalization belongs to migration, not rendering. */
    coreRender();
    decorateTripDetails();
  };
})();

/* Settings files and card import deliberately live in separate flows. */
function nextRecipeId() {
  const numbers = state.recipes
    .map(recipe => Number(String(recipe.id || '').replace(/^RCP/i, '')))
    .filter(Number.isFinite);
  return `RCP${String((numbers.length ? Math.max(...numbers) : 0) + 1).padStart(3, '0')}`;
}

function exportSettingsProfile() {
  const profile = {
    format: 'camp-assistant.settings.v1',
    exportedAt: now(),
    gear: structuredClone(state.gear),
    recipes: structuredClone(state.recipes),
    locations: [...state.locations]
  };
  download(new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' }), `露營助手設定檔_${new Date().toISOString().slice(0, 10)}.json`);
  notify('已備份裝備、料理與收納位置設定。');
}

function applySettingsProfile(profile, conflictMode) {
  const copyGear = gear => ({ ...structuredClone(gear), id: nextGearId(gear.category) });
  const copyRecipe = recipe => ({ ...structuredClone(recipe), id: nextRecipeId() });
  for (const incoming of profile.gear || []) {
    const current = state.gear.find(gear => gear.id === incoming.id);
    if (!current) { state.gear.push(structuredClone(incoming)); continue; }
    if (conflictMode === 'replace') Object.assign(current, structuredClone(incoming));
    if (conflictMode === 'copy') state.gear.push(copyGear(incoming));
  }
  for (const incoming of profile.recipes || []) {
    const current = state.recipes.find(recipe => recipe.id === incoming.id);
    if (!current) { state.recipes.push(structuredClone(incoming)); continue; }
    if (conflictMode === 'replace') Object.assign(current, structuredClone(incoming));
    if (conflictMode === 'copy') state.recipes.push(copyRecipe(incoming));
  }
  state.locations = [...new Set([...(state.locations || []), ...(profile.locations || [])])];
}

function settingsConflictDialog(profile) {
  const gearConflicts = (profile.gear || []).filter(incoming => state.gear.some(current => current.id === incoming.id));
  const recipeConflicts = (profile.recipes || []).filter(incoming => state.recipes.some(current => current.id === incoming.id));
  const conflicts = gearConflicts.length + recipeConflicts.length;
  if (!conflicts) {
    applySettingsProfile(profile, 'keep');
    store.save().then(() => { notify('設定檔已載入。'); render(); });
    return;
  }
  const dialogRoot = dialog(`<h2>載入設定檔</h2><p class="sub">偵測到 ${gearConflicts.length} 件裝備與 ${recipeConflicts.length} 道料理的編號相同。請選擇保留方式。</p><form id="settings-conflict-form"><div class="field"><label><input type="radio" name="conflict" value="keep" checked> 保留目前資料，略過同編號項目</label><label><input type="radio" name="conflict" value="replace"> 用設定檔覆蓋同編號項目</label><label><input type="radio" name="conflict" value="copy"> 同時保留，匯入項目自動取得新編號</label></div><div class="actions"><button class="primary">載入設定</button><button type="button" class="secondary" id="cancel">取消</button></div></form>`);
  $('#cancel', dialogRoot).onclick = closeDialog;
  $('#settings-conflict-form', dialogRoot).onsubmit = async event => {
    event.preventDefault();
    applySettingsProfile(profile, new FormData(event.target).get('conflict'));
    await store.save();
    closeDialog();
    notify('設定檔已載入。');
    render();
  };
}

function chooseSettingsProfile() {
  const input = $('#file-input');
  input.accept = '.json,application/json';
  input.value = '';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      const profile = JSON.parse(await file.text());
      if (profile.format !== 'camp-assistant.settings.v1' || !Array.isArray(profile.gear) || !Array.isArray(profile.recipes)) throw new Error('這不是露營助手設定檔。');
      settingsConflictDialog(profile);
    } catch (error) {
      console.error(error);
      notify(`載入設定檔失敗：${error.message}`, 'error');
    }
  };
  input.click();
}

function chooseTripCard() {
  const input = $('#file-input');
  input.accept = 'image/png,.png';
  input.value = '';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      await importCard(file);
      notify('行程卡片已匯入，可直接編輯。');
      render();
    } catch (error) {
      console.error(error);
      notify(`匯入行程卡片失敗：${error.message}`, 'error');
    }
  };
  input.click();
}

function settingsGearPage() {
  const visible = gearCategoryFilter === 'favorite' ? state.gear.filter(gear => gear.favorite) : gearCategoryFilter === 'all' ? state.gear : state.gear.filter(gear => gear.category === gearCategoryFilter);
  return `<section class="page"><div class="page-heading"><div><h2 class="title">我的裝備</h2></div><div class="heading-actions"><button class="secondary" data-action="manage-level-defaults">量級預設</button><button class="secondary" data-action="manage-locations">收納位置</button><button class="primary" data-action="add-gear">新增裝備</button></div></div><div class="gear-filter"><label for="gear-category-filter">顯示分類</label><select id="gear-category-filter"><option value="all" ${gearCategoryFilter === 'all' ? 'selected' : ''}>全部裝備</option><option value="favorite" ${gearCategoryFilter === 'favorite' ? 'selected' : ''}>★ 我的最愛</option>${categories.map(category => `<option value="${category}" ${gearCategoryFilter === category ? 'selected' : ''}>${category}</option>`).join('')}</select></div><p class="sub">${visible.length} / ${state.gear.length} 件已登記</p><div id="gear-list">${gearRows(visible)}</div></section>`;
}

function managedRecipeDialog() {
  const recipeId = nextRecipeId();
  const usable = state.gear.filter(gear => ['烹飪熱源', '鍋具選項', '餐具容器'].includes(gear.category));
  const dialogRoot = dialog(`<h2>新增料理</h2><form id="recipe-form"><p class="system-id">料理編號：<strong>${recipeId}</strong></p><div class="form-grid"><div class="field full"><label>料理名稱</label><input name="name" required placeholder="例如：奶油雞肉炊飯"></div><div class="field"><label>常用時段（僅分類）</label><select name="meal"><option>不限</option><option>早餐</option><option>午餐</option><option selected>晚餐</option><option>宵夜</option></select></div><div class="field"><label class="inline-label" title="即使在家先備料，這道料理仍須在營地切配；會保留砧板與菜刀。"><input type="checkbox" name="onsite"> 仍需現場切配</label></div><div class="field full"><label>單人份食材／醬料</label><textarea name="ingredients" required placeholder="一行一項，例如：&#10;白米 1 杯&#10;雞腿肉 120g"></textarea></div><div class="field full"><label>需要的裝備</label><select name="gear" multiple size="7">${usable.map(gear => `<option value="${gear.id}">${esc(gear.name)}（${gear.id}）</option>`).join('')}</select><span class="tiny">按 Ctrl／⌘ 可複選。</span></div></div><div class="actions"><button class="primary">儲存料理</button><button class="secondary" type="button" id="cancel">取消</button></div></form>`);
  $('#cancel', dialogRoot).onclick = closeDialog;
  $('#recipe-form', dialogRoot).onsubmit = async event => {
    event.preventDefault();
    const data = new FormData(event.target);
    state.recipes.push({ id: recipeId, name: data.get('name').trim(), meal: data.get('meal'), ingredients: data.get('ingredients').split(/\r?\n/).map(line => line.trim()).filter(Boolean), gear: data.getAll('gear'), onsite: data.get('onsite') === 'on', favorite: false });
    await store.save();
    closeDialog();
    render();
  };
}

const plannerAction = action;
action = async function settingsAction(name, data = {}) {
  if (name === 'import-trip-card') return chooseTripCard();
  if (name === 'export-settings') return exportSettingsProfile();
  if (name === 'import-settings') return chooseSettingsProfile();
  return plannerAction(name, data);
};

renderGear = settingsGearPage;
recipeDialog = managedRecipeDialog;

const plannerRender = render;
render = function renderWithHomeImport() {
  plannerRender();
  if (state.page !== 'home' || document.querySelector('[data-action="import-trip-card"]')) return;
  const newTrip = document.querySelector('[data-action="new-trip"]');
  if (!newTrip) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'secondary';
  button.dataset.action = 'import-trip-card';
  button.textContent = '匯入行程卡片';
  button.onclick = () => action('import-trip-card');
  (newTrip.parentElement.classList.contains('home-header-actions') ? newTrip.parentElement : newTrip.parentElement).insertBefore(button, newTrip);
};

/* Recipes are organized by what they are and how much work they require, not
   by an assumed meal time.  Older recipes are classified from their name so
   existing libraries do not need a one-time migration. */
const recipeTypeOptions = [
  ['rice', '飯類'], ['noodles', '麵類'], ['soup', '湯鍋'], ['grill', '煎烤'],
  ['snack', '輕食'], ['drink', '飲品'], ['other', '其他']
];
const recipeEffortOptions = [
  ['no-heat', '免開火'], ['quick', '快速加熱（需開火）'], ['one-pot', '一般烹調（需開火）'], ['prep', '現場切配料理']
];

function recipeTypeLabel(value) { return recipeTypeOptions.find(([key]) => key === value)?.[1] || '其他'; }
function recipeEffortLabel(value) { return recipeEffortOptions.find(([key]) => key === value)?.[1] || '一鍋完成'; }
function recipeTypeOf(recipe) {
  if (recipe.type && recipeTypeOptions.some(([value]) => value === recipe.type)) return recipe.type;
  const name = recipe.name || '';
  if (/咖啡|紅茶|綠茶|奶茶|可可|飲|果汁|茶/.test(name)) return 'drink';
  if (/吐司|三明治|沙拉|優格|燕麥|麥片|飯糰|玉米|地瓜|燒賣|燒餅|蛋餅|鬆餅|餅乾/.test(name)) return 'snack';
  if (/湯|鍋|火鍋|味噌|濃湯/.test(name)) return 'soup';
  if (/麵|烏龍|義大利|泡麵|拉麵|粉/.test(name)) return 'noodles';
  if (/飯|炊飯|粥/.test(name)) return 'rice';
  if (/牛排|雞腿|鮭魚|香腸|燒肉|烤|煎|蒸蛋|玉子燒/.test(name)) return 'grill';
  return 'other';
}
function recipeRequiresHeat(recipe) {
  const text = `${recipe.name || ''} ${(recipe.ingredients || []).join(' ')}`;
  // "熱水" and all cooking methods are explicit heat requirements.  A cold
  // dish is only treated as no-heat when it contains none of these signals.
  return /熱水|沖泡|泡麵|茶泡飯|咖啡|奶茶|紅茶|綠茶|薑茶|可可|煮|煎|烤|炒|蒸|鍋|湯|烏龍|義大利麵|麵|炊飯|燉飯|咖哩|丼|火腿|培根|蛋餅|熱壓|法式吐司|鬆餅/.test(text);
}
function recipeEffortOf(recipe) {
  const needsHeat = recipeRequiresHeat(recipe);
  if (recipe.effort && recipeEffortOptions.some(([value]) => value === recipe.effort) && !(recipe.effort === 'no-heat' && needsHeat)) return recipe.effort;
  const name = recipe.name || '';
  if (!needsHeat) return 'no-heat';
  if (recipe.onsite) return 'prep';
  if ((recipe.ingredients || []).length <= 3 || /泡麵|沖泡|茶|咖啡|可可|濃湯|吐司|罐頭粥/.test(name)) return 'quick';
  return 'one-pot';
}
function normalizeRecipeClassification() {
  let changed = false;
  (state.recipes || []).forEach(recipe => {
    if (!recipe.type) { recipe.type = recipeTypeOf(recipe); changed = true; }
    const correctedEffort = recipeEffortOf(recipe);
    if (!recipe.effort || (recipe.effort === 'no-heat' && recipeRequiresHeat(recipe))) {
      recipe.effort = correctedEffort;
      changed = true;
    }
  });
  // Classification defaults are presentation migration only; do not save from render.
}

let recipeTypeFilter = 'all';
let recipeEffortFilter = 'all';

function recipeLibraryRows(recipesToShow) {
  return [...recipesToShow]
    .sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || a.name.localeCompare(b.name, 'zh-Hant'))
    .map(recipe => `<div class="gear-row"><button class="gear-open" data-action="edit-recipe" data-id="${esc(recipe.id)}"><span class="tag">${esc(recipe.id)}</span><span><span class="item-name">${esc(recipe.name)}</span><span class="reason">${recipeTypeLabel(recipeTypeOf(recipe))} · ${recipeEffortLabel(recipeEffortOf(recipe))}</span></span></button><button type="button" class="favorite ${recipe.favorite ? 'is-favorite' : ''}" data-action="toggle-recipe-favorite" data-id="${esc(recipe.id)}" aria-label="${recipe.favorite ? '取消最愛' : '標記最愛'} ${esc(recipe.name)}">${recipe.favorite ? '★' : '☆'}</button></div>`)
    .join('');
}

function recipeLibraryDialog(existing) {
  const recipe = existing || { id: nextRecipeId(), name: '', type: 'other', effort: 'one-pot', ingredients: [], gear: [], onsite: false, favorite: false };
  const usable = state.gear.filter(gear => ['烹飪熱源', '鍋具選項', '餐具容器'].includes(gear.category));
  const dialogRoot = dialog(`<h2>${existing ? '編輯料理' : '新增料理'}</h2><form id="recipe-form"><p class="system-id">料理編號：<strong>${esc(recipe.id)}</strong></p><div class="form-grid"><div class="field full"><label>料理名稱</label><input name="name" required value="${esc(recipe.name)}" placeholder="例如：奶油雞肉炊飯"></div><div class="field"><label>料理類型</label><select name="type">${recipeTypeOptions.map(([value, label]) => `<option value="${value}" ${recipeTypeOf(recipe) === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field"><label>準備程度</label><select name="effort">${recipeEffortOptions.map(([value, label]) => `<option value="${value}" ${recipeEffortOf(recipe) === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field full"><label class="inline-label" title="即使在家先備料，這道料理仍須在營地切配；會保留砧板與菜刀。"><input type="checkbox" name="onsite" ${recipe.onsite ? 'checked' : ''}> 仍需現場切配</label></div><div class="field full"><label>單人份食材／醬料</label><textarea name="ingredients" required>${esc((recipe.ingredients || []).join('\n'))}</textarea></div><div class="field full"><label>需要的裝備</label><select name="gear" multiple size="7">${usable.map(gear => `<option value="${gear.id}" ${(recipe.gear || []).includes(gear.id) ? 'selected' : ''}>${esc(gear.name)}（${gear.id}）</option>`).join('')}</select><span class="tiny">按 Ctrl／⌘ 可複選。</span></div></div><div class="actions"><button class="primary">儲存料理</button><button type="button" class="secondary" id="cancel">取消</button>${existing ? '<button type="button" class="ghost danger" id="delete-recipe">刪除料理</button>' : ''}</div></form>`);
  $('#cancel', dialogRoot).onclick = closeDialog;
  $('#delete-recipe', dialogRoot)?.addEventListener('click', async () => {
    if (dialogRoot.dataset.deleteArmed !== 'true') {
      dialogRoot.dataset.deleteArmed = 'true';
      $('#delete-recipe', dialogRoot).textContent = '再次點擊刪除';
      return;
    }
    await commitMutation(async () => {
      recycleEntity('recipes', existing);
      state.trips.forEach(tripData => { tripData.recipeSnapshots ??= {}; tripData.recipeSnapshots[existing.id] ??= structuredClone(existing); });
      state.recipes = state.recipes.filter(item => item.syncId !== existing.syncId);
      // Existing trip cards keep their rendered recipe/shopping snapshot.
      // Removing a catalogue recipe only prevents future selection.
    });
    closeDialog();
    render();
  });
  $('#recipe-form', dialogRoot).onsubmit = async event => {
    event.preventDefault();
    const data = new FormData(event.target);
    const values = { id: recipe.id, name: data.get('name').trim(), type: data.get('type'), effort: data.get('effort'), meal: recipe.meal || '不限', ingredients: data.get('ingredients').split(/\r?\n/).map(line => line.trim()).filter(Boolean), gear: data.getAll('gear'), onsite: data.get('onsite') === 'on', favorite: !!recipe.favorite };
    if (existing) Object.assign(existing, values);
    else state.recipes.push(values);
    state.trips.filter(tripData => (tripData.recipeIds || []).includes(recipe.id)).forEach(recalc);
    await store.save();
    closeDialog();
    render();
  };
}

function recordsPage() {
  const logs = state.logs || [];
  return `<section class="page"><div><p class="eyebrow">回顧</p><h2 class="title">露營紀錄</h2></div><section class="record-section"><h3>已完成行程</h3>${logs.length ? logs.map(log => `<button class="card record-open" data-action="open-archived-log" data-id="${esc(log.syncId || log.id)}"><h3>${esc(log.name)}</h3><p class="meta">${esc(log.date)} · ${esc(log.notes || '未填心得')}</p><span class="reason">查看內容</span></button>`).join('') : '<p class="sub">完成一場露營後，可從行程卡片選擇「結束並歸檔」。</p>'}</section></section>`;
}

function archivedTripPage() {
  const log = (state.logs || []).find(entry => entry.syncId === state.archivedLogId || entry.id === state.archivedLogId);
  if (!log) {
    state.page = 'logs';
    state.archivedLogId = null;
    return render();
  }
  const tripData = log.archivedTrip || log.tripSnapshot || {};
  const childRows = log.childrenSnapshot || [];
  const rows = kind => childRows.filter(row => row.kind === kind).map(row => row.data || {});
  const items = tripData.items?.length ? tripData.items : rows('packing').map(row => ({ ...row, name: row.name || row.snapshot?.name || '裝備' }));
  const shopping = tripData.shopping?.length ? tripData.shopping : rows('shopping').filter(row => !row.waterPlan);
  const recipes = Object.values(tripData.recipeSnapshots || {}).map(recipe => recipe.name).filter(Boolean);
  const itemRows = items.length ? items.map(item => `<div class="item ${item.checked ? 'checked' : ''}"><span><span class="item-name">${esc(item.name || '裝備')}</span><span class="reason">${esc(item.reason || item.category || '')}</span></span></div>`).join('') : '<p class="sub">未保留裝備清單。</p>';
  const shoppingRows = shopping.length ? shopping.map(item => `<div class="item ${item.checked ? 'checked' : ''}"><span><span class="item-name">${esc(item.name || '採買項目')}</span><span class="reason">${esc(item.recipeName || '')}</span></span></div>`).join('') : '<p class="sub">未保留採買清單。</p>';
  document.querySelector('#app').innerHTML = header() + `<section class="page archived-trip-page"><div class="page-heading"><div><p class="eyebrow">已歸檔行程</p><h2 class="title">${esc(log.name || tripData.name || '露營紀錄')}</h2><p class="sub">${esc(log.date || tripData.date || '')}　${esc(tripData.location || '未填地點')}</p></div></div><div class="actions"><button class="secondary" data-action="open-records">返回露營紀錄</button></div><section class="record-detail"><h3>行程資訊</h3><p class="meta">${esc(tripData.duration === 'overnight' ? '2 日 1 夜' : tripData.duration === 'day' ? '日歸' : '')}${tripData.level ? ` · ${esc(levelText[tripData.level] || tripData.level)}` : ''}</p>${recipes.length ? `<p class="meta">今日菜單：${esc(recipes.join('、'))}</p>` : ''}${log.notes ? `<p class="archive-notes">${esc(log.notes)}</p>` : ''}</section><section class="record-detail"><h3>打包清單</h3>${itemRows}</section><section class="record-detail"><h3>採買清單</h3>${shoppingRows}</section></section>` + nav();
  bind();
}

function recipesPage() {
  const visible = state.recipes.filter(recipe => (recipeTypeFilter === 'all' || recipeTypeOf(recipe) === recipeTypeFilter) && (recipeEffortFilter === 'all' || recipeEffortOf(recipe) === recipeEffortFilter));
  return `<section class="page"><div class="page-heading"><div><h2 class="title">我的料理</h2></div><div class="heading-actions"><button class="primary" data-action="add-recipe">新增料理</button></div></div><div class="gear-filter"><label for="recipe-type-filter">料理類型</label><select id="recipe-type-filter"><option value="all" ${recipeTypeFilter === 'all' ? 'selected' : ''}>全部類型</option>${recipeTypeOptions.map(([value, label]) => `<option value="${value}" ${recipeTypeFilter === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="gear-filter"><label for="recipe-effort-filter">準備程度</label><select id="recipe-effort-filter"><option value="all" ${recipeEffortFilter === 'all' ? 'selected' : ''}>全部程度</option>${recipeEffortOptions.map(([value, label]) => `<option value="${value}" ${recipeEffortFilter === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div id="recipe-library-list">${recipeLibraryRows(visible)}</div></section>`;
}

const settingsAction = action;
action = async function recordsAction(name, data = {}) {
  if (name === 'open-records') { state.page = 'logs'; return render(); }
  if (name === 'edit-recipe') return recipeLibraryDialog(state.recipes.find(recipe => recipe.id === data.id));
  if (name === 'toggle-recipe-favorite') {
    const recipe = state.recipes.find(item => item.id === data.id);
    if (recipe) { recipe.favorite = !recipe.favorite; await store.save(); render(); }
    return;
  }
  return settingsAction(name, data);
};

renderLogs = function renderLogsOrRecipes() { return state.page === 'recipes' ? recipesPage() : recordsPage(); };
recipeDialog = recipeLibraryDialog;
nav = function compactNav() {
  const tripNavigation = state.page === 'cancelled'
    ? '<button class="nav-back" data-action="back-home">返回</button>'
    : state.page === 'trips' && trip()
    ? '<button class="nav-back" data-action="show-trip-list">返回</button>'
    : '<button class="home-nav" data-page="home">行程</button>';
  return `<nav class="nav" aria-label="主要導覽">${tripNavigation}<button class="${state.page === 'lists' ? 'active' : ''}" data-page="lists">清單</button><button class="${state.page === 'gear' ? 'active' : ''}" data-page="gear">裝備</button><button class="${state.page === 'recipes' ? 'active' : ''}" data-page="recipes">料理</button></nav>`;
};

const renderWithHomeCardImport = render;
render = function renderWithRecordAccess() {
  renderWithHomeCardImport();
  if (state.page === 'home' && !document.querySelector('[data-action="open-records"]')) {
    const newTrip = document.querySelector('[data-action="new-trip"]');
    if (newTrip) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary';
      button.dataset.action = 'open-records';
      button.textContent = '露營紀錄';
      button.onclick = () => action('open-records');
      newTrip.parentElement.insertBefore(button, newTrip);
    }
  }
  $('#recipe-type-filter')?.addEventListener('change', event => { recipeTypeFilter = event.target.value; render(); });
  $('#recipe-effort-filter')?.addEventListener('change', event => { recipeEffortFilter = event.target.value; render(); });
};

/* Global settings stay outside individual gear or recipe management. */
function openSettingsDialog() {
  const preferences = state.preferences || { defaultLevel: 'L1', defaultCampType: 'grass', defaultPrep: false, illustrations: true };
  const dialogRoot = dialog(`<h2>設定</h2><form id="settings-form"><div class="form-grid"><div class="field full"><label>新行程預設</label><span class="tiny">只影響之後建立的行程，不會改動既有行程。</span></div><div class="field"><label>預設量級</label><select name="defaultLevel">${Object.entries(levelText).map(([value, label]) => `<option value="${value}" ${preferences.defaultLevel === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field"><label>預設營地環境</label><select name="defaultCampType">${[['grass','草地營位'],['pallet','棧板營位'],['forest','林地'],['riverside','溪邊'],['beach','海邊'],['mountain','山區'],['campground','一般營區'],['wild','野外營地']].map(([value, label]) => `<option value="${value}" ${preferences.defaultCampType === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field full"><label class="inline-label"><input type="checkbox" name="defaultPrep" ${preferences.defaultPrep ? 'checked' : ''}> 新行程預設在家先備料</label><label class="inline-label"><input type="checkbox" name="illustrations" ${preferences.illustrations !== false ? 'checked' : ''}> 顯示露營插圖</label><label class="inline-label"><input type="checkbox" name="autoTrimSuggestions" ${preferences.autoTrimSuggestions !== false ? 'checked' : ''}> 顯示裝備精簡建議</label></div><div class="field full settings-data"><label>資料與還原</label><p class="tiny">設定檔只包含裝備、料理與收納位置；行程與露營紀錄不會包含在內。</p><div class="actions"><button type="button" class="secondary" data-action="export-settings">備份設定檔</button><button type="button" class="secondary" data-action="import-settings">載入設定檔</button></div></div></div><div class="actions"><button class="primary">儲存設定</button><button type="button" class="secondary" id="cancel">取消</button></div></form>`);
  $('#cancel', dialogRoot).onclick = closeDialog;
  $('#settings-form', dialogRoot).onsubmit = async event => {
    event.preventDefault();
    const data = new FormData(event.target);
    state.preferences = { defaultLevel: data.get('defaultLevel'), defaultCampType: data.get('defaultCampType'), defaultPrep: data.get('defaultPrep') === 'on', illustrations: data.get('illustrations') === 'on', autoTrimSuggestions: data.get('autoTrimSuggestions') === 'on' };
    await store.save();
    closeDialog();
    render();
  };
}

function decoratePageWithIllustration() {
  document.querySelector('.page-decor')?.remove();
  if (state.preferences?.illustrations === false) return;
  const page = document.querySelector('.page');
  if (!page) return;
  page.classList.toggle('no-trip-page', state.page === 'lists' && !trip());
  const kind = ({ home: 'tent', trips: 'fire', lists: 'map', gear: 'backpack', recipes: 'pot', logs: 'forest', 'archived-log': 'forest', cancelled: 'forest' })[state.page] || 'forest';
  const decoration = document.createElement('span');
  decoration.className = `page-decor decor-${kind}`;
  decoration.setAttribute('aria-hidden', 'true');
  page.prepend(decoration);
}

function placePersistentAddGearButton() {
  document.querySelector('.list-add-gear')?.remove();
  if (state.page !== 'lists' || listTab !== 'pack') return;
  const original = document.querySelector('[data-action="add-to-trip"]');
  if (!original) return;
  original.textContent = '加入裝備';
  original.classList.remove('secondary');
  original.classList.add('primary', 'list-add-gear');
  original.closest('.actions')?.remove();
  // CSS presents this as a thin fixed bar above the bottom navigation, leaving
  // every row right edge available for its remove (×) control.
  const listBody = document.querySelector('#list-body');
  if (listBody) listBody.before(original);
  else document.querySelector('.page')?.append(original);
}

function arrangeHomeControls() {
  if (state.page !== 'home') return;
  const page = document.querySelector('.page');
  const heading = page?.querySelector('.row.between');
  if (!page || !heading) return;

  heading.classList.add('home-page-heading');
  heading.querySelector('.title')?.classList.add('home-page-title');

  // Earlier home renderers add buttons directly to the heading.  Always
  // normalize them into one primary-action row before arranging the layout.
  let actions = heading.querySelector('.home-header-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'home-header-actions';
    heading.append(actions);
  }
  const newTrip = heading.querySelector('[data-action="new-trip"]');
  const importCard = heading.querySelector('[data-action="import-trip-card"]');
  if (newTrip) actions.append(newTrip);
  if (importCard) actions.append(importCard);

  if (importCard) {
    importCard.textContent = '匯入卡片';
    importCard.classList.remove('primary');
    importCard.classList.add('secondary');
  }

  const footer = document.createElement('div');
  footer.className = 'home-secondary-actions';
  const records = heading.querySelector('[data-action="open-records"]');
  const cancelled = heading.querySelector('[data-action="show-cancelled-trips"]');
  if (records) footer.append(records);
  if (cancelled && (state.discardedTrips || []).length) {
    cancelled.textContent = `取消行程（${(state.discardedTrips || []).length}）`;
    footer.append(cancelled);
  } else {
    cancelled?.remove();
  }
  if (footer.children.length) {
    const tripRows = page.querySelectorAll('.home-trip-row');
    const lastTrip = tripRows[tripRows.length - 1];
    if (lastTrip) lastTrip.after(footer);
    else page.append(footer);
  }
}

function arrangeActiveTripHero() {
  if (state.page !== 'trips' || !state.activeTripId) return;
  const page = document.querySelector('.page');
  const editButton = page?.querySelector('[data-action="edit-trip"]');
  if (!page || !editButton || page.querySelector('.active-trip-hero')) return;

  const title = page.querySelector(':scope > .title');
  const summary = page.querySelector(':scope > .sub');
  const heading = [...page.children].find(element => element.classList.contains('row') && element.classList.contains('between'));
  const eyebrow = heading?.querySelector('.eyebrow');
  const back = heading?.querySelector('[data-action="show-trip-list"]');
  if (!title || !summary || !eyebrow || !heading) return;

  const active = trip();
  const hero = document.createElement('section');
  hero.className = 'active-trip-hero';
  const primary = document.createElement('div');
  primary.className = 'active-trip-primary';
  eyebrow.textContent = '行程卡片';
  const code = document.createElement('p');
  code.className = 'active-trip-code';
  code.textContent = `${active.code} · v${active.revision}`;
  primary.append(eyebrow, title, code, summary);
  hero.append(primary);
  if (back) {
    back.className = 'ghost trip-back-link';
    back.textContent = '所有行程';
    hero.append(back);
  }
  heading.replaceWith(hero);
  page.classList.add('active-trip-page');

  const actionGroups = page.querySelectorAll(':scope > .actions');
  actionGroups.forEach((group, index) => group.classList.add(index === 0 ? 'trip-main-actions' : 'trip-secondary-actions'));
}

const recordAction = action;
action = async function globalSettingsAction(name, data = {}) {
  if (name === 'open-settings') return openSettingsDialog();
  return recordAction(name, data);
};

const priorHeader = header;
header = function settingsHeader() {
  const root = document.createElement('template');
  root.innerHTML = priorHeader().trim();
  const brand = root.content.querySelector('.brand');
  const note = brand?.querySelector('.brand-note');
  if (note) {
    const tools = document.createElement('div');
    tools.className = 'brand-tools';
    tools.innerHTML = '<span class="brand-note">CAMP PLANNER</span><button type="button" class="header-settings" data-action="open-settings">設定</button>';
    note.replaceWith(tools);
  }
  return root.innerHTML;
};

const renderWithRecords = render;
render = function renderWithSettingsAndIllustrations() {
  /* v8: normalization belongs to migration, not rendering. */
  renderWithRecords();
  if (state.page === 'home') {
    const actions = document.querySelector('.home-header-actions');
    const newTrip = actions?.querySelector('[data-action="new-trip"]');
    if (actions && newTrip) actions.prepend(newTrip);
  }
  arrangeHomeControls();
  arrangeActiveTripHero();
  decoratePageWithIllustration();
  placePersistentAddGearButton();
};

/* Keep manual additions as easy to browse as the main gear library. */
addToTripDialog = function filteredAddToTripDialog() {
  const currentTrip = trip();
  if (!currentTrip) return;
  const tripId = currentTrip.id;
  let filter = 'all';
  const dialogRoot = dialog(`<form id="manual-add-form"><h2>手動加入裝備</h2><div class="gear-filter manual-gear-filter"><label for="manual-gear-filter">顯示分類</label><select id="manual-gear-filter"><option value="all">全部裝備</option><option value="favorite">★ 我的最愛</option>${categories.map(category => `<option value="${esc(category)}">${esc(category)}</option>`).join('')}</select></div><p id="manual-gear-count" class="sub"></p><div id="manual-gear-list" class="list"></div><div class="actions"><button type="submit" class="primary" id="add-items">加入</button><button type="button" class="secondary" id="cancel">取消</button></div></form>`);
  const availableGear = () => state.gear
    .filter(gear => !currentTrip.items.some(itemData => itemData.gearId === gear.id))
    .filter(gear => filter === 'all' || filter === 'favorite' ? (filter !== 'favorite' || gear.favorite) : gear.category === filter)
    .sort((left, right) => Number(!!right.favorite) - Number(!!left.favorite) || left.name.localeCompare(right.name, 'zh-Hant'));
  const drawAvailable = () => {
    const visible = availableGear();
    $('#manual-gear-count', dialogRoot).textContent = `${visible.length} 件可加入`;
    $('#manual-gear-list', dialogRoot).innerHTML = visible.length
      ? visible.map(gear => `<label class="item"><input type="checkbox" value="${esc(gear.id)}"><span><span class="item-name">${esc(gear.name)}${gear.favorite ? '　★' : ''}</span><span class="reason">${esc(gear.category)} · ${esc(gear.location || '未設定收納位置')}</span></span></label>`).join('')
      : '<p class="sub">這個分類目前沒有可加入的裝備。</p>';
  };
  $('#manual-gear-filter', dialogRoot).addEventListener('change', event => { filter = event.target.value; drawAvailable(); });
  $('#cancel', dialogRoot).onclick = closeDialog;
  $('#manual-add-form', dialogRoot).onsubmit = async event => {
    event.preventDefault();
    const button = $('#add-items', dialogRoot);
    if (button.disabled) return;
    button.disabled = true;
    await commitMutation(async () => {
      const writableTrip = state.trips.find(entry => entry.id === tripId);
      if (!writableTrip) return;
      writableTrip.items ??= [];
      writableTrip.overrides ??= { added: [], removed: [] };
      writableTrip.overrides.added ??= [];
      writableTrip.overrides.removed ??= [];
      $$('input:checked', $('#manual-gear-list', dialogRoot)).forEach(input => {
        const gear = gearById(input.value);
        if (!gear || writableTrip.items.some(entry => entry.gearId === gear.id)) return;
        const entry = item(gear.id, '手動加入');
        // The display ID can be changed by an import. Give a newly added row
        // an immutable identity before it reaches the sync queue.
        writableTrip.syncId ??= `legacy:trips:${writableTrip.id}`;
        entry.gearSyncId = gear.syncId || `legacy:gear:${gear.id}`;
        entry.syncId = `${writableTrip.syncId}:item:${entry.gearSyncId}`;
        entry.manual = true;
        writableTrip.items.push(entry);
        if (!writableTrip.overrides.added.some(itemData => itemData.gearId === gear.id)) writableTrip.overrides.added.push(structuredClone(entry));
        writableTrip.overrides.removed = writableTrip.overrides.removed.filter(id => id !== gear.id);
      });
      writableTrip.updatedAt = now();
    });
    closeDialog();
    render();
  };
  drawAvailable();
};

function openExtraDishDialog(recipeId) {
  const currentTrip = trip();
  const parentRecipe = state.recipes.find(recipe => recipe.id === recipeId);
  if (!currentTrip || !parentRecipe) return;
  const dialogRoot = dialog(`<h2>新增食材</h2><p class="sub">加入「${esc(parentRecipe.name)}」的本次行程食材。</p><form id="extra-dish-form"><div class="field"><label>食材／採買項目</label><textarea name="ingredients" required placeholder="一行一項，例如：&#10;玉米 2 根&#10;奶油 10g"></textarea></div><div class="actions"><button class="primary">加入食材</button><button type="button" class="secondary" id="cancel">取消</button></div></form>`);
  $('#cancel', dialogRoot).onclick = closeDialog;
  $('#extra-dish-form', dialogRoot).onsubmit = async event => {
    event.preventDefault();
    const data = new FormData(event.target);
    const ingredients = data.get('ingredients').split(/\r?\n/).map(item => item.trim()).filter(Boolean);
    currentTrip.extraShopping ??= {};
    currentTrip.extraShopping[recipeId] ??= [];
    ingredients.forEach(itemName => currentTrip.extraShopping[recipeId].push({ id: uid('extra'), name: itemName, checked: false }));
    recalc(currentTrip);
    await store.save();
    closeDialog();
    render();
  };
}

const priorShoppingAction = action;
action = async function shoppingAction(name, data = {}) {
  if (name === 'add-extra-dish') return openExtraDishDialog(data.recipeId);
  if (name === 'remove-shopping') {
    const currentTrip = trip();
    const index = Number(data.index);
    const entry = currentTrip?.shopping?.[index];
    if (!currentTrip || !entry) return;
    currentTrip.shoppingRemoved ??= [];
    const key = data.shoppingKey || entry.shoppingKey || `recipe:${entry.recipeId}:${entry.name}`;
    if (!currentTrip.shoppingRemoved.includes(key)) currentTrip.shoppingRemoved.push(key);
    currentTrip.shopping.splice(index, 1);
    await store.save();
    render();
    return;
  }
  return priorShoppingAction(name, data);
};

// A recipe's shopping rows are the editable, per-trip ingredient list. Once
// any of those rows changes, offer an explicit choice to preserve that
// variation as a new recipe or deliberately replace the original recipe.
renderShop = function(items) {
  const currentTrip = trip();
  const groups = (items || []).reduce((all, item, index) => {
    const id = item.recipeId || 'other';
    (all[id] ??= { id, name: item.recipeName || '其他採買', meal: item.meal || '', items: [] }).items.push({ ...item, index });
    return all;
  }, {});
  // Do not render an empty recipe heading. Removing every non-water shopping
  // row removes that recipe from this checklist without silently mutating the
  // saved recipe or the trip relation in a background render.
  if (!Object.keys(groups).length) return `<div class="section-head"><h2>採買清單</h2><span>0/0</span></div><p class="sub">尚未選擇料理。</p>`;
  const slotOptions = ['', '早餐', '午餐', '晚餐', '宵夜'];
  return `<div class="section-head"><h2>採買清單</h2><span>${done(items)}/${items.length}</span></div>${Object.values(groups).map(group => {
    const modified = !!currentTrip?.recipeModified?.[group.id];
    return `<section class="shopping-recipe"><div class="shopping-recipe-title"><select class="recipe-slot" data-recipe-slot="${esc(group.id)}" aria-label="${esc(group.name)}的用餐時段">${slotOptions.map(slot => `<option value="${slot}" ${group.meal === slot ? 'selected' : ''}>${slot || '未設定'}</option>`).join('')}</select><strong>${esc(group.name)}</strong><em>${done(group.items)}/${group.items.length}</em></div><div class="list">${group.items.map(item => `<div class="item shopping-item ${item.checked ? 'checked' : ''}"><input type="checkbox" data-shop="${item.index}" ${item.checked ? 'checked' : ''}><span class="item-name">${esc(item.name)}</span><button type="button" class="shopping-remove" data-action="remove-shopping" data-index="${item.index}" data-shopping-key="${esc(item.shoppingKey || `recipe:${item.recipeId}:${item.name}`)}" aria-label="移除 ${esc(item.name)}">×</button></div>`).join('')}</div><div class="actions shopping-recipe-actions"><button type="button" class="ghost add-extra-dish" data-action="add-extra-dish" data-recipe-id="${esc(group.id)}">額外加菜</button>${modified ? `<button type="button" class="ghost" data-action="save-modified-recipe" data-recipe-id="${esc(group.id)}">另存料理</button><button type="button" class="ghost" data-action="replace-modified-recipe" data-recipe-id="${esc(group.id)}">取代料理</button>` : ''}</div></section>`;
  }).join('')}`;
};

// Water is calculated from the current trip, while manual additions/removals
// live on the trip record so they remain stable across devices and rebuilds.
const normalizeDrinkingWater = value => String(value || '').trim().replace(/熱水\s*/g, '飲用水');
const waterAmount = value => {
  const match = normalizeDrinkingWater(value).match(/^飲用水\s*(\d+(?:\.\d+)?)\s*ml$/i);
  return match ? Math.round(Number(match[1])) : 0;
};
const waterDays = tripData => {
  if (tripData?.duration === 'day') return 1;
  if (tripData?.duration === 'overnight') return 2;
  const start = Date.parse(tripData?.date || ''), end = Date.parse(tripData?.endDate || '');
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? Math.round((end - start) / 86400000) + 1 : 2;
};
const waterRequirements = tripData => {
  // v8 water controls are normal child checklist rows. Unlike the former
  // trip-wide object, a click here has its own revision and cannot overwrite
  // another water row (or be overwritten by one arriving from another device).
  const overrides = tripData?.waterOverrides || {};
  const legacyRemoved = new Set(overrides.removed || []), legacyChecked = new Set(overrides.checked || []);
  const controls = new Map((tripData?.waterRows || []).filter(row => row.lifecycle === 'active').map(row => [row.waterKey, row]));
  const days = waterDays(tripData), rows = [{ key: 'drinking', name: '日常飲用水', ml: days * 2000, reason: `每人 ${days} 天飲用` }];
  for (const [index, row] of (tripData?.shopping || []).entries()) {
    const ml = waterAmount(row.name); if (!ml) continue;
    // A recipe can contain two visually identical water ingredients (for
    // example one original and one from 額外加菜). The shopping row UUID,
    // not recipe ID + amount, is the stable identity for its checklist row.
    const sourceId = row.syncId || row.shoppingRowId || row.shoppingKey || `legacy:${row.recipeId || ''}:${row.name || ''}:${index}`;
    const legacyKey = `recipe:${row.recipeId || ''}:${ml}`;
    rows.push({ key: `recipe-row:${sourceId}`, legacyKey, sourceShoppingId: row.syncId || null, name: '料理飲用水', ml, reason: row.recipeName || '料理所需', checked: !!row.checked });
  }
  if (tripData?.campType === 'wild') {
    rows.push({ key: 'wild-handwash', name: '洗手用水', ml: 1000, reason: '野營無固定洗手設施' });
    rows.push({ key: 'wild-dishes', name: '洗碗用水', ml: 2000, reason: '野營清洗餐具' });
  }
  // Keep historic v7 additions visible until the user changes them; new
  // additions are individual shopping/water child entities below.
  for (const row of overrides.added || []) {
    const key = `manual:${row.id}`;
    if (!controls.get(key)?.manual) rows.push({ key, name: row.name || '自訂飲用水', ml: Number(row.ml) || 0, reason: '手動新增' });
  }
  for (const row of controls.values()) {
    if (row.manual) rows.push({ key: row.waterKey, name: row.name || '自訂飲用水', ml: Number(row.ml) || 0, reason: row.reason || '手動新增' });
  }
  return rows.map(row => {
    const control = controls.get(row.key) || controls.get(row.legacyKey);
    const fallbackChecked = row.sourceShoppingId ? !!row.checked : (legacyChecked.has(row.key) || legacyChecked.has(row.legacyKey));
    return {...row, checked: control?.checked ?? fallbackChecked, removed: !!control?.removed || legacyRemoved.has(row.key) || legacyRemoved.has(row.legacyKey)};
  }).filter(row => row.ml > 0 && !row.removed);
};
const renderWaterPlan = tripData => {
  const rows = waterRequirements(tripData), total = rows.reduce((sum, row) => sum + row.ml, 0);
  return `<section class="water-plan"><div class="section-head"><h2>建議攜帶飲用水</h2><span>${total} ml</span></div><p class="sub">包含日常飲食與每道料理所需；野營另計洗手、洗碗用水。</p><div class="list">${rows.map(row => `<div class="item water-row"><span style="flex:1"><span class="item-name">${esc(row.name)} ${row.ml}ml</span><span class="reason">${esc(row.reason)}</span></span><button type="button" class="shopping-remove" data-action="remove-water" data-water-key="${esc(row.key)}" aria-label="移除 ${esc(row.name)}">×</button></div>`).join('')}</div><div class="actions water-actions"><button type="button" class="ghost" data-action="add-water">新增用水</button></div></section>`;
};

// Keep every recipe's three actions in a single, fixed-height row and make
// water naming consistent without mutating render-time state.
renderShop = function renderShopWithWaterPlan(items) {
  const currentTrip = trip(), groups = (items || []).reduce((all, item, index) => {
    const id = item.recipeId || 'other';
    (all[id] ??= { id, name: item.recipeName || '其他料理', meal: item.meal || '', items: [] }).items.push({ ...item, name: normalizeDrinkingWater(item.name), index });
    return all;
  }, {});
  // Empty recipe groups stay absent from the rendered checklist.
  const slotOptions = ['', '早餐', '午餐', '晚餐', '宵夜'];
  const content = Object.values(groups).map(group => {
    const modified = !!currentTrip?.recipeModified?.[group.id];
    const shown = group.items.filter((item, index, source) => !waterAmount(item.name) || source.findIndex(other => waterAmount(other.name) === waterAmount(item.name)) === index);
    return `<section class="shopping-recipe"><div class="shopping-recipe-title"><select class="recipe-slot" data-recipe-slot="${esc(group.id)}" aria-label="${esc(group.name)}的用餐時段">${slotOptions.map(slot => `<option value="${slot}" ${group.meal === slot ? 'selected' : ''}>${slot || '未設定'}</option>`).join('')}</select><strong>${esc(group.name)}</strong><em>${done(shown)}/${shown.length}</em></div><div class="list">${shown.map(item => `<div class="item shopping-item ${item.checked ? 'checked' : ''}"><input type="checkbox" data-shop="${item.index}" ${item.checked ? 'checked' : ''}><span class="item-name">${esc(item.name)}</span><button type="button" class="shopping-remove" data-action="remove-shopping" data-index="${item.index}" data-shopping-key="${esc(item.shoppingKey || `recipe:${item.recipeId}:${item.name}`)}" aria-label="移除 ${esc(item.name)}">×</button></div>`).join('')}</div><div class="actions shopping-recipe-actions"><button type="button" class="ghost add-extra-dish" data-action="add-extra-dish" data-recipe-id="${esc(group.id)}">額外加菜</button>${modified ? `<button type="button" class="ghost" data-action="save-modified-recipe" data-recipe-id="${esc(group.id)}">另存料理</button><button type="button" class="ghost" data-action="replace-modified-recipe" data-recipe-id="${esc(group.id)}">取代料理</button>` : ''}</div></section>`;
  }).join('');
  return `<div class="section-head"><h2>採買清單</h2><span>${done(items || [])}/${(items || []).length}</span></div>${content || '<p class="sub">尚未選擇料理。</p>'}${renderWaterPlan(currentTrip)}`;
};

function plannedWaterRows(tripData) {
  return waterRequirements(tripData);
}
function shoppingProgressRows(tripData) {
  const ingredients = (tripData?.shopping || []).filter(row => !waterAmount(row.name));
  return [...ingredients, ...plannedWaterRows(tripData)];
}
function renderWaterPlanWithChecks(tripData) {
  const rows = plannedWaterRows(tripData), total = rows.reduce((sum, row) => sum + row.ml, 0);
  return `<section class="water-plan"><div class="section-head"><h2>建議攜帶飲用水</h2><span>${done(rows)}/${rows.length} · ${total} ml</span></div><p class="sub">包含日常飲食與每道料理所需；野營另計洗手、洗碗用水。</p><div class="list">${rows.map(row => `<label class="item water-row ${row.checked ? 'checked' : ''}"><input type="checkbox" data-water-check="${esc(row.key)}" data-water-source="${esc(row.sourceShoppingId || '')}" ${row.checked ? 'checked' : ''}><span style="flex:1"><span class="item-name">${esc(row.name)} ${row.ml}ml</span><span class="reason">${esc(row.reason)}</span></span><button type="button" class="shopping-remove" data-action="remove-water" data-water-key="${esc(row.key)}" data-water-source="${esc(row.sourceShoppingId || '')}" aria-label="移除 ${esc(row.name)}">×</button></label>`).join('')}</div><div class="actions water-actions"><button type="button" class="ghost" data-action="add-water">新增用水</button></div></section>`;
}

renderShop = function renderShopWithWaterChecks(items) {
  const currentTrip = trip(), groups = (items || []).reduce((all, item, index) => {
    if (waterAmount(item.name)) return all;
    const id = item.recipeId || 'other';
    (all[id] ??= { id, syncId: item.recipeSyncId || '', name: item.recipeName || '其他料理', meal: item.meal || '', items: [] }).items.push({ ...item, index });
    return all;
  }, {});
  // Empty recipe groups stay absent from the rendered checklist.
  const slotOptions = ['', '早餐', '午餐', '晚餐', '宵夜'], progress = shoppingProgressRows(currentTrip);
  const content = Object.values(groups).map(group => {
    const modified = !!currentTrip?.recipeModified?.[group.id];
    return `<section class="shopping-recipe"><div class="shopping-recipe-title"><select class="recipe-slot" data-recipe-slot="${esc(group.id)}" aria-label="${esc(group.name)}的用餐時段">${slotOptions.map(slot => `<option value="${slot}" ${group.meal === slot ? 'selected' : ''}>${slot || '未設定'}</option>`).join('')}</select><strong>${esc(group.name)}</strong><em>${done(group.items)}/${group.items.length}</em></div><div class="list">${group.items.map(item => `<div class="item shopping-item ${item.checked ? 'checked' : ''}"><input type="checkbox" data-shop="${item.index}" ${item.checked ? 'checked' : ''}><span class="item-name">${esc(item.name)}</span><button type="button" class="shopping-remove" data-action="remove-shopping" data-index="${item.index}" data-shopping-key="${esc(item.shoppingKey || `recipe:${item.recipeId}:${item.name}`)}" aria-label="移除 ${esc(item.name)}">×</button></div>`).join('')}</div><div class="actions shopping-recipe-actions"><button type="button" class="ghost add-extra-dish" data-action="add-extra-dish" data-recipe-id="${esc(group.id)}">額外加菜</button>${modified ? `<button type="button" class="ghost" data-action="save-modified-recipe" data-recipe-id="${esc(group.id)}">另存料理</button><button type="button" class="ghost" data-action="replace-modified-recipe" data-recipe-id="${esc(group.id)}">取代料理</button>` : ''}${group.syncId ? `<button type="button" class="ghost danger" data-action="remove-recipe-from-trip" data-recipe-sync-id="${esc(group.syncId)}">移除料理</button>` : ''}</div></section>`;
  }).join('');
  return `<div class="section-head"><h2>採買清單</h2><span>${done(progress)}/${progress.length}</span></div><div class="actions shopping-list-actions"><button type="button" class="ghost" data-action="add-recipe-to-trip">加入料理</button></div>${content || '<p class="sub">尚未選擇料理。</p>'}${renderWaterPlanWithChecks(currentTrip)}`;
};

const levelPresetFallbacks = {
  L1: ['F04', 'F06', 'F02', 'C01', 'C07', 'T02', 'T04', 'L05', 'L06', 'X01'],
  L2: ['F03', 'F04', 'F06', 'F01', 'C01', 'C07', 'T01', 'T02', 'T04', 'L05', 'L06', 'X01'],
  L3: ['F03', 'F04', 'F06', 'F01', 'C01', 'C07', 'T01', 'T02', 'T04', 'L05', 'L06', 'X01'],
  L4: ['F03', 'F04', 'F06', 'F01', 'C01', 'C07', 'T01', 'T02', 'T04', 'L05', 'L06', 'X01', 'F05', 'T05', 'T06', 'T07']
};

function levelDefaultGear(level) {
  return state.levelDefaults?.[level] || levelPresetFallbacks[level] || [];
}

function openLevelDefaultsDialog() {
  let selectedLevel = 'L1';
  const dialogRoot = dialog(`<h2>量級預設裝備</h2><div class="gear-filter"><label for="level-default-select">量級</label><select id="level-default-select">${Object.entries(levelText).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select></div><p class="sub">勾選此量級建立行程時自動帶入的裝備。</p><div id="level-default-list" class="list"></div><div class="actions"><button type="button" class="primary" id="save-level-defaults">儲存預設</button><button type="button" class="secondary" id="cancel">取消</button></div>`);
  const list = $('#level-default-list', dialogRoot);
  const draw = () => {
    const selected = new Set(levelDefaultGear(selectedLevel));
    list.innerHTML = [...state.gear]
      .sort((left, right) => left.category.localeCompare(right.category, 'zh-Hant') || left.name.localeCompare(right.name, 'zh-Hant'))
      .map(gear => `<label class="item"><input type="checkbox" name="level-default" value="${esc(gear.id)}" ${selected.has(gear.id) ? 'checked' : ''}><span><span class="item-name">${esc(gear.name)}</span><span class="reason">${esc(gear.category)}</span></span></label>`)
      .join('');
  };
  $('#level-default-select', dialogRoot).onchange = event => { selectedLevel = event.target.value; draw(); };
  $('#cancel', dialogRoot).onclick = closeDialog;
  $('#save-level-defaults', dialogRoot).onclick = async () => {
    state.levelDefaults ??= {};
    state.levelDefaults[selectedLevel] = $$('input[name="level-default"]:checked', list).map(input => input.value);
    state.trips.forEach(recalc);
    await store.save();
    closeDialog();
    render();
  };
  draw();
}

const previousLevelPresetAction = action;
action = async function levelPresetAction(name, data = {}) {
  if (name === 'manage-level-defaults') return openLevelDefaultsDialog();
  return previousLevelPresetAction(name, data);
};

/* Mobile offline card: the phone reads the original PNG card and only sends
   checklist state back. It cannot alter itinerary, gear, or recipes. */

async function readOfflineCardSnapshot(file) {
  if (file.type !== 'image/png' && !/\.png$/i.test(file.name)) {
    throw new Error('請選擇手機離線卡匯出的原始 PNG 行程卡。');
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const chunk = readPngChunk(bytes, 'caMp');
  if (!chunk) throw new Error('這張 PNG 沒有可還原的行程資料。請選擇原始檔。');
  const metadata = JSON.parse(new TextDecoder().decode(chunk));
  if (metadata.format !== 'camp-card.v1' || metadata.compression !== 'gzip' || !metadata.payload) {
    throw new Error('不支援這張行程卡的資料格式。');
  }
  const json = await ungzip(unbase64(metadata.payload));
  if (metadata.sha256 && await digest(json) !== metadata.sha256) throw new Error('行程卡完整性檢查失敗。');
  const snapshot = JSON.parse(json);
  const source = snapshot?.trip;
  if (snapshot.format !== 'camp-card.v1' || !source?.id) throw new Error('行程卡內容不完整。');
  return snapshot;
}

async function mergeOfflineCardChecks(snapshot) {
  const source = snapshot.trip;
  const currentTrip = state.trips.find(entry => entry.id === source.id)
    || state.trips.find(entry => entry.code === source.code);
  if (!currentTrip) throw new Error('找不到對應行程；請先匯入原本的行程卡片。');

  const packChecks = new Map((source.items || []).map(entry => [entry.gearId, !!entry.checked]));
  const shoppingChecks = new Map((source.shopping || []).map((entry, index) => [entry.shoppingKey || `legacy:${entry.recipeId || ''}:${entry.name}:${index}`, !!entry.checked]));
  let changed = 0;
  (currentTrip.items || []).forEach(entry => {
    if (!packChecks.has(entry.gearId)) return;
    const checked = !!packChecks.get(entry.gearId);
    if (entry.checked !== checked) { entry.checked = checked; changed++; }
  });
  const shopping = currentTrip.shopping || [];
  shopping.forEach((entry, index) => {
    const id = entry.shoppingKey || `legacy:${entry.recipeId || ''}:${entry.name}:${index}`;
    if (!shoppingChecks.has(id)) return;
    const checked = !!shoppingChecks.get(id);
    if (entry.checked !== checked) { entry.checked = checked; changed++; }
  });
  currentTrip.updatedAt = now();
  await store.save();
  notify(changed ? `已從行程卡 PNG 同步 ${changed} 個勾選狀態。` : '勾選狀態沒有變更。');
  render();
}

async function importMobileCheckin(file) {
  return mergeOfflineCardChecks(await readOfflineCardSnapshot(file));
}

chooseTripCard = function chooseUnifiedTripCard() {
  const input = $('#file-input');
  input.accept = 'image/png,.png';
  input.value = '';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const snapshot = await readOfflineCardSnapshot(file);
      const source = snapshot.trip;
      const existing = state.trips.some(entry => entry.id === source.id || entry.code === source.code);
      if (existing) await mergeOfflineCardChecks(snapshot);
      else {
        await importCard(file);
        notify('已匯入新的行程卡片，可直接編輯。');
        render();
      }
    } catch (error) {
      console.error(error);
      notify(`匯入行程卡失敗：${error.message}`, 'error');
    }
  };
  input.click();
}

const mobileCardAction = action;
action = async function mobileCardActionHandler(name, data = {}) {
  if (name === 'remove-from-trip') {
    const current = trip();
    const row = current?.items?.find(item => item.gearId === data.id);
    if (!current || !row) return;
    await commitMutation(async () => {
      state.recycleBin ??= [];
      state.recycleBin.unshift({ syncId: `recycle:tripRows:${row.syncId}`, collection: 'tripRows', entity: { tripSyncId: current.syncId, field: 'items', row: structuredClone(row) }, deletedAt: now() });
      current.items = current.items.filter(item => item.syncId !== row.syncId);
      current.overrides ??= { added: [], removed: [] };
      if (!current.overrides.removed.includes(row.gearId)) current.overrides.removed.push(row.gearId);
      current.overrides.added = current.overrides.added.filter(item => item.gearId !== row.gearId);
    });
    return render();
  }
  return mobileCardAction(name, data);
};

const mobileCardRender = render;
render = function renderWithMobileCardControls() {
  mobileCardRender();
  document.querySelectorAll('button.card[data-action="open-trip"]').forEach(card => {
    if (card.querySelector('.home-shopping-progress')) return;
    const tripData = state.trips.find(entry => entry.id === card.dataset.id), rows = shoppingProgressRows(tripData);
    const packingProgress = card.querySelector('.progress');
    if (!packingProgress) return;
    packingProgress.insertAdjacentHTML('afterend', `<p class="home-progress-label home-shopping-progress">採買清單 · 已採買 ${done(rows)} / ${rows.length}</p><div class="progress home-shopping-progress"><span style="width:${pct(rows)}%"></span></div>`);
  });
};

renderLists = function renderListsWithWaterProgress() {
  const currentTrip = trip();
  if (!currentTrip) return noTrip();
  const packGroups = groupItems(currentTrip.items), shoppingRows = shoppingProgressRows(currentTrip);
  return `<section class="page"><p class="eyebrow">行程清單 · ${currentTrip.code}</p><h2 class="title">${esc(currentTrip.name)}</h2><p class="trip-context">${currentTrip.date}　${esc(currentTrip.location || '未填地點')}<br>${currentTrip.duration === 'overnight' ? '2 日 1 夜' : '日歸'} · ${levelText[currentTrip.level]}　｜　目的：${esc(cardPurpose(currentTrip))}</p><div class="split"><button class="${listTab === 'pack' ? 'primary' : 'secondary'}" data-listtab="pack">帶什麼 ${done(currentTrip.items)}/${currentTrip.items.length}</button><button class="${listTab === 'shop' ? 'primary' : 'secondary'}" data-listtab="shop">買什麼 ${done(shoppingRows)}/${shoppingRows.length}</button></div><div id="list-body">${listTab === 'pack' ? renderPack(packGroups) : renderShop(currentTrip.shopping)}</div></section>`;
};

// Recalculation is a projection, never a new identity generator. Preserve
// existing shopping-row IDs (and their checked state) by stable source key.
const v6BuildShopping = buildShopping;
buildShopping = function buildShoppingWithStableRows(tripData) {
  const previous = new Map();
  (tripData.shopping || []).forEach(row => { const key = row.shoppingKey || `${row.recipeId || ''}:${row.name || ''}`; (previous.get(key) || previous.set(key, []).get(key)).push(row); });
  return v6BuildShopping(tripData).map((row, index) => {
    const key = row.shoppingKey || `${row.recipeId || ''}:${row.name || ''}`;
    const prior = previous.get(key)?.shift();
    const syncId = prior?.syncId || `legacy:shopping:${tripData.syncId || tripData.id}:${key}:${index}`;
    return { ...row, checked: prior?.checked ?? row.checked, syncId, shoppingRowId: syncId };
  });
};

// Intercept the legacy gear dialog's destructive handler.  It is loaded
// before the sync adapter, so this capture listener deliberately resolves the
// current entity at click time and routes deletion through the v6 transaction.
document.addEventListener('click', async event => {
  const button = event.target.closest?.('#delete-gear');
  if (!button) return;
  event.preventDefault(); event.stopImmediatePropagation();
  const box = button.closest('.dialog');
  const displayId = box?.querySelector('#auto-id')?.textContent?.trim() || box?.querySelector('[name="id"]')?.value;
  const entity = state.gear.find(item => item.id === displayId);
  if (!entity || !confirm('刪除這件裝備？')) return;
  await commitMutation(async () => { recycleEntity('gear', entity); state.gear = state.gear.filter(item => item.syncId !== entity.syncId); });
  closeDialog(); render();
}, true);

/* Classic-script bridge: these names belong to the existing UI, not the sync engine. */
globalThis.CampLegacy = {
  document,
  get state(){return state;},set state(value){state=value;},
  render(){render();},closeDialog(){closeDialog();},dialog(html){return dialog(html);},
  notify(message,kind){notify(message,kind);},download(blob,name){download(blob,name);},
  suggestPacking(t){return buildTripItems(t);},
  readCard(file){return readOfflineCardSnapshot(file);},
  setAction(fn){action=fn;},
  forbidSave(fn){store.save=fn;globalThis.commitMutation=fn;},
  defaults(){return structuredClone(baseState());},
  open(name,...args){
    const functions={trip:tripDialog,gear:gearDialog,recipe:recipeDialog,locations:locationDialog,
      presets:openLevelDefaultsDialog,manual:addToTripDialog,archive:archiveDialog,
      settings:openSettingsDialog,extra:openExtraDishDialog,exportCard};
    if(!functions[name])throw new Error('未知畫面：'+name);
    return functions[name](...args);
  }
};
// Opening the document is presentation only. The v8 boot process owns loading/migration.
state={...baseState(),gear:[],recipes:[],locations:[],page:'home'};
homeOpened=true;
window.__campInitialViewSet=true;
render();
