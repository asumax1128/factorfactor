'use strict';
const returnPages=new Set(['home','solo','battle','daily','learn','rankings','ranking-solo','ranking-daily','ranking-rating']);
function active(page){return page.startsWith('ranking')?'rank':({battle:'online',profile:'account'})[page]||page;}
function target(key){return ({online:'battle',rank:'rankings',boss:'raidw',help:'solo'})[key]||key;}
function back(argument){return returnPages.has(argument?.from)?{page:argument.from,arg:argument.fromArg||null}:{page:'home',arg:null};}
module.exports={active,target,back};
