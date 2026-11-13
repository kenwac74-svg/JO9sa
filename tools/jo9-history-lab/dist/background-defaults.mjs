import {validateBackgroundSettings} from './background-settings.mjs';
import {buildCoherentConnections,COHERENT_CONNECTIONS_VERSION,HARDSHIP_CONNECTION_JOBS} from './background-connections.mjs';
export const CONNECTION_DEFAULTS_VERSION=COHERENT_CONNECTIONS_VERSION;
export const HARDSHIP_JOBS=HARDSHIP_CONNECTION_JOBS;
const legacyVersion='20261111-v1';
const copy=value=>JSON.parse(JSON.stringify(value));
const own=(group,key)=>Object.hasOwn(group,key);

// Fill a new configuration once. Existing users opt into the complete revised
// graph by importing its reviewed backup, so personal settings are not erased.
export function applyBackgroundDefaults(config,catalogue){
 validateBackgroundSettings(config);
 const settings=config.backgroundSettings;
 if([CONNECTION_DEFAULTS_VERSION,legacyVersion].includes(settings.defaultConnectionsVersion))return false;
 const preset=buildCoherentConnections(catalogue),links=settings.links,originalRules=copy(links.occupationFamilies);
 for(const world of Object.keys(preset.worldFamilies)){
  for(const group of ['worldFamilies','worldOccupations']){
   const allowed=preset[group][world];
   links[group][world]=own(links[group],world)?links[group][world].filter(id=>allowed.includes(id)):[...allowed];
  }
  const baseline=['brigand','thug','thief'].map(job=>originalRules[world+':'+job]).find(rule=>rule&&(rule.required!==null||rule.rejected.length));
  for(const job of links.worldOccupations[world]){
   const key=world+':'+job;
   if(!own(links.occupationFamilies,key))links.occupationFamilies[key]=copy(baseline&&HARDSHIP_JOBS.includes(job)?baseline:preset.occupationFamilies[key]);
  }
 }
 for(const record of catalogue.records)if(record.suggestedAgeRule&&!own(settings.ageRules[record.kind],record.id))settings.ageRules[record.kind][record.id]=copy(record.suggestedAgeRule);
 settings.defaultConnectionsVersion=CONNECTION_DEFAULTS_VERSION;
 validateBackgroundSettings(config);return true;
}

export function backgroundConnectionDefault(config,catalogue,group,key){
 const value=buildCoherentConnections(catalogue)[group]?.[key];
 return value===undefined?undefined:copy(value);
}
