import {encodeSave,decodeSave} from './save-codec.mjs';
const KEY = 'save:tower:main';
let sdk = null;
let readSafe = false;
let unavailableReason = '';
let loaded = null;
let initPromise;
function describe(err) {
  if (window.GameSDK?.isPlatformSDKError?.(err)) {
    if (err.code === 'STORAGE_REQUIRE_LOGIN') return '登录后才能使用云存档。';
    if (err.code === 'STORAGE_READ_UNAVAILABLE') return '暂时无法读取云存档，请稍后重试。';
    if (err.code === 'STORAGE_WRITE_LOCK_HELD') return '请返回已打开游戏的页面继续游玩。';
    if (err.code === 'STORAGE_WRITE_GENERATION_STALE') return '存档已切换，请刷新页面。';
    if (err.code === 'STORAGE_VALUE_TOO_LARGE' || err.code === 'STORAGE_QUOTA_EXCEEDED') return '存档空间不足，当前进度仍在游戏中。';
    if (err.code === 'STORAGE_RATE_LIMITED') return '保存操作太频繁，请稍后再试。';
  }
  return '云存档暂不可用，当前进度仍在游戏中。';
}

export function initializeSave() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (window.parent === window || !window.GameSDK?.init) return { status:'unavailable', message:'当前为本机预览，云存档不可用。' };
    try {
      sdk = await window.GameSDK.init();
      const result = await sdk.storage.get({key:KEY});
      readSafe = true;
      if (result.value !== null) {
        try { loaded = decodeSave(result.value); } catch { readSafe = false; unavailableReason = '存档格式无法识别，已保护原有存档。'; return {status:'error',message:unavailableReason}; }
      }
      return {status:loaded ? 'found' : 'empty',state:loaded};
    } catch(err) {
      unavailableReason = describe(err); readSafe = false;
      return {status:'error',message:unavailableReason};
    }
  })();
  return initPromise;
}
export async function saveGame(state) {
  if (!sdk) return {ok:false,message:'当前未连接云存档，进度保留在本次游戏中。'};
  if (!readSafe) return {ok:false,message:unavailableReason || '尚未确认云端存档，暂不覆盖。'};
  try {
    const res = await sdk.storage.set({key:KEY,value:encodeSave(state),saveMeta:{label:'暮塔之主',progress:`第 ${state.day} 日`,gameVersion:'1.0.0'}});
    if (res.outcome === 'superseded') return {ok:false,message:'本次保存已被更新的操作替代，请查看同步状态。'};
    return {ok:true,message:res.outcome === 'pending' ? '进度已暂存，等待同步。' : '进度已保存。'};
  } catch(err) { return {ok:false,message:describe(err)}; }
}
