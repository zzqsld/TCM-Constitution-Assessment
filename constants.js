// constants.js
// Shared constants & lightweight helpers (labels, thresholds, RNG, sampling).
(function(){
  const OPTION_LABELS = {1:'没有',2:'很少',3:'有些',4:'经常',5:'总是'};
  const SECRET_SEQUENCE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowLeft','ArrowRight','ArrowRight','b','a','b','a'];
  const CLASSIFICATION_THRESHOLDS = {
    pingheMain: 60,
    main: 40,
    tendencyMin: 30
  };
  const STRENGTH_LEVELS = [
    { min: 60, text: '关注', cls: 'strength-label strength-strong' },
    { min: 40, text: '建议', cls: 'strength-label strength-normal' },
    { min: 30, text: '适当注意', cls: 'strength-label strength-light' }
  ];

  function shuffle(arr){
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
  }
  function pickSome(list, min, max){
    if(!Array.isArray(list) || !list.length) return [];
    if(list.length <= min) return list.slice();
    const n = Math.min(max, list.length);
    const pool = list.slice();
    shuffle(pool);
    return pool.slice(0,n);
  }
  function mulberry32(seed){
    let t = seed >>> 0;
    return function(){
      t += 0x6D2B79F5;
      let r = t;
      r = Math.imul(r ^ r >>> 15, r | 1);
      r ^= r + Math.imul(r ^ r >>> 7, r | 61);
      return ((r ^ r >>> 14) >>> 0) / 4294967296;
    };
  }

  window.CONST = {
    OPTION_LABELS,
    SECRET_SEQUENCE,
    CLASSIFICATION_THRESHOLDS,
    STRENGTH_LEVELS,
    shuffle,
    pickSome,
    mulberry32
  };
})();