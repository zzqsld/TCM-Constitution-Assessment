// questions.js
// Questionnaire source data.
// For pinghe: items tagged with reverse=true are scored inversely (5->1).
// Gender-specific filtering is applied externally (see app.js getFilteredQuestions).

const CONSTITUTIONS = [
  {
    key: 'yangxu',
    name: '阳虚体质',
    questions: [
      { text: '您手脚发凉吗' },
      { text: '您胃脘部、背部或腰膝部怕冷吗' },
      { text: '您感到怕冷、衣服比别人穿得多吗' },
      { text: '您比一般人耐受不了寒冷（冬天的寒冷夏天的冷空调电扇等）吗' },
      { text: '您比别人容易患感冒吗' },
      { text: '您吃（喝）凉的东西会感到不舒服或者怕吃（喝）凉东西吗' },
      { text: '您受凉或吃（喝）凉的东西后容易腹泻（拉肚子）吗' }
    ]
  },
  {
    key: 'yinxu',
    name: '阴虚体质',
    questions: [
      { text: '您感到手脚心发热吗' },
      { text: '您感觉身体、脸上发热吗' },
      { text: '您皮肤或口唇干吗' },
      { text: '您口唇的颜色比一般人红吗' },
      { text: '您容易便秘或大便干燥吗' },
      { text: '您面部两颧潮红或偏红吗' },
      { text: '您感到眼睛干涩吗' },
      { text: '您感到口干咽燥、总想喝水吗' }
    ]
  },
  {
    key: 'qixu',
    name: '气虚体质',
    questions: [
      { text: '您容易疲乏吗' },
      { text: '您容易气短（呼吸短促、接不上气）吗' },
      { text: '您容易心慌吗' },
      { text: '您容易头晕或站起时晕眩吗' },
      { text: '您比别人容易患感冒吗' },
      { text: '您喜欢安静、懒得说话吗' },
      { text: '您说话声音低弱无力吗' },
      { text: '您活动量稍大就容易出虚汗吗' }
    ]
  },
  {
    key: 'tanshi',
    name: '痰湿体质',
    questions: [
      { text: '您感到胸闷或腹部胀满吗' },
      { text: '您感到身体沉重不轻松或不爽快吗' },
      { text: '您腹部肥满松软吗' },
      { text: '您有额部油脂分泌多的现象吗' },
      { text: '您上眼睑比别人肿（上眼睑有轻微隆起的现象）吗' },
      { text: '您嘴里有黏黏的感觉吗' },
      { text: '您平时痰多，特别是咽喉部总感到有痰堵着吗' },
      { text: '您舌苔厚腻或有舌苔厚厚的感觉' }
    ]
  },
  {
    key: 'shire',
    name: '湿热体质',
    questions: [
      { text: '面部或鼻部有油腻感或者油亮发光吗' },
      { text: '您容易生痤疮或疮疖吗' },
      { text: '您感到口苦或嘴里有异味吗' },
      { text: '您大便黏滞不爽、有解不尽的感觉吗' },
      { text: '您小便时尿道有发热感、尿色浓（深）吗' },
      { text: '您带下色黄（白带颜色发黄）？（限女性回答）' },
      { text: '您的阴囊部位潮湿吗？（限男性回答）' }
    ]
  },
  {
    key: 'xueyu',
    name: '瘀血体质',
    questions: [
      { text: '您的皮肤在不知不觉中会出现青紫瘀斑（皮下出血）吗' },
      { text: '您两颧部有细微红丝吗' },
      { text: '您身体上有哪里疼痛吗' },
      { text: '您面色晦暗或容易出现褐斑吗' },
      { text: '您容易有黑眼圈吗' },
      { text: '您容易忘事（健忘）吗' },
      { text: '您口唇颜色偏暗吗' }
    ]
  },
  {
    key: 'qiyu',
    name: '气郁体质',
    questions: [
      { text: '您感到闷闷不乐、情绪低沉吗' },
      { text: '您容易精神紧张、焦虑不安吗' },
      { text: '您多愁善感、感情脆弱吗' },
      { text: '您容易感到害怕或受到惊吓吗' },
      { text: '您胁肋部或乳房胀痛吗' },
      { text: '您无缘无故叹气吗' },
      { text: '您咽喉部有异物感、且吐之不出、咽之不下吗' }
    ]
  },
  {
    key: 'tebing',
    name: '特禀体质',
    questions: [
      { text: '您没有感冒时也会打喷嚏吗' },
      { text: '您没有感冒时也会鼻塞、流鼻涕吗' },
      { text: '您有因季节变化、温度变化或异味等原因而咳喘的现象吗' },
      { text: '您容易过敏（对药物、食物、气味、花粉或在季节交替、气候变化时）吗' },
      { text: '您的皮肤容易起荨麻疹（风团、风疹块、风疙瘩）吗' },
      { text: '您的皮肤因过敏出现过紫癜（紫红色、瘀点、瘀斑）吗' },
      { text: '您的皮肤一抓就红、并出现抓痕吗' }
    ]
  },
  {
    key: 'pinghe',
    name: '平和体质',
    questions: [
      { text: '您精力充沛吗', reverse: false },
      { text: '您容易疲乏吗', reverse: true },
      { text: '您说话声音低弱无力吗', reverse: true },
      { text: '您感到闷闷不乐、情绪低沉吗', reverse: true },
      { text: '您比一般人耐受不了寒冷（冬天的寒冷、夏天的冷空调、电扇等）吗', reverse: true },
      { text: '您能适应外界自然和社会环境的变化吗', reverse: false },
      { text: '您容易失眠吗', reverse: true },
      { text: '您容易忘事（健忘）吗', reverse: true }
    ]
  }
];

// 选项频率统一：1=没有 2=很少（有一点） 3=有些（有时） 4=经常（相当） 5=总是（非常）
const OPTION_VALUES = [1,2,3,4,5];

window.CONSTITUTIONS = CONSTITUTIONS;
window.OPTION_VALUES = OPTION_VALUES;
