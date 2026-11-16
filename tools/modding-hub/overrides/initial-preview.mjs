// Actual engine output only. No approximated common baseline is presented as a result.
export function initialPreview(character={},overrides={},rules={}){
 const runtime=character._runtime;
 if(runtime)return {attributes:{...character,...runtime.values},status:{...runtime.values,...runtime.rates,psy_status:runtime.strings.psy_status},skills:runtime.values,trace:{},caption:'현재 WORK · 선택한 주인공·난이도·영입 경로의 QSP 계산값'};
 const attributes=character._runtimeRequired?{}:{...character,beauty:character.beauty??character.base_beauty,exotic:character.exotic??character.base_exotic};
 return {attributes,status:character._runtimeRequired?{}:overrides,skills:{},trace:{},caption:character._runtimeRequired?'QSP 초기값 계산 전':'JSON 지정값 · QSP 보정 계산 전'};
}
